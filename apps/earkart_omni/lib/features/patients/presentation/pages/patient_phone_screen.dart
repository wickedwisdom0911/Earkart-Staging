import 'dart:async';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/dimensions.dart';
import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/features/patients/presentation/pages/patient_form_screen.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:earkart_omni/config/widgets/phone_number_input.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.state.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:intl/intl.dart';

class PatientPhoneScreen extends StatefulWidget {
  const PatientPhoneScreen({super.key});
  static const String routeName = '/patient-phone-screen';

  @override
  State<PatientPhoneScreen> createState() => _PatientPhoneScreenState();
}

class _PatientPhoneScreenState extends State<PatientPhoneScreen> {
  final TextEditingController _phoneController = TextEditingController();
  final FocusNode _phoneFocusNode = FocusNode();
  String _searchQuery = '';
  String _selectedCountryCode = '+91'; // Default to India country code
  Timer? _debounceTimer;
  static const Duration _debounceDelay = Duration(milliseconds: 500);

  @override
  void initState() {
    super.initState();
    _phoneController.addListener(_onPhoneChanged);
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _phoneController.removeListener(_onPhoneChanged);
    _phoneController.dispose();
    _phoneFocusNode.dispose();
    super.dispose();
  }

  void _onPhoneChanged() {
    setState(() {
      _searchQuery = _phoneController.text.trim();
    });

    // Cancel the previous timer if it exists
    _debounceTimer?.cancel();

    // Start a new timer for debouncing
    _debounceTimer = Timer(_debounceDelay, () {
      // Search for patients when phone number is entered
      if (_searchQuery.isNotEmpty && _searchQuery.length >= 7) {
        // Combine country code with phone number for search
        final fullPhoneNumber = "$_selectedCountryCode$_searchQuery";
        if (mounted) {
          context.read<PatientCubit>().getPatientsByValue(fullPhoneNumber);
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GlassmorphismAppBar(
        title: const Text(
          'Patient Management',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 20),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: Row(
        children: [
          // Left Side - Search Section
          Expanded(
            flex: 1,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(2, 0),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Search Header
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Constants.accentColor,
                      boxShadow: [
                        BoxShadow(
                          color: Constants.accentColor.withOpacity(0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Constants.accentColor,
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: Constants.secondaryColor.withOpacity(
                                      0.3,
                                    ),
                                    blurRadius: 12,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Icon(
                                Icons.search_rounded,
                                color: Constants.primaryColor,
                                size: 28,
                              ),
                            ),
                            const SizedBox(width: 20),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Search Patients',
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.black87,
                                      letterSpacing: 0.2,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    'Enter a phone number to find existing patients',
                                    style: TextStyle(
                                      fontSize: 15,
                                      color: Colors.grey.shade700,
                                      letterSpacing: 0.1,
                                      height: 1.3,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        PhoneNumberInput(
                          countryCode: _selectedCountryCode,
                          phoneNumber: _phoneController.text,
                          onCountryCodeChanged: (String countryCode) {
                            setState(() {
                              _selectedCountryCode = countryCode;
                            });
                            // Trigger search if there's already a search query
                            if (_searchQuery.isNotEmpty && _searchQuery.length >= 7) {
                              _debounceTimer?.cancel();
                              final fullPhoneNumber = "$countryCode$_searchQuery";
                              if (mounted) {
                                context.read<PatientCubit>().getPatientsByValue(fullPhoneNumber);
                              }
                            }
                          },
                          onPhoneNumberChanged: (String phoneNumber) {
                            _phoneController.text = phoneNumber;
                          },
                          title: "Phone Number",
                          hint: "Enter phone number",
                          controller: _phoneController,
                        ),
                      ],
                    ),
                  ),

                  // Results Section
                  Expanded(
                    child: BlocBuilder<PatientCubit, PatientState>(
                      builder: (context, state) {
                        return _buildResultsSection(state);
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Right Side - New Patient Section
          Expanded(flex: 1, child: _buildNewPatientSection()),
        ],
      ),
    );
  }

  Widget _buildResultsSection(PatientState state) {
    if (state is PatientLoading) {
      return SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              const CircularProgressIndicator(),
              const SizedBox(height: 16),
              const Text(
                'Searching for patients...',
                style: TextStyle(fontSize: 16, color: Colors.grey),
              ),
            ],
          ),
        ),
      );
    }

    if (state is PatientError) {
      return SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.red.shade300),
              const SizedBox(height: 16),
              Text(
                'Error: ${state.message}',
                style: const TextStyle(fontSize: 16, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  if (_searchQuery.isNotEmpty) {
                    final fullPhoneNumber =
                        "$_selectedCountryCode$_searchQuery";
                    context.read<PatientCubit>().getPatientsByValue(
                      fullPhoneNumber,
                    );
                  }
                },
                child: const Text('Try Again'),
              ),
            ],
          ),
        ),
      );
    }

    if (state is PatientsByValue || state is AllPatientsSuccess) {
      final patients =
          state is PatientsByValue
              ? state.patients
              : (state as AllPatientsSuccess).patients;

      if (_searchQuery.isEmpty) {
        return _buildEmptyState();
      }

      if (patients.isEmpty) {
        return _buildNoResultsState();
      }

      return _buildPatientsList(patients);
    }

    if (_searchQuery.isEmpty) {
      return _buildEmptyState();
    }

    return const SizedBox.shrink();
  }

  Widget _buildEmptyState() {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
              spreadRadius: 0,
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Colors.blue.shade50, Colors.blue.shade100],
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                Icons.search_rounded,
                size: 24,
                color: Colors.blue.shade600,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Start Searching',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade800,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Enter a phone number above to\nfind existing patients',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.shade600,
                height: 1.2,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoResultsState() {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
                spreadRadius: 0,
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Colors.orange.shade50, Colors.orange.shade100],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.person_off_outlined,
                  size: 24,
                  color: Colors.orange.shade600,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'No Patients Found',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'No patients found with phone number:\n${_selectedCountryCode}$_searchQuery',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                  height: 1.2,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              Text(
                'Use the + button below to add a new patient',
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.grey.shade500,
                  fontStyle: FontStyle.italic,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPatientsList(List<PatientEntity> patients) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Results header
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
                spreadRadius: 0,
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Colors.blue.shade50, Colors.blue.shade100],
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.people_outline,
                  size: 16,
                  color: Colors.blue.shade600,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                'Found ${patients.length} patient${patients.length == 1 ? '' : 's'}',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade700,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Patient cards
        ...patients.map((patient) => _buildPatientCard(patient)).toList(),
      ],
    );
  }

  Widget _buildPatientCard(PatientEntity patient) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200, width: 1),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            _selectPatient(patient);
          },
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Avatar
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: _getGenderColor(patient.gender).withOpacity(0.08),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      _getInitials(patient.name),
                      style: TextStyle(
                        fontSize: 18,
                        color: _getGenderColor(patient.gender),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),

                // Patient info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              patient.name,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Colors.black87,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: _getGenderColor(
                                patient.gender,
                              ).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              patient.gender.name.toUpperCase(),
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: _getGenderColor(patient.gender),
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      _InfoRow(
                        icon: Icons.phone_outlined,
                        text: patient.contactNumber,
                        iconColor: Colors.grey.shade600,
                      ),
                      if (patient.email != null &&
                          patient.email!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        _InfoRow(
                          icon: Icons.email_outlined,
                          text: patient.email!.toLowerCase(),
                          iconColor: Colors.grey.shade600,
                        ),
                      ],
                      const SizedBox(height: 4),
                      _InfoRow(
                        icon: Icons.cake_outlined,
                        text: _getAgeOrDob(patient),
                        iconColor: Colors.grey.shade600,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _selectPatient(PatientEntity patient) {
    Navigator.pushNamed(
      context,
      PatientFormScreen.routeName,
      arguments: patient,
    );
  }

  Widget _buildNewPatientSection() {
    return Container(
      height: Dimensions.screenHeight,
      decoration: BoxDecoration(
        color: Constants.accentColor,
        border: Border(
          left: BorderSide(
            color: Constants.secondaryColor.withAlpha(80),
            width: 0.5,
          ),
        ),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Icon Section
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Constants.primaryColor, Constants.secondaryColor],
                ),
                borderRadius: BorderRadius.circular(30),
                boxShadow: [
                  BoxShadow(
                    color: Constants.primaryColor.withOpacity(0.3),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: const Icon(
                Icons.person_add_rounded,
                size: 60,
                color: Colors.white,
              ),
            ),

            const SizedBox(height: 32),

            // Title
            Text(
              'Add New Patient',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w700,
                color: Colors.grey.shade800,
                letterSpacing: 0.5,
              ),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: 12),

            // Subtitle
            Text(
              'Create a new patient profile to start their journey with Earkart Omni.',
              style: TextStyle(
                fontSize: 15,
                color: Colors.grey.shade600,
                height: 1.5,
                letterSpacing: 0.2,
              ),
              textAlign: TextAlign.center,
            ),

            const SizedBox(height: 32),

            // Features List
            _buildFeatureItem(
              icon: Icons.verified_user_rounded,
              title: 'Secure Profile',
              description: 'Safe and encrypted patient data',
            ),

            const SizedBox(height: 16),

            _buildFeatureItem(
              icon: Icons.medical_services_rounded,
              title: 'Complete Records',
              description: 'Comprehensive medical history tracking',
            ),

            const SizedBox(height: 16),

            _buildFeatureItem(
              icon: Icons.schedule_rounded,
              title: 'Easy Scheduling',
              description: 'Quick appointment and consultation setup',
            ),

            const SizedBox(height: 32),

            // Add Patient Button
            Container(
              width: double.infinity,
              height: 56,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Constants.primaryColor, Constants.secondaryColor],
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Constants.primaryColor.withOpacity(0.3),
                    blurRadius: 15,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () {
                    Navigator.pushNamed(
                      context,
                      PatientFormScreen.routeName,
                      arguments: PatientEntity(
                        contactNumber: _phoneController.text.trim(),
                        name: "",
                        gender: Gender.male,
                        password: "",
                        address: "",
                        pincode: "",
                        languageId: "",
                        countryId: "",
                        stateId: "",
                        districtId: "",
                        cityId: "",
                      ),
                    );
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: const Center(
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.add_rounded, color: Colors.white, size: 24),
                        SizedBox(width: 12),
                        Text(
                          'Create New Patient',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Quick tip
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue.shade200, width: 1),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.lightbulb_outline_rounded,
                    color: Colors.blue.shade600,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Tip: You can also search for existing patients on the left to avoid duplicates.',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.blue.shade700,
                        height: 1.3,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureItem({
    required IconData icon,
    required String title,
    required String description,
  }) {
    return Row(
      children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: Constants.primaryColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: Constants.primaryColor, size: 24),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                  height: 1.3,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _getInitials(String name) {
    if (name.isEmpty) return "?";

    final nameParts = name.trim().split(' ');
    if (nameParts.length == 1) {
      return nameParts[0][0].toUpperCase();
    } else {
      final firstName = nameParts[0];
      final lastName = nameParts[nameParts.length - 1];
      return '${firstName[0]}${lastName[0]}'.toUpperCase();
    }
  }

  String _getAgeOrDob(PatientEntity patient) {
    final currentYear = DateTime.now().year;

    // If age is available and not null, show age
    if (patient.age != null) {
      return "${patient.age} years";
    }

    // If DOB is available, check if it's from current year or calculate age
    if (patient.dob != null) {
      try {
        final dobDate = DateTime.parse(patient.dob!);
        final dobYear = dobDate.year;

        // If DOB is from current year, show age as 0 or 1
        if (dobYear == currentYear) {
          final age = currentYear - dobYear;
          return age == 0 ? "Less than 1 year" : "$age years";
        } else {
          // Calculate age from DOB
          final age = currentYear - dobYear;
          return "$age years";
        }
      } catch (e) {
        // If parsing fails, show the DOB as formatted date
        return DateFormat('MMM dd, yyyy').format(DateTime.parse(patient.dob!));
      }
    }

    return "-";
  }

  Color _getGenderColor(Gender gender) {
    switch (gender) {
      case Gender.male:
        return const Color(0xFF3B82F6); // Modern blue
      case Gender.female:
        return const Color(0xFFEC4899); // Modern pink
      case Gender.other:
        return const Color(0xFF8B5CF6); // Modern purple
    }
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final Color iconColor;

  const _InfoRow({
    required this.icon,
    required this.text,
    required this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: iconColor),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey.shade700,
              fontWeight: FontWeight.w400,
            ),
          ),
        ),
      ],
    );
  }
}
