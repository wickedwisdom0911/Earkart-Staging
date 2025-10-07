import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:flutter/material.dart';

class ServiceSelectionWidget extends StatefulWidget {
  final List<CentrePricingEntity> pricingList;
  final List<String> selectedPricingIds;
  final Function(List<String>) onSelectionChanged;

  const ServiceSelectionWidget({
    super.key,
    required this.pricingList,
    required this.selectedPricingIds,
    required this.onSelectionChanged,
  });

  @override
  State<ServiceSelectionWidget> createState() => _ServiceSelectionWidgetState();
}

class _ServiceSelectionWidgetState extends State<ServiceSelectionWidget> {
  bool isDropdownOpen = false;

  @override
  Widget build(BuildContext context) {
    if (widget.pricingList.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: const Center(
          child: Text(
            'No services available',
            style: TextStyle(color: Colors.grey, fontSize: 14),
          ),
        ),
      );
    }

    return Container(
      height: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Select Service',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 16),
          _buildServiceDropdown(),
          const SizedBox(height: 16),
          if (widget.selectedPricingIds.isNotEmpty)
            _buildSelectedServiceDisplay(),
        ],
      ),
    );
  }

  Widget _buildServiceDropdown() {
    return Column(
      children: [
        // Dropdown Button
        GestureDetector(
          onTap: () {
            setState(() {
              isDropdownOpen = !isDropdownOpen;
            });
          },
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey.shade300, width: 1),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    widget.selectedPricingIds.isEmpty
                        ? 'Select Service'
                        : '${widget.selectedPricingIds.length} service${widget.selectedPricingIds.length == 1 ? '' : 's'} selected',
                    style: TextStyle(
                      fontSize: 14,
                      color:
                          widget.selectedPricingIds.isEmpty
                              ? Colors.grey.shade600
                              : Colors.black87,
                    ),
                  ),
                ),
                Icon(
                  isDropdownOpen
                      ? Icons.keyboard_arrow_up
                      : Icons.keyboard_arrow_down,
                  color: Colors.grey.shade600,
                  size: 20,
                ),
              ],
            ),
          ),
        ),

        // Dropdown Options
        if (isDropdownOpen) ...[
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey.shade200, width: 1),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children:
                  widget.pricingList.map((pricing) {
                    final isSelected = widget.selectedPricingIds.contains(
                      pricing.id,
                    );
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          List<String> newSelection = List.from(
                            widget.selectedPricingIds,
                          );
                          if (isSelected) {
                            newSelection.remove(pricing.id);
                          } else {
                            newSelection.add(pricing.id!);
                          }
                          widget.onSelectionChanged(newSelection);
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color:
                              isSelected
                                  ? Constants.primaryColor.withOpacity(0.05)
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
                            Container(
                              width: 16,
                              height: 16,
                              decoration: BoxDecoration(
                                color:
                                    isSelected
                                        ? Constants.primaryColor
                                        : Colors.transparent,
                                borderRadius: BorderRadius.circular(3),
                                border: Border.all(
                                  color:
                                      isSelected
                                          ? Constants.primaryColor
                                          : Colors.grey.shade400,
                                  width: 2,
                                ),
                              ),
                              child:
                                  isSelected
                                      ? const Icon(
                                        Icons.check,
                                        color: Colors.white,
                                        size: 12,
                                      )
                                      : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                pricing.name,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                  color:
                                      isSelected
                                          ? Constants.primaryColor
                                          : Colors.black87,
                                ),
                              ),
                            ),
                            Text(
                              '₹${pricing.price.toStringAsFixed(0)}',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color:
                                    isSelected
                                        ? Constants.primaryColor
                                        : Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildSelectedServiceDisplay() {
    if (widget.selectedPricingIds.isEmpty) return const SizedBox.shrink();

    // Get all selected services
    final selectedServices =
        widget.pricingList
            .where((pricing) => widget.selectedPricingIds.contains(pricing.id))
            .toList();

    // Calculate total price
    final totalPrice = selectedServices.fold<double>(
      0.0,
      (sum, service) => sum + service.price,
    );

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Constants.primaryColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Selected Services (${selectedServices.length})',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Constants.primaryColor,
                ),
              ),
              Text(
                'Total: ₹${totalPrice.toStringAsFixed(0)}',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Constants.primaryColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...selectedServices
              .map(
                (service) => Padding(
                  padding: const EdgeInsets.only(bottom: 4),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          service.name,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: Colors.black87,
                          ),
                        ),
                      ),
                      Text(
                        '₹${service.price.toStringAsFixed(0)}',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
              )
              .toList(),
        ],
      ),
    );
  }
}
