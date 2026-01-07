import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:earkart_omni/config/services/dio_exceptions.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/config/utils/custom_logger.dart';
import 'package:earkart_omni/di.dart';
import 'package:earkart_omni/features/auth/data/source/local/user.entity.source.dart';
import 'package:earkart_omni/features/chat/data/source/remote/chat.remote.source.dart';
import 'package:earkart_omni/models/chat/chat_message.entity.dart';
import 'package:earkart_omni/models/chat/paginated_messages.entity.dart';
import 'package:earkart_omni/models/chat/read_receipt.entity.dart';
import 'package:earkart_omni/models/chat/unread_count.entity.dart';

class ChatRemoteSourceImpl extends IChatRemoteSource {
  final Dio dio;
  final UserEntityDataSource userEntityDataSource;

  ChatRemoteSourceImpl({required this.dio, required this.userEntityDataSource});

  @override
  Future<Either<Failure, PaginatedMessages>> getRoomMessages(
    String roomId, {
    int? limit,
    int? offset,
    int? page,
    String? userId,
  }) async {
    try {
      final user = userEntityDataSource.getUserEntity();
      if (user?.token == null) {
        return left(UnKnownFailure(error: 'User not authenticated'));
      }

      final queryParams = <String, dynamic>{};
      if (limit != null) queryParams['limit'] = limit;
      if (offset != null) queryParams['offset'] = offset;
      if (page != null) queryParams['page'] = page;
      // Add userId to auto-mark messages as seen
      if (userId != null) queryParams['userId'] = userId;

      final response = await dio.get(
        Constants.getChatRoomMessagesUrl(roomId),
        queryParameters: queryParams.isEmpty ? null : queryParams,
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${user!.token}',
          },
        ),
      );

      di<ILogger>().debug('Get room messages response: ${response.data}');

      if (response.data is Map<String, dynamic>) {
        final data = response.data as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          final dataValue = data['data'];
          final currentUserId = user.id ?? '';

          // Handle case where data is directly an array
          if (dataValue is List) {
            final messages =
                dataValue
                    .map(
                      (msg) => ChatMessage.fromJson(
                        msg as Map<String, dynamic>,
                        currentUserId,
                      ),
                    )
                    .toList();

            // Create paginated response with default pagination info
            final paginatedMessages = PaginatedMessages(
              messages: messages,
              total: messages.length,
              limit: limit ?? 50,
              offset: offset ?? 0,
              page: page ?? 1,
              totalPages: 1,
              hasNext: false,
              hasPrevious: false,
            );
            return right(paginatedMessages);
          } else if (dataValue is Map<String, dynamic>) {
            // Handle case where data is a paginated object
            final paginatedMessages = PaginatedMessages.fromJson(
              dataValue,
              currentUserId,
            );
            return right(paginatedMessages);
          }
        }
        return left(
          UnKnownFailure(
            error: data['message']?.toString() ?? 'Failed to get messages',
          ),
        );
      }

      return left(UnKnownFailure(error: 'Invalid response format'));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      di<ILogger>().error('Error getting room messages: $e');
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<ChatParticipant>>> getRoomParticipants(
    String roomId,
  ) async {
    try {
      final user = userEntityDataSource.getUserEntity();
      if (user?.token == null) {
        return left(UnKnownFailure(error: 'User not authenticated'));
      }

      final response = await dio.get(
        Constants.getChatRoomParticipantsUrl(roomId),
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${user!.token}',
          },
        ),
      );

      di<ILogger>().debug('Get room participants response: ${response.data}');

      if (response.data is Map<String, dynamic>) {
        final data = response.data as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          final participantsList = data['data'] as List<dynamic>;
          final participants =
              participantsList
                  .map(
                    (p) => ChatParticipant.fromJson(p as Map<String, dynamic>),
                  )
                  .toList();
          return right(participants);
        }
        return left(
          UnKnownFailure(
            error: data['message']?.toString() ?? 'Failed to get participants',
          ),
        );
      }

      return left(UnKnownFailure(error: 'Invalid response format'));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      di<ILogger>().error('Error getting room participants: $e');
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, UnreadCount>> getRoomUnreadCount(String roomId) async {
    try {
      final user = userEntityDataSource.getUserEntity();
      if (user?.token == null || user?.id == null) {
        return left(UnKnownFailure(error: 'User not authenticated'));
      }

      final response = await dio.get(
        Constants.getChatRoomUnreadCountUrl(roomId),
        queryParameters: {'userId': user!.id},
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${user.token}',
          },
        ),
      );

      di<ILogger>().debug('Get unread count response: ${response.data}');

      if (response.data is Map<String, dynamic>) {
        final data = response.data as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          // Handle case where data is directly an integer
          final dataValue = data['data'];
          int count = 0;
          if (dataValue is int) {
            count = dataValue;
          } else if (dataValue is Map<String, dynamic>) {
            final unreadCount = UnreadCount.fromJson(dataValue);
            count = unreadCount.count;
          } else if (dataValue is num) {
            count = dataValue.toInt();
          }

          final unreadCount = UnreadCount(count: count);
          return right(unreadCount);
        }
        return left(
          UnKnownFailure(
            error: data['message']?.toString() ?? 'Failed to get unread count',
          ),
        );
      }

      return left(UnKnownFailure(error: 'Invalid response format'));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      di<ILogger>().error('Error getting unread count: $e');
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> markMessageAsRead(String messageId) async {
    try {
      final user = userEntityDataSource.getUserEntity();
      if (user?.token == null) {
        return left(UnKnownFailure(error: 'User not authenticated'));
      }

      final response = await dio.post(
        Constants.markMessageReadUrl(messageId),
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${user!.token}',
          },
        ),
      );

      di<ILogger>().debug('Mark message as read response: ${response.data}');

      if (response.data is Map<String, dynamic>) {
        final data = response.data as Map<String, dynamic>;
        if (data['success'] == true) {
          return right(null);
        }
        return left(
          UnKnownFailure(
            error:
                data['message']?.toString() ?? 'Failed to mark message as read',
          ),
        );
      }

      return right(null);
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      di<ILogger>().error('Error marking message as read: $e');
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> markAllAsRead(
    String roomId,
    String userId,
  ) async {
    try {
      final user = userEntityDataSource.getUserEntity();
      if (user?.token == null) {
        return left(UnKnownFailure(error: 'User not authenticated'));
      }

      final response = await dio.post(
        Constants.markAllAsReadUrl(roomId),
        data: {'userId': userId},
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${user!.token}',
          },
        ),
      );

      di<ILogger>().debug('Mark all as read response: ${response.data}');

      if (response.data is Map<String, dynamic>) {
        final data = response.data as Map<String, dynamic>;
        if (data['success'] == true) {
          return right(null);
        }
        return left(
          UnKnownFailure(
            error: data['message']?.toString() ?? 'Failed to mark all as read',
          ),
        );
      }

      return right(null);
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      di<ILogger>().error('Error marking all as read: $e');
      return left(UnKnownFailure(error: e.toString()));
    }
  }

  @override
  Future<Either<Failure, List<ReadReceipt>>> getMessageReadReceipts(
    String messageId,
  ) async {
    try {
      final user = userEntityDataSource.getUserEntity();
      if (user?.token == null) {
        return left(UnKnownFailure(error: 'User not authenticated'));
      }

      final response = await dio.get(
        Constants.getMessageReadReceiptsUrl(messageId),
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ${user!.token}',
          },
        ),
      );

      di<ILogger>().debug('Get read receipts response: ${response.data}');

      if (response.data is Map<String, dynamic>) {
        final data = response.data as Map<String, dynamic>;
        if (data['success'] == true && data['data'] != null) {
          final receiptsList = data['data'] as List<dynamic>;
          final receipts =
              receiptsList
                  .map((r) => ReadReceipt.fromJson(r as Map<String, dynamic>))
                  .toList();
          return right(receipts);
        }
        return left(
          UnKnownFailure(
            error: data['message']?.toString() ?? 'Failed to get read receipts',
          ),
        );
      }

      return left(UnKnownFailure(error: 'Invalid response format'));
    } on DioException catch (e) {
      final error = DioExceptions.fromDioError(e).toFailure();
      return left(error);
    } catch (e) {
      di<ILogger>().error('Error getting read receipts: $e');
      return left(UnKnownFailure(error: e.toString()));
    }
  }
}
