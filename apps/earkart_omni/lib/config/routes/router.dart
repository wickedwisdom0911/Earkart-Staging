import 'package:earkart_omni/features/auth/presentation/pages/login_screen.dart';
import 'package:earkart_omni/features/consultation/presentation/pages/consultation_request_screen.dart';
import 'package:earkart_omni/features/consultation/presentation/pages/consultation_screen.dart';
import 'package:earkart_omni/features/home/presentation/pages/home_screen.dart';
import 'package:earkart_omni/features/home/presentation/pages/root_screen.dart';
import 'package:earkart_omni/features/patients/presentation/pages/all_patients_screen.dart';
import 'package:earkart_omni/features/patients/presentation/pages/patient_form_screen.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
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
      return router(
        Builder(
          builder: (context) {
            return const AllPatientsScreen();
          },
        ),
      );
    case PatientFormScreen.routeName:
      return router(
        Builder(
          builder: (context) {
            return const PatientFormScreen();
          },
        ),
      );
    case HomeScreen.routeName:
      return router(
        Builder(
          builder: (context) {
            return const HomeScreen();
          },
        ),
      );

    case LoginScreen.routeName:
      return router(const LoginScreen());
    case ConsultationRequestScreen.routeName:
      return router(
        Builder(
          builder: (context) {
            return const ConsultationRequestScreen();
          },
        ),
      );
    case ConsultationScreen.routeName:
      return router(
        Builder(
          builder: (context) {
            return const ConsultationScreen();
          },
        ),
      );
    case RootScreen.routeName:
      return router(
        Builder(
          builder: (context) {
            return const RootScreen();
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
