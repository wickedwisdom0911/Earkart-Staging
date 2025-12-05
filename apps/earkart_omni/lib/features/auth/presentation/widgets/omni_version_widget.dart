import 'package:earkart_omni/config/utils/constants.dart';
import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';

class OmniVersionWidget extends StatefulWidget {
  const OmniVersionWidget({super.key});

  @override
  State<OmniVersionWidget> createState() => _OmniVersionWidgetState();
}

class _OmniVersionWidgetState extends State<OmniVersionWidget> {
  String _version = '';

  @override
  void initState() {
    super.initState();
    _fetchVersion();
  }

  Future<void> _fetchVersion() async {
    try {
      final info = await PackageInfo.fromPlatform();
      if (mounted) {
        setState(() {
          _version = info.version;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _version = '2.0.1'; // fallback
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final versionText = _version.isNotEmpty ? _version : '2.0.1';
    return Text(
      'Earkart Omni | V$versionText',
      style: const TextStyle(
        fontSize: 14,
        color: Constants.secondaryColor,
        fontWeight: FontWeight.w600,
      ),
      textAlign: TextAlign.center,
    );
  }
}
