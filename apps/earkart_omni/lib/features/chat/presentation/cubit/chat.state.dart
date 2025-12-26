import 'package:earkart_omni/models/chat/chat_message.entity.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'chat.state.freezed.dart';

@freezed
class ChatState with _$ChatState {
  const factory ChatState.initial() = ChatInitial;
  const factory ChatState.connecting() = ChatConnecting;
  const factory ChatState.connected({String? roomId}) = ChatConnected;
  const factory ChatState.messagesLoaded({
    required List<ChatMessage> messages,
    String? roomId,
  }) = ChatMessagesLoaded;
  const factory ChatState.messageReceived({
    required ChatMessage message,
    required List<ChatMessage> messages,
  }) = ChatMessageReceived;
  const factory ChatState.participantsUpdated({
    required List<ChatParticipant> participants,
  }) = ChatParticipantsUpdated;
  const factory ChatState.error({required String message}) = ChatError;
  const factory ChatState.disconnected() = ChatDisconnected;
}
