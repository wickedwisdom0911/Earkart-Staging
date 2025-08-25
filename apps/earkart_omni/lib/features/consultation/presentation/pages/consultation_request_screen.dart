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
import 'package:earkart_omni/models/consultation/consultation_pricing.entity.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'dart:async'; // Added for Timer

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
  bool isDropdownOpen = false;
  final TextEditingController discountAmountController =
      TextEditingController();
  final TextEditingController discountReasonController =
      TextEditingController();

  // Add debouncing to prevent multiple submissions
  bool _isSubmitting = false;
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    context.read<PatientCubit>().getCurrentPatient();
    context.read<AuthCubit>().getCentreData();
  }

  @override
  void dispose() {
    discountAmountController.dispose();
    discountReasonController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void startConsultation() {
    // Prevent multiple submissions
    if (_isSubmitting) {
      print('Consultation submission already in progress, ignoring request');
      return;
    }

    // Cancel any existing debounce timer
    _debounceTimer?.cancel();

    // Set debounce timer to prevent rapid successive calls
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      _performConsultationCreation();
    });
  }

  void _performConsultationCreation() {
    if (_isSubmitting) {
      print('Consultation submission already in progress, ignoring request');
      return;
    }

    print('Starting consultation creation...');
    _isSubmitting = true;

    // Get the selected pricing data from the auth state
    final authState = context.read<AuthCubit>().state;
    if (authState is AuthCentreSuccess &&
        authState.centre?.centrePricing != null) {
      // Parse discount amount
      double discountAmount = 0.0;
      if (discountAmountController.text.isNotEmpty) {
        try {
          discountAmount = double.parse(discountAmountController.text);
        } catch (e) {
          // Show error for invalid discount amount
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Please enter a valid discount amount'),
              backgroundColor: Colors.red,
            ),
          );
          _isSubmitting = false;
          return;
        }
      }

      // Create consultation pricing entities from selected services
      final List<ConsultationPricingEntity> selectedServices =
          selectedPricingIds.map((pricingId) {
            final pricing = authState.centre!.centrePricing!.firstWhere(
              (p) => p.id == pricingId,
            );

            final consultationPricing = ConsultationPricingEntity(
              pricingId: pricingId,
              quantity: 1,
              actualPrice: pricing.price,
              discountApplied: discountAmount,
              discountReason:
                  discountReasonController.text.isNotEmpty
                      ? discountReasonController.text
                      : null,
              notes: null,
            );
            print(
              'Created consultation pricing: ${consultationPricing.toJson()}',
            );
            return consultationPricing;
          }).toList();

      print('Selected services count: ${selectedServices.length}');
      // Create consultation with selected services
      context.read<ConsultationCubit>().createConsultation(
        selectedServices: selectedServices,
      );
    } else {
      print('No services selected, creating consultation without services');
      // Create consultation without selected services
      context.read<ConsultationCubit>().createConsultation();
    }
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
                (patient) => SingleChildScrollView(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Compact Patient Header
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Constants.primaryColor.withOpacity(0.1),
                            width: 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.04),
                              blurRadius: 6,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            // Compact Avatar
                            Container(
                              width: 48,
                              height: 48,
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
                            const SizedBox(width: 12),
                            // Patient info
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    patient?.name ?? 'Unknown Patient',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    patient?.contactNumber ?? 'No contact',
                                    style: TextStyle(
                                      fontSize: 13,
                                      color: Colors.grey.shade600,
                                    ),
                                  ),
                                  if (patient?.city != null ||
                                      patient?.district != null) ...[
                                    const SizedBox(height: 2),
                                    Row(
                                      children: [
                                        Icon(
                                          Icons.location_on_outlined,
                                          size: 12,
                                          color: Colors.grey.shade500,
                                        ),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            _buildLocationString(patient),
                                            style: TextStyle(
                                              fontSize: 12,
                                              color: Colors.grey.shade500,
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
                                horizontal: 6,
                                vertical: 3,
                              ),
                              decoration: BoxDecoration(
                                color: Constants.primaryColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'Active',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: Constants.primaryColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Compact Patient Details
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.grey.shade200,
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                              spreadRadius: 1,
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(
                                      colors: [
                                        Constants.primaryColor,
                                        Constants.secondaryColor,
                                      ],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(
                                    Icons.person_outline,
                                    color: Colors.white,
                                    size: 18,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                const Text(
                                  'Patient Details',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.black87,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            // 2-column grid layout for patient details
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Left column
                                Expanded(
                                  child: Column(
                                    children: [
                                      _buildCompactInfoTile(
                                        Icons.email_outlined,
                                        'Email',
                                        patient?.email ?? 'Not provided',
                                      ),
                                      _buildCompactInfoTile(
                                        Icons.cake_outlined,
                                        'Age',
                                        patient?.age?.toString() ??
                                            'Not provided',
                                      ),
                                      _buildCompactInfoTile(
                                        Icons.calendar_today_outlined,
                                        'Date of Birth',
                                        _formatDateOfBirth(patient?.dob),
                                      ),
                                      _buildCompactInfoTile(
                                        Icons.wc_outlined,
                                        'Gender',
                                        patient?.gender.name ?? 'Not specified',
                                      ),
                                      _buildCompactInfoTile(
                                        Icons.home_outlined,
                                        'Address',
                                        patient?.address ?? 'Not provided',
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(width: 8),
                                // Right column
                                Expanded(
                                  child: Column(
                                    children: [
                                      _buildCompactInfoTile(
                                        Icons.location_city_outlined,
                                        'City',
                                        patient?.city?.name ?? 'Not specified',
                                      ),
                                      _buildCompactInfoTile(
                                        Icons.pin_drop_outlined,
                                        'Pincode',
                                        patient?.pincode ?? 'Not provided',
                                      ),
                                      _buildCompactInfoTile(
                                        Icons.language_outlined,
                                        'Language',
                                        patient?.language?.name ??
                                            'Not specified',
                                      ),
                                      _buildCompactInfoTile(
                                        Icons.verified_user_outlined,
                                        'Status',
                                        patient?.status?.name ?? 'Unknown',
                                      ),
                                      // Empty space to balance the grid
                                      const SizedBox(height: 60),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ],
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
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: Constants.primaryColor.withOpacity(
                                    0.1,
                                  ),
                                  width: 1,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.04),
                                    blurRadius: 6,
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
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  _buildPricingDropdown(
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

                      // Discount Section
                      if (selectedPricingIds.isNotEmpty) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: Constants.primaryColor.withOpacity(0.1),
                              width: 1,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.04),
                                blurRadius: 6,
                                offset: const Offset(0, 2),
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
                                      Icons.discount_outlined,
                                      color: Colors.white,
                                      size: 20,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  const Text(
                                    'Discount (Optional)',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black87,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              // Discount Amount Field
                              TextFormField(
                                controller: discountAmountController,
                                keyboardType: TextInputType.number,
                                decoration: InputDecoration(
                                  labelText: 'Discount Amount (₹)',
                                  hintText: 'Enter discount amount',
                                  prefixIcon: const Icon(Icons.currency_rupee),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(
                                      color: Constants.primaryColor,
                                      width: 2,
                                    ),
                                  ),
                                  filled: true,
                                  fillColor: Colors.grey.shade50,
                                ),
                              ),
                              const SizedBox(height: 16),
                              // Discount Reason Field
                              TextFormField(
                                controller: discountReasonController,
                                maxLines: 2,
                                decoration: InputDecoration(
                                  labelText: 'Discount Reason',
                                  hintText:
                                      'Enter reason for discount (optional)',
                                  prefixIcon: const Icon(Icons.note_outlined),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(
                                      color: Colors.grey.shade300,
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: BorderSide(
                                      color: Constants.primaryColor,
                                      width: 2,
                                    ),
                                  ),
                                  filled: true,
                                  fillColor: Colors.grey.shade50,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 24),
                      ],

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
                                print('Consultation State: $state');
                                state.maybeWhen(
                                  orElse: () {},
                                  createConsultationSuccess: (consultation) {
                                    print(
                                      'Consultation created successfully: ${consultation.id}',
                                    );
                                    print(
                                      'Consultation pricing count: ${consultation.consultationPricing?.length ?? 0}',
                                    );
                                    // Reset submission state
                                    _isSubmitting = false;
                                    // Only navigate on successful creation
                                    Navigator.pushNamedAndRemoveUntil(
                                      context,
                                      ConsultationScreen.routeName,
                                      (route) => false,
                                    );
                                  },
                                  error: (message) {
                                    _isSubmitting = false;
                                  },
                                  loading: () {
                                    // Keep submission state true while loading
                                    _isSubmitting = true;
                                  },
                                );
                              },
                              builder: (context, state) {
                                final isLoading = state.maybeWhen(
                                  orElse: () => false,
                                  loading: () => true,
                                );

                                // Use both state loading and submission state
                                final isButtonDisabled =
                                    isLoading || _isSubmitting;

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
                                    onPressed:
                                        isButtonDisabled
                                            ? null
                                            : startConsultation,
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
                                    child:
                                        isButtonDisabled
                                            ? const SizedBox(
                                              width: 20,
                                              height: 20,
                                              child: CircularProgressIndicator(
                                                color: Colors.white,
                                                strokeWidth: 2,
                                              ),
                                            )
                                            : const Text(
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

  Widget _buildPricingDropdown(List<CentrePricingEntity> pricingList) {
    return Column(
      children: [
        // Dropdown Button
        GestureDetector(
          onTap: () {
            setState(() {
              isDropdownOpen = !isDropdownOpen;
            });
          },
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Constants.primaryColor.withOpacity(0.3),
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.medical_services_outlined,
                  color: Constants.primaryColor,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        selectedPricingIds.isEmpty
                            ? 'Select Services'
                            : '${selectedPricingIds.length} service${selectedPricingIds.length == 1 ? '' : 's'} selected',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color:
                              selectedPricingIds.isEmpty
                                  ? Colors.grey.shade600
                                  : Constants.primaryColor,
                        ),
                      ),
                      if (selectedPricingIds.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          _getSelectedServicesText(pricingList),
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey.shade600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ],
                  ),
                ),
                Icon(
                  isDropdownOpen
                      ? Icons.keyboard_arrow_up
                      : Icons.keyboard_arrow_down,
                  color: Constants.primaryColor,
                  size: 24,
                ),
              ],
            ),
          ),
        ),

        // Dropdown Content
        if (isDropdownOpen) ...[
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200, width: 1),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
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
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color:
                              isSelected
                                  ? Constants.primaryColor.withOpacity(0.05)
                                  : Colors.transparent,
                          border: Border(
                            bottom: BorderSide(
                              color: Colors.grey.shade100,
                              width: 0.5,
                            ),
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
                                  color:
                                      isSelected
                                          ? Colors.white
                                          : Colors.black87,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
            ),
          ),
        ],
      ],
    );
  }

  String _getSelectedServicesText(List<CentrePricingEntity> pricingList) {
    if (selectedPricingIds.isEmpty) return '';

    final selectedServices =
        pricingList
            .where((pricing) => selectedPricingIds.contains(pricing.id))
            .map((pricing) => pricing.name)
            .toList();

    if (selectedServices.length <= 2) {
      return selectedServices.join(', ');
    } else {
      return '${selectedServices.take(2).join(', ')} +${selectedServices.length - 2} more';
    }
  }

  List<String> getSelectedPricingIds() {
    return selectedPricingIds;
  }

  Widget _buildCompactInfoTile(IconData icon, String label, String value) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade200, width: 1),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Constants.primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(icon, color: Constants.primaryColor, size: 16),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                    color: Colors.grey.shade600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 13,
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
