import 'dart:convert';
import 'package:earkart_omni/models/audiologist/audiologist.entity.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:earkart_omni/models/paginated_response.dart';
import 'appointments.entity.dart';

AppointmentModel appointmentModelFromJson(String str) =>
    AppointmentModel.fromJson(json.decode(str));
String appointmentModelToJson(AppointmentModel data) =>
    json.encode(data.toJson());

// Custom class to handle appointment data structures
// All paginated APIs return the same structure: { data: [], total, hasNext, ... }
class AppointmentData {
  final AppointmentDataType type;
  final AppointmentModelData? singleAppointment;
  final PaginatedResponse<AppointmentModelData>? paginatedResponse;

  const AppointmentData._({
    required this.type,
    this.singleAppointment,
    this.paginatedResponse,
  });

  factory AppointmentData.single(AppointmentModelData appointment) {
    return AppointmentData._(
      type: AppointmentDataType.single,
      singleAppointment: appointment,
    );
  }

  factory AppointmentData.paginated(
    PaginatedResponse<AppointmentModelData> paginated,
  ) {
    return AppointmentData._(
      type: AppointmentDataType.list,
      paginatedResponse: paginated,
    );
  }

  factory AppointmentData.empty() {
    return const AppointmentData._(type: AppointmentDataType.empty);
  }

  factory AppointmentData.fromJson(dynamic dataJson) {
    if (dataJson == null) {
      return AppointmentData.empty();
    }

    if (dataJson is Map<String, dynamic>) {
      // Check if it's the paginated response format (has 'data' array and pagination fields)
      if (dataJson.containsKey('data') &&
          dataJson['data'] is List &&
          dataJson.containsKey('total')) {
        return AppointmentData.paginated(
          PaginatedResponse<AppointmentModelData>.fromJson(
            dataJson,
            (json) => AppointmentModelData.fromJson(json),
          ),
        );
      } else {
        // Handle single appointment format (for get-by-id endpoints)
        return AppointmentData.single(AppointmentModelData.fromJson(dataJson));
      }
    }

    return AppointmentData.empty();
  }

  dynamic toJson() {
    switch (type) {
      case AppointmentDataType.single:
        return singleAppointment?.toJson() ?? {};
      case AppointmentDataType.list:
        return paginatedResponse?.toJson((item) => item.toJson()) ?? {};
      case AppointmentDataType.empty:
        return {};
    }
  }

  // Helper methods to get appointments in a consistent format
  List<AppointmentModelData> get appointments {
    switch (type) {
      case AppointmentDataType.single:
        return singleAppointment != null ? [singleAppointment!] : [];
      case AppointmentDataType.list:
        return paginatedResponse?.data ?? [];
      case AppointmentDataType.empty:
        return [];
    }
  }

  int get total {
    switch (type) {
      case AppointmentDataType.single:
        return singleAppointment != null ? 1 : 0;
      case AppointmentDataType.list:
        return paginatedResponse?.total ?? 0;
      case AppointmentDataType.empty:
        return 0;
    }
  }

  bool get hasNext {
    return type == AppointmentDataType.list
        ? (paginatedResponse?.hasNext ?? false)
        : false;
  }
}

enum AppointmentDataType { single, list, empty }

class AppointmentModel {
  final bool success;
  final String message;
  final AppointmentData data;

  AppointmentModel({
    required this.success,
    required this.message,
    required this.data,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      success: json['success'],
      message: json['message'],
      data: AppointmentData.fromJson(json['data']),
    );
  }

  Map<String, dynamic> toJson() {
    return {'success': success, 'message': message, 'data': data.toJson()};
  }

  // Helper methods to get appointments in a consistent format
  List<AppointmentModelData> get appointments => data.appointments;
  int get total => data.total;
  bool get hasNext => data.hasNext;
}

class AppointmentModelData extends AppointmentEntity {
  const AppointmentModelData({
    required super.id,
    required super.patientId,
    required super.centreId,
    super.audiologistId,
    super.consultationId,
    required super.scheduledStart,
    required super.scheduledEnd,
    required super.status,
    super.notes,
    required super.createdBy,
    required super.updatedBy,
    required super.createdAt,
    required super.updatedAt,
    super.patient,
    super.centre,
    super.audiologist,
    super.consultation,
  });

  factory AppointmentModelData.fromJson(Map<String, dynamic> json) {
    return AppointmentModelData(
      id: json['id'] ?? '',
      patientId: json['patientId'] ?? '',
      centreId: json['centreId'] ?? '',
      audiologistId: json['audiologistId'],
      consultationId: json['consultationId'],
      scheduledStart:
          json['scheduledStart'] != null
              ? DateTime.parse(json['scheduledStart'])
              : DateTime.now(),
      scheduledEnd:
          json['scheduledEnd'] != null
              ? DateTime.parse(json['scheduledEnd'])
              : DateTime.now(),
      status:
          json['status'] != null
              ? appointmentStatusFromApi(json['status'])
              : AppointmentStatus.requested,
      notes: json['notes'],
      createdBy: json['createdBy'] ?? '',
      updatedBy: json['updatedBy'] ?? '',
      createdAt:
          json['createdAt'] != null
              ? DateTime.parse(json['createdAt'])
              : DateTime.now(),
      updatedAt:
          json['updatedAt'] != null
              ? DateTime.parse(json['updatedAt'])
              : DateTime.now(),
      patient:
          json['patient'] != null
              ? PatientEntity.fromJson(json['patient'])
              : null,
      centre:
          json['centre'] != null ? CentreEntity.fromJson(json['centre']) : null,
      audiologist:
          json['audiologist'] != null
              ? AudiologistEntity.fromJson(json['audiologist'])
              : null,
      consultation:
          json['consultation'] != null
              ? ConsultationEntity.fromJson(json['consultation'])
              : null,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patientId': patientId,
      'centreId': centreId,
      'audiologistId': audiologistId,
      'consultationId': consultationId,
      'scheduledStart': scheduledStart.toIso8601String(),
      'scheduledEnd': scheduledEnd.toIso8601String(),
      'status': status.name.toUpperCase(),
      'notes': notes,
      'createdBy': createdBy,
      'updatedBy': updatedBy,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'patient': patient?.toJson(),
      'centre': centre?.toJson(),
      'audiologist': audiologist?.toJson(),
      'consultation': consultation?.toJson(),
    };
  }
}
