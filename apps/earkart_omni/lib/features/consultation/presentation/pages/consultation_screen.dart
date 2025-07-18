// ignore_for_file: unnecessary_null_comparison
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
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
import 'package:earkart_omni/features/consultation/presentation/widgets/report_pta.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/uvc_camera_widget.dart';
import 'package:earkart_omni/models/communication/enums.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/consultation/consultation.model.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:permission_handler/permission_handler.dart';
import 'package:usb_serial_kotlin/usb_serial_kotlin.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/home/presentation/pages/root_screen.dart';

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
  // Track if report should be shown (for split screen)
  bool _showReport = false;
  // Track if camera should be shown (for split screen)
  bool _showCamera = false;
  // Track if socket reconnection has failed
  bool _socketReconnectFailed = false;
  // Global key to maintain video widget state
  final GlobalKey _videoWidgetKey = GlobalKey();
  // Keep video widget instance to prevent rebuilding
  VideoCallWidget? _videoWidget;
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
    if (!mounted) return;

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
    if (!mounted) return;

    // Reset communication state
    context.read<CommunicationCubit>().resetState();

    // Show disconnection message
    _showErrorSnackBar('Device disconnected. Attempting to reconnect...');
  }

  void _handleDeviceConnection(UsbDevice device) {
    di<ILogger>().debug('Initializing newly attached R15C device');

    // Initialize device with retry
    _initializeDeviceWithRetry(device);
  }

  Future<void> _initializeDeviceWithRetry(UsbDevice device) async {
    if (!mounted) return;

    int retryCount = 0;
    const maxRetries = 3;
    const retryDelay = Duration(seconds: 2);

    while (retryCount < maxRetries) {
      if (!mounted) return;

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
    if (!mounted) return;

    di<ILogger>().debug('Device not connected, initializing port...');
    if (r15cDevice != null) {
      _initializeDeviceWithRetry(r15cDevice!);
    }
    _emitDeviceEvent(context.read<CommunicationCubit>().state);
  }

  void _handleConnectedState() {
    if (!mounted) return;

    di<ILogger>().debug(
      'Device connected but not synced, sending sync packet...',
    );
    context.read<CommunicationCubit>().sendSyncPacket();
    _emitDeviceEvent(context.read<CommunicationCubit>().state);
  }

  void _handleSyncedState() {
    if (!mounted) return;

    di<ILogger>().debug(
      'Device synced but not ready, sending query info packet...',
    );
    context.read<CommunicationCubit>().sendQueryInfoPacket();
    _emitDeviceEvent(context.read<CommunicationCubit>().state);
  }

  void _handleReadyState() {
    if (!mounted) return;

    di<ILogger>().debug('Device ready with transducer response');
    _handleBeginPacket(testType);
    _emitDeviceEvent(context.read<CommunicationCubit>().state);
  }

  void _handleCommunicationError(String error) {
    if (!mounted) return;

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
        socket.off('generate-report:start');
        socket.off('generate-report:end');
        socket.off('connect');
        socket.off('disconnect');
        socket.off('reconnect');
        socket.disconnect();
        socket.dispose();
      }
      context.read<DeviceCubit>().stopDeviceMonitoring();
      _hasJoinedConsultation = false;
      _videoWidget = null; // Clear video widget reference
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
        _socketReconnectFailed = false; // Reset reconnect failed flag
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
        _socketReconnectFailed = false; // Reset reconnect failed flag
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
        setState(() {
          _socketReconnectFailed = true;
        });
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
      if (!mounted) return;

      _emitDeviceEvent(context.read<CommunicationCubit>().state);
      _handleBeginPacket(testType);

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
      if (!mounted) return;

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
      if (!mounted) return;
      di<ILogger>().debug('User left: $data');
    });

    socket.on("audiometry-signal", (data) {
      if (!mounted) return;

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
      if (!mounted) return;

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
      if (!mounted) return;

      try {
        di<ILogger>().debug('End test: $data');
        context.read<CommunicationCubit>().sendExitPacket();
      } catch (e) {
        di<ILogger>().error('Error handling end-test event: $e');
      }
    });

    socket.on("generate-report:start", (data) {
      if (!mounted) return;

      try {
        di<ILogger>().debug('Generate report started: $data');
        setState(() {
          _showReport = true;
        });
      } catch (e) {
        di<ILogger>().error('Error handling generate-report:start event: $e');
      }
    });

    socket.on("generate-report:end", (data) {
      if (!mounted) return;

      try {
        di<ILogger>().debug('Generate report stopped: $data');
        setState(() {
          _showReport = false;
        });
      } catch (e) {
        di<ILogger>().error('Error handling generate-report:stop event: $e');
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

  void _manualReconnect() {
    if (!mounted) return;

    di<ILogger>().debug('Manual reconnect initiated');

    // Reset failed state
    setState(() {
      _socketReconnectFailed = false;
      _isSocketInitialized = false;
      _hasJoinedConsultation = false;
    });

    // Get current user to reinitialize socket
    final authState = context.read<AuthCubit>().state;
    authState.whenOrNull(
      success: (user) {
        if (user?.token != null) {
          _setupSocket(user!.token!);
        }
      },
    );
  }

  VideoCallWidget _getVideoWidget(String channelName) {
    di<ILogger>().debug(
      '_getVideoWidget called with channelName: $channelName',
    );
    di<ILogger>().debug('Current consultation ID: ${consultation?.id}');
    di<ILogger>().debug('Current consultation: $consultation');

    if (_videoWidget == null || (_videoWidget!.channelName != channelName)) {
      final consultationId = consultation?.id ?? "";
      di<ILogger>().debug(
        'Creating new VideoCallWidget with consultationId: "$consultationId"',
      );

      _videoWidget = VideoCallWidget(
        key: _videoWidgetKey,
        channelName: channelName,
        consultationId: consultationId,
        onLeaveChannel: () {
          // This will be called when the video channel is left
          di<ILogger>().debug('Video channel left successfully');
        },
      );
    }
    return _videoWidget!;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GlassmorphismAppBar(
        title: Text(
          consultation?.audiologist?.user?.name != null
              ? "Consultation by ${consultation!.audiologist!.user!.name}"
              : "Consultation by Earkart",
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        actions: [
          // Show reconnect button when socket reconnection fails
          if (_socketReconnectFailed)
            IconButton(
              icon: const Icon(Icons.refresh, color: Colors.red),
              tooltip: 'Reconnect to server',
              onPressed: _manualReconnect,
            ),
          // Show connection status indicator
          if (!_socketReconnectFailed)
            IconButton(
              icon: Icon(
                _isSocketInitialized ? Icons.circle : Icons.circle_outlined,
                color: _isSocketInitialized ? Colors.green : Colors.red,
              ),
              tooltip:
                  _isSocketInitialized
                      ? 'Connected to server'
                      : 'Connecting to server...',
              onPressed: () {
                _showErrorSnackBar(
                  _isSocketInitialized
                      ? 'Connected to server'
                      : 'Connecting to server...',
                );
              },
            ),

          // Camera toggle button
          BlocBuilder<DeviceCubit, DeviceState>(
            builder: (context, deviceState) {
              final hasRevo2Device = deviceState.maybeWhen(
                success:
                    (devices, r15cDevice, revo2Device) => revo2Device != null,
                orElse: () => false,
              );

              di<ILogger>().debug(
                'Camera toggle button: hasRevo2Device = $hasRevo2Device, _showCamera = $_showCamera',
              );

              if (hasRevo2Device) {
                return IconButton(
                  icon: Icon(
                    _showCamera ? Icons.videocam : Icons.videocam_off,
                    color: _showCamera ? Colors.blue : Colors.grey,
                  ),
                  tooltip: _showCamera ? 'Hide Camera' : 'Show Camera',
                  onPressed: () {
                    di<ILogger>().debug(
                      'Camera toggle button pressed - toggling _showCamera from $_showCamera',
                    );

                    // Add delay before toggling to prevent rapid state changes
                    Future.delayed(const Duration(milliseconds: 300), () {
                      if (mounted) {
                        setState(() {
                          _showCamera = !_showCamera;
                          // Hide report if showing camera
                          if (_showCamera) {
                            _showReport = false;
                          }
                        });
                      }
                    });
                  },
                );
              }
              return const SizedBox.shrink();
            },
          ),

          // Report toggle button
          IconButton(
            icon: Icon(
              _showReport ? Icons.assessment : Icons.assessment_outlined,
              color: _showReport ? Colors.blue : Colors.grey,
            ),
            tooltip: _showReport ? 'Hide Report' : 'Show Report',
            onPressed: () {
              setState(() {
                _showReport = !_showReport;
                // Hide camera if showing report
                if (_showReport) {
                  _showCamera = false;
                }
              });
            },
          ),

          // Device status is now shown globally in the main app overlay
          const SizedBox.shrink(),
        ],
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
              di<ILogger>().debug(
                'ConsultationScreen: Consultation state changed: $state',
              );

              if (state is CurrentConsultationSuccess) {
                di<ILogger>().debug(
                  'ConsultationScreen: Current consultation success - ID: ${state.consultation.id}',
                );
                setState(() {
                  consultation = state.consultation;
                });
                _tryJoinConsultation();
              }
              // Handle consultation update success
              if (state is ConsultationSuccess) {
                di<ILogger>().debug(
                  'ConsultationScreen: Consultation update success - status: ${state.consultation.status}',
                );
                // Show success message if consultation was completed
                if (state.consultation.status == SessionStatus.completed) {
                  di<ILogger>().debug(
                    'ConsultationScreen: Consultation completed, calling _handleConsultationCompletion',
                  );
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Consultation completed successfully'),
                      backgroundColor: Colors.green,
                      duration: Duration(seconds: 2),
                    ),
                  );

                  // Leave the channel and clear data
                  _handleConsultationCompletion();
                }
              }
              // Handle consultation update error
              if (state is ConsultationError) {
                di<ILogger>().debug(
                  'ConsultationScreen: Consultation error - ${state.message}',
                );
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Error: ${state.message}'),
                    backgroundColor: Colors.red,
                    duration: const Duration(seconds: 3),
                  ),
                );
              }
            },
          ),
          BlocListener<DeviceCubit, DeviceState>(
            listener: (context, state) {
              di<ILogger>().debug('Device state: $state');
              state.maybeWhen(
                success: (devices, r15cDevice, revo2Device) {
                  final wasConnected = this.r15cDevice != null;
                  final isNowConnected = r15cDevice != null;
                  final wasRevo2Connected = this.revo2Device != null;
                  final isNowRevo2Connected = revo2Device != null;

                  // Update device references
                  this.r15cDevice = r15cDevice;
                  this.revo2Device = revo2Device;

                  // Handle R15C device state changes
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

                  // Handle Revo2 device state changes
                  if (wasRevo2Connected != isNowRevo2Connected) {
                    di<ILogger>().debug(
                      isNowRevo2Connected
                          ? 'Revo2 device attached - auto-showing camera'
                          : 'Revo2 device detached - hiding camera',
                    );

                    // Auto-show camera when Revo2 is connected with delay
                    if (isNowRevo2Connected && !_showCamera) {
                      // Add delay before showing camera to ensure device is stable
                      Future.delayed(const Duration(seconds: 2), () {
                        if (mounted) {
                          setState(() {
                            _showCamera = true;
                            _showReport =
                                false; // Hide report when showing camera
                          });
                        }
                      });
                    } else if (!isNowRevo2Connected && _showCamera) {
                      // Hide camera immediately when device is disconnected
                      setState(() {
                        _showCamera = false;
                      });
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
              if (!state.isReleased) {
                _emitPatientResponseEvent(state.isReleased);
              }
              if (state.isReleased) {
                _emitPatientResponseEvent(state.isReleased);
              }
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
          // Removed UVCCameraCubit BlocListener - camera is now managed by the widget
        ],
        child: BlocBuilder<ConsultationCubit, ConsultationState>(
          builder: (context, state) {
            di<ILogger>().debug(
              'ConsultationScreen: BlocBuilder state: $state',
            );

            if (state is CurrentConsultationSuccess) {
              di<ILogger>().debug(
                'ConsultationScreen: BlocBuilder - consultation ID: ${state.consultation.id}',
              );
              final videoWidget = _getVideoWidget(state.consultation.id ?? "");

              if (_showReport) {
                // Split screen: video call on left, report on right
                return Row(
                  children: [
                    // Left half - Video call
                    Expanded(
                      flex: 1,
                      child: Container(
                        decoration: BoxDecoration(
                          border: Border(
                            right: BorderSide(
                              color: Colors.grey[300]!,
                              width: 1,
                            ),
                          ),
                        ),
                        child: videoWidget,
                      ),
                    ),
                    // Right half - PTA Report
                    Expanded(
                      flex: 1,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.grey[50],
                          border: Border(
                            left: BorderSide(
                              color: Colors.grey[300]!,
                              width: 1,
                            ),
                          ),
                        ),
                        child: Column(
                          children: [
                            // Report header with close button
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.blue[900],
                                border: Border(
                                  bottom: BorderSide(
                                    color: Colors.grey[300]!,
                                    width: 1,
                                  ),
                                ),
                              ),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'Pure Tone Audiometry Report',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(
                                      Icons.close,
                                      color: Colors.white,
                                    ),
                                    onPressed: () {
                                      setState(() {
                                        _showReport = false;
                                      });
                                    },
                                    tooltip: 'Close Report',
                                  ),
                                ],
                              ),
                            ),
                            // Report content
                            const Expanded(child: ReportPTAWidget()),
                          ],
                        ),
                      ),
                    ),
                  ],
                );
              } else if (_showCamera) {
                // Split screen: video call on left, camera on right
                return Row(
                  children: [
                    // Left half - Video call
                    Expanded(
                      flex: 1,
                      child: Container(
                        decoration: BoxDecoration(
                          border: Border(
                            right: BorderSide(
                              color: Colors.grey[300]!,
                              width: 1,
                            ),
                          ),
                        ),
                        child: videoWidget,
                      ),
                    ),
                    // Right half - UVC Camera
                    Expanded(flex: 1, child: UVCCameraWidget(socket: socket)),
                  ],
                );
              } else {
                // Full screen video call
                return videoWidget;
              }
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
    if (!mounted) return;

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

  _emitPatientResponseEvent(bool isReleased) {
    if (!mounted || !_isSocketInitialized) return;

    socket.emit("patient-response", {
      "consultationId": consultation?.id,
      "patientResponse": !isReleased,
    });
  }

  void _handleConsultationCompletion() async {
    try {
      // Leave the consultation channel via socket
      if (_isSocketInitialized && consultation?.id != null) {
        socket.emit("end:consultation", {"consultationId": consultation?.id});
      }

      // Clear patient and consultation data
      context.read<PatientCubit>().deletePatientSession();
      context.read<ConsultationCubit>().deleteCurrentConsultationSession();

      // Navigate to root screen
      if (mounted) {
        Navigator.pushReplacementNamed(context, RootScreen.routeName);
      }
    } catch (e) {
      di<ILogger>().error('Error handling consultation completion: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error completing consultation: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }
}
