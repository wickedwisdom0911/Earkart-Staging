import 'package:earkart_mdm/config/utils/constants.dart';
import 'package:earkart_mdm/config/utils/text_styles.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

ThemeData theme = ThemeData.light().copyWith(
  primaryColor: Constants.primaryColor,
  primaryColorDark: Colors.white,
  splashColor: Colors.transparent,
  highlightColor: Colors.transparent,
  scaffoldBackgroundColor: Colors.white,
  cardTheme: CardTheme(
    color: Colors.white,
    shape: RoundedRectangleBorder(
      side: const BorderSide(color: Constants.bg, width: 0.2),
      borderRadius: BorderRadius.circular(6),
    ),
    elevation: 3,
  ),
  appBarTheme: AppBarTheme(
    systemOverlayStyle: const SystemUiOverlayStyle(
      statusBarColor: Colors.white,
      statusBarIconBrightness: Brightness.dark, // For Android (dark icons)
      statusBarBrightness: Brightness.light, // For iOS (dark icons)
    ),
    backgroundColor: Colors.white,
    foregroundColor: Colors.black,
    titleTextStyle: CustomStyles.fixAppBarTextStyle.copyWith(
      color: Colors.black,
      fontWeight: FontWeight.bold,
    ),
    elevation: 0,
    centerTitle: true,
    titleSpacing: 5,
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
