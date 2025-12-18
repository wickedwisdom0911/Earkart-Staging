import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/features/home/presentation/pages/root_screen.dart';
import 'package:earkart_omni/features/device/presentation/widgets/centre_assignment_dialog.dart';
import 'package:earkart_omni/features/device/presentation/widgets/device_registration_form.dart';
import 'package:earkart_omni/features/device/presentation/widgets/local_device_information.dart';
import 'package:earkart_omni/features/device/presentation/widgets/device_details_from_server.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.state.dart';
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
  bool isDeviceFound = false;
  late VoidCallback _textControllerListener;

  // Platform channel for device owner operations
  static const platform = MethodChannel(
    'com.example.earkart_omni/device_owner',
  );

  @override
  void initState() {
    super.initState();
    context.read<DeviceRegistrationCubit>().getCurrentDevice();
    getPackageInfo();
    _setupTextControllerListener();
  }

  void _setupTextControllerListener() {
    _textControllerListener = () {
      // Reset state to initial when text field is cleared or changed
      if (isDeviceFound || device != null) {
        setState(() {
          isDeviceFound = false;
          device = null; // Clear the device data
        });
        // Also reset the cubit state to initial
        context.read<DeviceRegistrationCubit>().resetToInitial();
      }
    };
    deviceCodeController.addListener(_textControllerListener);
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
      final String? serialNumber = await platform.invokeMethod(
        'getDeviceSerialNumber',
      );

      if (serialNumber != null && serialNumber.isNotEmpty) {
        return serialNumber;
      } else {
        di<ILogger>().error(
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
    deviceCodeController.removeListener(_textControllerListener);
    deviceCodeController.dispose();
    super.dispose();
  }

  void _showCentreAssignmentDialog(DeviceEntity device) {
    CentreAssignmentDialog.show(
      context: context,
      device: device,
      onConfirm: () {
        Navigator.of(context).pop();
        setState(() {
          isDeviceFound = true;
        });
      },
      onCancel: () {
        Navigator.of(context).pop();
        setState(() {
          isDeviceFound = false;
        });
      },
    );
  }

  Widget _deviceRegistrationForm(DeviceRegistrationState state) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left side - Registration Form
          Expanded(
            flex: 1,
            child: BlocBuilder<CommunicationCubit, CommunicationState>(
              builder: (context, communicationState) {
                return DeviceRegistrationForm(
                  deviceCodeController: deviceCodeController,
                  device: device,
                  isDeviceFound: isDeviceFound,
                  r15cSerialNumber: communicationState.r15cSerialNumber,
                  tabletID: tabletID,
                  tabletAndroidVersion: tabletAndroidVersion,
                  tabletAppVersion: tabletAppVersion,
                );
              },
            ),
          ),

          const SizedBox(width: 24),

          // Right side - Device Information
          Expanded(
            flex: 1,
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 32),
                  // Local Device Information Section
                  LocalDeviceInformation(
                    tabletID: tabletID,
                    tabletAndroidVersion: tabletAndroidVersion,
                    tabletAppVersion: tabletAppVersion,
                    device: device,
                  ),

                  const SizedBox(height: 20),

                  // Device Details Section (from API)
                  if (device != null) DeviceDetailsFromServer(device: device!),
                ],
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
          'Device Registration Needed',
          style: TextStyle(
            color: Colors.black87,
            fontSize: 24,
            fontWeight: FontWeight.w600,
          ),
        ),

        autoLeading: false,
      ),
      body: BlocListener<DeviceRegistrationCubit, DeviceRegistrationState>(
        listener: (context, state) {
          state.maybeWhen(
            getByValueSuccess: (device) {
              this.device = device;
              if (device?.centre != null) {
                // Show confirmation dialog if device is already assigned to a centre
                _showCentreAssignmentDialog(device!);
              } else {
                // Device is not assigned to any centre, proceed normally
                setState(() {
                  isDeviceFound = true;
                });
                Fluttertoast.showToast(
                  msg:
                      "Device found! Click Register Device to complete registration.",
                );
              }
            },
            success: (device) {
              this.device = device;
              if (device != null) {
                Fluttertoast.showToast(msg: "Device registered successfully!");
                // Navigate back to root screen to trigger other API calls
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  RootScreen.routeName,
                  (route) => false,
                );
              }
            },
            error: (message) {
              Fluttertoast.showToast(msg: message);
              setState(() {
                isDeviceFound = false;
              });
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
