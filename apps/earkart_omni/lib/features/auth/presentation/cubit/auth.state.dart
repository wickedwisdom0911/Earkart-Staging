part of "auth.cubit.dart";

abstract class AuthState extends Equatable {
  const AuthState();
  @override
  List<Object?> get props => [];
}

class AuthInitial extends AuthState {}

class AuthLoading extends AuthState {}

class AuthSuccess extends AuthState {
  final UserEntity user;
  const AuthSuccess({required this.user});
  @override
  List<Object?> get props => [user];
}

class AuthCentreSuccess extends AuthState {
  final CentreEntity centre;
  const AuthCentreSuccess({required this.centre});
  @override
  List<Object?> get props => [centre];
}

class AuthError extends AuthState {
  final String message;
  const AuthError({required this.message});
  @override
  List<Object?> get props => [message];
}
