import 'package:earkart_omni/features/auth/domain/usecases/login.usecase.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:earkart_omni/models/user/user.entity.dart';

part 'auth.state.dart';

class AuthCubit extends Cubit<AuthState> {
  final LoginUseCase loginUseCase;
  AuthCubit({required this.loginUseCase}) : super(AuthInitial());

  void login(String email, String password) async {
    try {
      emit(AuthLoading());
      final user = await loginUseCase(email, password);
      if (user != null) {
        emit(AuthSuccess(user: user));
      } else {
        emit(AuthError(message: "Login failed"));
      }
    } catch (e) {
      emit(AuthError(message: e.toString()));
    }
  }
}
