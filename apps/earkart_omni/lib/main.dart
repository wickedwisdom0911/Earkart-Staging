import 'package:earkart_omni/config/routes/router.dart';
import 'package:earkart_omni/config/theme/theme_manager.dart';
import 'package:earkart_omni/config/utils/wakelock_manager.dart';
import 'package:earkart_omni/config/widgets/app_loading_screen.dart';
import 'package:earkart_omni/config/services/session_manager.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/data/source/local/centre.entity.source.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/features/device/data/source/local/device.entity.source.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/consultation/data/source/local/consultation.enitity.source.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/communication.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/device.cubit.dart';
import 'package:earkart_omni/features/device/presentation/cubit/device_registration.cubit.dart';
import 'package:earkart_omni/features/home/presentation/pages/root_screen.dart';
import 'package:earkart_omni/features/lookup/presentation/cubit/lookup.cubit.dart';
import 'package:earkart_omni/features/network/presentation/cubit/network.cubit.dart';
import 'package:earkart_omni/features/network/presentation/widgets/network_status_widget.dart';
import 'package:earkart_omni/features/network/presentation/widgets/wakelock_status_widget.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/device_status_widget.dart';
import 'package:earkart_omni/features/patients/data/source/local/patient.entity.source.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/lookup/data/source/local/countries.entity.source.dart';
import 'package:earkart_omni/features/lookup/data/source/local/state.entity.source.dart';
import 'package:earkart_omni/features/lookup/data/source/local/city.entity.source.dart';
import 'package:earkart_omni/features/lookup/data/source/local/district.entty.source.dart';
import 'package:earkart_omni/features/lookup/data/source/local/language.entity.source.dart';
import 'package:earkart_omni/services/battery_service.dart';
import 'package:earkart_omni/models/audiologist/audiologist.entity.dart';
import 'package:earkart_omni/models/audiometry/audiometry_test.entity.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/consultation/consultation_pricing.entity.dart';
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
import 'dart:developer' as developer;
import 'package:earkart_omni/utils/device_owner_helper.dart';

Future<void> main() async {
  await dotenv.load(fileName: ".env");
  WidgetsFlutterBinding.ensureInitialized();

  await _setupSystemUI();
  await _setupWakelock();
  await setupDI();
  await _initHive();
  await _initDataSources();

  // Initialize battery service
  await _initializeBatteryService();

  // Auto-grant device owner permissions if app is device owner
  await _initializeDeviceOwnerPermissions();

  // Start lookup data initialization in background (non-blocking)
  unawaited(_initLookupDataAsync());

  runApp(const MyApp());
}

/// Initialize battery service
Future<void> _initializeBatteryService() async {
  try {
    developer.log('Initializing battery service...', name: 'BatteryService');

    final batteryService = di<BatteryService>();
    await batteryService.initialize();

    developer.log(
      'Battery service initialized successfully',
      name: 'BatteryService',
    );
  } catch (e) {
    developer.log(
      'Error initializing battery service: $e',
      name: 'BatteryService',
    );
  }
}

/// Initialize device owner permissions automatically with timeout
Future<void> _initializeDeviceOwnerPermissions() async {
  try {
    developer.log(
      'Initializing device owner permissions...',
      name: 'DeviceOwner',
    );

    // Add timeout to prevent hanging during startup
    await Future.wait([
      DeviceOwnerHelper.autoGrantPermissionsIfDeviceOwner(),
      // Run permission summary in parallel but don't wait for it
      DeviceOwnerHelper.printPermissionSummary().catchError((e) {
        developer.log('Permission summary failed: $e', name: 'DeviceOwner');
      }),
    ]).timeout(
      const Duration(seconds: 8),
      onTimeout: () {
        developer.log(
          'Device owner permissions initialization timed out - continuing startup',
          name: 'DeviceOwner',
        );
        return [];
      },
    );

    developer.log(
      'Device owner permissions initialization complete',
      name: 'DeviceOwner',
    );
  } catch (e) {
    developer.log(
      'Error initializing device owner permissions: $e - continuing startup',
      name: 'DeviceOwner',
    );
  }
}

// Global timer for auto-hide functionality
Timer? _autoHideTimer;

// Global system UI observer instance to prevent memory leaks
_SystemUIObserver? _systemUIObserver;

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
  // Remove existing observer if any to prevent duplicates
  if (_systemUIObserver != null) {
    WidgetsBinding.instance.removeObserver(_systemUIObserver!);
  }

  // Create and add new observer
  _systemUIObserver = _SystemUIObserver();
  WidgetsBinding.instance.addObserver(_systemUIObserver!);
}

/// Clean up system UI observer to prevent memory leaks
void _cleanupSystemUIObserver() {
  if (_systemUIObserver != null) {
    WidgetsBinding.instance.removeObserver(_systemUIObserver!);
    _systemUIObserver = null;
  }
  _autoHideTimer?.cancel();
  _autoHideTimer = null;
}

/// Start timer to automatically hide system UI after user interaction
void _startAutoHideTimer() {
  // Cancel any existing timer
  _autoHideTimer?.cancel();

  // Start new timer - hide system UI after 3 seconds of inactivity
  _autoHideTimer = Timer(const Duration(seconds: 3), () async {
    // Check if timer is still valid (not cancelled)
    if (_autoHideTimer != null && _autoHideTimer!.isActive) {
      await _enableFullScreenMode();
      // Optional: Show a brief notification that app went back to full screen
      _showFullScreenNotification();
    }
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
      case AppLifecycleState.inactive:
        // App is inactive, cancel auto-hide timer
        _autoHideTimer?.cancel();
        break;
      default:
        break;
    }
  }
}

/// Setup wakelock to keep device awake during app usage
Future<void> _setupWakelock() async {
  await WakelockManager.initialize();
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
  Hive.registerAdapter(CentrePricingEntityAdapter());
  // Language & Location
  Hive.registerAdapter(LanguageEntityAdapter());
  Hive.registerAdapter(StateEntityAdapter());
  Hive.registerAdapter(CityEntityAdapter());
  Hive.registerAdapter(DistrictEntityAdapter());
  Hive.registerAdapter(CountryEntityAdapter());
  // Patient & Consultation
  Hive.registerAdapter(PatientEntityAdapter());
  Hive.registerAdapter(ConsultationEntityAdapter());
  Hive.registerAdapter(ConsultationPricingEntityAdapter());
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
  Hive.registerAdapter(LeadStatusAdapter());
  Hive.registerAdapter(TympTypeAdapter());
  // Audiologist
  Hive.registerAdapter(AudiologistEntityAdapter());
}

Future<void> _initDataSources() async {
  await di<UserEntityDataSource>().init();
  await di<CentreEntityDataSource>().init();
  await di<PatientEntityDataSource>().init();
  await di<ConsultationEntityDataSource>().init();
  await di<DeviceEntityDataSource>().init();
  await di<CountryEntityDataSource>().init();
  await di<StateEntityDataSource>().init();
  await di<CityEntityDataSource>().init();
  await di<DistrictEntityDataSource>().init();
  await di<LanguageEntityDataSource>().init();
}

/// Initialize lookup data asynchronously with error handling and timeout
Future<void> _initLookupDataAsync() async {
  try {
    developer.log(
      'Starting async lookup data initialization...',
      name: 'LookupData',
    );

    // Use timeout to prevent hanging during startup
    await Future.wait([
      di<LookupCubit>().getLanguages(),
      di<LookupCubit>().getCountries(),
    ]).timeout(
      const Duration(seconds: 15),
      onTimeout: () {
        developer.log(
          'Lookup data initialization timed out - app will continue',
          name: 'LookupData',
        );
        return [];
      },
    );

    developer.log('Lookup data initialization completed', name: 'LookupData');
  } catch (e) {
    developer.log(
      'Lookup data initialization failed: $e - app will continue',
      name: 'LookupData',
    );
  }
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> with WidgetsBindingObserver {
  bool _isInitializing = true;

  @override
  void initState() {
    super.initState();
    // Add app lifecycle observer for wakelock management
    WidgetsBinding.instance.addObserver(this);

    // Simulate initialization time for better UX
    _completeInitialization();
  }

  Future<void> _completeInitialization() async {
    // Reduced delay for faster startup - lookup data loads asynchronously
    await Future.delayed(const Duration(milliseconds: 300));

    if (mounted) {
      setState(() {
        _isInitializing = false;
      });
    }
  }

  @override
  void dispose() {
    // Clean up system UI observer to prevent memory leaks
    _cleanupSystemUIObserver();

    // Remove lifecycle observer and cleanup wakelock
    WidgetsBinding.instance.removeObserver(this);
    WakelockManager.cleanup();

    // Clean up session manager
    SessionManager.clearContext();

    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);

    switch (state) {
      case AppLifecycleState.resumed:
        // App is in foreground, enable wakelock
        WakelockManager.enable();
        // Force a device check on resume to resubscribe to USB stream if needed
        try {
          final deviceCubit = di<DeviceCubit>();
          deviceCubit.startDeviceMonitoring();
          deviceCubit.forceDeviceCheck();
        } catch (_) {}
        break;
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
      case AppLifecycleState.detached:
        // App is in background or being closed, disable wakelock to save battery
        WakelockManager.disable();
        break;
      case AppLifecycleState.hidden:
        // App is hidden but still running, keep wakelock enabled for this medical app
        WakelockManager.enable();
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isInitializing) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        home: const AppLoadingScreen(subtitle: "Initializing..."),
      );
    }

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
        BlocProvider<DeviceRegistrationCubit>(
          create: (context) => di.call<DeviceRegistrationCubit>(),
        ),
        BlocProvider<NetworkCubit>(
          create: (context) => di.call<NetworkCubit>(),
        ),
      ],
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: GetMaterialApp(
          key: ValueKey(_isInitializing),
          title: "EarKart Omni",
          debugShowCheckedModeBanner: false,
          theme: theme,
          navigatorKey: SessionManager.navigatorKey,
          initialRoute: RootScreen.routeName,
          onGenerateRoute: (settings) => generateRoute(settings),

          // Beautiful app configuration with full screen management
          builder: (context, child) {
            // Set up session manager context for global session handling
            SessionManager.setContext(context);

            return Overlay(
              initialEntries: [
                OverlayEntry(
                  builder:
                      (context) => AnnotatedRegion<SystemUiOverlayStyle>(
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
                            child: Stack(
                              children: [
                                // Main app content
                                child ?? const SizedBox.shrink(),

                                // Global network and wakelock status widgets overlay
                                Positioned(
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  child: SafeArea(
                                    child: Container(
                                      height: 60, // Match toolbar height
                                      alignment: Alignment.center,
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 16,
                                        ),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.min,
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            const WakelockStatusWidget(
                                              showTooltip: true,
                                            ),
                                            const SizedBox(width: 8),
                                            const NetworkStatusWidget(
                                              showDetails: false,
                                              showTooltips: true,
                                            ),
                                            const SizedBox(width: 8),
                                            Center(child: DeviceStatusWidget()),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                ),
              ],
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
      ),
    );
  }
}
