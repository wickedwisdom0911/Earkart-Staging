import 'dart:async';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/features/chat/domain/usecases/get_message_read_receipts.usecase.dart';
import 'package:earkart_omni/features/chat/domain/usecases/get_room_messages.usecase.dart';
import 'package:earkart_omni/features/chat/domain/usecases/get_room_participants.usecase.dart';
import 'package:earkart_omni/features/chat/domain/usecases/get_room_unread_count.usecase.dart';
import 'package:earkart_omni/features/chat/domain/usecases/mark_message_read.usecase.dart';
import 'package:earkart_omni/features/chat/domain/usecases/mark_all_as_read.usecase.dart';
import 'package:earkart_omni/features/chat/presentation/cubit/chat.state.dart';
import 'package:earkart_omni/models/chat/chat_message.entity.dart';
import 'package:earkart_omni/models/chat/unread_count.entity.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class ChatCubit extends Cubit<ChatState> {
  final ILogger _logger = di<ILogger>();
  final UserEntityDataSource _userDataSource = di<UserEntityDataSource>();
  final GetRoomMessagesUsecase _getRoomMessagesUsecase =
      di<GetRoomMessagesUsecase>();
  final GetRoomParticipantsUsecase _getRoomParticipantsUsecase =
      di<GetRoomParticipantsUsecase>();
  final GetRoomUnreadCountUsecase _getRoomUnreadCountUsecase =
      di<GetRoomUnreadCountUsecase>();
  final MarkMessageReadUsecase _markMessageReadUsecase =
      di<MarkMessageReadUsecase>();
  final MarkAllAsReadUsecase _markAllAsReadUsecase = di<MarkAllAsReadUsecase>();
  final GetMessageReadReceiptsUsecase _getMessageReadReceiptsUsecase =
      di<GetMessageReadReceiptsUsecase>();

  IO.Socket? _socket;
  String? _currentRoomId;
  String? _currentUserId;
  final List<ChatMessage> _messages = [];
  final List<ChatParticipant> _participants = [];
  bool _isConnected = false;
  bool _hasMoreMessages = false;
  int _currentPage = 1;
  int _unreadCount = 0;
  static const int _messagesPerPage = 50;

  ChatCubit() : super(const ChatState.initial());

  List<ChatMessage> get messages => List.unmodifiable(_messages);
  List<ChatParticipant> get participants => List.unmodifiable(_participants);
  bool get isConnected => _isConnected;
  String? get currentRoomId => _currentRoomId;
  int get unreadCount => _unreadCount;

  Future<void> connect(String? centreId) async {
    try {
      emit(const ChatState.connecting());

      final user = _userDataSource.getUserEntity();
      if (user?.token == null || user!.token!.isEmpty) {
        emit(
          const ChatState.error(
            message: 'Authentication token not found. Please login again.',
          ),
        );
        return;
      }

      _currentUserId = user.id;
      _currentRoomId = centreId;

      // Build socket URL with /chat namespace
      // Remove trailing slashes and socket.io paths, then append /chat namespace
      String? socketBaseUrl = Constants.socketUrl;
      if (socketBaseUrl != null) {
        socketBaseUrl = socketBaseUrl
            .replaceAll('/socket.io/', '')
            .replaceAll(RegExp(r'/$'), ''); // Remove trailing slash
      }
      final chatSocketUrl = '${socketBaseUrl ?? ''}/chat';

      _logger.info('Connecting to chat socket: $chatSocketUrl');

      _socket = IO.io(chatSocketUrl, <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': true,
        'auth': {'token': user.token},
        'reconnection': true,
        'reconnectionAttempts': 5,
        'reconnectionDelay': 1000,
        'timeout': 10000,
        'forceNew': true,
        'upgrade': false,
        'rememberUpgrade': false,
      });

      _setupSocketHandlers();
    } catch (e) {
      _logger.error('Error connecting to chat socket: $e');
      emit(ChatState.error(message: 'Failed to connect: ${e.toString()}'));
    }
  }

  void _setupSocketHandlers() {
    if (_socket == null) return;

    _socket!.onConnect((_) {
      _logger.info('Chat socket connected');
      _isConnected = true;
      emit(ChatState.connected(roomId: _currentRoomId));
    });

    _socket!.onDisconnect((_) {
      _logger.info('Chat socket disconnected');
      _isConnected = false;
      emit(const ChatState.disconnected());
    });

    _socket!.onConnectError((error) {
      _logger.error('Chat socket connection error: $error');
      emit(ChatState.error(message: 'Connection error: ${error.toString()}'));
    });

    _socket!.on('connected', (data) {
      _logger.info('Chat connected event: $data');
      if (data is Map<String, dynamic>) {
        final roomId = data['roomId'] as String?;
        _currentRoomId = roomId ?? _currentRoomId;
        _isConnected = true;
        emit(ChatState.connected(roomId: _currentRoomId));

        // Request room participants and load messages
        if (_currentRoomId != null && _currentUserId != null) {
          getRoomParticipants(_currentRoomId!);
          loadMessages();
          refreshUnreadCount();
        }
      }
    });

    _socket!.on('new_message', (data) {
      _logger.info('New message received: $data');
      if (data is Map<String, dynamic> && _currentUserId != null) {
        try {
          final message = ChatMessage.fromJson(data, _currentUserId!);
          _messages.add(message);
          emit(
            ChatState.messageReceived(
              message: message,
              messages: List.from(_messages),
            ),
          );
          // Increment unread count locally when new message arrives (if not sent by me)
          // This is more efficient than polling the API
          if (!message.isSentByMe && _currentRoomId != null) {
            _unreadCount++;
            emit(
              ChatState.unreadCountLoaded(
                unreadCount: UnreadCount(count: _unreadCount),
              ),
            );
          }
        } catch (e) {
          _logger.error('Error parsing message: $e');
        }
      }
    });

    _socket!.on('user_joined', (data) {
      _logger.info('User joined: $data');
      if (data is Map<String, dynamic>) {
        try {
          final participant = ChatParticipant.fromJson({
            'userId': data['userId'],
            'role': data['role'],
            'joinedAt': data['timestamp'] ?? DateTime.now().toIso8601String(),
          });
          if (!_participants.any((p) => p.userId == participant.userId)) {
            _participants.add(participant);
            emit(
              ChatState.participantsUpdated(
                participants: List.from(_participants),
              ),
            );
          }
        } catch (e) {
          _logger.error('Error parsing user_joined: $e');
        }
      }
    });

    _socket!.on('user_left', (data) {
      _logger.info('User left: $data');
      if (data is Map<String, dynamic>) {
        final userId = data['userId'] as String?;
        if (userId != null) {
          _participants.removeWhere((p) => p.userId == userId);
          emit(
            ChatState.participantsUpdated(
              participants: List.from(_participants),
            ),
          );
        }
      }
    });

    _socket!.on('room_participants', (data) {
      _logger.info('Room participants: $data');
      if (data is Map<String, dynamic>) {
        try {
          final participantsList = data['participants'] as List<dynamic>?;
          if (participantsList != null) {
            _participants.clear();
            _participants.addAll(
              participantsList
                  .map(
                    (p) => ChatParticipant.fromJson(p as Map<String, dynamic>),
                  )
                  .toList(),
            );
            emit(
              ChatState.participantsUpdated(
                participants: List.from(_participants),
              ),
            );
          }
        } catch (e) {
          _logger.error('Error parsing room_participants: $e');
        }
      }
    });

    // Listen for unread count updates from server (if backend supports it)
    _socket!.on('unread_count_update', (data) {
      _logger.info('Unread count update received: $data');
      if (data is Map<String, dynamic>) {
        try {
          final count = (data['count'] as num?)?.toInt() ?? 0;
          _unreadCount = count;
          emit(
            ChatState.unreadCountLoaded(unreadCount: UnreadCount(count: count)),
          );
        } catch (e) {
          _logger.error('Error parsing unread_count_update: $e');
        }
      }
    });

    _socket!.on('error', (data) {
      _logger.error('Chat socket error: $data');
      String errorMessage = 'An error occurred';
      if (data is Map<String, dynamic>) {
        errorMessage = data['message']?.toString() ?? errorMessage;
      } else if (data is String) {
        errorMessage = data;
      }
      emit(ChatState.error(message: errorMessage));
    });
  }

  void sendMessage(String message) {
    if (_socket == null || !_isConnected || _currentRoomId == null) {
      emit(
        const ChatState.error(
          message: 'Not connected to chat. Please wait for connection.',
        ),
      );
      return;
    }

    if (message.trim().isEmpty) {
      return;
    }

    try {
      _socket!.emit('send_message', {
        'roomId': _currentRoomId,
        'message': message.trim(),
        "senderName": _userDataSource.getUserEntity()?.name,
      });
      _logger.info('Message sent: $message');
    } catch (e) {
      _logger.error('Error sending message: $e');
      emit(ChatState.error(message: 'Failed to send message: ${e.toString()}'));
    }
  }

  void getRoomParticipants(String roomId) {
    if (_socket == null || !_isConnected) {
      return;
    }

    try {
      _socket!.emit('get_room_participants', {'roomId': roomId});
      _logger.info('Requested room participants for: $roomId');
    } catch (e) {
      _logger.error('Error getting room participants: $e');
    }
  }

  // REST API Methods
  Future<void> loadMessages({bool loadMore = false}) async {
    if (_currentRoomId == null) {
      emit(const ChatState.error(message: 'Room ID not available'));
      return;
    }

    try {
      if (!loadMore) {
        _currentPage = 1;
        _messages.clear();
      }

      final result = await _getRoomMessagesUsecase(
        _currentRoomId!,
        limit: _messagesPerPage,
        page: _currentPage,
        userId: _currentUserId, // Pass userId to auto-mark messages as seen
      );

      result.fold(
        (failure) {
          emit(ChatState.error(message: failure.message));
        },
        (paginatedMessages) {
          if (!loadMore) {
            _messages.clear();
          }
          _messages.addAll(paginatedMessages.messages);
          _hasMoreMessages = paginatedMessages.hasNext;
          _currentPage++;

          // Sort messages by timestamp (oldest first)
          _messages.sort((a, b) => a.timestamp.compareTo(b.timestamp));

          emit(
            ChatState.messagesLoaded(
              messages: List.from(_messages),
              roomId: _currentRoomId,
              hasMore: _hasMoreMessages,
            ),
          );
        },
      );
    } catch (e) {
      _logger.error('Error loading messages: $e');
      emit(
        ChatState.error(message: 'Failed to load messages: ${e.toString()}'),
      );
    }
  }

  Future<void> loadMoreMessages() async {
    if (_hasMoreMessages && _currentRoomId != null) {
      await loadMessages(loadMore: true);
    }
  }

  Future<void> refreshUnreadCount() async {
    if (_currentRoomId == null) return;

    try {
      final result = await _getRoomUnreadCountUsecase(_currentRoomId!);
      result.fold(
        (failure) {
          _logger.error('Error getting unread count: ${failure.message}');
        },
        (unreadCount) {
          final previousCount = _unreadCount;
          _unreadCount = unreadCount.count;
          // Emit unreadCountLoaded state so UI can update badge
          // This state is handled in UI without affecting messages view
          if (previousCount != _unreadCount) {
            emit(ChatState.unreadCountLoaded(unreadCount: unreadCount));
          }
        },
      );
    } catch (e) {
      _logger.error('Error refreshing unread count: $e');
    }
  }

  Future<void> markMessageAsRead(String messageId) async {
    try {
      final result = await _markMessageReadUsecase(messageId);
      result.fold(
        (failure) {
          _logger.error('Error marking message as read: ${failure.message}');
        },
        (_) {
          // Refresh unread count after marking as read
          refreshUnreadCount();
        },
      );
    } catch (e) {
      _logger.error('Error marking message as read: $e');
    }
  }

  Future<void> getReadReceipts(String messageId) async {
    try {
      final result = await _getMessageReadReceiptsUsecase(messageId);
      result.fold(
        (failure) {
          emit(ChatState.error(message: failure.message));
        },
        (readReceipts) {
          emit(
            ChatState.readReceiptsLoaded(
              messageId: messageId,
              readReceipts: readReceipts,
            ),
          );
        },
      );
    } catch (e) {
      _logger.error('Error getting read receipts: $e');
      emit(
        ChatState.error(
          message: 'Failed to get read receipts: ${e.toString()}',
        ),
      );
    }
  }

  Future<void> refreshParticipants() async {
    if (_currentRoomId == null) return;

    try {
      final result = await _getRoomParticipantsUsecase(_currentRoomId!);
      result.fold(
        (failure) {
          _logger.error('Error getting participants: ${failure.message}');
        },
        (participants) {
          _participants.clear();
          _participants.addAll(participants);
          emit(
            ChatState.participantsUpdated(
              participants: List.from(_participants),
            ),
          );
        },
      );
    } catch (e) {
      _logger.error('Error refreshing participants: $e');
    }
  }

  void disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
    }
    _isConnected = false;
    _messages.clear();
    _participants.clear();
    _currentRoomId = null;
    _currentUserId = null;
    _currentPage = 1;
    _hasMoreMessages = false;
    emit(const ChatState.disconnected());
  }

  /// Emit viewing_messages socket event
  /// Should be called when user is actively viewing the chat screen
  void emitViewingMessages() {
    if (_socket != null && _currentRoomId != null && _currentUserId != null) {
      _socket!.emit('viewing_messages', {
        'roomId': _currentRoomId,
        'userId': _currentUserId,
      });
      _logger.info('Emitted viewing_messages event');
    }
  }

  /// Mark all messages in the room as read
  Future<void> markAllAsRead() async {
    if (_currentRoomId == null || _currentUserId == null) return;

    try {
      final result = await _markAllAsReadUsecase(
        _currentRoomId!,
        _currentUserId!,
      );
      result.fold(
        (failure) {
          _logger.error('Error marking all as read: ${failure.message}');
        },
        (_) {
          _logger.info('All messages marked as read');
          // Refresh unread count after marking all as read
          refreshUnreadCount();
        },
      );
    } catch (e) {
      _logger.error('Error marking all as read: $e');
    }
  }

  @override
  Future<void> close() {
    disconnect();
    return super.close();
  }
}
