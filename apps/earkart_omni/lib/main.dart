import 'package:earkart_omni/config/routes/router.dart';
import 'package:earkart_omni/config/theme/theme_manager.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/data/source/local/centre.entity.source.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/consultation/data/source/local/consultation.enitity.source.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.cubit.dart';
import 'package:earkart_omni/features/home/presentation/pages/root_screen.dart';
import 'package:earkart_omni/features/lookup/presentation/cubit/lookup.cubit.dart';
import 'package:earkart_omni/features/network/presentation/cubit/network.cubit.dart';
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
import 'package:flutter/gestures.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/material.dart';
import 'package:get/route_manager.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'dart:async';

Future<void> main() async {
  await dotenv.load(fileName: ".env");
  WidgetsFlutterBinding.ensureInitialized();

  await _setupSystemUI();
  await setupDI();
  await _initHive();
  await _initDataSources();

  runApp(const MyApp());
}

// Global timer for auto-hide functionality
Timer? _autoHideTimer;

Future<void> _setupSystemUI() async {
  // Lock orientation to landscape for optimal medical device usage
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  // Initialize full screen immersive mode
  await _enableFullScreenMode();

  // Set up auto-hide system UI listener
  _setupAutoHideSystemUI();
}

/// Enable full screen immersive mode for medical application
Future<void> _enableFullScreenMode() async {
  // Enable immersive full screen mode
  SystemChrome.setEnabledSystemUIMode(
    SystemUiMode.immersiveSticky,
    overlays: [],
  );

  // Configure beautiful transparent system UI overlay
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      // Status Bar Configuration
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,

      // System Navigation Bar Configuration
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarDividerColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.dark,

      // Modern Android 12+ system bar styling
      systemStatusBarContrastEnforced: false,
      systemNavigationBarContrastEnforced: false,
    ),
  );
}

/// Set up auto-hide functionality for system UI
void _setupAutoHideSystemUI() {
  // Listen to system UI visibility changes
  SystemChannels.platform.setMethodCallHandler((call) async {
    if (call.method == 'SystemChrome.systemUIChange') {
      // User interacted with system UI, start auto-hide timer
      _startAutoHideTimer();
    }
    return null;
  });

  // Also listen to app lifecycle changes
  WidgetsBinding.instance.addObserver(_SystemUIObserver());
}

/// Start timer to automatically hide system UI after user interaction
void _startAutoHideTimer() {
  // Cancel any existing timer
  _autoHideTimer?.cancel();

  // Start new timer - hide system UI after 3 seconds of inactivity
  _autoHideTimer = Timer(const Duration(seconds: 3), () async {
    await _enableFullScreenMode();
    // Optional: Show a brief notification that app went back to full screen
    _showFullScreenNotification();
  });
}

/// Show a subtle notification when returning to full screen mode
void _showFullScreenNotification() {
  // This could be enhanced with a toast or subtle indicator
  // For now, we'll provide gentle haptic feedback
  HapticFeedback.lightImpact();
}

/// Custom app lifecycle observer for system UI management
class _SystemUIObserver extends WidgetsBindingObserver {
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);

    switch (state) {
      case AppLifecycleState.resumed:
        // App resumed, ensure full screen mode
        _enableFullScreenMode();
        break;
      case AppLifecycleState.paused:
      case AppLifecycleState.detached:
        // Cancel auto-hide timer when app is not active
        _autoHideTimer?.cancel();
        break;
      default:
        break;
    }
  }
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
        BlocProvider<AgoraCubit>(create: (context) => di.call<AgoraCubit>()),
        BlocProvider<DeviceCubit>(create: (context) => di.call<DeviceCubit>()),
        BlocProvider<CommunicationCubit>(
          create: (context) => di.call<CommunicationCubit>(),
        ),
        BlocProvider<NetworkCubit>(
          create: (context) => di.call<NetworkCubit>(),
        ),
      ],
      child: GetMaterialApp(
        title: "EarKart Omni",
        debugShowCheckedModeBanner: false,
        theme: theme,
        initialRoute: RootScreen.routeName,
        onGenerateRoute: (settings) => generateRoute(settings),

        // Beautiful app configuration with full screen management
        builder: (context, child) {
          return AnnotatedRegion<SystemUiOverlayStyle>(
            value: const SystemUiOverlayStyle(
              statusBarColor: Colors.transparent,
              statusBarIconBrightness: Brightness.dark,
              systemNavigationBarColor: Colors.transparent,
              systemNavigationBarIconBrightness: Brightness.dark,
            ),
            child: GestureDetector(
              // Detect user interactions to manage auto-hide timer
              onTap: () => _startAutoHideTimer(),
              onPanDown: (_) => _startAutoHideTimer(),
              onScaleStart: (_) => _startAutoHideTimer(),
              behavior: HitTestBehavior.translucent,
              child: MediaQuery(
                data: MediaQuery.of(context).copyWith(
                  // Ensure text scaling doesn't break medical UI layouts
                  textScaler: TextScaler.linear(1.0),
                ),
                child: child ?? const SizedBox.shrink(),
              ),
            ),
          );
        },

        // Enhanced scrolling physics for better user experience
        scrollBehavior: const MaterialScrollBehavior().copyWith(
          dragDevices: {
            PointerDeviceKind.touch,
            PointerDeviceKind.mouse,
            PointerDeviceKind.trackpad,
          },
          scrollbars: false,
        ),
      ),
    );
  }
}
