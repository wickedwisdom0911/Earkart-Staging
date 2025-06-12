import 'package:earkart_omni/config/routes/router.dart';
import 'package:earkart_omni/config/theme/theme_manager.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/data/source/local/centre.entity.source.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/consultation/data/source/local/consultation.enitity.source.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/home/presentation/pages/root_screen.dart';
import 'package:earkart_omni/features/lookup/presentation/cubit/lookup.cubit.dart';
import 'package:earkart_omni/features/patients/data/source/local/patient.entity.source.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/models/audiologist/audiologist.entity.dart';
import 'package:earkart_omni/models/audiometry/audiometry_test.entity.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/consultation/consultation_recording.entity.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/language/language.entity.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:earkart_omni/models/oae/oae_test.entity.dart';
import 'package:earkart_omni/models/otoscopy/otoscopy_test.entity.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:earkart_omni/models/tympanometry/tympanometry_test.entity.dart';
import 'package:earkart_omni/models/user/user.entity.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/material.dart';
import 'package:get/route_manager.dart';
import 'package:hive_flutter/hive_flutter.dart';

Future<void> main() async {
  await dotenv.load(fileName: ".env");
  WidgetsFlutterBinding.ensureInitialized();

  await _setupSystemUI();
  await setupDI();
  await _initHive();
  await _initDataSources();

  runApp(const MyApp());
}

Future<void> _setupSystemUI() async {
  // Lock orientation and set immersive mode
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
  ]);
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersive);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.dark,
    ),
  );
}

Future<void> _initHive() async {
  await Hive.initFlutter();
  _registerHiveAdapters();
}

void _registerHiveAdapters() {
  // User & Auth
  Hive.registerAdapter(UserEntityAdapter());
  // Device & Centre
  Hive.registerAdapter(DeviceEntityAdapter());
  Hive.registerAdapter(CentreEntityAdapter());
  // Language & Location
  Hive.registerAdapter(LanguageEntityAdapter());
  Hive.registerAdapter(StateEntityAdapter());
  Hive.registerAdapter(CityEntityAdapter());
  Hive.registerAdapter(DistrictEntityAdapter());
  Hive.registerAdapter(CountryEntityAdapter());
  // Patient & Consultation
  Hive.registerAdapter(PatientEntityAdapter());
  Hive.registerAdapter(ConsultationEntityAdapter());
  Hive.registerAdapter(ConsultationRecordingEntityAdapter());
  // Audiometry
  Hive.registerAdapter(AudiometryTestEntityAdapter());
  Hive.registerAdapter(ACReadingEntityAdapter());
  Hive.registerAdapter(BCReadingEntityAdapter());
  Hive.registerAdapter(SpeechReadingEntityAdapter());
  // OAE
  Hive.registerAdapter(OAETestEntityAdapter());
  Hive.registerAdapter(OAEReadingEntityAdapter());
  Hive.registerAdapter(FrequencyResponseEntityAdapter());
  // Otoscopy
  Hive.registerAdapter(OtoscopyTestEntityAdapter());
  Hive.registerAdapter(OtoscopyImageEntityAdapter());
  // Tympanometry
  Hive.registerAdapter(TympanometryTestEntityAdapter());
  Hive.registerAdapter(TympanometryReadingEntityAdapter());
  // Enums
  Hive.registerAdapter(PatientConsultationStatusAdapter());
  Hive.registerAdapter(AudiologistConsultationStatusAdapter());
  Hive.registerAdapter(SessionStatusAdapter());
  Hive.registerAdapter(TestStatusAdapter());
  Hive.registerAdapter(GenderAdapter());
  Hive.registerAdapter(RoleAdapter());
  Hive.registerAdapter(StatusAdapter());
  Hive.registerAdapter(PaymentCycleAdapter());
  Hive.registerAdapter(WeekDaysAdapter());
  Hive.registerAdapter(EarAdapter());
  // Audiologist
  Hive.registerAdapter(AudiologistEntityAdapter());
}

Future<void> _initDataSources() async {
  await di<UserEntityDataSource>().init();
  await di<CentreEntityDataSource>().init();
  await di<PatientEntityDataSource>().init();
  await di<ConsultationEntityDataSource>().init();
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthCubit>(create: (context) => di.call<AuthCubit>()),
        BlocProvider<PatientCubit>(
          create: (context) => di.call<PatientCubit>(),
        ),
        BlocProvider<ConsultationCubit>(
          create: (context) => di.call<ConsultationCubit>(),
        ),
        BlocProvider<LookupCubit>(create: (context) => di.call<LookupCubit>()),
      ],
      child: GetMaterialApp(
        title: "EarKart Omni",
        debugShowCheckedModeBanner: false,
        theme: theme,
        initialRoute: RootScreen.routeName,
        onGenerateRoute: (settings) => generateRoute(settings),
      ),
    );
  }
}
