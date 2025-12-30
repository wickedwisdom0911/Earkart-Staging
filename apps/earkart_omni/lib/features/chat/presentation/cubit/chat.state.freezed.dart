// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'chat.state.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$ChatState {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() connecting,
    required TResult Function(String? roomId) connected,
    required TResult Function(
            List<ChatMessage> messages, String? roomId, bool hasMore)
        messagesLoaded,
    required TResult Function(ChatMessage message, List<ChatMessage> messages)
        messageReceived,
    required TResult Function(List<ChatParticipant> participants)
        participantsUpdated,
    required TResult Function(UnreadCount unreadCount) unreadCountLoaded,
    required TResult Function(String messageId, List<ReadReceipt> readReceipts)
        readReceiptsLoaded,
    required TResult Function(String message) error,
    required TResult Function() disconnected,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? connecting,
    TResult? Function(String? roomId)? connected,
    TResult? Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult? Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult? Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult? Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult? Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult? Function(String message)? error,
    TResult? Function()? disconnected,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? connecting,
    TResult Function(String? roomId)? connected,
    TResult Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult Function(String message)? error,
    TResult Function()? disconnected,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ChatInitial value) initial,
    required TResult Function(ChatConnecting value) connecting,
    required TResult Function(ChatConnected value) connected,
    required TResult Function(ChatMessagesLoaded value) messagesLoaded,
    required TResult Function(ChatMessageReceived value) messageReceived,
    required TResult Function(ChatParticipantsUpdated value)
        participantsUpdated,
    required TResult Function(ChatUnreadCountLoaded value) unreadCountLoaded,
    required TResult Function(ChatReadReceiptsLoaded value) readReceiptsLoaded,
    required TResult Function(ChatError value) error,
    required TResult Function(ChatDisconnected value) disconnected,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ChatInitial value)? initial,
    TResult? Function(ChatConnecting value)? connecting,
    TResult? Function(ChatConnected value)? connected,
    TResult? Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult? Function(ChatMessageReceived value)? messageReceived,
    TResult? Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult? Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult? Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult? Function(ChatError value)? error,
    TResult? Function(ChatDisconnected value)? disconnected,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ChatInitial value)? initial,
    TResult Function(ChatConnecting value)? connecting,
    TResult Function(ChatConnected value)? connected,
    TResult Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult Function(ChatMessageReceived value)? messageReceived,
    TResult Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult Function(ChatError value)? error,
    TResult Function(ChatDisconnected value)? disconnected,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $ChatStateCopyWith<$Res> {
  factory $ChatStateCopyWith(ChatState value, $Res Function(ChatState) then) =
      _$ChatStateCopyWithImpl<$Res, ChatState>;
}

/// @nodoc
class _$ChatStateCopyWithImpl<$Res, $Val extends ChatState>
    implements $ChatStateCopyWith<$Res> {
  _$ChatStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;
}

/// @nodoc
abstract class _$$ChatInitialImplCopyWith<$Res> {
  factory _$$ChatInitialImplCopyWith(
          _$ChatInitialImpl value, $Res Function(_$ChatInitialImpl) then) =
      __$$ChatInitialImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$ChatInitialImplCopyWithImpl<$Res>
    extends _$ChatStateCopyWithImpl<$Res, _$ChatInitialImpl>
    implements _$$ChatInitialImplCopyWith<$Res> {
  __$$ChatInitialImplCopyWithImpl(
      _$ChatInitialImpl _value, $Res Function(_$ChatInitialImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$ChatInitialImpl implements ChatInitial {
  const _$ChatInitialImpl();

  @override
  String toString() {
    return 'ChatState.initial()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$ChatInitialImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() connecting,
    required TResult Function(String? roomId) connected,
    required TResult Function(
            List<ChatMessage> messages, String? roomId, bool hasMore)
        messagesLoaded,
    required TResult Function(ChatMessage message, List<ChatMessage> messages)
        messageReceived,
    required TResult Function(List<ChatParticipant> participants)
        participantsUpdated,
    required TResult Function(UnreadCount unreadCount) unreadCountLoaded,
    required TResult Function(String messageId, List<ReadReceipt> readReceipts)
        readReceiptsLoaded,
    required TResult Function(String message) error,
    required TResult Function() disconnected,
  }) {
    return initial();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? connecting,
    TResult? Function(String? roomId)? connected,
    TResult? Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult? Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult? Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult? Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult? Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult? Function(String message)? error,
    TResult? Function()? disconnected,
  }) {
    return initial?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? connecting,
    TResult Function(String? roomId)? connected,
    TResult Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult Function(String message)? error,
    TResult Function()? disconnected,
    required TResult orElse(),
  }) {
    if (initial != null) {
      return initial();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ChatInitial value) initial,
    required TResult Function(ChatConnecting value) connecting,
    required TResult Function(ChatConnected value) connected,
    required TResult Function(ChatMessagesLoaded value) messagesLoaded,
    required TResult Function(ChatMessageReceived value) messageReceived,
    required TResult Function(ChatParticipantsUpdated value)
        participantsUpdated,
    required TResult Function(ChatUnreadCountLoaded value) unreadCountLoaded,
    required TResult Function(ChatReadReceiptsLoaded value) readReceiptsLoaded,
    required TResult Function(ChatError value) error,
    required TResult Function(ChatDisconnected value) disconnected,
  }) {
    return initial(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ChatInitial value)? initial,
    TResult? Function(ChatConnecting value)? connecting,
    TResult? Function(ChatConnected value)? connected,
    TResult? Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult? Function(ChatMessageReceived value)? messageReceived,
    TResult? Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult? Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult? Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult? Function(ChatError value)? error,
    TResult? Function(ChatDisconnected value)? disconnected,
  }) {
    return initial?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ChatInitial value)? initial,
    TResult Function(ChatConnecting value)? connecting,
    TResult Function(ChatConnected value)? connected,
    TResult Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult Function(ChatMessageReceived value)? messageReceived,
    TResult Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult Function(ChatError value)? error,
    TResult Function(ChatDisconnected value)? disconnected,
    required TResult orElse(),
  }) {
    if (initial != null) {
      return initial(this);
    }
    return orElse();
  }
}

abstract class ChatInitial implements ChatState {
  const factory ChatInitial() = _$ChatInitialImpl;
}

/// @nodoc
abstract class _$$ChatConnectingImplCopyWith<$Res> {
  factory _$$ChatConnectingImplCopyWith(_$ChatConnectingImpl value,
          $Res Function(_$ChatConnectingImpl) then) =
      __$$ChatConnectingImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$ChatConnectingImplCopyWithImpl<$Res>
    extends _$ChatStateCopyWithImpl<$Res, _$ChatConnectingImpl>
    implements _$$ChatConnectingImplCopyWith<$Res> {
  __$$ChatConnectingImplCopyWithImpl(
      _$ChatConnectingImpl _value, $Res Function(_$ChatConnectingImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$ChatConnectingImpl implements ChatConnecting {
  const _$ChatConnectingImpl();

  @override
  String toString() {
    return 'ChatState.connecting()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$ChatConnectingImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() connecting,
    required TResult Function(String? roomId) connected,
    required TResult Function(
            List<ChatMessage> messages, String? roomId, bool hasMore)
        messagesLoaded,
    required TResult Function(ChatMessage message, List<ChatMessage> messages)
        messageReceived,
    required TResult Function(List<ChatParticipant> participants)
        participantsUpdated,
    required TResult Function(UnreadCount unreadCount) unreadCountLoaded,
    required TResult Function(String messageId, List<ReadReceipt> readReceipts)
        readReceiptsLoaded,
    required TResult Function(String message) error,
    required TResult Function() disconnected,
  }) {
    return connecting();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? connecting,
    TResult? Function(String? roomId)? connected,
    TResult? Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult? Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult? Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult? Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult? Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult? Function(String message)? error,
    TResult? Function()? disconnected,
  }) {
    return connecting?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? connecting,
    TResult Function(String? roomId)? connected,
    TResult Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult Function(String message)? error,
    TResult Function()? disconnected,
    required TResult orElse(),
  }) {
    if (connecting != null) {
      return connecting();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ChatInitial value) initial,
    required TResult Function(ChatConnecting value) connecting,
    required TResult Function(ChatConnected value) connected,
    required TResult Function(ChatMessagesLoaded value) messagesLoaded,
    required TResult Function(ChatMessageReceived value) messageReceived,
    required TResult Function(ChatParticipantsUpdated value)
        participantsUpdated,
    required TResult Function(ChatUnreadCountLoaded value) unreadCountLoaded,
    required TResult Function(ChatReadReceiptsLoaded value) readReceiptsLoaded,
    required TResult Function(ChatError value) error,
    required TResult Function(ChatDisconnected value) disconnected,
  }) {
    return connecting(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ChatInitial value)? initial,
    TResult? Function(ChatConnecting value)? connecting,
    TResult? Function(ChatConnected value)? connected,
    TResult? Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult? Function(ChatMessageReceived value)? messageReceived,
    TResult? Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult? Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult? Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult? Function(ChatError value)? error,
    TResult? Function(ChatDisconnected value)? disconnected,
  }) {
    return connecting?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ChatInitial value)? initial,
    TResult Function(ChatConnecting value)? connecting,
    TResult Function(ChatConnected value)? connected,
    TResult Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult Function(ChatMessageReceived value)? messageReceived,
    TResult Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult Function(ChatError value)? error,
    TResult Function(ChatDisconnected value)? disconnected,
    required TResult orElse(),
  }) {
    if (connecting != null) {
      return connecting(this);
    }
    return orElse();
  }
}

abstract class ChatConnecting implements ChatState {
  const factory ChatConnecting() = _$ChatConnectingImpl;
}

/// @nodoc
abstract class _$$ChatConnectedImplCopyWith<$Res> {
  factory _$$ChatConnectedImplCopyWith(
          _$ChatConnectedImpl value, $Res Function(_$ChatConnectedImpl) then) =
      __$$ChatConnectedImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String? roomId});
}

/// @nodoc
class __$$ChatConnectedImplCopyWithImpl<$Res>
    extends _$ChatStateCopyWithImpl<$Res, _$ChatConnectedImpl>
    implements _$$ChatConnectedImplCopyWith<$Res> {
  __$$ChatConnectedImplCopyWithImpl(
      _$ChatConnectedImpl _value, $Res Function(_$ChatConnectedImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? roomId = freezed,
  }) {
    return _then(_$ChatConnectedImpl(
      roomId: freezed == roomId
          ? _value.roomId
          : roomId // ignore: cast_nullable_to_non_nullable
              as String?,
    ));
  }
}

/// @nodoc

class _$ChatConnectedImpl implements ChatConnected {
  const _$ChatConnectedImpl({this.roomId});

  @override
  final String? roomId;

  @override
  String toString() {
    return 'ChatState.connected(roomId: $roomId)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ChatConnectedImpl &&
            (identical(other.roomId, roomId) || other.roomId == roomId));
  }

  @override
  int get hashCode => Object.hash(runtimeType, roomId);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ChatConnectedImplCopyWith<_$ChatConnectedImpl> get copyWith =>
      __$$ChatConnectedImplCopyWithImpl<_$ChatConnectedImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() connecting,
    required TResult Function(String? roomId) connected,
    required TResult Function(
            List<ChatMessage> messages, String? roomId, bool hasMore)
        messagesLoaded,
    required TResult Function(ChatMessage message, List<ChatMessage> messages)
        messageReceived,
    required TResult Function(List<ChatParticipant> participants)
        participantsUpdated,
    required TResult Function(UnreadCount unreadCount) unreadCountLoaded,
    required TResult Function(String messageId, List<ReadReceipt> readReceipts)
        readReceiptsLoaded,
    required TResult Function(String message) error,
    required TResult Function() disconnected,
  }) {
    return connected(roomId);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? connecting,
    TResult? Function(String? roomId)? connected,
    TResult? Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult? Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult? Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult? Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult? Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult? Function(String message)? error,
    TResult? Function()? disconnected,
  }) {
    return connected?.call(roomId);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? connecting,
    TResult Function(String? roomId)? connected,
    TResult Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult Function(String message)? error,
    TResult Function()? disconnected,
    required TResult orElse(),
  }) {
    if (connected != null) {
      return connected(roomId);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ChatInitial value) initial,
    required TResult Function(ChatConnecting value) connecting,
    required TResult Function(ChatConnected value) connected,
    required TResult Function(ChatMessagesLoaded value) messagesLoaded,
    required TResult Function(ChatMessageReceived value) messageReceived,
    required TResult Function(ChatParticipantsUpdated value)
        participantsUpdated,
    required TResult Function(ChatUnreadCountLoaded value) unreadCountLoaded,
    required TResult Function(ChatReadReceiptsLoaded value) readReceiptsLoaded,
    required TResult Function(ChatError value) error,
    required TResult Function(ChatDisconnected value) disconnected,
  }) {
    return connected(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ChatInitial value)? initial,
    TResult? Function(ChatConnecting value)? connecting,
    TResult? Function(ChatConnected value)? connected,
    TResult? Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult? Function(ChatMessageReceived value)? messageReceived,
    TResult? Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult? Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult? Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult? Function(ChatError value)? error,
    TResult? Function(ChatDisconnected value)? disconnected,
  }) {
    return connected?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ChatInitial value)? initial,
    TResult Function(ChatConnecting value)? connecting,
    TResult Function(ChatConnected value)? connected,
    TResult Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult Function(ChatMessageReceived value)? messageReceived,
    TResult Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult Function(ChatError value)? error,
    TResult Function(ChatDisconnected value)? disconnected,
    required TResult orElse(),
  }) {
    if (connected != null) {
      return connected(this);
    }
    return orElse();
  }
}

abstract class ChatConnected implements ChatState {
  const factory ChatConnected({final String? roomId}) = _$ChatConnectedImpl;

  String? get roomId;
  @JsonKey(ignore: true)
  _$$ChatConnectedImplCopyWith<_$ChatConnectedImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$ChatMessagesLoadedImplCopyWith<$Res> {
  factory _$$ChatMessagesLoadedImplCopyWith(_$ChatMessagesLoadedImpl value,
          $Res Function(_$ChatMessagesLoadedImpl) then) =
      __$$ChatMessagesLoadedImplCopyWithImpl<$Res>;
  @useResult
  $Res call({List<ChatMessage> messages, String? roomId, bool hasMore});
}

/// @nodoc
class __$$ChatMessagesLoadedImplCopyWithImpl<$Res>
    extends _$ChatStateCopyWithImpl<$Res, _$ChatMessagesLoadedImpl>
    implements _$$ChatMessagesLoadedImplCopyWith<$Res> {
  __$$ChatMessagesLoadedImplCopyWithImpl(_$ChatMessagesLoadedImpl _value,
      $Res Function(_$ChatMessagesLoadedImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? messages = null,
    Object? roomId = freezed,
    Object? hasMore = null,
  }) {
    return _then(_$ChatMessagesLoadedImpl(
      messages: null == messages
          ? _value._messages
          : messages // ignore: cast_nullable_to_non_nullable
              as List<ChatMessage>,
      roomId: freezed == roomId
          ? _value.roomId
          : roomId // ignore: cast_nullable_to_non_nullable
              as String?,
      hasMore: null == hasMore
          ? _value.hasMore
          : hasMore // ignore: cast_nullable_to_non_nullable
              as bool,
    ));
  }
}

/// @nodoc

class _$ChatMessagesLoadedImpl implements ChatMessagesLoaded {
  const _$ChatMessagesLoadedImpl(
      {required final List<ChatMessage> messages,
      this.roomId,
      this.hasMore = false})
      : _messages = messages;

  final List<ChatMessage> _messages;
  @override
  List<ChatMessage> get messages {
    if (_messages is EqualUnmodifiableListView) return _messages;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_messages);
  }

  @override
  final String? roomId;
  @override
  @JsonKey()
  final bool hasMore;

  @override
  String toString() {
    return 'ChatState.messagesLoaded(messages: $messages, roomId: $roomId, hasMore: $hasMore)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ChatMessagesLoadedImpl &&
            const DeepCollectionEquality().equals(other._messages, _messages) &&
            (identical(other.roomId, roomId) || other.roomId == roomId) &&
            (identical(other.hasMore, hasMore) || other.hasMore == hasMore));
  }

  @override
  int get hashCode => Object.hash(runtimeType,
      const DeepCollectionEquality().hash(_messages), roomId, hasMore);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ChatMessagesLoadedImplCopyWith<_$ChatMessagesLoadedImpl> get copyWith =>
      __$$ChatMessagesLoadedImplCopyWithImpl<_$ChatMessagesLoadedImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() connecting,
    required TResult Function(String? roomId) connected,
    required TResult Function(
            List<ChatMessage> messages, String? roomId, bool hasMore)
        messagesLoaded,
    required TResult Function(ChatMessage message, List<ChatMessage> messages)
        messageReceived,
    required TResult Function(List<ChatParticipant> participants)
        participantsUpdated,
    required TResult Function(UnreadCount unreadCount) unreadCountLoaded,
    required TResult Function(String messageId, List<ReadReceipt> readReceipts)
        readReceiptsLoaded,
    required TResult Function(String message) error,
    required TResult Function() disconnected,
  }) {
    return messagesLoaded(messages, roomId, hasMore);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? connecting,
    TResult? Function(String? roomId)? connected,
    TResult? Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult? Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult? Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult? Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult? Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult? Function(String message)? error,
    TResult? Function()? disconnected,
  }) {
    return messagesLoaded?.call(messages, roomId, hasMore);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? connecting,
    TResult Function(String? roomId)? connected,
    TResult Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult Function(String message)? error,
    TResult Function()? disconnected,
    required TResult orElse(),
  }) {
    if (messagesLoaded != null) {
      return messagesLoaded(messages, roomId, hasMore);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ChatInitial value) initial,
    required TResult Function(ChatConnecting value) connecting,
    required TResult Function(ChatConnected value) connected,
    required TResult Function(ChatMessagesLoaded value) messagesLoaded,
    required TResult Function(ChatMessageReceived value) messageReceived,
    required TResult Function(ChatParticipantsUpdated value)
        participantsUpdated,
    required TResult Function(ChatUnreadCountLoaded value) unreadCountLoaded,
    required TResult Function(ChatReadReceiptsLoaded value) readReceiptsLoaded,
    required TResult Function(ChatError value) error,
    required TResult Function(ChatDisconnected value) disconnected,
  }) {
    return messagesLoaded(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ChatInitial value)? initial,
    TResult? Function(ChatConnecting value)? connecting,
    TResult? Function(ChatConnected value)? connected,
    TResult? Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult? Function(ChatMessageReceived value)? messageReceived,
    TResult? Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult? Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult? Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult? Function(ChatError value)? error,
    TResult? Function(ChatDisconnected value)? disconnected,
  }) {
    return messagesLoaded?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ChatInitial value)? initial,
    TResult Function(ChatConnecting value)? connecting,
    TResult Function(ChatConnected value)? connected,
    TResult Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult Function(ChatMessageReceived value)? messageReceived,
    TResult Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult Function(ChatError value)? error,
    TResult Function(ChatDisconnected value)? disconnected,
    required TResult orElse(),
  }) {
    if (messagesLoaded != null) {
      return messagesLoaded(this);
    }
    return orElse();
  }
}

abstract class ChatMessagesLoaded implements ChatState {
  const factory ChatMessagesLoaded(
      {required final List<ChatMessage> messages,
      final String? roomId,
      final bool hasMore}) = _$ChatMessagesLoadedImpl;

  List<ChatMessage> get messages;
  String? get roomId;
  bool get hasMore;
  @JsonKey(ignore: true)
  _$$ChatMessagesLoadedImplCopyWith<_$ChatMessagesLoadedImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$ChatMessageReceivedImplCopyWith<$Res> {
  factory _$$ChatMessageReceivedImplCopyWith(_$ChatMessageReceivedImpl value,
          $Res Function(_$ChatMessageReceivedImpl) then) =
      __$$ChatMessageReceivedImplCopyWithImpl<$Res>;
  @useResult
  $Res call({ChatMessage message, List<ChatMessage> messages});
}

/// @nodoc
class __$$ChatMessageReceivedImplCopyWithImpl<$Res>
    extends _$ChatStateCopyWithImpl<$Res, _$ChatMessageReceivedImpl>
    implements _$$ChatMessageReceivedImplCopyWith<$Res> {
  __$$ChatMessageReceivedImplCopyWithImpl(_$ChatMessageReceivedImpl _value,
      $Res Function(_$ChatMessageReceivedImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
    Object? messages = null,
  }) {
    return _then(_$ChatMessageReceivedImpl(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as ChatMessage,
      messages: null == messages
          ? _value._messages
          : messages // ignore: cast_nullable_to_non_nullable
              as List<ChatMessage>,
    ));
  }
}

/// @nodoc

class _$ChatMessageReceivedImpl implements ChatMessageReceived {
  const _$ChatMessageReceivedImpl(
      {required this.message, required final List<ChatMessage> messages})
      : _messages = messages;

  @override
  final ChatMessage message;
  final List<ChatMessage> _messages;
  @override
  List<ChatMessage> get messages {
    if (_messages is EqualUnmodifiableListView) return _messages;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_messages);
  }

  @override
  String toString() {
    return 'ChatState.messageReceived(message: $message, messages: $messages)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ChatMessageReceivedImpl &&
            (identical(other.message, message) || other.message == message) &&
            const DeepCollectionEquality().equals(other._messages, _messages));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType, message, const DeepCollectionEquality().hash(_messages));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ChatMessageReceivedImplCopyWith<_$ChatMessageReceivedImpl> get copyWith =>
      __$$ChatMessageReceivedImplCopyWithImpl<_$ChatMessageReceivedImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() connecting,
    required TResult Function(String? roomId) connected,
    required TResult Function(
            List<ChatMessage> messages, String? roomId, bool hasMore)
        messagesLoaded,
    required TResult Function(ChatMessage message, List<ChatMessage> messages)
        messageReceived,
    required TResult Function(List<ChatParticipant> participants)
        participantsUpdated,
    required TResult Function(UnreadCount unreadCount) unreadCountLoaded,
    required TResult Function(String messageId, List<ReadReceipt> readReceipts)
        readReceiptsLoaded,
    required TResult Function(String message) error,
    required TResult Function() disconnected,
  }) {
    return messageReceived(message, messages);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? connecting,
    TResult? Function(String? roomId)? connected,
    TResult? Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult? Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult? Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult? Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult? Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult? Function(String message)? error,
    TResult? Function()? disconnected,
  }) {
    return messageReceived?.call(message, messages);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? connecting,
    TResult Function(String? roomId)? connected,
    TResult Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult Function(String message)? error,
    TResult Function()? disconnected,
    required TResult orElse(),
  }) {
    if (messageReceived != null) {
      return messageReceived(message, messages);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ChatInitial value) initial,
    required TResult Function(ChatConnecting value) connecting,
    required TResult Function(ChatConnected value) connected,
    required TResult Function(ChatMessagesLoaded value) messagesLoaded,
    required TResult Function(ChatMessageReceived value) messageReceived,
    required TResult Function(ChatParticipantsUpdated value)
        participantsUpdated,
    required TResult Function(ChatUnreadCountLoaded value) unreadCountLoaded,
    required TResult Function(ChatReadReceiptsLoaded value) readReceiptsLoaded,
    required TResult Function(ChatError value) error,
    required TResult Function(ChatDisconnected value) disconnected,
  }) {
    return messageReceived(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ChatInitial value)? initial,
    TResult? Function(ChatConnecting value)? connecting,
    TResult? Function(ChatConnected value)? connected,
    TResult? Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult? Function(ChatMessageReceived value)? messageReceived,
    TResult? Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult? Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult? Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult? Function(ChatError value)? error,
    TResult? Function(ChatDisconnected value)? disconnected,
  }) {
    return messageReceived?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ChatInitial value)? initial,
    TResult Function(ChatConnecting value)? connecting,
    TResult Function(ChatConnected value)? connected,
    TResult Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult Function(ChatMessageReceived value)? messageReceived,
    TResult Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult Function(ChatError value)? error,
    TResult Function(ChatDisconnected value)? disconnected,
    required TResult orElse(),
  }) {
    if (messageReceived != null) {
      return messageReceived(this);
    }
    return orElse();
  }
}

abstract class ChatMessageReceived implements ChatState {
  const factory ChatMessageReceived(
      {required final ChatMessage message,
      required final List<ChatMessage> messages}) = _$ChatMessageReceivedImpl;

  ChatMessage get message;
  List<ChatMessage> get messages;
  @JsonKey(ignore: true)
  _$$ChatMessageReceivedImplCopyWith<_$ChatMessageReceivedImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$ChatParticipantsUpdatedImplCopyWith<$Res> {
  factory _$$ChatParticipantsUpdatedImplCopyWith(
          _$ChatParticipantsUpdatedImpl value,
          $Res Function(_$ChatParticipantsUpdatedImpl) then) =
      __$$ChatParticipantsUpdatedImplCopyWithImpl<$Res>;
  @useResult
  $Res call({List<ChatParticipant> participants});
}

/// @nodoc
class __$$ChatParticipantsUpdatedImplCopyWithImpl<$Res>
    extends _$ChatStateCopyWithImpl<$Res, _$ChatParticipantsUpdatedImpl>
    implements _$$ChatParticipantsUpdatedImplCopyWith<$Res> {
  __$$ChatParticipantsUpdatedImplCopyWithImpl(
      _$ChatParticipantsUpdatedImpl _value,
      $Res Function(_$ChatParticipantsUpdatedImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? participants = null,
  }) {
    return _then(_$ChatParticipantsUpdatedImpl(
      participants: null == participants
          ? _value._participants
          : participants // ignore: cast_nullable_to_non_nullable
              as List<ChatParticipant>,
    ));
  }
}

/// @nodoc

class _$ChatParticipantsUpdatedImpl implements ChatParticipantsUpdated {
  const _$ChatParticipantsUpdatedImpl(
      {required final List<ChatParticipant> participants})
      : _participants = participants;

  final List<ChatParticipant> _participants;
  @override
  List<ChatParticipant> get participants {
    if (_participants is EqualUnmodifiableListView) return _participants;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_participants);
  }

  @override
  String toString() {
    return 'ChatState.participantsUpdated(participants: $participants)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ChatParticipantsUpdatedImpl &&
            const DeepCollectionEquality()
                .equals(other._participants, _participants));
  }

  @override
  int get hashCode => Object.hash(
      runtimeType, const DeepCollectionEquality().hash(_participants));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ChatParticipantsUpdatedImplCopyWith<_$ChatParticipantsUpdatedImpl>
      get copyWith => __$$ChatParticipantsUpdatedImplCopyWithImpl<
          _$ChatParticipantsUpdatedImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() connecting,
    required TResult Function(String? roomId) connected,
    required TResult Function(
            List<ChatMessage> messages, String? roomId, bool hasMore)
        messagesLoaded,
    required TResult Function(ChatMessage message, List<ChatMessage> messages)
        messageReceived,
    required TResult Function(List<ChatParticipant> participants)
        participantsUpdated,
    required TResult Function(UnreadCount unreadCount) unreadCountLoaded,
    required TResult Function(String messageId, List<ReadReceipt> readReceipts)
        readReceiptsLoaded,
    required TResult Function(String message) error,
    required TResult Function() disconnected,
  }) {
    return participantsUpdated(participants);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? connecting,
    TResult? Function(String? roomId)? connected,
    TResult? Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult? Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult? Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult? Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult? Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult? Function(String message)? error,
    TResult? Function()? disconnected,
  }) {
    return participantsUpdated?.call(participants);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? connecting,
    TResult Function(String? roomId)? connected,
    TResult Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult Function(String message)? error,
    TResult Function()? disconnected,
    required TResult orElse(),
  }) {
    if (participantsUpdated != null) {
      return participantsUpdated(participants);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ChatInitial value) initial,
    required TResult Function(ChatConnecting value) connecting,
    required TResult Function(ChatConnected value) connected,
    required TResult Function(ChatMessagesLoaded value) messagesLoaded,
    required TResult Function(ChatMessageReceived value) messageReceived,
    required TResult Function(ChatParticipantsUpdated value)
        participantsUpdated,
    required TResult Function(ChatUnreadCountLoaded value) unreadCountLoaded,
    required TResult Function(ChatReadReceiptsLoaded value) readReceiptsLoaded,
    required TResult Function(ChatError value) error,
    required TResult Function(ChatDisconnected value) disconnected,
  }) {
    return participantsUpdated(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ChatInitial value)? initial,
    TResult? Function(ChatConnecting value)? connecting,
    TResult? Function(ChatConnected value)? connected,
    TResult? Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult? Function(ChatMessageReceived value)? messageReceived,
    TResult? Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult? Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult? Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult? Function(ChatError value)? error,
    TResult? Function(ChatDisconnected value)? disconnected,
  }) {
    return participantsUpdated?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ChatInitial value)? initial,
    TResult Function(ChatConnecting value)? connecting,
    TResult Function(ChatConnected value)? connected,
    TResult Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult Function(ChatMessageReceived value)? messageReceived,
    TResult Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult Function(ChatError value)? error,
    TResult Function(ChatDisconnected value)? disconnected,
    required TResult orElse(),
  }) {
    if (participantsUpdated != null) {
      return participantsUpdated(this);
    }
    return orElse();
  }
}

abstract class ChatParticipantsUpdated implements ChatState {
  const factory ChatParticipantsUpdated(
          {required final List<ChatParticipant> participants}) =
      _$ChatParticipantsUpdatedImpl;

  List<ChatParticipant> get participants;
  @JsonKey(ignore: true)
  _$$ChatParticipantsUpdatedImplCopyWith<_$ChatParticipantsUpdatedImpl>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$ChatUnreadCountLoadedImplCopyWith<$Res> {
  factory _$$ChatUnreadCountLoadedImplCopyWith(
          _$ChatUnreadCountLoadedImpl value,
          $Res Function(_$ChatUnreadCountLoadedImpl) then) =
      __$$ChatUnreadCountLoadedImplCopyWithImpl<$Res>;
  @useResult
  $Res call({UnreadCount unreadCount});
}

/// @nodoc
class __$$ChatUnreadCountLoadedImplCopyWithImpl<$Res>
    extends _$ChatStateCopyWithImpl<$Res, _$ChatUnreadCountLoadedImpl>
    implements _$$ChatUnreadCountLoadedImplCopyWith<$Res> {
  __$$ChatUnreadCountLoadedImplCopyWithImpl(_$ChatUnreadCountLoadedImpl _value,
      $Res Function(_$ChatUnreadCountLoadedImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? unreadCount = null,
  }) {
    return _then(_$ChatUnreadCountLoadedImpl(
      unreadCount: null == unreadCount
          ? _value.unreadCount
          : unreadCount // ignore: cast_nullable_to_non_nullable
              as UnreadCount,
    ));
  }
}

/// @nodoc

class _$ChatUnreadCountLoadedImpl implements ChatUnreadCountLoaded {
  const _$ChatUnreadCountLoadedImpl({required this.unreadCount});

  @override
  final UnreadCount unreadCount;

  @override
  String toString() {
    return 'ChatState.unreadCountLoaded(unreadCount: $unreadCount)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ChatUnreadCountLoadedImpl &&
            (identical(other.unreadCount, unreadCount) ||
                other.unreadCount == unreadCount));
  }

  @override
  int get hashCode => Object.hash(runtimeType, unreadCount);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ChatUnreadCountLoadedImplCopyWith<_$ChatUnreadCountLoadedImpl>
      get copyWith => __$$ChatUnreadCountLoadedImplCopyWithImpl<
          _$ChatUnreadCountLoadedImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() connecting,
    required TResult Function(String? roomId) connected,
    required TResult Function(
            List<ChatMessage> messages, String? roomId, bool hasMore)
        messagesLoaded,
    required TResult Function(ChatMessage message, List<ChatMessage> messages)
        messageReceived,
    required TResult Function(List<ChatParticipant> participants)
        participantsUpdated,
    required TResult Function(UnreadCount unreadCount) unreadCountLoaded,
    required TResult Function(String messageId, List<ReadReceipt> readReceipts)
        readReceiptsLoaded,
    required TResult Function(String message) error,
    required TResult Function() disconnected,
  }) {
    return unreadCountLoaded(unreadCount);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? connecting,
    TResult? Function(String? roomId)? connected,
    TResult? Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult? Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult? Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult? Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult? Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult? Function(String message)? error,
    TResult? Function()? disconnected,
  }) {
    return unreadCountLoaded?.call(unreadCount);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? connecting,
    TResult Function(String? roomId)? connected,
    TResult Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult Function(String message)? error,
    TResult Function()? disconnected,
    required TResult orElse(),
  }) {
    if (unreadCountLoaded != null) {
      return unreadCountLoaded(unreadCount);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ChatInitial value) initial,
    required TResult Function(ChatConnecting value) connecting,
    required TResult Function(ChatConnected value) connected,
    required TResult Function(ChatMessagesLoaded value) messagesLoaded,
    required TResult Function(ChatMessageReceived value) messageReceived,
    required TResult Function(ChatParticipantsUpdated value)
        participantsUpdated,
    required TResult Function(ChatUnreadCountLoaded value) unreadCountLoaded,
    required TResult Function(ChatReadReceiptsLoaded value) readReceiptsLoaded,
    required TResult Function(ChatError value) error,
    required TResult Function(ChatDisconnected value) disconnected,
  }) {
    return unreadCountLoaded(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ChatInitial value)? initial,
    TResult? Function(ChatConnecting value)? connecting,
    TResult? Function(ChatConnected value)? connected,
    TResult? Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult? Function(ChatMessageReceived value)? messageReceived,
    TResult? Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult? Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult? Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult? Function(ChatError value)? error,
    TResult? Function(ChatDisconnected value)? disconnected,
  }) {
    return unreadCountLoaded?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ChatInitial value)? initial,
    TResult Function(ChatConnecting value)? connecting,
    TResult Function(ChatConnected value)? connected,
    TResult Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult Function(ChatMessageReceived value)? messageReceived,
    TResult Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult Function(ChatError value)? error,
    TResult Function(ChatDisconnected value)? disconnected,
    required TResult orElse(),
  }) {
    if (unreadCountLoaded != null) {
      return unreadCountLoaded(this);
    }
    return orElse();
  }
}

abstract class ChatUnreadCountLoaded implements ChatState {
  const factory ChatUnreadCountLoaded(
      {required final UnreadCount unreadCount}) = _$ChatUnreadCountLoadedImpl;

  UnreadCount get unreadCount;
  @JsonKey(ignore: true)
  _$$ChatUnreadCountLoadedImplCopyWith<_$ChatUnreadCountLoadedImpl>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$ChatReadReceiptsLoadedImplCopyWith<$Res> {
  factory _$$ChatReadReceiptsLoadedImplCopyWith(
          _$ChatReadReceiptsLoadedImpl value,
          $Res Function(_$ChatReadReceiptsLoadedImpl) then) =
      __$$ChatReadReceiptsLoadedImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String messageId, List<ReadReceipt> readReceipts});
}

/// @nodoc
class __$$ChatReadReceiptsLoadedImplCopyWithImpl<$Res>
    extends _$ChatStateCopyWithImpl<$Res, _$ChatReadReceiptsLoadedImpl>
    implements _$$ChatReadReceiptsLoadedImplCopyWith<$Res> {
  __$$ChatReadReceiptsLoadedImplCopyWithImpl(
      _$ChatReadReceiptsLoadedImpl _value,
      $Res Function(_$ChatReadReceiptsLoadedImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? messageId = null,
    Object? readReceipts = null,
  }) {
    return _then(_$ChatReadReceiptsLoadedImpl(
      messageId: null == messageId
          ? _value.messageId
          : messageId // ignore: cast_nullable_to_non_nullable
              as String,
      readReceipts: null == readReceipts
          ? _value._readReceipts
          : readReceipts // ignore: cast_nullable_to_non_nullable
              as List<ReadReceipt>,
    ));
  }
}

/// @nodoc

class _$ChatReadReceiptsLoadedImpl implements ChatReadReceiptsLoaded {
  const _$ChatReadReceiptsLoadedImpl(
      {required this.messageId, required final List<ReadReceipt> readReceipts})
      : _readReceipts = readReceipts;

  @override
  final String messageId;
  final List<ReadReceipt> _readReceipts;
  @override
  List<ReadReceipt> get readReceipts {
    if (_readReceipts is EqualUnmodifiableListView) return _readReceipts;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_readReceipts);
  }

  @override
  String toString() {
    return 'ChatState.readReceiptsLoaded(messageId: $messageId, readReceipts: $readReceipts)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ChatReadReceiptsLoadedImpl &&
            (identical(other.messageId, messageId) ||
                other.messageId == messageId) &&
            const DeepCollectionEquality()
                .equals(other._readReceipts, _readReceipts));
  }

  @override
  int get hashCode => Object.hash(runtimeType, messageId,
      const DeepCollectionEquality().hash(_readReceipts));

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ChatReadReceiptsLoadedImplCopyWith<_$ChatReadReceiptsLoadedImpl>
      get copyWith => __$$ChatReadReceiptsLoadedImplCopyWithImpl<
          _$ChatReadReceiptsLoadedImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() connecting,
    required TResult Function(String? roomId) connected,
    required TResult Function(
            List<ChatMessage> messages, String? roomId, bool hasMore)
        messagesLoaded,
    required TResult Function(ChatMessage message, List<ChatMessage> messages)
        messageReceived,
    required TResult Function(List<ChatParticipant> participants)
        participantsUpdated,
    required TResult Function(UnreadCount unreadCount) unreadCountLoaded,
    required TResult Function(String messageId, List<ReadReceipt> readReceipts)
        readReceiptsLoaded,
    required TResult Function(String message) error,
    required TResult Function() disconnected,
  }) {
    return readReceiptsLoaded(messageId, readReceipts);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? connecting,
    TResult? Function(String? roomId)? connected,
    TResult? Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult? Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult? Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult? Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult? Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult? Function(String message)? error,
    TResult? Function()? disconnected,
  }) {
    return readReceiptsLoaded?.call(messageId, readReceipts);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? connecting,
    TResult Function(String? roomId)? connected,
    TResult Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult Function(String message)? error,
    TResult Function()? disconnected,
    required TResult orElse(),
  }) {
    if (readReceiptsLoaded != null) {
      return readReceiptsLoaded(messageId, readReceipts);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ChatInitial value) initial,
    required TResult Function(ChatConnecting value) connecting,
    required TResult Function(ChatConnected value) connected,
    required TResult Function(ChatMessagesLoaded value) messagesLoaded,
    required TResult Function(ChatMessageReceived value) messageReceived,
    required TResult Function(ChatParticipantsUpdated value)
        participantsUpdated,
    required TResult Function(ChatUnreadCountLoaded value) unreadCountLoaded,
    required TResult Function(ChatReadReceiptsLoaded value) readReceiptsLoaded,
    required TResult Function(ChatError value) error,
    required TResult Function(ChatDisconnected value) disconnected,
  }) {
    return readReceiptsLoaded(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ChatInitial value)? initial,
    TResult? Function(ChatConnecting value)? connecting,
    TResult? Function(ChatConnected value)? connected,
    TResult? Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult? Function(ChatMessageReceived value)? messageReceived,
    TResult? Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult? Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult? Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult? Function(ChatError value)? error,
    TResult? Function(ChatDisconnected value)? disconnected,
  }) {
    return readReceiptsLoaded?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ChatInitial value)? initial,
    TResult Function(ChatConnecting value)? connecting,
    TResult Function(ChatConnected value)? connected,
    TResult Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult Function(ChatMessageReceived value)? messageReceived,
    TResult Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult Function(ChatError value)? error,
    TResult Function(ChatDisconnected value)? disconnected,
    required TResult orElse(),
  }) {
    if (readReceiptsLoaded != null) {
      return readReceiptsLoaded(this);
    }
    return orElse();
  }
}

abstract class ChatReadReceiptsLoaded implements ChatState {
  const factory ChatReadReceiptsLoaded(
          {required final String messageId,
          required final List<ReadReceipt> readReceipts}) =
      _$ChatReadReceiptsLoadedImpl;

  String get messageId;
  List<ReadReceipt> get readReceipts;
  @JsonKey(ignore: true)
  _$$ChatReadReceiptsLoadedImplCopyWith<_$ChatReadReceiptsLoadedImpl>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$ChatErrorImplCopyWith<$Res> {
  factory _$$ChatErrorImplCopyWith(
          _$ChatErrorImpl value, $Res Function(_$ChatErrorImpl) then) =
      __$$ChatErrorImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String message});
}

/// @nodoc
class __$$ChatErrorImplCopyWithImpl<$Res>
    extends _$ChatStateCopyWithImpl<$Res, _$ChatErrorImpl>
    implements _$$ChatErrorImplCopyWith<$Res> {
  __$$ChatErrorImplCopyWithImpl(
      _$ChatErrorImpl _value, $Res Function(_$ChatErrorImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
  }) {
    return _then(_$ChatErrorImpl(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$ChatErrorImpl implements ChatError {
  const _$ChatErrorImpl({required this.message});

  @override
  final String message;

  @override
  String toString() {
    return 'ChatState.error(message: $message)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$ChatErrorImpl &&
            (identical(other.message, message) || other.message == message));
  }

  @override
  int get hashCode => Object.hash(runtimeType, message);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$ChatErrorImplCopyWith<_$ChatErrorImpl> get copyWith =>
      __$$ChatErrorImplCopyWithImpl<_$ChatErrorImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() connecting,
    required TResult Function(String? roomId) connected,
    required TResult Function(
            List<ChatMessage> messages, String? roomId, bool hasMore)
        messagesLoaded,
    required TResult Function(ChatMessage message, List<ChatMessage> messages)
        messageReceived,
    required TResult Function(List<ChatParticipant> participants)
        participantsUpdated,
    required TResult Function(UnreadCount unreadCount) unreadCountLoaded,
    required TResult Function(String messageId, List<ReadReceipt> readReceipts)
        readReceiptsLoaded,
    required TResult Function(String message) error,
    required TResult Function() disconnected,
  }) {
    return error(message);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? connecting,
    TResult? Function(String? roomId)? connected,
    TResult? Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult? Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult? Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult? Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult? Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult? Function(String message)? error,
    TResult? Function()? disconnected,
  }) {
    return error?.call(message);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? connecting,
    TResult Function(String? roomId)? connected,
    TResult Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult Function(String message)? error,
    TResult Function()? disconnected,
    required TResult orElse(),
  }) {
    if (error != null) {
      return error(message);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ChatInitial value) initial,
    required TResult Function(ChatConnecting value) connecting,
    required TResult Function(ChatConnected value) connected,
    required TResult Function(ChatMessagesLoaded value) messagesLoaded,
    required TResult Function(ChatMessageReceived value) messageReceived,
    required TResult Function(ChatParticipantsUpdated value)
        participantsUpdated,
    required TResult Function(ChatUnreadCountLoaded value) unreadCountLoaded,
    required TResult Function(ChatReadReceiptsLoaded value) readReceiptsLoaded,
    required TResult Function(ChatError value) error,
    required TResult Function(ChatDisconnected value) disconnected,
  }) {
    return error(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ChatInitial value)? initial,
    TResult? Function(ChatConnecting value)? connecting,
    TResult? Function(ChatConnected value)? connected,
    TResult? Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult? Function(ChatMessageReceived value)? messageReceived,
    TResult? Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult? Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult? Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult? Function(ChatError value)? error,
    TResult? Function(ChatDisconnected value)? disconnected,
  }) {
    return error?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ChatInitial value)? initial,
    TResult Function(ChatConnecting value)? connecting,
    TResult Function(ChatConnected value)? connected,
    TResult Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult Function(ChatMessageReceived value)? messageReceived,
    TResult Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult Function(ChatError value)? error,
    TResult Function(ChatDisconnected value)? disconnected,
    required TResult orElse(),
  }) {
    if (error != null) {
      return error(this);
    }
    return orElse();
  }
}

abstract class ChatError implements ChatState {
  const factory ChatError({required final String message}) = _$ChatErrorImpl;

  String get message;
  @JsonKey(ignore: true)
  _$$ChatErrorImplCopyWith<_$ChatErrorImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$ChatDisconnectedImplCopyWith<$Res> {
  factory _$$ChatDisconnectedImplCopyWith(_$ChatDisconnectedImpl value,
          $Res Function(_$ChatDisconnectedImpl) then) =
      __$$ChatDisconnectedImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$ChatDisconnectedImplCopyWithImpl<$Res>
    extends _$ChatStateCopyWithImpl<$Res, _$ChatDisconnectedImpl>
    implements _$$ChatDisconnectedImplCopyWith<$Res> {
  __$$ChatDisconnectedImplCopyWithImpl(_$ChatDisconnectedImpl _value,
      $Res Function(_$ChatDisconnectedImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$ChatDisconnectedImpl implements ChatDisconnected {
  const _$ChatDisconnectedImpl();

  @override
  String toString() {
    return 'ChatState.disconnected()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$ChatDisconnectedImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() connecting,
    required TResult Function(String? roomId) connected,
    required TResult Function(
            List<ChatMessage> messages, String? roomId, bool hasMore)
        messagesLoaded,
    required TResult Function(ChatMessage message, List<ChatMessage> messages)
        messageReceived,
    required TResult Function(List<ChatParticipant> participants)
        participantsUpdated,
    required TResult Function(UnreadCount unreadCount) unreadCountLoaded,
    required TResult Function(String messageId, List<ReadReceipt> readReceipts)
        readReceiptsLoaded,
    required TResult Function(String message) error,
    required TResult Function() disconnected,
  }) {
    return disconnected();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? connecting,
    TResult? Function(String? roomId)? connected,
    TResult? Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult? Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult? Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult? Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult? Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult? Function(String message)? error,
    TResult? Function()? disconnected,
  }) {
    return disconnected?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? connecting,
    TResult Function(String? roomId)? connected,
    TResult Function(List<ChatMessage> messages, String? roomId, bool hasMore)?
        messagesLoaded,
    TResult Function(ChatMessage message, List<ChatMessage> messages)?
        messageReceived,
    TResult Function(List<ChatParticipant> participants)? participantsUpdated,
    TResult Function(UnreadCount unreadCount)? unreadCountLoaded,
    TResult Function(String messageId, List<ReadReceipt> readReceipts)?
        readReceiptsLoaded,
    TResult Function(String message)? error,
    TResult Function()? disconnected,
    required TResult orElse(),
  }) {
    if (disconnected != null) {
      return disconnected();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(ChatInitial value) initial,
    required TResult Function(ChatConnecting value) connecting,
    required TResult Function(ChatConnected value) connected,
    required TResult Function(ChatMessagesLoaded value) messagesLoaded,
    required TResult Function(ChatMessageReceived value) messageReceived,
    required TResult Function(ChatParticipantsUpdated value)
        participantsUpdated,
    required TResult Function(ChatUnreadCountLoaded value) unreadCountLoaded,
    required TResult Function(ChatReadReceiptsLoaded value) readReceiptsLoaded,
    required TResult Function(ChatError value) error,
    required TResult Function(ChatDisconnected value) disconnected,
  }) {
    return disconnected(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(ChatInitial value)? initial,
    TResult? Function(ChatConnecting value)? connecting,
    TResult? Function(ChatConnected value)? connected,
    TResult? Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult? Function(ChatMessageReceived value)? messageReceived,
    TResult? Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult? Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult? Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult? Function(ChatError value)? error,
    TResult? Function(ChatDisconnected value)? disconnected,
  }) {
    return disconnected?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(ChatInitial value)? initial,
    TResult Function(ChatConnecting value)? connecting,
    TResult Function(ChatConnected value)? connected,
    TResult Function(ChatMessagesLoaded value)? messagesLoaded,
    TResult Function(ChatMessageReceived value)? messageReceived,
    TResult Function(ChatParticipantsUpdated value)? participantsUpdated,
    TResult Function(ChatUnreadCountLoaded value)? unreadCountLoaded,
    TResult Function(ChatReadReceiptsLoaded value)? readReceiptsLoaded,
    TResult Function(ChatError value)? error,
    TResult Function(ChatDisconnected value)? disconnected,
    required TResult orElse(),
  }) {
    if (disconnected != null) {
      return disconnected(this);
    }
    return orElse();
  }
}

abstract class ChatDisconnected implements ChatState {
  const factory ChatDisconnected() = _$ChatDisconnectedImpl;
}
