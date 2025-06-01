import 'package:earkart_omni/config/routes/router.dart';
import 'package:earkart_omni/config/theme/theme_manager.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/features/auth/presentation/pages/login_screen.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/user/user.entity.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/material.dart';
import 'package:get/route_manager.dart';
// import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:hive_flutter/hive_flutter.dart';

void main() async {
  await dotenv.load(fileName: ".env");
  WidgetsFlutterBinding.ensureInitialized;
  //locking device orientation
  SystemChrome.setPreferredOrientations([DeviceOrientation.landscapeLeft]);
  // FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);
  await setupDI();

  await Hive.initFlutter();
  Hive.registerAdapter(GenderAdapter());
  Hive.registerAdapter(RoleAdapter());
  Hive.registerAdapter(StatusAdapter());
  Hive.registerAdapter(UserEntityAdapter());
  Hive.registerAdapter(DeviceEntityAdapter());

  await UserEntityDataSource().init();

  runApp(
    GetMaterialApp(
      title: "EarKart Omni",
      debugShowCheckedModeBanner: false,
      theme: theme,
      initialRoute: LoginScreen.routeName,
      onGenerateRoute: (settings) => generateRoute(settings),
    ),
  );
  SystemChrome.setEnabledSystemUIMode(
    SystemUiMode.immersive,
    overlays: [SystemUiOverlay.top],
  );
  SystemChrome.setSystemUIOverlayStyle(
    SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.transparent,
    ),
  );
  // FlutterNativeSplash.remove();
}
