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
            fontWeight: FontWeight.w600,
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
                color: Colors.blue,
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
                color: Colors.blue,
                onTap: () {},
              ),
            ),
            const SizedBox(width: 24),
            Expanded(
              child: ActionCard(
                icon: Icons.help_outline,
                title: "Contact Earkart's Support Team",
                subtitle: "Raise Ticket",
                color: Colors.blue,
                onTap: () {},
              ),
            ),
          ],
        ),
      ],
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
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
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
