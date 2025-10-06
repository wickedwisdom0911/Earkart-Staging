import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.state.dart';
import 'package:earkart_omni/features/patients/presentation/widgets/widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class AllPatientsScreen extends StatefulWidget {
  const AllPatientsScreen({super.key});
  static const routeName = "/all-patients";
  @override
  State<AllPatientsScreen> createState() => _AllPatientsScreenState();
}

class _AllPatientsScreenState extends State<AllPatientsScreen> {
  @override
  void initState() {
    super.initState();
    // Always fetch latest patients when screen is shown
    context.read<PatientCubit>().getAllPatientByCentreCode();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GlassmorphismAppBar(title: const Text("All Patients")),
      body: BlocBuilder<PatientCubit, PatientState>(
        builder: (context, state) {
          return state.maybeWhen(
            loading: () => const Center(child: CircularProgressIndicator()),
            error:
                (message) => Center(
                  child: Text(
                    message,
                    style: const TextStyle(color: Colors.red, fontSize: 18),
                  ),
                ),
            allPatientsSuccess: (patients) {
              if (patients.isEmpty) {
                return const Center(child: Text("No patients found."));
              }
              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: patients.length,
                itemBuilder: (context, index) {
                  final patient = patients[index];
                  return PatientCard(patient: patient);
                },
              );
            },
            orElse: () => const Center(child: CircularProgressIndicator()),
          );
        },
      ),
    );
  }
}
