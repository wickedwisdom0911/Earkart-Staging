import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/dimensions.dart';
import 'package:earkart_omni/config/utils/text_styles.dart';
import 'package:figma_squircle/figma_squircle.dart';
import 'package:flutter/material.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';

class CitySelector extends StatelessWidget {
  final CityEntity? value;
  final ValueChanged<CityEntity?> onChanged;
  final String? label;
  final String? title;
  final bool enabled;
  final String? errorText;
  final List<CityEntity> items;

  const CitySelector({
    Key? key,
    required this.value,
    required this.onChanged,
    required this.items,
    this.label,
    this.title,
    this.enabled = true,
    this.errorText,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 4.0),
            child: Text(title!, style: CustomStyles.titleTextStyle),
          ),
        DropdownButtonFormField<CityEntity>(
          value: value,
          onChanged: enabled ? onChanged : null,
          decoration: InputDecoration(
            floatingLabelBehavior: FloatingLabelBehavior.never,
            hintText: label ?? 'City',
            hintStyle: CustomStyles.mediumBodyTextStyle.copyWith(
              color: Colors.grey.withOpacity(0.7),
            ),
            filled: true,
            fillColor: Constants.bg,
            contentPadding: EdgeInsets.only(top: 0, left: 12),
            border: OutlineInputBorder(
              borderRadius: SmoothBorderRadius(
                cornerRadius: Dimensions.height5 * 3,
                cornerSmoothing: 1,
              ),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: SmoothBorderRadius(
                cornerRadius: Dimensions.height5 * 3,
                cornerSmoothing: 1,
              ),
              borderSide: BorderSide.none,
            ),
            errorText: errorText,
          ),
          icon: const Icon(Icons.arrow_drop_down_rounded, size: 28),
          dropdownColor: Colors.white,
          style: CustomStyles.mediumBodyTextStyle.copyWith(
            color: Colors.grey[900],
          ),
          items:
              items.map((city) {
                return DropdownMenuItem<CityEntity>(
                  value: city,
                  child: Text(city.name),
                );
              }).toList(),
        ),
      ],
    );
  }
}
