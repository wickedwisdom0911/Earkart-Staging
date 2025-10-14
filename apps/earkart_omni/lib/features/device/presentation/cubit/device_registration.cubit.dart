import 'package:earkart_omni/features/device/domain/usecases/get_current_device.usecase.dart';
import 'package:earkart_omni/features/device/domain/usecases/get_device_by_value.usecase.dart';
import 'package:earkart_omni/features/device/domain/usecases/setup_device.usecase.dart';
import 'package:earkart_omni/features/device/presentation/cubit/device_registration.state.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class DeviceRegistrationCubit extends Cubit<DeviceRegistrationState> {
  final GetDeviceByValueUsecase getDeviceByValueUsecase;
  final SetupDeviceUsecase setupDeviceUsecase;
  final GetCurrentDeviceUsecase getCurrentDeviceUsecase;

  DeviceRegistrationCubit({
    required this.getDeviceByValueUsecase,
    required this.setupDeviceUsecase,
    required this.getCurrentDeviceUsecase,
  }) : super(const DeviceRegistrationState.initial());

  Future<void> getCurrentDevice() async {
    try {
      emit(const DeviceRegistrationState.loading());
      final device = await getCurrentDeviceUsecase();
      if (device != null) {
        emit(DeviceRegistrationState.localDeviceFetched(device: device));
      } else {
        emit(
          const DeviceRegistrationState.error(
            message: "This Device is not Registered or synced properly!",
          ),
        );
      }
    } catch (e) {
      emit(DeviceRegistrationState.error(message: e.toString()));
    }
  }

  Future<void> getDeviceByValue(String value) async {
    emit(const DeviceRegistrationState.loading());
    try {
      final device = await getDeviceByValueUsecase(value);
      if (device != null) {
        emit(DeviceRegistrationState.getByValueSuccess(device: device));
      } else {
        emit(const DeviceRegistrationState.error(message: "Device not found"));
      }
    } catch (e) {
      emit(DeviceRegistrationState.error(message: e.toString()));
    }
  }

  Future<void> setupDevice(
    DeviceEntity deviceData, {
    String? r15cSerialNumber,
    String? tabletID,
    String? tabletAndroidVersion,
    String? tabletAppVersion,
  }) async {
    emit(const DeviceRegistrationState.loading());
    try {
      final updatedDevice = deviceData.copyWith(
        deviceID: r15cSerialNumber,
        tabletID: tabletID,
        tabletAndroidVersion: tabletAndroidVersion,
        tabletAppVersion: tabletAppVersion,
        lastUpdateChecked: DateTime.now(),
      );

      final device = await setupDeviceUsecase(updatedDevice);
      if (device != null) {
        emit(DeviceRegistrationState.success(device: device));
      } else {
        emit(
          const DeviceRegistrationState.error(
            message: "Failed to setup device",
          ),
        );
      }
    } catch (e) {
      emit(DeviceRegistrationState.error(message: e.toString()));
    }
  }

  void resetToInitial() {
    emit(const DeviceRegistrationState.initial());
  }
}
