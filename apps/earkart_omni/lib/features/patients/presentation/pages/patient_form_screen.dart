import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/config/utils/text_styles.dart';
import 'package:earkart_omni/config/widgets/custom_text_field.dart';
import 'package:earkart_omni/config/widgets/gender_selector.dart';
import 'package:earkart_omni/config/widgets/gradient_button.dart';
import 'package:earkart_omni/config/widgets/helpers.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/lookup/presentation/cubit/lookup.cubit.dart';
import 'package:earkart_omni/features/lookup/presentation/cubit/lookup.state.dart';
import 'package:earkart_omni/features/patients/presentation/cubit/patient.cubit.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/language/language.entity.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
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
  Gender selectedGender = Gender.male;

  @override
  void initState() {
    super.initState();
    final lookupCubit = context.read<LookupCubit>();
    lookupCubit.getLanguages();
    lookupCubit.getCountries();
  }

  void submitPatient() {
    final patient = PatientEntity(
      contactNumber: phoneController.text,
      code: "AAAAAA",
      name: nameController.text,
      gender: selectedGender,
      dob: dobController.text,
      password: "",
      address: addressController.text,
      districtId: selectedDistrict?.id ?? "",
      pincode: pincodeController.text,
      email: emailController.text,
      status: Status.active,
      languageId: selectedLanguage?.id ?? "",
    );
    di<ILogger>().info(patient.toJson().toString());
    context.read<PatientCubit>().createPatient(patient);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Patient Form")),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20.0),
        child: ListView(
          shrinkWrap: true,
          children: [
            addVerticalSpace(30),
            CustomTextField(
              hint: "Enter Patient Name",
              title: "Patient name",
              controller: nameController,
            ),
            addVerticalSpace(20),
            Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: CustomTextField(
                    hint: "Enter Patient Email",
                    title: "Patient email",
                    controller: emailController,
                  ),
                ),
                addHorizontalSpace(20),
                Expanded(
                  child: CustomTextField(
                    hint: "Enter Patient Phone Number",
                    title: "Patient phone number ",
                    controller: phoneController,
                  ),
                ),
              ],
            ),
            addVerticalSpace(20),
            Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: CustomTextField(
                    hint: "Enter Patient Address",
                    title: "Patient address",
                    controller: addressController,
                  ),
                ),
                addHorizontalSpace(20),
                Expanded(
                  child: CustomTextField(
                    hint: "Pincode",
                    title: "Pincode",
                    controller: pincodeController,
                  ),
                ),
              ],
            ),

            addVerticalSpace(20),
            Row(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: GenderSelector(
                    title: "Patient gender",
                    value: selectedGender,
                    onChanged: (value) {
                      setState(() {
                        selectedGender = value ?? Gender.male;
                      });
                    },
                  ),
                ),
                addHorizontalSpace(20),
                Expanded(
                  child: CustomTextField(
                    hint: "Enter Patient Date of Birth",
                    title: "Patient date of birth",
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
                            dobController.text =
                                value.toUtc().toIso8601String();
                          });
                        }
                      });
                    },
                  ),
                ),
              ],
            ),
            addVerticalSpace(20),
            BlocBuilder<LookupCubit, LookupState>(
              builder: (context, state) {
                if (state.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (state.error != null) {
                  return Center(child: Text('Error: ${state.error}'));
                }
                return GridView.count(
                  crossAxisCount: 2,
                  mainAxisSpacing: 20,
                  crossAxisSpacing: 20,
                  shrinkWrap: true,
                  physics: NeverScrollableScrollPhysics(),
                  childAspectRatio: 7.75,
                  children: [
                    LanguageSelector(
                      value: selectedLanguage,
                      onChanged:
                          (value) => setState(() => selectedLanguage = value),
                      items: state.languages,
                      title: "Language",
                    ),
                    CountrySelector(
                      value: selectedCountry,
                      onChanged: (value) {
                        setState(() {
                          selectedCountry = value;
                          selectedState = null;
                          selectedCity = null;
                          selectedDistrict = null;
                        });
                        if (value != null) {
                          context.read<LookupCubit>().getStates(value.id ?? "");
                        }
                      },
                      items: state.countries,
                      title: "Country",
                    ),
                    StateSelector(
                      value: selectedState,
                      onChanged: (value) {
                        setState(() {
                          selectedState = value;
                          selectedCity = null;
                          selectedDistrict = null;
                        });
                        if (value != null) {
                          context.read<LookupCubit>().getCities(value.id ?? "");
                        }
                      },
                      items: state.states,
                      title: "State",
                    ),
                    CitySelector(
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
                    DistrictSelector(
                      value: selectedDistrict,
                      onChanged:
                          (value) => setState(() => selectedDistrict = value),
                      items: state.districts,
                      title: "District",
                    ),
                  ],
                );
              },
            ),
            addVerticalSpace(20),
            GradientButton(
              child: Text(
                "Next",
                style: CustomStyles.titleTextStyle.copyWith(
                  color: Colors.white,
                ),
              ),
              onPressed: () {
                submitPatient();
              },
            ),
            addVerticalSpace(20),
          ],
        ),
      ),
    );
  }
}
