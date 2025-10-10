import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/features/device/presentation/cubit/device_registration.cubit.dart';
import 'package:earkart_omni/features/device/presentation/cubit/device_registration.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.state.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:device_info_plus/device_info_plus.dart';

class DeviceInfoScreen extends StatefulWidget {
  static const routeName = "/device-info";
  const DeviceInfoScreen({super.key});

  @override
  State<DeviceInfoScreen> createState() => _DeviceInfoScreenState();
}

class _DeviceInfoScreenState extends State<DeviceInfoScreen> {
  PackageInfo? packageInfo;
  DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
  AndroidDeviceInfo? androidInfo;
  String? tabletID;
  String? tabletAndroidVersion;
  String? tabletAppVersion;
  String? storageInfo;

  // Platform channel for device owner operations
  static const platform = MethodChannel(
    'com.example.earkart_omni/device_owner',
  );

  @override
  void initState() {
    super.initState();
    _getDeviceInfo();
    // Load current device information
    context.read<DeviceRegistrationCubit>().getCurrentDevice();
  }

  Future<void> _getDeviceInfo() async {
    try {
      packageInfo = await PackageInfo.fromPlatform();
      androidInfo = await deviceInfo.androidInfo;

      // Get device serial number
      String? deviceId = await _getDeviceSerialNumber();

      setState(() {
        tabletID = deviceId;
        tabletAndroidVersion = androidInfo?.version.release;
        tabletAppVersion = packageInfo?.version;
      });
    } catch (e) {
      print('Error getting device info: $e');
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
        return "unknown_serial";
      }
    } catch (e) {
      try {
        String? fallbackSerial = androidInfo?.serialNumber;
        if (fallbackSerial != null &&
            fallbackSerial != "unknown" &&
            fallbackSerial.isNotEmpty) {
          return fallbackSerial;
        }
      } catch (fallbackError) {
        print("Fallback method also failed: $fallbackError");
      }
      return "error_getting_serial";
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: GlassmorphismAppBar(
        title: const Text(
          'Device Information',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
      ),
      body: BlocBuilder<DeviceRegistrationCubit, DeviceRegistrationState>(
        builder: (context, state) {
          if (state is DeviceRegistrationLoading) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(
                        Constants.primaryColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Loading device information...',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            );
          }

          if (state is DeviceRegistrationError) {
            return Center(
              child: Container(
                margin: const EdgeInsets.all(24),
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Icon(
                        Icons.error_outline_rounded,
                        size: 48,
                        color: Colors.red[400],
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Error Loading Device Information',
                      style: TextStyle(
                        fontSize: 20,
                        color: Colors.grey[900],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      state.message,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            );
          }

          // Handle different success states
          DeviceEntity? device;
          if (state is DeviceRegistrationGetByValueSuccess) {
            device = state.device;
          } else if (state is DeviceRegistrationLocalDeviceFetched) {
            device = state.device;
          } else if (state is DeviceRegistrationSuccess) {
            device = state.device;
          }

          if (device != null) {
            final currentDevice = device;
            return BlocBuilder<CommunicationCubit, CommunicationState>(
              builder: (context, communicationState) {
                return SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildCentreInfoSection(currentDevice),
                      const SizedBox(height: 16),
                      _buildDeviceTechnicalDetailsSection(
                        currentDevice,
                        communicationState,
                      ),
                      const SizedBox(height: 16),
                      _buildLocalDeviceInfoSection(currentDevice),
                      const SizedBox(height: 16),
                    ],
                  ),
                );
              },
            );
          }

          return Center(
            child: Container(
              margin: const EdgeInsets.all(24),
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.04),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(
                      Icons.info_outline_rounded,
                      size: 48,
                      color: Colors.grey[400],
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'No Device Information Available',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[900],
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Please ensure your device is properly registered',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCentreInfoSection(DeviceEntity device) {
    final centre = device.centre;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Constants.primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.business_rounded,
                  color: Constants.primaryColor,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Centre Information',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[900],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (centre != null) ...[
            _buildModernInfoRow(
              'Centre Name',
              centre.entName,
              Icons.business_rounded,
            ),
            _buildModernInfoRow(
              'Centre Code',
              centre.code,
              Icons.qr_code_rounded,
            ),
            _buildModernInfoRow(
              'Address',
              centre.address,
              Icons.location_on_rounded,
            ),
            _buildModernInfoRow(
              'Contact',
              centre.contactNumber,
              Icons.phone_rounded,
            ),
            _buildModernInfoRow(
              'Assistant',
              centre.assistantName,
              Icons.person_rounded,
            ),
            _buildModernInfoRow(
              'Assistant Contact',
              centre.assistantContactNumber,
              Icons.contact_phone_rounded,
            ),
            if (centre.city != null)
              _buildModernInfoRow(
                'City',
                centre.city!.name,
                Icons.location_city_rounded,
              ),
            _buildModernInfoRow(
              'Pincode',
              centre.pincode,
              Icons.pin_drop_rounded,
            ),
            _buildModernInfoRow(
              'Payment Cycle',
              centre.paymentCycle.name,
              Icons.payment_rounded,
            ),
          ] else ...[
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.info_outline_rounded,
                    color: Colors.grey[400],
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'No centre information available',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDeviceTechnicalDetailsSection(
    DeviceEntity device,
    CommunicationState communicationState,
  ) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.blue.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.settings_rounded,
                  color: Colors.blue[600],
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Device Details',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[900],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (device.code != null)
            _buildModernInfoRow(
              'Device Code',
              device.code!,
              Icons.qr_code_rounded,
            ),
          if (device.tabletID != null)
            _buildModernInfoRow(
              'Tablet ID',
              device.tabletID!,
              Icons.tablet_android_rounded,
            ),
          _buildModernInfoRow(
            'Audiometer ID',
            device.deviceID ??
                communicationState.r15cSerialNumber ??
                'Not Connected',
            Icons.hearing_rounded,
          ),
          if (device.otoscopeID != null)
            _buildModernInfoRow(
              'Otoscope ID',
              device.otoscopeID!,
              Icons.hearing_rounded,
            ),
          _buildModernInfoRow(
            'App Version',
            device.tabletAppVersion ?? tabletAppVersion ?? 'Not Available',
            Icons.apps_rounded,
          ),
          _buildModernInfoRow(
            'Android Version',
            device.tabletAndroidVersion ??
                tabletAndroidVersion ??
                'Not Available',
            Icons.android_rounded,
          ),
          _buildModernInfoRow(
            'Status',
            device.status.name.toUpperCase(),
            Icons.check_circle_rounded,
          ),
        ],
      ),
    );
  }

  Widget _buildModernInfoRow(String label, String value, IconData icon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(icon, color: Colors.grey[600], size: 16),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[900],
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocalDeviceInfoSection(DeviceEntity device) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.phone_android_rounded,
                  color: Colors.orange[600],
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'System Information',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[900],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildModernInfoRow(
            'Device Serial',
            tabletID ?? 'Unknown',
            Icons.fingerprint_rounded,
          ),
          if (androidInfo != null) ...[
            _buildModernInfoRow(
              'Model',
              androidInfo!.model,
              Icons.phone_android_rounded,
            ),
          ],
        ],
      ),
    );
  }
}
