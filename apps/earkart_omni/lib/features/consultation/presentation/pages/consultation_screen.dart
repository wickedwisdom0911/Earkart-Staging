import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.state.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/video_call_widget.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/socket_status_button.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/consultation_layout.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/consultation_loading_view.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/consultation_ended_screen.dart';
import 'package:earkart_omni/features/consultation/services/device_event_emitter.dart';
import 'package:earkart_omni/models/communication/enums.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/consultation/consultation.model.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:usb_serial_kotlin/usb_serial_kotlin.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
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
  dynamic _lastDpoaeStatus;
  dynamic _lastDpoaeData;
  bool? _lastPatientResponse;
  bool _showCamera = false;
  bool _socketReconnectFailed = false;
  final GlobalKey _videoWidgetKey = GlobalKey();
  VideoCallWidget? _videoWidget;
  final VideoCallController _videoController = VideoCallController();
  bool _hasEmittedEndCall = false;
  bool _endCallInProgress = false;

  bool _isCameraOpen = false;
  DeviceEventEmitter? _deviceEventEmitter;
  Timer? _stateUpdateDebounceTimer;
  bool _consultationCompletionHandled = false;
  Timer? _completionTimeoutTimer;
  ConsultationEndedBy? _consultationEndedBy;
  bool _isCheckingInitialStatus = false;

  @override
  void initState() {
    super.initState();
    _initializeScreen();
  }

  void _initializeScreen() {
    context.read<ConsultationCubit>().getCurrentConsultation();
  }

  void _showErrorSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(Icons.error_outline, color: Colors.white, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.red.shade600,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 4),
        elevation: 6,
      ),
    );
  }

  void _showSuccessSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(Icons.check_circle_outline, color: Colors.white, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.green.shade600,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 3),
        elevation: 6,
      ),
    );
  }

  void _showWarningSnackBar(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.white, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.orange.shade600,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        margin: const EdgeInsets.all(16),
        duration: const Duration(seconds: 4),
        elevation: 6,
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
      _stateUpdateDebounceTimer?.cancel();
      _completionTimeoutTimer?.cancel();
      _deviceEventEmitter?.dispose();

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

      // Initialize device event emitter
      _deviceEventEmitter = DeviceEventEmitter(
        socket: socket,
        getCommunicationState: () => context.read<CommunicationCubit>().state,
        getConsultation: () => consultation,
        getR15cDevice: () => r15cDevice,
        getRevo2Device: () => revo2Device,
        getIsCameraOpen: () => _isCameraOpen,
        getShowCamera: () => _showCamera,
      );

      // Set up socket event handlers
      _setupSocketEventHandlers();
    } catch (e) {
      di<ILogger>().error('Error setting up socket: $e');
      if (mounted) {
        _showErrorSnackBar(
          'Unable to connect to server. Please check your connection and try again.',
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
      _deviceEventEmitter?.forceEmitDeviceEvent();
    });
    socket.onAny((event, data) {
      di<ILogger>().debug('Socket event: $event with data: $data');
    });
    socket.onDisconnect((_) {
      if (!mounted) return;
      di<ILogger>().debug('Socket disconnected');
      // Immediately update state to show disconnected status
      setState(() {
        _isSocketInitialized = false;
        _socketReconnectFailed =
            false; // Reset reconnect failed flag on disconnect
        _hasJoinedConsultation = false; // Reset join status on disconnect
      });
    });

    socket.onError((error) {
      di<ILogger>().error('Socket error: $error');
      if (mounted) {
        _showErrorSnackBar(
          'Connection error occurred. Please check your internet connection.',
        );
      }
    });

    // Handle consultation join errors
    socket.on("error", (data) {
      if (!mounted) return;
      ErrorHandler.handleSocketErrorData(context, data);
    });

    socket.onConnectError((error) {
      di<ILogger>().error('Socket connection error: $error');
      if (mounted) {
        _showErrorSnackBar('Failed to establish connection. Please try again.');
      }
    });

    socket.onReconnect((_) {
      if (!mounted) return;
      di<ILogger>().debug('Socket reconnected');
      setState(() {
        _isSocketInitialized = true;
        _socketReconnectFailed = false; // Reset reconnect failed flag
      });
      _showSuccessSnackBar('Connection restored successfully');
      _tryJoinConsultation(); // Try to rejoin on reconnect

      // Send current device status when socket reconnects
      _deviceEventEmitter?.forceEmitDeviceEvent();
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
        _showWarningSnackBar(
          'Unable to reconnect to server. Please check your internet connection and tap Retry.',
        );
      }
    });

    socket.on("user_joined", (data) {
      if (!mounted) return;

      di<ILogger>().info('👥 User joined consultation, sending device status');
      // Defer device event emission until after consultation is set to ensure ID is present

      if (data == null) {
        di<ILogger>().debug('Received null data in user_joined event');
        // Fallback: attempt a delayed emit so device state/consultation can settle
        Future.delayed(const Duration(milliseconds: 300), () {
          if (mounted && _isSocketInitialized) {
            _deviceEventEmitter?.forceEmitDeviceEvent();
            _handleBeginPacket(testType);
          }
        });
        return;
      }
      try {
        if (data['user'] != null) {
          try {
            final consultationData = ConsultationModelData.fromJson(
              data['user'],
            );
            setState(() {
              consultation = consultationData;
            });

            _storeConsultationDataInHive(consultationData);

            // Now that consultation ID is available, emit device event immediately
            _deviceEventEmitter?.forceEmitDeviceEvent();
            _handleBeginPacket(testType);
          } catch (e) {
            di<ILogger>().error('Failed to parse consultation data');
            // Best-effort emit even if parsing failed
            Future.delayed(const Duration(milliseconds: 300), () {
              if (mounted && _isSocketInitialized) {
                _deviceEventEmitter?.forceEmitDeviceEvent();
                _handleBeginPacket(testType);
              }
            });
          }
        }
      } catch (e) {
        di<ILogger>().error('Error handling user_joined event: $e');
        // Attempt a delayed best-effort emit on error
        Future.delayed(const Duration(milliseconds: 300), () {
          if (mounted && _isSocketInitialized) {
            _deviceEventEmitter?.forceEmitDeviceEvent();
            _handleBeginPacket(testType);
          }
        });
      }
    });

    socket.on("start-test", (data) {
      if (!mounted) return;

      di<ILogger>().debug('Start test: $data');
      if (data["testId"] != null) {
        // Only send to device if it is actually connected
        final comm = context.read<CommunicationCubit>().state;
        if (comm.isConnected) {
          context.read<CommunicationCubit>().sendStopCommand();
        } else {
          di<ILogger>().warning('Skipping stop command; device not connected');
        }
        setState(() {
          testType =
              data["testId"] == "pure-tone"
                  ? data["testId"] == "OAE"
                      ? TestType.OAE
                      : TestType.Impedance
                  : TestType.PTA;
        });
        _handleBeginPacket(testType);
      }
    });

    socket.on("user_left", (data) {
      if (!mounted) return;
      di<ILogger>().debug('User left: $data');
    });
    socket.on("masking-signal", (data) {
      if (!mounted) return;
      di<ILogger>().debug('Masking signal: $data');
      context.read<CommunicationCubit>().sendMaskingPacket(
        frequency: data["frequency"],
        level: data["level"],
        signal: data["signal"],
        earSide: data["earSide"] == "L" ? EarSide.Left : EarSide.Right,
      );
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
    socket.on("etf-started", (data) {
      if (!mounted) return;
      di<ILogger>().debug('Start ETF: $data');
      try {
        if (data == null) {
          di<ILogger>().error('Received null data in start-etf event');
          return;
        }
        context.read<CommunicationCubit>().sendStartETFPacket(
          probeToneFrequency: data["ProbeToneFrequency"],
          autoSpeed: data["AutoSpeed"],
          speed: data["Speed"],
          start: data["Start"],
          stop: data["Stop"],
        );
      } catch (e) {
        di<ILogger>().error('Error handling start-etf event: $e');
      }
    });
    socket.on("etf-resumed", (data) {
      if (!mounted) return;
      di<ILogger>().debug('ETF resumed: $data');
      try {
        if (data == null) {
          di<ILogger>().error('Received null data in etf-resumed event');
          return;
        }
        context.read<CommunicationCubit>().sendResumePacket();
      } catch (e) {
        di<ILogger>().error('Error handling stop-etf event: $e');
      }
    });
    socket.on("etf-stopped", (data) {
      if (!mounted) return;
      di<ILogger>().debug('ETF stopped: $data');
      try {
        if (data == null) {
          di<ILogger>().error('Received null data in stop-etf event');
          return;
        }
        context.read<CommunicationCubit>().sendStopPacket();
      } catch (e) {
        di<ILogger>().error('Error handling stop-etf event: $e');
      }
    });
    socket.on("tonedecay-started", (data) {
      if (!mounted) return;
      di<ILogger>().debug('Tonedecay start: $data');
      try {
        if (data == null) {
          di<ILogger>().error('Received null data in tonedecay-started event');
          return;
        }
        context.read<CommunicationCubit>().sendStatePacket(
          frequency: data["frequency"],
          level: data["level"],
          signal: true,
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
        );
      } catch (e) {
        di<ILogger>().error('Error handling tonedecay-started event: $e');
      }
    });
    socket.on("tonedecay-stopped", (data) {
      if (!mounted) return;
      di<ILogger>().debug('Tonedecay stop: $data');
      try {
        if (data == null) {
          di<ILogger>().error('Received null data in tonedecay-stopped event');
          return;
        }
        context.read<CommunicationCubit>().sendStatePacket(
          frequency: data["frequency"],
          level: data["level"],
          signal: false,
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
        );
      } catch (e) {
        di<ILogger>().error('Error handling tonedecay-stopped event: $e');
      }
    });
    socket.on("reflexes-started", (data) {
      if (!mounted) return;
      di<ILogger>().debug('Start reflex: $data');
      try {
        if (data == null) {
          di<ILogger>().error('Received null data in reflexes-started event');
          return;
        }
        context.read<CommunicationCubit>().sendStartReflexPacket(
          isContra: data["isContralateral"],
          level: data["level"],
          step: data["step"],
          stopWhenFound: data["stopWhenFound"],
          quick: data["quick"],
          stimulusDuration: data["stimulusDuration"],
          contraTransducerID: data["contraTransducerID"],
          deflectionThreshold: data["deflectionThreshold"],
        );
      } catch (e) {
        di<ILogger>().error('Error handling reflexes-started event: $e');
      }
    });
    socket.on("reflexes-stopped", (data) {
      if (!mounted) return;
      di<ILogger>().debug('Reflexes stopped: $data');
      try {
        if (data == null) {
          di<ILogger>().error('Received null data in reflexes-stopped event');
          return;
        }
        context.read<CommunicationCubit>().sendStopPacket();
      } catch (e) {
        di<ILogger>().error('Error handling reflexes-stopped event: $e');
      }
    });
    socket.on("dpoae-started", (data) {
      if (!mounted) return;
      di<ILogger>().debug('DPOAE started: $data');
      try {
        if (data == null) {
          di<ILogger>().error('Received null data in dpoae-started event');
          return;
        }
        // Convert frequencies from List<dynamic> to List<Map<String, dynamic>>
        final frequenciesList = data["frequencies"] as List<dynamic>;
        final frequencies =
            frequenciesList.map((e) => e as Map<String, dynamic>).toList();

        context.read<CommunicationCubit>().sendStartDpOaePacket(
          realTimeStatusUpdateDuringExecution:
              data["realTimeStatusUpdateDuringExecution"],
          timeoutTime: data["timeoutTime"],
          timeoutAuto: data["timeoutAuto"],
          stimulusLevelL2: data["stimulusLevelL2"],
          stimulusLevelL1: data["stimulusLevelL1"],
          stimulusLevelAuto: data["stimulusLevelAuto"],
          artefactLevel: data["artefactLevel"],
          retest: data["retest"],
          frequencies: frequencies,
          numberPass: data["numberPass"],
          skipEarVolumeCheck: data["skipEarVolumeCheck"],
          stopOnPass: data["stopOnPass"],
          invertedFrequencyOrder: data["invertedFrequencyOrder"],
          minimumSignalThreshold: data["minimumSignalThreshold"],
        );
      } catch (e) {
        di<ILogger>().error('Error handling dpoae-started event: $e');
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

    socket.on("otoscopy-started", (data) {
      if (!mounted) return;
      di<ILogger>().debug('Otoscopy started: $data');
      if (revo2Device != null) {
        setState(() {
          _showCamera = true;
        });
        _updateCameraState(true);
      } else {
        _showWarningSnackBar(
          'Please connect the video otoscope device to continue.',
        );
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

    socket.on("end:consultation", (data) {
      if (!mounted) return;
      di<ILogger>().debug('End consultation event received: $data');

      // Prevent duplicate handling
      if (_endCallInProgress || _consultationCompletionHandled) {
        di<ILogger>().debug(
          'End call already in progress or completed, ignoring duplicate event',
        );
        return;
      }

      // Mark that we've received/processed the end consultation event
      _endCallInProgress = true;
      _hasEmittedEndCall = true;
      _consultationEndedBy = ConsultationEndedBy.audiologist;

      // Don't call updateConsultation API here - audiologist already handled it on their side
      // Just handle completion and cleanup
      _handleConsultationCompletion();
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

      // Add delay for release mode to ensure proper widget initialization
      if (ReleaseConfig.isReleaseMode) {
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) {
            di<ILogger>().debug(
              'Delayed video widget initialization for release mode',
            );
          }
        });
      }

      _videoWidget = VideoCallWidget(
        key: _videoWidgetKey,
        channelName: channelName,
        consultationId: consultationId,
        controller: _videoController,
        onEndCall: _onEndCallPressed,
        onLeaveChannel: () {
          // This will be called when the video channel is left
          di<ILogger>().debug('Video channel left successfully');
        },
      );
    }
    return _videoWidget!;
  }

  Future<void> _onEndCallPressed() async {
    if (_endCallInProgress) {
      di<ILogger>().debug('End call already in progress, ignoring duplicate');
      return;
    }
    final String? consultationId = consultation?.id;
    if (consultationId == null || consultationId.isEmpty) {
      di<ILogger>().error('Cannot end call: missing consultationId');
      _showErrorSnackBar('Cannot end consultation: missing ID');
      return;
    }

    _endCallInProgress = true;
    _consultationEndedBy = ConsultationEndedBy.user; // User ended the call
    try {
      // Emit socket event immediately on button press
      if (_isSocketInitialized && !_hasEmittedEndCall) {
        socket.emit("end:consultation", {"consultationId": consultationId});
        _hasEmittedEndCall = true;
      }

      // Update consultation status - this will trigger BlocListener which calls _handleConsultationCompletion
      // Don't leave channel here to avoid duplicate leaveChannel calls
      context.read<ConsultationCubit>().updateConsultation(
        ConsultationEntity(id: consultationId, status: SessionStatus.completed),
      );

      // Set a timeout fallback in case BlocListener doesn't fire
      _completionTimeoutTimer?.cancel();
      _completionTimeoutTimer = Timer(const Duration(seconds: 5), () {
        if (mounted && !_consultationCompletionHandled && _endCallInProgress) {
          di<ILogger>().warning(
            'BlocListener did not fire within timeout, handling completion directly',
          );
          _handleConsultationCompletion();
        }
      });
    } catch (e) {
      di<ILogger>().error('Error ending consultation: $e');
      // If updateConsultation throws an exception, handle completion directly
      if (_endCallInProgress && !_consultationCompletionHandled) {
        di<ILogger>().warning(
          'updateConsultation threw exception, handling completion directly',
        );
        _handleConsultationCompletion();
      } else {
        // Reset flag on error so user can retry
        _endCallInProgress = false;
        if (mounted) {
          _showErrorSnackBar('Failed to end consultation. Please try again.');
        }
      }
    }
    // Note: Don't reset _endCallInProgress here - let _handleConsultationCompletion() handle it
    // This prevents race conditions between socket handler and BlocListener
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GlassmorphismAppBar(
        title: Text(
          consultation?.audiologist?.user?.name != null
              ? "Consultation by ${consultation!.audiologist!.user!.name}"
              : "Consultation by Earkart (Waiting for Audiologist)",
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        actions: [
          // Socket status button
          SocketStatusButton(
            isSocketInitialized: _isSocketInitialized,
            socketReconnectFailed: _socketReconnectFailed,
            onRetry: _manualReconnect,
            onShowMessage: _showErrorSnackBar,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: MultiBlocListener(
        listeners: [
          BlocListener<AgoraCubit, AgoraState>(
            listener: (context, state) {
              state.mapOrNull(
                success: (s) {
                  if (s.remoteUid != null) {
                    if (_isSocketInitialized) {
                      if ((consultation?.id ?? '').isNotEmpty) {
                        _deviceEventEmitter?.forceEmitDeviceEvent();
                      } else {
                        Future.delayed(const Duration(milliseconds: 300), () {
                          if (mounted &&
                              _isSocketInitialized &&
                              (consultation?.id ?? '').isNotEmpty) {
                            _deviceEventEmitter?.forceEmitDeviceEvent();
                          }
                        });
                      }
                    } else {
                      di<ILogger>().warning(
                        'Socket not initialized on Agora join; skipping device emit',
                      );
                    }
                  }
                },
              );
            },
          ),
          BlocListener<AuthCubit, AuthState>(
            listener: (context, state) {
              state.when(
                initial: () {
                  context.read<AuthCubit>().getCurrentUser();
                },
                loading: () {},
                success: (user) {
                  if (user?.token != null) {
                    _setupSocket(user!.token!);
                  } else {}
                },
                centreSuccess: (centre) {},
                centreError: (error) {
                  ErrorHandler.handleCentreError(context, error);
                },
                error: (error) {
                  ErrorHandler.handleAuthError(context, error);
                },
                loggedOut: () {
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

                // Check if consultation is already completed by fetching latest status from server
                if (state.consultation.id != null &&
                    state.consultation.id!.isNotEmpty) {
                  _isCheckingInitialStatus = true;
                  di<ILogger>().debug(
                    'ConsultationScreen: Fetching latest consultation status from server',
                  );
                  context.read<ConsultationCubit>().getConsultationById(
                    state.consultation.id!,
                  );
                } else {
                  // If no ID, proceed with normal flow
                  _tryJoinConsultation();
                  _deviceEventEmitter?.forceEmitDeviceEvent();
                }
              }
              // Handle consultation update success (from both updateConsultation and getConsultationById)
              if (state is ConsultationSuccess) {
                di<ILogger>().debug(
                  'ConsultationScreen: Consultation success - status: ${state.consultation.status}',
                );

                // Update local consultation reference
                setState(() {
                  consultation = state.consultation;
                });

                // Check if consultation is completed
                if (state.consultation.status == SessionStatus.completed) {
                  // If we're checking initial status and consultation is already completed,
                  // navigate to ended screen without showing success message
                  if (_isCheckingInitialStatus) {
                    di<ILogger>().debug(
                      'ConsultationScreen: Consultation already completed on server, navigating to ended screen',
                    );
                    _isCheckingInitialStatus = false;
                    if (!mounted) return;

                    // Set ended by as audiologist since it was completed before user joined
                    _consultationEndedBy = ConsultationEndedBy.audiologist;
                    _handleConsultationCompletion();
                  } else {
                    // Normal completion flow (user or audiologist ended during session)
                    di<ILogger>().debug(
                      'ConsultationScreen: Consultation completed, calling _handleConsultationCompletion',
                    );
                    if (!mounted) return;
                    _showSuccessSnackBar('Consultation completed successfully');

                    // Leave the channel and clear data
                    _handleConsultationCompletion();
                  }
                } else {
                  // Consultation is not completed, proceed with normal flow
                  if (_isCheckingInitialStatus) {
                    di<ILogger>().debug(
                      'ConsultationScreen: Consultation is active, proceeding with normal flow',
                    );
                    _isCheckingInitialStatus = false;
                    _tryJoinConsultation();
                    // Trigger device event emission when consultation is loaded
                    _deviceEventEmitter?.forceEmitDeviceEvent();
                  }
                }
              }
              // Handle consultation update error
              if (state is ConsultationError) {
                // If we were checking initial status and getConsultationById failed,
                // proceed with normal flow using the consultation from getCurrentConsultation
                if (_isCheckingInitialStatus) {
                  di<ILogger>().warning(
                    'ConsultationScreen: Failed to fetch latest consultation status, proceeding with cached consultation',
                  );
                  _isCheckingInitialStatus = false;
                  // Proceed with normal flow using the consultation we already have
                  if (consultation?.id != null &&
                      consultation!.id!.isNotEmpty) {
                    _tryJoinConsultation();
                    _deviceEventEmitter?.forceEmitDeviceEvent();
                  }
                } else {
                  ErrorHandler.handleConsultationError(context, state.message);
                }

                // If we were trying to complete the consultation, handle it anyway
                // This ensures cleanup happens even if the API call fails
                if (_endCallInProgress && !_consultationCompletionHandled) {
                  di<ILogger>().warning(
                    'Consultation update failed but end call was in progress, handling completion anyway',
                  );
                  _handleConsultationCompletion();
                }
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
                    _deviceEventEmitter?.scheduleDeviceEventEmission();
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
            // Only listen when state actually changes significantly to reduce rebuilds
            listenWhen: (previous, current) {
              return previous.isConnected != current.isConnected ||
                  previous.isSynced != current.isSynced ||
                  previous.transducerResponse != current.transducerResponse ||
                  previous.error != current.error ||
                  previous.impedanceStatus != current.impedanceStatus ||
                  (current.isNewImpedanceData &&
                      current.impedanceData != null) ||
                  previous.dpoaeStatus != current.dpoaeStatus ||
                  previous.dpoaeData != current.dpoaeData ||
                  previous.patientResponse != current.patientResponse ||
                  previous.isInBeginMode != current.isInBeginMode ||
                  previous.connectionStatus != current.connectionStatus;
            },
            listener: (context, state) {
              if (!mounted) return;

              // Process immediate events (patient response, impedance)
              // Emit patient-response only when button is pressed (true)
              if (state.patientResponse == true) {
                _emitPatientResponseEvent(state.patientResponse);
              }

              // Emit patient-response-tonedecay for both true and false (press and release)
              if (_lastPatientResponse != state.patientResponse) {
                _emitPatientResponseTonedecayEvent(state.patientResponse);
                _lastPatientResponse = state.patientResponse;
              }

              // Handle impedance status
              if (state.impedanceStatus != null &&
                  state.impedanceStatus != _lastImpedanceStatus) {
                _emitTympanometryStatus(state);
              }

              // Only emit impedance data if it's a new data event
              if (state.impedanceData != null && state.isNewImpedanceData) {
                _emitTympanometryData(state);
              }

              // Handle DPOAE status
              if (state.dpoaeStatus != null &&
                  state.dpoaeStatus != _lastDpoaeStatus) {
                _emitDpoaeStatus(state);
              }

              // Emit DPOAE data when it changes
              if (state.dpoaeData != null &&
                  state.dpoaeData != _lastDpoaeData) {
                _emitDpoaeData(state);
              }

              // Debounce device connection logic to prevent excessive processing
              _stateUpdateDebounceTimer?.cancel();
              _stateUpdateDebounceTimer = Timer(
                const Duration(milliseconds: 100),
                () {
                  if (!mounted) return;
                  _processDeviceConnectionState(state);
                },
              );
            },
          ),
          // Separate optimized listener for device connection state
          BlocListener<CommunicationCubit, CommunicationState>(
            listenWhen: (previous, current) {
              // Only listen for connection-related changes
              return previous.isConnected != current.isConnected ||
                  previous.isSynced != current.isSynced ||
                  previous.transducerResponse != current.transducerResponse ||
                  previous.error != current.error ||
                  previous.connectionStatus != current.connectionStatus;
            },
            listener: (context, state) {
              if (!mounted) return;
              _processDeviceConnectionState(state);
            },
          ),
          // Removed UVCCameraCubit BlocListener - camera is now managed by the widget
        ],
        child: BlocBuilder<ConsultationCubit, ConsultationState>(
          builder: (context, state) {
            di<ILogger>().debug(
              'ConsultationScreen: BlocBuilder state: $state',
            );

            // Prefer consultation ID from state when available; otherwise fall back to
            // the locally stored consultation set via socket events.
            final String? currentConsultationId =
                (state is CurrentConsultationSuccess)
                    ? state.consultation.id
                    : consultation?.id;

            if ((currentConsultationId ?? '').isNotEmpty) {
              if (state is CurrentConsultationSuccess) {
                di<ILogger>().debug(
                  'ConsultationScreen: BlocBuilder - consultation ID: ${state.consultation.id}',
                );
              } else {
                di<ILogger>().debug(
                  'ConsultationScreen: Using stored consultation ID: $currentConsultationId',
                );
              }

              final videoWidget = _getVideoWidget(currentConsultationId!);

              return ConsultationLayout(
                videoWidget: videoWidget,
                showCamera: _showCamera,
                consultationId: consultation?.id,
                onCameraStateChanged: _updateCameraState,
              );
            }
            return const ConsultationLoadingView();
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
      _deviceEventEmitter?.scheduleDeviceEventEmission();
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

  void _handleBeginPacket(TestType? testType) {
    if (!mounted) return;

    if (r15cDevice != null &&
        context.read<CommunicationCubit>().state.isConnected &&
        context.read<CommunicationCubit>().state.transducerResponse != null) {
      di<ILogger>().debug('Sending begin packet for test type: $testType');
      context.read<CommunicationCubit>().sendBeginPacket(
        testType ?? TestType.PTA,
      );
      _deviceEventEmitter?.scheduleDeviceEventEmission();
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

  void _emitDpoaeStatus(CommunicationState state) {
    if (_isSocketInitialized &&
        state.dpoaeStatus != null &&
        state.dpoaeStatus != _lastDpoaeStatus) {
      di<ILogger>().debug('Emitting DPOAE status: ${state.dpoaeStatus}');
      socket.emit("dpoae-status", {
        "consultationId": consultation?.id,
        "dpoaeStatus": state.dpoaeStatus,
      });
      _lastDpoaeStatus = state.dpoaeStatus;
    }
  }

  void _emitDpoaeData(CommunicationState state) {
    if (_isSocketInitialized &&
        state.dpoaeData != null &&
        state.dpoaeData != _lastDpoaeData) {
      di<ILogger>().debug('Emitting DPOAE data: ${state.dpoaeData}');
      socket.emit("dpoae-data", {
        "consultationId": consultation?.id,
        "dpoaeData": state.dpoaeData,
      });
      _lastDpoaeData = state.dpoaeData;
    }
  }

  // Process device connection state changes (debounced to prevent excessive processing)
  void _processDeviceConnectionState(CommunicationState state) {
    if (!mounted) return;

    // Enhanced device event emission for all communication state changes
    if (r15cDevice != null || revo2Device != null) {
      // Handle connection state - only try to initialize if device is actually connected
      if (!state.isConnected) {
        if (!mounted) return;

        // Don't try to reinitialize if connectionStatus is 'Disconnected'
        // This indicates an intentional reset (e.g., during device detachment)
        // Only attempt reconnection for 'Error' states that might be recoverable
        if (state.connectionStatus == 'Disconnected') {
          di<ILogger>().debug(
            'Device intentionally disconnected (resetState), skipping port initialization',
          );
          _deviceEventEmitter?.scheduleDeviceEventEmission();
          return;
        }

        // Don't try to reinitialize if error indicates device is physically gone
        final error = state.error;
        final isDeviceGoneError =
            error != null &&
            (error.contains('No such device') ||
                error.contains('device not found') ||
                error.contains('deviceId'));

        if (isDeviceGoneError) {
          di<ILogger>().debug(
            'Device error indicates physical disconnection, skipping port initialization',
          );
          _deviceEventEmitter?.scheduleDeviceEventEmission();
          return;
        }

        di<ILogger>().debug(
          'Device not connected, checking if device is still physically present...',
        );

        // Get current device state synchronously to avoid race conditions
        final currentDeviceState = di<DeviceCubit>().state;
        final isDeviceStillPresent = currentDeviceState.maybeWhen(
          success: (devices, r15cDev, revo2Dev) {
            // Double-check: verify device is actually in the devices list
            if (r15cDev == null) return false;
            // Verify the device reference matches one in the current list
            return devices.any(
              (d) =>
                  d.deviceId == r15cDev.deviceId &&
                  d.vid == r15cDev.vid &&
                  d.pid == r15cDev.pid,
            );
          },
          orElse: () => false,
        );

        // Only attempt to reinitialize if the R15C device is actually still connected
        // This prevents infinite loops when device is physically disconnected
        if (r15cDevice != null && isDeviceStillPresent) {
          if (!mounted) return;
          di<ILogger>().debug(
            'R15C device still physically connected, initializing port...',
          );
          context.read<CommunicationCubit>().initializePort(r15cDevice!);
        } else {
          di<ILogger>().debug(
            'R15C device no longer physically connected, skipping port initialization',
          );
        }
        _deviceEventEmitter?.scheduleDeviceEventEmission();
      }
      // Handle initialization state
      else if (state.isConnected && !state.isSynced) {
        if (!mounted) return;
        di<ILogger>().debug(
          'Device connected but not synced, sending sync packet...',
        );
        context.read<CommunicationCubit>().sendSyncPacket();
        _deviceEventEmitter?.scheduleDeviceEventEmission();
      }
      // Handle ready state
      else if (state.isSynced && state.transducerResponse == null) {
        if (!mounted) return;
        di<ILogger>().debug(
          'Device synced but not ready, sending query info packet...',
        );
        context.read<CommunicationCubit>().sendQueryInfoPacket();
        _deviceEventEmitter?.scheduleDeviceEventEmission();
      }
      // Device is ready - send begin packet
      else if (state.transducerResponse != null) {
        di<ILogger>().debug('Device ready with transducer response');
        _handleBeginPacket(testType);
        _deviceEventEmitter?.scheduleDeviceEventEmission();
      }
    }

    // Handle error states
    if (state.error != null) {
      di<ILogger>().error('Device error: ${state.error}');

      // If error indicates device not found, clear the device reference to prevent loops
      if (state.error!.contains('No such device') && r15cDevice != null) {
        di<ILogger>().info(
          'Clearing R15C device reference due to device not found error',
        );
        r15cDevice = null;
      }

      _deviceEventEmitter?.scheduleDeviceEventEmission();
    }

    // Additional triggers for any communication state change
    _deviceEventEmitter?.scheduleDeviceEventEmission();
  }

  _emitPatientResponseEvent(bool isReleased) {
    if (!mounted || !_isSocketInitialized) return;

    socket.emit("patient-response", {
      "consultationId": consultation?.id,
      "patientResponse": isReleased,
    });
  }

  void _emitPatientResponseTonedecayEvent(bool isPressed) {
    if (!mounted || !_isSocketInitialized) return;

    socket.emit("patient-response-tonedecay", {
      "consultationId": consultation?.id,
      "patientResponse": isPressed,
    });
  }

  void _handleConsultationCompletion() async {
    // Idempotency check: prevent duplicate processing
    if (_consultationCompletionHandled) {
      di<ILogger>().debug(
        'Consultation completion already handled, ignoring duplicate call',
      );
      return;
    }

    _consultationCompletionHandled = true;
    // Cancel any pending timeout since we're handling completion now
    _completionTimeoutTimer?.cancel();
    _completionTimeoutTimer = null;

    try {
      // Ensure we leave the Agora video call channel and stop token monitoring
      try {
        final agoraCubit = context.read<AgoraCubit>();
        await agoraCubit.leaveChannel();
        agoraCubit.stopTokenRenewalMonitoring();
      } catch (e) {
        di<ILogger>().error('Error leaving Agora channel on completion: $e');
      }

      // Leave the consultation channel via socket (if not already emitted)
      if (_isSocketInitialized &&
          consultation?.id != null &&
          !_hasEmittedEndCall) {
        socket.emit("end:consultation", {"consultationId": consultation?.id});
        _hasEmittedEndCall = true;
      }

      // Clear patient and consultation data
      context.read<PatientCubit>().deletePatientSession();
      context.read<ConsultationCubit>().deleteCurrentConsultationSession();

      // Reset flags before navigation
      _endCallInProgress = false;

      // Always navigate to consultation ended screen with appropriate parameter
      if (mounted) {
        Navigator.pushReplacementNamed(
          context,
          ConsultationEndedScreen.routeName,
          arguments: _consultationEndedBy ?? ConsultationEndedBy.audiologist,
        );
        _consultationEndedBy = null; // Reset after navigation
      }
    } catch (e) {
      di<ILogger>().error('Error handling consultation completion: $e');
      // Reset flag on error so user can retry if navigation fails
      _endCallInProgress = false;
      _consultationEndedBy = null;
      if (mounted) {
        _showErrorSnackBar(
          'Failed to complete consultation. Please try again.',
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
