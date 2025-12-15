import 'package:flutter/material.dart';

/// A reusable searchable dropdown dialog widget
///
/// This widget displays a searchable list of items in a dialog.
/// Users can search through items by typing in the search field.
class SearchableDropdownDialog<T> extends StatefulWidget {
  final List<T> items;
  final String Function(T) getLabel;
  final String title;
  final String hintText;
  final String searchHint;
  final T? selectedValue;
  final Function(T) onItemSelected;
  final bool Function(T, T?)? compareItems;

  const SearchableDropdownDialog({
    super.key,
    required this.items,
    required this.getLabel,
    required this.title,
    required this.hintText,
    required this.searchHint,
    this.selectedValue,
    required this.onItemSelected,
    this.compareItems,
  });

  @override
  State<SearchableDropdownDialog<T>> createState() =>
      _SearchableDropdownDialogState<T>();

  /// Show the searchable dropdown dialog
  static Future<T?> show<T>({
    required BuildContext context,
    required List<T> items,
    required String Function(T) getLabel,
    required String title,
    String hintText = 'Search...',
    String searchHint = 'Type to search...',
    T? selectedValue,
    bool Function(T, T?)? compareItems,
  }) async {
    T? result;
    await showDialog<T>(
      context: context,
      builder:
          (context) => SearchableDropdownDialog<T>(
            items: items,
            getLabel: getLabel,
            title: title,
            hintText: hintText,
            searchHint: searchHint,
            selectedValue: selectedValue,
            onItemSelected: (item) {
              result = item;
              Navigator.of(context).pop(item);
            },
            compareItems: compareItems,
          ),
    );
    return result;
  }
}

class _SearchableDropdownDialogState<T>
    extends State<SearchableDropdownDialog<T>> {
  final TextEditingController _searchController = TextEditingController();
  List<T> _filteredItems = [];

  @override
  void initState() {
    super.initState();
    _filteredItems = widget.items;
    _searchController.addListener(_filterItems);
  }

  @override
  void dispose() {
    _searchController.removeListener(_filterItems);
    _searchController.dispose();
    super.dispose();
  }

  void _filterItems() {
    final query = _searchController.text.toLowerCase().trim();
    setState(() {
      if (query.isEmpty) {
        _filteredItems = widget.items;
      } else {
        _filteredItems =
            widget.items
                .where(
                  (item) => widget.getLabel(item).toLowerCase().contains(query),
                )
                .toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 500, maxHeight: 600),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      widget.title,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade800,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.close, color: Colors.grey.shade600),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),

            // Search field
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _searchController,
                autofocus: true,
                decoration: InputDecoration(
                  hintText: widget.searchHint,
                  prefixIcon: Icon(Icons.search, color: Colors.grey.shade600),
                  suffixIcon:
                      _searchController.text.isNotEmpty
                          ? IconButton(
                            icon: Icon(
                              Icons.clear,
                              color: Colors.grey.shade600,
                            ),
                            onPressed: () {
                              _searchController.clear();
                            },
                          )
                          : null,
                  filled: true,
                  fillColor: Colors.grey.shade50,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: Colors.grey.shade300),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(
                      color: Colors.blue.shade500,
                      width: 2,
                    ),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                ),
              ),
            ),

            // Divider
            Divider(height: 1, color: Colors.grey.shade200),

            // List of items
            Flexible(
              child:
                  _filteredItems.isEmpty
                      ? Padding(
                        padding: const EdgeInsets.all(32),
                        child: Text(
                          'No items found',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 14,
                          ),
                        ),
                      )
                      : ListView.builder(
                        shrinkWrap: true,
                        itemCount: _filteredItems.length,
                        itemBuilder: (context, index) {
                          final item = _filteredItems[index];
                          final isSelected = widget.compareItems != null
                              ? widget.compareItems!(item, widget.selectedValue)
                              : item == widget.selectedValue;

                          return InkWell(
                            onTap: () => widget.onItemSelected(item),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 12,
                              ),
                              decoration: BoxDecoration(
                                color:
                                    isSelected
                                        ? Colors.blue.shade50
                                        : Colors.transparent,
                              ),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      widget.getLabel(item),
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight:
                                            isSelected
                                                ? FontWeight.w500
                                                : FontWeight.w400,
                                        color:
                                            isSelected
                                                ? Colors.blue.shade700
                                                : Colors.black87,
                                      ),
                                    ),
                                  ),
                                  if (isSelected)
                                    Icon(
                                      Icons.check,
                                      color: Colors.blue.shade700,
                                      size: 20,
                                    ),
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
    );
  }
}
