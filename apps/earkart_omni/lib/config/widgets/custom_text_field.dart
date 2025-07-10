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
  final int? maxLines, minLines;
  final int? maxLength;
  final Widget? suffix;
  final Widget? prefix;
  final String? initialValue;
  final Function()? onTap;
  final bool? readOnly, autofocus;
  final Color? fillcolor, titleColor;
  final bool? enabled;

  const CustomTextField({
    super.key,
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
    this.width,
    this.autofocus,
    this.title,
    this.fillcolor,
    this.titleColor,
    this.enabled,
  });

  @override
  State<CustomTextField> createState() => _CustomTextFieldState();
}

class _CustomTextFieldState extends State<CustomTextField>
    with TickerProviderStateMixin {
  bool _showPassword = false;
  bool _isFocused = false;
  AnimationController? _animationController;
  Animation<double>? _focusAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _focusAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController!, curve: Curves.easeInOut),
    );

    widget.focusNode?.addListener(_onFocusChange);
  }

  @override
  void dispose() {
    widget.focusNode?.removeListener(_onFocusChange);
    _animationController?.dispose();
    super.dispose();
  }

  void _onFocusChange() {
    setState(() {
      _isFocused = widget.focusNode?.hasFocus ?? false;
    });

    if (_isFocused) {
      _animationController?.forward();
    } else {
      _animationController?.reverse();
    }
  }

  bool get _isPasswordField {
    return widget.obsecure == true ||
        widget.label?.toLowerCase().contains('password') == true ||
        widget.hint.toLowerCase().contains('password');
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.width,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Modern title/label
          if (widget.title != null) ...[
            Text(
              widget.title!,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: widget.titleColor ?? Colors.grey.shade700,
                letterSpacing: 0.1,
              ),
            ),
            const SizedBox(height: 8),
          ],

          // Modern text field
          _buildTextField(),
        ],
      ),
    );
  }

  Widget _buildTextField() {
    // If animations aren't initialized yet, build without animations
    if (_animationController == null || _focusAnimation == null) {
      return _buildTextFieldContainer();
    }

    return AnimatedBuilder(
      animation: _focusAnimation!,
      builder: (context, child) {
        return _buildTextFieldContainer();
      },
    );
  }

  Widget _buildTextFieldContainer() {
    return Container(
      height: widget.height ?? 56,
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
      child: TextFormField(
        enabled: widget.enabled,
        autofocus: widget.autofocus ?? false,
        focusNode: widget.focusNode,
        readOnly: widget.readOnly ?? false,
        onTap: widget.onTap,
        initialValue: widget.initialValue,
        controller: widget.controller,
        validator: widget.validator,
        onFieldSubmitted: widget.onSubmit,
        onChanged: widget.onChanged,
        maxLines: widget.maxLines ?? 1,
        minLines: widget.minLines,
        maxLength: widget.maxLength,
        obscureText: _isPasswordField ? !_showPassword : false,
        keyboardType: widget.keyboardType,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: Colors.black87,
          height: 1.4,
        ),
        decoration: InputDecoration(
          hintText: widget.hint,
          hintStyle: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w400,
            color: Colors.grey.shade500,
            height: 1.4,
          ),
          filled: true,
          fillColor: widget.fillcolor ?? Colors.grey.shade50,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 16,
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
          // Prefix icon
          prefixIcon:
              widget.prefix != null
                  ? Padding(
                    padding: const EdgeInsets.only(left: 4, right: 8),
                    child: widget.prefix,
                  )
                  : null,
          prefixIconConstraints: const BoxConstraints(
            minWidth: 44,
            minHeight: 44,
          ),
          // Suffix icon
          suffixIcon: _buildSuffixIcon(),
          suffixIconConstraints: const BoxConstraints(
            minWidth: 44,
            minHeight: 44,
          ),
        ),
      ),
    );
  }

  Widget? _buildSuffixIcon() {
    if (_isPasswordField) {
      return IconButton(
        icon: AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: Icon(
            _showPassword
                ? Icons.visibility_off_outlined
                : Icons.visibility_outlined,
            key: ValueKey(_showPassword),
            color: Colors.grey.shade600,
            size: 20,
          ),
        ),
        onPressed: () {
          setState(() {
            _showPassword = !_showPassword;
          });
        },
        constraints: const BoxConstraints(minWidth: 44, minHeight: 44),
        padding: const EdgeInsets.all(12),
      );
    }

    return widget.suffix != null
        ? Padding(
          padding: const EdgeInsets.only(left: 8, right: 4),
          child: widget.suffix,
        )
        : null;
  }
}
