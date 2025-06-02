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

class RootScreen extends StatefulWidget {
  static const routeName = '/';
  const RootScreen({Key? key}) : super(key: key);

  @override
  State<RootScreen> createState() => _RootScreenState();
}

class _RootScreenState extends State<RootScreen> {
  bool checkedUser = false;
  bool checkedPatient = false;
  UserEntity? user;
  PatientEntity? patient;

  @override
  void initState() {
    super.initState();
    context.read<AuthCubit>().getCurrentUser();
    context.read<PatientCubit>().getCurrentPatient();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocListener(
      listeners: [
        BlocListener<AuthCubit, AuthState>(
          listener: (context, state) {
            if (state is AuthSuccess && state.user != null) {
              setState(() {
                checkedUser = true;
                user = state.user;
              });
            } else if (state is AuthError || state is AuthInitial) {
              setState(() {
                checkedUser = true;
                user = null;
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
          if (!checkedUser || !checkedPatient) {
            return const Center(child: CircularProgressIndicator());
          }
          if (user != null) {
            return const HomeScreen();
          }
          if (patient != null) {
            return const ConsultationRequestScreen();
          }
          return const LoginScreen();
        },
      ),
    );
  }
}
