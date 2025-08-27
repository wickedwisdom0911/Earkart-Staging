import 'dart:async';
import 'dart:async' show unawaited;
import 'dart:collection';
import 'dart:convert';
import 'dart:typed_data';

import 'package:earkart_omni/config/utils/packet_format_interpreter.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.state.dart';
import 'package:earkart_omni/models/communication/acknowledgement.dart';
import 'package:earkart_omni/models/communication/audiometer_core_state.dart';
import 'package:earkart_omni/models/communication/enums.dart';
import 'package:earkart_omni/models/communication/impedance_data.dart';
import 'package:earkart_omni/models/communication/impedance_status.dart';
import 'package:earkart_omni/services/battery_service.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:usb_serial_kotlin/usb_serial_kotlin.dart';

class _Command {
  final Uint8List packet;
  final Completer<void> completer;
  Timer? timeoutTimer;
  _Command(this.packet, this.completer);
}

class CommunicationCubit extends Cubit<CommunicationState> {
  final PacketFormatInterpreter _packetInterpreter = PacketFormatInterpreter();
  UsbPort? _port;
  StreamSubscription<Uint8List>? _subscription;
  final _commandQueue = Queue<_Command>();
  bool _processing = false;
  // Removed single global command timeout in favor of per-command timers
  Timer? _syncRetryTimer;
  Timer? _tabletBatteryUpdateTimer;
  UsbDevice? _lastDevice;

  static const int MAX_CONSECUTIVE_ERRORS = 15;
  static const int MAX_RETRY_ATTEMPTS = 3;
  static const int RETRY_DELAY_MS = 500;
  static const int COMMAND_TIMEOUT_MS = 2000;
  static const int SYNC_RETRY_DELAY_MS = 3000; // 3 seconds
  int _errorCount = 0;

  CommunicationCubit() : super(const CommunicationState()) {
    // Start periodic tablet battery updates
    _startTabletBatteryUpdates();
  }

  Future<bool> initializePort(UsbDevice device) async {
    try {
      di<ILogger>().debug('Initializing port for device: ${device.deviceId}');
      emit(state.copyWith(connectionStatus: 'Initializing...', error: null));

      // Close existing port if any
      await _cleanupPort();

      _lastDevice = device;
      _port = await device.create();
      if (_port == null) {
        throw Exception('Failed to create port');
      }

      bool openResult = await _port!.open();
      if (!openResult) {
        throw Exception('Failed to open port');
      }

      await _configureFTDIDevice();
      _setupListener();

      di<ILogger>().info('Device initialized successfully');
      emit(
        state.copyWith(
          isConnected: true,
          connectionStatus: 'Connected',
          error: null,
        ),
      );

      // Automatically send sync packet after successful initialization
      await _sendSyncPacketIfNeeded();
      return true;
    } catch (e) {
      di<ILogger>().error('Port initialization error: $e');
      emit(
        state.copyWith(
          error: 'Port initialization error: $e',
          connectionStatus: 'Error',
        ),
      );
      await _cleanupPort();
      return false;
    }
  }

  Future<void> _cleanupPort() async {
    _subscription?.cancel();
    _subscription = null;
    if (_port != null) {
      try {
        await _port!.close();
      } catch (e) {
        di<ILogger>().error('Error closing port: $e');
      }
      _port = null;
    }
  }

  Future<void> _configureFTDIDevice() async {
    try {
      di<ILogger>().debug('Configuring FTDI device...');
      await Future.delayed(const Duration(milliseconds: 500));
      await _port!.setDTR(false);
      await Future.delayed(const Duration(milliseconds: 250));
      await _port!.setDTR(true);
      await Future.delayed(const Duration(milliseconds: 250));
      await _port!.setRTS(true);
      await Future.delayed(const Duration(milliseconds: 250));
      await _port!.setFlowControl(UsbPort.FLOW_CONTROL_OFF);
      await Future.delayed(const Duration(milliseconds: 100));
      await _port!.setPortParameters(
        921600,
        UsbPort.DATABITS_8,
        UsbPort.STOPBITS_1,
        UsbPort.PARITY_NONE,
      );
      await Future.delayed(const Duration(milliseconds: 500));
      di<ILogger>().debug('FTDI device configured successfully');
    } catch (e) {
      di<ILogger>().error('Device configuration error: $e');
      emit(state.copyWith(error: 'Device configuration error: $e'));
      rethrow;
    }
  }

  void _setupListener() {
    di<ILogger>().debug('Setting up USB listener...');
    _subscription?.cancel();
    _subscription = _port!.inputStream!.listen(
      (data) => unawaited(_handleIncomingData(data)),
      onError: _handleError,
      cancelOnError: false,
    );
    di<ILogger>().debug('USB listener setup complete');
  }

  void _handleError(dynamic error) {
    _errorCount++;
    di<ILogger>().error('Communication error: $error');

    if (_errorCount >= MAX_CONSECUTIVE_ERRORS) {
      di<ILogger>().error('Too many consecutive errors, resetting connection');
      _resetConnection();
    } else {
      emit(state.copyWith(error: 'Communication error: $error'));
    }
  }

  Future<void> _handleIncomingData(Uint8List data) async {
    if (data.isEmpty) return;

    try {
      di<ILogger>().debug('Received data: ${data.length} bytes');
      List<int>? processedPacket = _packetInterpreter.onListenerDataReady(data);
      if (processedPacket != null) {
        await _handleProcessedPacket(processedPacket);
      }
    } catch (e) {
      di<ILogger>().error('Data processing error: $e');
      emit(state.copyWith(error: 'Data processing error: $e'));
    }
  }

  Future<void> _handleProcessedPacket(List<int> packet) async {
    try {
      List<int>? payload = _packetInterpreter.extractPayload(packet);
      if (payload == null) return;

      String jsonString = String.fromCharCodes(
        payload,
      ).trim().replaceAll(RegExp(r'[\x00-\x1F\x7F-\x9F]'), '');

      di<ILogger>().debug('Processing packet: $jsonString');

      if (jsonString.contains("R15C")) {
        di<ILogger>().info('Device synced successfully');

        // Cancel sync retry timer since we're now synced
        _syncRetryTimer?.cancel();

        emit(
          state.copyWith(
            isSynced: true,
            connectionStatus: 'Synced',
            error: null,
            isInBeginMode: false,
          ),
        );

        // Automatically send query packet once synced
        _sendQueryPacketAfterSync();

        // Send device status packet after syncing
        await sendDeviceStatusPacket();
        return;
      }

      Map<String, dynamic> json = jsonDecode(jsonString);

      switch (json['PacketType']) {
        case 2: // Transducer Info
          di<ILogger>().debug('Received transducer info');
          final transducerResponse = TransducerResponse.fromJson(json);
          emit(
            state.copyWith(
              transducerResponse: transducerResponse,
              connectionStatus: 'Ready',
              error: null,
            ),
          );
          break;
        case 8: // Patient Response
          di<ILogger>().debug('Received patient response');
          final isReleased = json['PatientResponseEvent']['Released'];
          emit(state.copyWith(isReleased: isReleased, error: null));
          break;
        case 12: // Acknowledgement
          di<ILogger>().debug('Received acknowledgement');
          final acknowledgement = Acknowledgement.fromJson(json);
          if (acknowledgement.request?.name == "Begin") {
            di<ILogger>().debug('Device is in begin mode');
            emit(
              state.copyWith(
                isInBeginMode: true,
                connectionStatus: "begin",
                error: null,
              ),
            );
          }
          break;
        case 14: // Impedance Status
          di<ILogger>().debug('Received impedance status');
          final impedanceStatus = ImpedanceStatus.fromJson(json);
          emit(state.copyWith(impedanceStatus: impedanceStatus, error: null));
          break;
        case 15: // Impedance Data
          di<ILogger>().debug('Received impedance data');
          final impedanceData = ImpedanceData.fromJson(json);
          emit(
            state.copyWith(
              impedanceData: impedanceData,
              isNewImpedanceData: true,
              error: null,
            ),
          );
          // Reset the flag after emitting
          emit(state.copyWith(isNewImpedanceData: false));
          break;
        case 19: // Battery Status
          di<ILogger>().debug('Received battery status');
          final isCharging = json['Battery']['Powered'];
          final batteryLevel = json['Battery']['Level'];
          emit(
            state.copyWith(isCharging: isCharging, batteryLevel: batteryLevel),
          );
          break;
      }
    } catch (e) {
      di<ILogger>().error('Packet processing error: $e');
      if (!e.toString().contains('FormatException')) {
        emit(state.copyWith(error: 'Packet processing error: $e'));
      }
    }
  }

  Future<void> sendCommand(Uint8List packet) async {
    if (_port == null) {
      di<ILogger>().warning('Port not initialized; ignoring command');
      return;
    }

    return _withRetry(() async {
      final completer = Completer<void>();
      final command = _Command(packet, completer);
      _commandQueue.add(command);

      // Set per-command timeout that safely removes the command on expiry
      command.timeoutTimer = Timer(
        const Duration(milliseconds: COMMAND_TIMEOUT_MS),
        () {
          if (!completer.isCompleted) {
            di<ILogger>().warning('Command timeout occurred');
            completer.completeError('Command timeout');
            // Remove the timed-out command if still queued
            if (_commandQueue.isNotEmpty &&
                identical(_commandQueue.first, command)) {
              _commandQueue.removeFirst();
            } else {
              _commandQueue.remove(command);
            }
            _errorCount++;
            _handleError('Command timeout');
            _processing = false;
            // Attempt to continue processing remaining commands
            _processQueue();
          }
        },
      );

      _processQueue();
      return completer.future;
    });
  }

  Future<void> _processQueue() async {
    if (_processing || _commandQueue.isEmpty) return;
    _processing = true;

    while (_commandQueue.isNotEmpty) {
      final command = _commandQueue.first;
      try {
        await _port!.write(command.packet);
        await Future.delayed(const Duration(milliseconds: 50));
        if (!command.completer.isCompleted) {
          command.completer.complete();
        }
        // Cancel timeout for this command
        command.timeoutTimer?.cancel();
        _commandQueue.removeFirst();
        _errorCount = 0; // Reset error count on successful command
      } catch (e) {
        di<ILogger>().error('Error sending command: $e');
        if (!command.completer.isCompleted) {
          command.completer.completeError(e);
        }
        command.timeoutTimer?.cancel();
        _handleError(e);
        break;
      }
    }

    _processing = false;
  }

  Future<void> sendSyncPacket() async {
    di<ILogger>().debug('Sending sync packet');
    final packet = _packetInterpreter.sendSerialNumberQuery();
    await sendCommand(packet);
  }

  /// Automatically sends sync packet if device is not synced
  Future<void> _sendSyncPacketIfNeeded() async {
    if (!state.isSynced && state.isConnected) {
      di<ILogger>().debug(
        'Device not synced, sending sync packet automatically',
      );
      await sendSyncPacket();

      // Set up retry timer if still not synced after delay
      _syncRetryTimer?.cancel();
      _syncRetryTimer = Timer(
        const Duration(milliseconds: SYNC_RETRY_DELAY_MS),
        () {
          if (!state.isSynced && state.isConnected && !isClosed) {
            di<ILogger>().debug(
              'Sync retry: device still not synced, retrying...',
            );
            _sendSyncPacketIfNeeded();
          }
        },
      );
    }
  }

  /// Public method to trigger sync packet if needed
  Future<void> triggerSyncIfNeeded() async {
    await _sendSyncPacketIfNeeded();
  }

  /// Start the sync process for connected device
  Future<void> startSyncProcess() async {
    if (state.isConnected && !state.isSynced) {
      di<ILogger>().info('Starting sync process for connected device');
      await _sendSyncPacketIfNeeded();
    } else if (!state.isConnected) {
      di<ILogger>().warning('Cannot start sync process: device not connected');
    } else if (state.isSynced) {
      di<ILogger>().info(
        'Device already synced, no need to start sync process',
      );
    }
  }

  /// Automatically sends query packet after successful sync
  Future<void> _sendQueryPacketAfterSync() async {
    if (state.isSynced) {
      di<ILogger>().debug('Device synced, sending query packet automatically');
      await sendQueryInfoPacket();
    }
  }

  Future<void> sendQueryInfoPacket() async {
    di<ILogger>().debug('Sending query info packet');
    final packet = _packetInterpreter.constructPacket({"PacketType": 1});
    await sendCommand(packet);
  }

  Future<void> sendStatePacket({
    required int frequency,
    required int level,
    required bool signal,
    required bool pulsed,
    required EarSide earSide,
    required SignalType signalType,
    required ConductionType conductionType,
    bool? maskingSignal,
    int? maskingLevel,
  }) async {
    // Create base channel
    final channel0 = {
      "Channel": 0,
      "Valid": true,
      "ConductionType": conductionType == ConductionType.Air ? 0 : 1,
      "TransducerID":
          conductionType == ConductionType.Air
              ? state.transducerResponse?.transducers[0].id
              : state.transducerResponse?.transducers[1].id,
      "TransducerName":
          conductionType == ConductionType.Air
              ? state.transducerResponse?.transducers[0].name
              : state.transducerResponse?.transducers[1].name,
      "EarSide":
          earSide == EarSide.Left
              ? 1
              : earSide == EarSide.Right
              ? 0
              : 2,
      "SignalType":
          (signalType == SignalType.Steady
              ? 0
              : signalType == SignalType.Warble
              ? 1
              : signalType == SignalType.NB
              ? 2
              : signalType == SignalType.White
              ? 3
              : signalType == SignalType.SpeechNoise
              ? 4
              : signalType == SignalType.Speech
              ? 7
              : 0),
      "Frequency": frequency,
      "Level": level,
      "Pulsed": pulsed,
      "Rate": 1.0,
      "Signal": signal,
    };

    // Create channels list with channel 0
    List<Map<String, dynamic>> channels = [channel0];

    // Only add channel 1 if conduction type is Air
    //white noise for masking
    final channel1 = {
      "Channel": 1,
      "Valid": true,
      "ConductionType": 0,
      "TransducerID": state.transducerResponse?.transducers[0].id,
      "TransducerName": state.transducerResponse?.transducers[0].name,
      "EarSide": earSide == EarSide.Left ? 0 : 1,
      "SignalType": 3,
      "Frequency": -1,
      "Level": maskingLevel ?? 0,
      "Pulsed": false,
      "Rate": 1.0,
      "Signal": maskingSignal ?? false,
    };
    channels.add(channel1);

    final packet = _packetInterpreter.constructPacket({
      "PacketType": 4,
      "AudiometerCoreState": {"Enabled": true, "Channels": channels},
    });

    await sendCommand(packet);
  }

  Future<void> sendMaskingPacket({
    required int frequency,
    required int level,
    required bool signal,
    required EarSide earSide,
  }) async {
    final channel0 = {
      "Channel": 0,
      "Valid": true,
      "ConductionType": 0,
      "TransducerID": state.transducerResponse?.transducers[0].id,
      "TransducerName": state.transducerResponse?.transducers[0].name,
      "EarSide":
          earSide == EarSide.Left
              ? 1
              : earSide == EarSide.Right
              ? 0
              : 2,
      "SignalType": 0,
      "Frequency": frequency,
      "Level": level,
      "Pulsed": false,
      "Rate": 1.0,
      "Signal": false,
    };

    // Create channels list with channel 0
    List<Map<String, dynamic>> channels = [channel0];

    //white noise for masking
    final channel1 = {
      "Channel": 1,
      "Valid": true,
      "ConductionType": 0,
      "TransducerID": state.transducerResponse?.transducers[0].id,
      "TransducerName": state.transducerResponse?.transducers[0].name,
      "EarSide": earSide == EarSide.Left ? 0 : 1,
      "SignalType": 3,
      "Frequency": -1,
      "Level": level,
      "Pulsed": false,
      "Rate": 1.0,
      "Signal": signal,
    };
    channels.add(channel1);

    final packet = _packetInterpreter.constructPacket({
      "PacketType": 4,
      "AudiometerCoreState": {"Enabled": true, "Channels": channels},
    });

    await sendCommand(packet);
  }

  Future<void> sendBeginPacket(TestType testType) async {
    if (!state.isInBeginMode) {
      di<ILogger>().debug('Sending begin packet for test type: $testType');
      final packet = _packetInterpreter.constructPacket({
        "PacketType": 5,
        "PacketName": "Begin",
        "Modality": testType == TestType.Impedance ? 2 : 1,
        "Impedance": {
          "ProbetoneFrequency": 226,
          "RealTimeStatusUpdate": {"InIdle": false, "DuringExecution": true},
        },
      });
      await sendCommand(packet);
    } else {
      di<ILogger>().debug(
        'Device already in begin mode, skipping begin packet',
      );
    }
  }

  Future<void> sendStartImpedancePacket({
    required int probeToneFrequency,
    required bool autoSpeed,
    required int speed,
    required int start,
    required int stop,
    required double complianceMin,
    required double complianceMax,
    required double pressureMin,
    required double pressureMax,
  }) async {
    di<ILogger>().debug('Sending start impedance packet');
    final packet = _packetInterpreter.constructPacket({
      "PacketType": 10,
      "PacketName": "StartImpedance",
      "ProbetoneFrequency": probeToneFrequency,
      "RealTimeStatusUpdate": {"InIdle": false, "DuringExecution": true},
      "Tymp": {
        "Pressure": {
          "AutoSpeed": autoSpeed,
          "Speed": speed,
          "Start": start,
          "Stop": stop,
        },
        "NormativeBox": {
          "ComplianceMin": complianceMin,
          "ComplianceMax": complianceMax,
          "PressureMin": pressureMin,
          "PressureMax": pressureMax,
        },
      },
    });
    await sendCommand(packet);
  }

  Future<void> sendStopCommand() async {
    di<ILogger>().debug('Sending stop command');
    final packet = _packetInterpreter.constructPacket({
      "PacketType": 11,
      "PacketName": "Stop",
    });
    emit(state.copyWith(isInBeginMode: false));
    await sendCommand(packet);
  }

  Future<void> sendExitPacket() async {
    di<ILogger>().debug('Sending exit packet');
    await sendStopCommand();
    final packet = _packetInterpreter.constructPacket({
      "PacketType": 6,
      "Exit": true,
      "ShutDown": false,
    });
    await sendCommand(packet);
  }

  Future<void> sendDeviceStatusPacket() async {
    try {
      di<ILogger>().info(
        'Sending device status packet with tablet battery info: ${state.tabletBatteryLevel}%, charging: ${state.isTabletBatteryCharging}',
      );

      final packet = _packetInterpreter.constructPacket({
        "PacketType": 18,
        "Notify": true,
        "TabletBattery": {
          "level": state.tabletBatteryLevel,
          "isCharging": state.isTabletBatteryCharging,
          "timestamp": DateTime.now().toIso8601String(),
        },
      });
      await sendCommand(packet);
    } catch (e) {
      di<ILogger>().error('Error sending device status packet: $e');

      // Send packet without battery info if there's an error
      final packet = _packetInterpreter.constructPacket({
        "PacketType": 18,
        "Notify": true,
      });
      await sendCommand(packet);
    }
  }

  /// Get current tablet battery information
  Future<Map<String, dynamic>> getTabletBatteryInfo() async {
    try {
      final batteryService = di<BatteryService>();
      return await batteryService.getBatteryInfo();
    } catch (e) {
      di<ILogger>().error('Error getting tablet battery info: $e');
      return {
        'level': 0,
        'isCharging': false,
        'timestamp': DateTime.now().toIso8601String(),
        'error': e.toString(),
      };
    }
  }

  /// Update tablet battery status in the state
  Future<void> updateTabletBatteryStatus() async {
    try {
      final batteryService = di<BatteryService>();
      final batteryInfo = await batteryService.getBatteryInfo();

      final level = batteryInfo['level'] as int? ?? 0;
      final isCharging = batteryInfo['isCharging'] as bool? ?? false;

      // Only emit if the values have changed
      if (state.tabletBatteryLevel != level ||
          state.isTabletBatteryCharging != isCharging) {
        emit(
          state.copyWith(
            tabletBatteryLevel: level,
            isTabletBatteryCharging: isCharging,
          ),
        );
        di<ILogger>().debug(
          'Tablet battery status updated: $level%, charging: $isCharging',
        );
      }
    } catch (e) {
      di<ILogger>().error('Error updating tablet battery status: $e');
    }
  }

  void clearImpedanceData() {
    di<ILogger>().debug('Clearing impedance data');
    emit(state.copyWith(impedanceStatus: null, impedanceData: null));
  }

  void resetState() {
    di<ILogger>().debug('Resetting communication state');
    _subscription?.cancel();
    _port?.close();
    _port = null;
    _commandQueue.clear();
    _processing = false;
    _errorCount = 0;

    emit(
      const CommunicationState(
        isConnected: false,
        isSynced: false,
        isReleased: false,
        connectionStatus: 'Disconnected',
        transducerResponse: null,
        impedanceStatus: null,
        impedanceData: null,
        error: null,
        isInBeginMode: false,
      ),
    );
  }

  void _startTabletBatteryUpdates() {
    // Update tablet battery status immediately
    updateTabletBatteryStatus();

    // Set up periodic updates every 30 seconds
    _tabletBatteryUpdateTimer = Timer.periodic(const Duration(seconds: 30), (
      timer,
    ) {
      if (!isClosed) {
        updateTabletBatteryStatus();
      }
    });
  }

  /// Force refresh tablet battery status
  Future<void> forceRefreshTabletBattery() async {
    await updateTabletBatteryStatus();
  }

  @override
  Future<void> close() {
    // Cancel any pending per-command timers
    for (final command in _commandQueue) {
      command.timeoutTimer?.cancel();
    }
    _syncRetryTimer?.cancel();
    _tabletBatteryUpdateTimer?.cancel();
    _cleanupPort();
    return super.close();
  }

  Future<T?> _withRetry<T>(
    Future<T> Function() operation, {
    int maxAttempts = MAX_RETRY_ATTEMPTS,
  }) async {
    int attempt = 0;
    while (attempt < maxAttempts) {
      try {
        return await operation();
      } catch (e) {
        attempt++;
        di<ILogger>().warning('Retry attempt $attempt failed: $e');
        if (attempt == maxAttempts) {
          di<ILogger>().error('Max retry attempts reached: $e');
          rethrow;
        }
        await Future.delayed(
          Duration(milliseconds: RETRY_DELAY_MS * (1 << (attempt - 1))),
        );
      }
    }
    return null;
  }

  Future<void> _resetConnection() async {
    try {
      di<ILogger>().info('Starting connection reset...');
      await _cleanupPort();

      emit(
        state.copyWith(
          isSynced: false,
          isConnected: false,
          connectionStatus: 'Resetting...',
          isInBeginMode: false,
          transducerResponse: null,
          impedanceStatus: null,
          impedanceData: null,
          error: null,
        ),
      );

      // Wait for device to stabilize
      await Future.delayed(const Duration(seconds: 1));

      // Attempt to recreate and reopen port from last known device
      if (_lastDevice != null) {
        _port = await _lastDevice!.create();
        if (_port == null) throw Exception('Failed to recreate port');
        bool openResult = await _port!.open();
        if (!openResult) throw Exception('Failed to reopen port');

        await _configureFTDIDevice();
        _setupListener();

        emit(
          state.copyWith(
            isConnected: true,
            connectionStatus: 'Connection reset complete',
            error: null,
          ),
        );

        await sendSyncPacket();
      } else {
        throw Exception('No known device to reset connection');
      }
    } catch (e) {
      di<ILogger>().error('Reset failed: $e');
      emit(
        state.copyWith(
          error: 'Reset failed: $e',
          isConnected: false,
          connectionStatus: 'Failed',
        ),
      );
    }
  }
}
