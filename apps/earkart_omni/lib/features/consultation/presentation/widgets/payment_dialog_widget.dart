import 'package:flutter/material.dart';

enum PaymentMethod { cashToCR, cashToDoctor, paidOnQR, payHere }

class PaymentDialogWidget extends StatelessWidget {
  final double totalAmount;
  final Function(PaymentMethod) onPaymentSelected;

  const PaymentDialogWidget({
    super.key,
    required this.totalAmount,
    required this.onPaymentSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        padding: const EdgeInsets.all(24),
        constraints: const BoxConstraints(maxWidth: 400),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Select Payment Method',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, color: Colors.grey),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Total Amount: ₹${totalAmount.toStringAsFixed(2)}',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
                color: Colors.grey.shade700,
              ),
            ),
            const SizedBox(height: 24),
            // Payment Options
            _buildPaymentOption(
              context,
              icon: Icons.person_outline,
              title: 'Cash given to CR',
              subtitle: 'Payment received by Customer Representative',
              paymentMethod: PaymentMethod.cashToCR,
            ),
            const SizedBox(height: 12),
            _buildPaymentOption(
              context,
              icon: Icons.medical_services_outlined,
              title: 'Cash given to Doctor',
              subtitle: 'Payment received by Doctor',
              paymentMethod: PaymentMethod.cashToDoctor,
            ),
            const SizedBox(height: 12),
            _buildPaymentOption(
              context,
              icon: Icons.qr_code_scanner,
              title: 'Paid on QR',
              subtitle: 'Payment made via QR code',
              paymentMethod: PaymentMethod.paidOnQR,
            ),
            // const SizedBox(height: 12),
            // _buildPaymentOption(
            //   context,
            //   icon: Icons.payment,
            //   title: 'Pay Here',
            //   subtitle: 'Pay online via Razorpay',
            //   paymentMethod: PaymentMethod.payHere,
            //   isHighlighted: true,
            // ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentOption(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required PaymentMethod paymentMethod,
    bool isHighlighted = false,
  }) {
    return InkWell(
      onTap: () {
        Navigator.of(context).pop();
        onPaymentSelected(paymentMethod);
      },
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isHighlighted ? Colors.blue.shade50 : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isHighlighted ? Colors.blue.shade300 : Colors.grey.shade300,
            width: isHighlighted ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color:
                    isHighlighted ? Colors.blue.shade100 : Colors.grey.shade200,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                icon,
                color:
                    isHighlighted ? Colors.blue.shade700 : Colors.grey.shade700,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color:
                          isHighlighted ? Colors.blue.shade900 : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: Colors.grey.shade400,
            ),
          ],
        ),
      ),
    );
  }
}
