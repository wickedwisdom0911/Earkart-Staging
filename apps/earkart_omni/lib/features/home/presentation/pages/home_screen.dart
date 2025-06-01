import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
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
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: Builder(
          builder: (context) {
            return BlocBuilder<AuthCubit, AuthState>(
              builder: (context, state) {
                if (state is AuthError) {
                  return Text(state.message);
                }
                if (state is AuthCentreSuccess) {
                  return Text(state.centre.user?.name ?? "Centre Dashboard");
                }
                return Text("Centre Dashboard");
              },
            );
          },
        ),
      ),
      body: Column(children: [Text("Home")]),
    );
  }
}
