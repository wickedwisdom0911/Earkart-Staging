import 'package:earkart_mdm/config/services/api_client.dart';
import 'package:earkart_mdm/features/device/data/repositories/device.repository.impl.dart';
import 'package:earkart_mdm/features/device/data/source/local/device.entity.source.dart';
import 'package:earkart_mdm/features/device/data/source/remote/device.source.impl.dart';
import 'package:earkart_mdm/features/device/data/source/remote/device.source.interface.dart';
import 'package:earkart_mdm/features/device/domain/repositories/device.repository.interface.dart';
import 'package:earkart_mdm/features/device/domain/usecases/get_current_device.usecase.dart';
import 'package:earkart_mdm/features/device/domain/usecases/get_device_by_value.usecase.dart';
import 'package:earkart_mdm/features/device/domain/usecases/setup_device.usecase.dart';
import 'package:earkart_mdm/features/device/presentation/cubit/device.cubit.dart';
import 'package:get_it/get_it.dart';

final di = GetIt.instance;

Future<void> setupDI() async {
  final api = API().getDio;
  di.registerLazySingleton(() => api);

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
