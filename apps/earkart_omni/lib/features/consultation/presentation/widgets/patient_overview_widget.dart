import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class PatientOverviewWidget extends StatelessWidget {
  final PatientEntity patient;

  const PatientOverviewWidget({super.key, required this.patient});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 60),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Expanded(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Left Column - Avatar, Name, and 2x2 Grid
                Expanded(child: _buildLeftColumn()),
                const SizedBox(width: 20),
                Expanded(child: _buildRightColumn()),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLeftColumn() {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          right: BorderSide(color: Constants.accentColor, width: 2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Avatar
          Container(
            width: 150,
            height: 150,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(100),
            ),
            child: Center(
              child: Text(
                _getInitials(patient.name),
                style: const TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Patient Name
          Text(
            patient.name,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),

          // 2x2 Grid
          Expanded(child: _buildInfoGrid()),
        ],
      ),
    );
  }

  Widget _buildInfoGrid() {
    // Determine what to show for age/DOB
    String ageOrDobLabel;
    String ageOrDobValue;

    if (patient.age != null) {
      ageOrDobLabel = 'Age';
      ageOrDobValue = patient.age.toString();
    } else {
      ageOrDobLabel = 'DOB';
      ageOrDobValue = _formatDateOfBirth(patient.dob);
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 30.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          // First Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(child: _buildDetailRow(ageOrDobLabel, ageOrDobValue)),
              _buildDetailRow(
                'Gender',
                _genderToString(patient.gender),
                alignRight: true,
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Second Row
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              Expanded(
                child: _buildDetailRow(
                  'City',
                  patient.city?.name ?? 'Not specified',
                ),
              ),
              _buildDetailRow(
                'PIN Code',
                patient.pincode ?? 'Not provided',
                alignRight: true,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRightColumn() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildDetailRow(
                'Language',
                patient.language?.name ?? 'Not Specified',
              ),
              const SizedBox(height: 26),
              _buildDetailRow('Email Address', patient.email ?? 'Not provided'),
              const SizedBox(height: 26),
              _buildDetailRow('Mobile Number', patient.contactNumber),
              const SizedBox(height: 26),
              Expanded(
                child: _buildDetailRow(
                  'Complete Address',
                  _buildCompleteAddress(),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _buildCompleteAddress() {
    List<String> addressParts = [];

    // Add base address if available
    if (patient.address != null && patient.address!.isNotEmpty) {
      addressParts.add(patient.address!);
    }

    // Add city if available
    final cityName = patient.city?.name;
    if (cityName != null && cityName.isNotEmpty) {
      addressParts.add(cityName);
    }

    // Add district if available
    final districtName = patient.district?.name;
    if (districtName != null && districtName.isNotEmpty) {
      addressParts.add(districtName);
    }

    // Add state if available
    final stateName = patient.state?.name;
    if (stateName != null && stateName.isNotEmpty) {
      addressParts.add(stateName);
    }

    // Add country if available
    final countryName = patient.country?.name;
    if (countryName != null && countryName.isNotEmpty) {
      addressParts.add(countryName);
    }

    // Join all parts with comma and space
    String completeAddress = addressParts.join(', ');

    // Return the complete address or a fallback message
    return completeAddress.isNotEmpty ? completeAddress : 'Not provided';
  }

  Widget _buildDetailRow(
    String label,
    String value, {
    bool alignRight = false,
  }) {
    return Column(
      crossAxisAlignment:
          alignRight ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Colors.grey.shade600,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
      ],
    );
  }

  String _formatDateOfBirth(String? dobString) {
    if (dobString == null || dobString.isEmpty) {
      return 'Not provided';
    }

    try {
      // Parse the ISO-8601 date string
      final DateTime dateTime = DateTime.parse(dobString);

      // Format to human-friendly string
      final String formattedDate = DateFormat('MMMM dd, yyyy').format(dateTime);
      return formattedDate;
    } catch (e) {
      // If parsing fails, return the original string or a fallback
      return dobString;
    }
  }

  String _getInitials(String name) {
    if (name.isEmpty) return 'U';
    final words = name.trim().split(' ');
    if (words.length >= 2) {
      return '${words[0][0]}${words[1][0]}'.toUpperCase();
    }
    return words[0][0].toUpperCase();
  }

  String _genderToString(Gender gender) {
    switch (gender) {
      case Gender.male:
        return 'Male';
      case Gender.female:
        return 'Female';
      case Gender.other:
        return 'Other';
    }
  }
}
