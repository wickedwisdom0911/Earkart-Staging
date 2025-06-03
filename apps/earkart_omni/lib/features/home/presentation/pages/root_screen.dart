import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.state.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.state.dart';
import 'package:earkart_omni/features/home/presentation/pages/home_screen.dart';
import 'package:earkart_omni/features/consultation/presentation/pages/consultation_request_screen.dart';
import 'package:earkart_omni/features/auth/presentation/pages/login_screen.dart';

class RootScreen extends StatefulWidget {
  static const routeName = '/';
  const RootScreen({super.key});

  @override
  State<RootScreen> createState() => _RootScreenState();
}

class _RootScreenState extends State<RootScreen> {
  bool checkedCentre = false;
  bool checkedPatient = false;
  CentreEntity? centre;
  PatientEntity? patient;

  @override
  void initState() {
    super.initState();
    context.read<AuthCubit>().getCentreData();
    context.read<PatientCubit>().getCurrentPatient();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocListener(
      listeners: [
        BlocListener<AuthCubit, AuthState>(
          listener: (context, state) {
            if (state is AuthCentreSuccess) {
              setState(() {
                checkedCentre = true;
                centre = state.centre;
              });
            } else if (state is AuthError || state is AuthInitial) {
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
      ],
      child: Builder(
        builder: (context) {
          if (!checkedCentre || !checkedPatient) {
            return const Center(child: CircularProgressIndicator());
          }
          if (centre != null && patient == null) {
            return const HomeScreen();
          }
          if (centre != null && patient != null) {
            return const ConsultationRequestScreen();
          }
          return const LoginScreen();
        },
      ),
    );
  }
}
