import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/config/constants/country_codes.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/lookup/presentation/cubit/lookup.cubit.dart';
import 'package:earkart_omni/features/lookup/presentation/cubit/lookup.state.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/features/patients/presentation/widgets/widgets.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/language/language.entity.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

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
  AgeOrDob? selectedAgeOrDob; // Start with no selection

  // Cache form validation result to prevent excessive rebuilding
  bool? _cachedFormValid;
  String? _lastValidationHash;
  bool _isFormValidState = false;

  // Track if user has manually selected language/country to prevent overwriting
  bool _languageManuallySelected = false;
  bool _countryManuallySelected = false;

  @override
  void initState() {
    super.initState();

    _prefillFormFields();
    _addTextControllerListeners();

    // Initialize form validation state
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _updateFormValidationState();
    });
  }

  void _addTextControllerListeners() {
    // Add listeners to text controllers to invalidate cache when text changes
    nameController.addListener(_invalidateFormValidationCache);
    emailController.addListener(_invalidateFormValidationCache);
    phoneController.addListener(_invalidateFormValidationCache);
    addressController.addListener(_invalidateFormValidationCache);
    pincodeController.addListener(_invalidateFormValidationCache);
    dobController.addListener(_invalidateFormValidationCache);
    ageController.addListener(_invalidateFormValidationCache);
  }

  @override
  void dispose() {
    // Remove listeners to prevent memory leaks
    nameController.removeListener(_invalidateFormValidationCache);
    emailController.removeListener(_invalidateFormValidationCache);
    phoneController.removeListener(_invalidateFormValidationCache);
    addressController.removeListener(_invalidateFormValidationCache);
    pincodeController.removeListener(_invalidateFormValidationCache);
    dobController.removeListener(_invalidateFormValidationCache);
    ageController.removeListener(_invalidateFormValidationCache);

    // Dispose controllers
    nameController.dispose();
    emailController.dispose();
    phoneController.dispose();
    addressController.dispose();
    pincodeController.dispose();
    dobController.dispose();
    ageController.dispose();

    super.dispose();
  }

  void _prefillFormFields() {
    final patient = widget.patient;

    // Prefill basic information
    nameController.text = patient.name;
    emailController.text = patient.email ?? '';
    addressController.text = patient.address ?? '';
    pincodeController.text = patient.pincode ?? '';
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
        // Default to no selection if DOB is invalid
        selectedAgeOrDob = null;
      }
    } else {
      // Neither age nor DOB available, start with no selection
      selectedAgeOrDob = null;
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
    // Note: If no language is set, we'll set default in _setLocationEntitiesFromPatient

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

    // Set language with default fallback - only if not already set and not manually selected
    if (selectedLanguage == null &&
        !_languageManuallySelected &&
        state.languages.isNotEmpty) {
      LanguageEntity? newLanguage;

      // Try to find the language by ID first
      if (patient.languageId.isNotEmpty) {
        try {
          newLanguage = state.languages.firstWhere(
            (lang) => lang.id == patient.languageId,
          );
        } catch (e) {
          // Language not found by ID, try to find by code
          try {
            newLanguage = state.languages.firstWhere(
              (lang) => lang.code == 'EN',
            );
          } catch (e) {
            // Default to first language if EN not found
            newLanguage = state.languages.first;
          }
        }
      } else {
        // No language ID, try to find by code EN
        try {
          newLanguage = state.languages.firstWhere((lang) => lang.code == 'EN');
        } catch (e) {
          // Default to first language if EN not found
          newLanguage = state.languages.first;
        }
      }

      // Only update state if the language is different (compare by ID)
      if (selectedLanguage == null || selectedLanguage!.id != newLanguage.id) {
        setState(() {
          selectedLanguage = newLanguage;
        });
      }
    }

    // Set country with default fallback - only if not already set and not manually selected
    if (selectedCountry == null &&
        !_countryManuallySelected &&
        state.countries.isNotEmpty) {
      CountryEntity? newCountry;

      // Try to find the country by ID first
      if (patient.countryId != null && patient.countryId!.isNotEmpty) {
        try {
          newCountry = state.countries.firstWhere(
            (country) => country.id == patient.countryId,
          );
        } catch (e) {
          // Country not found by ID, try to find by code IN
          try {
            newCountry = state.countries.firstWhere(
              (country) => country.code == 'IN',
            );
          } catch (e) {
            // Default to first country if IN not found
            newCountry = state.countries.first;
          }
        }
      } else {
        // No country ID, try to find by code IN
        try {
          newCountry = state.countries.firstWhere(
            (country) => country.code == 'IN',
          );
        } catch (e) {
          // Default to first country if IN not found
          newCountry = state.countries.first;
        }
      }

      // Only update state if the country is different (compare by ID)
      if (selectedCountry == null || selectedCountry!.id != newCountry.id) {
        setState(() {
          selectedCountry = newCountry;
        });
        // Fetch states for this country
        context.read<LookupCubit>().getStates(newCountry.id ?? "");
      }
    }

    // Set state if available - only if not already set
    if (patient.stateId != null &&
        selectedState == null &&
        state.states.isNotEmpty) {
      try {
        final stateEntity = state.states.firstWhere(
          (stateEntity) => stateEntity.id == patient.stateId,
        );
        if (stateEntity != selectedState) {
          setState(() {
            selectedState = stateEntity;
          });
          // Fetch districts for this state
          context.read<LookupCubit>().getDistricts(stateEntity.id ?? "");
        }
      } catch (e) {
        // State not found, ignore
      }
    }

    // Set district if available - only if not already set
    if (patient.districtId != null &&
        selectedDistrict == null &&
        state.districts.isNotEmpty) {
      try {
        final district = state.districts.firstWhere(
          (district) => district.id == patient.districtId,
        );
        if (district != selectedDistrict) {
          setState(() {
            selectedDistrict = district;
          });
          // Fetch cities for this district
          context.read<LookupCubit>().getCities(district.id ?? "");
        }
      } catch (e) {
        // District not found, ignore
      }
    }

    // Set city if available - only if not already set
    if (patient.cityId != null &&
        selectedCity == null &&
        state.cities.isNotEmpty) {
      try {
        final city = state.cities.firstWhere(
          (city) => city.id == patient.cityId,
        );
        if (city != selectedCity) {
          setState(() {
            selectedCity = city;
          });
        }
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
          if (country != selectedCountry) {
            setState(() {
              selectedCountry = country;
            });
          }
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
          if (stateEntity != selectedState) {
            setState(() {
              selectedState = stateEntity;
            });
          }
        } catch (e) {
          // State not found, ignore
        }
      }
    }
  }

  String? _validateName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Full name is required';
    }
    if (value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return null;
  }

  String? _validateContactNumber(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Contact number is required';
    }
    final phoneNumber = "$selectedCountryCode${value.trim()}";
    if (phoneNumber.length < 10) {
      return 'Please enter a valid contact number';
    }
    return null;
  }

  String? _validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) {
      return null; // Email is optional
    }
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value.trim())) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  String? _validateLanguage(LanguageEntity? value) {
    if (value == null) {
      return 'Preferred language is required';
    }
    return null;
  }

  bool _isFormValid() {
    // Check required fields
    final nameValid = _validateName(nameController.text) == null;
    final phoneValid = _validateContactNumber(phoneController.text) == null;
    final emailValid = _validateEmail(emailController.text) == null;
    final languageValid = _validateLanguage(selectedLanguage) == null;

    // Check if age/dob is selected and has valid input
    bool ageOrDobValid = true;
    if (selectedAgeOrDob == AgeOrDob.age) {
      // If age is selected, check if age field has valid input
      ageOrDobValid =
          ageController.text.trim().isNotEmpty &&
          int.tryParse(ageController.text.trim()) != null;
    } else if (selectedAgeOrDob == AgeOrDob.dob) {
      // If DOB is selected, check if date is selected
      ageOrDobValid = selectedDate != null;
    } else {
      // If no age/dob selection is made, it's invalid
      ageOrDobValid = false;
    }
    // Debug logging removed for performance
    return nameValid &&
        phoneValid &&
        emailValid &&
        languageValid &&
        ageOrDobValid;
  }

  void _updateFormValidationState() {
    // This method can be called to force a form validation state update
    final newValidationState = _isFormValidCached();
    if (_isFormValidState != newValidationState) {
      _isFormValidState = newValidationState;
      if (mounted) {
        setState(() {});
      }
    }
  }

  void _invalidateFormValidationCache() {
    // Invalidate the cached validation result
    _cachedFormValid = null;
    _lastValidationHash = null;

    // Update the form validation state
    final newValidationState = _isFormValidCached();
    if (_isFormValidState != newValidationState) {
      _isFormValidState = newValidationState;
      if (mounted) {
        setState(() {});
      }
    }
  }

  String _generateFormStateHash() {
    // Generate a hash of all form fields to detect changes
    return '${nameController.text}|${phoneController.text}|${emailController.text}|${selectedLanguage?.id}|${selectedAgeOrDob?.name}|${ageController.text}|${selectedDate?.millisecondsSinceEpoch}|${selectedCountryCode}';
  }

  bool _isFormValidCached() {
    final currentHash = _generateFormStateHash();

    // If the form state hasn't changed, return cached result
    if (_lastValidationHash == currentHash && _cachedFormValid != null) {
      return _cachedFormValid!;
    }

    // Calculate validation result
    final isValid = _isFormValid();

    // Cache the result
    _cachedFormValid = isValid;
    _lastValidationHash = currentHash;

    return isValid;
  }

  void submitPatient() {
    // Validate form before submission
    if (!_isFormValid()) {
      // Show error message or handle validation
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please fill in all required fields correctly'),
          backgroundColor: Colors.red.shade600,
        ),
      );
      return;
    }

    int? age;
    String? dobString;

    // Handle based on user selection
    if (selectedAgeOrDob == AgeOrDob.age) {
      // User chose to enter age
      if (ageController.text.trim().isNotEmpty) {
        age = int.tryParse(ageController.text.trim());
      }
      dobString = null; // Clear DOB when age is selected
    } else if (selectedAgeOrDob == AgeOrDob.dob) {
      // User chose to enter DOB
      if (selectedDate != null) {
        // Calculate age from DOB
        age = _calculateAgeFromDob(selectedDate!);
        // Send complete ISO-8601 DateTime string as expected by backend
        dobString = selectedDate!.toUtc().toIso8601String();
      }
    }
    // If selectedAgeOrDob is null, both age and dobString remain null

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
      address:
          addressController.text.trim().isEmpty
              ? null
              : addressController.text.trim(),
      cityId: selectedCity?.id,
      districtId: selectedDistrict?.id,
      stateId: selectedState?.id,
      countryId: selectedCountry?.id,
      pincode:
          pincodeController.text.trim().isEmpty
              ? null
              : pincodeController.text.trim(),
      email:
          emailController.text.trim().isEmpty
              ? null
              : emailController.text.trim(),
      status: Status.active,
      languageId: selectedLanguage?.id ?? "",
      leadStatus: LeadStatus.LEAD_GENERATED,
    );
    di<ILogger>().info(patient.toJson().toString());
    if (widget.patient.id != null) {
      context.read<PatientCubit>().updatePatient(patient);
    } else {
      context.read<PatientCubit>().createPatient(patient);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Constants.bg,
      extendBodyBehindAppBar: true,
      appBar: GlassmorphismAppBar(
        title: Text(
          "Patient Details",
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Constants.primaryColor,
            letterSpacing: 0.3,
          ),
        ),
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: Constants.primaryColor),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.only(
                top: 80,
                left: 20,
                right: 20,
                bottom: 20,
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Left Column - Personal & Contact Information
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        PersonalInformationWidget(
                          nameController: nameController,
                          selectedGender: selectedGender,
                          onGenderChanged: (value) {
                            setState(() {
                              selectedGender = value ?? Gender.male;
                            });
                            _invalidateFormValidationCache();
                          },
                          selectedAgeOrDob: selectedAgeOrDob,
                          onAgeOrDobChanged: (value) {
                            setState(() {
                              selectedAgeOrDob = value;
                              if (value == AgeOrDob.age) {
                                dobController.clear();
                                selectedDate = null;
                              } else if (value == AgeOrDob.dob) {
                                ageController.clear();
                              }
                            });
                            _invalidateFormValidationCache();
                          },
                          ageController: ageController,
                          dobController: dobController,
                          selectedDate: selectedDate,
                          onDateChanged: (date) {
                            setState(() {
                              selectedDate = date;
                            });
                            _invalidateFormValidationCache();
                          },
                          nameValidator: _validateName,
                        ),
                        ContactInformationWidget(
                          emailController: emailController,
                          phoneController: phoneController,
                          selectedCountryCode: selectedCountryCode,
                          onCountryCodeChanged: (countryCode) {
                            setState(() {
                              selectedCountryCode = countryCode;
                            });
                            _invalidateFormValidationCache();
                          },
                          onPhoneNumberChanged: (phoneNumber) {
                            phoneController.text = phoneNumber;
                            _invalidateFormValidationCache();
                          },
                          emailValidator: _validateEmail,
                          phoneValidator: _validateContactNumber,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 20),
                  // Right Column - Address & Location Information
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        AddressInformationWidget(
                          addressController: addressController,
                          pincodeController: pincodeController,
                        ),
                        LocationLanguageWidget(
                          selectedLanguage: selectedLanguage,
                          onLanguageChanged: (value) {
                            setState(() {
                              selectedLanguage = value;
                              _languageManuallySelected = true;
                            });
                            _invalidateFormValidationCache();
                          },
                          selectedCountry: selectedCountry,
                          onCountryChanged: (value) {
                            setState(() {
                              selectedCountry = value;
                              _countryManuallySelected = true;
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
                          selectedState: selectedState,
                          onStateChanged: (value) {
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
                          selectedDistrict: selectedDistrict,
                          onDistrictChanged: (value) {
                            setState(() {
                              selectedDistrict = value;
                              selectedCity = null;
                            });
                            if (value != null) {
                              context.read<LookupCubit>().getCities(
                                value.id ?? "",
                              );
                            }
                          },
                          selectedCity: selectedCity,
                          onCityChanged: (value) {
                            setState(() {
                              selectedCity = value;
                            });
                          },
                          languageValidator: _validateLanguage,
                          onLocationEntitiesSet: () {
                            _setLocationEntitiesFromPatient(
                              context.read<LookupCubit>().state,
                            );
                            // Invalidate cache and update form validation state
                            _invalidateFormValidationCache();
                            _updateFormValidationState();
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          // Submit Button
          FormSubmitButtonWidget(
            isFormValid: _isFormValidState,
            onSubmitPressed: submitPatient,
          ),
        ],
      ),
    );
  }
}
