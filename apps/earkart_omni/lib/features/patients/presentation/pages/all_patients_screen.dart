import 'package:flutter/material.dart';

class AllPatientsScreen extends StatefulWidget {
  const AllPatientsScreen({super.key});
  static const routeName = "/all-patients";
  @override
  State<AllPatientsScreen> createState() => _AllPatientsScreenState();
}

class _AllPatientsScreenState extends State<AllPatientsScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("All Patients")),
      body: Text("All Patients"),
    );
  }
}
