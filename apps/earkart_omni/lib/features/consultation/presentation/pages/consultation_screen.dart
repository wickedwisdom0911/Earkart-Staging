// ignore_for_file: unnecessary_null_comparison
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.state.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:earkart_omni/features/consultation/presentation/widgets/video_call_widget.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/consultation/consultation.model.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class ConsultationScreen extends StatefulWidget {
  static const routeName = '/consultation';
  const ConsultationScreen({super.key});

  @override
  State<ConsultationScreen> createState() => _ConsultationScreenState();
}

class _ConsultationScreenState extends State<ConsultationScreen> {
  late IO.Socket socket;
  bool _isSocketInitialized = false;
  bool _isInitialized = false;
  ConsultationEntity? consultation;

  @override
  void initState() {
    super.initState();
    context.read<ConsultationCubit>().getCurrentConsultation();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_isInitialized) {
      context.read<AuthCubit>().getCurrentUser();
      _isInitialized = true;
    }
  }

  @override
  void dispose() {
    if (_isSocketInitialized) {
      socket.disconnect();
      socket.dispose();
    }
    super.dispose();
  }

  void _setupSocket(String token) {
    try {
      socket = IO.io(Constants.socketUrl, <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': true,
        'auth': {'token': token},
      });

      socket.onConnect((_) {
        di<ILogger>().debug('Socket connected successfully');
        setState(() => _isSocketInitialized = true);
      });

      socket.onDisconnect((_) {
        di<ILogger>().debug('Socket disconnected');
        setState(() => _isSocketInitialized = false);
      });

      socket.onError((error) {
        di<ILogger>().error('Socket error: $error');
      });

      socket.onConnectError((error) {
        di<ILogger>().error('Socket connection error: $error');
      });
      socket.on("user_joined", (data) {
        if (data == null) {
          di<ILogger>().debug('Received null data in user_joined event');
          return;
        }
        if (data['user'] != null) {
          final consultationData = ConsultationModelData.fromJson(data['user']);
          if (consultationData != null) {
            setState(() {
              consultation = consultationData;
            });
          } else {
            di<ILogger>().error('Failed to parse consultation data');
          }
        }
      });
      socket.on("start-test", (data) {
        di<ILogger>().debug('Start test: $data');
      });
      socket.on("user_left", (data) {
        di<ILogger>().debug('User left: $data');
      });
    } catch (e) {
      di<ILogger>().error('Error setting up socket: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          consultation?.audiologist?.user?.name != null
              ? "Consultation by ${consultation!.audiologist!.user!.name}"
              : "Consultation by Earkart",
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      body: MultiBlocListener(
        listeners: [
          BlocListener<AuthCubit, AuthState>(
            listener: (context, state) {
              state.when(
                initial: () {
                  di<ILogger>().debug('Auth state: initial');
                  context.read<AuthCubit>().getCurrentUser();
                },
                loading: () {
                  di<ILogger>().debug('Auth state: loading');
                },
                success: (user) {
                  di<ILogger>().debug(
                    'Auth state: success - User: ${user?.email}',
                  );
                  if (user?.token != null) {
                    _setupSocket(user!.token!);
                  } else {
                    di<ILogger>().error('User token is null in success state');
                  }
                },
                centreSuccess: (centre) {
                  di<ILogger>().debug('Auth state: centre success');
                },
                centreError: (error) {
                  di<ILogger>().error('Auth state: centre error - $error');
                },
                error: (error) {
                  di<ILogger>().error('Auth state: error - $error');
                },
              );
            },
          ),
        ],
        child: BlocBuilder<ConsultationCubit, ConsultationState>(
          builder: (context, state) {
            if (state is CurrentConsultationSuccess) {
              consultation = state.consultation;
              if (socket.connected) {
                socket.emit("join_consultation", {
                  "consultationId": consultation?.id,
                });
              }
              return VideoCallWidget(channelName: state.consultation.id ?? "");
            }
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Loading consultation...'),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
