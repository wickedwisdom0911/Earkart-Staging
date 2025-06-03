import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/dimensions.dart';
import 'package:earkart_omni/config/utils/text_styles.dart';
import 'package:figma_squircle/figma_squircle.dart';
import 'package:flutter/material.dart';
import 'package:earkart_omni/models/enums.dart';

class GenderSelector extends StatelessWidget {
  final Gender? value;
  final ValueChanged<Gender?> onChanged;
  final String? label;
  final String? title;
  final bool enabled;
  final String? errorText;

  const GenderSelector({
    super.key,
    required this.value,
    required this.onChanged,
    this.label,
    this.title,
    this.enabled = true,
    this.errorText,
  });

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
        DropdownButtonFormField<Gender>(
          value: value,
          onChanged: enabled ? onChanged : null,
          decoration: InputDecoration(
            floatingLabelBehavior: FloatingLabelBehavior.never,
            hintText: label ?? 'Gender',
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
              Gender.values.map((gender) {
                return DropdownMenuItem<Gender>(
                  value: gender,
                  child: Row(
                    children: [
                      _genderIcon(gender),
                      const SizedBox(width: 10),
                      Text(_genderToString(gender)),
                    ],
                  ),
                );
              }).toList(),
        ),
      ],
    );
  }

  String _genderToString(Gender gender) {
    switch (gender) {
      case Gender.male:
        return 'Male';
      case Gender.female:
        return 'Female';
      case Gender.other:
        return 'Other';
    }
  }

  Icon _genderIcon(Gender gender) {
    switch (gender) {
      case Gender.male:
        return const Icon(Icons.male, color: Colors.blueAccent);
      case Gender.female:
        return const Icon(Icons.female, color: Colors.pinkAccent);
      case Gender.other:
        return const Icon(Icons.transgender, color: Colors.purple);
    }
  }
}
