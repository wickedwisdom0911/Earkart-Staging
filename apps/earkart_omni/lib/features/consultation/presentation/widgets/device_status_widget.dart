import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.state.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/services/battery_service.dart';

class DeviceStatusWidget extends StatelessWidget {
  const DeviceStatusWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DeviceCubit, DeviceState>(
      builder: (context, deviceState) {
        return BlocBuilder<CommunicationCubit, CommunicationState>(
          builder: (context, commState) {
            final r15cStatus = _getR15CStatus(deviceState, commState);
            final revo2Status = _getRevo2Status(deviceState);

            return Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Flexible(
                  child: _buildDeviceStatus(
                    'R15C',
                    r15cStatus,
                    Icons.hearing,
                    context,
                    commState,
                  ),
                ),
                const SizedBox(width: 6),
                Flexible(
                  child: _buildDeviceStatus(
                    'Revo2',
                    revo2Status,
                    Icons.videocam,
                    context,
                    commState,
                  ),
                ),
                const SizedBox(width: 4),
                // Tablet battery indicator
                Flexible(child: _buildTabletBatteryIndicator(context)),
              ],
            );
          },
        );
      },
    );
  }

  DeviceStatus _getR15CStatus(
    DeviceState deviceState,
    CommunicationState commState,
  ) {
    // Check if R15C device is connected
    final isConnected = deviceState.maybeWhen(
      success: (devices, r15cDevice, revo2Device) => r15cDevice != null,
      orElse: () => false,
    );

    if (!isConnected) {
      return DeviceStatus.disconnected;
    }

    // Check communication state
    if (commState.error != null) {
      return DeviceStatus.error;
    }

    if (commState.isInBeginMode) {
      return DeviceStatus.active;
    }

    if (commState.isSynced) {
      // If synced and has transducer response, show as ready (green)
      if (commState.transducerResponse != null) {
        return DeviceStatus.ready;
      }
      // If synced but no transducer response yet, show as syncing (purple)
      return DeviceStatus.syncing;
    }

    // If communication is connected but not synced, show as connecting
    if (commState.isConnected) {
      return DeviceStatus.connecting;
    }

    // If device is physically connected but communication is not established yet,
    // show as connected (green) - this handles app restart scenario
    return DeviceStatus.connected;
  }

  DeviceStatus _getRevo2Status(DeviceState deviceState) {
    // Check if Revo2 device is connected
    final isConnected = deviceState.maybeWhen(
      success: (devices, r15cDevice, revo2Device) => revo2Device != null,
      orElse: () => false,
    );

    if (!isConnected) {
      return DeviceStatus.disconnected;
    }

    // Device is connected - camera state is handled by the widget itself
    return DeviceStatus.connected;
  }

  Widget _buildDeviceStatus(
    String deviceName,
    DeviceStatus status,
    IconData icon,
    BuildContext context,
    CommunicationState commState,
  ) {
    final statusConfig = _getStatusConfig(status);
    final tooltip = '$deviceName: ${statusConfig.label}';

    // Get battery info for R15C device
    String batteryInfo = '';
    if (deviceName == 'R15C' && commState.isConnected) {
      final batteryLevel = commState.batteryLevel;
      final isCharging = commState.isCharging;
      batteryInfo = ' | Battery: ${batteryLevel}%${isCharging ? ' ⚡' : ''}';
    }

    return Tooltip(
      message: tooltip + batteryInfo,
      child: Container(
        constraints: const BoxConstraints(minWidth: 60, maxWidth: 120),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        decoration: BoxDecoration(
          color: statusConfig.color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: statusConfig.color.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 14, color: statusConfig.color),
            const SizedBox(width: 3),
            Container(
              width: 5,
              height: 5,
              decoration: BoxDecoration(
                color: statusConfig.color,
                shape: BoxShape.circle,
              ),
            ),
            // Show battery indicator for R15C if connected
            if (deviceName == 'R15C' && commState.isConnected) ...[
              const SizedBox(width: 4),
              _buildBatteryIndicator(
                commState.batteryLevel,
                commState.isCharging,
                size: 12,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTabletBatteryIndicator(BuildContext context) {
    return BlocBuilder<CommunicationCubit, CommunicationState>(
      builder: (context, commState) {
        final level = commState.tabletBatteryLevel;
        final isCharging = commState.isTabletBatteryCharging;

        return Tooltip(
          message: 'Tablet Battery: $level%${isCharging ? ' ⚡' : ''}',
          child: Container(
            constraints: const BoxConstraints(minWidth: 40, maxWidth: 80),
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.grey.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey.withOpacity(0.3), width: 1),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.battery_std, size: 12, color: Colors.grey[600]),
                const SizedBox(width: 2),
                _buildBatteryIndicator(level, isCharging, size: 10),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildBatteryIndicator(
    int level,
    bool isCharging, {
    double size = 12,
  }) {
    Color batteryColor;
    if (level > 50) {
      batteryColor = Colors.green;
    } else if (level > 20) {
      batteryColor = Colors.orange;
    } else {
      batteryColor = Colors.red;
    }

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          '$level%',
          style: TextStyle(
            fontSize: size - 2,
            color: batteryColor,
            fontWeight: FontWeight.bold,
          ),
        ),
        if (isCharging) ...[
          const SizedBox(width: 2),
          Icon(Icons.bolt, size: size - 2, color: Colors.yellow[700]),
        ],
      ],
    );
  }

  StatusConfig _getStatusConfig(DeviceStatus status) {
    switch (status) {
      case DeviceStatus.connected:
        return StatusConfig(label: 'Connected', color: Colors.blue);
      case DeviceStatus.ready:
        return StatusConfig(label: 'Ready', color: Colors.green);
      case DeviceStatus.active:
        return StatusConfig(label: 'Active', color: Colors.orange);
      case DeviceStatus.connecting:
        return StatusConfig(label: 'Connecting', color: Colors.yellow);
      case DeviceStatus.syncing:
        return StatusConfig(label: 'Syncing', color: Colors.purple);
      case DeviceStatus.error:
        return StatusConfig(label: 'Error', color: Colors.red);
      case DeviceStatus.disconnected:
        return StatusConfig(label: 'Disconnected', color: Colors.grey);
    }
  }
}

enum DeviceStatus {
  connected,
  ready,
  active,
  connecting,
  syncing,
  error,
  disconnected,
}

class StatusConfig {
  final String label;
  final Color color;

  StatusConfig({required this.label, required this.color});
}
