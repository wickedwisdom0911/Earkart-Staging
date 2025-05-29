import 'package:earkart_omni/config/utils/dimensions.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class CustomStyles {
  static final titleTextStyle = GoogleFonts.montserrat(
    textStyle: TextStyle(
      fontSize: Dimensions.height2 * 10,
      fontWeight: FontWeight.w600,
    ),
  );
  static final smallTitleTextStyle = GoogleFonts.montserrat(
    textStyle: TextStyle(
      fontSize: Dimensions.height2 * 7,
      fontWeight: FontWeight.w600,
    ),
  );

  static final fixAppBarTextStyle = GoogleFonts.montserrat(
    textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.w500),
  );

  static final headingTextStyle = GoogleFonts.montserrat(
    textStyle: TextStyle(
      fontSize: Dimensions.height2 * 20,
      fontWeight: FontWeight.w600,
    ),
  );

  static final largeHeadingTextStyle = GoogleFonts.montserrat(
    textStyle: TextStyle(
      fontSize: Dimensions.height2 * 25,
      fontWeight: FontWeight.w700,
    ),
  );
  static final bodyTextStyle = GoogleFonts.montserrat(
    textStyle: TextStyle(
      fontSize: Dimensions.height2 * 8,
      fontWeight: FontWeight.w400,
    ),
  );
  static final mediumBodyTextStyle = GoogleFonts.montserrat(
    textStyle: TextStyle(
      fontSize: Dimensions.height2 * 10,
      fontWeight: FontWeight.w500,
    ),
  );
  static final regularBodyTextStyle = GoogleFonts.montserrat(
    textStyle: TextStyle(
      fontSize: Dimensions.height2 * 9,
      fontWeight: FontWeight.w400,
    ),
  );
  static final smallBodyTextStyle = GoogleFonts.montserrat(
    textStyle: TextStyle(
      fontSize: Dimensions.height2 * 6,
      fontWeight: FontWeight.w500,
    ),
  );
  static final buttonTextStyle = GoogleFonts.montserrat(
    textStyle: TextStyle(
      fontSize: Dimensions.height2 * 11,
      fontWeight: FontWeight.w600,
    ),
  );
  static final smallbuttonTextStyle = GoogleFonts.montserrat(
    textStyle: TextStyle(
      fontSize: Dimensions.height2 * 9,
      fontWeight: FontWeight.w500,
    ),
  );
}
