import 'dart:async';
import 'package:earkart_omni/config/widgets/glassmorphism_app_bar.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.cubit.dart';
import 'package:earkart_omni/features/auth/presentation/cubit/auth.state.dart';
import 'package:earkart_omni/features/chat/presentation/cubit/chat.cubit.dart';
import 'package:earkart_omni/features/chat/presentation/cubit/chat.state.dart';
import 'package:earkart_omni/models/chat/chat_message.entity.dart';
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

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: _chatCubit,
      child: Scaffold(
        backgroundColor: Constants.bg,
        appBar: GlassmorphismAppBar(
          title: const Text(
            "Chat",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
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
                      color:
                          isConnected
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
                            color:
                                isConnected
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
              context.read<ChatCubit>().connect();
            }
          },
          child: BlocBuilder<AuthCubit, AuthState>(
            builder: (context, authState) {
              if (authState is AuthCentreSuccess &&
                  authState.centre?.id != null) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  final chatCubit = context.read<ChatCubit>();
                  if (!chatCubit.isConnected) {
                    // Connect without passing centreId - backend will determine room from auth token
                    chatCubit.connect();
                  }
                  // Emit viewing_messages socket event when screen opens (after roomId is set)
                  // This will be called after the 'connected' event sets the roomId
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
                          // Messages list (full screen)
                          Expanded(
                            child: state.maybeWhen(
                              initial:
                                  () => _buildEmptyState('Initializing...'),
                              connecting:
                                  () => _buildEmptyState('Connecting...'),
                              connected:
                                  (roomId) => _buildMessagesList(context),
                              messagesLoaded:
                                  (messages, roomId, hasMore) =>
                                      _buildMessagesList(context),
                              messageReceived:
                                  (message, messages) =>
                                      _buildMessagesList(context),
                              participantsUpdated:
                                  (participants) => _buildMessagesList(context),
                              disconnected:
                                  () => _buildEmptyState('Disconnected'),
                              error:
                                  (message) =>
                                      _buildEmptyState(message, isError: true),
                              orElse: () => _buildMessagesList(context),
                            ),
                          ),
                          // Input section
                          _buildInputSection(context),
                        ],
                      ),
                      // Floating participants badge at the top
                      Positioned(
                        top: 8,
                        left: 0,
                        right: 0,
                        child: Center(child: _buildParticipantsBadge(context)),
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
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 60, 16, 12),
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
          margin: const EdgeInsets.symmetric(horizontal: 16),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
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
                  isSentByMe
                      ? CrossAxisAlignment.end
                      : CrossAxisAlignment.start,
              children: [
                Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.75,
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: isSentByMe ? Constants.primaryColor : Colors.white,
                    borderRadius: BorderRadius.circular(16).copyWith(
                      bottomRight:
                          isSentByMe
                              ? const Radius.circular(4)
                              : const Radius.circular(16),
                      bottomLeft:
                          isSentByMe
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
                      // Sender name inside bubble
                      if (message.senderName != null && !isSentByMe)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Text(
                            message.senderName!,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color:
                                  isSentByMe
                                      ? Colors.white.withOpacity(0.9)
                                      : _getRoleColor(
                                        message.senderRole,
                                      ).withOpacity(0.9),
                              letterSpacing: 0.3,
                            ),
                          ),
                        ),
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
                              color:
                                  isSentByMe
                                      ? Colors.white.withOpacity(0.7)
                                      : Colors.grey.shade500,
                            ),
                          ),
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
            child: Opacity(opacity: value, child: bubble),
          );
        },
      );
    }

    return bubble;
  }

  Widget _buildAvatar(Role role, {bool isMe = false}) {
    Color iconColor;
    IconData icon;
    List<Color> gradientColors;

    if (isMe) {
      // Me - Show "ME" text
      return Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Constants.primaryColor,
              Constants.primaryColor.withOpacity(0.7),
            ],
          ),
          boxShadow: [
            BoxShadow(
              color: Constants.primaryColor.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Center(
          child: Text(
            'ME',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              letterSpacing: 0.5,
            ),
          ),
        ),
      );
    } else if (role == Role.admin || role == Role.superAdmin) {
      // Admin/SuperAdmin - Use app icon
      return Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: Constants.primaryColor,
          shape: BoxShape.circle,
        ),
        child: ClipOval(
          child: Image.asset(
            'assets/images/app_icon.png',

            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              // Fallback to icon if image fails to load
              return Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      const Color(0xFF6366F1), // Indigo
                      const Color(0xFF8B5CF6), // Purple
                    ],
                  ),
                ),
                child: const Icon(
                  Icons.verified,
                  size: 20,
                  color: Colors.white,
                ),
              );
            },
          ),
        ),
      );
    } else if (role == Role.audiologist || role == Role.headAudiologist) {
      // Audiologist - Green gradient
      gradientColors = [
        const Color(0xFF10B981), // Emerald
        const Color(0xFF059669), // Darker emerald
      ];
      icon = Icons.hearing;
      iconColor = Colors.white;
    } else {
      // Centre/Other - Orange gradient
      gradientColors = [
        const Color(0xFFF59E0B), // Amber
        const Color(0xFFD97706), // Darker amber
      ];
      icon = Icons.business;
      iconColor = Colors.white;
    }

    return Container(
      width: 36,
      height: 36,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: gradientColors,
        ),
        boxShadow: [
          BoxShadow(
            color: gradientColors[0].withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Icon(icon, size: 20, color: iconColor),
    );
  }

  Color _getRoleColor(Role role) {
    switch (role) {
      case Role.admin:
      case Role.superAdmin:
        return const Color(0xFF6366F1); // Indigo
      case Role.audiologist:
      case Role.headAudiologist:
        return const Color(0xFF10B981); // Emerald
      default:
        return const Color(0xFFF59E0B); // Amber
    }
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
                    color:
                        isConnected
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
