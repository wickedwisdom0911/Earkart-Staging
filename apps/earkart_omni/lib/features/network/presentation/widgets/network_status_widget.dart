import 'package:earkart_omni/features/network/presentation/cubit/network.cubit.dart';
import 'package:earkart_omni/features/network/presentation/cubit/network.state.dart';
import 'package:earkart_omni/models/network/network_status.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

class NetworkStatusWidget extends StatelessWidget {
  final bool showDetails;

  const NetworkStatusWidget({super.key, this.showDetails = false});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<NetworkCubit, NetworkState>(
      builder: (context, state) {
        if (state is NetworkInitial) {
          return const SizedBox.shrink();
        } else if (state is NetworkLoading) {
          return const _NetworkLoadingWidget();
        } else if (state is NetworkConnected) {
          return _NetworkConnectedWidget(
            status: state.status,
            showDetails: showDetails,
          );
        } else if (state is NetworkDisconnected) {
          return _NetworkDisconnectedWidget(showDetails: showDetails);
        } else if (state is NetworkError) {
          return _NetworkErrorWidget(
            message: state.message,
            showDetails: showDetails,
          );
        } else {
          return const SizedBox.shrink();
        }
      },
    );
  }
}

class _NetworkLoadingWidget extends StatelessWidget {
  const _NetworkLoadingWidget();

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 24,
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 12,
            height: 12,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}

class _NetworkConnectedWidget extends StatelessWidget {
  final NetworkStatus status;
  final bool showDetails;

  const _NetworkConnectedWidget({
    required this.status,
    required this.showDetails,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: showDetails ? 32 : 24,
      padding: EdgeInsets.symmetric(
        horizontal: showDetails ? 12 : 6,
        vertical: showDetails ? 4 : 2,
      ),
      decoration: BoxDecoration(
        color: showDetails ? Colors.green.shade100 : Colors.transparent,
        borderRadius: BorderRadius.circular(showDetails ? 16 : 12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _getConnectionIcon(),
          if (showDetails) ...[
            const SizedBox(width: 6),
            _getSignalStrengthIcon(),
            const SizedBox(width: 6),
            if (status.networkName != null) ...[
              Text(
                status.networkName!,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Colors.green,
                ),
              ),
            ] else ...[
              const Text(
                'Connected',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Colors.green,
                ),
              ),
            ],
          ] else ...[
            const SizedBox(width: 3),
            _getSignalStrengthIcon(),
          ],
        ],
      ),
    );
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

    return FaIcon(
      iconData,
      size: 14,
      color: showDetails ? Colors.green : Colors.white,
    );
  }

  Widget _getSignalStrengthIcon() {
    IconData iconData;
    Color color;

    switch (status.signalStrength) {
      case NetworkSignalStrength.excellent:
        iconData = FontAwesomeIcons.signal;
        color = Colors.green;
        break;
      case NetworkSignalStrength.good:
        iconData = FontAwesomeIcons.signal;
        color = Colors.lightGreen;
        break;
      case NetworkSignalStrength.fair:
        iconData = FontAwesomeIcons.signal;
        color = Colors.orange;
        break;
      case NetworkSignalStrength.poor:
        iconData = FontAwesomeIcons.signal;
        color = Colors.red;
        break;
      case NetworkSignalStrength.none:
        iconData = FontAwesomeIcons.xmark;
        color = Colors.grey;
        break;
    }

    return FaIcon(
      iconData,
      size: 12,
      color: showDetails ? color : Colors.white,
    );
  }
}

class _NetworkDisconnectedWidget extends StatelessWidget {
  final bool showDetails;

  const _NetworkDisconnectedWidget({required this.showDetails});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: showDetails ? 32 : 24,
      padding: EdgeInsets.symmetric(
        horizontal: showDetails ? 12 : 6,
        vertical: showDetails ? 4 : 2,
      ),
      decoration: BoxDecoration(
        color: showDetails ? Colors.red.shade100 : Colors.transparent,
        borderRadius: BorderRadius.circular(showDetails ? 16 : 12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          FaIcon(
            FontAwesomeIcons.wifi,
            size: 14,
            color: showDetails ? Colors.red : Colors.redAccent,
          ),
          if (showDetails) ...[
            const SizedBox(width: 6),
            const Text(
              'No Internet',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Colors.red,
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () {
                context.read<NetworkCubit>().openWiFiSettings();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.blue.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'Open Settings',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: Colors.blue,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _NetworkErrorWidget extends StatelessWidget {
  final String message;
  final bool showDetails;

  const _NetworkErrorWidget({required this.message, required this.showDetails});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: showDetails ? 32 : 24,
      padding: EdgeInsets.symmetric(
        horizontal: showDetails ? 12 : 6,
        vertical: showDetails ? 4 : 2,
      ),
      decoration: BoxDecoration(
        color: showDetails ? Colors.orange.shade100 : Colors.transparent,
        borderRadius: BorderRadius.circular(showDetails ? 16 : 12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          FaIcon(
            FontAwesomeIcons.triangleExclamation,
            size: 14,
            color: showDetails ? Colors.orange : Colors.orangeAccent,
          ),
          if (showDetails) ...[
            const SizedBox(width: 6),
            const Text(
              'Network Error',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: Colors.orange,
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () {
                context.read<NetworkCubit>().checkNetworkStatus();
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: Colors.blue.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'Retry',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: Colors.blue,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class NetworkStatusBar extends StatelessWidget {
  const NetworkStatusBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 40,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: NetworkStatusWidget(showDetails: true),
    );
  }
}
