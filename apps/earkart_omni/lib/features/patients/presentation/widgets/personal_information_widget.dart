import 'package:earkart_omni/config/widgets/custom_text_field.dart';
import 'package:earkart_omni/config/widgets/gender_selector.dart';
import 'package:earkart_omni/config/widgets/age_or_dob_selector.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class PersonalInformationWidget extends StatelessWidget {
  final TextEditingController nameController;
  final Gender selectedGender;
  final ValueChanged<Gender?> onGenderChanged;
  final AgeOrDob? selectedAgeOrDob;
  final ValueChanged<AgeOrDob?> onAgeOrDobChanged;
  final TextEditingController ageController;
  final TextEditingController dobController;
  final DateTime? selectedDate;
  final ValueChanged<DateTime?> onDateChanged;
  final String? Function(String?) nameValidator;

  const PersonalInformationWidget({
    super.key,
    required this.nameController,
    required this.selectedGender,
    required this.onGenderChanged,
    required this.selectedAgeOrDob,
    required this.onAgeOrDobChanged,
    required this.ageController,
    required this.dobController,
    required this.selectedDate,
    required this.onDateChanged,
    required this.nameValidator,
  });

  @override
  Widget build(BuildContext context) {
    return _buildSection(
      title: "Personal Information",
      children: [
        CustomTextField(
          hint: "Enter full name",
          title: "Full Name *",
          controller: nameController,
          validator: nameValidator,
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: GenderSelector(
                title: "Gender",
                value: selectedGender,
                onChanged: onGenderChanged,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Age or DOB Selection
        AgeOrDobSelector(
          title: "Age Information *",
          value: selectedAgeOrDob,
          onChanged: onAgeOrDobChanged,
          hideAfterSelection: true,
        ),

        // Show selected choice indicator when hidden
        if (selectedAgeOrDob != null) ...[
          _buildSelectionIndicator(),
          const SizedBox(height: 16),
        ],

        // Conditional Input Field - Only show when selection is made
        if (selectedAgeOrDob != null) ...[
          if (selectedAgeOrDob == AgeOrDob.age)
            CustomTextField(
              hint: "Enter age",
              title: "Age *",
              controller: ageController,
              keyboardType: TextInputType.number,
            )
          else
            CustomTextField(
              hint: "Select date of birth",
              title: "Date of Birth *",
              controller: dobController,
              readOnly: true,
              onTap: () => _showDatePicker(context),
            ),
        ],
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

  Widget _buildSelectionIndicator() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color:
            selectedAgeOrDob == AgeOrDob.age
                ? Colors.orange.shade50
                : Colors.green.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color:
              selectedAgeOrDob == AgeOrDob.age
                  ? Colors.orange.shade200
                  : Colors.green.shade200,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            selectedAgeOrDob == AgeOrDob.age
                ? Icons.cake_rounded
                : Icons.calendar_today_rounded,
            size: 16,
            color:
                selectedAgeOrDob == AgeOrDob.age
                    ? Colors.orange.shade600
                    : Colors.green.shade600,
          ),
          const SizedBox(width: 8),
          Text(
            selectedAgeOrDob == AgeOrDob.age
                ? "Entering Age"
                : "Entering Date of Birth",
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color:
                  selectedAgeOrDob == AgeOrDob.age
                      ? Colors.orange.shade700
                      : Colors.green.shade700,
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () => onAgeOrDobChanged(null),
            child: Icon(
              Icons.close_rounded,
              size: 16,
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }

  void _showDatePicker(BuildContext context) {
    showDatePicker(
      context: context,
      firstDate: DateTime(1900),
      initialEntryMode: DatePickerEntryMode.calendarOnly,
      lastDate: DateTime.now(),
    ).then((value) {
      if (value != null) {
        onDateChanged(value);
        dobController.text = DateFormat('dd/MM/yyyy').format(value);
      }
    });
  }
}
