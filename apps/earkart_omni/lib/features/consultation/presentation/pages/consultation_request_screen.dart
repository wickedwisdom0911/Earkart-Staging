import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.state.dart';
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Consultation Request')),
      body: BlocBuilder<PatientCubit, PatientState>(
        builder: (context, state) {
          print(state);
          return state.maybeWhen(
            orElse: () => const SizedBox.shrink(),
            currentPatientSuccess:
                (patient) => Column(
                  children: [
                    Text(patient.name),
                    Text(patient.contactNumber),
                    Text(patient.gender.name),
                  ],
                ),
          );
        },
      ),
    );
  }
}
