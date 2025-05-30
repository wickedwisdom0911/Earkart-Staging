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

  @override
  void initState() {
    super.initState();
    context.read<DeviceCubit>().getCurrentDevice();
    getPackageInfo();
  }

  void getPackageInfo() async {
    PermissionStatus status = await Permission.phone.request();
    if (status.isGranted) {
      print("Permission granted");
    } else if (status == PermissionStatus.denied ||
        status == PermissionStatus.permanentlyDenied) {
      print("Permission denied or permanently denied");
      // Handle the case where permission is denied or permanently denied
    } else {
      print("Permission not granted");
    }
    AndroidDeviceInfo androidInfo = await deviceInfo.androidInfo;

    log("androidinfo.data: ${androidInfo.data}");
  }

  @override
  void dispose() {
    deviceCodeController.dispose();
    super.dispose();
  }

  Widget _deviceSetupForm(DeviceState state) {
    return Center(
      child: Container(
        width: Dimensions.screenWidth * 0.6,
        padding: EdgeInsets.all(20),
        child: Column(
          children: [
            addVerticalSpace(30),
            CustomTextField(
              hint: "Enter the Device Code",
              controller: deviceCodeController,
            ),
            addVerticalSpace(30),
            GradientButton(
              child:
                  state is DeviceLoading
                      ? buttonLoading()
                      : Text(
                        "Start Setup",
                        style: TextStyle(color: Colors.white),
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
    );
  }

  @override
  Widget build(BuildContext context) {
    print(device?.props);
    return Scaffold(
      appBar: AppBar(
        title: Text("Device Setup"),
        automaticallyImplyLeading: false,
      ),
      body: BlocConsumer<DeviceCubit, DeviceState>(
        listener: (context, state) {
          if (state is DeviceError) {
            Fluttertoast.showToast(msg: state.message);
          }
          if (state is DeviceSuccess) {
            device = state.device;
          }
        },
        builder: (context, state) {
          return device == null
              ? _deviceSetupForm(state)
              : Text("Device Setup");
        },
      ),
    );
  }
}
