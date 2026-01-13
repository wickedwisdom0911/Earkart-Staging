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
  bool _isInitialLoad = true;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  void _loadInitialData() {
    final authCubit = context.read<AuthCubit>();
    final lookupCubit = context.read<LookupCubit>();

    // Load centre data if not already loaded
    authCubit.getCentre();
    authCubit.getCentreData();

    // Preload essential lookup data (languages & countries) on screen initialization
    // This uses cache-first strategy: instant from cache, then background refresh
    unawaited(lookupCubit.preloadEssentialData());
  }

  Future<void> _onRefresh() async {
    final authCubit = context.read<AuthCubit>();
    final consultationCubit = context.read<ConsultationCubit>();
    final lookupCubit = di<LookupCubit>();

    // Refresh all data in parallel
    await Future.wait([
      Future(() async {
        authCubit.getCentre();
        authCubit.getCentreData();
      }),
      Future(() => consultationCubit.getConsultationsByCentreId(refresh: true)),
      lookupCubit.getLanguages(forceRefresh: true),
      lookupCubit.getCountries(forceRefresh: true),
    ]);
  }

  void _handleCentreLoaded() {
    // Only fetch consultations when centre is successfully loaded
    if (_isInitialLoad) {
      _isInitialLoad = false;
      context.read<ConsultationCubit>().getConsultationsByCentreId(refresh: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthCubit, AuthState>(
      listener: (context, state) {
        if (!mounted) return;

        if (state is AuthCentreSuccess) {
          _handleCentreLoaded();
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
                  _buildChatButton(),
                  const SizedBox(height: 18),
                  _buildConsultationsSection(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildChatButton() {
    // Use BlocBuilder to rebuild when unreadCount changes
    // The cubit emits unreadCountLoaded state when count changes
    return BlocBuilder<ChatCubit, ChatState>(
      buildWhen: (previous, current) {
        // Rebuild when unreadCountLoaded state is emitted
        return current.maybeWhen(
          unreadCountLoaded: (_) => true,
          orElse: () => false,
        );
      },
      builder: (context, _) {
        final unreadCount = context.read<ChatCubit>().unreadCount;

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
    );
  }

  Widget _buildConsultationsSection() {
    return LayoutBuilder(
      builder: (context, constraints) {
        // Use responsive height based on screen size
        final height = constraints.maxHeight > 600 ? 400.0 : 350.0;
        
        return SizedBox(
          height: height,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Expanded(child: RecentConsultationsSection()),
              const SizedBox(width: 24),
              const Expanded(child: UpcomingAppointmentsSection()),
            ],
          ),
        );
      },
    );
  }
}
