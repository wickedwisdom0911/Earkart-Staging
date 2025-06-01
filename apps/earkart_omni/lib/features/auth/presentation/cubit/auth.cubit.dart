import 'package:earkart_omni/features/auth/domain/usecases/get.centre.usecase.dart';
import 'package:earkart_omni/features/auth/domain/usecases/get.centre.data.usecase.dart';
import 'package:earkart_omni/features/auth/domain/usecases/get.current.user.usecase.dart';
import 'package:earkart_omni/features/auth/domain/usecases/login.usecase.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import 'package:earkart_omni/models/user/user.entity.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';

part 'auth.state.dart';

class AuthCubit extends Cubit<AuthState> {
  final LoginUseCase loginUseCase;
  final GetCentreUsecase getCentreUsecase;
  final GetCentreDataUsecase getCentreDataUsecase;
  final GetCurrentUserUsecase getCurrentUserUsecase;
  AuthCubit({
    required this.loginUseCase,
    required this.getCentreUsecase,
    required this.getCentreDataUsecase,
    required this.getCurrentUserUsecase,
  }) : super(AuthInitial());

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

  void getCentre() async {
    try {
      emit(AuthLoading());
      final centre = await getCentreUsecase();
      if (centre != null) {
        emit(AuthCentreSuccess(centre: centre));
      } else {
        emit(AuthError(message: "Centre not found"));
      }
    } catch (e) {
      emit(AuthError(message: e.toString()));
    }
  }

  void getCentreData() async {
    try {
      emit(AuthLoading());
      final centreData = await getCentreDataUsecase();
      if (centreData != null) {
        emit(AuthCentreSuccess(centre: centreData));
      } else {
        emit(AuthError(message: "Centre data not found"));
      }
    } catch (e) {
      emit(AuthError(message: e.toString()));
    }
  }

  void getCurrentUser() async {
    try {
      emit(AuthLoading());
      final currentUser = await getCurrentUserUsecase();
      if (currentUser != null) {
        emit(AuthSuccess(user: currentUser));
      } else {
        emit(AuthError(message: "Current user not found"));
      }
    } catch (e) {
      emit(AuthError(message: e.toString()));
    }
  }
}
