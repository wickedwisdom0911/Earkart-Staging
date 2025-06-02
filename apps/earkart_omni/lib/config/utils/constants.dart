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
  static final baseUrl = dotenv.env['BASE_URL'];
  static final loginUrl = "${baseUrl}auth/login";
  static final deviceUrl = "${baseUrl}device/find-by-value";
  static final setupDeviceUrl = "${baseUrl}device/setup";
  static final getCentreUrl = "${baseUrl}centre/get";
  static final patientUrl = "${baseUrl}patient/create";
}
