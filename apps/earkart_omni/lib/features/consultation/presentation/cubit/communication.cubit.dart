import 'dart:async';
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
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:usb_serial_kotlin/usb_serial_kotlin.dart';

class _Command {
  final Uint8List packet;
  final Completer<void> completer;
  _Command(this.packet, this.completer);
}

class CommunicationCubit extends Cubit<CommunicationState> {
  final PacketFormatInterpreter _packetInterpreter = PacketFormatInterpreter();
  UsbPort? _port;
  StreamSubscription<Uint8List>? _subscription;
  final _commandQueue = Queue<_Command>();
  bool _processing = false;
  Timer? _connectionCheckTimer;
  Timer? _commandTimeoutTimer;

  static const int MAX_CONSECUTIVE_ERRORS = 15;
  static const int MAX_RETRY_ATTEMPTS = 3;
  static const int RETRY_DELAY_MS = 500;
  static const int COMMAND_TIMEOUT_MS = 2000;
  static const int CONNECTION_CHECK_INTERVAL_MS = 5000;
  int _errorCount = 0;
  int _consecutiveTimeouts = 0;

  CommunicationCubit() : super(const CommunicationState());

  Future<bool> initializePort(UsbDevice device) async {
    try {
      di<ILogger>().debug('Initializing port for device: ${device.deviceId}');
      emit(state.copyWith(connectionStatus: 'Initializing...', error: null));

      // Close existing port if any
      await _cleanupPort();

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
      _startConnectionMonitoring();

      di<ILogger>().info('Device initialized successfully');
      emit(
        state.copyWith(
          isConnected: true,
          connectionStatus: 'Connected',
          error: null,
        ),
      );
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

  void _startConnectionMonitoring() {
    _connectionCheckTimer?.cancel();
    _connectionCheckTimer = Timer.periodic(
      const Duration(milliseconds: CONNECTION_CHECK_INTERVAL_MS),
      (_) => _checkConnection(),
    );
  }

  Future<void> _checkConnection() async {
    if (_port == null || !state.isConnected) return;

    try {
      // Send a simple ping command
      // await _port!.write(Uint8List.fromList([0x00]));
      _consecutiveTimeouts = 0;
    } catch (e) {
      di<ILogger>().error('Connection check failed: $e');
      _consecutiveTimeouts++;

      if (_consecutiveTimeouts >= 3) {
        di<ILogger>().error('Connection lost, attempting to reset...');
        await _resetConnection();
      }
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
      _handleIncomingData,
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

  void _handleIncomingData(Uint8List data) {
    if (data.isEmpty) return;

    try {
      di<ILogger>().debug('Received data: ${data.length} bytes');
      List<int>? processedPacket = _packetInterpreter.onListenerDataReady(data);
      if (processedPacket != null) {
        _handleProcessedPacket(processedPacket);
      }
    } catch (e) {
      di<ILogger>().error('Data processing error: $e');
      emit(state.copyWith(error: 'Data processing error: $e'));
    }
  }

  void _handleProcessedPacket(List<int> packet) {
    try {
      List<int>? payload = _packetInterpreter.extractPayload(packet);
      if (payload == null) return;

      String jsonString = String.fromCharCodes(
        payload,
      ).trim().replaceAll(RegExp(r'[\x00-\x1F\x7F-\x9F]'), '');

      di<ILogger>().debug('Processing packet: $jsonString');

      if (jsonString.contains("R15C")) {
        di<ILogger>().info('Device synced successfully');
        emit(
          state.copyWith(
            isSynced: true,
            connectionStatus: 'Synced',
            error: null,
            isInBeginMode: false,
          ),
        );
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
      throw Exception('Port not initialized');
    }

    return _withRetry(() async {
      final completer = Completer<void>();
      _commandQueue.add(_Command(packet, completer));
      _processQueue();

      // Set command timeout
      _commandTimeoutTimer?.cancel();
      _commandTimeoutTimer = Timer(
        const Duration(milliseconds: COMMAND_TIMEOUT_MS),
        () {
          if (!completer.isCompleted) {
            completer.completeError('Command timeout');
          }
        },
      );

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
        command.completer.complete();
        _commandQueue.removeFirst();
        _errorCount = 0; // Reset error count on successful command
      } catch (e) {
        di<ILogger>().error('Error sending command: $e');
        command.completer.completeError(e);
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
    di<ILogger>().debug(
      'Sending state packet - Frequency: $frequency, Level: $level, Signal: $signal',
    );
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
          signalType == SignalType.Steady
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
              : 0,
      "Frequency": frequency,
      "Level": level,
      "Pulsed": pulsed,
      "Rate": 1.0,
      "Signal": signal,
    };

    List<Map<String, dynamic>> channels = [channel0];

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
      "Signal": signal == true ? maskingSignal ?? false : false,
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
    });
    await sendCommand(packet);
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

  @override
  Future<void> close() {
    _connectionCheckTimer?.cancel();
    _commandTimeoutTimer?.cancel();
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

      // Attempt to reopen port
      if (_port != null) {
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
