import 'package:earkart_omni/features/patients/presentation/pages/patient_form_screen.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:earkart_omni/config/widgets/custom_text_field.dart';
import 'package:earkart_omni/config/widgets/phone_number_input.dart';
import 'package:earkart_omni/config/constants/country_codes.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.state.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';

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

  @override
  void initState() {
    super.initState();
    _phoneController.addListener(_onPhoneChanged);
  }

  @override
  void dispose() {
    _phoneController.removeListener(_onPhoneChanged);
    _phoneController.dispose();
    _phoneFocusNode.dispose();
    super.dispose();
  }

  void _onPhoneChanged() {
    setState(() {
      _searchQuery = _phoneController.text.trim();
    });

    // Search for patients when phone number is entered
    if (_searchQuery.isNotEmpty && _searchQuery.length >= 7) {
      // Combine country code with phone number for search
      final fullPhoneNumber = "$_selectedCountryCode$_searchQuery";
      context.read<PatientCubit>().getPatientsByValue(fullPhoneNumber);
    }
  }

  void _extractCountryCodeAndPhoneNumber(String fullPhoneNumber) {
    // Get country codes from global constants
    final countryCodes = CountryCodes.getCodes();

    String extractedCountryCode = '+91'; // Default
    String phoneNumber = fullPhoneNumber;

    // Try to find a matching country code
    for (String code in countryCodes) {
      if (fullPhoneNumber.startsWith(code)) {
        extractedCountryCode = code;
        phoneNumber = fullPhoneNumber.substring(code.length);
        break;
      }
    }

    setState(() {
      _selectedCountryCode = extractedCountryCode;
      _phoneController.text = phoneNumber;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          // Navigate to add new patient
          Navigator.pushNamed(
            context,
            PatientFormScreen.routeName,
            arguments: PatientEntity(
              contactNumber: "",
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
        backgroundColor: Colors.blue.shade600,
        foregroundColor: Colors.white,
        elevation: 8,
        icon: const Icon(Icons.add, size: 20),
        label: const Text(
          'New Patient',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
      ),
      appBar: AppBar(
        title: const Text(
          'Search Patients',
          style: TextStyle(fontWeight: FontWeight.w600, fontSize: 20),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SingleChildScrollView(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            minHeight:
                MediaQuery.of(context).size.height -
                MediaQuery.of(context).padding.top -
                kToolbarHeight -
                MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Column(
            children: [
              // Modern Search Section
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      Colors.blue.shade50,
                      Colors.blue.shade100.withOpacity(0.3),
                    ],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.blue.shade100.withOpacity(0.3),
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
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.blue.shade200.withOpacity(0.3),
                                blurRadius: 12,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Icon(
                            Icons.search_rounded,
                            color: Colors.blue.shade600,
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
              Container(
                height:
                    MediaQuery.of(context).size.height -
                    MediaQuery.of(context).padding.top -
                    kToolbarHeight -
                    MediaQuery.of(context).viewInsets.bottom -
                    200, // Approximate search section height
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
    );
  }

  Widget _buildResultsSection(PatientState state) {
    if (state is PatientLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text(
              'Searching for patients...',
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
          ],
        ),
      );
    }

    if (state is PatientError) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
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
                  final fullPhoneNumber = "$_selectedCountryCode$_searchQuery";
                  context.read<PatientCubit>().getPatientsByValue(
                    fullPhoneNumber,
                  );
                }
              },
              child: const Text('Try Again'),
            ),
          ],
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
            const SizedBox(height: 12),
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
            const SizedBox(height: 8),
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
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
            spreadRadius: 0,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () {
            // Navigate to patient details or select patient
            _selectPatient(patient);
          },
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                // Avatar
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Colors.blue.shade100, Colors.blue.shade200],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(
                      patient.name.isNotEmpty
                          ? patient.name[0].toUpperCase()
                          : "?",
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue.shade700,
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
                      Text(
                        patient.name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(
                            Icons.phone_outlined,
                            size: 14,
                            color: Colors.grey.shade600,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            patient.contactNumber,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                      if (patient.email != null) ...[
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Icon(
                              Icons.email_outlined,
                              size: 14,
                              color: Colors.grey.shade600,
                            ),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                patient.email!,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.grey.shade600,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(
                            Icons.wc_outlined,
                            size: 14,
                            color: Colors.grey.shade600,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${patient.gender.name} • ${patient.age ?? 'N/A'} years',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade500,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Status indicator
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color:
                        patient.status?.name == 'ACTIVE'
                            ? Colors.green.shade100
                            : Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    patient.status?.name ?? 'ACTIVE',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w500,
                      color:
                          patient.status?.name == 'ACTIVE'
                              ? Colors.green.shade700
                              : Colors.grey.shade600,
                    ),
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

  void _navigateToAddPatient() {
    // Combine country code with phone number
    final fullPhoneNumber = "$_selectedCountryCode$_searchQuery";

    Navigator.pushNamed(
      context,
      PatientFormScreen.routeName,
      arguments: PatientEntity(
        contactNumber: fullPhoneNumber,
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
  }
}
