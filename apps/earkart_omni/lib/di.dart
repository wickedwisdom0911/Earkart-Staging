import 'package:earkart_omni/config/services/api_client.dart';
import 'package:earkart_omni/features/auth/data/source/local/centre.entity.source.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/features/auth/data/source/remote/auth.remote.source.dart';
import 'package:earkart_omni/features/auth/data/source/remote/auth.remote.source.impl.dart';
import 'package:earkart_omni/features/auth/data/repositories/auth.repository.impl.dart';
import 'package:earkart_omni/features/auth/domain/repositories/auth.repository.dart';
import 'package:earkart_omni/features/auth/domain/usecases/get.centre.data.usecase.dart';
import 'package:earkart_omni/features/auth/domain/usecases/get.centre.usecase.dart';
import 'package:earkart_omni/features/auth/domain/usecases/get.current.user.usecase.dart';
import 'package:earkart_omni/features/auth/domain/usecases/login.usecase.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/patients/data/source/local/patient.entity.source.dart';
import 'package:earkart_omni/features/patients/data/source/patient.remote.source.dart';
import 'package:earkart_omni/features/patients/data/source/patient.remote.source.impl.dart';
import 'package:earkart_omni/features/patients/data/repositories/patient.repository.impl.dart';
import 'package:earkart_omni/features/patients/domain/repositories/patient.repository.interface.dart';
import 'package:earkart_omni/features/patients/domain/usecases/create_patient.usecase.dart';
import 'package:earkart_omni/features/patients/domain/usecases/delete_patient_session.usecase.dart';
import 'package:earkart_omni/features/patients/domain/usecases/get_current_patient.usecase.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';

import 'package:get_it/get_it.dart';

final di = GetIt.instance;

Future<void> setupDI() async {
  final api = API().getDio;
  di.registerLazySingleton(() => api);

  di.registerLazySingleton<UserEntityDataSource>(() => UserEntityDataSource());
  di.registerLazySingleton<CentreEntityDataSource>(
    () => CentreEntityDataSource(),
  );
  di.registerLazySingleton<PatientEntityDataSource>(
    () => PatientEntityDataSource(),
  );
  //auth
  di.registerLazySingleton<AuthRemoteSource>(
    () => AuthRemoteSourceImpl(
      dio: di.call(),
      userEntityDataSource: di.call(),
      centreEntityDataSource: di.call(),
    ),
  );
  di.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(remoteSource: di.call()),
  );
  di.registerLazySingleton<LoginUseCase>(() => LoginUseCase(di.call()));
  di.registerLazySingleton<GetCentreUsecase>(
    () => GetCentreUsecase(authRepository: di.call()),
  );
  di.registerLazySingleton<GetCentreDataUsecase>(
    () => GetCentreDataUsecase(authRepository: di.call()),
  );
  di.registerLazySingleton<GetCurrentUserUsecase>(
    () => GetCurrentUserUsecase(authRepository: di.call()),
  );
  di.registerLazySingleton<AuthCubit>(
    () => AuthCubit(
      loginUseCase: di.call(),
      getCentreUsecase: di.call(),
      getCentreDataUsecase: di.call(),
      getCurrentUserUsecase: di.call(),
    ),
  );
  //patient
  di.registerLazySingleton<IPatientSource>(
    () => PatientRemoteSourceImpl(
      dio: di.call(),
      patientEntityDataSource: di.call(),
    ),
  );
  di.registerLazySingleton<IPatientRepository>(
    () => PatientRepositoryImpl(patientRemoteSource: di.call()),
  );
  di.registerLazySingleton<CreatePatientUsecase>(
    () => CreatePatientUsecase(di.call()),
  );
  di.registerLazySingleton<GetCurrentPatientUsecase>(
    () => GetCurrentPatientUsecase(patientRepository: di.call()),
  );
  di.registerLazySingleton<DeletePatientSessionUsecase>(
    () => DeletePatientSessionUsecase(patientRepository: di.call()),
  );
  di.registerLazySingleton<PatientCubit>(
    () => PatientCubit(
      createPatientUsecase: di.call(),
      getCurrentPatientUsecase: di.call(),
      deletePatientSessionUsecase: di.call(),
    ),
  );
}
