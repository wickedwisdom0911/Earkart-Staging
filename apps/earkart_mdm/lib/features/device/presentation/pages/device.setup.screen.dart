import 'dart:developer';

import 'package:earkart_mdm/config/utils/dimensions.dart';
import 'package:earkart_mdm/config/widgets/custom_text_field.dart';
import 'package:earkart_mdm/config/widgets/gradient_button.dart';
import 'package:earkart_mdm/config/widgets/helpers.dart';
import 'package:earkart_mdm/features/device/presentation/cubit/device.cubit.dart';
import 'package:earkart_mdm/models/device/device.entity.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:permission_handler/permission_handler.dart';

class DeviceSetupScreen extends StatefulWidget {
  const DeviceSetupScreen({super.key});
  static const routeName = "/device-setup";
  @override
  State<DeviceSetupScreen> createState() => _DeviceSetupScreenState();
}

class _DeviceSetupScreenState extends State<DeviceSetupScreen> {
  DeviceEntity? device;
  TextEditingController deviceCodeController = TextEditingController();
  PackageInfo? packageInfo;
  DeviceInfoPlugin deviceInfo = DeviceInfoPlugin();
  AndroidDeviceInfo? androidInfo;
  String? tabletID;
  String? tabletAndroidVersion;
  String? tabletAppVersion;

  @override
  void initState() {
    super.initState();
    context.read<DeviceCubit>().getCurrentDevice();
    getPackageInfo();
  }

  void getPackageInfo() async {
    packageInfo = await PackageInfo.fromPlatform();
    androidInfo = await deviceInfo.androidInfo;
    setState(() {
      tabletID = androidInfo?.serialNumber;
      tabletAndroidVersion = androidInfo?.version.release;
      tabletAppVersion = packageInfo?.version;
    });
    if (device != null) {
      context.read<DeviceCubit>().getDeviceByValue(device!.deviceCode);
    }
    // log("androidinfo.data: ${androidInfo?.data}");
  }

  @override
  void dispose() {
    deviceCodeController.dispose();
    super.dispose();
  }

  Widget _deviceSetupForm(DeviceState state) {
    return Center(
      child: Card(
        elevation: 8,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        margin: EdgeInsets.symmetric(vertical: 40, horizontal: 16),
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                "Device Setup",
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).primaryColor,
                ),
                textAlign: TextAlign.center,
              ),
              addVerticalSpace(24),
              CustomTextField(
                hint: "Enter the Device Code",
                controller: deviceCodeController,
                prefix: Icon(Icons.qr_code, color: Colors.grey[600]),
              ),
              addVerticalSpace(32),
              GradientButton(
                child:
                    state is DeviceLoading
                        ? buttonLoading()
                        : Text(
                          "Start Setup",
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                onPressed: () {
                  context.read<DeviceCubit>().getDeviceByValue(
                    deviceCodeController.text,
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _deviceDetails(DeviceState state) {
    return Center(
      child: Card(
        elevation: 10,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        margin: EdgeInsets.symmetric(vertical: 30, horizontal: 16),
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                "Device Details",
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).primaryColor,
                ),
                textAlign: TextAlign.center,
              ),
              addVerticalSpace(24),
              _buildDetailTile("Device Code", device?.deviceCode),
              _buildDetailTile("Tablet ID", device?.tabletID),
              _buildDetailTile("Device ID", device?.deviceID),
              _buildDetailTile("Tablet App Version", device?.tabletAppVersion),
              _buildDetailTile(
                "Tablet Android Version",
                device?.tabletAndroidVersion,
              ),
              _buildDetailTile(
                "Is Assigned to a Centre",
                device?.centre != null ? "Yes" : "No",
              ),
              device?.centre != null
                  ? _buildDetailTile("Centre Code", device?.centre?.code)
                  : SizedBox(),
              _buildDetailTile("Status", device?.status.name.toUpperCase()),
              Divider(height: 32, thickness: 1.2),
              _buildDetailTile("This Tablet ID", tabletID),
              _buildDetailTile(
                "This Tablet Android Version",
                tabletAndroidVersion,
              ),
              _buildDetailTile("This Tablet App Version", tabletAppVersion),
              addVerticalSpace(32),
              GradientButton(
                child:
                    state is DeviceLoading
                        ? buttonLoading()
                        : Text(
                          "Setup Device",
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                onPressed: () {
                  if (device != null) {
                    DeviceEntity newDevice = device!.copyWith(
                      tabletID: androidInfo?.serialNumber,
                      tabletAndroidVersion: androidInfo?.version.release,
                      tabletAppVersion: packageInfo?.version,
                    );
                    context.read<DeviceCubit>().setupDevice(newDevice);
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailTile(String title, String? value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              title,
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 16,
                color: Colors.grey[800],
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value ?? '-',
              style: TextStyle(fontSize: 16, color: Colors.black87),
              textAlign: TextAlign.right,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    print("device: ${device?.centre}");
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: Text("Device Setup"),
        automaticallyImplyLeading: false,
        elevation: 0,
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        foregroundColor: Theme.of(context).primaryColor,
      ),
      body: BlocConsumer<DeviceCubit, DeviceState>(
        listener: (context, state) {
          if (state is DeviceError) {
            Fluttertoast.showToast(msg: state.message);
          }
          if (state is DeviceSuccess) {
            setState(() {
              device = state.device;
            });
          }
        },
        builder: (context, state) {
          return SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                vertical: 10.0,
                horizontal: 80.0,
              ),
              child:
                  device == null
                      ? _deviceSetupForm(state)
                      : _deviceDetails(state),
            ),
          );
        },
      ),
    );
  }
}
