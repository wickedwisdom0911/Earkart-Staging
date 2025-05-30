import 'package:earkart_mdm/config/routes/router.dart';
import 'package:earkart_mdm/config/theme/theme_manager.dart';
import 'package:earkart_mdm/di.dart';
import 'package:earkart_mdm/features/device/data/source/local/device.entity.source.dart';
import 'package:earkart_mdm/features/device/presentation/pages/device.setup.screen.dart';
import 'package:earkart_mdm/models/centre/centre.entity.dart';
import 'package:earkart_mdm/models/device/device.entity.dart';
import 'package:earkart_mdm/models/enums.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/material.dart';
import 'package:get/route_manager.dart';
// import 'package:flutter_native_splash/flutter_native_splash.dart';
import 'package:hive_flutter/hive_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: ".env");
  //locking device orientation
  SystemChrome.setPreferredOrientations([DeviceOrientation.landscapeLeft]);
  // FlutterNativeSplash.preserve(widgetsBinding: widgetsBinding);
  await setupDI();

  await Hive.initFlutter();
  Hive.registerAdapter(StatusAdapter());
  Hive.registerAdapter(CentreEntityAdapter());
  Hive.registerAdapter(DeviceEntityAdapter());
  await di<DeviceEntityDataSource>().init();

  runApp(
    GetMaterialApp(
      title: "EarKart MDM",
      debugShowCheckedModeBanner: false,
      theme: theme,
      initialRoute: DeviceSetupScreen.routeName,
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
}
