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
  bool checkedCentre = false;
  bool checkedPatient = false;
  bool checkedConsultation = false;
  bool checkedUser = false;
  bool checkedDevice = false;
  UserEntity? user;
  CentreEntity? centre;
  PatientEntity? patient;
  ConsultationEntity? consultation;
  DeviceEntity? device;

  Timer? _loadingTimeoutTimer;

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
      if (mounted && !checkedDevice) {
        setState(() {
          // Force complete device check only
          checkedDevice = true;
          device = null;
        });
      }
    });
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
      // Check if device monitoring is enabled in release mode
      if (!ReleaseConfig.enableDeviceMonitoring) {
        return;
      }

      // Get the DeviceCubit and CommunicationCubit from the global context
      final deviceCubit = di<DeviceCubit>();
      final communicationCubit = di<CommunicationCubit>();

      // Set up communication between DeviceCubit and CommunicationCubit
      deviceCubit.setCommunicationCubit(communicationCubit);

      // Start device monitoring
      deviceCubit.startDeviceMonitoring();

      // Force initial device check
      deviceCubit.forceDeviceCheck();

      // Force initial network check
      final networkCubit = di<NetworkCubit>();
      networkCubit.forceNetworkCheck();
    } catch (e) {
      // Log error but don't crash the app
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

  @override
  Widget build(BuildContext context) {
    return MultiBlocListener(
      listeners: [
        BlocListener<AuthCubit, AuthState>(
          listener: (context, state) {
            if (state is AuthSuccess) {
              setState(() {
                checkedUser = true;
                user = state.user;
              });
              // Only call getCentre after we have user data
              if (state.user != null) {
                context.read<AuthCubit>().getCentre();
              } else {
                // If no user but there's other data, force a logout to clear everything
                setState(() {
                  checkedUser = true;
                  checkedCentre = true;
                  user = null;
                  centre = null;
                });

                // Force logout to clear all data
                context.read<AuthCubit>().logout();
              }
            }
            if (state is AuthCentreSuccess) {
              setState(() {
                checkedCentre = true;
                centre = state.centre;
              });
              // Now that we have centre data, we can safely call getCurrentConsultation
              if (state.centre != null) {
                context.read<ConsultationCubit>().getCurrentConsultation();
              }
            } else if (state is AuthError ||
                state is AuthInitial ||
                state is AuthCentreError ||
                state is AuthLoggedOut) {
              if (state is AuthError) {
                ErrorHandler.handleAuthError(context, state.message);
                // If user auth fails, mark all as checked with null
                setState(() {
                  checkedUser = true;
                  checkedCentre = true;
                  user = null;
                  centre = null;
                });
                // Also call getCurrentConsultation to complete the loading cycle
                context.read<ConsultationCubit>().getCurrentConsultation();
              } else if (state is AuthCentreError) {
                ErrorHandler.handleCentreError(context, state.message);
                setState(() {
                  checkedCentre = true;
                  centre = null;
                });
                // Also call getCurrentConsultation to complete the loading cycle
                context.read<ConsultationCubit>().getCurrentConsultation();
              } else if (state is AuthLoggedOut) {
                setState(() {
                  checkedUser = true;
                  checkedCentre = true;
                  user = null;
                  centre = null;
                });
                // Navigate to login screen when user is logged out
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  '/login',
                  (route) => false,
                );
              } else if (state is AuthInitial) {
                setState(() {
                  checkedCentre = true;
                  centre = null;
                });
                // Also call getCurrentConsultation to complete the loading cycle
                context.read<ConsultationCubit>().getCurrentConsultation();
              } else {
                setState(() {
                  checkedCentre = true;
                  centre = null;
                });
                // Also call getCurrentConsultation to complete the loading cycle
                context.read<ConsultationCubit>().getCurrentConsultation();
              }
            }
          },
        ),
        BlocListener<PatientCubit, PatientState>(
          listener: (context, state) {
            if (state is CurrentPatientSuccess) {
              setState(() {
                checkedPatient = true;
                patient = state.patient;
              });
            } else if (state is PatientError || state is PatientInitial) {
              setState(() {
                checkedPatient = true;
                patient = null;
              });
            }
          },
        ),
        BlocListener<ConsultationCubit, ConsultationState>(
          listener: (context, state) {
            if (state is CurrentConsultationSuccess) {
              setState(() {
                checkedConsultation = true;
                consultation = state.consultation;
              });
            } else if (state is ConsultationError ||
                state is ConsultationInitial) {
              if (state is ConsultationError) {
                ErrorHandler.handleConsultationError(context, state.message);
              }
              setState(() {
                checkedConsultation = true;
                consultation = null;
              });
            }
          },
        ),
        BlocListener<DeviceRegistrationCubit, DeviceRegistrationState>(
          listener: (context, state) {
            state.maybeWhen(
              success: (device) {
                setState(() {
                  checkedDevice = true;
                  this.device = device;
                });

                // Only after device is registered, start other API calls
                if (device != null) {
                  context.read<AuthCubit>().getCurrentUser();
                  context.read<PatientCubit>().getCurrentPatient();
                }
              },
              localDeviceFetched: (device) {
                setState(() {
                  checkedDevice = true;
                  this.device = device;
                });

                // Only after device is registered, start other API calls
                if (device != null) {
                  context.read<AuthCubit>().getCurrentUser();
                  context.read<PatientCubit>().getCurrentPatient();
                }
              },
              error: (message) {
                setState(() {
                  checkedDevice = true;
                  device = null;
                });
              },
              orElse: () {
                setState(() {
                  checkedDevice = true;
                  device = null;
                });
              },
            );
          },
        ),
      ],
      child: Builder(
        builder: (context) {
          // First priority: Check device registration
          if (!checkedDevice) {
            return const AppLoadingScreen();
          }

          // If device is not registered, show device registration screen
          if (device == null) {
            return const DeviceRegistrationScreen();
          }

          // Device is registered, now check other operations
          if (!checkedCentre ||
              !checkedPatient ||
              !checkedConsultation ||
              !checkedUser) {
            return const AppLoadingScreen();
          }

          // All operations completed - cancel timeout timer
          _loadingTimeoutTimer?.cancel();
          _loadingTimeoutTimer = null;

          // Navigation logic
          // Priority 1: If consultation exists, go to consultation screen
          if (consultation != null) {
            return const ConsultationScreen();
          }

          // Priority 2: If patient exists but no consultation, go to consultation request
          if (patient != null && consultation == null) {
            return const ConsultationRequestScreen();
          }

          // Priority 3: If user is centre role and no patient/consultation, go to home
          if (user != null && user!.role == Role.centre) {
            return const HomeScreen();
          }

          return const LoginScreen();
        },
      ),
    );
  }
}
