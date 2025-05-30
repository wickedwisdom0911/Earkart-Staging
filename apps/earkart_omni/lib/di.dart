import 'package:earkart_omni/config/services/api_client.dart';
import 'package:earkart_omni/features/auth/data/source/remote/auth.remote.source.dart';
import 'package:earkart_omni/features/auth/data/source/remote/auth.remote.source.impl.dart';
import 'package:earkart_omni/features/auth/data/repositories/auth.repository.impl.dart';
import 'package:earkart_omni/features/auth/domain/repositories/auth.repository.dart';
import 'package:earkart_omni/features/auth/domain/usecases/login.usecase.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/device/data/repositories/device.repository.impl.dart';
import 'package:earkart_omni/features/device/data/source/local/device.entity.source.dart';
import 'package:earkart_omni/features/device/data/source/remote/device.source.impl.dart';
import 'package:earkart_omni/features/device/data/source/remote/device.source.interface.dart';
import 'package:earkart_omni/features/device/domain/repositories/device.repository.interface.dart';
import 'package:earkart_omni/features/device/domain/usecases/get_current_device.usecase.dart';
import 'package:earkart_omni/features/device/domain/usecases/get_device_by_value.usecase.dart';
import 'package:earkart_omni/features/device/domain/usecases/setup_device.usecase.dart';
import 'package:earkart_omni/features/device/presentation/cubit/device.cubit.dart';
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

  //device
  di.registerLazySingleton<DeviceEntityDataSource>(
    () => DeviceEntityDataSource(),
  );
  di.registerLazySingleton<IDeviceDataSource>(
    () =>
        DeviceDataSourceImpl(dio: di.call(), deviceEntityDataSource: di.call()),
  );
  di.registerLazySingleton<IDeviceRepository>(
    () => DeviceRepositoryImpl(deviceDataSource: di.call()),
  );
  di.registerLazySingleton<GetCurrentDeviceUsecase>(
    () => GetCurrentDeviceUsecase(deviceRepository: di.call()),
  );
  di.registerLazySingleton<GetDeviceByValueUsecase>(
    () => GetDeviceByValueUsecase(deviceRepository: di.call()),
  );
  di.registerLazySingleton<SetupDeviceUsecase>(
    () => SetupDeviceUsecase(deviceRepository: di.call()),
  );
  di.registerLazySingleton<DeviceCubit>(
    () => DeviceCubit(
      getDeviceByValueUsecase: di.call(),
      setupDeviceUsecase: di.call(),
      getCurrentDeviceUsecase: di.call(),
    ),
  );
}
