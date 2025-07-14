import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:earkart_omni/features/consultation/presentation/pages/consultation_screen.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
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
  UserEntity? user;
  CentreEntity? centre;
  PatientEntity? patient;
  ConsultationEntity? consultation;

  @override
  void initState() {
    super.initState();

    context.read<AuthCubit>().getCurrentUser();

    context.read<AuthCubit>().getCentreData();

    context.read<PatientCubit>().getCurrentPatient();

    context.read<ConsultationCubit>().getCurrentConsultation();

    _checkAndRequestPermissions();
  }

  Future<void> _checkAndRequestPermissions() async {
    final storageStatus = await Permission.manageExternalStorage.request();

    final cameraStatus = await Permission.camera.request();

    final microphoneStatus = await Permission.microphone.request();

    final usbStatus = await Permission.bluetooth.request();

    if (storageStatus.isGranted &&
        usbStatus.isGranted &&
        cameraStatus.isGranted &&
        microphoneStatus.isGranted) {
      return;
    } else {
      _showPermissionDialog();
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
            }
            if (state is AuthCentreSuccess) {
              setState(() {
                checkedCentre = true;
                centre = state.centre;
              });
            } else if (state is AuthError || state is AuthInitial) {
              if (state is AuthError) {
              } else {}
              setState(() {
                checkedCentre = true;
                centre = null;
              });
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
              setState(() {
                checkedConsultation = true;
                consultation = null;
              });
            }
          },
        ),
      ],
      child: Builder(
        builder: (context) {
          if (!checkedCentre ||
              !checkedPatient ||
              !checkedConsultation ||
              !checkedUser) {
            return const Center(child: CircularProgressIndicator());
          }

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
