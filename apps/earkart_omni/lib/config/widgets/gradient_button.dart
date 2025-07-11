import 'package:earkart_omni/config/utils/constants.dart';
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
      width: double.infinity,
      height: 56,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colors ?? [Constants.primaryColor, Constants.secondaryColor],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: (colors ??
                    [Constants.primaryColor, Constants.secondaryColor])[0]
                .withAlpha(70),
            blurRadius: 12,
            offset: const Offset(0, 4),
            spreadRadius: 0,
          ),
        ],
      ),
      child: ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        ),
        onPressed: onPressed,
        child: DefaultTextStyle(
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.white,
            letterSpacing: 0.5,
            height: 1.2,
          ),
          child: child,
        ),
      ),
    );
  }
}
