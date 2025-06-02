import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/pages/login_screen.dart';
import 'package:earkart_omni/features/consultation/presentation/pages/consultation_request_screen.dart';
import 'package:earkart_omni/features/consultation/presentation/pages/consultation_screen.dart';
import 'package:earkart_omni/features/home/presentation/pages/home_screen.dart';
import 'package:earkart_omni/features/home/presentation/pages/root_screen.dart';
import 'package:earkart_omni/features/lookup/presentation/cubit/lookup.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/pages/all_patients_screen.dart';
import 'package:earkart_omni/features/patients/presentation/pages/patient_form_screen.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:logger/logger.dart';
import 'package:modal_bottom_sheet/modal_bottom_sheet.dart';

Route<dynamic> generateRoute(RouteSettings settings) {
  Logger l = Logger();
  // final args = settings.arguments;
  l.i(settings.name);
  Route<dynamic> router(Widget w) {
    return MaterialWithModalsPageRoute(builder: (_) => w, settings: settings);
  }

  switch (settings.name) {
    case AllPatientsScreen.routeName:
      return router(const AllPatientsScreen());
    case PatientFormScreen.routeName:
      return router(
        Builder(
          builder: (context) {
            return MultiBlocProvider(
              providers: [
                BlocProvider<LookupCubit>(
                  create: (context) => di.call<LookupCubit>(),
                ),
                BlocProvider<PatientCubit>(
                  create: (context) => di.call<PatientCubit>(),
                ),
              ],
              child: const PatientFormScreen(),
            );
          },
        ),
      );
    case HomeScreen.routeName:
      return router(
        Builder(
          builder: (context) {
            return BlocProvider<AuthCubit>(
              create: (context) => di.call<AuthCubit>(),
              child: const HomeScreen(),
            );
          },
        ),
      );

    case LoginScreen.routeName:
      return router(const LoginScreen());
    case ConsultationRequestScreen.routeName:
      return router(
        Builder(
          builder: (context) {
            return BlocProvider<PatientCubit>(
              create: (context) => di.call<PatientCubit>(),
              child: const ConsultationRequestScreen(),
            );
          },
        ),
      );
    case ConsultationScreen.routeName:
      return router(const ConsultationScreen());
    case RootScreen.routeName:
      return router(
        Builder(
          builder: (context) {
            return MultiBlocProvider(
              providers: [
                BlocProvider<AuthCubit>(
                  create: (context) => di.call<AuthCubit>(),
                ),
                BlocProvider<PatientCubit>(
                  create: (context) => di.call<PatientCubit>(),
                ),
              ],
              child: const RootScreen(),
            );
          },
        ),
      );
    default:
      return CupertinoPageRoute(
        settings: settings,
        builder:
            (_) => Scaffold(
              appBar: AppBar(),
              body: const Center(child: Text('Screen does not exist!')),
            ),
      );
  }
}
