import 'package:flutter/material.dart';

class ConsultationScreen extends StatelessWidget {
  static const routeName = '/consultation';
  const ConsultationScreen({super.key});
  @override
  Widget build(BuildContext context) {
    return Scaffold(appBar: AppBar(title: Text('Consultation')));
  }
}
