import 'package:flutter/material.dart';

class SocketStatusButton extends StatelessWidget {
  final bool isSocketInitialized;
  final bool socketReconnectFailed;
  final VoidCallback onRetry;
  final Function(String) onShowMessage;

  const SocketStatusButton({
    super.key,
    required this.isSocketInitialized,
    required this.socketReconnectFailed,
    required this.onRetry,
    required this.onShowMessage,
  });

  @override
  Widget build(BuildContext context) {
    if (socketReconnectFailed) {
      // Retry button when connection failed
      return GestureDetector(
        onTap: onRetry,
        child: Container(
          constraints: const BoxConstraints(minHeight: 32, minWidth: 80),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.red.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.red.shade200, width: 1.2),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.refresh, size: 16, color: Colors.red.shade700),
              const SizedBox(width: 6),
              Text(
                'Retry',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.red.shade700,
                ),
              ),
            ],
          ),
        ),
      );
    } else if (isSocketInitialized) {
      // System healthy button when connected
      return GestureDetector(
        onTap: () {
          onShowMessage('System healthy - Connected to server');
        },
        child: Container(
          constraints: const BoxConstraints(minHeight: 32, minWidth: 100),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.green.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.green.shade200, width: 1.2),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.check_circle, size: 16, color: Colors.green.shade700),
              const SizedBox(width: 6),
              Text(
                'System healthy',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.green.shade700,
                ),
              ),
            ],
          ),
        ),
      );
    } else {
      // System not connected button when connecting
      return GestureDetector(
        onTap: () {
          onShowMessage('System not connected - Connecting to server...');
        },
        child: Container(
          constraints: const BoxConstraints(minHeight: 32, minWidth: 120),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.orange.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.orange.shade200, width: 1.2),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    Colors.orange.shade700,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Text(
                'System not connected',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.orange.shade700,
                ),
              ),
            ],
          ),
        ),
      );
    }
  }
}

