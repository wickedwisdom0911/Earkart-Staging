import 'package:earkart_omni/config/widgets/gradient_button.dart';
import 'package:earkart_omni/config/widgets/helpers.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/features/consultation/presentation/pages/consultation_request_screen.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.state.dart';
import 'package:earkart_omni/di.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class FormSubmitButtonWidget extends StatelessWidget {
  final bool isFormValid;
  final VoidCallback onSubmitPressed;

  const FormSubmitButtonWidget({
    super.key,
    required this.isFormValid,
    required this.onSubmitPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: BlocConsumer<PatientCubit, PatientState>(
        listener: (context, state) {
          di<ILogger>().info(state.toString());
          if (state is PatientSuccess) {
            Navigator.pushNamed(context, ConsultationRequestScreen.routeName);
          }
        },
        builder: (context, state) {
          final isLoading = state is PatientLoading;
          final buttonEnabled = isFormValid && !isLoading;

          return GradientButton(
            enabled: buttonEnabled,
            child:
                isLoading
                    ? buttonLoading()
                    : Text(state is PatientError ? "Retry" : "Continue"),
            onPressed: buttonEnabled ? onSubmitPressed : null,
          );
        },
      ),
    );
  }
}
