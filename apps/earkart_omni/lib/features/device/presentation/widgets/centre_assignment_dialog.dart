import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:flutter/material.dart';
import 'package:fluttertoast/fluttertoast.dart';

class CentreAssignmentDialog extends StatelessWidget {
  final DeviceEntity device;
  final VoidCallback onConfirm;
  final VoidCallback onCancel;

  const CentreAssignmentDialog({
    super.key,
    required this.device,
    required this.onConfirm,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final centre = device.centre;
    if (centre == null) return const SizedBox.shrink();

    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: Row(
        children: [
          Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Double Check Device Assignment!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Constants.primaryColor,
              ),
            ),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'The device code you entered is already assigned to a centre:',
            style: TextStyle(fontSize: 16, color: Constants.secondaryColor),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildCentreInfoRow('Centre Name', centre.entName),
                _buildCentreInfoRow('Centre Code', centre.code),
                _buildCentreInfoRow('Address', centre.address),
                _buildCentreInfoRow('Contact', centre.contactNumber),
                if (centre.city != null)
                  _buildCentreInfoRow('City', centre.city!.name),
                _buildCentreInfoRow('Pincode', centre.pincode),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Are you sure that the tablet you are setting up is going to this centre?',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: Constants.primaryColor,
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: onCancel,
          child: Text(
            'Cancel',
            style: TextStyle(
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        ElevatedButton(
          onPressed: () {
            onConfirm();
            Fluttertoast.showToast(
              msg:
                  "Device confirmed! Click Register Device to complete registration.",
            );
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Constants.primaryColor,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: const Text(
            'Yes, Continue',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }

  Widget _buildCentreInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
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

  static void show({
    required BuildContext context,
    required DeviceEntity device,
    required VoidCallback onConfirm,
    required VoidCallback onCancel,
  }) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return CentreAssignmentDialog(
          device: device,
          onConfirm: onConfirm,
          onCancel: onCancel,
        );
      },
    );
  }
}
