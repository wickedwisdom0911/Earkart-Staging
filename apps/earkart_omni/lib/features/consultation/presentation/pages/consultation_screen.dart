// ignore_for_file: unnecessary_null_comparison
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.state.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/video_call_widget.dart';
import 'package:earkart_omni/models/communication/enums.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/consultation/consultation.model.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:permission_handler/permission_handler.dart';
import 'package:usb_serial_kotlin/usb_serial_kotlin.dart';

class ConsultationScreen extends StatefulWidget {
  static const routeName = '/consultation';
  const ConsultationScreen({super.key});

  @override
  State<ConsultationScreen> createState() => _ConsultationScreenState();
}

class _ConsultationScreenState extends State<ConsultationScreen> {
  late IO.Socket socket;
  bool _isSocketInitialized = false;
  bool _isInitialized = false;
  ConsultationEntity? consultation;
  bool _hasJoinedConsultation = false;
  UsbDevice? r15cDevice;
  UsbDevice? revo2Device;
  TestType? testType;
  // Only track status, not data
  dynamic _lastImpedanceStatus;
  @override
  void initState() {
    super.initState();
    _initializeScreen();
  }

  void _initializeScreen() {
    // Get current consultation first
    context.read<ConsultationCubit>().getCurrentConsultation();
    // Then check permissions and initialize devices
    _checkAndRequestPermissions();
  }

  Future<void> _checkAndRequestPermissions() async {
    final storageStatus = await Permission.manageExternalStorage.request();
    final usbStatus = await Permission.bluetooth.request();

    if (storageStatus.isGranted && usbStatus.isGranted) {
      _initializeDeviceMonitoring();
    } else {
      _showPermissionDialog();
    }
  }

  void _initializeDeviceMonitoring() {
    // Start device monitoring
    context.read<DeviceCubit>().startDeviceMonitoring();

    // Setup listeners for device and communication state changes
    _setupDeviceListeners();
  }

  void _setupDeviceListeners() {
    // Listen for device state changes
    context.read<DeviceCubit>().stream.listen((deviceState) {
      deviceState.maybeWhen(
        success: (devices, r15cDevice, revo2Device) {
          _handleDeviceStateChange(r15cDevice, revo2Device);
        },
        error: (message) {
          _showErrorSnackBar('Device error: $message');
        },
        orElse: () {},
      );
    });

    // Listen for communication state changes
    context.read<CommunicationCubit>().stream.listen((commState) {
      _handleCommunicationStateChange(commState);
    });
  }

  void _handleDeviceStateChange(UsbDevice? r15cDevice, UsbDevice? revo2Device) {
    final wasConnected = this.r15cDevice != null;
    final isNowConnected = r15cDevice != null;

    // Update device references
    this.r15cDevice = r15cDevice;
    this.revo2Device = revo2Device;

    // Handle device state changes
    if (wasConnected != isNowConnected) {
      di<ILogger>().debug(
        isNowConnected ? 'R15C device attached' : 'R15C device detached',
      );

      if (!isNowConnected) {
        _handleDeviceDisconnection();
      } else {
        _handleDeviceConnection(r15cDevice);
      }
    }

    // Emit device event to socket if connected
    if (_isSocketInitialized) {
      _emitDeviceEvent(context.read<CommunicationCubit>().state);
    }
  }

  void _handleDeviceDisconnection() {
    // Reset communication state
    context.read<CommunicationCubit>().resetState();

    // Show disconnection message
    if (mounted) {
      _showErrorSnackBar('Device disconnected. Attempting to reconnect...');
    }
  }

  void _handleDeviceConnection(UsbDevice device) {
    di<ILogger>().debug('Initializing newly attached R15C device');

    // Initialize device with retry
    _initializeDeviceWithRetry(device);
  }

  Future<void> _initializeDeviceWithRetry(UsbDevice device) async {
    int retryCount = 0;
    const maxRetries = 3;
    const retryDelay = Duration(seconds: 2);

    while (retryCount < maxRetries) {
      final success = await context.read<CommunicationCubit>().initializePort(
        device,
      );
      if (success) {
        di<ILogger>().info('Device initialized successfully');
        return;
      }

      retryCount++;
      if (retryCount < maxRetries) {
        di<ILogger>().debug(
          'Retrying device initialization (attempt $retryCount)',
        );
        await Future.delayed(retryDelay);
      }
    }

    if (mounted) {
      _showErrorSnackBar(
        'Failed to initialize device after $maxRetries attempts',
      );
    }
  }

  void _handleCommunicationStateChange(CommunicationState state) {
    if (r15cDevice != null) {
      if (!state.isConnected) {
        _handleDisconnectedState();
      } else if (state.isConnected && !state.isSynced) {
        _handleConnectedState();
      } else if (state.isSynced && state.transducerResponse == null) {
        _handleSyncedState();
      } else if (state.transducerResponse != null) {
        _handleReadyState();
      }
    }

    // Handle error states
    if (state.error != null) {
      _handleCommunicationError(state.error!);
    }
  }

  void _handleDisconnectedState() {
    di<ILogger>().debug('Device not connected, initializing port...');
    if (r15cDevice != null) {
      _initializeDeviceWithRetry(r15cDevice!);
    }
    _emitDeviceEvent(context.read<CommunicationCubit>().state);
  }

  void _handleConnectedState() {
    di<ILogger>().debug(
      'Device connected but not synced, sending sync packet...',
    );
    context.read<CommunicationCubit>().sendSyncPacket();
    _emitDeviceEvent(context.read<CommunicationCubit>().state);
  }

  void _handleSyncedState() {
    di<ILogger>().debug(
      'Device synced but not ready, sending query info packet...',
    );
    context.read<CommunicationCubit>().sendQueryInfoPacket();
    _emitDeviceEvent(context.read<CommunicationCubit>().state);
  }

  void _handleReadyState() {
    di<ILogger>().debug('Device ready with transducer response');
    _handleBeginPacket(testType);
    _emitDeviceEvent(context.read<CommunicationCubit>().state);
  }

  void _handleCommunicationError(String error) {
    di<ILogger>().error('Device error: $error');
    _showErrorSnackBar('Device error: $error');
    _emitDeviceEvent(context.read<CommunicationCubit>().state);
  }

  void _showErrorSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: const Duration(seconds: 3),
        action: SnackBarAction(
          label: 'Retry',
          onPressed: () {
            if (r15cDevice != null) {
              _initializeDeviceWithRetry(r15cDevice!);
            }
          },
        ),
      ),
    );
  }

  void _showPermissionDialog() {
    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => AlertDialog(
            title: const Text('Permission Required'),
            content: const Text(
              'Storage and USB permissions are required to detect USB devices. Please grant the permissions in settings.',
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                  openAppSettings();
                },
                child: const Text('Open Settings'),
              ),
            ],
          ),
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_isInitialized) {
      context.read<AuthCubit>().getCurrentUser();
      _isInitialized = true;
    }
  }

  @override
  void dispose() {
    try {
      if (_isSocketInitialized) {
        socket.off('user_joined');
        socket.off('start-test');
        socket.off('user_left');
        socket.off('connect');
        socket.off('disconnect');
        socket.off('reconnect');
        socket.disconnect();
        socket.dispose();
      }
      context.read<DeviceCubit>().stopDeviceMonitoring();
      _hasJoinedConsultation = false;
    } catch (e) {
      di<ILogger>().error('Error in dispose: $e');
    }
    super.dispose();
  }

  void _setupSocket(String token) {
    try {
      // Disconnect existing socket if any
      if (_isSocketInitialized) {
        socket.disconnect();
        socket.dispose();
      }

      socket = IO.io(Constants.socketUrl, <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': true,
        'auth': {'token': token},
        'reconnection': true,
        'reconnectionAttempts': 5,
        'reconnectionDelay': 1000,
        'timeout': 10000,
      });

      // Set up socket event handlers
      _setupSocketEventHandlers();
    } catch (e) {
      di<ILogger>().error('Error setting up socket: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error connecting to server. Please try again.'),
          ),
        );
      }
    }
  }

  void _setupSocketEventHandlers() {
    if (!mounted) return;

    socket.onConnect((_) {
      if (!mounted) return;
      di<ILogger>().debug('Socket connected successfully');
      setState(() {
        _isSocketInitialized = true;
      });

      // Try to rejoin consultation if we have one
      _tryJoinConsultation();
    });

    socket.onDisconnect((_) {
      if (!mounted) return;
      di<ILogger>().debug('Socket disconnected');
      setState(() {
        _isSocketInitialized = false;
        _hasJoinedConsultation = false; // Reset join status on disconnect
      });
    });

    socket.onError((error) {
      di<ILogger>().error('Socket error: $error');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Connection error: ${error.toString()}'),
            duration: const Duration(seconds: 3),
          ),
        );
      }
    });

    socket.onConnectError((error) {
      di<ILogger>().error('Socket connection error: $error');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Connection error: ${error.toString()}'),
            duration: const Duration(seconds: 3),
          ),
        );
      }
    });

    socket.onReconnect((_) {
      if (!mounted) return;
      di<ILogger>().debug('Socket reconnected');
      setState(() {
        _isSocketInitialized = true;
      });
      _tryJoinConsultation(); // Try to rejoin on reconnect
    });

    socket.onReconnectAttempt((attempt) {
      di<ILogger>().debug('Socket reconnection attempt: $attempt');
    });

    socket.onReconnectError((error) {
      di<ILogger>().error('Socket reconnection error: $error');
    });

    socket.onReconnectFailed((_) {
      di<ILogger>().error('Socket reconnection failed');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Failed to reconnect to server. Please check your connection.',
            ),
            duration: Duration(seconds: 3),
          ),
        );
      }
    });

    socket.on("user_joined", (data) {
      _emitDeviceEvent(context.read<CommunicationCubit>().state);
      _handleBeginPacket(testType);

      if (!mounted) return;
      if (data == null) {
        di<ILogger>().debug('Received null data in user_joined event');
        return;
      }
      try {
        if (data['user'] != null) {
          final consultationData = ConsultationModelData.fromJson(data['user']);
          if (consultationData != null) {
            setState(() {
              consultation = consultationData;
            });
          } else {
            di<ILogger>().error('Failed to parse consultation data');
          }
        }
      } catch (e) {
        di<ILogger>().error('Error handling user_joined event: $e');
      }
    });

    socket.on("start-test", (data) {
      di<ILogger>().debug('Start test: $data');
      if (data["testId"] != null) {
        context.read<CommunicationCubit>().sendStopCommand();
        setState(() {
          testType =
              data["testId"] == "pure-tone" ? TestType.PTA : TestType.Impedance;
        });
        _handleBeginPacket(testType);
      }
    });

    socket.on("user_left", (data) {
      di<ILogger>().debug('User left: $data');
    });

    socket.on("audiometry-signal", (data) {
      di<ILogger>().debug('Audiometry signal: $data');
      context.read<CommunicationCubit>().sendStatePacket(
        frequency: data["frequency"],
        level: data["level"],
        signal: data["signal"],
        pulsed: data["pulsed"],
        earSide: data["earSide"] == "L" ? EarSide.Left : EarSide.Right,
        signalType:
            data["signalType"] == "Steady"
                ? SignalType.Steady
                : data["signalType"] == "Warble"
                ? SignalType.Warble
                : data["signalType"] == "NB"
                ? SignalType.NB
                : data["signalType"] == "White"
                ? SignalType.White
                : data["signalType"] == "SpeechNoise"
                ? SignalType.SpeechNoise
                : data["signalType"] == "Speech"
                ? SignalType.Speech
                : SignalType.Steady,
        conductionType:
            data["conductionType"] == "AC"
                ? ConductionType.Air
                : ConductionType.Bone,
        maskingSignal: data["maskingSignal"],
        maskingLevel: data["maskingLevel"],
      );
    });
    socket.on("start-tympanometry", (data) {
      try {
        di<ILogger>().debug('Start tympanometry: $data');
        if (data == null) {
          di<ILogger>().error('Received null data in start-tympanometry event');
          return;
        }

        context.read<CommunicationCubit>().sendStartImpedancePacket(
          probeToneFrequency: (data["ProbeToneFrequency"] as num).toInt(),
          autoSpeed: data["AutoSpeed"] as bool,
          speed: (data["Speed"] as num).toInt(),
          start: (data["Start"] as num).toInt(),
          stop: (data["Stop"] as num).toInt(),
          complianceMin: (data["ComplianceMin"] as num).toDouble(),
          complianceMax: (data["ComplianceMax"] as num).toDouble(),
          pressureMin: (data["PressureMin"] as num).toDouble(),
          pressureMax: (data["PressureMax"] as num).toDouble(),
        );
      } catch (e) {
        di<ILogger>().error('Error handling start-tympanometry event: $e');
      }
    });

    socket.on("end-test", (data) {
      try {
        di<ILogger>().debug('End test: $data');
        context.read<CommunicationCubit>().sendExitPacket();
      } catch (e) {
        di<ILogger>().error('Error handling end-test event: $e');
      }
    });
  }

  void _tryJoinConsultation() {
    if (!mounted || !_isSocketInitialized) return;

    if (consultation?.id != null && !_hasJoinedConsultation) {
      di<ILogger>().debug(
        'Attempting to join consultation: ${consultation?.id}',
      );
      socket.emit("join_consultation", {"consultationId": consultation?.id});
      setState(() {
        _hasJoinedConsultation = true;
      });

      di<ILogger>().debug('Join consultation event emitted');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          consultation?.audiologist?.user?.name != null
              ? "Consultation by ${consultation!.audiologist!.user!.name}"
              : "Consultation by Earkart",
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      body: MultiBlocListener(
        listeners: [
          BlocListener<AuthCubit, AuthState>(
            listener: (context, state) {
              state.when(
                initial: () {
                  di<ILogger>().debug('Auth state: initial');
                  context.read<AuthCubit>().getCurrentUser();
                },
                loading: () {
                  di<ILogger>().debug('Auth state: loading');
                },
                success: (user) {
                  di<ILogger>().debug(
                    'Auth state: success - User: ${user?.email}',
                  );
                  if (user?.token != null) {
                    _setupSocket(user!.token!);
                  } else {
                    di<ILogger>().error('User token is null in success state');
                  }
                },
                centreSuccess: (centre) {
                  di<ILogger>().debug('Auth state: centre success');
                },
                centreError: (error) {
                  di<ILogger>().error('Auth state: centre error - $error');
                },
                error: (error) {
                  di<ILogger>().error('Auth state: error - $error');
                },
              );
            },
          ),
          BlocListener<ConsultationCubit, ConsultationState>(
            listener: (context, state) {
              if (state is CurrentConsultationSuccess) {
                setState(() {
                  consultation = state.consultation;
                });
                _tryJoinConsultation();
              }
            },
          ),
          BlocListener<DeviceCubit, DeviceState>(
            listener: (context, state) {
              state.maybeWhen(
                success: (devices, r15cDevice, revo2Device) {
                  final wasConnected = this.r15cDevice != null;
                  final isNowConnected = r15cDevice != null;

                  // Update device references
                  this.r15cDevice = r15cDevice;
                  this.revo2Device = revo2Device;

                  // Handle device state changes
                  if (wasConnected != isNowConnected) {
                    di<ILogger>().debug(
                      isNowConnected
                          ? 'R15C device attached'
                          : 'R15C device detached',
                    );

                    // Reset communication state on detachment
                    if (!isNowConnected) {
                      context.read<CommunicationCubit>().resetState();
                    }
                  }

                  // Emit device event to socket
                  if (_isSocketInitialized) {
                    _emitDeviceEvent(context.read<CommunicationCubit>().state);
                  }

                  // Initialize device if newly attached
                  if (isNowConnected && !wasConnected) {
                    di<ILogger>().debug(
                      'Initializing newly attached R15C device',
                    );
                    context.read<CommunicationCubit>().initializePort(
                      r15cDevice,
                    );
                  }
                },
                orElse: () {},
              );
            },
          ),
          BlocListener<CommunicationCubit, CommunicationState>(
            listener: (context, state) {
              // Handle impedance status
              if (state.impedanceStatus != null) {
                _emitTympanometryStatus(state);
              }

              // Only emit impedance data if it's a new data event
              if (state.impedanceData != null && state.isNewImpedanceData) {
                _emitTympanometryData(state);
              }

              if (r15cDevice != null) {
                // Handle connection state
                if (!state.isConnected) {
                  di<ILogger>().debug(
                    'Device not connected, initializing port...',
                  );
                  context.read<CommunicationCubit>().initializePort(
                    r15cDevice!,
                  );
                  _emitDeviceEvent(state);
                }
                // Handle initialization state
                else if (state.isConnected && !state.isSynced) {
                  di<ILogger>().debug(
                    'Device connected but not synced, sending sync packet...',
                  );
                  context.read<CommunicationCubit>().sendSyncPacket();
                  _emitDeviceEvent(state);
                }
                // Handle ready state
                else if (state.isSynced && state.transducerResponse == null) {
                  di<ILogger>().debug(
                    'Device synced but not ready, sending query info packet...',
                  );
                  context.read<CommunicationCubit>().sendQueryInfoPacket();
                  _emitDeviceEvent(state);
                }
                // Device is ready - send begin packet
                else if (state.transducerResponse != null) {
                  di<ILogger>().debug('Device ready with transducer response');
                  _handleBeginPacket(testType);
                  _emitDeviceEvent(state);
                }
              }

              // Handle error states
              if (state.error != null) {
                di<ILogger>().error('Device error: ${state.error}');
                _emitDeviceEvent(state);
              }
            },
          ),
        ],
        child: BlocBuilder<ConsultationCubit, ConsultationState>(
          builder: (context, state) {
            if (state is CurrentConsultationSuccess) {
              return VideoCallWidget(channelName: state.consultation.id ?? "");
            }
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Loading consultation...'),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  void _emitDeviceEvent(CommunicationState state) {
    if (_isSocketInitialized) {
      String connectionStatus = "Disconnected";
      di<ILogger>().debug('Emitting device event: ${state}');
      if (state.isInBeginMode) {
        connectionStatus = "begin";
      } else if (state.transducerResponse != null) {
        connectionStatus = "Ready";
      } else if (state.isConnected) {
        connectionStatus = "Connected";
      }

      socket.emit("device_event", {
        "consultationId": consultation?.id,
        "r15cConnected": r15cDevice != null,
        "revo2Connected": revo2Device != null,
        "connectionStatus": connectionStatus,
        "transducerResponse": state.transducerResponse,
      });
    }
  }

  void _handleBeginPacket(TestType? testType) {
    if (r15cDevice != null &&
        context.read<CommunicationCubit>().state.isConnected &&
        context.read<CommunicationCubit>().state.transducerResponse != null) {
      di<ILogger>().debug('Sending begin packet for test type: $testType');
      context.read<CommunicationCubit>().sendBeginPacket(
        testType ?? TestType.PTA,
      );
      _emitDeviceEvent(context.read<CommunicationCubit>().state);
    } else {
      di<ILogger>().debug(
        'Device not connected or transducer response is null',
      );
    }
  }

  void _emitTympanometryStatus(CommunicationState state) {
    if (_isSocketInitialized &&
        state.impedanceStatus != null &&
        state.impedanceStatus != _lastImpedanceStatus) {
      di<ILogger>().debug(
        'Emitting tympanometry status: ${state.impedanceStatus}',
      );
      socket.emit("tympanometry-status", {
        "consultationId": consultation?.id,
        "tympanometryStatus": state.impedanceStatus,
      });
      _lastImpedanceStatus = state.impedanceStatus;
    }
  }

  void _emitTympanometryData(CommunicationState state) {
    if (_isSocketInitialized && state.impedanceData != null) {
      di<ILogger>().debug('Emitting tympanometry data: ${state.impedanceData}');
      socket.emit("tympanometry-data", {
        "consultationId": consultation?.id,
        "tympanometryData": state.impedanceData,
      });
    }
  }
}
