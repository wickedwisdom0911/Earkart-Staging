import 'package:earkart_omni/config/widgets/gradient_button.dart';
import 'package:earkart_omni/config/widgets/helpers.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.state.dart';
import 'package:earkart_omni/features/patients/presentation/pages/all_patients_screen.dart';
import 'package:earkart_omni/features/patients/presentation/pages/patient_form_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  static const routeName = "/home";
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    context.read<AuthCubit>().getCentre();
    context.read<AuthCubit>().getCentreData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 1,
        automaticallyImplyLeading: false,
        title: Builder(
          builder: (context) {
            return BlocBuilder<AuthCubit, AuthState>(
              builder: (context, state) {
                if (state is AuthError) {
                  return Text(state.message);
                }
                if (state is AuthCentreSuccess) {
                  return Column(
                    children: [
                      Text(state.centre.user?.name ?? "Centre Dashboard"),
                      Text(
                        state.centre.code,
                        style: TextStyle(fontSize: 10, color: Colors.grey),
                      ),
                    ],
                  );
                }
                return Text("Centre Dashboard");
              },
            );
          },
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          children: [
            addVerticalSpace(30),
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Expanded(
                  child: GradientButton(
                    colors: [Colors.green, Colors.green.shade300],
                    onPressed: () {
                      Navigator.pushNamed(context, AllPatientsScreen.routeName);
                    },
                    child: Text(
                      "View All Patients",
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                ),
                addHorizontalSpace(30),
                Expanded(
                  child: GradientButton(
                    child: Text(
                      "Request New Consultation",
                      style: TextStyle(color: Colors.white),
                    ),
                    onPressed: () {
                      Navigator.pushNamed(context, PatientFormScreen.routeName);
                    },
                  ),
                ),
              ],
            ),
            addVerticalSpace(30),
            Text(
              "Past Consultations List",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            Expanded(
              child: ListView.builder(
                itemCount: 10,
                shrinkWrap: true,
                itemBuilder: (context, index) {
                  return Container(child: Text("Consultation $index"));
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
