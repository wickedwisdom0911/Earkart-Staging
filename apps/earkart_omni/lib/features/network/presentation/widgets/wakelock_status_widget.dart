import 'package:earkart_omni/config/utils/wakelock_manager.dart';
import 'package:flutter/material.dart';

/// Widget to display wakelock status
class WakelockStatusWidget extends StatefulWidget {
  final bool showTooltip;

  const WakelockStatusWidget({super.key, this.showTooltip = true});

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

  Widget _buildWakelockIcon(bool isEnabled) {
    final isForceEnabled = WakelockManager.isForceEnabled;
    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return Container(
          height: 20,
          width: 20,
          decoration: BoxDecoration(
            color:
                isEnabled
                    ? isForceEnabled
                        ? Colors.green.shade50.withOpacity(
                          _pulseAnimation.value,
                        )
                        : Colors.amber.shade50.withOpacity(
                          _pulseAnimation.value,
                        )
                    : Colors.grey.shade50,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color:
                  isEnabled
                      ? isForceEnabled
                          ? Colors.green.shade400.withOpacity(
                            _pulseAnimation.value,
                          )
                          : Colors.amber.shade300.withOpacity(
                            _pulseAnimation.value,
                          )
                      : Colors.grey.shade300,
              width: 1,
            ),
          ),
          child: Center(
            child: Icon(
              isEnabled
                  ? isForceEnabled
                      ? Icons.security
                      : Icons.lock_open
                  : Icons.lock_outline,
              size: 12,
              color:
                  isEnabled
                      ? isForceEnabled
                          ? Colors.green.shade700.withOpacity(
                            _pulseAnimation.value,
                          )
                          : Colors.amber.shade700.withOpacity(
                            _pulseAnimation.value,
                          )
                      : Colors.grey.shade500,
            ),
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

        final iconWidget = _buildWakelockIcon(isEnabled);

        // Only show tooltip if requested and overlay context is available
        if (widget.showTooltip && _hasOverlay()) {
          return Tooltip(message: tooltipMessage, child: iconWidget);
        }

        return iconWidget;
      },
    );
  }
}
