import 'package:earkart_omni/config/utils/assets.dart';
import 'package:earkart_omni/config/widgets/custom_text_field.dart';
import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/config/widgets/gradient_button.dart';
import 'package:earkart_omni/config/widgets/helpers.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/text_styles.dart';
import 'package:earkart_omni/config/utils/dimensions.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.state.dart';
import 'package:earkart_omni/features/auth/presentation/widgets/forgot_password_dialog.dart';
import 'package:earkart_omni/features/auth/presentation/widgets/omni_version_widget.dart';
import 'package:earkart_omni/features/auth/presentation/widgets/wipe_data_dialog.dart';
import 'package:earkart_omni/features/home/presentation/pages/home_screen.dart';
import 'package:figma_squircle/figma_squircle.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:fluttertoast/fluttertoast.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  static const routeName = "/login";

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  int _logoTapCount = 0;
  DateTime? _lastTapTime;

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _onLogin() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      Fluttertoast.showToast(msg: "Please enter email and password");
      return;
    }
    context.read<AuthCubit>().login(
      _emailController.text,
      _passwordController.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    // Detect keyboard visibility

    return Scaffold(
      appBar: const GlassmorphismAppBar(),
      resizeToAvoidBottomInset: true,
      body: SingleChildScrollView(
        physics: const ClampingScrollPhysics(),
        child: IntrinsicHeight(
          child: Column(
            children: [
              addVerticalSpace(10),
              // Logo that hides when password is focused and keyboard is visible
              GestureDetector(
                onTap: () {
                  final now = DateTime.now();
                  // Reset tap count if more than 2 seconds have passed since last tap
                  if (_lastTapTime != null &&
                      now.difference(_lastTapTime!) >
                          const Duration(seconds: 2)) {
                    _logoTapCount = 0;
                  }

                  _logoTapCount++;
                  _lastTapTime = now;

                  // Trigger secret dialog after 5 taps
                  if (_logoTapCount >= 5) {
                    _logoTapCount = 0;
                    WipeDataDialog.show(context);
                  }
                },
                child: Image.asset(
                  Assets.earKartLogo,
                  height: Dimensions.height5 * 35,
                  fit: BoxFit.fitHeight,
                ),
              ),
              addVerticalSpace(20),
              Expanded(
                child: Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: Dimensions.screenWidth * 0.25,
                    ),
                    child: _buildLoginForm(),
                  ),
                ),
              ),
              addVerticalSpace(20),
              const OmniVersionWidget(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoginForm() {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: Dimensions.screenWidth * 0.04,
        vertical: Dimensions.screenHeight * 0.06,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: SmoothBorderRadius(
          cornerRadius: Dimensions.height5 * 10,
          cornerSmoothing: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.08),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Welcome Back',
            style: CustomStyles.largeHeadingTextStyle.copyWith(
              color: Constants.primaryColor,
            ),
            textAlign: TextAlign.center,
          ),
          Text(
            'Login to your centre\'s account',
            style: CustomStyles.mediumBodyTextStyle.copyWith(
              color: Colors.grey[700],
            ),
            textAlign: TextAlign.center,
          ),
          addVerticalSpace(Dimensions.height5 * 10),
          CustomTextField(
            controller: _emailController,
            hint: 'Email',
            keyboardType: TextInputType.emailAddress,
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter your email';
              }
              if (!RegExp(r"^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}").hasMatch(value)) {
                return 'Enter a valid email';
              }
              return null;
            },
            prefix: const Icon(Icons.email_outlined),
          ),
          addVerticalSpace(Dimensions.height5 * 6),
          CustomTextField(
            controller: _passwordController,
            hint: 'Password',
            obsecure: true,
            label: 'Password',
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Please enter your password';
              }
              if (value.length < 6) {
                return 'Password must be at least 6 characters';
              }
              return null;
            },
            prefix: const Icon(Icons.lock_outline),
          ),
          addVerticalSpace(Dimensions.height5 * 10),
          _buildLoginButton(),
          addVerticalSpace(10),
          TextButton(
            onPressed: () {
              ForgotPasswordDialog.show(context);
            },
            child: const Text('Forgot Password?'),
          ),
          addVerticalSpace(10),
        ],
      ),
    );
  }

  Widget _buildLoginButton() {
    return BlocConsumer<AuthCubit, AuthState>(
      listener: (context, state) {
        if (state is AuthSuccess) {
          Navigator.pushReplacementNamed(context, HomeScreen.routeName);
        }
      },
      builder: (context, state) {
        return GradientButton(
          onPressed: state is AuthLoading ? () {} : _onLogin,
          child:
              state is AuthLoading
                  ? buttonLoading()
                  : Text(
                    state is AuthError ? "Retry" : 'Login',
                    style: CustomStyles.buttonTextStyle.copyWith(
                      color: Colors.white,
                    ),
                  ),
        );
      },
    );
  }
}
