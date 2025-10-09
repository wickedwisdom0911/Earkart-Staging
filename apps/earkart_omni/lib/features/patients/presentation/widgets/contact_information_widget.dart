import 'package:earkart_omni/config/widgets/custom_text_field.dart';
import 'package:earkart_omni/config/widgets/phone_number_input.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:flutter/material.dart';

class ContactInformationWidget extends StatelessWidget {
  final TextEditingController emailController;
  final TextEditingController phoneController;
  final String selectedCountryCode;
  final ValueChanged<String> onCountryCodeChanged;
  final ValueChanged<String> onPhoneNumberChanged;
  final String? Function(String?) emailValidator;
  final String? Function(String?) phoneValidator;

  const ContactInformationWidget({
    super.key,
    required this.emailController,
    required this.phoneController,
    required this.selectedCountryCode,
    required this.onCountryCodeChanged,
    required this.onPhoneNumberChanged,
    required this.emailValidator,
    required this.phoneValidator,
  });

  @override
  Widget build(BuildContext context) {
    return _buildSection(
      title: "Contact Information",
      children: [
        CustomTextField(
          hint: "Enter email address (optional)",
          title: "Email Address",
          controller: emailController,
          keyboardType: TextInputType.emailAddress,
          validator: emailValidator,
        ),
        const SizedBox(height: 16),
        PhoneNumberInput(
          countryCode: selectedCountryCode,
          phoneNumber: phoneController.text,
          onCountryCodeChanged: onCountryCodeChanged,
          onPhoneNumberChanged: onPhoneNumberChanged,
          title: "Phone Number *",
          hint: "Enter phone number",
          controller: phoneController,
          validator: phoneValidator,
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
