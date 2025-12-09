import 'package:flutter/material.dart';
import 'package:earkart_omni/config/widgets/searchable_dropdown_dialog.dart';
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
    // Set English as default if no value is selected and items are available
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _setDefaultLanguageIfNeeded();
    });
  }

  @override
  void didUpdateWidget(LanguageSelector oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.value != widget.value ||
        oldWidget.validator != widget.validator) {
      _updateErrorText();
    }
    // Set English as default if no value is selected and items are available
    if (widget.value == null &&
        widget.items.isNotEmpty &&
        oldWidget.items.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _setDefaultLanguageIfNeeded();
      });
    }
  }

  /// Sets English as the default language if no language is currently selected
  void _setDefaultLanguageIfNeeded() {
    // Only set default if no value is selected and items are available
    if (widget.value == null && widget.items.isNotEmpty) {
      LanguageEntity? englishLanguage;

      // Try to find English by code (EN)
      try {
        englishLanguage = widget.items.firstWhere(
          (lang) => lang.code.toUpperCase() == 'EN',
        );
      } catch (e) {
        // Try alternative codes
        try {
          englishLanguage = widget.items.firstWhere(
            (lang) =>
                lang.code.toUpperCase() == 'ENG' ||
                lang.name.toUpperCase().contains('ENGLISH'),
          );
        } catch (e2) {
          // If English not found, use first language as fallback
          englishLanguage = widget.items.isNotEmpty ? widget.items.first : null;
        }
      }

      // Set the default language
      if (englishLanguage != null) {
        widget.onChanged(englishLanguage);
      }
    }
  }

  void _updateErrorText() {
    if (widget.validator != null) {
      setState(() {
        _errorText = widget.validator!(widget.value);
      });
    }
  }

  LanguageEntity? _getValidValue() {
    // Only return the value if it exists in the items list
    if (widget.value != null && widget.items.isNotEmpty) {
      try {
        return widget.items.firstWhere((item) => item.id == widget.value!.id);
      } catch (e) {
        // Value not found in items, return null
        return null;
      }
    }
    return null;
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

        // Searchable dropdown field
        GestureDetector(
          onTap:
              widget.enabled
                  ? () async {
                    setState(() {
                      _isFocused = true;
                    });
                    final selected =
                        await SearchableDropdownDialog.show<LanguageEntity>(
                          context: context,
                          items: widget.items,
                          getLabel: (lang) => lang.name,
                          title: widget.title ?? 'Select Language',
                          searchHint: 'Search languages...',
                          selectedValue: _getValidValue(),
                          compareItems: (a, b) => b != null && a.id == b.id,
                        );
                    if (selected != null) {
                      widget.onChanged(selected);
                      _updateErrorText();
                    }
                    setState(() {
                      _isFocused = false;
                    });
                  }
                  : null,
          child: Container(
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
            child: InputDecorator(
              decoration: InputDecoration(
                hintText: widget.label ?? 'Select language...',
                hintStyle: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                  color: Colors.grey.shade500,
                  height: 1.4,
                ),
                filled: true,
                fillColor:
                    widget.enabled ? Colors.grey.shade50 : Colors.grey.shade100,
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
                suffixIcon: Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: Colors.grey.shade600,
                  size: 24,
                ),
              ),
              child:
                  _getValidValue() != null
                      ? Text(
                        _getValidValue()!.name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w400,
                          color: Colors.black87,
                          height: 1.4,
                        ),
                      )
                      : const SizedBox.shrink(),
            ),
          ),
        ),
      ],
    );
  }
}
