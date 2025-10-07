import 'package:flutter/material.dart';
import 'package:earkart_omni/features/patients/presentation/pages/patient_form_screen.dart';

class AgeOrDobSelector extends StatefulWidget {
  final AgeOrDob? value;
  final ValueChanged<AgeOrDob?> onChanged;
  final String? title;
  final bool enabled;
  final String? errorText;
  final bool hideAfterSelection;

  const AgeOrDobSelector({
    super.key,
    required this.value,
    required this.onChanged,
    this.title,
    this.enabled = true,
    this.errorText,
    this.hideAfterSelection = false,
  });

  @override
  State<AgeOrDobSelector> createState() => _AgeOrDobSelectorState();
}

class _AgeOrDobSelectorState extends State<AgeOrDobSelector> {
  String _ageOrDobToString(AgeOrDob ageOrDob) {
    switch (ageOrDob) {
      case AgeOrDob.age:
        return 'Enter Age';
      case AgeOrDob.dob:
        return 'Enter Date of Birth';
    }
  }

  Icon _ageOrDobIcon(AgeOrDob ageOrDob, {bool isSelected = false}) {
    switch (ageOrDob) {
      case AgeOrDob.age:
        return Icon(
          Icons.cake_rounded,
          color: isSelected ? Colors.orange.shade700 : Colors.grey.shade600,
          size: 20,
        );
      case AgeOrDob.dob:
        return Icon(
          Icons.calendar_today_rounded,
          color: isSelected ? Colors.green.shade700 : Colors.grey.shade600,
          size: 20,
        );
    }
  }

  Color _getAgeOrDobColor(AgeOrDob ageOrDob) {
    // Unselected state - always neutral
    return Colors.grey.shade50;
  }

  Color _getAgeOrDobBorderColor(AgeOrDob ageOrDob) {
    switch (ageOrDob) {
      case AgeOrDob.age:
        return Colors.orange.shade400;
      case AgeOrDob.dob:
        return Colors.green.shade400;
    }
  }

  Color _getSelectedAgeOrDobColor(AgeOrDob ageOrDob) {
    switch (ageOrDob) {
      case AgeOrDob.age:
        return Colors.orange.shade100;
      case AgeOrDob.dob:
        return Colors.green.shade100;
    }
  }

  @override
  Widget build(BuildContext context) {
    // If hideAfterSelection is true and a value is selected, don't show the selector
    if (widget.hideAfterSelection && widget.value != null) {
      return const SizedBox.shrink();
    }

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

        // Radio choice containers
        Row(
          children:
              AgeOrDob.values.map((ageOrDob) {
                final isSelected = widget.value == ageOrDob;
                return Expanded(
                  child: GestureDetector(
                    onTap:
                        widget.enabled
                            ? () => widget.onChanged(ageOrDob)
                            : null,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      curve: Curves.easeInOut,
                      margin: const EdgeInsets.only(right: 8),
                      padding: const EdgeInsets.symmetric(
                        vertical: 12,
                        horizontal: 16,
                      ),
                      transform:
                          Matrix4.identity()..scale(isSelected ? 1.02 : 1.0),
                      decoration: BoxDecoration(
                        color:
                            isSelected
                                ? _getSelectedAgeOrDobColor(ageOrDob)
                                : _getAgeOrDobColor(ageOrDob),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color:
                              isSelected
                                  ? _getAgeOrDobBorderColor(ageOrDob)
                                  : Colors.grey.shade300,
                          width: isSelected ? 2.0 : 1.0,
                        ),
                        boxShadow:
                            isSelected
                                ? [
                                  BoxShadow(
                                    color: _getAgeOrDobBorderColor(
                                      ageOrDob,
                                    ).withOpacity(0.3),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ]
                                : null,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _ageOrDobIcon(ageOrDob, isSelected: isSelected),
                          const SizedBox(width: 8),
                          Text(
                            _ageOrDobToString(ageOrDob),
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight:
                                  isSelected
                                      ? FontWeight.w600
                                      : FontWeight.w500,
                              color:
                                  isSelected
                                      ? _getAgeOrDobBorderColor(ageOrDob)
                                      : Colors.grey.shade500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }).toList(),
        ),

        // Error text
        if (widget.errorText != null) ...[
          const SizedBox(height: 4),
          Text(
            widget.errorText!,
            style: TextStyle(fontSize: 12, color: Colors.red.shade600),
          ),
        ],
      ],
    );
  }
}
