import 'dart:async';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.cubit.dart';
import 'package:earkart_omni/features/network/presentation/cubit/network.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/pages/consultation_screen.dart';
import 'package:earkart_omni/features/device/presentation/cubit/device_registration.cubit.dart';
import 'package:earkart_omni/features/device/presentation/cubit/device_registration.state.dart';
import 'package:earkart_omni/features/device/presentation/pages/device_registration_screen.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:earkart_omni/models/user/user.entity.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.state.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.state.dart';
import 'package:earkart_omni/features/home/presentation/pages/home_screen.dart';
import 'package:earkart_omni/features/consultation/presentation/pages/consultation_request_screen.dart';
import 'package:earkart_omni/features/auth/presentation/pages/login_screen.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:earkart_omni/config/services/device_owner_helper.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/config/release_config.dart';
import 'package:earkart_omni/config/widgets/app_loading_screen.dart';
import 'package:earkart_omni/config/utils/error_handler.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';

class RootScreen extends StatefulWidget {
  static const routeName = '/';
  const RootScreen({super.key});

  @override
  State<RootScreen> createState() => _RootScreenState();
}

class _RootScreenState extends State<RootScreen> with WidgetsBindingObserver {
  // Consolidated loading state
  final Map<String, bool> _checkedFlags = {
    'device': false,
    'user': false,
    'centre': false,
    'patient': false,
    'consultation': false,
  };

  UserEntity? user;
  CentreEntity? centre;
  PatientEntity? patient;
  ConsultationEntity? consultation;
  DeviceEntity? device;

  Timer? _loadingTimeoutTimer;

  // Helper getters for cleaner code
  bool get _isDeviceChecked => _checkedFlags['device']!;
  bool get _isUserChecked => _checkedFlags['user']!;
  bool get _isCentreChecked => _checkedFlags['centre']!;
  bool get _isPatientChecked => _checkedFlags['patient']!;
  bool get _isConsultationChecked => _checkedFlags['consultation']!;

  bool get _allChecksComplete =>
      _isDeviceChecked &&
      _isUserChecked &&
      _isCentreChecked &&
      _isPatientChecked &&
      _isConsultationChecked;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);

    // Setup loading timeout timer
    _setupLoadingTimeout();

    // Only check device registration first - no other APIs until device is registered
    context.read<DeviceRegistrationCubit>().getCurrentDevice();

    // Grant permissions immediately since app is always device owner
    _grantPermissionsImmediately();
  }

  void _setupLoadingTimeout() {
    _loadingTimeoutTimer = Timer(const Duration(seconds: 8), () {
      if (mounted && !_isDeviceChecked) {
        _updateCheckStatus('device', device: null);
      }
    });
  }

  void _updateCheckStatus(
    String key, {
    UserEntity? user,
    CentreEntity? centre,
    PatientEntity? patient,
    ConsultationEntity? consultation,
    DeviceEntity? device,
  }) {
    if (!mounted) return;
    setState(() {
      _checkedFlags[key] = true;
      if (user != null) this.user = user;
      if (centre != null) this.centre = centre;
      if (patient != null) this.patient = patient;
      if (consultation != null) this.consultation = consultation;
      if (device != null) this.device = device;
    });
  }

  void _resetAuthState() {
    _updateCheckStatus('user', user: null);
    _updateCheckStatus('centre', centre: null);
  }

  Future<void> _grantPermissionsImmediately() async {
    // Since app is always device owner, auto-grant all permissions by default
    await DeviceOwnerHelper.grantAllPermissions();

    // Print permission status for debugging
    await DeviceOwnerHelper.printPermissionSummary();

    // Delay the start to ensure BlocProvider is set up
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startGlobalDeviceMonitoring();
    });

    // Check permissions again after a delay to see if they were properly granted
    Future.delayed(const Duration(seconds: 2), () async {
      await DeviceOwnerHelper.printPermissionSummary();
    });

    // Fallback: If for some reason device owner check fails, try normal permission flow
    final bool isDeviceOwner = await DeviceOwnerHelper.isDeviceOwner();
    if (!isDeviceOwner) {
      await _requestPermissionsAsFallback();
    }
  }

  Future<void> _requestPermissionsAsFallback() async {
    final storageStatus = await Permission.manageExternalStorage.request();
    final cameraStatus = await Permission.camera.request();
    final microphoneStatus = await Permission.microphone.request();
    final usbStatus = await Permission.bluetooth.request();

    if (storageStatus.isGranted &&
        usbStatus.isGranted &&
        cameraStatus.isGranted &&
        microphoneStatus.isGranted) {
      // Delay the start to ensure BlocProvider is set up
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _startGlobalDeviceMonitoring();
      });
      return;
    } else {
      _showPermissionDialog();
    }
  }

  void _startGlobalDeviceMonitoring() {
    try {
      if (!ReleaseConfig.enableDeviceMonitoring) {
        return;
      }

      final deviceCubit = di<DeviceCubit>();
      final communicationCubit = di<CommunicationCubit>();
      final networkCubit = di<NetworkCubit>();

      // Set up communication between DeviceCubit and CommunicationCubit
      deviceCubit.setCommunicationCubit(communicationCubit);

      // Start device monitoring and checks
      deviceCubit.startDeviceMonitoring();
      deviceCubit.forceDeviceCheck();
      networkCubit.forceNetworkCheck();
    } catch (e) {
      di<ILogger>().error('Error starting device monitoring: $e');
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    // Cancel loading timeout timer
    _loadingTimeoutTimer?.cancel();
    _loadingTimeoutTimer = null;
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);

    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.detached) {
      // Close USB connections when app goes to background
      try {
        context.read<CommunicationCubit>().resetState();
        di<ILogger>().info(
          'USB connections closed due to app lifecycle change',
        );
      } catch (e) {
        di<ILogger>().error(
          'Error closing USB connections on lifecycle change: $e',
        );
      }
    } else if (state == AppLifecycleState.resumed) {
      // Reinitialize devices when app comes back to foreground
      try {
        context.read<DeviceCubit>().forceDeviceCheck();
        di<ILogger>().info('Device check triggered on app resume');
      } catch (e) {
        di<ILogger>().error('Error reinitializing devices on app resume: $e');
      }
    }
  }

  void _showPermissionDialog() {
    if (!mounted) {
      return;
    }

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

  // Auth state handlers
  void _handleAuthSuccess(BuildContext context, UserEntity? user) {
    _updateCheckStatus('user', user: user);
    if (user != null) {
      context.read<AuthCubit>().getCentre();
    } else {
      _resetAuthState();
      context.read<AuthCubit>().logout();
    }
  }

  void _handleCentreSuccess(BuildContext context, CentreEntity? centre) {
    _updateCheckStatus('centre', centre: centre);
    if (centre != null) {
      context.read<ConsultationCubit>().getCurrentConsultation();
    }
  }

  void _handleAuthError(BuildContext context, String message) {
    ErrorHandler.handleAuthError(context, message);
    _resetAuthState();
    context.read<ConsultationCubit>().getCurrentConsultation();
  }

  void _handleCentreError(BuildContext context, String message) {
    ErrorHandler.handleCentreError(context, message);
    _updateCheckStatus('centre', centre: null);
    context.read<ConsultationCubit>().getCurrentConsultation();
  }

  void _handleLoggedOut(BuildContext context) {
    _resetAuthState();
    Navigator.pushNamedAndRemoveUntil(
      context,
      '/login',
      (route) => false,
    );
  }

  void _handleAuthInitial(BuildContext context) {
    _updateCheckStatus('centre', centre: null);
    context.read<ConsultationCubit>().getCurrentConsultation();
  }

  // Device state handler
  void _handleDeviceState(BuildContext context, DeviceEntity? device) {
    _updateCheckStatus('device', device: device);
    if (device != null) {
      context.read<AuthCubit>().getCurrentUser();
      context.read<PatientCubit>().getCurrentPatient();
    }
  }

  // Navigation screen builder
  Widget _buildNavigationScreen() {
    // Priority 1: If consultation exists, go to consultation screen
    if (consultation != null) {
      return const ConsultationScreen();
    }

    // Priority 2: If patient exists but no consultation, go to consultation request
    if (patient != null) {
      return const ConsultationRequestScreen();
    }

    // Priority 3: If user is centre role and no patient/consultation, go to home
    if (user != null && user!.role == Role.centre) {
      return const HomeScreen();
    }

    return const LoginScreen();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocListener(
      listeners: [
        BlocListener<AuthCubit, AuthState>(
          listener: (context, state) {
            if (state is AuthSuccess) {
              _handleAuthSuccess(context, state.user);
            } else if (state is AuthCentreSuccess) {
              _handleCentreSuccess(context, state.centre);
            } else if (state is AuthError) {
              _handleAuthError(context, state.message);
            } else if (state is AuthCentreError) {
              _handleCentreError(context, state.message);
            } else if (state is AuthLoggedOut) {
              _handleLoggedOut(context);
            } else if (state is AuthInitial) {
              _handleAuthInitial(context);
            }
          },
        ),
        BlocListener<PatientCubit, PatientState>(
          listener: (context, state) {
            state.maybeWhen(
              currentPatientSuccess: (patient) =>
                  _updateCheckStatus('patient', patient: patient),
              orElse: () => _updateCheckStatus('patient', patient: null),
            );
          },
        ),
        BlocListener<ConsultationCubit, ConsultationState>(
          listener: (context, state) {
            state.maybeWhen(
              currentConsultationSuccess: (consultation) =>
                  _updateCheckStatus('consultation', consultation: consultation),
              error: (message) {
                if (!ErrorHandler.shouldSuppress(message)) {
                  ErrorHandler.handleConsultationError(context, message);
                }
                _updateCheckStatus('consultation', consultation: null);
              },
              orElse: () => _updateCheckStatus('consultation', consultation: null),
            );
          },
        ),
        BlocListener<DeviceRegistrationCubit, DeviceRegistrationState>(
          listener: (context, state) {
            state.maybeWhen(
              success: (device) => _handleDeviceState(context, device),
              localDeviceFetched: (device) => _handleDeviceState(context, device),
              error: (_) => _updateCheckStatus('device', device: null),
              orElse: () => _updateCheckStatus('device', device: null),
            );
          },
        ),
      ],
      child: Builder(
        builder: (context) {
          // First priority: Check device registration
          if (!_isDeviceChecked) {
            return const AppLoadingScreen();
          }

          // If device is not registered, show device registration screen
          if (device == null) {
            return const DeviceRegistrationScreen();
          }

          // Device is registered, now check other operations
          if (!_allChecksComplete) {
            return const AppLoadingScreen();
          }

          // All operations completed - cancel timeout timer
          _loadingTimeoutTimer?.cancel();
          _loadingTimeoutTimer = null;

          // Navigation logic based on priority
          return _buildNavigationScreen();
        },
      ),
    );
  }
}
