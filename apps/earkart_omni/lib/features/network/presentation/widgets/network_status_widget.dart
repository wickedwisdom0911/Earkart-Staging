import 'package:earkart_omni/features/network/presentation/cubit/network.cubit.dart';
import 'package:earkart_omni/features/network/presentation/cubit/network.state.dart';
import 'package:earkart_omni/models/network/network_status.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

class NetworkStatusWidget extends StatelessWidget {
  final bool showDetails;
  final bool showTooltips;

  const NetworkStatusWidget({
    super.key,
    this.showDetails = false,
    this.showTooltips = true,
  });

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<NetworkCubit, NetworkState>(
      builder: (context, state) {
        if (state is NetworkInitial) {
          return const SizedBox.shrink();
        } else if (state is NetworkLoading) {
          return _NetworkLoadingWidget(showTooltips: showTooltips);
        } else if (state is NetworkConnected) {
          return _NetworkConnectedWidget(
            status: state.status,
            showDetails: showDetails,
            showTooltips: showTooltips,
          );
        } else if (state is NetworkDisconnected) {
          return _NetworkDisconnectedWidget(
            showDetails: showDetails,
            showTooltips: showTooltips,
          );
        } else if (state is NetworkError) {
          return _NetworkErrorWidget(
            message: state.message,
            showDetails: showDetails,
            showTooltips: showTooltips,
          );
        } else {
          return const SizedBox.shrink();
        }
      },
    );
  }
}

class _NetworkLoadingWidget extends StatelessWidget {
  final bool showTooltips;

  const _NetworkLoadingWidget({this.showTooltips = true});

  @override
  Widget build(BuildContext context) {
    final child = Container(
      height: 28,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.blue.shade200, Colors.blue.shade100],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.blue.withValues(alpha: 0.3),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 16,
            height: 16,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(Colors.blue.shade700),
            ),
          ),
          const SizedBox(width: 8),
          Material(
            color: Colors.transparent,
            child: Text(
              'Checking...',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Colors.blue.shade700,
                decoration: TextDecoration.none,
                fontFamily: 'Roboto',
              ),
            ),
          ),
        ],
      ),
    );

    if (showTooltips) {
      return Tooltip(message: 'Checking network connectivity...', child: child);
    }

    return child;
  }
}

class _NetworkConnectedWidget extends StatelessWidget {
  final NetworkStatus status;
  final bool showDetails;
  final bool showTooltips;

  const _NetworkConnectedWidget({
    required this.status,
    required this.showDetails,
    this.showTooltips = true,
  });

  @override
  Widget build(BuildContext context) {
    final tooltipMessage =
        showDetails
            ? 'Connected via ${_getConnectionTypeLabel()}${status.networkName != null ? ' - ${status.networkName!}' : ''}'
            : 'Network: ${_getConnectionTypeLabel()} - Signal: ${_getSignalStrengthText()}';

    final child = Container(
      height: showDetails ? 36 : 28,
      padding: EdgeInsets.symmetric(
        horizontal: showDetails ? 16 : 8,
        vertical: showDetails ? 8 : 6,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.green.shade400, Colors.green.shade300],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.green.withValues(alpha: 0.4),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _getConnectionIcon(),
          const SizedBox(width: 6),
          if (showDetails) ...[
            const SizedBox(width: 2),
            _getSignalStrengthIcon(),
            const SizedBox(width: 8),
            if (status.networkName != null) ...[
              Material(
                color: Colors.transparent,
                child: Text(
                  status.networkName!,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                    decoration: TextDecoration.none,
                    fontFamily: 'Roboto',
                  ),
                ),
              ),
            ] else ...[
              Material(
                color: Colors.transparent,
                child: const Text(
                  'Connected',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                    decoration: TextDecoration.none,
                    fontFamily: 'Roboto',
                  ),
                ),
              ),
            ],
          ] else ...[
            Material(
              color: Colors.transparent,
              child: Text(
                _getConnectionTypeLabel(),
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                  decoration: TextDecoration.none,
                  fontFamily: 'Roboto',
                ),
              ),
            ),
            const SizedBox(width: 4),
            _getSignalStrengthIcon(),
          ],
        ],
      ),
    );

    if (showTooltips) {
      return Tooltip(message: tooltipMessage, child: child);
    }

    return child;
  }

  Widget _getConnectionIcon() {
    IconData iconData;
    switch (status.connectionType) {
      case NetworkConnectionType.wifi:
        iconData = FontAwesomeIcons.wifi;
        break;
      case NetworkConnectionType.mobile:
        iconData = FontAwesomeIcons.signal;
        break;
      case NetworkConnectionType.ethernet:
        iconData = FontAwesomeIcons.ethernet;
        break;
      case NetworkConnectionType.bluetooth:
        iconData = FontAwesomeIcons.bluetooth;
        break;
      case NetworkConnectionType.none:
        iconData = FontAwesomeIcons.xmark;
        break;
    }

    return FaIcon(iconData, size: 16, color: Colors.white);
  }

  Widget _getSignalStrengthIcon() {
    return Material(
      color: Colors.transparent,
      child: Text(
        _getSignalStrengthText(),
        style: TextStyle(
          fontSize: showDetails ? 11 : 9,
          fontWeight: FontWeight.w600,
          color: Colors.white,
          decoration: TextDecoration.none,
          fontFamily: 'Roboto',
          height: 1.0,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  String _getSignalStrengthText() {
    switch (status.signalStrength) {
      case NetworkSignalStrength.excellent:
        return 'Excellent';
      case NetworkSignalStrength.good:
        return 'Good';
      case NetworkSignalStrength.fair:
        return 'Fair';
      case NetworkSignalStrength.poor:
        return 'Poor';
      case NetworkSignalStrength.none:
        return 'No Signal';
    }
  }

  String _getConnectionTypeLabel() {
    switch (status.connectionType) {
      case NetworkConnectionType.wifi:
        return 'WiFi';
      case NetworkConnectionType.mobile:
        return 'Mobile';
      case NetworkConnectionType.ethernet:
        return 'Ethernet';
      case NetworkConnectionType.bluetooth:
        return 'Bluetooth';
      case NetworkConnectionType.none:
        return 'Offline';
    }
  }
}

class _NetworkDisconnectedWidget extends StatelessWidget {
  final bool showDetails;
  final bool showTooltips;

  const _NetworkDisconnectedWidget({
    required this.showDetails,
    this.showTooltips = true,
  });

  @override
  Widget build(BuildContext context) {
    final tooltipMessage =
        showDetails
            ? 'No internet connection - Tap WiFi or Mobile to open settings'
            : 'No internet connection available';

    final child = Container(
      height: showDetails ? 48 : 28,
      padding: EdgeInsets.symmetric(
        horizontal: showDetails ? 16 : 8,
        vertical: showDetails ? 8 : 6,
      ),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.red.shade400, Colors.red.shade300],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.red.withValues(alpha: 0.4),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          FaIcon(
            FontAwesomeIcons.triangleExclamation,
            size: 16,
            color: Colors.white,
          ),
          const SizedBox(width: 6),
          if (showDetails) ...[
            const SizedBox(width: 2),
            Material(
              color: Colors.transparent,
              child: const Text(
                'No Internet',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                  decoration: TextDecoration.none,
                  fontFamily: 'Roboto',
                ),
              ),
            ),
            const SizedBox(width: 12),
            _NetworkActionButton(
              icon: FontAwesomeIcons.wifi,
              label: 'WiFi',
              color: Colors.blue,
              onTap:
                  () => context.read<NetworkCubit>().openNetworkSettings(
                    preferredType: NetworkConnectionType.wifi,
                  ),
            ),
            const SizedBox(width: 8),
            _NetworkActionButton(
              icon: FontAwesomeIcons.signal,
              label: 'Mobile',
              color: Colors.green,
              onTap:
                  () => context.read<NetworkCubit>().openNetworkSettings(
                    preferredType: NetworkConnectionType.mobile,
                  ),
            ),
          ] else ...[
            Material(
              color: Colors.transparent,
              child: const Text(
                'Offline',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                  decoration: TextDecoration.none,
                  fontFamily: 'Roboto',
                ),
              ),
            ),
          ],
        ],
      ),
    );

    if (showTooltips) {
      return Tooltip(message: tooltipMessage, child: child);
    }

    return child;
  }
}

class _NetworkActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _NetworkActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.1),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              FaIcon(icon, size: 12, color: color),
              const SizedBox(width: 6),
              Material(
                color: Colors.transparent,
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: color,
                    decoration: TextDecoration.none,
                    fontFamily: 'Roboto',
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NetworkErrorWidget extends StatelessWidget {
  final String message;
  final bool showDetails;
  final bool showTooltips;

  const _NetworkErrorWidget({
    required this.message,
    required this.showDetails,
    this.showTooltips = true,
  });

  @override
  Widget build(BuildContext context) {
    final tooltipMessage =
        showDetails
            ? 'Network error occurred - $message. Tap Retry to check again.'
            : 'Network error - Tap to retry';

    final child = Material(
      color: Colors.transparent,
      child: InkWell(
        onTap:
            showDetails
                ? null
                : () => context.read<NetworkCubit>().checkNetworkStatus(),
        borderRadius: BorderRadius.circular(18),
        child: Container(
          height: showDetails ? 40 : 28,
          padding: EdgeInsets.symmetric(
            horizontal: showDetails ? 16 : 8,
            vertical: showDetails ? 8 : 6,
          ),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.orange.shade400, Colors.orange.shade300],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: Colors.orange.withValues(alpha: 0.4),
                blurRadius: 8,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const FaIcon(
                FontAwesomeIcons.triangleExclamation,
                size: 16,
                color: Colors.white,
              ),
              const SizedBox(width: 6),
              if (showDetails) ...[
                const SizedBox(width: 2),
                Material(
                  color: Colors.transparent,
                  child: const Text(
                    'Network Error',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                      decoration: TextDecoration.none,
                      fontFamily: 'Roboto',
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                _NetworkActionButton(
                  icon: FontAwesomeIcons.arrowRotateRight,
                  label: 'Retry',
                  color: Colors.blue,
                  onTap:
                      () => context.read<NetworkCubit>().checkNetworkStatus(),
                ),
              ] else ...[
                Material(
                  color: Colors.transparent,
                  child: const Text(
                    'Error',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                      decoration: TextDecoration.none,
                      fontFamily: 'Roboto',
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );

    if (showTooltips) {
      return Tooltip(message: tooltipMessage, child: child);
    }

    return child;
  }
}

class NetworkStatusBar extends StatelessWidget {
  const NetworkStatusBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 56,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(Icons.network_check, color: Colors.grey.shade600, size: 20),
          const SizedBox(width: 12),
          Material(
            color: Colors.transparent,
            child: Text(
              'Network Status:',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: Colors.grey.shade700,
                decoration: TextDecoration.none,
                fontFamily: 'Roboto',
              ),
            ),
          ),
          const SizedBox(width: 12),
          const Expanded(child: NetworkStatusWidget(showDetails: true)),
        ],
      ),
    );
  }
}

/// Custom signal strength indicator with animated bars
class SignalStrengthIndicator extends StatefulWidget {
  final NetworkSignalStrength strength;
  final double size;
  final bool animated;
  final Color? color;

  const SignalStrengthIndicator({
    super.key,
    required this.strength,
    this.size = 16,
    this.animated = false,
    this.color,
  });

  @override
  State<SignalStrengthIndicator> createState() =>
      _SignalStrengthIndicatorState();
}

class _SignalStrengthIndicatorState extends State<SignalStrengthIndicator>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _animation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );

    if (widget.animated) {
      _animationController.forward();
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(SignalStrengthIndicator oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.strength != widget.strength && widget.animated) {
      _animationController.reset();
      _animationController.forward();
    }
  }

  @override
  Widget build(BuildContext context) {
    final baseColor = widget.color ?? Colors.white;

    return SizedBox(
      width: widget.size,
      height: widget.size * 0.8,
      child:
          widget.animated
              ? AnimatedBuilder(
                animation: _animation,
                builder: (context, child) => _buildSignalBars(baseColor),
              )
              : _buildSignalBars(baseColor),
    );
  }

  Widget _buildSignalBars(Color baseColor) {
    final signalData = _getSignalData();
    final barWidth = widget.size * 0.15;
    final maxBarHeight = widget.size * 0.8;
    final spacing = widget.size * 0.08;

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: List.generate(4, (index) {
        final barHeight = maxBarHeight * signalData.heights[index];
        final isActive = index < signalData.activeBars;
        final animationValue = widget.animated ? _animation.value : 1.0;

        return Container(
          width: barWidth,
          height: barHeight * animationValue,
          margin: EdgeInsets.only(right: index < 3 ? spacing : 0),
          decoration: BoxDecoration(
            color:
                isActive
                    ? signalData.color.withValues(alpha: 0.9)
                    : baseColor.withValues(alpha: 0.3),
            borderRadius: BorderRadius.circular(barWidth * 0.3),
            boxShadow:
                isActive
                    ? [
                      BoxShadow(
                        color: signalData.color.withValues(alpha: 0.4),
                        blurRadius: 2,
                        offset: const Offset(0, 1),
                      ),
                    ]
                    : null,
          ),
        );
      }),
    );
  }

  SignalData _getSignalData() {
    final Color signalColor;
    final double signalOpacity;

    if (widget.color != null) {
      // Use provided color with different opacity levels for signal strength
      signalColor = widget.color!;
      switch (widget.strength) {
        case NetworkSignalStrength.excellent:
          signalOpacity = 1.0;
          break;
        case NetworkSignalStrength.good:
          signalOpacity = 0.9;
          break;
        case NetworkSignalStrength.fair:
          signalOpacity = 0.8;
          break;
        case NetworkSignalStrength.poor:
          signalOpacity = 0.7;
          break;
        case NetworkSignalStrength.none:
          signalOpacity = 0.3;
          break;
      }
    } else {
      // Use default signal strength colors
      signalOpacity = 1.0;
      switch (widget.strength) {
        case NetworkSignalStrength.excellent:
          signalColor = Colors.green.shade400;
          break;
        case NetworkSignalStrength.good:
          signalColor = Colors.lightGreen.shade400;
          break;
        case NetworkSignalStrength.fair:
          signalColor = Colors.orange.shade400;
          break;
        case NetworkSignalStrength.poor:
          signalColor = Colors.red.shade400;
          break;
        case NetworkSignalStrength.none:
          signalColor = Colors.grey.shade400;
          break;
      }
    }

    switch (widget.strength) {
      case NetworkSignalStrength.excellent:
        return SignalData(
          activeBars: 4,
          heights: [0.4, 0.6, 0.8, 1.0],
          color: signalColor.withValues(alpha: signalOpacity),
        );
      case NetworkSignalStrength.good:
        return SignalData(
          activeBars: 3,
          heights: [0.4, 0.6, 0.8, 1.0],
          color: signalColor.withValues(alpha: signalOpacity),
        );
      case NetworkSignalStrength.fair:
        return SignalData(
          activeBars: 2,
          heights: [0.4, 0.6, 0.8, 1.0],
          color: signalColor.withValues(alpha: signalOpacity),
        );
      case NetworkSignalStrength.poor:
        return SignalData(
          activeBars: 1,
          heights: [0.4, 0.6, 0.8, 1.0],
          color: signalColor.withValues(alpha: signalOpacity),
        );
      case NetworkSignalStrength.none:
        return SignalData(
          activeBars: 0,
          heights: [0.4, 0.6, 0.8, 1.0],
          color: signalColor.withValues(alpha: signalOpacity),
        );
    }
  }
}

/// WiFi-specific signal indicator with curved arcs
class WifiSignalIndicator extends StatefulWidget {
  final NetworkSignalStrength strength;
  final double size;
  final bool animated;
  final Color? color;

  const WifiSignalIndicator({
    super.key,
    required this.strength,
    this.size = 16,
    this.animated = false,
    this.color,
  });

  @override
  State<WifiSignalIndicator> createState() => _WifiSignalIndicatorState();
}

class _WifiSignalIndicatorState extends State<WifiSignalIndicator>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _animation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );

    if (widget.animated) {
      _animationController.forward();
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(WifiSignalIndicator oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.strength != widget.strength && widget.animated) {
      _animationController.reset();
      _animationController.forward();
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.size,
      height: widget.size * 0.8,
      child:
          widget.animated
              ? AnimatedBuilder(
                animation: _animation,
                builder: (context, child) => _buildWifiArcs(),
              )
              : _buildWifiArcs(),
    );
  }

  Widget _buildWifiArcs() {
    return CustomPaint(
      size: Size(widget.size, widget.size * 0.8),
      painter: WifiSignalPainter(
        strength: widget.strength,
        color: widget.color ?? Colors.white,
        animationValue: widget.animated ? _animation.value : 1.0,
      ),
    );
  }
}

/// Custom painter for WiFi signal arcs
class WifiSignalPainter extends CustomPainter {
  final NetworkSignalStrength strength;
  final Color color;
  final double animationValue;

  WifiSignalPainter({
    required this.strength,
    required this.color,
    required this.animationValue,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height);
    final maxRadius = size.width * 0.4;
    final strokeWidth = size.width * 0.1;

    // Determine active arcs based on signal strength
    int activeArcs = _getActiveArcs();

    // Draw WiFi arcs
    for (int i = 0; i < 3; i++) {
      final radius = maxRadius * (i + 1) / 3;
      final isActive = i < activeArcs;
      final opacity =
          isActive
              ? _getSignalOpacity() * animationValue
              : 0.3 * animationValue;

      final paint =
          Paint()
            ..color = color.withValues(alpha: opacity)
            ..style = PaintingStyle.stroke
            ..strokeWidth = strokeWidth
            ..strokeCap = StrokeCap.round;

      // Draw arc
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -2.8, // Start angle (roughly -160 degrees)
        1.6, // Sweep angle (roughly 90 degrees)
        false,
        paint,
      );
    }

    // Draw center dot
    final dotPaint =
        Paint()
          ..color = color.withValues(
            alpha: _getSignalOpacity() * animationValue,
          )
          ..style = PaintingStyle.fill;

    canvas.drawCircle(center, strokeWidth * 0.6, dotPaint);
  }

  int _getActiveArcs() {
    switch (strength) {
      case NetworkSignalStrength.excellent:
        return 3;
      case NetworkSignalStrength.good:
        return 2;
      case NetworkSignalStrength.fair:
        return 1;
      case NetworkSignalStrength.poor:
        return 1;
      case NetworkSignalStrength.none:
        return 0;
    }
  }

  double _getSignalOpacity() {
    switch (strength) {
      case NetworkSignalStrength.excellent:
        return 1.0;
      case NetworkSignalStrength.good:
        return 0.9;
      case NetworkSignalStrength.fair:
        return 0.8;
      case NetworkSignalStrength.poor:
        return 0.7;
      case NetworkSignalStrength.none:
        return 0.3;
    }
  }

  @override
  bool shouldRepaint(WifiSignalPainter oldDelegate) {
    return oldDelegate.strength != strength ||
        oldDelegate.animationValue != animationValue ||
        oldDelegate.color != color;
  }
}

/// Data class for signal strength visualization
class SignalData {
  final int activeBars;
  final List<double> heights;
  final Color color;

  const SignalData({
    required this.activeBars,
    required this.heights,
    required this.color,
  });
}

/// Demo widget to showcase signal strength indicators
class SignalStrengthDemo extends StatelessWidget {
  const SignalStrengthDemo({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            'Signal Strength Indicators Demo',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 20),

          // WiFi Signal Demo
          const Text(
            'WiFi Signal Strength',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildDemoItem(
                'Excellent',
                NetworkSignalStrength.excellent,
                true,
              ),
              _buildDemoItem('Good', NetworkSignalStrength.good, true),
              _buildDemoItem('Fair', NetworkSignalStrength.fair, true),
              _buildDemoItem('Poor', NetworkSignalStrength.poor, true),
              _buildDemoItem('None', NetworkSignalStrength.none, true),
            ],
          ),

          const SizedBox(height: 20),

          // Mobile Signal Demo
          const Text(
            'Mobile Signal Strength',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              _buildDemoItem(
                'Excellent',
                NetworkSignalStrength.excellent,
                false,
              ),
              _buildDemoItem('Good', NetworkSignalStrength.good, false),
              _buildDemoItem('Fair', NetworkSignalStrength.fair, false),
              _buildDemoItem('Poor', NetworkSignalStrength.poor, false),
              _buildDemoItem('None', NetworkSignalStrength.none, false),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDemoItem(
    String label,
    NetworkSignalStrength strength,
    bool isWifi,
  ) {
    return Column(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: Colors.blue.shade600,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child:
                isWifi
                    ? WifiSignalIndicator(
                      strength: strength,
                      size: 24,
                      animated: true,
                      color: Colors.white,
                    )
                    : SignalStrengthIndicator(
                      strength: strength,
                      size: 24,
                      animated: true,
                      color: Colors.white,
                    ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w500),
        ),
      ],
    );
  }
}
