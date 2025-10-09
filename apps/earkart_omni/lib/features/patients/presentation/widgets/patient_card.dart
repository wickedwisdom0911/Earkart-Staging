import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class PatientCard extends StatelessWidget {
  final PatientEntity patient;

  const PatientCard({super.key, required this.patient});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Avatar
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: Constants.accentColor,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(
                  _getInitials(patient.name),
                  style: TextStyle(
                    fontSize: 18,
                    color: Constants.secondaryColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            // Patient Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Name and Gender
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          patient.name,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.black87,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: _getGenderColor(
                            patient.gender,
                          ).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          patient.gender.name.toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            color: _getGenderColor(patient.gender),
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  // Contact Info
                  _InfoRow(
                    icon: Icons.phone_outlined,
                    text: patient.contactNumber,
                    iconColor: Colors.grey.shade600,
                  ),
                  if (patient.email != null && patient.email!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    _InfoRow(
                      icon: Icons.email_outlined,
                      text: patient.email!.toLowerCase(),
                      iconColor: Colors.grey.shade600,
                    ),
                  ],
                  const SizedBox(height: 4),
                  _InfoRow(
                    icon: Icons.cake_outlined,
                    text: _getAgeOrDob(patient),
                    iconColor: Colors.grey.shade600,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getInitials(String name) {
    if (name.isEmpty) return "?";

    final nameParts = name.trim().split(' ');
    if (nameParts.length == 1) {
      return nameParts[0][0].toUpperCase();
    } else {
      final firstName = nameParts[0];
      final lastName = nameParts[nameParts.length - 1];
      return '${firstName[0]}${lastName[0]}'.toUpperCase();
    }
  }

  String _getAgeOrDob(PatientEntity patient) {
    final currentYear = DateTime.now().year;

    // If age is available and not null, show age
    if (patient.age != null) {
      return "${patient.age} years";
    }

    // If DOB is available, check if it's from current year or calculate age
    if (patient.dob != null) {
      try {
        final dobDate = DateTime.parse(patient.dob!);
        final dobYear = dobDate.year;

        // If DOB is from current year, show age as 0 or 1
        if (dobYear == currentYear) {
          final age = currentYear - dobYear;
          return age == 0 ? "Less than 1 year" : "$age years";
        } else {
          // Calculate age from DOB
          final age = currentYear - dobYear;
          return "$age years";
        }
      } catch (e) {
        // If parsing fails, show the DOB as formatted date
        return DateFormat.yMd().format(DateTime.parse(patient.dob!));
      }
    }

    return "-";
  }

  Color _getGenderColor(Gender gender) {
    switch (gender) {
      case Gender.male:
        return const Color(0xFF3B82F6); // Modern blue
      case Gender.female:
        return const Color(0xFFEC4899); // Modern pink
      case Gender.other:
        return const Color(0xFF8B5CF6); // Modern purple
    }
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color iconColor;

  const _InfoRow({
    required this.icon,
    required this.text,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: iconColor),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey.shade700,
              fontWeight: FontWeight.w400,
            ),
          ),
        ),
      ],
    );
  }
}
