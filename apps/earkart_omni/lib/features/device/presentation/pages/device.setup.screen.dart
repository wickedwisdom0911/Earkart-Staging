import 'package:flutter/material.dart';

class DeviceSetupScreen extends StatefulWidget {
  const DeviceSetupScreen({super.key});
  static const routeName = "/device-setup";
  @override
  State<DeviceSetupScreen> createState() => _DeviceSetupScreenState();
}

class _DeviceSetupScreenState extends State<DeviceSetupScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Column(children: [Text("Device Setup")]));
  }
}
