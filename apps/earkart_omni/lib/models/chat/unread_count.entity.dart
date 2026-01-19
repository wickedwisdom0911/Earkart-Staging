import 'package:equatable/equatable.dart';

class UnreadCount extends Equatable {
  final int count;

  const UnreadCount({required this.count});

  factory UnreadCount.fromJson(Map<String, dynamic> json) {
    return UnreadCount(
      count: (json['count'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {'count': count};
  }

  @override
  List<Object?> get props => [count];
}

