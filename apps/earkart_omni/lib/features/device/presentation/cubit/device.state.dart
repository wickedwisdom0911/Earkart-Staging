part of 'device.cubit.dart';

class DeviceState extends Equatable {
  @override
  List<Object?> get props => [];
}

class DeviceInitial extends DeviceState {}

class DeviceLoading extends DeviceState {}

class DeviceError extends DeviceState {
  final String message;
  DeviceError({required this.message});
  @override
  List<Object?> get props => [message];
}

class DeviceSuccess extends DeviceState {
  final DeviceEntity device;
  DeviceSuccess({required this.device});
  @override
  List<Object?> get props => [device];
}
