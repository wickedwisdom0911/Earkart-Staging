import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.state.dart';
import 'package:earkart_omni/features/chat/presentation/cubit/chat.cubit.dart';
import 'package:earkart_omni/features/chat/presentation/cubit/chat.state.dart';
import 'package:earkart_omni/models/chat/chat_message.entity.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';

class ChatWithAudiologistsScreen extends StatefulWidget {
  const ChatWithAudiologistsScreen({super.key});
  static const routeName = "/chat-with-audiologists";

  @override
  State<ChatWithAudiologistsScreen> createState() =>
      _ChatWithAudiologistsScreenState();
}

class _ChatWithAudiologistsScreenState
    extends State<ChatWithAudiologistsScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();
  late final ChatCubit _chatCubit;

  @override
  void initState() {
    super.initState();
    _chatCubit = ChatCubit();
  }

  @override
  void dispose() {
    _chatCubit.disconnect();
    _chatCubit.close();
    _messageController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _chatCubit,
      child: Scaffold(
        appBar: GlassmorphismAppBar(
          title: const Text("Chat with Audiologists"),
          actions: [
            BlocBuilder<ChatCubit, ChatState>(
              builder: (context, state) {
                final cubit = context.read<ChatCubit>();
                final isConnected = cubit.isConnected;
                return Padding(
                  padding: const EdgeInsets.only(right: 16.0),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: isConnected ? Colors.green : Colors.red,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        isConnected ? 'Connected' : 'Connecting...',
                        style: TextStyle(
                          fontSize: 12,
                          color: isConnected ? Colors.green : Colors.grey,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],
        ),
        body: BlocListener<AuthCubit, AuthState>(
          listener: (context, authState) {
            if (authState is AuthCentreSuccess &&
                authState.centre?.id != null) {
              context.read<ChatCubit>().connect(authState.centre!.id);
            }
          },
          child: BlocBuilder<AuthCubit, AuthState>(
            builder: (context, authState) {
              if (authState is AuthCentreSuccess &&
                  authState.centre?.id != null) {
                // Trigger connection if not already connected
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  final chatCubit = context.read<ChatCubit>();
                  if (!chatCubit.isConnected) {
                    chatCubit.connect(authState.centre!.id);
                  }
                });
              }

              return BlocConsumer<ChatCubit, ChatState>(
                listener: (context, state) {
                  state.maybeWhen(
                    messageReceived: (message, messages) {
                      _scrollToBottom();
                    },
                    messagesLoaded: (messages, roomId) {
                      _scrollToBottom();
                    },
                    error: (message) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(message),
                          backgroundColor: Colors.red,
                          duration: const Duration(seconds: 3),
                        ),
                      );
                    },
                    orElse: () {},
                  );
                },
                builder: (context, state) {
                  return Column(
                    children: [
                      // Participants section
                      BlocBuilder<ChatCubit, ChatState>(
                        builder: (context, state) {
                          final cubit = context.read<ChatCubit>();
                          final participants = cubit.participants;
                          if (participants.isEmpty) {
                            return const SizedBox.shrink();
                          }
                          return Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: Constants.accentColor,
                              border: Border(
                                bottom: BorderSide(
                                  color: Colors.grey.withOpacity(0.2),
                                  width: 1,
                                ),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.people_outline,
                                  size: 16,
                                  color: Constants.secondaryColor,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    '${participants.length} participant${participants.length != 1 ? 's' : ''} online',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Constants.secondaryColor,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                      // Messages list
                      Expanded(
                        child: state.maybeWhen(
                          initial:
                              () => _buildEmptyState('Initializing chat...'),
                          connecting: () => _buildEmptyState('Connecting...'),
                          connected: (roomId) => _buildMessagesList(context),
                          messagesLoaded:
                              (messages, roomId) => _buildMessagesList(context),
                          messageReceived:
                              (message, messages) =>
                                  _buildMessagesList(context),
                          disconnected: () => _buildEmptyState('Disconnected'),
                          error:
                              (message) => _buildEmptyState(
                                'Error: $message',
                                isError: true,
                              ),
                          orElse: () => _buildEmptyState('Loading...'),
                        ),
                      ),
                      // Input section
                      _buildInputSection(context),
                    ],
                  );
                },
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(String message, {bool isError = false}) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isError ? Icons.error_outline : Icons.chat_bubble_outline,
            size: 64,
            color: Colors.grey.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            message,
            style: TextStyle(fontSize: 16, color: Colors.grey.withOpacity(0.7)),
          ),
        ],
      ),
    );
  }

  Widget _buildMessagesList(BuildContext context) {
    final cubit = context.read<ChatCubit>();
    final messages = cubit.messages;

    if (messages.isEmpty) {
      return _buildEmptyState('No messages yet. Start the conversation!');
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: messages.length,
      itemBuilder: (context, index) {
        final message = messages[index];
        final showDateSeparator =
            index == 0 ||
            !_isSameDay(messages[index - 1].timestamp, message.timestamp);

        return Column(
          children: [
            if (showDateSeparator) _buildDateSeparator(message.timestamp),
            _buildMessageBubble(message),
          ],
        );
      },
    );
  }

  Widget _buildDateSeparator(DateTime date) {
    final dateStr = DateFormat('MMM dd, yyyy').format(date);
    final isToday = _isToday(date);
    final displayText = isToday ? 'Today' : dateStr;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          Expanded(child: Divider(color: Colors.grey.withOpacity(0.3))),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Text(
              displayText,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey.withOpacity(0.7),
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(child: Divider(color: Colors.grey.withOpacity(0.3))),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage message) {
    final isSentByMe = message.isSentByMe;
    final timeStr = DateFormat('HH:mm').format(message.timestamp);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment:
            isSentByMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isSentByMe) ...[
            CircleAvatar(
              radius: 16,
              backgroundColor: Constants.primaryColor.withOpacity(0.1),
              child: Icon(
                message.senderRole.name == 'audiologist' ||
                        message.senderRole.name == 'headAudiologist'
                    ? Icons.hearing
                    : message.senderRole.name == 'centre'
                    ? Icons.business
                    : Icons.person,
                size: 16,
                color: Constants.primaryColor,
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isSentByMe
                      ? CrossAxisAlignment.end
                      : CrossAxisAlignment.start,
              children: [
                if (!isSentByMe && message.senderName != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4, left: 4),
                    child: Text(
                      message.senderName!,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade700,
                      ),
                    ),
                  ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color:
                        isSentByMe
                            ? Constants.primaryColor
                            : Colors.grey.shade200,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(16),
                      topRight: const Radius.circular(16),
                      bottomLeft: Radius.circular(isSentByMe ? 16 : 4),
                      bottomRight: Radius.circular(isSentByMe ? 4 : 16),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        message.message,
                        style: TextStyle(
                          fontSize: 14,
                          color: isSentByMe ? Colors.white : Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        timeStr,
                        style: TextStyle(
                          fontSize: 10,
                          color:
                              isSentByMe
                                  ? Colors.white.withOpacity(0.7)
                                  : Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (isSentByMe) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 16,
              backgroundColor: Constants.primaryColor.withOpacity(0.1),
              child: Icon(
                Icons.business,
                size: 16,
                color: Constants.primaryColor,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInputSection(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Colors.grey.withOpacity(0.2), width: 1),
        ),
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _messageController,
                focusNode: _focusNode,
                decoration: InputDecoration(
                  hintText: 'Type a message...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide(color: Colors.grey.withOpacity(0.3)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide(color: Colors.grey.withOpacity(0.3)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: const BorderSide(
                      color: Constants.primaryColor,
                      width: 2,
                    ),
                  ),
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 12,
                  ),
                  filled: true,
                  fillColor: Constants.accentColor,
                ),
                maxLines: null,
                textInputAction: TextInputAction.send,
                onSubmitted: (value) {
                  if (value.trim().isNotEmpty) {
                    _sendMessage(context);
                  }
                },
              ),
            ),
            const SizedBox(width: 12),
            BlocBuilder<ChatCubit, ChatState>(
              builder: (context, state) {
                final cubit = context.read<ChatCubit>();
                final isConnected = cubit.isConnected;
                return Material(
                  color:
                      isConnected
                          ? Constants.primaryColor
                          : Colors.grey.shade400,
                  borderRadius: BorderRadius.circular(24),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(24),
                    onTap: isConnected ? () => _sendMessage(context) : null,
                    child: Container(
                      padding: const EdgeInsets.all(12),
                      child: const Icon(
                        Icons.send,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _sendMessage(BuildContext context) {
    final message = _messageController.text.trim();
    if (message.isNotEmpty) {
      context.read<ChatCubit>().sendMessage(message);
      _messageController.clear();
      _focusNode.unfocus();
    }
  }

  bool _isSameDay(DateTime date1, DateTime date2) {
    return date1.year == date2.year &&
        date1.month == date2.month &&
        date1.day == date2.day;
  }

  bool _isToday(DateTime date) {
    final now = DateTime.now();
    return date.year == now.year &&
        date.month == now.month &&
        date.day == now.day;
  }
}
