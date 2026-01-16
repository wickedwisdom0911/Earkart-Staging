import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/consultation_action_buttons_widget.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/patient_overview_widget.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/service_selection_widget.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/payment_dialog_widget.dart'
    as payment_dialog;
import 'package:earkart_omni/features/consultation/presentation/services/razorpay_payment_service.dart';
import 'package:earkart_omni/features/payment/presentation/cubit/payment.cubit.dart';
import 'package:earkart_omni/features/payment/presentation/cubit/payment.state.dart';
import 'package:earkart_omni/features/home/presentation/pages/root_screen.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.state.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.state.dart';
import 'package:earkart_omni/models/consultation/consultation_pricing.entity.dart';
import 'package:earkart_omni/models/payment/payment.entity.dart';
import 'package:earkart_omni/models/payment/payment.model.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
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
  RazorpayPaymentService? _razorpayService;
  String? _currentPaymentId;
  Timer? _paymentStatusPollTimer;

  @override
  void initState() {
    super.initState();
    context.read<PatientCubit>().getCurrentPatient();
    context.read<AuthCubit>().getCentreData();
    _razorpayService = RazorpayPaymentService();
  }

  @override
  void dispose() {
    discountAmountController.dispose();
    discountReasonController.dispose();
    _debounceTimer?.cancel();
    _paymentStatusPollTimer?.cancel();
    _razorpayService?.dispose();
    super.dispose();
  }

  void startConsultation() {
    // Prevent multiple submissions
    if (_isSubmitting) {
      return;
    }

    // Validate that at least one service is selected
    if (selectedPricingIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one service to continue'),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 3),
        ),
      );
      return;
    }

    // Show payment dialog first
    _showPaymentDialog();
  }

  void _showPaymentDialog() {
    // Calculate total amount
    final authState = context.read<AuthCubit>().state;
    double totalAmount = 0.0;

    if (authState is AuthCentreSuccess &&
        authState.centre?.centrePricing != null) {
      // Calculate total price of selected services
      totalAmount = selectedPricingIds.fold<double>(0.0, (sum, id) {
        try {
          final pricing = authState.centre!.centrePricing!.firstWhere(
            (p) => p.id == id,
          );
          return sum + pricing.price;
        } catch (e) {
          return sum;
        }
      });
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder:
          (context) => payment_dialog.PaymentDialogWidget(
            totalAmount: totalAmount,
            onPaymentSelected: (paymentMethod) {
              _handlePaymentSelection(paymentMethod, totalAmount);
            },
          ),
    );
  }

  void _handlePaymentSelection(
    payment_dialog.PaymentMethod paymentMethod,
    double totalAmount,
  ) {
    // Convert UI PaymentMethod to backend PaymentMethod
    final backendPaymentMethod = _convertToBackendPaymentMethod(paymentMethod);

    // All payment types call initiate first
    _initiatePaymentViaBackend(totalAmount, backendPaymentMethod);
  }

  PaymentType _convertToBackendPaymentMethod(
    payment_dialog.PaymentMethod uiMethod,
  ) {
    switch (uiMethod) {
      case payment_dialog.PaymentMethod.cashToCR:
        return PaymentType.cashToCR;
      case payment_dialog.PaymentMethod.cashToDoctor:
        return PaymentType.cashToDoctor;
      case payment_dialog.PaymentMethod.paidOnQR:
        return PaymentType.other; // OTHER for paid on QR
      case payment_dialog.PaymentMethod.payHere:
        return PaymentType.razorpay;
    }
  }

  void _initiatePaymentViaBackend(double amount, PaymentType paymentType) {
    // Get patient ID
    final patientState = context.read<PatientCubit>().state;
    String? patientId;
    patientState.maybeWhen(
      currentPatientSuccess: (patient) {
        patientId = patient?.id;
      },
      orElse: () {},
    );

    // Create payment initiation request
    final request = PaymentInitiateRequest(
      amount: amount,
      paymentType: paymentType,
      patientId: patientId,
    );

    // Initiate payment via backend
    context.read<PaymentCubit>().initiatePayment(request);
  }

  void _handlePaymentInitiateSuccess(PaymentInitiateResponse response) {
    if (response.payment == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(response.message),
          backgroundColor: Colors.green,
        ),
      );
      _isSubmitting = false;
      return;
    }

    _currentPaymentId = response.payment!.id;

    // If Razorpay payment, open Razorpay checkout
    if (response.payment!.paymentType == PaymentType.razorpay) {
      if (response.razorpayOrderId == null || response.razorpayKey == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Razorpay order details not received'),
            backgroundColor: Colors.red,
          ),
        );
        _isSubmitting = false;
        return;
      }

      _openRazorpayCheckout(
        razorpayKey: response.razorpayKey!,
        razorpayOrderId: response.razorpayOrderId!,
        amount: response.payment!.amount,
      );
    } else {
      // Cash payments are automatically marked as completed by initiate API
      // Check if payment is already completed and proceed to consultation creation
      if (response.payment!.status == PaymentStatus.completed) {
        // Proceed directly to consultation creation
        _proceedWithConsultationCreation();
      } else {
        // If payment is not completed, wait for completion
        // This shouldn't happen for cash payments, but handle it just in case
        _handlePaymentStatusUpdate(response.payment!);
      }
    }
  }

  void _openRazorpayCheckout({
    required String razorpayKey,
    required String razorpayOrderId,
    required double amount,
  }) {
    if (_razorpayService == null) {
      _razorpayService = RazorpayPaymentService();
    }

    // Get patient info for payment
    final patientState = context.read<PatientCubit>().state;
    String patientName = 'Patient';
    String patientContact = '';
    String patientEmail = '';

    patientState.maybeWhen(
      currentPatientSuccess: (patient) {
        if (patient != null) {
          patientName = patient.name;
          patientContact = patient.contactNumber;
          patientEmail = patient.email ?? '';
        }
      },
      orElse: () {},
    );

    _razorpayService!.openPayment(
      razorpayKey: razorpayKey,
      razorpayOrderId: razorpayOrderId,
      amount: amount,
      name: patientName,
      description: 'Consultation Payment',
      contact: patientContact.isNotEmpty ? patientContact : '9999999999',
      email: patientEmail.isNotEmpty ? patientEmail : 'patient@earkart.in',
      onSuccess: (PaymentSuccessResponse response) {
        // Payment successful on Razorpay side, now poll backend for status
        _startPaymentStatusPolling();
      },
      onFailure: (PaymentFailureResponse response) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Payment failed: ${response.message}'),
            backgroundColor: Colors.red,
          ),
        );
        _isSubmitting = false;
      },
      onExternalWallet: (ExternalWalletResponse response) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('External wallet selected: ${response.walletName}'),
            backgroundColor: Colors.blue,
          ),
        );
      },
    );
  }

  void _startPaymentStatusPolling() {
    if (_currentPaymentId == null) return;

    // Poll payment status every 2 seconds
    _paymentStatusPollTimer?.cancel();
    _paymentStatusPollTimer = Timer.periodic(const Duration(seconds: 2), (
      timer,
    ) {
      context.read<PaymentCubit>().getPaymentById(_currentPaymentId!);
    });

    // Stop polling after 60 seconds
    Timer(const Duration(seconds: 60), () {
      _paymentStatusPollTimer?.cancel();
    });
  }

  void _handlePaymentStatusUpdate(PaymentEntity payment) {
    // Set paymentId from payment response (needed for cash payments completed directly)
    if (payment.id != null) {
      _currentPaymentId = payment.id;
    }

    if (payment.status == PaymentStatus.completed) {
      _paymentStatusPollTimer?.cancel();
      // Proceed with consultation creation
      _proceedWithConsultationCreation();
    } else if (payment.status == PaymentStatus.failed) {
      _paymentStatusPollTimer?.cancel();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Payment failed'),
          backgroundColor: Colors.red,
        ),
      );
      _isSubmitting = false;
    }
  }

  void _proceedWithConsultationCreation() {
    // Validate payment is completed
    if (_currentPaymentId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Payment not completed. Please try again.'),
          backgroundColor: Colors.red,
        ),
      );
      _isSubmitting = false;
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

    // Note: paymentId (_currentPaymentId) should be passed to backend
    // Backend will validate payment exists and is COMPLETED
    // TODO: Update createConsultation API to accept paymentId parameter

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

      // Create consultation with selected services and paymentId
      context.read<ConsultationCubit>().createConsultation(
        selectedServices: selectedServices,
        paymentId: _currentPaymentId,
      );
    } else {
      // Create consultation without selected services but with paymentId
      context.read<ConsultationCubit>().createConsultation(
        paymentId: _currentPaymentId,
      );
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
      body: BlocListener<PaymentCubit, PaymentState>(
        listener: (context, state) {
          state.when(
            initial: () {},
            loading: () {},
            initiatePaymentSuccess: (response) {
              _handlePaymentInitiateSuccess(response);
            },
            completePaymentSuccess: (payment) {
              _handlePaymentStatusUpdate(payment);
            },
            getPaymentSuccess: (payment) {
              _handlePaymentStatusUpdate(payment);
            },
            error: (message) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(message), backgroundColor: Colors.red),
              );
              _isSubmitting = false;
            },
          );
        },
        child: BlocBuilder<PatientCubit, PatientState>(
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
                        isServiceSelected: selectedPricingIds.isNotEmpty,
                      ),
                    ],
                  ),
            );
          },
        ),
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
