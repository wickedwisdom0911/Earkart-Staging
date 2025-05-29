import 'package:earkart_omni/config/utils/assets.dart';
import 'package:earkart_omni/config/widgets/custom_text_field.dart';
import 'package:earkart_omni/config/widgets/gradient_button.dart';
import 'package:earkart_omni/config/widgets/helpers.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/text_styles.dart';
import 'package:earkart_omni/config/utils/dimensions.dart';
import 'package:figma_squircle/figma_squircle.dart';
import 'package:flutter/material.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  static const routeName = "/login";

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isLoading = false;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _fadeAnimation = CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    );
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _onLogin() async {
    if (_formKey.currentState?.validate() ?? false) {
      setState(() => _isLoading = true);
      await Future.delayed(const Duration(seconds: 2)); // Simulate login
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Animated gradient background
          AnimatedContainer(
            duration: const Duration(seconds: 1),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Constants.darkAccent, Constants.accentColor],
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
              ),
            ),
            width: Dimensions.screenWidth,
            height: Dimensions.screenHeight,
          ),
          Container(
            alignment: Alignment.topCenter,
            margin: EdgeInsets.only(top: Dimensions.height5 * 8),
            child: Image.asset(
              Assets.earKartLogo,
              height: Dimensions.height5 * 50,
              fit: BoxFit.fitHeight,
            ),
          ),

          FadeTransition(
            opacity: _fadeAnimation,
            child: Center(
              child: SingleChildScrollView(
                child: Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: Dimensions.screenWidth * 0.2,
                  ),
                  child: Container(
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
                    child: Form(
                      key: _formKey,
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
                              if (!RegExp(
                                r"^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}",
                              ).hasMatch(value)) {
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
                          GradientButton(
                            onPressed: _isLoading ? () {} : _onLogin,
                            child:
                                _isLoading
                                    ? buttonLoading()
                                    : Text(
                                      'Login',
                                      style: CustomStyles.buttonTextStyle
                                          .copyWith(color: Colors.white),
                                    ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
