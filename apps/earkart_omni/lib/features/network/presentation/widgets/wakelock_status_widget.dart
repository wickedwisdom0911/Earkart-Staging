import 'package:earkart_omni/config/utils/wakelock_manager.dart';
import 'package:flutter/material.dart';

/// Widget to display wakelock status
class WakelockStatusWidget extends StatefulWidget {
  final bool showTooltip;
  final double borderRadius;

  const WakelockStatusWidget({
    super.key,
    this.showTooltip = true,
    this.borderRadius = 12.0,
  });

  @override
  State<WakelockStatusWidget> createState() => _WakelockStatusWidgetState();
}

class _WakelockStatusWidgetState extends State<WakelockStatusWidget>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Start animation if wakelock is enabled
    if (WakelockManager.isEnabled) {
      _pulseController.repeat(reverse: true);
    }

    // Listen to wakelock status changes
    WakelockManager.statusNotifier.addListener(_onWakelockStatusChanged);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    WakelockManager.statusNotifier.removeListener(_onWakelockStatusChanged);
    super.dispose();
  }

  void _onWakelockStatusChanged() {
    if (mounted) {
      setState(() {
        if (WakelockManager.isEnabled) {
          _pulseController.repeat(reverse: true);
        } else {
          _pulseController.stop();
        }
      });
    }
  }

  bool _hasOverlay() {
    try {
      return Overlay.maybeOf(context) != null;
    } catch (e) {
      return false;
    }
  }

  Widget _buildWakelockWidget(bool isEnabled) {
    final isForceEnabled = WakelockManager.isForceEnabled;
    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        Color backgroundColor;
        Color borderColor;
        Color iconColor;

        if (isEnabled) {
          if (isForceEnabled) {
            backgroundColor = Colors.green.shade50.withOpacity(
              _pulseAnimation.value,
            );
            borderColor = Colors.green.shade100.withOpacity(
              _pulseAnimation.value,
            );
            iconColor = Colors.green.shade600.withOpacity(
              _pulseAnimation.value,
            );
          } else {
            backgroundColor = Colors.amber.shade50.withOpacity(
              _pulseAnimation.value,
            );
            borderColor = Colors.amber.shade100.withOpacity(
              _pulseAnimation.value,
            );
            iconColor = Colors.amber.shade600.withOpacity(
              _pulseAnimation.value,
            );
          }
        } else {
          backgroundColor = Colors.grey.shade50;
          borderColor = Colors.grey.shade100;
          iconColor = Colors.grey.shade600;
        }

        return Container(
          constraints: const BoxConstraints(minHeight: 32, minWidth: 32),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: BorderRadius.circular(widget.borderRadius),
            border: Border.all(color: borderColor, width: 1),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                isEnabled
                    ? isForceEnabled
                        ? Icons.security
                        : Icons.lock_open
                    : Icons.lock_outline,
                size: 14,
                color: iconColor,
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: WakelockManager.statusNotifier,
      builder: (context, isEnabled, child) {
        final isForceEnabled = WakelockManager.isForceEnabled;
        final tooltipMessage =
            isEnabled
                ? isForceEnabled
                    ? 'Device is kept awake (Force Enabled) - Critical medical operations'
                    : 'Device is kept awake - Screen won\'t turn off'
                : 'Device can sleep - Screen will turn off normally';

        final wakelockWidget = _buildWakelockWidget(isEnabled);

        // Only show tooltip if requested and overlay context is available
        if (widget.showTooltip && _hasOverlay()) {
          return Tooltip(message: tooltipMessage, child: wakelockWidget);
        }

        return wakelockWidget;
      },
    );
  }
}
