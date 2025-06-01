import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/pages/login_screen.dart';
import 'package:earkart_omni/features/home/presentation/pages/home_screen.dart';
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
      return router(
        Builder(
          builder: (context) {
            return BlocProvider<AuthCubit>(
              create: (context) => di.call<AuthCubit>(),
              child: const LoginScreen(),
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
