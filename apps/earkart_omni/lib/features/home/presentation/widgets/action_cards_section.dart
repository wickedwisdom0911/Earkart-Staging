import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/features/device/presentation/pages/device_info_screen.dart';
import 'package:earkart_omni/features/patients/presentation/pages/all_patients_screen.dart';
import 'package:earkart_omni/features/patients/presentation/pages/patient_phone_screen.dart';
import 'package:flutter/material.dart';

class ActionCardsSection extends StatelessWidget {
  const ActionCardsSection({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Quick Actions",
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w500,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: ActionCard(
                icon: Icons.people_outline,
                title: "View Patients",
                subtitle: "Browse all patients",
                color: Constants.secondaryColor,
                onTap: () {
                  Navigator.pushNamed(context, AllPatientsScreen.routeName);
                },
              ),
            ),
            const SizedBox(width: 24),
            Expanded(
              child: ActionCard(
                highlightyBorder: true,
                icon: Icons.add_circle_outline,
                title: "Create a New Consultation",
                subtitle: "New consultation",
                color: Colors.green,
                onTap: () {
                  Navigator.pushNamed(context, PatientPhoneScreen.routeName);
                },
              ),
            ),
            const SizedBox(width: 24),
            Expanded(
              child: ActionCard(
                icon: Icons.info_outline,
                title: "Device Information",
                subtitle: "Know Your Omni",
                color: Constants.secondaryColor,
                onTap: () {
                  Navigator.pushNamed(context, DeviceInfoScreen.routeName);
                },
              ),
            ),
            const SizedBox(width: 24),
            Expanded(
              child: ActionCard(
                icon: Icons.help_outline,
                title: "Contact Earkart's Support Team",
                subtitle: "Raise Ticket",
                color: Constants.secondaryColor,
                onTap: () {
                  _showSupportDialog(context);
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  void _showSupportDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Constants.secondaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.email_outlined,
                  color: Constants.secondaryColor,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              const Text(
                'Contact Support',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Please send an email to:',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[200]!),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.email,
                      color: Constants.secondaryColor,
                      size: 16,
                    ),
                    const SizedBox(width: 8),
                    const Text(
                      'omnisupport@earkart.in',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'for your queries and to get instant resolution.',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              style: TextButton.styleFrom(
                backgroundColor: Constants.secondaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'Got it',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
            ),
          ],
        );
      },
    );
  }
}

class ActionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;
  final bool highlightyBorder;

  const ActionCard({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.color,
    required this.onTap,
    this.highlightyBorder = false,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border:
                highlightyBorder
                    ? Border.all(color: color.withAlpha(90), width: 1.5)
                    : Border.all(color: Colors.grey.withAlpha(90), width: 1),
            boxShadow:
                highlightyBorder
                    ? [
                      BoxShadow(
                        color: color.withAlpha(40),
                        blurRadius: 10,
                        offset: const Offset(0, 8),
                      ),
                    ]
                    : null,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(height: 16),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 14),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 14,
                  vertical: 12,
                ),
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  subtitle,
                  style: const TextStyle(fontSize: 14, color: Colors.white),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
