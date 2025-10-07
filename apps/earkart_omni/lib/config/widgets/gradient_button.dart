import 'package:earkart_omni/config/utils/constants.dart';
import 'package:flutter/material.dart';

class GradientButton extends StatelessWidget {
  final Widget child;
  final Function()? onPressed;
  final List<Color>? colors;
  final bool enabled;

  const GradientButton({
    super.key,
    required this.child,
    required this.onPressed,
    this.colors,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    final isDisabled = !enabled || onPressed == null;
    final buttonColors =
        colors ?? [Constants.primaryColor, Constants.secondaryColor];

    return Container(
      width: double.infinity,
      height: 56,
      decoration: BoxDecoration(
        gradient:
            isDisabled
                ? LinearGradient(
                  colors: [Colors.grey.shade300, Colors.grey.shade400],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                )
                : LinearGradient(
                  colors: buttonColors,
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                ),
        borderRadius: BorderRadius.circular(16),
        boxShadow:
            isDisabled
                ? null
                : [
                  BoxShadow(
                    color: buttonColors[0].withAlpha(70),
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
        onPressed: isDisabled ? null : onPressed,
        child: DefaultTextStyle(
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: isDisabled ? Colors.grey.shade600 : Colors.white,
            letterSpacing: 0.5,
            height: 1.2,
          ),
          child: child,
        ),
      ),
    );
  }
}
