import 'package:earkart_omni/config/widgets/gradient_button.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:earkart_omni/features/consultation/presentation/pages/consultation_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class ConsultationActionButtonsWidget extends StatelessWidget {
  final VoidCallback onCancel;
  final VoidCallback onStartConsultation;
  final bool isSubmitting;

  const ConsultationActionButtonsWidget({
    super.key,
    required this.onCancel,
    required this.onStartConsultation,
    required this.isSubmitting,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          _buildCancelButton(),
          const SizedBox(width: 16),
          _buildStartConsultationButton(context),
        ],
      ),
    );
  }

  Widget _buildCancelButton() {
    return Container(
      height: 48,
      width: 120,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade300, width: 1),
      ),
      child: ElevatedButton(
        onPressed: onCancel,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          elevation: 0,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        child: const Text(
          'Cancel',
          style: TextStyle(
            color: Colors.black87,
            fontSize: 16,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildStartConsultationButton(BuildContext context) {
    return BlocConsumer<ConsultationCubit, ConsultationState>(
      listener: (context, state) {
        state.maybeWhen(
          orElse: () {},
          createConsultationSuccess: (consultation) {
            Navigator.pushNamedAndRemoveUntil(
              context,
              ConsultationScreen.routeName,
              (route) => false,
            );
          },
          error: (message) {
            // Error handling is managed by the parent widget
          },
          loading: () {
            // Loading state is managed by the parent widget
          },
        );
      },
      builder: (context, state) {
        final isLoading = state.maybeWhen(
          orElse: () => false,
          loading: () => true,
        );

        final isButtonDisabled = isLoading || isSubmitting;

        return SizedBox(
          width: 200,
          child: GradientButton(
            onPressed: isButtonDisabled ? null : onStartConsultation,
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
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
          ),
        );
      },
    );
  }
}
