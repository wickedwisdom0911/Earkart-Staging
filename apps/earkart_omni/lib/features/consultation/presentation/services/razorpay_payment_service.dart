import 'package:razorpay_flutter/razorpay_flutter.dart';

class RazorpayPaymentService {
  late Razorpay _razorpay;
  Function(PaymentSuccessResponse)? onSuccess;
  Function(PaymentFailureResponse)? onFailure;
  Function(ExternalWalletResponse)? onExternalWallet;

  RazorpayPaymentService() {
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) {
    if (onSuccess != null) {
      onSuccess!(response);
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    if (onFailure != null) {
      onFailure!(response);
    }
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    if (onExternalWallet != null) {
      onExternalWallet!(response);
    }
  }

  void openPayment({
    required String razorpayKey,
    required String razorpayOrderId,
    required double amount,
    required String name,
    required String description,
    required String contact,
    required String email,
    Function(PaymentSuccessResponse)? onSuccess,
    Function(PaymentFailureResponse)? onFailure,
    Function(ExternalWalletResponse)? onExternalWallet,
  }) {
    this.onSuccess = onSuccess;
    this.onFailure = onFailure;
    this.onExternalWallet = onExternalWallet;

    final options = {
      'key': razorpayKey,
      'amount': (amount * 100).toInt(), // Convert to paise
      'name': name,
      'description': description,
      'order_id': razorpayOrderId, // Use order ID from backend
      'prefill': {'contact': contact, 'email': email},
      'external': {
        'wallets': ['paytm'],
      },
    };

    try {
      _razorpay.open(options);
    } catch (e) {
      // PaymentFailureResponse can only be created by Razorpay SDK
      // Exceptions here are handled by the SDK's error handler
      // which will call _handlePaymentError with a proper PaymentFailureResponse
    }
  }

  void dispose() {
    _razorpay.clear();
  }
}
