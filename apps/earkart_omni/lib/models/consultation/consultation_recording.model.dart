class ConsultationRecording {
  final String id;
  final String sessionId;
  final String recordingUrl;
  final DateTime createdAt;
  final DateTime updatedAt;

  ConsultationRecording({
    required this.id,
    required this.sessionId,
    required this.recordingUrl,
    required this.createdAt,
    required this.updatedAt,
  });

  factory ConsultationRecording.fromJson(Map<String, dynamic> json) =>
      ConsultationRecording(
        id: json['id'],
        sessionId: json['sessionId'],
        recordingUrl: json['recordingUrl'],
        createdAt: DateTime.parse(json['createdAt']),
        updatedAt: DateTime.parse(json['updatedAt']),
      );

  Map<String, dynamic> toJson() => {
    'id': id,
    'sessionId': sessionId,
    'recordingUrl': recordingUrl,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
  };
}
