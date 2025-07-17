import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_uvc_camera/flutter_uvc_camera.dart';
import 'dart:async';

class UVCCameraView extends StatefulWidget {
  final UVCCameraController cameraController;
  final double width;
  final double height;
  final UVCCameraViewParamsEntity? params;
  const UVCCameraView(
      {super.key,
      required this.cameraController,
      required this.width,
      required this.height,
      this.params});

  @override
  State<UVCCameraView> createState() => _UVCCameraViewState();
}

class _UVCCameraViewState extends State<UVCCameraView> {
  bool _isPlatformViewCreated = false;
  Timer? _initializationTimer;

  @override
  void initState() {
    super.initState();
    // Add a small delay to ensure the widget is fully mounted
    _initializationTimer = Timer(const Duration(milliseconds: 100), () {
      if (mounted) {
        setState(() {
          _isPlatformViewCreated = true;
        });
      }
    });
  }

  @override
  void dispose() {
    _initializationTimer?.cancel();
    // Add delay before disposing to ensure proper cleanup
    Future.delayed(const Duration(milliseconds: 200), () {
      widget.cameraController.closeCamera();
      widget.cameraController.dispose();
    });
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isPlatformViewCreated) {
      return SizedBox(
        width: widget.width,
        height: widget.height,
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return SizedBox(
      width: widget.width,
      height: widget.height,
      child: AndroidView(
          viewType: 'uvc_camera_view',
          creationParams: widget.params?.toMap(),
          creationParamsCodec: const StandardMessageCodec(),
          onPlatformViewCreated: (id) {
            // Add delay before initializing to ensure platform view is fully created
            Future.delayed(const Duration(milliseconds: 500), () {
              if (mounted) {
                widget.cameraController.initializeCamera();
              }
            });
          }),
    );
  }
}
