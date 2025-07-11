import 'package:earkart_omni/config/widgets/gradient_button.dart';
import 'package:earkart_omni/config/widgets/helpers.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:earkart_omni/features/consultation/presentation/pages/consultation_screen.dart';
import 'package:earkart_omni/features/home/presentation/pages/root_screen.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.state.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class ConsultationRequestScreen extends StatefulWidget {
  static const routeName = '/consultation-request';
  const ConsultationRequestScreen({super.key});

  @override
  State<ConsultationRequestScreen> createState() =>
      _ConsultationRequestScreenState();
}

class _ConsultationRequestScreenState extends State<ConsultationRequestScreen> {
  @override
  void initState() {
    super.initState();
    context.read<PatientCubit>().getCurrentPatient();
  }

  void startConsultation() {
    context.read<ConsultationCubit>().createConsultation();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        title: const Text(
          'Consultation Request',
          style: TextStyle(
            color: Colors.black87,
            fontSize: 24,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: CupertinoButton(
              padding: EdgeInsets.zero,
              onPressed: () {
                context.read<PatientCubit>().deletePatientSession();
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  RootScreen.routeName,
                  (route) => false,
                );
              },
              child: const Text(
                'Cancel',
                style: TextStyle(
                  color: Colors.red,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
        ],
      ),
      body: BlocBuilder<PatientCubit, PatientState>(
        builder: (context, state) {
          return state.maybeWhen(
            orElse: () => const Center(child: CircularProgressIndicator()),
            currentPatientSuccess:
                (patient) => Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header section
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.blue.shade600,
                              Colors.blue.shade800,
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.blue.shade200,
                              blurRadius: 20,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(
                                    Icons.person,
                                    color: Colors.white,
                                    size: 24,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        patient?.name ?? 'Unknown Patient',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 24,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        patient?.contactNumber ?? 'No contact',
                                        style: TextStyle(
                                          color: Colors.white.withOpacity(0.8),
                                          fontSize: 16,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Patient Details
                      Expanded(
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.grey.shade200,
                                blurRadius: 15,
                                offset: const Offset(0, 5),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Patient Details',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black87,
                                ),
                              ),
                              const SizedBox(height: 20),
                              Expanded(
                                child: ListView(
                                  physics: const BouncingScrollPhysics(),
                                  children: [
                                    _buildInfoTile(
                                      Icons.email_outlined,
                                      'Email',
                                      patient?.email ?? 'Not provided',
                                    ),
                                    _buildInfoTile(
                                      Icons.cake_outlined,
                                      'Date of Birth',
                                      patient?.dob ?? 'Not provided',
                                    ),
                                    _buildInfoTile(
                                      Icons.wc_outlined,
                                      'Gender',
                                      patient?.gender.name ?? 'Not specified',
                                    ),
                                    _buildInfoTile(
                                      Icons.home_outlined,
                                      'Address',
                                      patient?.address ?? 'Not provided',
                                    ),
                                    _buildInfoTile(
                                      Icons.location_city_outlined,
                                      'District',
                                      patient?.district?.name ??
                                          'Not specified',
                                    ),
                                    _buildInfoTile(
                                      Icons.pin_drop_outlined,
                                      'Pincode',
                                      patient?.pincode ?? 'Not provided',
                                    ),
                                    _buildInfoTile(
                                      Icons.language_outlined,
                                      'Language',
                                      patient?.language?.name ??
                                          'Not specified',
                                    ),
                                    _buildInfoTile(
                                      Icons.verified_user_outlined,
                                      'Status',
                                      patient?.status?.name ?? 'Unknown',
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Start Consultation Button
                      BlocConsumer<ConsultationCubit, ConsultationState>(
                        listener: (context, state) {
                          if (state.maybeWhen(
                            orElse: () => false,
                            createConsultationSuccess: (_) => true,
                          )) {
                            Navigator.pushNamed(
                              context,
                              ConsultationScreen.routeName,
                            );
                          }
                        },
                        builder: (context, state) {
                          return Container(
                            width: double.infinity,
                            height: 56,
                            child: ElevatedButton(
                              onPressed: startConsultation,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green.shade600,
                                elevation: 0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(16),
                                ),
                              ),
                              child: const Text(
                                'Start Consultation',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
          );
        },
      ),
    );
  }

  Widget _buildInfoTile(IconData icon, String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.blue.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: Colors.blue.shade600, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
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
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
