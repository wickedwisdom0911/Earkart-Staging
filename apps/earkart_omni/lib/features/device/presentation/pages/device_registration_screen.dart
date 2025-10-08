import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/config/widgets/gradient_button.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/device/presentation/cubit/device_registration.cubit.dart';
import 'package:earkart_omni/features/device/presentation/cubit/device_registration.state.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:device_info_plus/device_info_plus.dart';

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
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: 32),
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Constants.primaryColor, Constants.secondaryColor],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Constants.secondaryColor.withOpacity(0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: const Icon(
                Icons.device_hub_rounded,
                size: 48,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 32),

            // Title
            Text(
              'Device Registration',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: Constants.primaryColor,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Enter your device code to register',
              style: TextStyle(
                fontSize: 16,
                color: Constants.secondaryColor,
                fontWeight: FontWeight.w400,
              ),
            ),
            const SizedBox(height: 40),

            // Device Code Input
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: TextField(
                controller: deviceCodeController,
                decoration: InputDecoration(
                  labelText: 'Device Code',
                  hintText: 'Enter device code',
                  prefixIcon: Icon(
                    Icons.qr_code_rounded,
                    color: Constants.secondaryColor,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                  filled: true,
                  fillColor: Colors.white,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 16,
                  ),
                ),
                onSubmitted: (value) {
                  if (value.isNotEmpty) {
                    context.read<DeviceRegistrationCubit>().getDeviceByValue(
                      value,
                    );
                  }
                },
              ),
            ),
            const SizedBox(height: 24),

            GradientButton(
              colors: [Constants.primaryColor, Constants.secondaryColor],
              enabled:
                  !state.maybeWhen(loading: () => true, orElse: () => false),
              onPressed: () {
                if (deviceCodeController.text.isNotEmpty) {
                  context.read<DeviceRegistrationCubit>().getDeviceByValue(
                    deviceCodeController.text,
                  );
                } else {
                  Fluttertoast.showToast(msg: "Please enter device code");
                }
              },
              child: state.maybeWhen(
                loading:
                    () => const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    ),
                orElse:
                    () => const Text(
                      'Register Device',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
              ),
            ),
            const SizedBox(height: 40),

            // Device Information and IDs Side by Side
            if (tabletID != null) _buildDeviceInfoAndIdsSection(),
          ],
        ),
      ),
    );
  }

  Widget _buildDeviceInfoAndIdsSection() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Device IDs Section
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Device IDs',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Constants.primaryColor,
                  ),
                ),
                const SizedBox(height: 16),
                _buildDeviceIdRow(
                  'Audiometer ID',
                  device?.deviceID ?? 'Not Available',
                ),
                const SizedBox(height: 12),
                _buildDeviceIdRow(
                  'Otoscope ID',
                  device?.otoscopeID ?? 'Not Available',
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 16),
        // Device Information Section
        Expanded(child: _buildDeviceInfoSection()),
      ],
    );
  }

  Widget _buildDeviceIdRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 120,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: Constants.secondaryColor,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: TextStyle(
              fontSize: 14,
              color: Constants.primaryColor,
              fontWeight: FontWeight.w400,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDeviceInfoSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Device Information',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Constants.primaryColor,
            ),
          ),
          const SizedBox(height: 16),
          _buildInfoRow('Tablet ID', tabletID ?? 'Unknown'),
          _buildInfoRow('Android Version', tabletAndroidVersion ?? 'Unknown'),
          _buildInfoRow('App Version', tabletAppVersion ?? 'Unknown'),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 14,
                color: Constants.secondaryColor,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontSize: 14,
                color: Constants.primaryColor,
                fontWeight: FontWeight.w400,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Constants.bg,
      appBar: GlassmorphismAppBar(
        title: const Text(
          'Device Registration',
          style: TextStyle(
            color: Colors.black87,
            fontSize: 24,
            fontWeight: FontWeight.w600,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        autoLeading: false,
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
