/// Generic paginated response wrapper that can be used for any model type
/// Handles the standard paginated API response structure
class PaginatedResponse<T> {
  final List<T> data;
  final int total;
  final int limit;
  final int offset;
  final int page;
  final int totalPages;
  final bool hasNext;
  final bool hasPrevious;

  const PaginatedResponse({
    required this.data,
    required this.total,
    required this.limit,
    required this.offset,
    required this.page,
    required this.totalPages,
    required this.hasNext,
    required this.hasPrevious,
  });

  factory PaginatedResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJsonT,
  ) {
    // Handle paginated response format: data.data contains the array
    final dataList = json['data'] as List<dynamic>? ?? [];

    return PaginatedResponse<T>(
      data:
          dataList
              .map((item) => fromJsonT(item as Map<String, dynamic>))
              .toList(),
      total: json['total'] as int? ?? 0,
      limit: json['limit'] as int? ?? 0,
      offset: json['offset'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      totalPages: json['totalPages'] as int? ?? 0,
      hasNext: json['hasNext'] as bool? ?? false,
      hasPrevious: json['hasPrevious'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson(Map<String, dynamic> Function(T) toJsonT) {
    return {
      'data': data.map((item) => toJsonT(item)).toList(),
      'total': total,
      'limit': limit,
      'offset': offset,
      'page': page,
      'totalPages': totalPages,
      'hasNext': hasNext,
      'hasPrevious': hasPrevious,
    };
  }
}
