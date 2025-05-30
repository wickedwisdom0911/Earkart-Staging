import 'package:earkart_omni/config/services/api_client.dart';
import 'package:earkart_omni/features/auth/data/source/remote/auth.remote.source.dart';
import 'package:earkart_omni/features/auth/data/source/remote/auth.remote.source.impl.dart';
import 'package:earkart_omni/features/auth/data/repositories/auth.repository.impl.dart';
import 'package:earkart_omni/features/auth/domain/repositories/auth.repository.dart';
import 'package:earkart_omni/features/auth/domain/usecases/login.usecase.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';

import 'package:get_it/get_it.dart';

final di = GetIt.instance;

Future<void> setupDI() async {
  final api = API().getDio;
  di.registerLazySingleton(() => api);

  //auth
  di.registerLazySingleton<AuthRemoteSource>(
    () => AuthRemoteSourceImpl(dio: di.call()),
  );
  di.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(remoteSource: di.call()),
  );
  di.registerLazySingleton<LoginUseCase>(() => LoginUseCase(di.call()));
  di.registerLazySingleton<AuthCubit>(() => AuthCubit(loginUseCase: di.call()));
}
