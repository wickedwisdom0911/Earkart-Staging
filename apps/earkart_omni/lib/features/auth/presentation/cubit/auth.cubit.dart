import 'package:earkart_omni/features/auth/domain/usecases/get.centre.usecase.dart';
import 'package:earkart_omni/features/auth/domain/usecases/get.centre.data.usecase.dart';
import 'package:earkart_omni/features/auth/domain/usecases/get.current.user.usecase.dart';
import 'package:earkart_omni/features/auth/domain/usecases/login.usecase.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.state.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

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
    if (!isClosed) emit(AuthLoading());
    final user = await loginUseCase(email, password);
    user.fold(
      (failure) {
        if (!isClosed) emit(AuthError(message: failure.message));
      },
      (user) {
        if (!isClosed) emit(AuthSuccess(user: user));
      },
    );
  }

  void getCentre() async {
    if (!isClosed) emit(AuthLoading());
    final centre = await getCentreUsecase();
    centre.fold(
      (failure) {
        if (!isClosed) emit(AuthCentreError(message: failure.message));
      },
      (centre) {
        if (!isClosed) emit(AuthCentreSuccess(centre: centre));
      },
    );
  }

  void getCentreData() async {
    emit(AuthLoading());
    final centreData = await getCentreDataUsecase();
    centreData.fold(
      (failure) {
        if (!isClosed) emit(AuthCentreError(message: failure.message));
      },
      (centreData) {
        if (!isClosed) emit(AuthCentreSuccess(centre: centreData));
      },
    );
  }

  void getCurrentUser() async {
    emit(AuthLoading());
    final currentUser = await getCurrentUserUsecase();
    currentUser.fold(
      (failure) {
        emit(AuthError(message: failure.message));
      },
      (currentUser) {
        emit(AuthSuccess(user: currentUser));
      },
    );
  }
}
