import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/dimensions.dart';
import 'package:earkart_omni/config/utils/text_styles.dart';
import 'package:figma_squircle/figma_squircle.dart';
import 'package:flutter/material.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';

class DistrictSelector extends StatelessWidget {
  final DistrictEntity? value;
  final ValueChanged<DistrictEntity?> onChanged;
  final String? label;
  final String? title;
  final bool enabled;
  final String? errorText;
  final List<DistrictEntity> items;

  const DistrictSelector({
    super.key,
    required this.value,
    required this.onChanged,
    required this.items,
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
        DropdownButtonFormField<DistrictEntity>(
          value: value,
          onChanged: enabled ? onChanged : null,
          decoration: InputDecoration(
            floatingLabelBehavior: FloatingLabelBehavior.never,
            hintText: label ?? 'District',
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
              items.map((district) {
                return DropdownMenuItem<DistrictEntity>(
                  value: district,
                  child: Text(district.name),
                );
              }).toList(),
        ),
      ],
    );
  }
}
