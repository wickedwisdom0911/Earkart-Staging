import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/device/presentation/cubit/device_registration.cubit.dart';
import 'package:earkart_omni/features/device/presentation/cubit/device_registration.state.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/services.dart';

class DeviceRegistrationScreen extends StatefulWidget {
  const DeviceRegistrationScreen({super.key});
  static const routeName = "/device-registration";

  @override
  State<DeviceRegistrationScreen> createState() =>
      _DeviceRegistrationScreenState();
}

class _DeviceRegistrationScreenState extends State<DeviceRegistrationScreen> {
  DeviceEntity? device;
  TextEditingController deviceCodeController = TextEditingController();
  PackageInfo? packageInfo;
  DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
  AndroidDeviceInfo? androidInfo;
  String? tabletID;
  String? tabletAndroidVersion;
  String? tabletAppVersion;

  // Platform channel for device owner operations
  static const platform = MethodChannel(
    'com.example.earkart_omni/device_owner',
  );

  @override
  void initState() {
    super.initState();
    context.read<DeviceRegistrationCubit>().getCurrentDevice();
    getPackageInfo();
  }

  void getPackageInfo() async {
    packageInfo = await PackageInfo.fromPlatform();
    androidInfo = await deviceInfo.androidInfo;

    // Get device serial number using DevicePolicyManager for device owner apps
    String? deviceId = await _getDeviceSerialNumber();

    setState(() {
      tabletID = deviceId;
      tabletAndroidVersion = androidInfo?.version.release;
      tabletAppVersion = packageInfo?.version;
    });
    if (device != null) {
      context.read<DeviceRegistrationCubit>().getDeviceByValue(
        device!.code ?? "",
      );
    }
  }

  Future<String?> _getDeviceSerialNumber() async {
    try {
      di<ILogger>().info(
        "Attempting to get device serial number via DevicePolicyManager...",
      );

      // Call the platform channel method to get serial number via DevicePolicyManager
      final String? serialNumber = await platform.invokeMethod(
        'getDeviceSerialNumber',
      );

      if (serialNumber != null && serialNumber.isNotEmpty) {
        di<ILogger>().info("Device serial number obtained: $serialNumber");
        return serialNumber;
      } else {
        di<ILogger>().warning(
          "DevicePolicyManager returned null/empty serial number",
        );
        return "unknown_serial";
      }
    } catch (e) {
      di<ILogger>().error(
        "Error getting device serial number via DevicePolicyManager: $e",
      );

      // Fallback to device_info_plus as last resort
      try {
        String? fallbackSerial = androidInfo?.serialNumber;
        if (fallbackSerial != null &&
            fallbackSerial != "unknown" &&
            fallbackSerial.isNotEmpty) {
          di<ILogger>().info(
            "Using fallback serial number from device_info_plus: $fallbackSerial",
          );
          return fallbackSerial;
        }
      } catch (fallbackError) {
        di<ILogger>().error("Fallback method also failed: $fallbackError");
      }

      return "error_getting_serial";
    }
  }

  @override
  void dispose() {
    deviceCodeController.dispose();
    super.dispose();
  }

  Widget _deviceRegistrationForm(DeviceRegistrationState state) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 40),
            const Icon(Icons.device_hub, size: 80, color: Colors.blue),
            const SizedBox(height: 20),
            const Text(
              'Device Registration',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 30),
            TextField(
              controller: deviceCodeController,
              decoration: const InputDecoration(
                labelText: 'Device Code',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.qr_code),
              ),
              onSubmitted: (value) {
                if (value.isNotEmpty) {
                  context.read<DeviceRegistrationCubit>().getDeviceByValue(
                    value,
                  );
                }
              },
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: state.maybeWhen(
                  loading: () => null,
                  orElse:
                      () => () {
                        if (deviceCodeController.text.isNotEmpty) {
                          context
                              .read<DeviceRegistrationCubit>()
                              .getDeviceByValue(deviceCodeController.text);
                        } else {
                          Fluttertoast.showToast(
                            msg: "Please enter device code",
                          );
                        }
                      },
                ),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 15),
                ),
                child: state.maybeWhen(
                  loading: () => const CircularProgressIndicator(),
                  orElse: () => const Text('Register Device'),
                ),
              ),
            ),
            const SizedBox(height: 20),
            if (tabletID != null) ...[
              Text('Tablet ID: $tabletID'),
              Text('Android Version: $tabletAndroidVersion'),
              Text('App Version: $tabletAppVersion'),
            ],
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Device Registration'),
        automaticallyImplyLeading: false,
      ),
      body: BlocListener<DeviceRegistrationCubit, DeviceRegistrationState>(
        listener: (context, state) {
          state.maybeWhen(
            success: (device) {
              this.device = device;
              if (device != null) {
                Fluttertoast.showToast(msg: "Device registered successfully!");
                // Navigate back to root screen to trigger other API calls
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  '/',
                  (route) => false,
                );
              }
            },
            error: (message) {
              Fluttertoast.showToast(msg: message);
            },
            orElse: () {},
          );
        },
        child: BlocBuilder<DeviceRegistrationCubit, DeviceRegistrationState>(
          builder: (context, state) {
            return _deviceRegistrationForm(state);
          },
        ),
      ),
    );
  }
}
