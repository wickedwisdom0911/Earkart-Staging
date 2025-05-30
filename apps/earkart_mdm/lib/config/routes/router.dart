import 'package:earkart_mdm/di.dart';
import 'package:earkart_mdm/features/device/presentation/cubit/device.cubit.dart';
import 'package:earkart_mdm/features/device/presentation/pages/device.setup.screen.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
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
    case DeviceSetupScreen.routeName:
      return router(
        BlocProvider<DeviceCubit>(
          create: (context) => di.call<DeviceCubit>(),
          child: const DeviceSetupScreen(),
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
