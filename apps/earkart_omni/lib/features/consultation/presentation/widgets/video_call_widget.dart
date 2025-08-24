import 'dart:async';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.state.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';

class VideoCallWidget extends StatefulWidget {
  final String channelName;
  final String consultationId;
  final VoidCallback? onLeaveChannel;

  const VideoCallWidget({
    Key? key,
    required this.channelName,
    required this.consultationId,
    this.onLeaveChannel,
  }) : super(key: key);

  @override
  State<VideoCallWidget> createState() => _VideoCallWidgetState();
}

class _VideoCallWidgetState extends State<VideoCallWidget>
    with WidgetsBindingObserver {
  bool _isDisposed = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    di<ILogger>().info(
      '[VIDEO_CALL] Initializing video call widget for consultation: ${widget.consultationId}',
    );
    di<ILogger>().info('[VIDEO_CALL] Channel name: ${widget.channelName}');
    _initializeVideoCall();
  }

  @override
  void didUpdateWidget(VideoCallWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Reset state if channel name changed
    if (oldWidget.channelName != widget.channelName) {
      di<ILogger>().info(
        '[VIDEO_CALL] Channel name changed from ${oldWidget.channelName} to ${widget.channelName}',
      );
      _initializeVideoCall();
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    di<ILogger>().info('[VIDEO_CALL] App lifecycle state changed to: $state');
    final agoraCubit = context.read<AgoraCubit>();
    agoraCubit.handleAppLifecycleState(state);
  }

  void _initializeVideoCall() {
    di<ILogger>().info(
      '[VIDEO_CALL] Initializing video call for channel: ${widget.channelName}',
    );
    di<ILogger>().info(
      '[VIDEO_CALL] Consultation ID: ${widget.consultationId}',
    );
    final agoraCubit = context.read<AgoraCubit>();
    agoraCubit.initializeVideoCall(widget.channelName);
  }

  // Public method to leave channel (without clearing data)
  Future<void> leaveChannelOnly() async {
    di<ILogger>().info(
      '[VIDEO_CALL] Leaving channel only (without clearing data)',
    );
    final agoraCubit = context.read<AgoraCubit>();
    await agoraCubit.leaveChannel();
    // Call the callback if provided
    widget.onLeaveChannel?.call();
  }

  // Method to explicitly end consultation and clear sessions
  Future<void> endConsultation() async {
    di<ILogger>().info(
      '[VIDEO_CALL] Ending consultation and clearing sessions',
    );
    final agoraCubit = context.read<AgoraCubit>();
    await agoraCubit.leaveChannel();
    di<ILogger>().info(
      '[VIDEO_CALL] Successfully ended video call consultation',
    );
    // Clear sessions when explicitly ending consultation
    context.read<PatientCubit>().deletePatientSession();
    context.read<ConsultationCubit>().deleteCurrentConsultationSession();
  }

  @override
  void dispose() {
    di<ILogger>().info('[VIDEO_CALL] VideoCallWidget dispose() called');
    _isDisposed = true;
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocListener(
      listeners: [
        BlocListener<ConsultationCubit, ConsultationState>(
          listener: (context, state) {
            di<ILogger>().debug(
              '[VIDEO_CALL] Consultation state changed: $state',
            );

            // Handle consultation update success
            if (state is ConsultationSuccess) {
              di<ILogger>().info(
                '[VIDEO_CALL] Consultation success - status: ${state.consultation.status}',
              );
              if (state.consultation.status == SessionStatus.completed) {
                di<ILogger>().info(
                  '[VIDEO_CALL] Consultation completed successfully',
                );
                // Show success message
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Consultation completed successfully'),
                    backgroundColor: Colors.green,
                    duration: Duration(seconds: 2),
                  ),
                );
                // The actual navigation will be handled by the consultation screen
              }
            }
            // Handle consultation update error
            if (state is ConsultationError) {
              di<ILogger>().error(
                '[VIDEO_CALL] Consultation error - ${state.message}',
              );
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Failed to end consultation: ${state.message}'),
                  backgroundColor: Colors.red,
                  duration: const Duration(seconds: 3),
                ),
              );
            }
          },
        ),
        BlocListener<AgoraCubit, AgoraState>(
          listener: (context, state) {
            di<ILogger>().debug('[VIDEO_CALL] Agora state changed: $state');

            state.maybeWhen(
              loading: () {
                di<ILogger>().info('[VIDEO_CALL] Agora loading state');
              },
              success: (
                agora,
                localUserJoined,
                remoteUid,
                isMicOn,
                isCameraOn,
                isScreenSharing,
              ) {
                di<ILogger>().info('[VIDEO_CALL] Agora success state');
                di<ILogger>().info(
                  '[VIDEO_CALL] Local user joined: $localUserJoined',
                );
                di<ILogger>().info('[VIDEO_CALL] Remote UID: $remoteUid');
                di<ILogger>().info(
                  '[VIDEO_CALL] Mic on: $isMicOn, Camera on: $isCameraOn',
                );
              },
              error: (message) {
                di<ILogger>().error('[VIDEO_CALL] Agora state error: $message');
                if (!mounted || _isDisposed) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(message),
                    backgroundColor: Colors.red,
                    duration: const Duration(seconds: 5),
                  ),
                );
              },
              orElse: () {},
            );
          },
        ),
      ],
      child: BlocBuilder<AgoraCubit, AgoraState>(
        builder: (context, state) {
          final agoraCubit = context.read<AgoraCubit>();
          di<ILogger>().debug('[VIDEO_CALL] Agora state changed: $state');

          return Scaffold(
            body: Stack(
              children: [
                Center(child: _remoteVideo(agoraCubit)),
                Align(
                  alignment: Alignment.topLeft,
                  child: Container(
                    width: 150,
                    height: 150,
                    margin: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(100),
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(100),
                      child: _localVideo(agoraCubit),
                    ),
                  ),
                ),
                Align(
                  alignment: Alignment.bottomCenter,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 25.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        RawMaterialButton(
                          onPressed: () {
                            di<ILogger>().info(
                              '[VIDEO_CALL] Toggling microphone',
                            );
                            agoraCubit.toggleMicrophone();
                          },
                          shape: const CircleBorder(),
                          padding: const EdgeInsets.all(12.0),
                          fillColor:
                              agoraCubit.isMicOn ? Colors.white : Colors.red,
                          child: Icon(
                            agoraCubit.isMicOn ? Icons.mic : Icons.mic_off,
                            color:
                                agoraCubit.isMicOn
                                    ? Colors.black
                                    : Colors.white,
                            size: 20.0,
                          ),
                        ),
                        RawMaterialButton(
                          onPressed: () async {
                            di<ILogger>().info(
                              '[VIDEO_CALL] End consultation button pressed',
                            );
                            // Show confirmation dialog
                            final shouldEndCall = await showDialog<bool>(
                              context: context,
                              barrierDismissible: false,
                              builder: (BuildContext context2) {
                                return AlertDialog(
                                  title: const Text('End Consultation'),
                                  content: const Text(
                                    'Are you sure you want to end this consultation? This action cannot be undone.',
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed:
                                          () =>
                                              Navigator.of(context2).pop(false),
                                      child: const Text('Cancel'),
                                    ),
                                    ElevatedButton(
                                      onPressed:
                                          () =>
                                              Navigator.of(context2).pop(true),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.red,
                                        foregroundColor: Colors.white,
                                      ),
                                      child: const Text('End Call'),
                                    ),
                                  ],
                                );
                              },
                            );

                            // If user confirmed, proceed with ending the call
                            if (shouldEndCall == true) {
                              di<ILogger>().info(
                                '[VIDEO_CALL] User confirmed ending consultation',
                              );
                              // Validate consultation ID before proceeding
                              if (widget.consultationId.isEmpty) {
                                di<ILogger>().error(
                                  '[VIDEO_CALL] Error: Consultation ID is empty',
                                );
                                if (!mounted || _isDisposed) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text(
                                      'Error: Consultation ID is missing. Cannot end consultation.',
                                    ),
                                    backgroundColor: Colors.red,
                                    duration: const Duration(seconds: 3),
                                  ),
                                );
                                return;
                              }

                              try {
                                di<ILogger>().info(
                                  '[VIDEO_CALL] Updating consultation with ID: ${widget.consultationId}',
                                );
                                // Update consultation status to completed
                                context
                                    .read<ConsultationCubit>()
                                    .updateConsultation(
                                      ConsultationEntity(
                                        id: widget.consultationId,
                                        status: SessionStatus.completed,
                                      ),
                                    );
                              } catch (e) {
                                di<ILogger>().error(
                                  '[VIDEO_CALL] Error ending consultation: $e',
                                );
                                if (!mounted || _isDisposed) return;
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      'Error ending consultation: ${e.toString()}',
                                    ),
                                    backgroundColor: Colors.red,
                                    duration: const Duration(seconds: 3),
                                  ),
                                );
                              }
                            }
                          },
                          shape: const CircleBorder(),
                          padding: const EdgeInsets.all(15.0),
                          fillColor: Colors.red,
                          child: const Icon(
                            Icons.call_end,
                            color: Colors.white,
                            size: 35.0,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _localVideo(AgoraCubit agoraCubit) {
    di<ILogger>().debug(
      '[VIDEO_CALL] Local video - joined: ${agoraCubit.localUserJoined}, engine: ${agoraCubit.engine != null}',
    );

    if (agoraCubit.localUserJoined && agoraCubit.engine != null) {
      di<ILogger>().debug('[VIDEO_CALL] Rendering local video view');
      return AgoraVideoView(
        controller: VideoViewController(
          rtcEngine: agoraCubit.engine!,
          canvas: const VideoCanvas(
            uid: 0,
            renderMode: RenderModeType.renderModeHidden,
          ),
        ),
      );
    } else {
      di<ILogger>().debug(
        '[VIDEO_CALL] Local video not ready, showing placeholder',
      );
      return Container(
        color: Colors.black54,
        child: Center(
          child: Container(
            padding: const EdgeInsets.all(15),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.person, size: 40, color: Colors.white54),
          ),
        ),
      );
    }
  }

  Widget _remoteVideo(AgoraCubit agoraCubit) {
    di<ILogger>().debug(
      '[VIDEO_CALL] Remote video - remoteUid: ${agoraCubit.remoteUid}, engine: ${agoraCubit.engine != null}',
    );

    if (agoraCubit.remoteUid != null && agoraCubit.engine != null) {
      di<ILogger>().debug(
        '[VIDEO_CALL] Rendering remote video view for UID: ${agoraCubit.remoteUid}',
      );
      return AgoraVideoView(
        controller: VideoViewController.remote(
          rtcEngine: agoraCubit.engine!,
          canvas: VideoCanvas(uid: agoraCubit.remoteUid),
          connection: RtcConnection(channelId: widget.channelName),
        ),
      );
    } else {
      di<ILogger>().debug(
        '[VIDEO_CALL] Remote video not ready, showing waiting screen',
      );
      return Container(
        color: Colors.black87,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.person,
                  size: 80,
                  color: Colors.white54,
                ),
              ),
              const SizedBox(height: 20),
              const Text(
                'Waiting for Audiologist to join...',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'The video will appear here once they join',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white38, fontSize: 14),
              ),
            ],
          ),
        ),
      );
    }
  }
}
