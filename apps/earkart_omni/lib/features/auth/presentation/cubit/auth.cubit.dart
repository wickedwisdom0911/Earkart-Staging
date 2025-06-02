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
    emit(AuthLoading());
    final user = await loginUseCase(email, password);
    user.fold(
      (failure) => emit(AuthError(message: failure.message)),
      (user) => emit(AuthSuccess(user: user)),
    );
  }

  void getCentre() async {
    if (!isClosed) emit(AuthLoading());
    final centre = await getCentreUsecase();
    centre.fold(
      (failure) => emit(AuthError(message: failure.message)),
      (centre) => emit(AuthCentreSuccess(centre: centre)),
    );
  }

  void getCentreData() async {
    emit(AuthLoading());
    final centreData = await getCentreDataUsecase();
    centreData.fold(
      (failure) => emit(AuthError(message: failure.message)),
      (centreData) => emit(AuthCentreSuccess(centre: centreData)),
    );
  }

  void getCurrentUser() async {
    emit(AuthLoading());
    final currentUser = await getCurrentUserUsecase();
    currentUser.fold(
      (failure) => emit(AuthError(message: failure.message)),
      (currentUser) => emit(AuthSuccess(user: currentUser)),
    );
  }
}
