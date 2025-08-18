import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/text_styles.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

ThemeData theme = ThemeData.light().copyWith(
  primaryColor: Constants.primaryColor,
  primaryColorDark: Colors.white,
  splashColor: Colors.transparent,
  highlightColor: Colors.transparent,
  scaffoldBackgroundColor: Colors.white,
  cardTheme: CardThemeData(
    color: Colors.white,
    shape: RoundedRectangleBorder(
      side: const BorderSide(color: Constants.bg, width: 0.2),
      borderRadius: BorderRadius.circular(6),
    ),
    elevation: 3,
  ),
  appBarTheme: AppBarTheme(
    toolbarHeight: 60,
    surfaceTintColor: Colors.transparent,
    scrolledUnderElevation: 0,
    systemOverlayStyle: const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark, // For Android (dark icons)
      statusBarBrightness: Brightness.light, // For iOS (dark icons)
    ),
    backgroundColor: Colors.white.withOpacity(0.85),
    foregroundColor: Colors.black87,
    titleTextStyle: CustomStyles.fixAppBarTextStyle.copyWith(
      color: Colors.black87,
      fontWeight: FontWeight.w700,
      fontSize: 20,
      letterSpacing: 0.3,
    ),
    elevation: 0,
    centerTitle: false,
    titleSpacing: 20,
    shape: const Border(
      bottom: BorderSide(color: Color(0x1A000000), width: 0.5),
    ),
  ),
  checkboxTheme: CheckboxThemeData(
    fillColor: WidgetStateProperty.all(Constants.primaryColor),
  ),
  radioTheme: RadioThemeData(
    fillColor: WidgetStateProperty.all(Constants.primaryColor),
  ),
  colorScheme: const ColorScheme.light()
      .copyWith(
        brightness: Brightness.light,
        secondary: Constants.secondaryColor,
        primary: Constants.primaryColor,
      )
      .copyWith(surface: Colors.white),
);
