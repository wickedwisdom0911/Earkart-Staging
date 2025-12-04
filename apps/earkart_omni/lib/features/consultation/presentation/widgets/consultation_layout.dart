import 'package:earkart_omni/config/release_config.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/video_call_widget.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/uvc_camera_widget.dart';
import 'package:flutter/material.dart';

class ConsultationLayout extends StatelessWidget {
  final VideoCallWidget videoWidget;
  final bool showCamera;
  final String? consultationId;
  final Function(bool)? onCameraStateChanged;

  const ConsultationLayout({
    super.key,
    required this.videoWidget,
    required this.showCamera,
    this.consultationId,
    this.onCameraStateChanged,
  });

  @override
  Widget build(BuildContext context) {
    if (showCamera) {
      // Split screen: video call on left, camera on right
      return Row(
        children: [
          // Left half - Video call
          Expanded(
            flex: 1,
            child: Container(
              decoration: BoxDecoration(
                border: Border(
                  right: BorderSide(
                    color: Colors.grey[300]!,
                    width: 1,
                  ),
                ),
              ),
              child: videoWidget,
            ),
          ),
          Expanded(
            flex: 1,
            child: ReleaseConfig.enableUVCCamera
                ? UVCCameraWidget(
                    consultationId: consultationId ?? "",
                    onCameraStateChanged: onCameraStateChanged,
                  )
                : Container(
                    decoration: const BoxDecoration(
                      color: Colors.black87,
                    ),
                    child: const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.videocam_off,
                            color: Colors.orange,
                            size: 32,
                          ),
                          SizedBox(height: 12),
                          Text(
                            'Camera disabled in release mode',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
          ),
        ],
      );
    } else {
      // Full screen video call
      return videoWidget;
    }
  }
}

