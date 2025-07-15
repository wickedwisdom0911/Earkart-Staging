import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:earkart_omni/features/consultation/presentation/pages/consultation_screen.dart';
import 'package:earkart_omni/features/home/presentation/pages/root_screen.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.state.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.state.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

class ConsultationRequestScreen extends StatefulWidget {
  static const routeName = '/consultation-request';
  const ConsultationRequestScreen({super.key});

  @override
  State<ConsultationRequestScreen> createState() =>
      _ConsultationRequestScreenState();
}

class _ConsultationRequestScreenState extends State<ConsultationRequestScreen> {
  List<String> selectedPricingIds = [];
  CentreEntity? centreData;

  @override
  void initState() {
    super.initState();
    context.read<PatientCubit>().getCurrentPatient();
    context.read<AuthCubit>().getCentreData();
  }

  void startConsultation() {
    context.read<ConsultationCubit>().createConsultation();
  }

  void cancelConsultation() {
    context.read<PatientCubit>().deletePatientSession();
    Navigator.pushNamedAndRemoveUntil(
      context,
      RootScreen.routeName,
      (route) => false,
    );
  }

  String _buildLocationString(dynamic patient) {
    final List<String> locationParts = [];

    if (patient?.city?.name != null) {
      locationParts.add(patient!.city!.name!);
    }
    if (patient?.district?.name != null) {
      locationParts.add(patient!.district!.name!);
    }
    if (patient?.city?.state?.name != null) {
      locationParts.add(patient!.city!.state!.name!);
    }
    if (patient?.city?.state?.country?.name != null) {
      locationParts.add(patient!.city!.state!.country!.name!);
    }

    return locationParts.join(', ');
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.black87),
          onPressed: cancelConsultation,
        ),
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
              onPressed: cancelConsultation,
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
                      // Modern Patient Header
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: Constants.primaryColor.withOpacity(0.1),
                            width: 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.04),
                              blurRadius: 8,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            // Avatar with gradient background
                            Container(
                              width: 56,
                              height: 56,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Constants.primaryColor,
                                    Constants.secondaryColor,
                                  ],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Icon(
                                Icons.person_outline,
                                color: Colors.white,
                                size: 28,
                              ),
                            ),
                            const SizedBox(width: 16),
                            // Patient info
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    patient?.name ?? 'Unknown Patient',
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.black87,
                                      letterSpacing: 0.2,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    patient?.contactNumber ?? 'No contact',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w500,
                                      color: Colors.grey.shade600,
                                      letterSpacing: 0.1,
                                    ),
                                  ),
                                  if (patient?.city != null ||
                                      patient?.district != null) ...[
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.location_on_outlined,
                                          size: 14,
                                          color: Colors.grey.shade500,
                                        ),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            _buildLocationString(patient),
                                            style: TextStyle(
                                              fontSize: 13,
                                              color: Colors.grey.shade500,
                                              letterSpacing: 0.1,
                                            ),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            // Status indicator
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Constants.primaryColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                'Active',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: Constants.primaryColor,
                                  letterSpacing: 0.2,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Patient Details
                      Expanded(
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(28),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.grey.shade200,
                                blurRadius: 20,
                                offset: const Offset(0, 8),
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: [
                                          Constants.primaryColor,
                                          Constants.secondaryColor,
                                        ],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      ),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(
                                      Icons.person_outline,
                                      color: Colors.white,
                                      size: 24,
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  const Expanded(
                                    child: Text(
                                      'Patient Details',
                                      style: TextStyle(
                                        fontSize: 22,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.black87,
                                        letterSpacing: 0.3,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 24),
                              Expanded(
                                child: ListView(
                                  physics: const BouncingScrollPhysics(),
                                  padding: const EdgeInsets.only(bottom: 16),
                                  children: [
                                    // First row - Email and Age
                                    Row(
                                      children: [
                                        Expanded(
                                          child: _buildInfoTile(
                                            Icons.email_outlined,
                                            'Email',
                                            patient?.email ?? 'Not provided',
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: _buildInfoTile(
                                            Icons.cake_outlined,
                                            'Age',
                                            patient?.age?.toString() ??
                                                'Not provided',
                                          ),
                                        ),
                                      ],
                                    ),
                                    // Second row - Date of Birth and Gender
                                    Row(
                                      children: [
                                        Expanded(
                                          child: _buildInfoTile(
                                            Icons.calendar_today_outlined,
                                            'Date of Birth',
                                            _formatDateOfBirth(patient?.dob),
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: _buildInfoTile(
                                            Icons.wc_outlined,
                                            'Gender',
                                            patient?.gender.name ??
                                                'Not specified',
                                          ),
                                        ),
                                      ],
                                    ),
                                    // Third row - Address and City
                                    Row(
                                      children: [
                                        Expanded(
                                          child: _buildInfoTile(
                                            Icons.home_outlined,
                                            'Address',
                                            patient?.address ?? 'Not provided',
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: _buildInfoTile(
                                            Icons.location_city_outlined,
                                            'City',
                                            patient?.city?.name ??
                                                'Not specified',
                                          ),
                                        ),
                                      ],
                                    ),
                                    // Fourth row - Pincode and Language
                                    Row(
                                      children: [
                                        Expanded(
                                          child: _buildInfoTile(
                                            Icons.pin_drop_outlined,
                                            'Pincode',
                                            patient?.pincode ?? 'Not provided',
                                          ),
                                        ),
                                        const SizedBox(width: 16),
                                        Expanded(
                                          child: _buildInfoTile(
                                            Icons.language_outlined,
                                            'Language',
                                            patient?.language?.name ??
                                                'Not specified',
                                          ),
                                        ),
                                      ],
                                    ),
                                    // Fifth row - Status and Location (if available)
                                    if (_buildLocationString(
                                      patient,
                                    ).isNotEmpty)
                                      Row(
                                        children: [
                                          Expanded(
                                            child: _buildInfoTile(
                                              Icons.verified_user_outlined,
                                              'Status',
                                              patient?.status?.name ??
                                                  'Unknown',
                                            ),
                                          ),
                                          const SizedBox(width: 16),
                                          Expanded(
                                            child: _buildInfoTile(
                                              Icons.public_outlined,
                                              'Location',
                                              _buildLocationString(patient),
                                            ),
                                          ),
                                        ],
                                      )
                                    else
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

                      // Pricing Selection
                      BlocBuilder<AuthCubit, AuthState>(
                        builder: (context, state) {
                          if (state is AuthCentreSuccess &&
                              state.centre?.centrePricing != null &&
                              state.centre!.centrePricing!.isNotEmpty) {
                            return Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: Constants.primaryColor.withOpacity(
                                    0.1,
                                  ),
                                  width: 1,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.04),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Select Services',
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  _buildPricingMultiSelect(
                                    state.centre!.centrePricing!,
                                  ),
                                ],
                              ),
                            );
                          }
                          return const SizedBox.shrink();
                        },
                      ),
                      const SizedBox(height: 24),

                      // Action Buttons
                      Row(
                        children: [
                          // Cancel Button
                          Expanded(
                            child: Container(
                              height: 56,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: Colors.red.shade300,
                                  width: 1.5,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.red.shade100.withOpacity(0.3),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: ElevatedButton(
                                onPressed: cancelConsultation,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.transparent,
                                  elevation: 0,
                                  shadowColor: Colors.transparent,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 24,
                                    vertical: 16,
                                  ),
                                ),
                                child: Text(
                                  'Cancel',
                                  style: TextStyle(
                                    color: Colors.red.shade600,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    letterSpacing: 0.3,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          // Start Consultation Button
                          Expanded(
                            flex: 2,
                            child: BlocConsumer<
                              ConsultationCubit,
                              ConsultationState
                            >(
                              listener: (context, state) {
                                if (state.maybeWhen(
                                  orElse: () => false,
                                  createConsultationSuccess: (_) => true,
                                )) {
                                  Navigator.pushNamedAndRemoveUntil(
                                    context,
                                    ConsultationScreen.routeName,
                                    (route) => false,
                                  );
                                }
                              },
                              builder: (context, state) {
                                return Container(
                                  height: 56,
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [
                                        Constants.primaryColor,
                                        Constants.secondaryColor,
                                      ],
                                      begin: Alignment.centerLeft,
                                      end: Alignment.centerRight,
                                    ),
                                    borderRadius: BorderRadius.circular(16),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Constants.primaryColor
                                            .withOpacity(0.3),
                                        blurRadius: 12,
                                        offset: const Offset(0, 4),
                                        spreadRadius: 0,
                                      ),
                                    ],
                                  ),
                                  child: ElevatedButton(
                                    onPressed: startConsultation,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.transparent,
                                      elevation: 0,
                                      shadowColor: Colors.transparent,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 24,
                                        vertical: 16,
                                      ),
                                    ),
                                    child: const Text(
                                      'Start Consultation',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 18,
                                        fontWeight: FontWeight.w600,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
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
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Constants.primaryColor.withOpacity(0.1),
                  Constants.secondaryColor.withOpacity(0.1),
                ],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Constants.primaryColor.withOpacity(0.2),
                width: 1,
              ),
            ),
            child: Icon(icon, color: Constants.primaryColor, size: 22),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey.shade600,
                    letterSpacing: 0.2,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                    letterSpacing: 0.1,
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 2,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPricingMultiSelect(List<CentrePricingEntity> pricingList) {
    return Column(
      children:
          pricingList.map((pricing) {
            final isSelected = selectedPricingIds.contains(pricing.id);
            return GestureDetector(
              onTap: () {
                setState(() {
                  if (isSelected) {
                    selectedPricingIds.remove(pricing.id);
                  } else {
                    selectedPricingIds.add(pricing.id!);
                  }
                });
              },
              child: Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color:
                      isSelected
                          ? Constants.primaryColor.withOpacity(0.1)
                          : Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color:
                        isSelected
                            ? Constants.primaryColor
                            : Colors.grey.shade300,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        color:
                            isSelected
                                ? Constants.primaryColor
                                : Colors.transparent,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color:
                              isSelected
                                  ? Constants.primaryColor
                                  : Colors.grey.shade400,
                          width: 2,
                        ),
                      ),
                      child:
                          isSelected
                              ? const Icon(
                                Icons.check,
                                color: Colors.white,
                                size: 16,
                              )
                              : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            pricing.name,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color:
                                  isSelected
                                      ? Constants.primaryColor
                                      : Colors.black87,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            pricing.description,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color:
                            isSelected
                                ? Constants.primaryColor
                                : Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '₹${pricing.price.toStringAsFixed(0)}',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: isSelected ? Colors.white : Colors.black87,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
    );
  }

  List<String> getSelectedPricingIds() {
    return selectedPricingIds;
  }
}
