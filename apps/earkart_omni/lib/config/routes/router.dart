import 'package:earkart_omni/features/appointments/presentation/pages/appointments_screen.dart';
import 'package:earkart_omni/features/auth/presentation/pages/login_screen.dart';
import 'package:earkart_omni/features/consultation/presentation/pages/all_consultations_screen.dart';
import 'package:earkart_omni/features/consultation/presentation/pages/consultation_request_screen.dart';
import 'package:earkart_omni/features/consultation/presentation/pages/consultation_screen.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/consultation_ended_screen.dart';
import 'package:earkart_omni/features/device/presentation/pages/device_info_screen.dart';
import 'package:earkart_omni/features/device/presentation/pages/device_registration_screen.dart';
import 'package:earkart_omni/features/home/presentation/pages/home_screen.dart';
import 'package:earkart_omni/features/home/presentation/pages/root_screen.dart';
import 'package:earkart_omni/features/patients/presentation/pages/all_patients_screen.dart';
import 'package:earkart_omni/features/patients/presentation/pages/patient_form_screen.dart';
import 'package:earkart_omni/features/patients/presentation/pages/patient_phone_screen.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import 'package:modal_bottom_sheet/modal_bottom_sheet.dart';

Route<dynamic> generateRoute(RouteSettings settings) {
  Logger l = Logger();
  final args = settings.arguments;
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
            if (args is PatientEntity) {
              return PatientFormScreen(patient: args);
            }
            return const PatientFormScreen(
              patient: PatientEntity(
                contactNumber: "",
                name: "",
                gender: Gender.male,
                password: "",
                address: "",
                pincode: "",
                languageId: "",
                countryId: "",
                stateId: "",
                districtId: "",
                cityId: "",
              ),
            );
          },
        ),
      );
    case PatientPhoneScreen.routeName:
      return router(
        Builder(
          builder: (context) {
            return const PatientPhoneScreen();
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
    case DeviceRegistrationScreen.routeName:
      return router(
        Builder(
          builder: (context) {
            return const DeviceRegistrationScreen();
          },
        ),
      );
    case DeviceInfoScreen.routeName:
      return router(const DeviceInfoScreen());
    case AppointmentsScreen.routeName:
      return router(const AppointmentsScreen());
    case AllConsultationsScreen.routeName:
      return router(const AllConsultationsScreen());
    case ConsultationEndedScreen.routeName:
      return router(
        ConsultationEndedScreen(
          endedBy: args is ConsultationEndedBy
              ? args
              : ConsultationEndedBy.audiologist,
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
