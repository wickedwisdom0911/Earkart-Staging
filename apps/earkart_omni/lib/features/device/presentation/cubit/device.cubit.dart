import 'package:earkart_omni/features/device/domain/usecases/get_device_by_value.usecase.dart';
import 'package:earkart_omni/features/device/domain/usecases/setup_device.usecase.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';

part 'device.state.dart';

class DeviceCubit extends Cubit<DeviceState> {
  final GetDeviceByValueUsecase getDeviceByValueUsecase;
  final SetupDeviceUsecase setupDeviceUsecase;
  DeviceCubit({
    required this.getDeviceByValueUsecase,
    required this.setupDeviceUsecase,
  }) : super(DeviceInitial());

  Future<void> getDeviceByValue(String value) async {
    emit(DeviceLoading());
    final device = await getDeviceByValueUsecase(value);
    if (device != null) {
      emit(DeviceSuccess(device: device));
    } else {
      emit(DeviceError(message: "Device not found"));
    }
  }

  Future<void> setupDevice(DeviceEntity deviceData) async {
    emit(DeviceLoading());
    final device = await setupDeviceUsecase(deviceData);
    if (device != null) {
      emit(DeviceSuccess(device: device));
    } else {
      emit(DeviceError(message: "Device Setup Failed"));
    }
  }
}
