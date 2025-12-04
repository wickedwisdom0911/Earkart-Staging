import 'package:earkart_omni/features/device/domain/usecases/get_current_device.usecase.dart';
import 'package:earkart_omni/features/device/domain/usecases/get_device_by_value.usecase.dart';
import 'package:earkart_omni/features/device/domain/usecases/setup_device.usecase.dart';
import 'package:earkart_omni/features/device/presentation/cubit/device_registration.state.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fluttertoast/fluttertoast.dart';

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
    emit(const DeviceRegistrationState.loading());
    final result = await getCurrentDeviceUsecase();
    result.fold(
      (failure) {
        Fluttertoast.showToast(msg: failure.message);
        emit(DeviceRegistrationState.error(message: failure.message));
      },
      (device) {
        if (device != null) {
          emit(DeviceRegistrationState.localDeviceFetched(device: device));
        } else {
          emit(
            const DeviceRegistrationState.error(
              message: "This Device is not Registered or synced properly!",
            ),
          );
        }
      },
    );
  }

  Future<void> getDeviceByValue(String value) async {
    emit(const DeviceRegistrationState.loading());
    final result = await getDeviceByValueUsecase(value);
    result.fold(
      (failure) {
        Fluttertoast.showToast(msg: failure.message);
        emit(DeviceRegistrationState.error(message: failure.message));
      },
      (device) {
        emit(DeviceRegistrationState.getByValueSuccess(device: device));
      },
    );
  }

  Future<void> setupDevice(
    DeviceEntity deviceData, {
    String? r15cSerialNumber,
    String? tabletID,
    String? tabletAndroidVersion,
    String? tabletAppVersion,
  }) async {
    emit(const DeviceRegistrationState.loading());
    final updatedDevice = deviceData.copyWith(
      deviceID: r15cSerialNumber,
      tabletID: tabletID,
      tabletAndroidVersion: tabletAndroidVersion,
      tabletAppVersion: tabletAppVersion,
      lastUpdateChecked: DateTime.now(),
    );

    final result = await setupDeviceUsecase(updatedDevice);
    result.fold(
      (failure) {
        Fluttertoast.showToast(msg: failure.message);
        emit(DeviceRegistrationState.error(message: failure.message));
      },
      (device) {
        emit(DeviceRegistrationState.success(device: device));
      },
    );
  }

  void resetToInitial() {
    emit(const DeviceRegistrationState.initial());
  }
}
