import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:flutter/material.dart';

class DeviceDetailsFromServer extends StatelessWidget {
  final DeviceEntity device;

  const DeviceDetailsFromServer({super.key, required this.device});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          const SizedBox(height: 16),
          _buildDeviceDetails(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        Icon(Icons.info_outline, color: Constants.primaryColor, size: 20),
        const SizedBox(width: 8),
        Text(
          'Device Details from Server',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Constants.primaryColor,
          ),
        ),
      ],
    );
  }

  Widget _buildDeviceDetails() {
    return Column(
      children: [
        _buildInfoRow('Device Code', device.code ?? 'Not Available'),
        _buildInfoRow('Audiometer ID', device.deviceID ?? 'Not Available'),
        _buildInfoRow('Otoscope ID', device.otoscopeID ?? 'Not Available'),
        _buildInfoRow('Tablet ID', device.tabletID ?? 'Not Available'),
        _buildInfoRow('Status', device.status.name),
        if (device.centre != null) ...[
          _buildInfoRow('Centre', device.centre?.user?.name ?? 'Not Available'),
          _buildInfoRow('Centre code', device.centre?.code ?? 'Not Available'),
        ],
      ],
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: Constants.secondaryColor,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 14,
                color: Constants.primaryColor,
                fontWeight: FontWeight.w400,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
