import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:flutter/material.dart';

class ChatWithAudiologistsScreen extends StatelessWidget {
  const ChatWithAudiologistsScreen({super.key});
  static const routeName = "/chat-with-audiologists";

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: GlassmorphismAppBar(
        title: const Text("Chat with Audiologists"),
      ),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.chat_bubble_outline,
                size: 80,
                color: Colors.grey,
              ),
              SizedBox(height: 24),
              Text(
                "Chat with Audiologists",
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 16),
              Text(
                "Start a conversation with audiologists",
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

