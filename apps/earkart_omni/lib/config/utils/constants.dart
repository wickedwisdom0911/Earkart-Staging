import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

class Constants {
  static const primaryColor = Colors.deepOrange;
  static const secondaryColor = Colors.deepOrangeAccent;
  static final darkAccent = Colors.deepOrange[100]!;
  static final accentColor = Colors.deepOrange[50]!;
  static const bg = Color(0xFFF5F5F6);

  static const userDb = "user_db";
  static final baseUrl = dotenv.env['BASE_URL'];
}
