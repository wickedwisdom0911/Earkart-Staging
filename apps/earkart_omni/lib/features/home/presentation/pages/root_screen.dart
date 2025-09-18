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
import 'package:earkart_omni/utils/device_owner_helper.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/config/release_config.dart';
import 'package:earkart_omni/config/widgets/app_loading_screen.dart';
import 'package:earkart_omni/config/utils/error_handler.dart';

class RootScreen extends StatefulWidget {
  static const routeName = '/';
  const RootScreen({super.key});

  @override
  State<RootScreen> createState() => _RootScreenState();
}

class _RootScreenState extends State<RootScreen> {
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

    print('🚀 RootScreen initState - Starting initialization');

    // Only check device registration first - no other APIs until device is registered
    context.read<DeviceRegistrationCubit>().getCurrentDevice();
    print('📞 Called getCurrentDevice() - Device registration check only');

    _checkAndRequestPermissions();

    // Set up a timeout to prevent indefinite loading
    _setupLoadingTimeout();
  }

  void _setupLoadingTimeout() {
    _loadingTimeoutTimer = Timer(const Duration(seconds: 8), () {
      if (mounted && !checkedDevice) {
        print('⏰ Loading timeout reached! Force completing device check');
        print('   checkedDevice: $checkedDevice');

        setState(() {
          // Force complete device check only
          checkedDevice = true;
          device = null;
          print('   ⚠️ Forced checkedDevice to true due to timeout');
        });
      }
    });
  }

  Future<void> _checkAndRequestPermissions() async {
    try {
      // First check if app is device owner and auto-grant permissions with timeout
      final bool isDeviceOwner = await DeviceOwnerHelper.isDeviceOwner()
          .timeout(const Duration(seconds: 3), onTimeout: () => false);
      print('🔍 Device owner check result: $isDeviceOwner');

      if (isDeviceOwner) {
        print('🎯 App is device owner - auto-granting permissions');
        await DeviceOwnerHelper.grantAllPermissions().timeout(
          const Duration(seconds: 5),
          onTimeout: () {
            print('⚠️ Permission granting timed out');
          },
        );

        // Reduced delay for faster startup
        await Future.delayed(const Duration(milliseconds: 200));

        // For device owner, use DeviceOwnerHelper to check permissions
        // instead of permission_handler which doesn't work properly for device owners
        final permissionStatus =
            await DeviceOwnerHelper.checkCommonPermissions().timeout(
              const Duration(seconds: 3),
              onTimeout: () => <String, bool>{},
            );

        print('🔍 Permission status after device owner grant:');
        permissionStatus.forEach((permission, granted) {
          print('   $permission: ${granted ? "✅ GRANTED" : "❌ DENIED"}');
        });

        // Skip detailed permission summary for faster startup
        // await DeviceOwnerHelper.printPermissionSummary();

        // For device owner, we should trust that permissions are granted
        // Check if any critical permissions are explicitly denied
        final criticalPermissions = [
          'android.permission.CAMERA',
          'android.permission.RECORD_AUDIO',
          'android.permission.READ_EXTERNAL_STORAGE',
          'android.permission.WRITE_EXTERNAL_STORAGE',
          'android.permission.BLUETOOTH',
          'android.permission.BLUETOOTH_CONNECT',
        ];

        bool hasDeniedCriticalPermissions = false;
        for (final permission in criticalPermissions) {
          if (permissionStatus[permission] == false) {
            print('⚠️ Critical permission denied: $permission');
            hasDeniedCriticalPermissions = true;
          }
        }

        if (hasDeniedCriticalPermissions) {
          print('⚠️ Some critical permissions denied for device owner');
          // Try one more time with a longer delay
          await Future.delayed(const Duration(seconds: 1));
          await DeviceOwnerHelper.grantAllPermissions();

          // Check permissions again
          final retryPermissionStatus =
              await DeviceOwnerHelper.checkCommonPermissions();
          bool stillHasDeniedPermissions = false;

          for (final permission in criticalPermissions) {
            if (retryPermissionStatus[permission] == false) {
              print(
                '⚠️ Critical permission still denied after retry: $permission',
              );
              stillHasDeniedPermissions = true;
            }
          }

          if (stillHasDeniedPermissions) {
            print(
              '⚠️ Some permissions still denied after retry - using fallback',
            );
            await _requestPermissionsAsFallback();
          } else {
            print('✅ All critical permissions granted after retry');
            WidgetsBinding.instance.addPostFrameCallback((_) {
              _startGlobalDeviceMonitoring();
            });
            return;
          }
        } else {
          print('✅ All critical permissions granted for device owner');
          // Delay the start to ensure BlocProvider is set up
          WidgetsBinding.instance.addPostFrameCallback((_) {
            _startGlobalDeviceMonitoring();
          });
          return;
        }
      } else {
        print('📱 App is not device owner - requesting permissions normally');
        await _requestPermissionsAsFallback();
      }
    } catch (e) {
      print('❌ Error during permission check: $e - continuing with fallback');
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
        print('⚠️ Device monitoring is disabled in release mode');
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

      print('✅ Global device monitoring started successfully');
      print('✅ Global network monitoring started successfully');
    } catch (e) {
      // Log error but don't crash the app
      print('Error starting global device monitoring: $e');
    }
  }

  @override
  void dispose() {
    // Cancel loading timeout timer
    _loadingTimeoutTimer?.cancel();
    _loadingTimeoutTimer = null;
    super.dispose();
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
            print('🔐 AuthCubit state changed: ${state.runtimeType}');

            if (state is AuthSuccess) {
              print('✅ AuthSuccess - User: ${state.user?.email ?? 'null'}');
              setState(() {
                checkedUser = true;
                user = state.user;
              });
              // Only call getCentre after we have user data
              if (state.user != null) {
                print('📞 Calling getCentre() for user: ${state.user!.email}');
                context.read<AuthCubit>().getCentre();
              } else {
                print(
                  '⚠️ User is null, but there might be stale data - forcing logout',
                );
                // If no user but there's other data, force a logout to clear everything
                setState(() {
                  checkedUser = true;
                  checkedCentre = true;
                  user = null;
                  centre = null;
                });

                // Force logout to clear all data
                print('🔐 Forcing logout due to null user with stale data');
                context.read<AuthCubit>().logout();
              }
            }
            if (state is AuthCentreSuccess) {
              print(
                '✅ AuthCentreSuccess - Centre: ${state.centre?.entName ?? 'null'}',
              );
              setState(() {
                checkedCentre = true;
                centre = state.centre;
              });
              // Now that we have centre data, we can safely call getCurrentConsultation
              if (state.centre != null) {
                print(
                  '📞 Calling getCurrentConsultation() for centre: ${state.centre!.entName}',
                );
                context.read<ConsultationCubit>().getCurrentConsultation();
              } else {
                print('⚠️ Centre is null, not calling getCurrentConsultation');
              }
            } else if (state is AuthError ||
                state is AuthInitial ||
                state is AuthCentreError ||
                state is AuthLoggedOut) {
              if (state is AuthError) {
                print('❌ Auth Error: ${state.message}');
                ErrorHandler.handleAuthError(context, state.message);
                // If user auth fails, mark all as checked with null
                setState(() {
                  checkedUser = true;
                  checkedCentre = true;
                  user = null;
                  centre = null;
                });
                // Also call getCurrentConsultation to complete the loading cycle
                print(
                  '📞 Calling getCurrentConsultation() after auth error to complete loading',
                );
                context.read<ConsultationCubit>().getCurrentConsultation();
              } else if (state is AuthCentreError) {
                print('❌ Centre Error: ${state.message}');
                ErrorHandler.handleCentreError(context, state.message);
                setState(() {
                  checkedCentre = true;
                  centre = null;
                });
                // Also call getCurrentConsultation to complete the loading cycle
                print(
                  '📞 Calling getCurrentConsultation() after centre error to complete loading',
                );
                context.read<ConsultationCubit>().getCurrentConsultation();
              } else if (state is AuthLoggedOut) {
                print('🚪 User logged out - navigating to login screen');
                setState(() {
                  checkedUser = true;
                  checkedCentre = true;
                  user = null;
                  centre = null;
                });
                // Navigate to login screen when user is logged out
                print('🔐 Navigating to login screen due to logout');
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  '/login',
                  (route) => false,
                );
              } else if (state is AuthInitial) {
                print('🔄 AuthInitial state - this might indicate a problem');
                setState(() {
                  checkedCentre = true;
                  centre = null;
                });
                // Also call getCurrentConsultation to complete the loading cycle
                print(
                  '📞 Calling getCurrentConsultation() after AuthInitial to complete loading',
                );
                context.read<ConsultationCubit>().getCurrentConsultation();
              } else {
                print(
                  '⚠️ Unknown auth state, marking centre as checked with null',
                );
                setState(() {
                  checkedCentre = true;
                  centre = null;
                });
                // Also call getCurrentConsultation to complete the loading cycle
                print(
                  '📞 Calling getCurrentConsultation() after unknown auth state to complete loading',
                );
                context.read<ConsultationCubit>().getCurrentConsultation();
              }
            }
          },
        ),
        BlocListener<PatientCubit, PatientState>(
          listener: (context, state) {
            print('🏥 PatientCubit state changed: ${state.runtimeType}');

            if (state is CurrentPatientSuccess) {
              print(
                '✅ CurrentPatientSuccess - Patient: ${state.patient != null ? state.patient!.name : 'null'}',
              );
              setState(() {
                checkedPatient = true;
                patient = state.patient;
              });
            } else if (state is PatientError || state is PatientInitial) {
              if (state is PatientError) {
                print('❌ Patient Error: ${state.message}');
              } else {
                print('🔄 PatientInitial state');
              }
              setState(() {
                checkedPatient = true;
                patient = null;
              });
            }
          },
        ),
        BlocListener<ConsultationCubit, ConsultationState>(
          listener: (context, state) {
            print('💬 ConsultationCubit state changed: ${state.runtimeType}');

            if (state is CurrentConsultationSuccess) {
              print(
                '✅ CurrentConsultationSuccess - Consultation: ${state.consultation.id}',
              );
              setState(() {
                checkedConsultation = true;
                consultation = state.consultation;
              });
            } else if (state is ConsultationError ||
                state is ConsultationInitial) {
              if (state is ConsultationError) {
                print('❌ Consultation Error: ${state.message}');
                ErrorHandler.handleConsultationError(context, state.message);
              } else {
                print('🔄 ConsultationInitial state');
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
            print(
              '📱 DeviceRegistrationCubit state changed: ${state.runtimeType}',
            );

            state.maybeWhen(
              success: (device) {
                print(
                  '✅ DeviceRegistrationSuccess - Device: ${device != null ? device.deviceCode : 'null'}',
                );
                setState(() {
                  checkedDevice = true;
                  this.device = device;
                });

                // Only after device is registered, start other API calls
                if (device != null) {
                  print('📞 Device registered - starting other API calls');
                  context.read<AuthCubit>().getCurrentUser();
                  context.read<PatientCubit>().getCurrentPatient();
                }
              },
              error: (message) {
                print('❌ Device Registration Error: $message');
                setState(() {
                  checkedDevice = true;
                  device = null;
                });
              },
              orElse: () {
                print('🔄 DeviceRegistrationInitial state');
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
          // Debug logging to identify which operation is not completing
          print('🔍 RootScreen build check:');
          print(
            '   checkedDevice: $checkedDevice (device: ${device != null ? device!.deviceCode : 'null'})',
          );

          // First priority: Check device registration
          if (!checkedDevice) {
            print(
              '⏳ Device registration check in progress - showing AppLoadingScreen.compact()',
            );
            return const AppLoadingScreen.compact();
          }

          // If device is not registered, show device registration screen
          if (device == null) {
            print(
              '📱 Device not registered - navigating to device registration',
            );
            return const DeviceRegistrationScreen();
          }

          // Device is registered, now check other operations
          print('📱 Device registered - checking other operations');
          print(
            '   checkedUser: $checkedUser (user: ${user?.email ?? 'null'})',
          );
          print(
            '   checkedCentre: $checkedCentre (centre: ${centre?.entName ?? 'null'})',
          );
          print(
            '   checkedPatient: $checkedPatient (patient: ${patient != null ? patient!.name : 'null'})',
          );
          print(
            '   checkedConsultation: $checkedConsultation (consultation: ${consultation?.id ?? 'null'})',
          );

          if (!checkedCentre ||
              !checkedPatient ||
              !checkedConsultation ||
              !checkedUser) {
            print(
              '⏳ Other operations in progress - showing AppLoadingScreen.compact()',
            );
            return const AppLoadingScreen.compact();
          }

          // All operations completed - cancel timeout timer
          _loadingTimeoutTimer?.cancel();
          _loadingTimeoutTimer = null;
          print('✅ All operations completed - proceeding with navigation');

          // Navigation logic with detailed logging
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
