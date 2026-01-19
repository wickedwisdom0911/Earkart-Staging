import 'package:flutter/material.dart';
import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/features/home/presentation/pages/root_screen.dart';

enum ConsultationEndedBy { user, audiologist }

class ConsultationEndedScreen extends StatelessWidget {
  static const routeName = '/consultation-ended';

  final ConsultationEndedBy endedBy;

  const ConsultationEndedScreen({
    super.key,
    this.endedBy = ConsultationEndedBy.audiologist,
  });

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        // Prevent back button navigation - always navigate to home
        Navigator.pushReplacementNamed(context, RootScreen.routeName);
        return false;
      },
      child: Scaffold(
        backgroundColor: Constants.bg,
        extendBodyBehindAppBar: true,
        appBar: GlassmorphismAppBar(
          title: const Text(
            'Consultation Ended',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Constants.primaryColor,
            ),
          ),
          autoLeading: false,
        ),
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Icon
                  Container(
                    width: 120,
                    height: 120,
                    decoration: BoxDecoration(
                      color: endedBy == ConsultationEndedBy.audiologist
                          ? Colors.orange.shade50
                          : Colors.blue.shade50,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.phone_disabled_rounded,
                      size: 64,
                      color: endedBy == ConsultationEndedBy.audiologist
                          ? Colors.orange.shade600
                          : Colors.blue.shade600,
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  // Title
                  Text(
                    endedBy == ConsultationEndedBy.audiologist
                        ? 'The Audiologist Ended the Call'
                        : 'Consultation Ended',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w700,
                      color: Constants.primaryColor,
                      letterSpacing: 0.3,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  
                  // Subtitle
                  Text(
                    endedBy == ConsultationEndedBy.audiologist
                        ? 'The consultation has been completed by the audiologist. You can return to the home screen.'
                        : 'You have successfully ended the consultation. Thank you for using our service.',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w400,
                      color: Colors.grey.shade700,
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 48),
                  
                  // Home Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pushReplacementNamed(
                          context,
                          RootScreen.routeName,
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Constants.primaryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 2,
                      ),
                      child: const Text(
                        'Go Back to Home',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.5,
                        ),
                      ),
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

