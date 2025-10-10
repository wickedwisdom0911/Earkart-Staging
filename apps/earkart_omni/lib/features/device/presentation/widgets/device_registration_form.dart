import 'package:earkart_omni/config/widgets/gradient_button.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/features/device/presentation/cubit/device_registration.cubit.dart';
import 'package:earkart_omni/features/device/presentation/cubit/device_registration.state.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fluttertoast/fluttertoast.dart';

class DeviceRegistrationForm extends StatelessWidget {
  final TextEditingController deviceCodeController;
  final DeviceEntity? device;
  final bool isDeviceFound;

  const DeviceRegistrationForm({
    super.key,
    required this.deviceCodeController,
    required this.device,
    required this.isDeviceFound,
  });

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<DeviceRegistrationCubit, DeviceRegistrationState>(
      builder: (context, state) {
        return SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 32),
              _buildDeviceIcon(),
              const SizedBox(height: 32),
              _buildTitle(),
              const SizedBox(height: 40),
              _buildDeviceCodeInput(),
              const SizedBox(height: 24),
              _buildActionButton(context, state),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDeviceIcon() {
    return Container(
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
            color: Constants.secondaryColor.withAlpha(30),
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
    );
  }

  Widget _buildTitle() {
    return Column(
      children: [
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
      ],
    );
  }

  Widget _buildDeviceCodeInput() {
    return Container(
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
      ),
    );
  }

  Widget _buildActionButton(
    BuildContext context,
    DeviceRegistrationState state,
  ) {
    return GradientButton(
      colors: [Constants.primaryColor, Constants.secondaryColor],
      enabled: !state.maybeWhen(loading: () => true, orElse: () => false),
      onPressed: () => _handleButtonPress(context),
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
            () => Text(
              isDeviceFound ? 'Register Device' : 'Check Device Code',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
      ),
    );
  }

  void _handleButtonPress(BuildContext context) {
    if (deviceCodeController.text.isNotEmpty) {
      if (isDeviceFound) {
        // Call setup device when device is found
        context.read<DeviceRegistrationCubit>().setupDevice(device!);
      } else {
        // Check device code initially
        context.read<DeviceRegistrationCubit>().getDeviceByValue(
          deviceCodeController.text,
        );
      }
    } else {
      Fluttertoast.showToast(msg: "Please enter device code");
    }
  }
}
