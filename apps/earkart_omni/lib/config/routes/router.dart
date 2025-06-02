import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.state.dart';
import 'package:earkart_omni/features/auth/presentation/pages/login_screen.dart';
import 'package:earkart_omni/features/home/presentation/pages/home_screen.dart';
import 'package:earkart_omni/features/lookup/presentation/cubit/lookup.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/pages/all_patients_screen.dart';
import 'package:earkart_omni/features/patients/presentation/pages/patient_form_screen.dart';
import 'package:earkart_omni/models/enums.dart';
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
            return BlocProvider<LookupCubit>(
              create:
                  (context) =>
                      di.call<LookupCubit>()
                        ..getLanguages()
                        ..getCountries(),
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
      return router(
        Builder(
          builder: (context) {
            return BlocProvider<AuthCubit>(
              create: (context) => di.call<AuthCubit>()..getCurrentUser(),

              child: BlocBuilder<AuthCubit, AuthState>(
                builder: (context, state) {
                  if (state is AuthInitial) {
                    return const LoginScreen();
                  }
                  if (state is AuthLoading) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  if (state is AuthSuccess) {
                    if (state.user.role == Role.centre) {
                      return const HomeScreen();
                    }
                    return const LoginScreen();
                  } else if (state is AuthCentreSuccess) {
                    return const HomeScreen();
                  }
                  return const LoginScreen();
                },
              ),
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
