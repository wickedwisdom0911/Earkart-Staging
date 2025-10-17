import 'dart:convert';
import 'package:earkart_omni/models/audiologist/audiologist.entity.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'appointments.entity.dart';

AppointmentModel appointmentModelFromJson(String str) =>
    AppointmentModel.fromJson(json.decode(str));
String appointmentModelToJson(AppointmentModel data) =>
    json.encode(data.toJson());

// Custom class to handle different appointment data structures
class AppointmentData {
  final AppointmentDataType type;
  final AppointmentModelData? singleAppointment;
  final AppointmentListModel? appointmentList;
  final List<AppointmentModelData>? directList;

  const AppointmentData._({
    required this.type,
    this.singleAppointment,
    this.appointmentList,
    this.directList,
  });

  factory AppointmentData.single(AppointmentModelData appointment) {
    return AppointmentData._(
      type: AppointmentDataType.single,
      singleAppointment: appointment,
    );
  }

  factory AppointmentData.list(AppointmentListModel list) {
    return AppointmentData._(
      type: AppointmentDataType.list,
      appointmentList: list,
    );
  }

  factory AppointmentData.direct(List<AppointmentModelData> appointments) {
    return AppointmentData._(
      type: AppointmentDataType.direct,
      directList: appointments,
    );
  }

  factory AppointmentData.empty() {
    return const AppointmentData._(type: AppointmentDataType.empty);
  }

  factory AppointmentData.fromJson(dynamic dataJson) {
    if (dataJson == null) {
      return AppointmentData.empty();
    } else if (dataJson is List) {
      // Handle direct array format
      final appointments =
          dataJson.map((e) => AppointmentModelData.fromJson(e)).toList();
      return AppointmentData.direct(appointments);
    } else if (dataJson is Map<String, dynamic>) {
      // Check if it's the new appointments list format
      if (dataJson.containsKey('appointments') &&
          dataJson.containsKey('total')) {
        return AppointmentData.list(AppointmentListModel.fromJson(dataJson));
      } else {
        // Handle single appointment format
        return AppointmentData.single(AppointmentModelData.fromJson(dataJson));
      }
    } else {
      return AppointmentData.empty();
    }
  }

  dynamic toJson() {
    switch (type) {
      case AppointmentDataType.single:
        return singleAppointment?.toJson() ?? {};
      case AppointmentDataType.list:
        return appointmentList?.toJson() ?? {};
      case AppointmentDataType.direct:
        return directList?.map((e) => e.toJson()).toList() ?? [];
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
        return appointmentList?.appointments ?? [];
      case AppointmentDataType.direct:
        return directList ?? [];
      case AppointmentDataType.empty:
        return [];
    }
  }

  int get total {
    switch (type) {
      case AppointmentDataType.single:
        return singleAppointment != null ? 1 : 0;
      case AppointmentDataType.list:
        return appointmentList?.total ?? 0;
      case AppointmentDataType.direct:
        return directList?.length ?? 0;
      case AppointmentDataType.empty:
        return 0;
    }
  }
}

enum AppointmentDataType { single, list, direct, empty }

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
}

class AppointmentListModel {
  final List<AppointmentModelData> appointments;
  final int total;

  AppointmentListModel({required this.appointments, required this.total});

  factory AppointmentListModel.fromJson(Map<String, dynamic> json) {
    return AppointmentListModel(
      appointments:
          (json['appointments'] as List?)
              ?.map((e) => AppointmentModelData.fromJson(e))
              .toList() ??
          [],
      total: json['total'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'appointments': appointments.map((e) => e.toJson()).toList(),
      'total': total,
    };
  }
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
