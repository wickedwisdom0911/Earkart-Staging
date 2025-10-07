import 'package:flutter/material.dart';
import 'package:earkart_omni/models/language/language.entity.dart';

class LanguageSelector extends StatefulWidget {
  final LanguageEntity? value;
  final ValueChanged<LanguageEntity?> onChanged;
  final String? label;
  final String? title;
  final bool enabled;
  final String? errorText;
  final String? Function(LanguageEntity?)? validator;
  final List<LanguageEntity> items;

  const LanguageSelector({
    super.key,
    required this.value,
    required this.onChanged,
    required this.items,
    this.label,
    this.title,
    this.enabled = true,
    this.errorText,
    this.validator,
  });

  @override
  State<LanguageSelector> createState() => _LanguageSelectorState();
}

class _LanguageSelectorState extends State<LanguageSelector> {
  bool _isFocused = false;
  String? _errorText;

  @override
  void initState() {
    super.initState();
    _updateErrorText();
  }

  @override
  void didUpdateWidget(LanguageSelector oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value ||
        oldWidget.validator != widget.validator) {
      _updateErrorText();
    }
  }

  void _updateErrorText() {
    if (widget.validator != null) {
      setState(() {
        _errorText = widget.validator!(widget.value);
      });
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
              color:
                  _errorText != null
                      ? Colors.red.shade500
                      : _isFocused
                      ? Colors.blue.shade500
                      : Colors.grey.shade200,
              width: _errorText != null || _isFocused ? 2.0 : 1.0,
            ),
            boxShadow:
                _isFocused
                    ? [
                      BoxShadow(
                        color:
                            _errorText != null
                                ? Colors.red.shade100
                                : Colors.blue.shade100,
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ]
                    : null,
          ),
          child: DropdownButtonFormField<LanguageEntity>(
            value: widget.value,
            onChanged:
                widget.enabled
                    ? (value) {
                      widget.onChanged(value);
                      _updateErrorText();
                    }
                    : null,
            decoration: InputDecoration(
              hintText: widget.label ?? 'Select language...',
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
              errorText: _errorText ?? widget.errorText,
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
                widget.items.map((lang) {
                  return DropdownMenuItem<LanguageEntity>(
                    value: lang,
                    child: Text(
                      lang.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w400,
                        color: Colors.black87,
                      ),
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
