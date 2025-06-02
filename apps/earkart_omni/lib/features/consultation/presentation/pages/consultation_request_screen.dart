import 'package:flutter/material.dart';

class ConsultationRequestScreen extends StatelessWidget {
  static const routeName = '/consultation-request';
  const ConsultationRequestScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(appBar: AppBar(title: Text('Consultation Request')));
  }
}
