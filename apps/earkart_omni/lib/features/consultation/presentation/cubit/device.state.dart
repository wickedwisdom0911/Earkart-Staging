import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:usb_serial_kotlin/usb_serial_kotlin.dart';

part 'device.state.freezed.dart';

@freezed
abstract class DeviceState with _$DeviceState {
  const factory DeviceState.initial() = DeviceInitial;
  const factory DeviceState.loading() = DeviceLoading;
  const factory DeviceState.success({
    required List<UsbDevice> devices,
    required UsbDevice? r15cDevice,
    required UsbDevice? revo2Device,
  }) = DeviceSuccess;
  const factory DeviceState.error({required String message}) = DeviceError;
}
