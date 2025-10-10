import 'package:earkart_omni/features/device/presentation/widgets/local_device_information.dart';
import 'package:earkart_omni/features/device/presentation/widgets/device_details_from_server.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:flutter/material.dart';

class DeviceInformationPanel extends StatelessWidget {
  final String? tabletID;
  final String? tabletAndroidVersion;
  final String? tabletAppVersion;
  final DeviceEntity? device;

  const DeviceInformationPanel({
    super.key,
    required this.tabletID,
    required this.tabletAndroidVersion,
    required this.tabletAppVersion,
    required this.device,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Local Device Information Section
        LocalDeviceInformation(
          tabletID: tabletID,
          tabletAndroidVersion: tabletAndroidVersion,
          tabletAppVersion: tabletAppVersion,
          device: device,
        ),

        const SizedBox(height: 20),

        // Device Details Section (from API)
        if (device != null) DeviceDetailsFromServer(device: device!),
      ],
    );
  }
}
