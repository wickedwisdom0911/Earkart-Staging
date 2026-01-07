import 'dart:async';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.state.dart';
import 'package:earkart_omni/features/chat/presentation/cubit/chat.cubit.dart';
import 'package:earkart_omni/features/chat/presentation/cubit/chat.state.dart';
import 'package:earkart_omni/features/chat/presentation/pages/chat_with_audiologists_screen.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.cubit.dart';
import 'package:earkart_omni/features/lookup/presentation/cubit/lookup.cubit.dart';
import 'package:earkart_omni/features/home/presentation/widgets/widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  static const routeName = "/home";
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();

    context.read<AuthCubit>().getCentre();
    context.read<AuthCubit>().getCentreData();

    // Preload essential lookup data (languages & countries) on screen initialization
    // This uses cache-first strategy: instant from cache, then background refresh
    unawaited(context.read<LookupCubit>().preloadEssentialData());
  }

  Future<void> _onRefresh() async {
    context.read<AuthCubit>().getCentre();
    context.read<AuthCubit>().getCentreData();
    context.read<ConsultationCubit>().getConsultationsByCentreId();

    // Force refresh lookup data on pull-to-refresh
    await Future.wait([
      di<LookupCubit>().getLanguages(forceRefresh: true),
      di<LookupCubit>().getCountries(forceRefresh: true),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthCubit, AuthState>(
      listener: (context, state) {
        if (!mounted) return;

        if (state is AuthCentreSuccess) {
          context.read<ConsultationCubit>().getConsultationsByCentreId();
        } else if (state is AuthError || state is AuthCentreError) {
          if (state is AuthError) {
          } else if (state is AuthCentreError) {}
        }
      },
      child: Scaffold(
        appBar: const HomeAppBar(),
        body: RefreshIndicator(
          onRefresh: _onRefresh,
          color: Colors.blue,
          backgroundColor: Colors.white,
          strokeWidth: 2.5,
          displacement: 40,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const ActionCardsSection(),
                  const SizedBox(height: 20),
                  BlocBuilder<ChatCubit, ChatState>(
                    builder: (context, state) {
                      final chatCubit = context.read<ChatCubit>();
                      final unreadCount = chatCubit.unreadCount;

                      return Stack(
                        clipBehavior: Clip.none,
                        children: [
                          OutlinedButton.icon(
                            onPressed: () {
                              Navigator.pushNamed(
                                context,
                                ChatWithAudiologistsScreen.routeName,
                              );
                            },
                            icon: const Icon(Icons.chat_bubble_outline),
                            label: const Text('Chat with Audiologists'),
                            style: OutlinedButton.styleFrom(
                              side: BorderSide(
                                color: Colors.grey.withAlpha(90),
                                width: 1,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              foregroundColor: Constants.primaryColor,
                              minimumSize: const Size(double.infinity, 48),
                            ),
                          ),
                          if (unreadCount > 0)
                            Positioned(
                              right: 8,
                              top: -4,
                              child: Container(
                                padding: const EdgeInsets.all(4),
                                decoration: const BoxDecoration(
                                  color: Colors.red,
                                  shape: BoxShape.circle,
                                ),
                                constraints: const BoxConstraints(
                                  minWidth: 20,
                                  minHeight: 20,
                                ),
                                child: Center(
                                  child: Text(
                                    unreadCount > 99 ? '99+' : '$unreadCount',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 18),

                  SizedBox(
                    height: 400,
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Expanded(child: RecentConsultationsSection()),
                        const SizedBox(width: 24),
                        const Expanded(child: UpcomingAppointmentsSection()),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
