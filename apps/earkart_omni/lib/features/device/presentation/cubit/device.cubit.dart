import 'package:earkart_omni/features/device/data/source/local/device.entity.source.dart';
import 'package:earkart_omni/features/device/domain/usecases/get_current_device.usecase.dart';
import 'package:earkart_omni/features/device/domain/usecases/get_device_by_value.usecase.dart';
import 'package:earkart_omni/features/device/domain/usecases/setup_device.usecase.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';

part 'device.state.dart';

class DeviceCubit extends Cubit<DeviceState> {
  final GetDeviceByValueUsecase getDeviceByValueUsecase;
  final SetupDeviceUsecase setupDeviceUsecase;
  final GetCurrentDeviceUsecase getCurrentDeviceUsecase;

  DeviceCubit({
    required this.getDeviceByValueUsecase,
    required this.setupDeviceUsecase,
    required this.getCurrentDeviceUsecase,
  }) : super(DeviceInitial());

  Future<void> getCurrentDevice() async {
    emit(DeviceLoading());
    final device = await getCurrentDeviceUsecase();
    if (device != null) {
      emit(DeviceSuccess(device: device));
    } else {
      emit(DeviceError(message: "Device not found"));
    }
  }

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
