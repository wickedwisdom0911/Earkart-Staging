import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class Constants {
  static const primaryColor = Color(0xFF242C69);
  static const secondaryColor = Color(0xFF7080AB);
  static final darkAccent = Color(0xFFDFE8F0);
  static final accentColor = Color(0xFFF0F4F7);
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
  static final isProduction = dotenv.env['isProduction'] == 'true';
  static final showApiLogs = dotenv.env['showApiLogs'] == 'true';
  static final baseUrl =
      isProduction ? dotenv.env['BASE_URL'] : dotenv.env['BASE_URL_DEV'];
  static final socketUrl =
      isProduction
          ? dotenv.env['SOCKET_URL']
          : dotenv.env['BASE_SOCKET_URL_DEV'];
  static final webrtcUrl =
      isProduction
          ? dotenv.env['WEBRTC_URL']
          : dotenv.env['BASE_WEBRTC_URL_DEV'];
  static final loginUrl = "${baseUrl}auth/login";
  static final deviceUrl = "${baseUrl}device/find-by-value";
  static final setupDeviceUrl = "${baseUrl}device/setup";
  static final getCentreUrl = "${baseUrl}centre/get";
  static final patientUrl = "${baseUrl}patient/create";
  static final getAllPatientsByCentreCodeUrl =
      "${baseUrl}patient/get-by-centre-code";
  static final getPatientsByValueUrl = "${baseUrl}patient/get-by-value";
  static final updatePatientUrl = "${baseUrl}patient/update";
  static final languagesUrl = "${baseUrl}languages/get-all";
  static final countriesUrl = "${baseUrl}country/get-all-countries";
  static final statesUrl = "${baseUrl}states/get-states-by-country-id";
  static final citiesUrl = "${baseUrl}city/get-cities-by-district-id";
  static final districtsUrl = "${baseUrl}district/get-districts-by-state-id";
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
