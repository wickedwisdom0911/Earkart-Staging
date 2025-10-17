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

class AppointmentModel {
  final bool success;
  final String message;
  final dynamic
  data; // Can be AppointmentModelData or List<AppointmentModelData>

  AppointmentModel({required this.success, required this.message, this.data});

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    var dataJson = json['data'];
    dynamic data;
    if (dataJson is List) {
      data = dataJson.map((e) => AppointmentModelData.fromJson(e)).toList();
    } else if (dataJson is Map<String, dynamic>) {
      data = AppointmentModelData.fromJson(dataJson);
    } else {
      data = null;
    }
    return AppointmentModel(
      success: json['success'],
      message: json['message'],
      data: data,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'success': success,
      'message': message,
      'data':
          data is List
              ? (data as List).map((e) => e.toJson()).toList()
              : data?.toJson(),
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
