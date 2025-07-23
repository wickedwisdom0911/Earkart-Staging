import 'package:flutter/material.dart';
import 'package:earkart_omni/models/enums.dart';

class GenderSelector extends StatefulWidget {
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
  State<GenderSelector> createState() => _GenderSelectorState();
}

class _GenderSelectorState extends State<GenderSelector> {
  bool _isFocused = false;

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
        return Icon(Icons.male_rounded, color: Colors.blue.shade600, size: 20);
      case Gender.female:
        return Icon(
          Icons.female_rounded,
          color: Colors.pink.shade600,
          size: 20,
        );
      case Gender.other:
        return Icon(
          Icons.person_rounded,
          color: Colors.grey.shade600,
          size: 20,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Modern title/label
        if (widget.title != null) ...[
          Text(
            widget.title!,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade700,
              letterSpacing: 0.1,
            ),
          ),
          const SizedBox(height: 8),
        ],

        // Modern dropdown field
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: _isFocused ? Colors.blue.shade500 : Colors.grey.shade200,
              width: _isFocused ? 2.0 : 1.0,
            ),
            boxShadow:
                _isFocused
                    ? [
                      BoxShadow(
                        color: Colors.blue.shade100,
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ]
                    : null,
          ),
          child: DropdownButtonFormField<Gender>(
            value: widget.value,
            onChanged: widget.enabled ? widget.onChanged : null,
            decoration: InputDecoration(
              hintText: widget.label ?? 'Select gender...',
              hintStyle: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w400,
                color: Colors.grey.shade500,
                height: 1.4,
              ),
              filled: true,
              fillColor: Colors.grey.shade50,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 8,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              errorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              focusedErrorBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              errorText: widget.errorText,
              isDense: true,
            ),
            icon: Icon(
              Icons.keyboard_arrow_down_rounded,
              color: Colors.grey.shade600,
              size: 24,
            ),
            dropdownColor: Colors.white,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w400,
              color: Colors.black87,
              height: 1.4,
            ),
            items:
                Gender.values.map((gender) {
                  return DropdownMenuItem<Gender>(
                    value: gender,
                    child: Row(
                      children: [
                        _genderIcon(gender),
                        const SizedBox(width: 12),
                        Text(
                          _genderToString(gender),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w400,
                            color: Colors.black87,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
            onTap: () {
              setState(() {
                _isFocused = true;
              });
            },
          ),
        ),
      ],
    );
  }
}
