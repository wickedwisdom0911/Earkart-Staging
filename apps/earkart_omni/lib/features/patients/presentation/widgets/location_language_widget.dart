import 'package:earkart_omni/config/widgets/language_selector.dart';
import 'package:earkart_omni/config/widgets/country_selector.dart';
import 'package:earkart_omni/config/widgets/state_selector.dart';
import 'package:earkart_omni/config/widgets/city_selector.dart';
import 'package:earkart_omni/config/widgets/district_selector.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/features/lookup/presentation/cubit/lookup.cubit.dart';
import 'package:earkart_omni/features/lookup/presentation/cubit/lookup.state.dart';
import 'package:earkart_omni/models/language/language.entity.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class LocationLanguageWidget extends StatelessWidget {
  final LanguageEntity? selectedLanguage;
  final ValueChanged<LanguageEntity?> onLanguageChanged;
  final CountryEntity? selectedCountry;
  final ValueChanged<CountryEntity?> onCountryChanged;
  final StateEntity? selectedState;
  final ValueChanged<StateEntity?> onStateChanged;
  final DistrictEntity? selectedDistrict;
  final ValueChanged<DistrictEntity?> onDistrictChanged;
  final CityEntity? selectedCity;
  final ValueChanged<CityEntity?> onCityChanged;
  final String? Function(LanguageEntity?) languageValidator;
  final VoidCallback onLocationEntitiesSet;

  const LocationLanguageWidget({
    super.key,
    required this.selectedLanguage,
    required this.onLanguageChanged,
    required this.selectedCountry,
    required this.onCountryChanged,
    required this.selectedState,
    required this.onStateChanged,
    required this.selectedDistrict,
    required this.onDistrictChanged,
    required this.selectedCity,
    required this.onCityChanged,
    required this.languageValidator,
    required this.onLocationEntitiesSet,
  });

  @override
  Widget build(BuildContext context) {
    return _buildSection(
      title: "Location & Language",
      children: [
        BlocBuilder<LookupCubit, LookupState>(
          builder: (context, state) {
            if (state.isLoading) {
              return _buildLoadingWidget();
            }
            if (state.error != null) {
              return _buildErrorWidget(state.error!);
            }

            // Set location entities from patient data when lookup data is available
            WidgetsBinding.instance.addPostFrameCallback((_) {
              onLocationEntitiesSet();
            });

            return Column(
              children: [
                LanguageSelector(
                  value: selectedLanguage,
                  onChanged: onLanguageChanged,
                  items: state.languages,
                  title: "Preferred Language *",
                  validator: languageValidator,
                ),
                const SizedBox(height: 16),

                // 2x2 Grid for Location Selectors
                _buildLocationSelectors(context, state),
              ],
            );
          },
        ),
      ],
    );
  }

  Widget _buildSection({
    required String title,
    required List<Widget> children,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 16),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Constants.primaryColor,
              letterSpacing: 0.3,
            ),
          ),
        ),
        ...children,
        const SizedBox(height: 20),
      ],
    );
  }

  Widget _buildLoadingWidget() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Constants.accentColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              valueColor: AlwaysStoppedAnimation<Color>(Constants.primaryColor),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            "Loading location data...",
            style: TextStyle(color: Constants.secondaryColor, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorWidget(String error) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Text(
        'Error: $error',
        style: TextStyle(color: Colors.red.shade600, fontSize: 14),
      ),
    );
  }

  Widget _buildLocationSelectors(BuildContext context, LookupState state) {
    return Column(
      children: [
        // First row: Country and State
        Row(
          children: [
            Expanded(
              child: CountrySelector(
                value: selectedCountry,
                onChanged: onCountryChanged,
                items: state.countries,
                title: "Country",
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: StateSelector(
                value: selectedState,
                onChanged: onStateChanged,
                items: state.states,
                title: "State",
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Second row: District and City
        Row(
          children: [
            Expanded(
              child: DistrictSelector(
                value: selectedDistrict,
                onChanged: onDistrictChanged,
                items: state.districts,
                title: "District",
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: CitySelector(
                value: selectedCity,
                onChanged: onCityChanged,
                items: state.cities,
                title: "City",
              ),
            ),
          ],
        ),
      ],
    );
  }
}
