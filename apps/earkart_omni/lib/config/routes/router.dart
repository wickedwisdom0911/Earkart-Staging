import 'package:earkart_omni/features/auth/presentation/pages/login_screen.dart';
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
    case LoginScreen.routeName:
      return router(const LoginScreen());
    default:
      return router(const LoginScreen());
  }
}
