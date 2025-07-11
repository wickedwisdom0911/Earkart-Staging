import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/config/widgets/custom_text_field.dart';
import 'package:earkart_omni/config/widgets/gender_selector.dart';
import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/config/widgets/gradient_button.dart';
import 'package:earkart_omni/config/widgets/phone_number_input.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/consultation/presentation/pages/consultation_request_screen.dart';
import 'package:earkart_omni/features/lookup/presentation/cubit/lookup.cubit.dart';
import 'package:earkart_omni/features/lookup/presentation/cubit/lookup.state.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.state.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/language/language.entity.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:earkart_omni/config/widgets/language_selector.dart';
import 'package:earkart_omni/config/widgets/country_selector.dart';
import 'package:earkart_omni/config/widgets/state_selector.dart';
import 'package:earkart_omni/config/widgets/city_selector.dart';
import 'package:earkart_omni/config/widgets/district_selector.dart';

class PatientFormScreen extends StatefulWidget {
  const PatientFormScreen({super.key});
  static const routeName = "/patient-form";
  @override
  State<PatientFormScreen> createState() => _PatientFormScreenState();
}

class _PatientFormScreenState extends State<PatientFormScreen> {
  LanguageEntity? selectedLanguage;
  CountryEntity? selectedCountry;
  StateEntity? selectedState;
  CityEntity? selectedCity;
  DistrictEntity? selectedDistrict;
  TextEditingController nameController = TextEditingController();
  TextEditingController emailController = TextEditingController();
  TextEditingController phoneController = TextEditingController();
  TextEditingController addressController = TextEditingController();
  TextEditingController pincodeController = TextEditingController();
  TextEditingController dobController = TextEditingController();
  TextEditingController ageController = TextEditingController();
  DateTime? selectedDate;
  Gender selectedGender = Gender.male;
  String selectedCountryCode = '+91'; // Default to India country code

  @override
  void initState() {
    super.initState();
    final lookupCubit = context.read<LookupCubit>();
    lookupCubit.getLanguages();
    lookupCubit.getCountries();
  }

  void submitPatient() {
    int age =
        ageController.text.trim().isEmpty
            ? 0
            : int.parse(ageController.text.trim());

    String? dobString;
    if (selectedDate != null) {
      dobString =
          selectedDate!.toUtc().toIso8601String().split(
            'T',
          )[0]; // Format as YYYY-MM-DD
    }

    final patient = PatientEntity(
      contactNumber:
          phoneController.text.trim().isEmpty
              ? ""
              : "$selectedCountryCode${phoneController.text.trim()}",
      name: nameController.text.trim(),
      gender: selectedGender,
      dob: dobString,
      age: age,
      password: "",
      address: addressController.text.trim(),
      cityId: selectedCity?.id,
      districtId: selectedDistrict?.id,
      stateId: selectedState?.id,
      countryId: selectedCountry?.id,
      pincode: pincodeController.text.trim(),
      email: emailController.text.trim(),
      status: Status.active,
      languageId: selectedLanguage?.id ?? "",
    );
    di<ILogger>().info(patient.toJson().toString());
    context.read<PatientCubit>().createPatient(patient);
  }

  Widget _buildSection({
    required String title,
    required IconData icon,
    required List<Widget> children,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: Colors.blue.shade600, size: 20),
              ),
              const SizedBox(width: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Colors.black87,
                  letterSpacing: 0.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          ...children,
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      extendBodyBehindAppBar: true,
      appBar: GlassmorphismAppBar(
        title: const Text(
          "New Patient",
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: Colors.black87,
            letterSpacing: 0.2,
          ),
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.only(
          top: 80,
          left: 24,
          right: 24,
          bottom: 24,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Section
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          Icons.person_add,
                          color: Colors.blue.shade600,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "Patient Registration",
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: Colors.black87,
                                letterSpacing: 0.2,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              "Fill in the details to register a new patient",
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey,
                                letterSpacing: 0.1,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Personal Information Section
            _buildSection(
              title: "Personal Information",
              icon: Icons.person_outline,
              children: [
                CustomTextField(
                  hint: "Enter full name",
                  title: "Full Name",
                  controller: nameController,
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: GenderSelector(
                        title: "Gender",
                        value: selectedGender,
                        onChanged: (value) {
                          setState(() {
                            selectedGender = value ?? Gender.male;
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: CustomTextField(
                        hint: "Enter age",
                        title: "Age (Optional)",
                        controller: ageController,
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                CustomTextField(
                  hint: "Select date of birth",
                  title: "Date of Birth (Optional)",
                  controller: dobController,
                  readOnly: true,
                  onTap: () {
                    showDatePicker(
                      context: context,
                      firstDate: DateTime(1900),
                      initialEntryMode: DatePickerEntryMode.calendarOnly,
                      lastDate: DateTime.now(),
                    ).then((value) {
                      if (value != null) {
                        setState(() {
                          selectedDate = value;
                          dobController.text = DateFormat(
                            'dd/MM/yyyy',
                          ).format(value);
                        });
                      }
                    });
                  },
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Contact Information Section
            _buildSection(
              title: "Contact Information",
              icon: Icons.contact_phone_outlined,
              children: [
                CustomTextField(
                  hint: "Enter email address",
                  title: "Email Address",
                  controller: emailController,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 20),
                PhoneNumberInput(
                  countryCode: selectedCountryCode,
                  phoneNumber: phoneController.text,
                  onCountryCodeChanged: (String countryCode) {
                    setState(() {
                      selectedCountryCode = countryCode;
                    });
                  },
                  onPhoneNumberChanged: (String phoneNumber) {
                    phoneController.text = phoneNumber;
                  },
                  title: "Phone Number",
                  hint: "Enter phone number",
                  controller: phoneController,
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Address Information Section
            _buildSection(
              title: "Address Information",
              icon: Icons.location_on_outlined,
              children: [
                CustomTextField(
                  hint: "Enter address",
                  title: "Address",
                  controller: addressController,
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: CustomTextField(
                        hint: "Enter pincode",
                        title: "Pincode",
                        controller: pincodeController,
                        keyboardType: TextInputType.number,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Location & Language Section
            _buildSection(
              title: "Location & Language",
              icon: Icons.language_outlined,
              children: [
                BlocBuilder<LookupCubit, LookupState>(
                  builder: (context, state) {
                    if (state.isLoading) {
                      return const Center(
                        child: Padding(
                          padding: EdgeInsets.all(20.0),
                          child: CircularProgressIndicator(),
                        ),
                      );
                    }
                    if (state.error != null) {
                      return Center(
                        child: Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Text(
                            'Error: ${state.error}',
                            style: TextStyle(color: Colors.red.shade600),
                          ),
                        ),
                      );
                    }
                    return Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: LanguageSelector(
                                value: selectedLanguage,
                                onChanged:
                                    (value) => setState(
                                      () => selectedLanguage = value,
                                    ),
                                items: state.languages,
                                title: "Preferred Language",
                              ),
                            ),
                            const SizedBox(width: 20),
                            Expanded(
                              child: CountrySelector(
                                value: selectedCountry,
                                onChanged: (value) {
                                  setState(() {
                                    selectedCountry = value;
                                    selectedState = null;
                                    selectedCity = null;
                                    selectedDistrict = null;
                                  });
                                  if (value != null) {
                                    context.read<LookupCubit>().getStates(
                                      value.id ?? "",
                                    );
                                  }
                                },
                                items: state.countries,
                                title: "Country",
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Row(
                          children: [
                            Expanded(
                              child: StateSelector(
                                value: selectedState,
                                onChanged: (value) {
                                  setState(() {
                                    selectedState = value;
                                    selectedCity = null;
                                    selectedDistrict = null;
                                  });
                                  if (value != null) {
                                    context.read<LookupCubit>().getCities(
                                      value.id ?? "",
                                    );
                                  }
                                },
                                items: state.states,
                                title: "State",
                              ),
                            ),
                            const SizedBox(width: 20),
                            Expanded(
                              child: CitySelector(
                                value: selectedCity,
                                onChanged: (value) {
                                  setState(() {
                                    selectedCity = value;
                                    selectedDistrict = null;
                                  });
                                  if (value != null) {
                                    context.read<LookupCubit>().getDistricts(
                                      value.id ?? "",
                                    );
                                  }
                                },
                                items: state.cities,
                                title: "City",
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Row(
                          children: [
                            Expanded(
                              child: DistrictSelector(
                                value: selectedDistrict,
                                onChanged:
                                    (value) => setState(
                                      () => selectedDistrict = value,
                                    ),
                                items: state.districts,
                                title: "District",
                              ),
                            ),
                            const Expanded(child: SizedBox()),
                          ],
                        ),
                      ],
                    );
                  },
                ),
              ],
            ),
            const SizedBox(height: 32),

            // Submit Button
            BlocConsumer<PatientCubit, PatientState>(
              listener: (context, state) {
                di<ILogger>().info(state.toString());
                if (state is PatientSuccess) {
                  Navigator.pushNamed(
                    context,
                    ConsultationRequestScreen.routeName,
                  );
                }
              },
              builder: (context, state) {
                return GradientButton(
                  child:
                      state is PatientLoading
                          ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                          : Text(
                            state is PatientError
                                ? "Retry Registration"
                                : "Register Patient",
                          ),
                  onPressed: () {
                    submitPatient();
                  },
                );
              },
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}
