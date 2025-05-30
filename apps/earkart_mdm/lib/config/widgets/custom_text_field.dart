import 'package:earkart_mdm/config/utils/constants.dart';
import 'package:earkart_mdm/config/utils/dimensions.dart';
import 'package:earkart_mdm/config/utils/text_styles.dart';
import 'package:figma_squircle/figma_squircle.dart';
import 'package:flutter/material.dart';

class CustomTextField extends StatefulWidget {
  final TextEditingController? controller;
  final FormFieldValidator<String>? validator;
  final TextInputType? keyboardType;
  final FocusNode? focusNode;
  final bool? obsecure;
  final String hint;
  final Function(String)? onChanged;
  final Function(String)? onSubmit;
  final String? label, title;
  final double? height;
  final double? width;
  final double? topPading;
  final int? maxLines, minLines;
  final int? maxLength;
  final Widget? suffix;
  final Widget? prefix;
  final String? initialValue;
  final Function()? onTap;
  final bool? readOnly, autofocus;
  final Color? fillcolor, titleColor;
  const CustomTextField({
    Key? key,
    this.controller,
    this.validator,
    this.keyboardType,
    this.obsecure,
    required this.hint,
    this.onChanged,
    this.onSubmit,
    this.label,
    this.height,
    this.suffix,
    this.prefix,
    this.initialValue,
    this.onTap,
    this.readOnly,
    this.focusNode,
    this.maxLines,
    this.minLines,
    this.maxLength,
    this.topPading,
    this.width,
    this.autofocus,
    this.title,
    this.fillcolor,
    this.titleColor,
  }) : super(key: key);

  @override
  State<CustomTextField> createState() => _CustomTextFieldState();
}

class _CustomTextFieldState extends State<CustomTextField> {
  bool _showPassword = true;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.title != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 4.0),
            child: Text(
              widget.title.toString(),
              style: CustomStyles.smallTitleTextStyle.copyWith(
                color: widget.titleColor,
              ),
            ),
          ),
        TextFormField(
          autofocus: widget.autofocus ?? false,
          focusNode: widget.focusNode,
          readOnly: widget.readOnly ?? false,
          onTap: widget.onTap,
          initialValue: widget.initialValue,
          controller: widget.controller,
          onFieldSubmitted: widget.onSubmit,
          onChanged: widget.onChanged,
          maxLines: widget.maxLines ?? 1,
          minLines: widget.minLines,
          maxLength: widget.maxLength,
          obscureText: widget.obsecure == null ? false : _showPassword,
          keyboardType: widget.keyboardType,
          expands: false,
          autocorrect: false,
          decoration: InputDecoration(
            prefixIconColor: Colors.grey.withOpacity(0.7),
            suffixIconColor: Colors.grey.withOpacity(0.7),
            fillColor: widget.fillcolor ?? Constants.bg,
            filled: true,
            contentPadding: EdgeInsets.only(
              top: widget.topPading ?? 0,
              left: 12,
            ),
            suffixIcon: GestureDetector(
              child: (() {
                if (widget.label == "Password" ||
                    widget.label == "Create Password" ||
                    widget.label == "New Password" ||
                    widget.label == "Confirm Password") {
                  return _showPassword
                      ? const Icon(
                        Icons.visibility_off,
                        color: Colors.grey,
                        size: 25,
                      )
                      : const Icon(
                        Icons.visibility,
                        color: Constants.primaryColor,
                        size: 25,
                      );
                }
                if (widget.suffix != null) {
                  return widget.suffix;
                } else {
                  return const Icon(
                    Icons.circle_rounded,
                    color: Colors.transparent,
                  );
                }
              }()),
              onTap: () {
                widget.label?.contains("Password") ?? false
                    ? setState(() {
                      _showPassword = !_showPassword;
                    })
                    : _showPassword = false;
              },
            ),
            prefixIcon: widget.prefix,
            floatingLabelBehavior: FloatingLabelBehavior.never,
            hintText: widget.hint,
            hintStyle: CustomStyles.mediumBodyTextStyle.copyWith(
              color: Colors.grey.withOpacity(0.7),
            ),
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
          ),
        ),
      ],
    );
  }
}
