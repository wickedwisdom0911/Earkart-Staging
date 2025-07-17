import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/uvc_camera.cubit.dart';

class DeviceStatusWidget extends StatelessWidget {
  const DeviceStatusWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DeviceCubit, DeviceState>(
      builder: (context, deviceState) {
        return BlocBuilder<CommunicationCubit, CommunicationState>(
          builder: (context, commState) {
            return BlocBuilder<UVCCameraCubit, UVCCameraCubitState>(
              builder: (context, cameraState) {
                final r15cStatus = _getR15CStatus(deviceState, commState);
                final revo2Status = _getRevo2Status(deviceState, cameraState);

                return Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildDeviceStatus(
                      'R15C',
                      r15cStatus,
                      Icons.hearing,
                      context,
                    ),
                    const SizedBox(width: 8),
                    _buildDeviceStatus(
                      'Revo2',
                      revo2Status,
                      Icons.videocam,
                      context,
                    ),
                  ],
                );
              },
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

  DeviceStatus _getRevo2Status(
    DeviceState deviceState,
    UVCCameraCubitState cameraState,
  ) {
    // Check if Revo2 device is connected
    final isConnected = deviceState.maybeWhen(
      success: (devices, r15cDevice, revo2Device) => revo2Device != null,
      orElse: () => false,
    );

    if (!isConnected) {
      return DeviceStatus.disconnected;
    }

    // Check camera state
    switch (cameraState.status) {
      case UVCCameraStatus.connected:
        return DeviceStatus.ready;
      case UVCCameraStatus.connecting:
        return DeviceStatus.connecting;
      case UVCCameraStatus.error:
        return DeviceStatus.error;
      case UVCCameraStatus.disconnected:
        return DeviceStatus
            .connected; // Device connected but camera not initialized
    }
  }

  Widget _buildDeviceStatus(
    String deviceName,
    DeviceStatus status,
    IconData icon,
    BuildContext context,
  ) {
    final statusConfig = _getStatusConfig(status);
    final tooltip = '$deviceName: ${statusConfig.label}';

    return GestureDetector(
      onLongPress: () {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(tooltip),
            duration: const Duration(seconds: 1),
            behavior: SnackBarBehavior.floating,
            margin: const EdgeInsets.all(8),
          ),
        );
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        height: 24,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: statusConfig.backgroundColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: statusConfig.borderColor, width: 1.2),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: statusConfig.iconColor),
            const SizedBox(width: 4),
            Icon(
              statusConfig.statusIcon,
              size: 10,
              color: statusConfig.iconColor,
            ),
          ],
        ),
      ),
    );
  }

  _StatusConfig _getStatusConfig(DeviceStatus status) {
    switch (status) {
      case DeviceStatus.ready:
        return _StatusConfig(
          label: 'Ready',
          backgroundColor: Colors.green.shade50,
          borderColor: Colors.green.shade100,
          iconColor: Colors.green.shade600,
          statusIcon: Icons.check_circle,
        );
      case DeviceStatus.active:
        return _StatusConfig(
          label: 'Active',
          backgroundColor: Colors.blue.shade50,
          borderColor: Colors.blue.shade100,
          iconColor: Colors.blue.shade600,
          statusIcon: Icons.play_circle_filled,
        );
      case DeviceStatus.connected:
        return _StatusConfig(
          label: 'Connected',
          backgroundColor: Colors.blue.shade50,
          borderColor: Colors.blue.shade100,
          iconColor: Colors.blue.shade600,
          statusIcon: Icons.circle,
        );
      case DeviceStatus.syncing:
        return _StatusConfig(
          label: 'Syncing',
          backgroundColor: Colors.orange.shade50,
          borderColor: Colors.orange.shade100,
          iconColor: Colors.orange.shade600,
          statusIcon: Icons.sync,
        );
      case DeviceStatus.connecting:
        return _StatusConfig(
          label: 'Connecting',
          backgroundColor: Colors.orange.shade50,
          borderColor: Colors.orange.shade100,
          iconColor: Colors.orange.shade600,
          statusIcon: Icons.hourglass_empty,
        );
      case DeviceStatus.error:
        return _StatusConfig(
          label: 'Error',
          backgroundColor: Colors.red.shade50,
          borderColor: Colors.red.shade100,
          iconColor: Colors.red.shade600,
          statusIcon: Icons.error,
        );
      case DeviceStatus.disconnected:
        return _StatusConfig(
          label: 'Disconnected',
          backgroundColor: Colors.grey.shade50,
          borderColor: Colors.grey.shade100,
          iconColor: Colors.grey.shade500,
          statusIcon: Icons.circle_outlined,
        );
    }
  }
}

class _StatusConfig {
  final String label;
  final Color backgroundColor;
  final Color borderColor;
  final Color iconColor;
  final IconData statusIcon;

  const _StatusConfig({
    required this.label,
    required this.backgroundColor,
    required this.borderColor,
    required this.iconColor,
    required this.statusIcon,
  });
}

enum DeviceStatus {
  ready,
  active,
  connected,
  syncing,
  connecting,
  error,
  disconnected,
}
