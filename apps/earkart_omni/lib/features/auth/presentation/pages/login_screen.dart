import 'package:flutter/material.dart';

class LoginScreen extends StatelessWidget {
  const LoginScreen({super.key});
  static const routeName = "/login";
  @override
  Widget build(BuildContext context) {
    return Scaffold(body: SafeArea(child: Column(children: [Text('Login')])));
  }
}
