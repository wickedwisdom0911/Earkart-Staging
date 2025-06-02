import 'package:earkart_omni/models/user/user.entity.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'auth.state.freezed.dart';

@freezed
class AuthState with _$AuthState {
  const factory AuthState.initial() = AuthInitial;
  const factory AuthState.loading() = AuthLoading;
  const factory AuthState.success({required UserEntity user}) = AuthSuccess;
  const factory AuthState.centreSuccess({required CentreEntity centre}) =
      AuthCentreSuccess;
  const factory AuthState.error({required String message}) = AuthError;
}
