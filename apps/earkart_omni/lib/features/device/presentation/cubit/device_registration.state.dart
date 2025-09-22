import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:earkart_omni/models/device/device.entity.dart';

part 'device_registration.state.freezed.dart';

@freezed
abstract class DeviceRegistrationState with _$DeviceRegistrationState {
  const factory DeviceRegistrationState.initial() = DeviceRegistrationInitial;
  const factory DeviceRegistrationState.loading() = DeviceRegistrationLoading;
  const factory DeviceRegistrationState.success({
    required DeviceEntity? device,
  }) = DeviceRegistrationSuccess;
  const factory DeviceRegistrationState.error({required String message}) =
      DeviceRegistrationError;
}
