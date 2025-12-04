import 'package:earkart_omni/config/utils/hive_types.dart';
import 'package:earkart_omni/models/audiologist/audiologist.entity.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:equatable/equatable.dart';
import 'package:hive/hive.dart';

part 'appointments.entity.g.dart';

@HiveType(typeId: HiveTypes.appointmentEntity)
class AppointmentEntity extends Equatable {
  @HiveField(0)
  final String id;

  @HiveField(1)
  final String patientId;

  @HiveField(2)
  final String centreId;

  @HiveField(3)
  final String? audiologistId;

  @HiveField(4)
  final String? consultationId;

  @HiveField(5)
  final DateTime scheduledStart;

  @HiveField(6)
  final DateTime scheduledEnd;

  @HiveField(7)
  final AppointmentStatus status;

  @HiveField(8)
  final String? notes;

  @HiveField(9)
  final String createdBy;

  @HiveField(10)
  final String updatedBy;

  @HiveField(11)
  final DateTime createdAt;

  @HiveField(12)
  final DateTime updatedAt;

  // Relations
  @HiveField(13)
  final PatientEntity? patient;

  @HiveField(14)
  final CentreEntity? centre;

  @HiveField(15)
  final AudiologistEntity? audiologist;

  @HiveField(16)
  final ConsultationEntity? consultation;

  const AppointmentEntity({
    required this.id,
    required this.patientId,
    required this.centreId,
    this.audiologistId,
    this.consultationId,
    required this.scheduledStart,
    required this.scheduledEnd,
    required this.status,
    this.notes,
    required this.createdBy,
    required this.updatedBy,
    required this.createdAt,
    required this.updatedAt,
    this.patient,
    this.centre,
    this.audiologist,
    this.consultation,
  });

  factory AppointmentEntity.fromJson(Map<String, dynamic> json) {
    return AppointmentEntity(
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

  AppointmentEntity copyWith({
    String? id,
    String? patientId,
    String? centreId,
    String? audiologistId,
    String? consultationId,
    DateTime? scheduledStart,
    DateTime? scheduledEnd,
    AppointmentStatus? status,
    String? notes,
    String? createdBy,
    String? updatedBy,
    DateTime? createdAt,
    DateTime? updatedAt,
    PatientEntity? patient,
    CentreEntity? centre,
    AudiologistEntity? audiologist,
    ConsultationEntity? consultation,
  }) {
    return AppointmentEntity(
      id: id ?? this.id,
      patientId: patientId ?? this.patientId,
      centreId: centreId ?? this.centreId,
      audiologistId: audiologistId ?? this.audiologistId,
      consultationId: consultationId ?? this.consultationId,
      scheduledStart: scheduledStart ?? this.scheduledStart,
      scheduledEnd: scheduledEnd ?? this.scheduledEnd,
      status: status ?? this.status,
      notes: notes ?? this.notes,
      createdBy: createdBy ?? this.createdBy,
      updatedBy: updatedBy ?? this.updatedBy,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      patient: patient ?? this.patient,
      centre: centre ?? this.centre,
      audiologist: audiologist ?? this.audiologist,
      consultation: consultation ?? this.consultation,
    );
  }

  @override
  List<Object?> get props => [
    id,
    patientId,
    centreId,
    audiologistId,
    consultationId,
    scheduledStart,
    scheduledEnd,
    status,
    notes,
    createdBy,
    updatedBy,
    createdAt,
    updatedAt,
    patient,
    centre,
    audiologist,
    consultation,
  ];
}
