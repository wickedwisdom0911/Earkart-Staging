import 'package:flutter/material.dart';

class AppLoadingScreen extends StatelessWidget {
  final String title;
  final String subtitle;
  final double logoSize;
  final double iconSize;
  final double spinnerSize;
  final double strokeWidth;
  final bool showAppTitle;

  const AppLoadingScreen({
    super.key,
    this.title = "EarKart Omni",
    this.subtitle = "Loading...",
    this.logoSize = 120,
    this.iconSize = 60,
    this.spinnerSize = 40,
    this.strokeWidth = 3,
    this.showAppTitle = true,
  });

  const AppLoadingScreen.compact({
    super.key,
    this.title = "EarKart Omni",
    this.subtitle = "Loading...",
    this.logoSize = 80,
    this.iconSize = 40,
    this.spinnerSize = 32,
    this.strokeWidth = 2.5,
    this.showAppTitle = false,
  });

  // Simple loading widget for use in other parts of the app
  static Widget simple({
    String? message,
    double size = 40,
    double strokeWidth = 3,
  }) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: size,
            height: size,
            child: CircularProgressIndicator(
              strokeWidth: strokeWidth,
              valueColor: AlwaysStoppedAnimation<Color>(Colors.blue.shade600),
            ),
          ),
          if (message != null) ...[
            const SizedBox(height: 16),
            Text(
              message,
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ],
      ),
    );
  }

  // White spinner for use on colored backgrounds (like buttons)
  static Widget whiteSpinner({double size = 20, double strokeWidth = 2}) {
    return SizedBox(
      width: size,
      height: size,
      child: CircularProgressIndicator(
        strokeWidth: strokeWidth,
        valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.blue.shade50,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // App Logo with animation
            AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              width: logoSize,
              height: logoSize,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(
                  logoSize * 0.167,
                ), // 20/120 ratio
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: logoSize * 0.083, // 10/120 ratio
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Icon(
                Icons.hearing,
                size: iconSize,
                color: Colors.blue.shade600,
              ),
            ),
            if (showAppTitle) ...[
              SizedBox(height: logoSize * 0.267), // 32/120 ratio
              // App Title
              Text(
                title,
                style: TextStyle(
                  fontSize: logoSize * 0.233, // 28/120 ratio
                  fontWeight: FontWeight.bold,
                  color: Colors.blue.shade700,
                ),
              ),
            ] else ...[
              SizedBox(height: logoSize * 0.2), // 24/120 ratio
            ],
            SizedBox(height: logoSize * 0.067), // 8/120 ratio
            // Subtitle
            Text(
              subtitle,
              style: TextStyle(
                fontSize: logoSize * 0.133, // 16/120 ratio
                color: Colors.grey.shade600,
                fontWeight: showAppTitle ? FontWeight.normal : FontWeight.w500,
              ),
            ),
            SizedBox(height: logoSize * 0.267), // 32/120 ratio
            // Loading Indicator
            SizedBox(
              width: spinnerSize,
              height: spinnerSize,
              child: CircularProgressIndicator(
                strokeWidth: strokeWidth,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.blue.shade600),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
