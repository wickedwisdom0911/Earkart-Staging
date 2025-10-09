import 'package:earkart_omni/features/network/presentation/cubit/network.cubit.dart';
import 'package:earkart_omni/features/network/presentation/cubit/network.state.dart';
import 'package:earkart_omni/models/network/network_status.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class NetworkStatusWidget extends StatefulWidget {
  final bool showDetails;
  final bool showTooltips;
  final double borderRadius;

  const NetworkStatusWidget({
    super.key,
    this.showDetails = false,
    this.showTooltips = true,
    this.borderRadius = 12.0,
  });

  @override
  State<NetworkStatusWidget> createState() => _NetworkStatusWidgetState();
}

class _NetworkStatusWidgetState extends State<NetworkStatusWidget> {
  bool _isExpanded = false;

  void _toggleExpanded() {
    setState(() {
      _isExpanded = !_isExpanded;
    });
  }

  void _closeExpanded() {
    setState(() {
      _isExpanded = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return _isExpanded
        ? _buildExpandedView(context)
        : _buildCompactView(context);
  }

  Widget _buildCompactView(BuildContext context) {
    return GestureDetector(
      onTap: _toggleExpanded,
      child: BlocBuilder<NetworkCubit, NetworkState>(
        builder: (context, state) {
          return AnimatedSwitcher(
            duration: const Duration(milliseconds: 300),
            transitionBuilder: (Widget child, Animation<double> animation) {
              return FadeTransition(
                opacity: animation,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0.3, 0),
                    end: Offset.zero,
                  ).animate(
                    CurvedAnimation(
                      parent: animation,
                      curve: Curves.easeOutCubic,
                    ),
                  ),
                  child: child,
                ),
              );
            },
            child: _buildNetworkWidget(state),
          );
        },
      ),
    );
  }

  Widget _buildExpandedView(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none, // Allow overflow
      children: [
        // Background barrier (tap to close) - make it more explicit
        Positioned.fill(
          child: GestureDetector(
            onTap: () {
              _closeExpanded();
            },
            child: Container(color: Colors.transparent),
          ),
        ),

        // Compact view
        GestureDetector(
          onTap: () {
            _closeExpanded();
          },
          child: BlocBuilder<NetworkCubit, NetworkState>(
            builder: (context, state) {
              return _buildNetworkWidget(state);
            },
          ),
        ),

        // Popup positioned below and to the right
        Positioned(
          top: 30, // Start below the compact widget
          right: 0, // Align with the right edge
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 300, maxHeight: 600),
            child: _ExpandedNetworkPopup(
              onClose: () {
                _closeExpanded();
              },
              networkState: context.read<NetworkCubit>().state,
              borderRadius: widget.borderRadius,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNetworkWidget(NetworkState state) {
    if (state is NetworkInitial) {
      return const SizedBox.shrink();
    } else if (state is NetworkLoading) {
      return _AnimatedLoadingWidget(
        key: const ValueKey('loading'),
        showTooltips: widget.showTooltips,
        borderRadius: widget.borderRadius,
      );
    } else if (state is NetworkConnected) {
      return _AnimatedConnectedWidget(
        key: const ValueKey('connected'),
        status: state.status,
        showDetails: widget.showDetails,
        showTooltips: widget.showTooltips,
        borderRadius: widget.borderRadius,
      );
    } else if (state is NetworkDisconnected) {
      return _AnimatedDisconnectedWidget(
        key: const ValueKey('disconnected'),
        showDetails: widget.showDetails,
        showTooltips: widget.showTooltips,
        borderRadius: widget.borderRadius,
      );
    } else if (state is NetworkError) {
      return _AnimatedErrorWidget(
        key: const ValueKey('error'),
        message: state.message,
        showDetails: widget.showDetails,
        showTooltips: widget.showTooltips,
        borderRadius: widget.borderRadius,
      );
    } else {
      return const SizedBox.shrink();
    }
  }
}

class _ExpandedNetworkPopup extends StatefulWidget {
  final VoidCallback onClose;
  final NetworkState networkState;
  final double borderRadius;

  const _ExpandedNetworkPopup({
    required this.onClose,
    required this.networkState,
    this.borderRadius = 16.0,
  });

  @override
  State<_ExpandedNetworkPopup> createState() => _ExpandedNetworkPopupState();
}

class _ExpandedNetworkPopupState extends State<_ExpandedNetworkPopup>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _opacityAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 250),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOutCubic),
    );

    _opacityAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOutCubic),
    );

    _animationController.forward();
  }

  void _close() {
    // Close immediately for better responsiveness
    widget.onClose();
    // Animation will be handled by widget disposal
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Opacity(
            opacity: _opacityAnimation.value,
            child: GestureDetector(
              onTap: () {
                // Prevent taps inside popup from propagating to background
              },
              child: Material(
                color: Colors.transparent,
                elevation: 8,
                borderRadius: BorderRadius.circular(widget.borderRadius),
                child: Container(
                  constraints: const BoxConstraints(
                    maxWidth: 300,
                    minWidth: 250,
                  ),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(widget.borderRadius),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.15),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      Row(
                        children: [
                          Icon(
                            Icons.network_check,
                            color: Colors.blue.shade600,
                            size: 24,
                          ),
                          const SizedBox(width: 12),
                          const Text(
                            'Network Status',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: Colors.black87,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Network details based on state
                      _buildNetworkDetails(),

                      const SizedBox(height: 16),

                      // Action buttons
                      _buildActionButtons(),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildNetworkDetails() {
    if (widget.networkState is NetworkConnected) {
      final connectedState = widget.networkState as NetworkConnected;
      return _buildConnectedDetails(connectedState.status);
    } else if (widget.networkState is NetworkDisconnected) {
      return _buildDisconnectedDetails();
    } else if (widget.networkState is NetworkError) {
      final errorState = widget.networkState as NetworkError;
      return _buildErrorDetails(errorState.message);
    } else if (widget.networkState is NetworkLoading) {
      return _buildLoadingDetails();
    } else {
      return _buildUnknownDetails();
    }
  }

  Widget _buildConnectedDetails(NetworkStatus status) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Connection status
        _buildDetailRow(
          icon: Icons.check_circle,
          iconColor: Colors.green.shade600,
          label: 'Connection',
          value: 'Connected',
          valueColor: Colors.green.shade600,
        ),

        // Connection type
        _buildDetailRow(
          icon: _getConnectionIcon(status.connectionType),
          iconColor: Colors.blue.shade600,
          label: 'Type',
          value: _getConnectionTypeLabel(status.connectionType),
        ),

        // Signal strength
        _buildDetailRow(
          icon: Icons.signal_cellular_alt,
          iconColor: _getSignalColor(status.signalStrength),
          label: 'Signal',
          value: _getSignalStrengthText(status.signalStrength),
          valueColor: _getSignalColor(status.signalStrength),
          trailing: _buildSignalBars(status.signalStrength),
        ),

        // Speed estimation (mock data)
        _buildDetailRow(
          icon: Icons.speed,
          iconColor: Colors.orange.shade600,
          label: 'Speed',
          value: _getEstimatedSpeed(
            status.connectionType,
            status.signalStrength,
          ),
        ),
      ],
    );
  }

  Widget _buildDisconnectedDetails() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDetailRow(
          icon: Icons.error,
          iconColor: Colors.red.shade600,
          label: 'Connection',
          value: 'Disconnected',
          valueColor: Colors.red.shade600,
        ),
        _buildDetailRow(
          icon: Icons.wifi_off,
          iconColor: Colors.grey.shade600,
          label: 'Status',
          value: 'No internet access',
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.red.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.red.shade200),
          ),
          child: Row(
            children: [
              Icon(Icons.info_outline, color: Colors.red.shade600, size: 16),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'Check your network settings or try connecting to a different network.',
                  style: TextStyle(fontSize: 12, color: Colors.black87),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildErrorDetails(String message) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDetailRow(
          icon: Icons.warning,
          iconColor: Colors.orange.shade600,
          label: 'Status',
          value: 'Network Error',
          valueColor: Colors.orange.shade600,
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.orange.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.orange.shade200),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                Icons.error_outline,
                color: Colors.orange.shade600,
                size: 16,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  message,
                  style: const TextStyle(fontSize: 12, color: Colors.black87),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLoadingDetails() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDetailRow(
          icon: Icons.sync,
          iconColor: Colors.blue.shade600,
          label: 'Status',
          value: 'Checking...',
          valueColor: Colors.blue.shade600,
        ),
        const SizedBox(height: 12),
        const Center(child: CircularProgressIndicator()),
      ],
    );
  }

  Widget _buildUnknownDetails() {
    return _buildDetailRow(
      icon: Icons.help_outline,
      iconColor: Colors.grey.shade600,
      label: 'Status',
      value: 'Unknown',
    );
  }

  Widget _buildDetailRow({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
    Color? valueColor,
    Widget? trailing,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, color: iconColor, size: 16),
          const SizedBox(width: 12),
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w500,
            ),
          ),
          const Spacer(),
          if (trailing != null) trailing,
          if (trailing != null) const SizedBox(width: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: valueColor ?? Colors.black87,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSignalBars(NetworkSignalStrength strength) {
    int strengthLevel = _getSignalStrengthLevel(strength);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(4, (index) {
        bool isActive = index < strengthLevel;
        return Container(
          margin: const EdgeInsets.only(right: 1),
          width: 3,
          height: 10 + (index * 2),
          decoration: BoxDecoration(
            color: isActive ? _getSignalColor(strength) : Colors.grey.shade300,
            borderRadius: BorderRadius.circular(1),
          ),
        );
      }),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        const Divider(),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () {
                  context.read<NetworkCubit>().checkNetworkStatus();
                  _close();
                },
                icon: const Icon(Icons.refresh, size: 16),
                label: const Text('Refresh'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.blue.shade600,
                  side: BorderSide(color: Colors.blue.shade200),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  IconData _getConnectionIcon(NetworkConnectionType type) {
    switch (type) {
      case NetworkConnectionType.wifi:
        return Icons.wifi;
      case NetworkConnectionType.mobile:
        return Icons.signal_cellular_alt;
      case NetworkConnectionType.ethernet:
        return Icons.settings_ethernet;
      case NetworkConnectionType.bluetooth:
        return Icons.bluetooth;
      case NetworkConnectionType.none:
        return Icons.wifi_off;
    }
  }

  String _getConnectionTypeLabel(NetworkConnectionType type) {
    switch (type) {
      case NetworkConnectionType.wifi:
        return 'WiFi';
      case NetworkConnectionType.mobile:
        return 'Mobile Data';
      case NetworkConnectionType.ethernet:
        return 'Ethernet';
      case NetworkConnectionType.bluetooth:
        return 'Bluetooth';
      case NetworkConnectionType.none:
        return 'None';
    }
  }

  String _getSignalStrengthText(NetworkSignalStrength strength) {
    switch (strength) {
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

  Color _getSignalColor(NetworkSignalStrength strength) {
    switch (strength) {
      case NetworkSignalStrength.excellent:
        return Colors.green.shade600;
      case NetworkSignalStrength.good:
        return Colors.lightGreen.shade600;
      case NetworkSignalStrength.fair:
        return Colors.orange.shade600;
      case NetworkSignalStrength.poor:
        return Colors.red.shade600;
      case NetworkSignalStrength.none:
        return Colors.grey.shade600;
    }
  }

  int _getSignalStrengthLevel(NetworkSignalStrength strength) {
    switch (strength) {
      case NetworkSignalStrength.excellent:
        return 4;
      case NetworkSignalStrength.good:
        return 3;
      case NetworkSignalStrength.fair:
        return 2;
      case NetworkSignalStrength.poor:
        return 1;
      case NetworkSignalStrength.none:
        return 0;
    }
  }

  String _getEstimatedSpeed(
    NetworkConnectionType type,
    NetworkSignalStrength strength,
  ) {
    if (type == NetworkConnectionType.wifi) {
      switch (strength) {
        case NetworkSignalStrength.excellent:
          return '50-100 Mbps';
        case NetworkSignalStrength.good:
          return '25-50 Mbps';
        case NetworkSignalStrength.fair:
          return '10-25 Mbps';
        case NetworkSignalStrength.poor:
          return '1-10 Mbps';
        case NetworkSignalStrength.none:
          return 'No connection';
      }
    } else if (type == NetworkConnectionType.mobile) {
      switch (strength) {
        case NetworkSignalStrength.excellent:
          return '20-50 Mbps';
        case NetworkSignalStrength.good:
          return '10-20 Mbps';
        case NetworkSignalStrength.fair:
          return '5-10 Mbps';
        case NetworkSignalStrength.poor:
          return '1-5 Mbps';
        case NetworkSignalStrength.none:
          return 'No connection';
      }
    } else if (type == NetworkConnectionType.ethernet) {
      return '100+ Mbps';
    }
    return 'Unknown';
  }
}

class _AnimatedLoadingWidget extends StatefulWidget {
  final bool showTooltips;
  final double borderRadius;

  const _AnimatedLoadingWidget({
    super.key,
    this.showTooltips = true,
    this.borderRadius = 12.0,
  });

  @override
  State<_AnimatedLoadingWidget> createState() => _AnimatedLoadingWidgetState();
}

class _AnimatedLoadingWidgetState extends State<_AnimatedLoadingWidget>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    _pulseAnimation = Tween<double>(begin: 0.7, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
    _pulseController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  bool _hasOverlay() {
    try {
      return Overlay.maybeOf(context) != null;
    } catch (e) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final child = AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _pulseAnimation.value,
          child: Container(
            constraints: const BoxConstraints(minHeight: 32, minWidth: 32),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(widget.borderRadius),
              border: Border.all(color: Colors.blue.shade100),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 12,
                  height: 12,
                  child: CircularProgressIndicator(
                    strokeWidth: 1.5,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      Colors.blue.shade600,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  'Checking',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.blue.shade700,
                    decoration: TextDecoration.none,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );

    if (widget.showTooltips && _hasOverlay()) {
      return Tooltip(message: 'Checking network connectivity...', child: child);
    }

    return child;
  }
}

class _AnimatedConnectedWidget extends StatefulWidget {
  final NetworkStatus status;
  final bool showDetails;
  final bool showTooltips;
  final double borderRadius;

  const _AnimatedConnectedWidget({
    super.key,
    required this.status,
    required this.showDetails,
    this.showTooltips = true,
    this.borderRadius = 12.0,
  });

  @override
  State<_AnimatedConnectedWidget> createState() =>
      _AnimatedConnectedWidgetState();
}

class _AnimatedConnectedWidgetState extends State<_AnimatedConnectedWidget>
    with TickerProviderStateMixin {
  late AnimationController _breathingController;
  late Animation<double> _breathingAnimation;

  @override
  void initState() {
    super.initState();
    _breathingController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _breathingAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _breathingController, curve: Curves.easeInOut),
    );
    _breathingController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _breathingController.dispose();
    super.dispose();
  }

  bool _hasOverlay() {
    try {
      return Overlay.maybeOf(context) != null;
    } catch (e) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final tooltipMessage =
        widget.showDetails
            ? 'Connected via ${_getConnectionTypeLabel()}${widget.status.networkName != null ? ' - ${widget.status.networkName!}' : ''}'
            : 'Network: ${_getConnectionTypeLabel()} - Signal: ${_getSignalStrengthText()}';

    final child = AnimatedBuilder(
      animation: _breathingAnimation,
      builder: (context, child) {
        return Container(
          constraints: const BoxConstraints(minHeight: 32, minWidth: 32),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.green.shade50,
            borderRadius: BorderRadius.circular(widget.borderRadius),
            border: Border.all(
              color: Colors.green.shade100.withOpacity(
                _breathingAnimation.value,
              ),
              width: 1.2,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _getAnimatedConnectionIcon(),
              const SizedBox(width: 6),
              _buildSignalStrengthBars(),
              const SizedBox(width: 4),
              if (!widget.showDetails) ...[
                Text(
                  _getConnectionTypeLabel(),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.green.shade700,
                    decoration: TextDecoration.none,
                  ),
                ),
              ] else ...[
                Text(
                  widget.status.networkName ?? 'Connected',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Colors.green.shade700,
                    decoration: TextDecoration.none,
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );

    if (widget.showTooltips && _hasOverlay()) {
      return Tooltip(message: tooltipMessage, child: child);
    }

    return child;
  }

  Widget _getAnimatedConnectionIcon() {
    IconData iconData;
    switch (widget.status.connectionType) {
      case NetworkConnectionType.wifi:
        iconData = Icons.wifi;
        break;
      case NetworkConnectionType.mobile:
        iconData = Icons.signal_cellular_alt;
        break;
      case NetworkConnectionType.ethernet:
        iconData = Icons.settings_ethernet;
        break;
      case NetworkConnectionType.bluetooth:
        iconData = Icons.bluetooth;
        break;
      case NetworkConnectionType.none:
        iconData = Icons.wifi_off;
        break;
    }

    return AnimatedBuilder(
      animation: _breathingAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: 0.9 + (0.1 * _breathingAnimation.value),
          child: Icon(
            iconData,
            size: 14,
            color: Colors.green.shade600.withOpacity(_breathingAnimation.value),
          ),
        );
      },
    );
  }

  Widget _buildSignalStrengthBars() {
    int strengthLevel = _getSignalStrengthLevel();
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(4, (index) {
        bool isActive = index < strengthLevel;
        return AnimatedContainer(
          duration: Duration(milliseconds: 300 + (index * 100)),
          curve: Curves.easeOutCubic,
          margin: const EdgeInsets.only(right: 1),
          width: 2,
          height: 8 + (index * 2),
          decoration: BoxDecoration(
            color: isActive ? Colors.green.shade600 : Colors.green.shade200,
            borderRadius: BorderRadius.circular(1),
          ),
        );
      }),
    );
  }

  int _getSignalStrengthLevel() {
    switch (widget.status.signalStrength) {
      case NetworkSignalStrength.excellent:
        return 4;
      case NetworkSignalStrength.good:
        return 3;
      case NetworkSignalStrength.fair:
        return 2;
      case NetworkSignalStrength.poor:
        return 1;
      case NetworkSignalStrength.none:
        return 0;
    }
  }

  String _getSignalStrengthText() {
    switch (widget.status.signalStrength) {
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
    switch (widget.status.connectionType) {
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

class _AnimatedDisconnectedWidget extends StatefulWidget {
  final bool showDetails;
  final bool showTooltips;
  final double borderRadius;

  const _AnimatedDisconnectedWidget({
    super.key,
    required this.showDetails,
    this.showTooltips = true,
    this.borderRadius = 12.0,
  });

  @override
  State<_AnimatedDisconnectedWidget> createState() =>
      _AnimatedDisconnectedWidgetState();
}

class _AnimatedDisconnectedWidgetState
    extends State<_AnimatedDisconnectedWidget>
    with TickerProviderStateMixin {
  late AnimationController _flashController;
  late Animation<double> _flashAnimation;

  @override
  void initState() {
    super.initState();
    _flashController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _flashAnimation = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(parent: _flashController, curve: Curves.easeInOut),
    );
    _flashController.repeat(reverse: true);
  }

  @override
  void dispose() {
    _flashController.dispose();
    super.dispose();
  }

  bool _hasOverlay() {
    try {
      return Overlay.maybeOf(context) != null;
    } catch (e) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final tooltipMessage =
        widget.showDetails
            ? 'No internet connection - Check your network settings'
            : 'No internet connection available';

    final child = AnimatedBuilder(
      animation: _flashAnimation,
      builder: (context, child) {
        return Container(
          constraints: const BoxConstraints(minHeight: 32, minWidth: 32),
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.red.shade50,
            borderRadius: BorderRadius.circular(widget.borderRadius),
            border: Border.all(
              color: Colors.red.shade100.withOpacity(_flashAnimation.value),
              width: 1.2,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Transform.scale(
                scale: 0.9 + (0.1 * _flashAnimation.value),
                child: Icon(
                  Icons.wifi_off,
                  size: 14,
                  color: Colors.red.shade600.withOpacity(_flashAnimation.value),
                ),
              ),
              const SizedBox(width: 6),
              _buildDeadSignalBars(),
              const SizedBox(width: 4),
              Text(
                'Offline',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Colors.red.shade700,
                  decoration: TextDecoration.none,
                ),
              ),
            ],
          ),
        );
      },
    );

    if (widget.showTooltips && _hasOverlay()) {
      return Tooltip(message: tooltipMessage, child: child);
    }

    return child;
  }

  Widget _buildDeadSignalBars() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(4, (index) {
        return AnimatedContainer(
          duration: Duration(milliseconds: 200 + (index * 50)),
          curve: Curves.easeOutCubic,
          margin: const EdgeInsets.only(right: 1),
          width: 2,
          height: 8 + (index * 2),
          decoration: BoxDecoration(
            color: Colors.red.shade200,
            borderRadius: BorderRadius.circular(1),
          ),
        );
      }),
    );
  }
}

class _AnimatedErrorWidget extends StatefulWidget {
  final String message;
  final bool showDetails;
  final bool showTooltips;
  final double borderRadius;

  const _AnimatedErrorWidget({
    super.key,
    required this.message,
    required this.showDetails,
    this.showTooltips = true,
    this.borderRadius = 12.0,
  });

  @override
  State<_AnimatedErrorWidget> createState() => _AnimatedErrorWidgetState();
}

class _AnimatedErrorWidgetState extends State<_AnimatedErrorWidget>
    with TickerProviderStateMixin {
  late AnimationController _shakeController;
  late Animation<double> _shakeAnimation;

  @override
  void initState() {
    super.initState();
    _shakeController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    _shakeAnimation = Tween<double>(begin: -2, end: 2).animate(
      CurvedAnimation(parent: _shakeController, curve: Curves.elasticIn),
    );

    // Trigger shake animation on init
    _shakeController.forward().then((_) {
      _shakeController.repeat(reverse: true);
    });
  }

  @override
  void dispose() {
    _shakeController.dispose();
    super.dispose();
  }

  bool _hasOverlay() {
    try {
      return Overlay.maybeOf(context) != null;
    } catch (e) {
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final tooltipMessage =
        widget.showDetails
            ? 'Network error occurred - ${widget.message}. Tap to retry.'
            : 'Network error - Tap to retry';

    final child = AnimatedBuilder(
      animation: _shakeAnimation,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(_shakeAnimation.value, 0),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap:
                  widget.showDetails
                      ? null
                      : () => context.read<NetworkCubit>().checkNetworkStatus(),
              borderRadius: BorderRadius.circular(widget.borderRadius),
              child: Container(
                constraints: const BoxConstraints(minHeight: 32),
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(widget.borderRadius),
                  border: Border.all(color: Colors.orange.shade100),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 14,
                      color: Colors.orange.shade600,
                    ),
                    const SizedBox(width: 6),
                    _buildErrorSignalBars(),
                    const SizedBox(width: 4),
                    Text(
                      'Error',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Colors.orange.shade700,
                        decoration: TextDecoration.none,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );

    if (widget.showTooltips && _hasOverlay()) {
      return Tooltip(message: tooltipMessage, child: child);
    }

    return child;
  }

  Widget _buildErrorSignalBars() {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(4, (index) {
        return AnimatedContainer(
          duration: Duration(milliseconds: 300 + (index * 100)),
          curve: Curves.easeOutCubic,
          margin: const EdgeInsets.only(right: 1),
          width: 2,
          height: 8 + (index * 2),
          decoration: BoxDecoration(
            color: index < 2 ? Colors.orange.shade400 : Colors.orange.shade200,
            borderRadius: BorderRadius.circular(1),
          ),
        );
      }),
    );
  }
}
