import 'package:earkart_omni/config/widgets/custom_text_field.dart';
import 'package:earkart_omni/config/widgets/gender_selector.dart';
import 'package:earkart_omni/config/widgets/helpers.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:flutter/material.dart';

class PatientFormScreen extends StatefulWidget {
  const PatientFormScreen({super.key});
  static const routeName = "/patient-form";
  @override
  State<PatientFormScreen> createState() => _PatientFormScreenState();
}

class _PatientFormScreenState extends State<PatientFormScreen> {
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
            CustomTextField(hint: "Enter Patient Name", title: "Patient name"),
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
                  ),
                ),
                addHorizontalSpace(20),
                Expanded(
                  child: CustomTextField(
                    hint: "Enter Patient Phone Number",
                    title: "Patient phone number ",
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
                  ),
                ),
                addHorizontalSpace(20),
                Expanded(
                  child: CustomTextField(hint: "Pincode", title: "Pincode"),
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
                    value: Gender.male,
                    onChanged: (value) {},
                  ),
                ),
                addHorizontalSpace(20),
                Expanded(
                  child: CustomTextField(
                    hint: "Enter Patient Date of Birth",
                    title: "Patient date of birth",
                    readOnly: true,
                    onTap: () {
                      showDatePicker(
                        context: context,
                        firstDate: DateTime(1900),
                        lastDate: DateTime.now(),
                      ).then((value) {
                        if (value != null) {}
                      });
                    },
                  ),
                ),
              ],
            ),
            addVerticalSpace(20),
          ],
        ),
      ),
    );
  }
}
