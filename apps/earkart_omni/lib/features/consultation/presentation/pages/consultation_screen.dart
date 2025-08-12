// ignore_for_file: unnecessary_null_comparison
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.state.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/video_call_widget.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/uvc_camera_widget.dart';
import 'package:earkart_omni/models/communication/enums.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/consultation/consultation.model.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:usb_serial_kotlin/usb_serial_kotlin.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/home/presentation/pages/root_screen.dart';
import 'package:earkart_omni/config/release_config.dart';
import 'package:earkart_omni/config/utils/error_handler.dart';
import 'package:earkart_omni/features/consultation/data/source/local/consultation.enitity.source.dart';
import 'dart:async';

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
  dynamic _lastImpedanceStatus;
  bool _showReport = false;
  bool _showCamera = false;
  bool _socketReconnectFailed = false;
  final GlobalKey _videoWidgetKey = GlobalKey();
  VideoCallWidget? _videoWidget;

  Timer? _deviceEventDebounceTimer;
  CommunicationState? _lastEmittedDeviceState;
  bool _isCameraOpen = false;
  bool _lastEmittedR15cConnected = false;
  bool _lastEmittedRevo2Connected = false;

  static const Duration _deviceEventDebounceDuration = Duration(
    milliseconds: 500,
  );
  @override
  void initState() {
    super.initState();

    // Set up global error handler for camera-related crashes
    FlutterError.onError = (FlutterErrorDetails details) {
      final exceptionString = details.exception.toString();

      // Handle UVC camera related errors gracefully
      if (exceptionString.contains('UVCCamera') ||
          exceptionString.contains('flutter_uvc_camera') ||
          exceptionString.contains('cameraView has not been initialized') ||
          exceptionString.contains('SIGSEGV') ||
          exceptionString.contains('native method')) {
        di<ILogger>().error(
          '🚨 Caught camera-related error, handling gracefully: ${details.exception}',
        );

        // Try to safely reset camera state
        if (mounted) {
          try {
            setState(() {
              _showCamera = false;
              _isCameraOpen = false;
            });
            _updateCameraState(false);
          } catch (e) {
            di<ILogger>().error('Error resetting camera state: $e');
          }
        }
        return; // Don't crash the app
      }

      // For other errors, use default handling
      di<ILogger>().error('Flutter error: ${details.exception}');
      FlutterError.presentError(details);
    };

    _initializeScreen();
  }

  void _initializeScreen() {
    context.read<ConsultationCubit>().getCurrentConsultation();
    // Force device state check to ensure proper device detection
    try {
      di<DeviceCubit>().forceDeviceCheck();
      di<ILogger>().debug(
        'Force device check triggered on consultation screen init',
      );

      // Add a delayed check as well to handle timing issues
      Future.delayed(const Duration(seconds: 1), () {
        if (mounted) {
          try {
            di<DeviceCubit>().forceDeviceCheck();
            di<ILogger>().debug('Delayed force device check triggered');
          } catch (e) {
            di<ILogger>().error('Error in delayed force device check: $e');
          }
        }
      });
    } catch (e) {
      di<ILogger>().error('Error forcing device check: $e');
    }
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

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_isInitialized) {
      context.read<AuthCubit>().getCurrentUser();
      // Also trigger a device state refresh to ensure proper sync
      try {
        di<DeviceCubit>().forceDeviceCheck();
        di<ILogger>().debug(
          'Force device check triggered in didChangeDependencies',
        );
      } catch (e) {
        di<ILogger>().error(
          'Error forcing device check in didChangeDependencies: $e',
        );
      }
      _isInitialized = true;
    }
  }

  @override
  void dispose() {
    try {
      // Cancel debounce timer
      _deviceEventDebounceTimer?.cancel();

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
      _hasJoinedConsultation = false;
      _videoWidget = null;
    } catch (e) {
      di<ILogger>().error('Error in dispose: $e');
    }
    super.dispose();
  }

  void _setupSocket(String token) {
    try {
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
        'forceNew': true,
        'upgrade': false,
        'rememberUpgrade': false,
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

      // Send current device status when socket connects
      _forceDeviceEventEmission();
    });
    socket.onAny((event, data) {
      di<ILogger>().debug('Socket event: $event with data: $data');
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

    // Handle consultation join errors
    socket.on("error", (data) {
      ErrorHandler.handleSocketErrorData(context, data);
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

      // Send current device status when socket reconnects
      _forceDeviceEventEmission();
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

      di<ILogger>().info('👥 User joined consultation, sending device status');
      // Force emit device event immediately when user joins, regardless of state changes
      _forceEmitDeviceEvent(context.read<CommunicationCubit>().state);
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

            _storeConsultationDataInHive(consultationData);
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

    socket.on("otoscopy-started", (data) {
      if (!mounted) return;
      di<ILogger>().debug('Otoscopy started: $data');
      if (revo2Device != null) {
        setState(() {
          _showCamera = true;
        });
        _updateCameraState(true);
      } else {
        _showErrorSnackBar('Please Connect Video Otoscope');
      }
    });

    socket.on("otoscopy-stopped", (data) {
      if (!mounted) return;
      di<ILogger>().debug('Otoscopy stopped: $data');
      setState(() {
        _showCamera = false;
      });
      _updateCameraState(false);

      // Add a safety delay and then switch back to built-in camera
      // This handles the transition from UVC camera to built-in camera properly
      Future.delayed(const Duration(milliseconds: 5000), () {
        if (mounted) {
          try {
            // Wrap in a zone to catch any unhandled exceptions
            runZonedGuarded(
              () {
                final agoraCubit = context.read<AgoraCubit>();
                di<ILogger>().info(
                  '📷 Switching from UVC to built-in camera after otoscopy stop',
                );
                agoraCubit.switchToBuiltInCamera();
              },
              (error, stackTrace) {
                di<ILogger>().error(
                  '❌ Unhandled exception during camera switch: $error',
                );
                di<ILogger>().error('Stack trace: $stackTrace');
              },
            );
          } catch (e) {
            di<ILogger>().error('❌ Error switching to built-in camera: $e');
          }
        }
      });
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

    // Dispose of existing video widget if channel name changed
    if (_videoWidget != null && (_videoWidget!.channelName != channelName)) {
      di<ILogger>().debug('Channel name changed, disposing old video widget');
      // The widget will be properly disposed when it's removed from the widget tree
      _videoWidget = null;
    }

    if (_videoWidget == null) {
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
                  ErrorHandler.handleCentreError(context, error);
                },
                error: (error) {
                  ErrorHandler.handleAuthError(context, error);
                },
                loggedOut: () {
                  di<ILogger>().debug('Auth state: logged out');
                  // User has been logged out, should navigate away from consultation
                  if (mounted) {
                    Navigator.pushReplacementNamed(context, '/');
                  }
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
                // Trigger device event emission when consultation is loaded
                _forceDeviceEventEmission();
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
                ErrorHandler.handleConsultationError(context, state.message);
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

                  di<ILogger>().debug(
                    '🔍 Device state update - R15C: $wasConnected -> $isNowConnected, Revo2: $wasRevo2Connected -> $isNowRevo2Connected',
                  );
                  di<ILogger>().debug(
                    '📋 Total devices: ${devices.length}, R15C device: ${r15cDevice?.toString() ?? 'null'}, Revo2 device: ${revo2Device?.toString() ?? 'null'}',
                  );

                  // Update device references
                  this.r15cDevice = r15cDevice;
                  this.revo2Device = revo2Device;

                  // Handle R15C device state changes
                  if (wasConnected != isNowConnected) {
                    di<ILogger>().info(
                      isNowConnected
                          ? '🔌 R15C device attached'
                          : '🔌 R15C device detached',
                    );

                    // Reset communication state on detachment
                    if (!isNowConnected) {
                      context.read<CommunicationCubit>().resetState();
                    }
                  }

                  // Handle Revo2 device state changes
                  if (wasRevo2Connected != isNowRevo2Connected) {
                    di<ILogger>().info(
                      isNowRevo2Connected
                          ? '📷 Revo2 device attached - auto-showing camera'
                          : '📷 Revo2 device detached - hiding camera',
                    );

                    // Auto-show camera when Revo2 is connected with delay
                    if (isNowRevo2Connected && _showCamera) {
                      // Add delay before showing camera to ensure device is stable
                      Future.delayed(const Duration(seconds: 1), () {
                        if (mounted) {
                          setState(() {
                            _showReport =
                                false; // Hide report when showing camera
                          });
                          // Update camera state when auto-showing
                          _updateCameraState(true);
                        }
                      });
                    } else if (!isNowRevo2Connected && _showCamera) {
                      // Hide camera immediately when device is disconnected
                      di<ILogger>().info(
                        '📷 Revo2 device disconnected, hiding camera and reverting to full screen',
                      );
                      setState(() {
                        _showCamera = false;
                      });
                      // Update camera state when auto-hiding
                      _updateCameraState(false);
                    }
                  }

                  // Emit device event to socket
                  if (_isSocketInitialized) {
                    _scheduleDeviceEventEmission(
                      context.read<CommunicationCubit>().state,
                    );
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
              // Always emit patient response events
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

              // Enhanced device event emission for all communication state changes
              if (r15cDevice != null || revo2Device != null) {
                // Handle connection state - only try to initialize if device is actually connected
                if (!state.isConnected) {
                  di<ILogger>().debug(
                    'Device not connected, checking if device is still physically present...',
                  );
                  // Only attempt to reinitialize if the R15C device is actually still connected
                  // This prevents infinite loops when device is physically disconnected
                  if (r15cDevice != null &&
                      di<DeviceCubit>().state.maybeWhen(
                        success:
                            (devices, r15cDev, revo2Dev) => r15cDev != null,
                        orElse: () => false,
                      )) {
                    di<ILogger>().debug(
                      'R15C device still physically connected, initializing port...',
                    );
                    context.read<CommunicationCubit>().initializePort(
                      r15cDevice!,
                    );
                  } else {
                    di<ILogger>().debug(
                      'R15C device no longer physically connected, skipping port initialization',
                    );
                  }
                  _scheduleDeviceEventEmission(state);
                }
                // Handle initialization state
                else if (state.isConnected && !state.isSynced) {
                  di<ILogger>().debug(
                    'Device connected but not synced, sending sync packet...',
                  );
                  context.read<CommunicationCubit>().sendSyncPacket();
                  _scheduleDeviceEventEmission(state);
                }
                // Handle ready state
                else if (state.isSynced && state.transducerResponse == null) {
                  di<ILogger>().debug(
                    'Device synced but not ready, sending query info packet...',
                  );
                  context.read<CommunicationCubit>().sendQueryInfoPacket();
                  _scheduleDeviceEventEmission(state);
                }
                // Device is ready - send begin packet
                else if (state.transducerResponse != null) {
                  di<ILogger>().debug('Device ready with transducer response');
                  _handleBeginPacket(testType);
                  _scheduleDeviceEventEmission(state);
                }
              }

              // Handle error states
              if (state.error != null) {
                di<ILogger>().error('Device error: ${state.error}');

                // If error indicates device not found, clear the device reference to prevent loops
                if (state.error!.contains('No such device') &&
                    r15cDevice != null) {
                  di<ILogger>().info(
                    'Clearing R15C device reference due to device not found error',
                  );
                  r15cDevice = null;
                }

                _scheduleDeviceEventEmission(state);
              }

              // Additional triggers for any communication state change
              if (state.isConnected != _lastEmittedDeviceState?.isConnected ||
                  state.isSynced != _lastEmittedDeviceState?.isSynced ||
                  state.connectionStatus !=
                      _lastEmittedDeviceState?.connectionStatus ||
                  state.transducerResponse !=
                      _lastEmittedDeviceState?.transducerResponse) {
                di<ILogger>().debug(
                  'Communication state change detected, scheduling device event',
                );
                _scheduleDeviceEventEmission(state);
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

              if (_showCamera) {
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
                    Expanded(
                      flex: 1,
                      child:
                          ReleaseConfig.enableUVCCamera
                              ? UVCCameraWidget(
                                consultationId: consultation?.id ?? "",
                                onCameraStateChanged: _updateCameraState,
                              )
                              : Container(
                                decoration: BoxDecoration(
                                  color: Colors.black87,
                                ),
                                child: const Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.videocam_off,
                                        color: Colors.orange,
                                        size: 32,
                                      ),
                                      SizedBox(height: 12),
                                      Text(
                                        'Camera disabled in release mode',
                                        style: TextStyle(
                                          color: Colors.white70,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                    ),
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

  // Update camera state
  void _updateCameraState(bool isOpen) {
    if (_isCameraOpen != isOpen) {
      di<ILogger>().info(
        '📷 Camera state changed: ${_isCameraOpen} -> $isOpen',
      );
      setState(() {
        _isCameraOpen = isOpen;
        // If camera is closed, also hide the camera view to revert to full screen
        if (!isOpen) {
          _showCamera = false;
          di<ILogger>().info(
            '📷 Camera closed, hiding camera view and reverting to full screen',
          );
        }
      });

      // Handle automatic screen sharing based on camera state
      _handleAutomaticScreenSharing(isOpen);

      // Trigger device event emission with camera state change
      _scheduleDeviceEventEmission(context.read<CommunicationCubit>().state);
    }
  }

  // Handle automatic screen sharing based on UVC camera state
  void _handleAutomaticScreenSharing(bool cameraIsOpen) {
    if (!mounted) return;

    try {
      final agoraCubit = context.read<AgoraCubit>();

      if (cameraIsOpen) {
        // Start screen sharing when UVC camera opens
        if (!agoraCubit.isScreenSharing) {
          di<ILogger>().info(
            '📷🖥️ UVC camera opened - starting automatic screen sharing',
          );
          agoraCubit.toggleScreenSharing();
        }
      } else {
        // Stop screen sharing when UVC camera closes
        if (agoraCubit.isScreenSharing) {
          di<ILogger>().info(
            '📷🖥️ UVC camera closed - stopping automatic screen sharing',
          );
          agoraCubit.toggleScreenSharing();
        }
      }
    } catch (e) {
      di<ILogger>().error('❌ Error handling automatic screen sharing: $e');
    }
  }

  // Check if device state has meaningful changes
  bool _hasDeviceStateChanged(CommunicationState newState) {
    if (_lastEmittedDeviceState == null) {
      di<ILogger>().debug('First device state check - emitting');
      return true;
    }

    final last = _lastEmittedDeviceState!;
    final currentR15cConnected = r15cDevice != null;
    final currentRevo2Connected = revo2Device != null;

    final hasChanges =
        last.isConnected != newState.isConnected ||
        last.isSynced != newState.isSynced ||
        last.isReleased != newState.isReleased ||
        last.isInBeginMode != newState.isInBeginMode ||
        last.batteryLevel != newState.batteryLevel ||
        last.isCharging != newState.isCharging ||
        last.connectionStatus != newState.connectionStatus ||
        last.transducerResponse != newState.transducerResponse ||
        last.error != newState.error ||
        _isCameraOpen != newState.isCameraOpen ||
        _lastEmittedR15cConnected != currentR15cConnected ||
        _lastEmittedRevo2Connected != currentRevo2Connected;

    if (!hasChanges) {
      di<ILogger>().debug(
        'Device state check - no changes detected (R15C: ${_lastEmittedR15cConnected} -> $currentR15cConnected, Revo2: ${_lastEmittedRevo2Connected} -> $currentRevo2Connected, Camera: ${_isCameraOpen})',
      );
    } else {
      di<ILogger>().debug(
        'Device state check - changes detected (R15C: ${_lastEmittedR15cConnected} -> $currentR15cConnected, Revo2: ${_lastEmittedRevo2Connected} -> $currentRevo2Connected, Camera: ${_isCameraOpen})',
      );
    }

    return hasChanges;
  }

  // Force device event emission for any USB device-related event
  void _forceDeviceEventEmission() {
    if (_isSocketInitialized) {
      di<ILogger>().info(
        '🔧 Force triggering device event emission for USB event',
      );
      _scheduleDeviceEventEmission(context.read<CommunicationCubit>().state);
    }
  }

  // Force emit device event immediately without state change checks
  void _forceEmitDeviceEvent(CommunicationState state) {
    if (_isSocketInitialized) {
      di<ILogger>().info(
        '🚀 Force emitting device event immediately (bypassing state change checks)',
      );
      _emitDeviceEvent(state);
    } else {
      di<ILogger>().error(
        '❌ Cannot force emit device event - socket not initialized',
      );
    }
  }

  /*
   * USB Device Event Triggers for Device Status Updates:
   * 
   * 1. Device Attachment/Detachment (DeviceCubit listener)
   *    - R15C device connected/disconnected
   *    - Revo2 device connected/disconnected
   * 
   * 2. Communication State Changes (CommunicationCubit listener)
   *    - Device connection status changes
   *    - Device sync status changes
   *    - Device ready status changes
   *    - Error states
   *    - Any meaningful state change detected
   * 
   * 3. Camera State Changes
   *    - Camera opened/closed
   *    - Camera toggle button pressed
   *    - Auto-show/hide camera for Revo2
   * 
   * 4. Socket Events
   *    - Socket connected
   *    - Socket reconnected
   *    - User joined consultation
   * 
   * 5. Consultation Events
   *    - Consultation loaded successfully
   * 
   * 6. Manual Triggers
   *    - Begin packet sent
   *    - Force emission for any USB event
   * 
   * All events are debounced (500ms) and only emit if state has meaningful changes
   */

  // Schedule device event emission with debouncing
  void _scheduleDeviceEventEmission(CommunicationState state) {
    // Cancel existing timer
    _deviceEventDebounceTimer?.cancel();

    // Check if state has meaningful changes
    if (!_hasDeviceStateChanged(state)) {
      di<ILogger>().debug('Device state unchanged, skipping emission');
      return;
    }

    di<ILogger>().info(
      '⏰ Scheduling device event emission (debounced for ${_deviceEventDebounceDuration.inMilliseconds}ms)',
    );
    di<ILogger>().debug(
      '📋 State changes detected - Connected: ${state.isConnected}, Synced: ${state.isSynced}, Camera: $_isCameraOpen, R15C: ${r15cDevice != null}, Revo2: ${revo2Device != null}',
    );

    // Schedule new emission with debounce
    _deviceEventDebounceTimer = Timer(_deviceEventDebounceDuration, () {
      if (mounted && _isSocketInitialized) {
        _emitDeviceEvent(state);
      }
    });
  }

  void _emitDeviceEvent(CommunicationState state) {
    if (_isSocketInitialized) {
      String connectionStatus = "Disconnected";
      if (state.isInBeginMode) {
        connectionStatus = "begin";
      } else if (state.transducerResponse != null) {
        connectionStatus = "Ready";
      } else if (state.isConnected) {
        connectionStatus = "Connected";
      }

      // Create device event data with comprehensive status information
      final deviceEventData = {
        "consultationId": consultation?.id,
        "r15cConnected": r15cDevice != null,
        "revo2Connected": revo2Device != null,
        "connectionStatus": connectionStatus,
        "transducerResponse": state.transducerResponse,
        "isCameraOpen": _isCameraOpen,
        "showingCamera": _showCamera,
        "showingReport": _showReport,
        "deviceState": {
          "isConnected": state.isConnected,
          "isSynced": state.isSynced,
          "isReleased": state.isReleased,
          "isInBeginMode": state.isInBeginMode,
          "batteryLevel": state.batteryLevel,
          "isCharging": state.isCharging,
          "connectionStatus": state.connectionStatus,
          "error": state.error,
        },
        "tabletState": {
          "batterylevel": state.tabletBatteryLevel.toString(),
          "isCharging": state.isTabletBatteryCharging,
        },
        "timestamp": DateTime.now().toIso8601String(),
      };

      socket.emit("device_event", deviceEventData);

      // Update last emitted state
      _lastEmittedDeviceState = state.copyWith(isCameraOpen: _isCameraOpen);
      _lastEmittedR15cConnected = r15cDevice != null;
      _lastEmittedRevo2Connected = revo2Device != null;

      di<ILogger>().info('🚀 DEVICE EVENT EMITTED: $deviceEventData');
      di<ILogger>().info(
        '📊 Current state - R15C: ${r15cDevice != null}, Revo2: ${revo2Device != null}, Camera: $_isCameraOpen, Status: $connectionStatus',
      );
    } else {
      di<ILogger>().error(
        '❌ Cannot emit device event - socket not initialized',
      );
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
      _scheduleDeviceEventEmission(context.read<CommunicationCubit>().state);
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

  /// Stores the updated consultation data in the local Hive box for persistence
  void _storeConsultationDataInHive(
    ConsultationModelData consultationData,
  ) async {
    try {
      final consultationEntityDataSource = di<ConsultationEntityDataSource>();

      // Convert ConsultationModelData to ConsultationEntity for storage
      final consultationEntity = ConsultationEntity(
        id: consultationData.id,
        patientId: consultationData.patientId,
        audiologistId: consultationData.audiologistId,
        centreId: consultationData.centreId,
        patientStatus: consultationData.patientStatus,
        audiologistStatus: consultationData.audiologistStatus,
        audiometry: consultationData.audiometry,
        tympanometry: consultationData.tympanometry,
        oae: consultationData.oae,
        otoscopy: consultationData.otoscopy,
        notes: consultationData.notes,
        status: consultationData.status,
        createdAt: consultationData.createdAt,
        updatedAt: consultationData.updatedAt,
        patient: consultationData.patient,
        audiologist: consultationData.audiologist,
        centre: consultationData.centre,
        recordings: consultationData.recordings,
        consultationPricing: consultationData.consultationPricing,
      );

      // Store in Hive box
      await consultationEntityDataSource.addConsultationEntity(
        consultationEntity,
      );

      di<ILogger>().info(
        '💾 Consultation data stored in Hive box successfully',
      );
      di<ILogger>().debug('Stored consultation ID: ${consultationData.id}');
    } catch (e) {
      di<ILogger>().error('❌ Error storing consultation data in Hive: $e');
    }
  }
}
