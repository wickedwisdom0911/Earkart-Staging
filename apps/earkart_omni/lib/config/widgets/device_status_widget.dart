import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.state.dart';

class DeviceStatusWidget extends StatelessWidget {
  final double borderRadius;

  const DeviceStatusWidget({super.key, this.borderRadius = 12.0});

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
                    'Audiometer',
                    r15cStatus,
                    Icons.hearing,
                    context,
                    commState,
                  ),
                ),
                if (r15cStatus != DeviceStatus.disconnected) ...[
                  const SizedBox(width: 4),
                  _buildTurnOffButton(context, commState),
                ],
                const SizedBox(width: 8),
                Flexible(
                  child: _buildDeviceStatus(
                    'Otoscope',
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

    // Check communication state - prioritize error state
    if (commState.error != null) {
      return DeviceStatus.error;
    }

    // Check if in begin mode - this takes priority over ALL other states
    // Also check connectionStatus for "begin" as a fallback in case isInBeginMode flag is not set
    if (commState.isInBeginMode ||
        commState.connectionStatus.toLowerCase() == 'begin') {
      return DeviceStatus.active;
    }

    // Check if synced and has transducer response - this is the ready state
    // We check transducerResponse first to ensure we catch the ready state
    // even if there are timing issues with state updates
    if (commState.isSynced && commState.transducerResponse != null) {
      return DeviceStatus.ready;
    }

    // If synced but no transducer response yet, show as syncing
    if (commState.isSynced) {
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
    return DeviceStatus.ready;
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
      final isCharging = commState.isCharging ?? false;
      if (batteryLevel != null) {
        batteryInfo = ' | Battery: $batteryLevel%${isCharging ? ' ⚡' : ''}';
      }
    }

    // Add tap functionality for Audiometer to send sync packet
    Widget deviceContainer = Container(
      constraints: const BoxConstraints(minHeight: 32, minWidth: 32),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: statusConfig.color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(borderRadius),
        border: Border.all(
          color: statusConfig.color.withOpacity(0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 16, color: statusConfig.color),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              deviceName,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: statusConfig.color,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 4),
          Icon(_getStatusIcon(status), size: 14, color: statusConfig.color),
          // Show battery indicator for Audiometer (R15C) if connected and battery level is available
          if (deviceName == 'Audiometer' &&
              commState.isConnected &&
              commState.batteryLevel != null) ...[
            const SizedBox(width: 6),
            _buildBatteryIndicator(
              commState.batteryLevel!,
              commState.isCharging ?? false,
              size: 14,
            ),
          ],
        ],
      ),
    );

    // Wrap with GestureDetector for Audiometer to handle tap
    if (deviceName == 'Audiometer') {
      deviceContainer = GestureDetector(
        onTap: () async {
          final currentCommState = context.read<CommunicationCubit>().state;
          final r15cStatus = _getR15CStatus(
            context.read<DeviceCubit>().state,
            currentCommState,
          );

          // If device is in begin mode (active), send exit packet and then sync
          if (r15cStatus == DeviceStatus.active ||
              currentCommState.isInBeginMode ||
              currentCommState.connectionStatus.toLowerCase() == 'begin') {
            try {
              await context.read<CommunicationCubit>().sendExitPacket();
              // Wait a bit for the exit to complete before syncing
              await Future.delayed(const Duration(milliseconds: 1000));
              // Sync again after exit
              context.read<CommunicationCubit>().startSyncProcess();
            } catch (e) {
              // If exit fails, still try to sync
              context.read<CommunicationCubit>().startSyncProcess();
            }
          }
          // If device has error or is not synced, send startSyncProcess
          else if (r15cStatus == DeviceStatus.error ||
              r15cStatus == DeviceStatus.disconnected ||
              r15cStatus == DeviceStatus.connecting ||
              r15cStatus == DeviceStatus.connected) {
            context.read<CommunicationCubit>().startSyncProcess();
          }
          // If device is synced but has no transducer response, send query packet
          else if (r15cStatus == DeviceStatus.syncing) {
            context.read<CommunicationCubit>().sendQueryInfoPacket();
          }
          // For other states (ready), just send sync packet as before
          else {
            context.read<CommunicationCubit>().sendSyncPacket();
          }
        },
        child: deviceContainer,
      );
    }

    return Tooltip(message: tooltip + batteryInfo, child: deviceContainer);
  }

  Widget _buildTurnOffButton(
    BuildContext context,
    CommunicationState commState,
  ) {
    return Tooltip(
      message: 'Turn off audiometer',
      child: GestureDetector(
        onTap: () async {
          // Show confirmation dialog
          final confirmed = await showDialog<bool>(
            context: context,
            builder: (BuildContext context) {
              return AlertDialog(
                title: const Text('Turn Off Audiometer'),
                content: const Text(
                  'Are you sure you want to turn off the audiometer? This will power down the device.',
                ),
                actions: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(false),
                    child: const Text('Cancel'),
                  ),
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(true),
                    style: TextButton.styleFrom(foregroundColor: Colors.red),
                    child: const Text('Turn Off'),
                  ),
                ],
              );
            },
          );

          if (confirmed == true) {
            try {
              await context
                  .read<CommunicationCubit>()
                  .sendExitAndPowerOffPacket(true);
            } catch (e) {
              context.read<CommunicationCubit>().resetState();
            }
          }
        },
        child: Container(
          constraints: const BoxConstraints(minHeight: 32, minWidth: 32),
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.red.withOpacity(0.1),
            borderRadius: BorderRadius.circular(borderRadius * 0.67),
            border: Border.all(color: Colors.red.withOpacity(0.3), width: 1),
          ),
          child: Icon(
            Icons.power_settings_new,
            size: 14,
            color: Colors.red[600],
          ),
        ),
      ),
    );
  }

  Widget _buildTabletBatteryIndicator(BuildContext context) {
    return BlocBuilder<CommunicationCubit, CommunicationState>(
      builder: (context, commState) {
        final level = commState.tabletBatteryLevel;
        final isCharging = commState.isTabletBatteryCharging ?? false;
        final isLoading = commState.isTabletBatteryLoading;

        // Build tooltip message based on state
        String tooltipMessage;
        if (isLoading) {
          tooltipMessage = 'Tablet Battery: Loading...';
        } else if (level != null) {
          tooltipMessage = 'Tablet Battery: $level%${isCharging ? ' ⚡' : ''}';
        } else {
          tooltipMessage = 'Tablet Battery: Not Available';
        }

        return Tooltip(
          message: tooltipMessage,
          child: GestureDetector(
            onTap: () {
              // Manual refresh on tap for testing
              context.read<CommunicationCubit>().forceRefreshTabletBattery();
            },
            child: Container(
              constraints: const BoxConstraints(minHeight: 32, minWidth: 32),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.1),
                borderRadius: BorderRadius.circular(
                  borderRadius * 0.67,
                ), // Slightly smaller for tablet battery
                border: Border.all(
                  color: Colors.grey.withOpacity(0.3),
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    _getTabletBatteryIcon(level, isCharging),
                    size: 14,
                    color: _getTabletBatteryIconColor(level, isCharging),
                  ),
                  const SizedBox(width: 4),
                  // Show loading, battery indicator, or just icon based on state
                  if (isLoading)
                    SizedBox(
                      width: 10,
                      height: 10,
                      child: CircularProgressIndicator(
                        strokeWidth: 1.5,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Colors.grey[600]!,
                        ),
                      ),
                    )
                  else if (level != null)
                    _buildBatteryIndicator(level, isCharging, size: 12),
                  // If level is null and not loading, show nothing (just the battery icon)
                ],
              ),
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
        return StatusConfig(label: 'Active', color: Colors.green);
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

  IconData _getStatusIcon(DeviceStatus status) {
    switch (status) {
      case DeviceStatus.connected:
        return Icons.check_circle;
      case DeviceStatus.ready:
        return Icons.check_circle;
      case DeviceStatus.active:
        return Icons.check_circle;
      case DeviceStatus.connecting:
        return Icons.sync;
      case DeviceStatus.syncing:
        return Icons.sync;
      case DeviceStatus.error:
        return Icons.error;
      case DeviceStatus.disconnected:
        return Icons.cancel;
    }
  }

  IconData _getTabletBatteryIcon(int? level, bool isCharging) {
    if (isCharging) {
      return Icons.battery_charging_full;
    }

    if (level == null) {
      return Icons.battery_unknown;
    }

    if (level >= 90) {
      return Icons.battery_full;
    } else if (level >= 60) {
      return Icons.battery_5_bar;
    } else if (level >= 40) {
      return Icons.battery_4_bar;
    } else if (level >= 20) {
      return Icons.battery_2_bar;
    } else if (level >= 10) {
      return Icons.battery_1_bar;
    } else {
      return Icons.battery_0_bar;
    }
  }

  Color _getTabletBatteryIconColor(int? level, bool isCharging) {
    if (isCharging) {
      return Colors.green[600]!;
    }

    if (level == null) {
      return Colors.grey[600]!;
    }

    if (level >= 50) {
      return Colors.green[600]!;
    } else if (level >= 20) {
      return Colors.orange[600]!;
    } else {
      return Colors.red[600]!;
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
