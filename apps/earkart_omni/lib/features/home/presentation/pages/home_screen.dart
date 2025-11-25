import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.state.dart';
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
  }

  Future<void> _onRefresh() async {
    context.read<AuthCubit>().getCentre();
    context.read<AuthCubit>().getCentreData();
    context.read<ConsultationCubit>().getConsultationsByCentreId();
    await di<LookupCubit>().getLanguages();
    await di<LookupCubit>().getCountries();
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
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const ActionCardsSection(),
                  const SizedBox(height: 32),
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
