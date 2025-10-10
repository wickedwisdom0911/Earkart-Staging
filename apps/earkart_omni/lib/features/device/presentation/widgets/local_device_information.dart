import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.state.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class LocalDeviceInformation extends StatelessWidget {
  final String? tabletID;
  final String? tabletAndroidVersion;
  final String? tabletAppVersion;
  final DeviceEntity? device;

  const LocalDeviceInformation({
    super.key,
    required this.tabletID,
    required this.tabletAndroidVersion,
    required this.tabletAppVersion,
    required this.device,
  });

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<CommunicationCubit, CommunicationState>(
      builder: (context, communicationState) {
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
              _buildLocalInfo(communicationState),
            ],
          ),
        );
      },
    );
  }

  Widget _buildHeader() {
    return Row(
      children: [
        Icon(Icons.phone_android, color: Constants.primaryColor, size: 20),
        const SizedBox(width: 8),
        Text(
          'Local Device Information',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: Constants.primaryColor,
          ),
        ),
      ],
    );
  }

  Widget _buildLocalInfo(CommunicationState communicationState) {
    return Column(
      children: [
        _buildInfoRow('Tablet ID', tabletID ?? 'Unknown'),
        _buildInfoRow('Android Version', tabletAndroidVersion ?? 'Unknown'),
        _buildInfoRow('App Version', tabletAppVersion ?? 'Unknown'),
        _buildDeviceIdRow(
          'Audiometer ID',
          communicationState.r15cSerialNumber ?? 'Not Connected',
        ),
        const SizedBox(height: 8),
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

  Widget _buildDeviceIdRow(String label, String value) {
    return Row(
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
    );
  }
}
