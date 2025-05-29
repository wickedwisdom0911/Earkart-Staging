import 'package:get/get.dart';

class Dimensions {
  //h=926.0 w= 428.0  13-pro max
  //h= 1280 w=752 Samsung Tabs
  static double screenHeight = Get.context!.height;
  static double screenWidth = Get.context!.width;

  //constant spaces
  static double width3 = screenWidth / 250.66;
  static double width5 = screenWidth / 150.4;
  static double width8 = screenWidth / 94;
  static double height5 = screenHeight / 256;
  static double height2 = screenHeight / 640;
  static double height3 = screenHeight / 426.66;
}
