import 'package:earkart_omni/models/network/network_status.dart';
import 'package:equatable/equatable.dart';

abstract class NetworkState extends Equatable {
  const NetworkState();

  @override
  List<Object?> get props => [];
}

class NetworkInitial extends NetworkState {}

class NetworkLoading extends NetworkState {}

class NetworkConnected extends NetworkState {
  final NetworkStatus status;

  const NetworkConnected({required this.status});

  @override
  List<Object?> get props => [status];
}

class NetworkDisconnected extends NetworkState {}

class NetworkError extends NetworkState {
  final String message;

  const NetworkError({required this.message});

  @override
  List<Object?> get props => [message];
}
