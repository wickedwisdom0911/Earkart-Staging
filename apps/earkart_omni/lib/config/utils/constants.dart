import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class Constants {
  static const primaryColor = Colors.lightBlue;
  static const secondaryColor = Colors.lightBlueAccent;
  static final darkAccent = Colors.lightBlue[100]!;
  static final accentColor = Colors.lightBlue[50]!;
  static const bg = Color(0xFFF5F5F6);

  static const userDb = "user_db";
  static const deviceDb = "device_db";
  static const centreDb = "centre_db";
  static const patientDb = "patient_db";
  static const countryDb = "country_db";
  static const stateDb = "state_db";
  static const cityDb = "city_db";
  static const districtDb = "district_db";
  static const languageDb = "language_db";
  static const consultationDb = "consultation_db";
  static final baseUrl = dotenv.env['BASE_URL'];
  static final socketUrl = dotenv.env['SOCKET_URL'];
  static final loginUrl = "${baseUrl}auth/login";
  static final deviceUrl = "${baseUrl}device/find-by-value";
  static final setupDeviceUrl = "${baseUrl}device/setup";
  static final getCentreUrl = "${baseUrl}centre/get";
  static final patientUrl = "${baseUrl}patient/create";
  static final getAllPatientsByCentreCodeUrl =
      "${baseUrl}patient/get-by-centre-code";
  static final languagesUrl = "${baseUrl}languages/get-all";
  static final countriesUrl = "${baseUrl}country/get-all-countries";
  static final statesUrl = "${baseUrl}states/get-states-by-country-id";
  static final citiesUrl = "${baseUrl}city/get-cities-by-state-id";
  static final districtsUrl = "${baseUrl}district/get-districts-by-city-id";
  static final createConsultationUrl = "${baseUrl}consultation/create";
  static final getConsultationByIdUrl = "${baseUrl}consultation/get-by-id";
  static final updateConsultationUrl = "${baseUrl}consultation/update";
  static final getConsultationsByCentreIdUrl =
      "${baseUrl}consultation/get-by-centre-id";
  static final getTokenUrl = "${baseUrl}twilio/video-token";
  static final createRoomUrl = "${baseUrl}twilio/create-room";
  static final deleteRoomUrl = "${baseUrl}twilio/delete-room";
  static final getAgoraTokenUrl = "${baseUrl}agora/create-agora-token";
}
