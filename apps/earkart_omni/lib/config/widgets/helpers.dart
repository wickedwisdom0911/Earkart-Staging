import 'dart:math';

import 'package:earkart_omni/config/utils/dimensions.dart';
import 'package:flutter/material.dart';
import 'package:logger/logger.dart';
import 'package:url_launcher/url_launcher.dart';

Widget addVerticalSpace(double height) {
  return SizedBox(height: height);
}

Widget addHorizontalSpace(double width) {
  return SizedBox(width: width);
}

bool validateMobile(String value) {
  String pattern = r'(^(?:[+0]9)?[0-9]{10,20}$)';
  RegExp regExp = RegExp(pattern);
  if (value.isEmpty) {
    return false;
  } else if (!regExp.hasMatch(value)) {
    return false;
  }
  return true;
}

Widget buttonLoading() {
  return SizedBox(
    width: Dimensions.width5 * 6,
    height: Dimensions.height5 * 6,
    child: const Center(
      child: CircularProgressIndicator.adaptive(
        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
      ),
    ),
  );
}

launchURL(String url, {bool? inApp}) async {
  Uri uri = Uri.parse("");
  Logger logger = Logger();
  if (url.startsWith("https://") ||
      url.startsWith("http://") ||
      url.startsWith("tel:") ||
      url.startsWith("sms:") ||
      url.startsWith("wa:") ||
      url.startsWith("tg:") ||
      url.startsWith("mailto:") ||
      url.startsWith("whatsapp")) {
    uri = Uri.parse(url);
  } else {
    uri = Uri.parse("https://$url");
  }
  if (await canLaunchUrl(uri)) {
    logger.i("launched $uri");

    if (inApp == null) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      await launchUrl(
        uri,
        mode: LaunchMode.inAppWebView,
        webOnlyWindowName: "Digrowfa",
      );
    }
  } else {
    logger.e("cant launch $uri");
  }
}

String transformMilliSeconds(int milliseconds) {
  int hundreds = (milliseconds / 10).truncate();
  int seconds = (hundreds / 100).truncate();
  int minutes = (seconds / 60).truncate();
  int hours = (minutes / 60).truncate();
  String hoursStr = (hours % 60).toString().padLeft(2, '0');
  String minutesStr = (minutes % 60).toString().padLeft(2, '0');
  String secondsStr = (seconds % 60).toString().padLeft(2, '0');
  return "$hoursStr:$minutesStr:$secondsStr";
}

String getFileSizeString({required int bytes, int decimals = 0}) {
  const suffixes = ["b", "kb", "mb", "gb", "tb"];
  if (bytes == 0) return '0${suffixes[0]}';
  var i = (log(bytes) / log(1024)).floor();
  return ((bytes / pow(1024, i)).toStringAsFixed(decimals)) + suffixes[i];
}
