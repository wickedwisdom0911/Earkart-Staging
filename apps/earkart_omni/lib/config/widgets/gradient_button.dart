import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/dimensions.dart';
import 'package:earkart_omni/config/utils/text_styles.dart';
import 'package:figma_squircle/figma_squircle.dart';
import 'package:flutter/material.dart';

class GradientButton extends StatelessWidget {
  final Widget child;
  final Function() onPressed;
  final List<Color>? colors;
  const GradientButton({
    super.key,
    required this.child,
    required this.onPressed,
    this.colors,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: Dimensions.screenWidth,
      clipBehavior: Clip.hardEdge,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colors ?? [Constants.secondaryColor, Constants.primaryColor],
        ),
        borderRadius: SmoothBorderRadius(
          cornerRadius: Dimensions.height2 * 6,
          cornerSmoothing: 1,
        ),
      ),
      height: 60,
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(Dimensions.height2 * 6),
          ),
          textStyle: CustomStyles.buttonTextStyle.copyWith(color: Colors.white),
        ),
        onPressed: onPressed,
        child: child,
      ),
    );
  }
}
