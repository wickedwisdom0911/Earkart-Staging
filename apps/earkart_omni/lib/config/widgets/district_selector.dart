import 'package:flutter/material.dart';
import 'package:earkart_omni/config/widgets/searchable_dropdown_dialog.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';

class DistrictSelector extends StatefulWidget {
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
  State<DistrictSelector> createState() => _DistrictSelectorState();
}

class _DistrictSelectorState extends State<DistrictSelector> {
  bool _isFocused = false;

  DistrictEntity? _getValidValue() {
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
                        await SearchableDropdownDialog.show<DistrictEntity>(
                          context: context,
                          items: widget.items,
                          getLabel: (district) => district.name,
                          title: widget.title ?? 'Select District',
                          searchHint: 'Search districts...',
                          selectedValue: _getValidValue(),
                          compareItems: (a, b) => b != null && a.id == b.id,
                        );
                    if (selected != null) {
                      widget.onChanged(selected);
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
            child: InputDecorator(
              decoration: InputDecoration(
                hintText: widget.label ?? 'Select district...',
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
                errorText: widget.errorText,
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
