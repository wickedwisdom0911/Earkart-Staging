import 'package:flutter/material.dart';
import 'package:earkart_omni/config/constants/country_codes.dart';

class CountryCodeSelector extends StatefulWidget {
  final String selectedCountryCode;
  final Function(String) onCountryCodeChanged;
  final String? title;

  const CountryCodeSelector({
    super.key,
    required this.selectedCountryCode,
    required this.onCountryCodeChanged,
    this.title,
  });

  @override
  State<CountryCodeSelector> createState() => _CountryCodeSelectorState();
}

class _CountryCodeSelectorState extends State<CountryCodeSelector> {
  bool _isFocused = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
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
        GestureDetector(
          onTap: () => _showCountryCodePicker(context),
          child: Container(
            height: 56,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _isFocused ? Colors.blue.shade500 : Colors.grey.shade200,
                width: _isFocused ? 2.0 : 1.0,
              ),
              color: Colors.grey.shade50,
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
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _getSelectedCountryFlag(),
                  style: const TextStyle(fontSize: 20),
                ),
                const SizedBox(width: 8),
                Text(
                  widget.selectedCountryCode,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(width: 4),
                Icon(
                  Icons.arrow_drop_down,
                  color: Colors.grey.shade600,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  String _getSelectedCountryFlag() {
    final country = CountryCodes.getByCode(widget.selectedCountryCode);
    return country?.flag ?? '🇺🇸';
  }

  void _showCountryCodePicker(BuildContext context) {
    setState(() {
      _isFocused = true;
    });

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder:
          (context) => Container(
            height: MediaQuery.of(context).size.height * 0.7,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Column(
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    border: Border(
                      bottom: BorderSide(color: Colors.grey.shade200),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Text(
                        'Select Country Code',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        onPressed: () {
                          Navigator.pop(context);
                          setState(() {
                            _isFocused = false;
                          });
                        },
                        icon: const Icon(Icons.close),
                        color: Colors.grey.shade600,
                      ),
                    ],
                  ),
                ),
                // Country List
                Expanded(
                  child: ListView.builder(
                    itemCount: CountryCodes.codes.length,
                    itemBuilder: (context, index) {
                      final country = CountryCodes.codes[index];
                      final isSelected =
                          country.code == widget.selectedCountryCode;

                      return InkWell(
                        onTap: () {
                          widget.onCountryCodeChanged(country.code);
                          Navigator.pop(context);
                          setState(() {
                            _isFocused = false;
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 16,
                          ),
                          decoration: BoxDecoration(
                            color:
                                isSelected
                                    ? Colors.blue.shade50
                                    : Colors.transparent,
                            border: Border(
                              bottom: BorderSide(
                                color: Colors.grey.shade100,
                                width: 0.5,
                              ),
                            ),
                          ),
                          child: Row(
                            children: [
                              Text(
                                country.flag,
                                style: const TextStyle(fontSize: 24),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      country.name,
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w500,
                                        color:
                                            isSelected
                                                ? Colors.blue.shade700
                                                : Colors.black87,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      country.code,
                                      style: TextStyle(
                                        fontSize: 14,
                                        color: Colors.grey.shade600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (isSelected) ...[
                                Icon(
                                  Icons.check_circle,
                                  color: Colors.blue.shade600,
                                  size: 20,
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
    ).then((_) {
      setState(() {
        _isFocused = false;
      });
    });
  }
}
