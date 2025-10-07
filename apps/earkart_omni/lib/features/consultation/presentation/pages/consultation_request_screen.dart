import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/consultation_action_buttons_widget.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/patient_overview_widget.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/service_selection_widget.dart';
import 'package:earkart_omni/features/home/presentation/pages/root_screen.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.state.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.state.dart';
import 'package:earkart_omni/models/consultation/consultation_pricing.entity.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
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
      return;
    }

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
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Please enter a valid discount amount'),
                backgroundColor: Colors.red,
              ),
            );
          }
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

            // Calculate discount per service (distribute total discount across all services)
            double serviceDiscount = 0.0;
            if (discountAmount > 0 && selectedPricingIds.isNotEmpty) {
              // Calculate total price of all selected services
              final totalPrice = selectedPricingIds.fold<double>(0.0, (
                sum,
                id,
              ) {
                final service = authState.centre!.centrePricing!.firstWhere(
                  (p) => p.id == id,
                );
                return sum + service.price;
              });

              // Distribute discount proportionally based on service price
              if (totalPrice > 0) {
                serviceDiscount = (discountAmount * pricing.price) / totalPrice;
              }
            }

            final consultationPricing = ConsultationPricingEntity(
              pricingId: pricingId,
              quantity: 1,
              actualPrice: pricing.price,
              discountApplied: serviceDiscount,
              discountReason:
                  discountReasonController.text.isNotEmpty
                      ? discountReasonController.text
                      : null,
              notes: null,
            );
            return consultationPricing;
          }).toList();

      // Create consultation with selected services
      context.read<ConsultationCubit>().createConsultation(
        selectedServices: selectedServices,
      );
    } else {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: GlassmorphismAppBar(
        elevation: 0,
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
      ),
      body: BlocBuilder<PatientCubit, PatientState>(
        builder: (context, state) {
          return state.maybeWhen(
            orElse: () => const Center(child: CircularProgressIndicator()),
            currentPatientSuccess:
                (patient) => Column(
                  children: [
                    const SizedBox(height: 20),

                    // Main Content - Takes most of the screen
                    const Text(
                      'Patient Overview & Service Selection',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 14),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Left Column - Patient Overview
                            Expanded(
                              flex: 2,
                              child: PatientOverviewWidget(patient: patient!),
                            ),
                            const SizedBox(width: 16),
                            // Right Column - Service Selection
                            Expanded(
                              flex: 1,
                              child: _buildServiceSelectionSection(),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Action Buttons - Fixed at bottom
                    ConsultationActionButtonsWidget(
                      onCancel: cancelConsultation,
                      onStartConsultation: startConsultation,
                      isSubmitting: _isSubmitting,
                    ),
                  ],
                ),
          );
        },
      ),
    );
  }

  Widget _buildServiceSelectionSection() {
    return BlocBuilder<AuthCubit, AuthState>(
      builder: (context, state) {
        if (state is AuthCentreSuccess &&
            state.centre?.centrePricing != null &&
            state.centre!.centrePricing!.isNotEmpty) {
          return ServiceSelectionWidget(
            pricingList: state.centre!.centrePricing!,
            selectedPricingIds: selectedPricingIds,
            onSelectionChanged: (newSelection) {
              setState(() {
                selectedPricingIds = newSelection;
              });
            },
          );
        }
        return Container(
          padding: const EdgeInsets.all(20),
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
          child: const Center(
            child: Text(
              'No services available',
              style: TextStyle(color: Colors.grey, fontSize: 14),
            ),
          ),
        );
      },
    );
  }

  List<String> getSelectedPricingIds() {
    return selectedPricingIds;
  }
}
