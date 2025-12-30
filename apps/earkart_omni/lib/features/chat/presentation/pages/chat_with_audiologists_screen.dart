import 'dart:async';
import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.state.dart';
import 'package:earkart_omni/features/chat/presentation/cubit/chat.cubit.dart';
import 'package:earkart_omni/features/chat/presentation/cubit/chat.state.dart';
import 'package:earkart_omni/models/chat/chat_message.entity.dart';
import 'package:earkart_omni/models/chat/read_receipt.entity.dart';
import 'package:earkart_omni/models/enums.dart';
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
  Timer? _viewingMessagesTimer;
  late final ChatCubit _chatCubit;
  bool _isAtBottom = true;
  bool _showScrollToBottomButton = false;

  @override
  void initState() {
    super.initState();
    _chatCubit = context.read<ChatCubit>();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _viewingMessagesTimer?.cancel();
    _scrollController.removeListener(_onScroll);
    _messageController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    // Disconnect socket when leaving chat screen
    _chatCubit.disconnect();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.position.pixels;
    final isAtBottom = (maxScroll - currentScroll) < 100; // 100px threshold
    
    if (_isAtBottom != isAtBottom) {
      setState(() {
        _isAtBottom = isAtBottom;
        _showScrollToBottomButton = !isAtBottom;
      });
    }
  }

  void _scrollToBottom({bool smooth = true}) {
    if (_scrollController.hasClients) {
      if (smooth) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      } else {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      }
      setState(() {
        _isAtBottom = true;
        _showScrollToBottomButton = false;
      });
    }
  }

  /// Converts UTC DateTime to Indian Standard Time (IST) and formats it
  DateTime _toIndianTime(DateTime utcTime) {
    // IST is UTC+5:30
    return utcTime.add(const Duration(hours: 5, minutes: 30));
  }

  /// Formats time in 12-hour format with AM/PM for Indian timezone
  String _formatIndianTime(DateTime utcTime) {
    final indianTime = _toIndianTime(utcTime);
    return DateFormat('h:mm a').format(indianTime);
  }

  /// Formats date and time in Indian timezone
  String _formatIndianDateTime(DateTime utcTime) {
    final indianTime = _toIndianTime(utcTime);
    return DateFormat('MMM dd, yyyy • h:mm a').format(indianTime);
  }

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _chatCubit,
      child: Scaffold(
        backgroundColor: Constants.bg,
        appBar: GlassmorphismAppBar(
          title: const Text(
            "Chat",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          actions: [
            BlocBuilder<ChatCubit, ChatState>(
              builder: (context, state) {
                final cubit = context.read<ChatCubit>();
                final isConnected = cubit.isConnected;
                return Padding(
                  padding: const EdgeInsets.only(right: 16.0),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: isConnected
                          ? Colors.green.withOpacity(0.1)
                          : Colors.orange.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isConnected ? Colors.green : Colors.orange,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          isConnected ? 'Online' : 'Connecting',
                          style: TextStyle(
                            fontSize: 11,
                            color: isConnected
                                ? Colors.green.shade700
                                : Colors.orange.shade700,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
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
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  final chatCubit = context.read<ChatCubit>();
                  if (!chatCubit.isConnected) {
                    chatCubit.connect(authState.centre!.id);
                  }
                  // Emit viewing_messages socket event
                  chatCubit.emitViewingMessages();
                  // Set up periodic emission every 30 seconds while viewing
                  _viewingMessagesTimer?.cancel();
                  _viewingMessagesTimer = Timer.periodic(
                    const Duration(seconds: 30),
                    (_) {
                      if (mounted && chatCubit.isConnected) {
                        chatCubit.emitViewingMessages();
                      }
                    },
                  );
                  // Auto-scroll to bottom when screen opens
                  Future.delayed(const Duration(milliseconds: 100), () {
                    if (mounted) {
                      _scrollToBottom(smooth: false);
                    }
                  });
                });
              }

              return BlocConsumer<ChatCubit, ChatState>(
                listener: (context, state) {
                  state.maybeWhen(
                    messageReceived: (message, messages) {
                      // Only auto-scroll if user is at bottom
                      if (_isAtBottom) {
                        WidgetsBinding.instance.addPostFrameCallback((_) {
                          _scrollToBottom();
                        });
                      } else {
                        // Show scroll to bottom button if not at bottom
                        setState(() {
                          _showScrollToBottomButton = true;
                        });
                      }
                    },
                    messagesLoaded: (messages, roomId, hasMore) {
                      // Auto-scroll to bottom when messages are first loaded
                      WidgetsBinding.instance.addPostFrameCallback((_) {
                        _scrollToBottom(smooth: false);
                      });
                    },
                    error: (message) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(message),
                          backgroundColor: Colors.red,
                          behavior: SnackBarBehavior.floating,
                          margin: const EdgeInsets.all(16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      );
                    },
                    orElse: () {},
                  );
                },
                builder: (context, state) {
                  return Stack(
                    children: [
                      Column(
                        children: [
                          // Active participants badge
                          _buildParticipantsBadge(context),
                          // Messages list
                          Expanded(
                            child: state.maybeWhen(
                              initial: () => _buildEmptyState('Initializing...'),
                              connecting: () => _buildEmptyState('Connecting...'),
                              connected: (roomId) => _buildMessagesList(context),
                              messagesLoaded: (messages, roomId, hasMore) =>
                                  _buildMessagesList(context),
                              messageReceived: (message, messages) =>
                                  _buildMessagesList(context),
                              participantsUpdated: (participants) =>
                                  _buildMessagesList(context),
                              disconnected: () =>
                                  _buildEmptyState('Disconnected'),
                              error: (message) => _buildEmptyState(
                                message,
                                isError: true,
                              ),
                              orElse: () => _buildMessagesList(context),
                            ),
                          ),
                          // Input section
                          _buildInputSection(context),
                        ],
                      ),
                      // Floating scroll to bottom button
                      if (_showScrollToBottomButton)
                        Positioned(
                          bottom: 80,
                          right: 16,
                          child: FloatingActionButton.small(
                            onPressed: () => _scrollToBottom(),
                            backgroundColor: Constants.primaryColor,
                            child: const Icon(
                              Icons.keyboard_arrow_down,
                              color: Colors.white,
                            ),
                          ),
                        ),
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
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isError ? Icons.error_outline : Icons.chat_bubble_outline,
              size: 56,
              color: Colors.grey.withOpacity(0.4),
            ),
            const SizedBox(height: 16),
            Text(
              message,
              style: TextStyle(
                fontSize: 15,
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w400,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessagesList(BuildContext context) {
    final cubit = context.read<ChatCubit>();
    final messages = cubit.messages;

    if (messages.isEmpty) {
      return _buildEmptyState('No messages yet.\nStart the conversation!');
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount: messages.length,
      itemBuilder: (context, index) {
        final message = messages[index];
        final showDateSeparator =
            index == 0 ||
            !_isSameDay(messages[index - 1].timestamp, message.timestamp);

        final isLastMessage = index == messages.length - 1;
        final shouldAnimate = isLastMessage && _isAtBottom;
        
        return Column(
          children: [
            if (showDateSeparator) _buildDateSeparator(message.timestamp),
            _buildMessageBubble(message, animateIn: shouldAnimate),
          ],
        );
      },
    );
  }

  Widget _buildDateSeparator(DateTime date) {
    final indianDate = _toIndianTime(date);
    final isToday = _isToday(indianDate);
    final isYesterday = _isYesterday(indianDate);
    String displayText;
    
    if (isToday) {
      displayText = 'Today';
    } else if (isYesterday) {
      displayText = 'Yesterday';
    } else {
      displayText = DateFormat('MMM dd').format(indianDate);
    }

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            displayText,
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildParticipantsBadge(BuildContext context) {
    return BlocBuilder<ChatCubit, ChatState>(
      builder: (context, state) {
        final cubit = context.read<ChatCubit>();
        final participants = cubit.participants;

        if (participants.isEmpty) {
          return const SizedBox.shrink();
        }

        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: Constants.primaryColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: Constants.primaryColor.withOpacity(0.2),
              width: 1,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.people_outline,
                size: 14,
                color: Constants.primaryColor,
              ),
              const SizedBox(width: 6),
              Text(
                '${participants.length} active',
                style: TextStyle(
                  fontSize: 12,
                  color: Constants.primaryColor,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMessageBubble(ChatMessage message, {bool animateIn = false}) {
    final isSentByMe = message.isSentByMe;
    final timeStr = _formatIndianTime(message.timestamp);

    Widget bubble = Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment:
            isSentByMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isSentByMe) ...[
            _buildAvatar(message.senderRole),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isSentByMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
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
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.75,
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: isSentByMe
                        ? Constants.primaryColor
                        : Colors.white,
                    borderRadius: BorderRadius.circular(16).copyWith(
                      bottomRight: isSentByMe
                          ? const Radius.circular(4)
                          : const Radius.circular(16),
                      bottomLeft: isSentByMe
                          ? const Radius.circular(16)
                          : const Radius.circular(4),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        message.message,
                        style: TextStyle(
                          fontSize: 15,
                          color: isSentByMe ? Colors.white : Colors.black87,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            timeStr,
                            style: TextStyle(
                              fontSize: 10,
                              color: isSentByMe
                                  ? Colors.white.withOpacity(0.7)
                                  : Colors.grey.shade500,
                            ),
                          ),
                          if (isSentByMe) ...[
                            const SizedBox(width: 4),
                            GestureDetector(
                              onTap: () =>
                                  _showReadReceipts(context, message.id),
                              child: Icon(
                                Icons.done_all,
                                size: 12,
                                color: Colors.white.withOpacity(0.7),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (isSentByMe) ...[
            const SizedBox(width: 8),
            _buildAvatar(message.senderRole, isMe: true),
          ],
        ],
      ),
    );

    if (animateIn) {
      return TweenAnimationBuilder<double>(
        tween: Tween(begin: 0.0, end: 1.0),
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
        builder: (context, value, child) {
          return Transform.translate(
            offset: Offset(0, 20 * (1 - value)),
            child: Opacity(
              opacity: value,
              child: bubble,
            ),
          );
        },
      );
    }
    
    return bubble;
  }

  Widget _buildAvatar(Role role, {bool isMe = false}) {
    IconData icon;
    if (isMe) {
      icon = Icons.person;
    } else if (role.name == 'audiologist' ||
        role.name == 'headAudiologist') {
      icon = Icons.hearing;
    } else {
      icon = Icons.business;
    }

    return CircleAvatar(
      radius: 18,
      backgroundColor: Constants.primaryColor.withOpacity(0.1),
      child: Icon(
        icon,
        size: 18,
        color: Constants.primaryColor,
      ),
    );
  }


  void _showReadReceipts(BuildContext context, String messageId) {
    context.read<ChatCubit>().getReadReceipts(messageId);
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => BlocBuilder<ChatCubit, ChatState>(
        builder: (context, state) {
          List<ReadReceipt> receipts = [];
          state.maybeWhen(
            readReceiptsLoaded: (id, readReceipts) {
              if (id == messageId) {
                receipts = readReceipts;
              }
            },
            orElse: () {},
          );

          return SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 8),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    'Read by',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                  ),
                ),
                const SizedBox(height: 8),
                if (receipts.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      'No read receipts yet',
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                  )
                else
                  Flexible(
                    child: ListView.builder(
                      shrinkWrap: true,
                      itemCount: receipts.length,
                      itemBuilder: (context, index) {
                        final receipt = receipts[index];
                        return ListTile(
                          leading: CircleAvatar(
                            backgroundColor:
                                Constants.primaryColor.withOpacity(0.1),
                            child: Icon(
                              receipt.userRole.name == 'audiologist' ||
                                      receipt.userRole.name == 'headAudiologist'
                                  ? Icons.hearing
                                  : Icons.person,
                              color: Constants.primaryColor,
                              size: 20,
                            ),
                          ),
                          title: Text(receipt.userName),
                          subtitle: Text(
                            _formatIndianDateTime(receipt.readAt),
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                const SizedBox(height: 8),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildInputSection(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _messageController,
                  focusNode: _focusNode,
                  decoration: InputDecoration(
                    hintText: 'Type a message...',
                    hintStyle: TextStyle(color: Colors.grey.shade400),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(24),
                      borderSide: BorderSide.none,
                    ),
                    filled: true,
                    fillColor: Colors.grey.shade50,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
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
              const SizedBox(width: 8),
              BlocBuilder<ChatCubit, ChatState>(
                builder: (context, state) {
                  final cubit = context.read<ChatCubit>();
                  final isConnected = cubit.isConnected;
                  return Material(
                    color: isConnected
                        ? Constants.primaryColor
                        : Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(24),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(24),
                      onTap: isConnected ? () => _sendMessage(context) : null,
                      child: Container(
                        padding: const EdgeInsets.all(12),
                        child: Icon(
                          Icons.send_rounded,
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

  bool _isToday(DateTime indianDate) {
    final now = _toIndianTime(DateTime.now().toUtc());
    return indianDate.year == now.year &&
        indianDate.month == now.month &&
        indianDate.day == now.day;
  }

  bool _isYesterday(DateTime indianDate) {
    final nowUtc = DateTime.now().toUtc();
    final yesterdayUtc = nowUtc.subtract(const Duration(days: 1));
    final yesterdayIst = _toIndianTime(yesterdayUtc);
    return indianDate.year == yesterdayIst.year &&
        indianDate.month == yesterdayIst.month &&
        indianDate.day == yesterdayIst.day;
  }
}
