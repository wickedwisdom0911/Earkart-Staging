import 'package:earkart_omni/config/services/api_client.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/features/auth/data/repositories/auth.repository.impl.dart';
import 'package:earkart_omni/features/auth/data/source/local/centre.entity.source.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/features/auth/data/source/remote/auth.remote.source.dart';
import 'package:earkart_omni/features/auth/data/source/remote/auth.remote.source.impl.dart';
import 'package:earkart_omni/features/auth/domain/repositories/auth.repository.dart';
import 'package:earkart_omni/features/auth/domain/usecases/get.centre.data.usecase.dart';
import 'package:earkart_omni/features/auth/domain/usecases/get.centre.usecase.dart';
import 'package:earkart_omni/features/auth/domain/usecases/get.current.user.usecase.dart';
import 'package:earkart_omni/features/auth/domain/usecases/login.usecase.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/consultation/data/repositories/agora.repository.impl.dart';
import 'package:earkart_omni/features/consultation/data/repositories/consulation.repository.impl.dart';
import 'package:earkart_omni/features/consultation/data/source/local/consultation.enitity.source.dart';
import 'package:earkart_omni/features/consultation/data/source/remote/agora.remote.source.dart';
import 'package:earkart_omni/features/consultation/data/source/remote/agora.remote.source.impl.dart';
import 'package:earkart_omni/features/consultation/data/source/remote/consultation.remote.source.dart';
import 'package:earkart_omni/features/consultation/data/source/remote/consultation.remote.source.impl.dart';
import 'package:earkart_omni/features/consultation/domain/repositories/agora.respository.dart';
import 'package:earkart_omni/features/consultation/domain/repositories/consultation.repository.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/create_consultation.usecase.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/delete_current_consultation_session.usecase.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/get_agora_token.usecase.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/get_consultation_by_id.usecase.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/get_consultations_by_centre_id.usecase.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/get_current_consultation.usecase.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/update_consultation.usecase.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.cubit.dart';
import 'package:earkart_omni/features/lookup/data/reositories/lookup.repository.impl.dart';
import 'package:earkart_omni/features/lookup/data/source/local/city.entity.source.dart';
import 'package:earkart_omni/features/lookup/data/source/local/countries.entity.source.dart';
import 'package:earkart_omni/features/lookup/data/source/local/district.entty.source.dart';
import 'package:earkart_omni/features/lookup/data/source/local/language.entity.source.dart';
import 'package:earkart_omni/features/lookup/data/source/local/state.entity.source.dart';
import 'package:earkart_omni/features/lookup/data/source/remote/lookup.remote.source.dart';
import 'package:earkart_omni/features/lookup/data/source/remote/lookup.remote.source.impl.dart';
import 'package:earkart_omni/features/lookup/domain/repositories/lookup.repository.interface.dart';
import 'package:earkart_omni/features/lookup/domain/usecases/get_cities.usecase.dart';
import 'package:earkart_omni/features/lookup/domain/usecases/get_countries.usecase.dart';
import 'package:earkart_omni/features/lookup/domain/usecases/get_districts.usecase.dart';
import 'package:earkart_omni/features/lookup/domain/usecases/get_languages.usecase.dart';
import 'package:earkart_omni/features/lookup/domain/usecases/get_states.usecase.dart';
import 'package:earkart_omni/features/lookup/presentation/cubit/lookup.cubit.dart';
import 'package:earkart_omni/features/patients/data/source/local/patient.entity.source.dart';
import 'package:earkart_omni/features/patients/data/source/patient.remote.source.dart';
import 'package:earkart_omni/features/patients/data/source/patient.remote.source.impl.dart';
import 'package:earkart_omni/features/patients/data/repositories/patient.repository.impl.dart';
import 'package:earkart_omni/features/patients/domain/repositories/patient.repository.interface.dart';
import 'package:earkart_omni/features/patients/domain/usecases/create_patient.usecase.dart';
import 'package:earkart_omni/features/patients/domain/usecases/delete_patient_session.usecase.dart';
import 'package:earkart_omni/features/patients/domain/usecases/get_all_patient_by_centre_code.dart';
import 'package:earkart_omni/features/patients/domain/usecases/get_current_patient.usecase.dart';
import 'package:earkart_omni/features/patients/domain/usecases/get_patients_by_value_usecase.dart';
import 'package:earkart_omni/features/patients/domain/usecases/update_patient_usecase.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/network/presentation/cubit/network.cubit.dart';
import 'package:earkart_omni/services/battery_service.dart';

import 'package:get_it/get_it.dart';
import 'package:logger/logger.dart';

final di = GetIt.instance;

Future<void> setupDI() async {
  final api = API().getDio;
  di.registerLazySingleton(() => api);
  di.registerLazySingleton<Logger>(
    () => Logger(
      level: Level.debug,
      printer: PrettyPrinter(
        methodCount: 0,
        errorMethodCount: 10,
        lineLength: 20,
        colors: true,
        printEmojis: true,
      ),
    ),
  );
  di.registerLazySingleton<ILogger>(() => CustomLogger(logger: di.call()));

  di.registerLazySingleton<UserEntityDataSource>(() => UserEntityDataSource());
  di.registerLazySingleton<CentreEntityDataSource>(
    () => CentreEntityDataSource(),
  );
  di.registerLazySingleton<PatientEntityDataSource>(
    () => PatientEntityDataSource(),
  );
  di.registerLazySingleton<LanguageEntityDataSource>(
    () => LanguageEntityDataSource(),
  );
  di.registerLazySingleton<CountryEntityDataSource>(
    () => CountryEntityDataSource(),
  );
  di.registerLazySingleton<StateEntityDataSource>(
    () => StateEntityDataSource(),
  );
  di.registerLazySingleton<CityEntityDataSource>(() => CityEntityDataSource());
  di.registerLazySingleton<DistrictEntityDataSource>(
    () => DistrictEntityDataSource(),
  );
  di.registerLazySingleton<ConsultationEntityDataSource>(
    () => ConsultationEntityDataSource(),
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
      userEntityDataSource: di.call(),
      centreEntityDataSource: di.call(),
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
  di.registerLazySingleton<GetAllPatientByCentreCodeUsecase>(
    () => GetAllPatientByCentreCodeUsecase(patientRepository: di.call()),
  );
  di.registerLazySingleton<GetPatientsByValueUsecase>(
    () => GetPatientsByValueUsecase(patientRepository: di.call()),
  );
  di.registerLazySingleton<UpdatePatientUsecase>(
    () => UpdatePatientUsecase(di.call()),
  );
  di.registerLazySingleton<PatientCubit>(
    () => PatientCubit(
      createPatientUsecase: di.call(),
      getCurrentPatientUsecase: di.call(),
      deletePatientSessionUsecase: di.call(),
      getAllPatientByCentreCodeUsecase: di.call(),
      getPatientsByValueUsecase: di.call(),
      updatePatientUsecase: di.call(),
    ),
  );

  //lookup
  di.registerLazySingleton<ILookupRepository>(
    () => LookupRepositoryImpl(remoteSource: di.call()),
  );
  di.registerLazySingleton<ILookupRemoteSource>(
    () => LookupRemoteSourceImpl(dio: di.call()),
  );
  di.registerLazySingleton<GetLanguagesUsecase>(
    () => GetLanguagesUsecase(repository: di.call()),
  );
  di.registerLazySingleton<GetCountriesUsecase>(
    () => GetCountriesUsecase(repository: di.call()),
  );
  di.registerLazySingleton<GetStatesUsecase>(
    () => GetStatesUsecase(repository: di.call()),
  );
  di.registerLazySingleton<GetCitiesUsecase>(
    () => GetCitiesUsecase(repository: di.call()),
  );
  di.registerLazySingleton<GetDistrictsUsecase>(
    () => GetDistrictsUsecase(repository: di.call()),
  );
  di.registerLazySingleton<LookupCubit>(
    () => LookupCubit(
      getLanguagesUsecase: di.call(),
      getCountriesUsecase: di.call(),
      getStatesUsecase: di.call(),
      getCitiesUsecase: di.call(),
      getDistrictsUsecase: di.call(),
    ),
  );

  //consultation
  di.registerLazySingleton<IConsultationRemoteSource>(
    () => ConsultationRemoteSourceImpl(
      dio: di.call(),
      consultationEntityDataSource: di.call(),
      userEntityDataSource: di.call(),
      centreEntityDataSource: di.call(),
      patientEntityDataSource: di.call(),
    ),
  );
  di.registerLazySingleton<IConsultationRepository>(
    () => ConsultationRepositoryImpl(consultationRemoteSource: di.call()),
  );
  di.registerLazySingleton<GetConsultationByIdUsecase>(
    () => GetConsultationByIdUsecase(consultationRepository: di.call()),
  );
  di.registerLazySingleton<CreateConsultationUsecase>(
    () => CreateConsultationUsecase(consultationRepository: di.call()),
  );
  di.registerLazySingleton<UpdateConsultationUsecase>(
    () => UpdateConsultationUsecase(consultationRepository: di.call()),
  );
  di.registerLazySingleton<DeleteCurrentConsultationSessionUsecase>(
    () => DeleteCurrentConsultationSessionUsecase(
      consultationRepository: di.call(),
    ),
  );
  di.registerLazySingleton<GetConsultationsByCentreIdUsecase>(
    () => GetConsultationsByCentreIdUsecase(consultationRepository: di.call()),
  );
  di.registerLazySingleton<GetCurrentConsultationUsecase>(
    () => GetCurrentConsultationUsecase(consultationRepository: di.call()),
  );
  di.registerLazySingleton<ConsultationCubit>(
    () => ConsultationCubit(
      createConsultationUsecase: di.call(),
      getConsultationByIdUsecase: di.call(),
      updateConsultationUsecase: di.call(),
      deleteCurrentConsultationSessionUsecase: di.call(),
      getConsultationsByCentreIdUsecase: di.call(),
      getCurrentConsultationUsecase: di.call(),
    ),
  );

  //agora
  di.registerLazySingleton<IAgoraRemoteSource>(
    () => AgoraRemoteSourceImpl(di.call(), di.call(), di.call(), di.call()),
  );
  di.registerLazySingleton<IAgoraRepository>(
    () => AgoraRepositoryImpl(di.call()),
  );
  di.registerLazySingleton<GetAgoraTokenUsecase>(
    () => GetAgoraTokenUsecase(di.call()),
  );
  di.registerLazySingleton<AgoraCubit>(() => AgoraCubit(di.call()));

  //device
  di.registerLazySingleton<DeviceCubit>(() => DeviceCubit());
  di.registerLazySingleton<CommunicationCubit>(() => CommunicationCubit());

  //network
  di.registerLazySingleton<NetworkCubit>(() => NetworkCubit());

  //battery
  di.registerLazySingleton<BatteryService>(() => BatteryService());
}
