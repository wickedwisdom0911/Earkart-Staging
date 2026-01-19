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

class VideoCallController {
  _VideoCallWidgetState? _state;

  void _attach(_VideoCallWidgetState state) {
    _state = state;
  }

  void _detach(_VideoCallWidgetState state) {
    if (identical(_state, state)) {
      _state = null;
    }
  }

  Future<void> leaveChannelOnly() async {
    await _state?.leaveChannelOnly();
  }

  Future<void> endConsultation() async {
    await _state?.endConsultation();
  }
}

class VideoCallWidget extends StatefulWidget {
  final String channelName;
  final String consultationId;
  final VoidCallback? onLeaveChannel;
  final Future<void> Function()? onEndCall;
  final VideoCallController? controller;

  const VideoCallWidget({
    Key? key,
    required this.channelName,
    required this.consultationId,
    this.onLeaveChannel,
    this.onEndCall,
    this.controller,
  }) : super(key: key);

  @override
  State<VideoCallWidget> createState() => _VideoCallWidgetState();
}

class _VideoCallWidgetState extends State<VideoCallWidget>
    with WidgetsBindingObserver {
  bool _isDisposed = false;
  late final AgoraCubit _agoraCubit;
  late final ValueNotifier<bool> _isMicOnNotifier;
  int _videoSetupVersion = 0; // Increment on rejoin to force video view rebuild
  int? _lastRemoteUid; // Track remote UID changes
  bool _wasLocalUserJoined = false; // Track local user join state changes
  bool _isOtoscopyActive =
      false; // Track otoscopy state to prevent unnecessary rebuilds

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Attach controller if provided
    widget.controller?._attach(this);
    // Cache cubit reference to avoid context lookups during dispose
    _agoraCubit = context.read<AgoraCubit>();
    _isMicOnNotifier = ValueNotifier<bool>(_agoraCubit.isMicOn);
    di<ILogger>().info(
      '[VIDEO_CALL] Initializing video call widget for consultation: ${widget.consultationId}',
    );
    di<ILogger>().info('[VIDEO_CALL] Channel name: ${widget.channelName}');
    _initializeVideoCall();
  }

  @override
  void didUpdateWidget(VideoCallWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Reattach controller if changed
    if (oldWidget.controller != widget.controller) {
      oldWidget.controller?._detach(this);
      widget.controller?._attach(this);
    }
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
    _agoraCubit.handleAppLifecycleState(state);
  }

  void _initializeVideoCall() {
    di<ILogger>().info(
      '[VIDEO_CALL] Initializing video call for channel: ${widget.channelName}',
    );
    di<ILogger>().info(
      '[VIDEO_CALL] Consultation ID: ${widget.consultationId}',
    );
    _agoraCubit.initializeVideoCall(widget.channelName);
  }

  // Public method to leave channel (without clearing data)
  Future<void> leaveChannelOnly() async {
    di<ILogger>().info(
      '[VIDEO_CALL] Leaving channel only (without clearing data)',
    );
    await _agoraCubit.leaveChannel();
    // Call the callback if provided
    widget.onLeaveChannel?.call();
  }

  // Method to explicitly end consultation and clear sessions
  Future<void> endConsultation() async {
    di<ILogger>().info(
      '[VIDEO_CALL] Ending consultation and clearing sessions',
    );
    await _agoraCubit.leaveChannel();
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
    try {
      // Detach controller
      widget.controller?._detach(this);
      // Avoid leaving the Agora channel here to prevent racing with
      // a new widget initialization for the next consultation.
      // Channel teardown is handled explicitly on end-call/completion flows.
      _agoraCubit.stopTokenRenewalMonitoring();
      _isMicOnNotifier.dispose();
    } catch (e) {
      di<ILogger>().error('[VIDEO_CALL] Error during dispose cleanup: $e');
    }
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
                if (!mounted || _isDisposed) return;
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
              if (!mounted || _isDisposed) return;
              if (state.message != 'No consultation found') {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      'Failed to end consultation: ${state.message}',
                    ),
                    backgroundColor: Colors.red,
                    duration: const Duration(seconds: 3),
                  ),
                );
              }
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

                if (!_isDisposed && _isMicOnNotifier.value != isMicOn) {
                  _isMicOnNotifier.value = isMicOn;
                }

                // Increment video setup version when:
                // 1. Remote UID changes (new user joins or different user)
                // 2. Local user rejoins (was not joined, now joined) with remote user present
                // IMPORTANT: Do NOT increment during otoscopy operations to prevent video disconnection
                // The video view should remain stable during otoscopy start/stop
                if (localUserJoined && remoteUid != null) {
                  final remoteUidChanged = _lastRemoteUid != remoteUid;
                  final localUserRejoined =
                      !_wasLocalUserJoined && localUserJoined;

                  // Track otoscopy state from AgoraCubit to prevent rebuilds during UVC operations
                  _isOtoscopyActive = _agoraCubit.isUVCJoined;

                  // CRITICAL: Never update video views during otoscopy to prevent freezing and jank
                  // The video views must remain completely stable when UVC camera is initializing
                  // This prevents the "Skipped 30 frames" issue during camera opening
                  if (_isOtoscopyActive) {
                    // Skip all video view updates during otoscopy - keep everything stable
                    return;
                  }

                  // Only update if remoteUid actually changed or local user rejoined
                  if (remoteUidChanged || localUserRejoined) {
                    di<ILogger>().info(
                      '[VIDEO_CALL] Video setup trigger - remoteUidChanged: $remoteUidChanged, localUserRejoined: $localUserRejoined',
                    );
                    _videoSetupVersion++;
                    _lastRemoteUid = remoteUid;
                    // Force rebuild to update video view with new key
                    // Use post-frame callback to avoid blocking current frame
                    if (mounted && !_isDisposed) {
                      WidgetsBinding.instance.addPostFrameCallback((_) {
                        if (mounted && !_isDisposed && !_isOtoscopyActive) {
                          setState(() {});
                        }
                      });
                    }
                  }
                  // If remoteUid hasn't changed or otoscopy is active, don't increment version - keep video stable
                } else if (!localUserJoined && _lastRemoteUid != null) {
                  // Reset when local user leaves to ensure fresh setup on rejoin
                  _lastRemoteUid = null;
                }

                // Track local user join state
                _wasLocalUserJoined = localUserJoined;
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
        buildWhen: (previous, current) {
          // Update otoscopy state from current state
          final isOtoscopyActiveNow = _agoraCubit.isUVCJoined;

          // CRITICAL: Never rebuild during otoscopy initialization/opening to prevent video freezing
          // This prevents jank when camera is initializing
          // Only rebuild if otoscopy just completed (was active, now inactive)
          if (_isOtoscopyActive && !isOtoscopyActiveNow) {
            // Otoscopy just stopped - allow rebuild to restore normal state
            _isOtoscopyActive = false;
            return true;
          }

          // If otoscopy is active or becoming active, prevent ALL rebuilds
          // This keeps video stable during camera initialization which can take several seconds
          if (isOtoscopyActiveNow) {
            _isOtoscopyActive = true;
            return false; // Prevent rebuild to keep video stable and prevent jank
          }

          // For non-otoscopy states, check if important video state changed
          // Only rebuild if remote UID or local join state actually changed
          // This minimizes rebuilds and improves performance
          final prevRemoteUid = previous.maybeWhen(
            success: (_, __, remoteUid, ___, ____, _____) => remoteUid,
            orElse: () => null,
          );
          final currRemoteUid = current.maybeWhen(
            success: (_, __, remoteUid, ___, ____, _____) => remoteUid,
            orElse: () => null,
          );

          final prevLocalJoined = previous.maybeWhen(
            success: (_, localJoined, __, ___, ____, _____) => localJoined,
            orElse: () => false,
          );
          final currLocalJoined = current.maybeWhen(
            success: (_, localJoined, __, ___, ____, _____) => localJoined,
            orElse: () => false,
          );

          // Only rebuild if remote UID or local join state changed
          // Ignore other state changes (mic, camera toggle, etc.) to reduce rebuilds
          return prevRemoteUid != currRemoteUid ||
              prevLocalJoined != currLocalJoined;
        },
        builder: (context, state) {
          final agoraCubit = _agoraCubit;
          // Update otoscopy state
          _isOtoscopyActive = agoraCubit.isUVCJoined;
          // Reduce logging frequency - only log important state changes
          // di<ILogger>().debug('[VIDEO_CALL] Agora state changed: $state');

          return Scaffold(
            body: Stack(
              children: [
                // Remote video - full screen background
                // Wrap in RepaintBoundary to isolate video rendering from other UI updates
                // Use IgnorePointer during otoscopy to prevent interaction interference
                IgnorePointer(
                  ignoring: _isOtoscopyActive,
                  child: RepaintBoundary(child: _remoteVideo(agoraCubit)),
                ),
                // Local video - small overlay in top-left corner
                // Wrap in RepaintBoundary to isolate video rendering
                IgnorePointer(
                  ignoring: _isOtoscopyActive,
                  child: RepaintBoundary(
                    child: Align(
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
                  ),
                ),
                Align(
                  alignment: Alignment.bottomCenter,
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 25.0),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ValueListenableBuilder<bool>(
                          valueListenable: _isMicOnNotifier,
                          builder: (context, isMicOn, _) {
                            return TextButton.icon(
                              onPressed: () {
                                di<ILogger>().info(
                                  '[VIDEO_CALL] Toggling microphone',
                                );
                                agoraCubit.toggleMicrophone();
                              },
                              icon: Icon(
                                isMicOn ? Icons.mic : Icons.mic_off,
                                size: 20.0,
                                color: isMicOn ? Colors.black87 : Colors.white,
                              ),
                              label: Text(
                                isMicOn ? 'Mute' : 'Unmute',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color:
                                      isMicOn ? Colors.black87 : Colors.white,
                                ),
                              ),
                              style: TextButton.styleFrom(
                                backgroundColor:
                                    isMicOn
                                        ? Colors.white.withAlpha(250)
                                        : Colors.red.withAlpha(250),
                                foregroundColor:
                                    isMicOn ? Colors.black87 : Colors.white,
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 12,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  side: BorderSide(
                                    color:
                                        isMicOn
                                            ? Colors.white.withAlpha(128)
                                            : Colors.red.withAlpha(128),
                                    width: 1,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                        const SizedBox(width: 16),
                        TextButton.icon(
                          onPressed: () async {
                            di<ILogger>().info(
                              '[VIDEO_CALL] End consultation button pressed',
                            );
                            // Show beautiful minimal confirmation dialog
                            final shouldEndCall = await showDialog<bool>(
                              context: context,
                              barrierDismissible: true,
                              barrierColor: Colors.black54,
                              builder: (BuildContext context2) {
                                return Dialog(
                                  backgroundColor: Colors.transparent,
                                  elevation: 0,
                                  child: Container(
                                    padding: const EdgeInsets.all(24),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        // Icon
                                        Container(
                                          width: 64,
                                          height: 64,
                                          decoration: BoxDecoration(
                                            color: Colors.red.shade50,
                                            shape: BoxShape.circle,
                                          ),
                                          child: Icon(
                                            Icons.phone_disabled_rounded,
                                            size: 32,
                                            color: Colors.red.shade600,
                                          ),
                                        ),
                                        const SizedBox(height: 20),

                                        // Title
                                        const Text(
                                          'End Consultation',
                                          style: TextStyle(
                                            fontSize: 20,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.black87,
                                          ),
                                        ),
                                        const SizedBox(height: 12),

                                        // Message
                                        Text(
                                          'Are you sure you want to end this consultation?',
                                          style: TextStyle(
                                            fontSize: 14,
                                            color: Colors.grey.shade700,
                                            height: 1.5,
                                          ),
                                          textAlign: TextAlign.center,
                                        ),
                                        const SizedBox(height: 24),

                                        // Buttons
                                        Row(
                                          children: [
                                            Expanded(
                                              child: TextButton(
                                                onPressed:
                                                    () => Navigator.of(
                                                      context2,
                                                    ).pop(false),
                                                style: TextButton.styleFrom(
                                                  padding:
                                                      const EdgeInsets.symmetric(
                                                        vertical: 12,
                                                      ),
                                                  shape: RoundedRectangleBorder(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          10,
                                                        ),
                                                  ),
                                                ),
                                                child: const Text(
                                                  'Cancel',
                                                  style: TextStyle(
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                              ),
                                            ),
                                            const SizedBox(width: 12),
                                            Expanded(
                                              child: ElevatedButton(
                                                onPressed:
                                                    () => Navigator.of(
                                                      context2,
                                                    ).pop(true),
                                                style: ElevatedButton.styleFrom(
                                                  backgroundColor:
                                                      Colors.red.shade600,
                                                  foregroundColor: Colors.white,
                                                  padding:
                                                      const EdgeInsets.symmetric(
                                                        vertical: 12,
                                                      ),
                                                  shape: RoundedRectangleBorder(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          10,
                                                        ),
                                                  ),
                                                  elevation: 0,
                                                ),
                                                child: const Text(
                                                  'End Call',
                                                  style: TextStyle(
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
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
                                // If parent provided an end-call handler, delegate to it
                                if (widget.onEndCall != null) {
                                  await widget.onEndCall!.call();
                                } else {
                                  // Fallback: Update consultation status to completed
                                  context
                                      .read<ConsultationCubit>()
                                      .updateConsultation(
                                        ConsultationEntity(
                                          id: widget.consultationId,
                                          status: SessionStatus.completed,
                                        ),
                                      );
                                }
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
                          icon: const Icon(
                            Icons.call_end,
                            size: 20.0,
                            color: Colors.white,
                          ),
                          label: Text(
                            'End Call',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: Colors.white,
                            ),
                          ),
                          style: TextButton.styleFrom(
                            foregroundColor: Colors.white,
                            backgroundColor: Colors.red.shade600.withOpacity(
                              0.9,
                            ),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 12,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                              side: BorderSide(
                                color: Colors.red.shade700.withOpacity(0.8),
                                width: 1,
                              ),
                            ),
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
    // Reduced logging - only log when state actually changes
    // di<ILogger>().debug(
    //   '[VIDEO_CALL] Local video - joined: ${agoraCubit.localUserJoined}, engine: ${agoraCubit.engine != null}',
    // );

    if (agoraCubit.localUserJoined && agoraCubit.engine != null) {
      // di<ILogger>().debug('[VIDEO_CALL] Rendering local video view');
      final channelForRender =
          agoraCubit.joinedChannelName ?? widget.channelName;
      // Use stable key that doesn't change during otoscopy to prevent rebuilds
      // Only include version if otoscopy is not active
      final keySuffix = _isOtoscopyActive ? 'stable' : 'v$_videoSetupVersion';
      return AgoraVideoView(
        key: ValueKey('local-$channelForRender-$keySuffix'),
        controller: VideoViewController(
          rtcEngine: agoraCubit.engine!,
          canvas: const VideoCanvas(
            uid: 0,
            renderMode: RenderModeType.renderModeHidden,
          ),
        ),
      );
    } else {
      // di<ILogger>().debug(
      //   '[VIDEO_CALL] Local video not ready, showing placeholder',
      // );
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
    // Reduced logging - only log when state actually changes
    // di<ILogger>().debug(
    //   '[VIDEO_CALL] Remote video - remoteUid: ${agoraCubit.remoteUid}, engine: ${agoraCubit.engine != null}, localJoined: ${agoraCubit.localUserJoined}',
    // );

    // Ensure both engine is initialized AND local user has joined before rendering remote video
    // This prevents white screen when remote user joins before local user
    // NOTE: remoteUid is already filtered to exclude our own UVC user (handled in AgoraCubit)
    // So we can safely render any remoteUid that is set here
    if (agoraCubit.remoteUid != null &&
        agoraCubit.engine != null &&
        agoraCubit.localUserJoined) {
      // di<ILogger>().debug(
      //   '[VIDEO_CALL] Rendering remote video view for UID: ${agoraCubit.remoteUid}',
      // );
      final channelForRender =
          agoraCubit.joinedChannelName ?? widget.channelName;

      // CRITICAL: Use main connection explicitly to ensure we're rendering from the correct connection
      // This prevents issues when UVC connection is also active in the same channel
      // The main connection must be used to ensure remote user video stays connected during otoscopy
      final connectionForRender =
          agoraCubit.mainConnection ??
          RtcConnection(channelId: channelForRender);

      // di<ILogger>().debug(
      //   '[VIDEO_CALL] Using connection for remote video: channelId=${connectionForRender.channelId}, localUid=${connectionForRender.localUid}',
      // );

      // Use a unique key that includes video setup version to force rebuild on rejoin/refresh
      // CRITICAL: Key only changes when version changes, preventing unnecessary rebuilds during otoscopy
      // Use stable key during otoscopy to prevent video freezing
      final keySuffix = _isOtoscopyActive ? 'stable' : 'v$_videoSetupVersion';
      final uniqueKey =
          'remote-$channelForRender-${agoraCubit.remoteUid}-$keySuffix';

      return AgoraVideoView(
        key: ValueKey(uniqueKey),
        controller: VideoViewController.remote(
          rtcEngine: agoraCubit.engine!,
          canvas: VideoCanvas(
            uid: agoraCubit.remoteUid,
            renderMode:
                RenderModeType
                    .renderModeHidden, // Fill screen completely maintaining aspect ratio
          ),
          connection: connectionForRender,
        ),
      );
    } else {
      // di<ILogger>().debug(
      //   '[VIDEO_CALL] Remote video not ready - remoteUid: ${agoraCubit.remoteUid}, engine: ${agoraCubit.engine != null}, localJoined: ${agoraCubit.localUserJoined}',
      // );
      return Container(
        width: double.infinity,
        height: double.infinity,
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
              Text(
                agoraCubit.localUserJoined
                    ? 'Waiting for remote user video...'
                    : 'Waiting for connection...',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'The video will appear here once ready',
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
