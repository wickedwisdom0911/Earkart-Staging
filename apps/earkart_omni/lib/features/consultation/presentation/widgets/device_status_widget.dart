import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.state.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';

class DeviceStatusWidget extends StatelessWidget {
  const DeviceStatusWidget({super.key});

  @override
  Widget build(BuildContext context) {
    di<ILogger>().info(
      '🔧 DeviceStatusWidget - build() called at ${DateTime.now()}',
    );
    print('🔧 DeviceStatusWidget - build() called at ${DateTime.now()}');

    return BlocBuilder<DeviceCubit, DeviceState>(
      builder: (context, deviceState) {
        di<ILogger>().info(
          '🔧 DeviceStatusWidget - DeviceCubit state changed: $deviceState',
        );
        print(
          '🔧 DeviceStatusWidget - DeviceCubit state changed at ${DateTime.now()}: $deviceState',
        );

        return BlocBuilder<CommunicationCubit, CommunicationState>(
          builder: (context, commState) {
            di<ILogger>().info(
              '🔧 DeviceStatusWidget - CommunicationCubit state changed: ${commState.isConnected}, ${commState.isSynced}',
            );
            print(
              '🔧 DeviceStatusWidget - CommunicationCubit state changed at ${DateTime.now()}: ${commState.isConnected}, ${commState.isSynced}',
            );

            final r15cStatus = _getR15CStatus(deviceState, commState);
            final revo2Status = _getRevo2Status(deviceState);

            // Enhanced debug logging for device status
            di<ILogger>().info(
              '🔧 DeviceStatusWidget - R15C: $r15cStatus, Revo2: $revo2Status',
            );
            print(
              '🔧 DeviceStatusWidget - Status at ${DateTime.now()}: R15C: $r15cStatus, Revo2: $revo2Status',
            );
            di<ILogger>().debug(
              'DeviceStatusWidget - DeviceState: $deviceState',
            );
            di<ILogger>().debug(
              'DeviceStatusWidget - CommState: ${commState.isConnected}, ${commState.isSynced}, ${commState.transducerResponse != null}',
            );

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
                  ),
                ),
                const SizedBox(width: 6),
                Flexible(
                  child: _buildDeviceStatus(
                    'Revo2',
                    revo2Status,
                    Icons.videocam,
                    context,
                  ),
                ),
                const SizedBox(width: 4),
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

    if (commState.transducerResponse != null) {
      return DeviceStatus.ready;
    }

    if (commState.isSynced) {
      return DeviceStatus.syncing;
    }

    if (commState.isConnected) {
      return DeviceStatus.connected;
    }

    return DeviceStatus.connecting;
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
  ) {
    final statusConfig = _getStatusConfig(status);
    final tooltip = '$deviceName: ${statusConfig.label}';

    return Tooltip(
      message: tooltip,
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
          ],
        ),
      ),
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
