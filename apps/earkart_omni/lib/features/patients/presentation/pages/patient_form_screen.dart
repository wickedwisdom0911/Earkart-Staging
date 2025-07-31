import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/config/widgets/custom_text_field.dart';
import 'package:earkart_omni/config/widgets/gender_selector.dart';
import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/config/widgets/gradient_button.dart';
import 'package:earkart_omni/config/widgets/phone_number_input.dart';
import 'package:earkart_omni/config/constants/country_codes.dart';
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

enum AgeOrDob { age, dob }

class PatientFormScreen extends StatefulWidget {
  final PatientEntity patient;
  const PatientFormScreen({super.key, required this.patient});
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
  AgeOrDob selectedAgeOrDob = AgeOrDob.age; // Default to age

  @override
  void initState() {
    super.initState();

    // Prefill form fields with patient data
    _prefillFormFields();

    final lookupCubit = context.read<LookupCubit>();
    lookupCubit.getLanguages();
    lookupCubit.getCountries();
  }

  void _prefillFormFields() {
    final patient = widget.patient;

    // Prefill basic information
    nameController.text = patient.name;
    emailController.text = patient.email ?? '';
    addressController.text = patient.address;
    pincodeController.text = patient.pincode;
    selectedGender = patient.gender;

    // Determine which option to select based on available data
    if (patient.age != null && patient.age! > 0) {
      // Age is available, select age option
      selectedAgeOrDob = AgeOrDob.age;
      ageController.text = patient.age.toString();
      // Clear DOB
      dobController.clear();
      selectedDate = null;
    } else if (patient.dob != null) {
      // DOB is available, select DOB option
      selectedAgeOrDob = AgeOrDob.dob;
      try {
        selectedDate = DateTime.parse(patient.dob!);
        dobController.text = DateFormat('dd/MM/yyyy').format(selectedDate!);
        // Clear age
        ageController.clear();
      } catch (e) {
        // Handle invalid date format
        di<ILogger>().error('Invalid date format: ${patient.dob}');
        // Default to age if DOB is invalid
        selectedAgeOrDob = AgeOrDob.age;
      }
    } else {
      // Neither age nor DOB available, default to age
      selectedAgeOrDob = AgeOrDob.age;
      ageController.clear();
      dobController.clear();
      selectedDate = null;
    }

    // Prefill phone number and extract country code
    if (patient.contactNumber.isNotEmpty) {
      _extractCountryCodeAndPhoneNumber(patient.contactNumber);
    }

    // Set language if available (either from languageId or language entity)
    if (patient.language != null) {
      selectedLanguage = patient.language;
    }

    // Set location entities if available from related entities
    if (patient.countryId != null) {
      // We'll need to fetch the country data and set it
      // This will be handled when the lookup data is loaded
    }

    if (patient.stateId != null) {
      // We'll need to fetch the state data and set it
      // This will be handled when the lookup data is loaded
    }

    if (patient.districtId != null) {
      // We'll need to fetch the district data and set it
      // This will be handled when the lookup data is loaded
    }

    if (patient.cityId != null) {
      // We'll need to fetch the city data and set it
      // This will be handled when the lookup data is loaded
    }

    // If we have the full entity objects, we can set them directly
    // These will be overridden by the lookup data if available
    if (patient.city != null) {
      selectedCity = patient.city;
    }

    if (patient.district != null) {
      selectedDistrict = patient.district;
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
      selectedCountryCode = extractedCountryCode;
      phoneController.text = phoneNumber;
    });
  }

  int? _calculateAgeFromDob(DateTime dob) {
    final now = DateTime.now();
    int age = now.year - dob.year;
    if (now.month < dob.month ||
        (now.month == dob.month && now.day < dob.day)) {
      age--;
    }
    return age > 0 ? age : null;
  }

  void _setLocationEntitiesFromPatient(LookupState state) {
    final patient = widget.patient;

    // Set country if available
    if (patient.countryId != null &&
        selectedCountry == null &&
        state.countries.isNotEmpty) {
      try {
        final country = state.countries.firstWhere(
          (country) => country.id == patient.countryId,
        );
        setState(() {
          selectedCountry = country;
        });
        // Fetch states for this country
        context.read<LookupCubit>().getStates(country.id ?? "");
      } catch (e) {
        // Country not found, ignore
      }
    }

    // Set state if available
    if (patient.stateId != null &&
        selectedState == null &&
        state.states.isNotEmpty) {
      try {
        final stateEntity = state.states.firstWhere(
          (stateEntity) => stateEntity.id == patient.stateId,
        );
        setState(() {
          selectedState = stateEntity;
        });
        // Fetch districts for this state
        context.read<LookupCubit>().getDistricts(stateEntity.id ?? "");
      } catch (e) {
        // State not found, ignore
      }
    }

    // Set district if available
    if (patient.districtId != null &&
        selectedDistrict == null &&
        state.districts.isNotEmpty) {
      try {
        final district = state.districts.firstWhere(
          (district) => district.id == patient.districtId,
        );
        setState(() {
          selectedDistrict = district;
        });
        // Fetch cities for this district
        context.read<LookupCubit>().getCities(district.id ?? "");
      } catch (e) {
        // District not found, ignore
      }
    }

    // Set city if available
    if (patient.cityId != null &&
        selectedCity == null &&
        state.cities.isNotEmpty) {
      try {
        final city = state.cities.firstWhere(
          (city) => city.id == patient.cityId,
        );
        setState(() {
          selectedCity = city;
        });
      } catch (e) {
        // City not found, ignore
      }
    }

    // Handle the case where we have district/city entities but need to fetch parent entities
    if (selectedDistrict != null &&
        selectedCountry == null &&
        state.countries.isNotEmpty) {
      // If we have a district but no country, try to find the country
      // This is a fallback for when we have the district entity but not the country
      if (patient.countryId != null) {
        try {
          final country = state.countries.firstWhere(
            (country) => country.id == patient.countryId,
          );
          setState(() {
            selectedCountry = country;
          });
        } catch (e) {
          // Country not found, ignore
        }
      }
    }

    if (selectedCity != null &&
        selectedState == null &&
        state.states.isNotEmpty) {
      // If we have a city but no state, try to find the state
      // This is a fallback for when we have the city entity but not the state
      if (patient.stateId != null) {
        try {
          final stateEntity = state.states.firstWhere(
            (stateEntity) => stateEntity.id == patient.stateId,
          );
          setState(() {
            selectedState = stateEntity;
          });
        } catch (e) {
          // State not found, ignore
        }
      }
    }
  }

  void submitPatient() {
    int? age;
    String? dobString;

    // Handle based on user selection
    if (selectedAgeOrDob == AgeOrDob.age) {
      // User chose to enter age
      if (ageController.text.trim().isNotEmpty) {
        age = int.tryParse(ageController.text.trim());
      }
      dobString = null; // Clear DOB when age is selected
    } else {
      // User chose to enter DOB
      if (selectedDate != null) {
        // Calculate age from DOB
        age = _calculateAgeFromDob(selectedDate!);
        // Send complete ISO-8601 DateTime string as expected by backend
        dobString = selectedDate!.toUtc().toIso8601String();
      }
    }

    final patient = PatientEntity(
      id: widget.patient.id, // Include the ID if it exists (for updates)
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
        title: Text(
          "Patient Details Form",
          style: const TextStyle(
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
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              "Patient Details Form",
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w700,
                                color: Colors.black87,
                                letterSpacing: 0.2,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              "Fill in the details of the patient",
                              style: const TextStyle(
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
                  ],
                ),
                const SizedBox(height: 20),

                // Age or DOB Selection
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "Age Information",
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.grey.shade700,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(
                            child: RadioListTile<AgeOrDob>(
                              title: const Text(
                                "Enter Age",
                                style: TextStyle(fontSize: 14),
                              ),
                              value: AgeOrDob.age,
                              groupValue: selectedAgeOrDob,
                              onChanged: (AgeOrDob? value) {
                                setState(() {
                                  selectedAgeOrDob = value!;
                                  // Clear DOB when switching to age
                                  dobController.clear();
                                  selectedDate = null;
                                });
                              },
                              contentPadding: EdgeInsets.zero,
                              dense: true,
                            ),
                          ),
                          Expanded(
                            child: RadioListTile<AgeOrDob>(
                              title: const Text(
                                "Enter Date of Birth",
                                style: TextStyle(fontSize: 14),
                              ),
                              value: AgeOrDob.dob,
                              groupValue: selectedAgeOrDob,
                              onChanged: (AgeOrDob? value) {
                                setState(() {
                                  selectedAgeOrDob = value!;
                                  // Clear age when switching to DOB
                                  ageController.clear();
                                });
                              },
                              contentPadding: EdgeInsets.zero,
                              dense: true,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Conditional Input Field
                if (selectedAgeOrDob == AgeOrDob.age)
                  CustomTextField(
                    hint: "Enter age",
                    title: "Age",
                    controller: ageController,
                    keyboardType: TextInputType.number,
                  )
                else
                  CustomTextField(
                    hint: "Select date of birth",
                    title: "Date of Birth",
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

                    // Set location entities from patient data when lookup data is available
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      _setLocationEntitiesFromPatient(state);
                    });

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
                                    context.read<LookupCubit>().getDistricts(
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
                              child: DistrictSelector(
                                value: selectedDistrict,
                                onChanged: (value) {
                                  setState(() {
                                    selectedDistrict = value;
                                    selectedCity = null;
                                    if (value != null) {
                                      context.read<LookupCubit>().getCities(
                                        value.id ?? "",
                                      );
                                    }
                                  });
                                },
                                items: state.districts,
                                title: "District",
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        Row(
                          children: [
                            Expanded(
                              child: CitySelector(
                                value: selectedCity,
                                onChanged: (value) {
                                  setState(() {
                                    selectedCity = value;
                                  });
                                },
                                items: state.cities,
                                title: "City",
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
                  if (widget.patient.id != null) {
                    // If updating, go back to previous screen
                    Navigator.pop(context);
                  } else {
                    // If creating, go to consultation request
                    Navigator.pushNamed(
                      context,
                      ConsultationRequestScreen.routeName,
                    );
                  }
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
                                : widget.patient.id != null
                                ? "Update Patient"
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
