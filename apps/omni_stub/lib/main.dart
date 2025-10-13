import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void main() {
  runApp(const OmniStubApp());
}

class OmniStubApp extends StatelessWidget {
  const OmniStubApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Omni Stub',
      home: const DeviceSetupScreen(),
    );
  }
}

class DeviceSetupScreen extends StatefulWidget {
  const DeviceSetupScreen({super.key});

  @override
  State<DeviceSetupScreen> createState() => _DeviceSetupScreenState();
}

class _DeviceSetupScreenState extends State<DeviceSetupScreen> {
  bool _isChecking = false;
  String _statusMessage = 'Setting up device… please wait';
  bool _isDeviceOwner = false;
  bool _showContinueButton = true;

  static const platform = MethodChannel(
    'com.example.earkart_omni/device_admin',
  );

  @override
  void initState() {
    super.initState();
    _checkDeviceOwnerStatus();
  }

  Future<void> _checkDeviceOwnerStatus() async {
    try {
      final bool isDeviceOwner = await platform.invokeMethod(
        'isDeviceOwnerApp',
      );
      setState(() {
        _isDeviceOwner = isDeviceOwner;
        if (isDeviceOwner) {
          _statusMessage =
              'Device Owner status confirmed. Ready to install full app.';
        } else {
          _statusMessage =
              'Not running as Device Owner. Please provision this app as Device Owner first.';
        }
      });
    } catch (e) {
      setState(() {
        _statusMessage = 'Error checking Device Owner status: $e';
      });
    }
  }

  Future<void> _handleContinue() async {
    if (!_isDeviceOwner) {
      _showMessage('This app must be provisioned as Device Owner to continue.');
      return;
    }

    setState(() {
      _isChecking = true;
      _statusMessage = 'Attempting to install full app...';
    });

    try {
      final String result = await platform.invokeMethod('installFullApp');
      setState(() {
        _isChecking = false;
        _statusMessage = result;
      });
    } catch (e) {
      setState(() {
        _isChecking = false;
        _statusMessage = 'Failed to install full app: $e';
      });
    }
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                _statusMessage,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 18),
              ),
              const SizedBox(height: 32),
              if (_isChecking)
                const CircularProgressIndicator()
              else if (_showContinueButton)
                ElevatedButton(
                  onPressed: _handleContinue,
                  child: const Text('Continue'),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
