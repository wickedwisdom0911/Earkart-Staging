import 'package:earkart_omni/config/widgets/custom_text_field.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:flutter/material.dart';

class AddressInformationWidget extends StatelessWidget {
  final TextEditingController addressController;
  final TextEditingController pincodeController;

  const AddressInformationWidget({
    super.key,
    required this.addressController,
    required this.pincodeController,
  });

  @override
  Widget build(BuildContext context) {
    return _buildSection(
      title: "Address Information",
      children: [
        CustomTextField(
          hint: "Enter address (optional)",
          title: "Address",
          controller: addressController,
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: CustomTextField(
                hint: "Enter pincode (optional)",
                title: "Pincode",
                controller: pincodeController,
                keyboardType: TextInputType.number,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSection({
    required String title,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 16),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Constants.primaryColor,
              letterSpacing: 0.3,
            ),
          ),
        ),
        ...children,
        const SizedBox(height: 20),
      ],
    );
  }
}
