import 'package:earkart_omni/models/audiometry/audiometry_test.entity.dart';
import 'package:earkart_omni/models/tympanometry/tympanometry_test.entity.dart';
import 'package:earkart_omni/models/oae/oae_test.entity.dart';
import 'package:earkart_omni/models/otoscopy/otoscopy_test.entity.dart';
import 'package:earkart_omni/models/consultation/consultation_recording.model.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:earkart_omni/models/audiologist/audiologist.entity.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:equatable/equatable.dart';

class ConsultationEntity extends Equatable {
  final String? id;
  final String? patientId;
  final String? audiologistId;
  final String? centreId;
  final PatientConsultationStatus? patientStatus;
  final AudiologistConsultationStatus? audiologistStatus;
  final AudiometryTestEntity? audiometry;
  final TympanometryTestEntity? tympanometry;
  final OAETestEntity? oae;
  final OtoscopyTestEntity? otoscopy;
  final String? notes;
  final SessionStatus? status;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  // Relations
  final PatientEntity? patient;
  final AudiologistEntity? audiologist;
  final CentreEntity? centre;
  final List<ConsultationRecording>? recordings;

  const ConsultationEntity({
    this.id,
    this.patientId,
    this.audiologistId,
    this.centreId,
    this.patientStatus,
    this.audiologistStatus,
    this.audiometry,
    this.tympanometry,
    this.oae,
    this.otoscopy,
    this.notes,
    this.status,
    this.createdAt,
    this.updatedAt,
    this.patient,
    this.audiologist,
    this.centre,
    this.recordings,
  });

  factory ConsultationEntity.fromJson(
    Map<String, dynamic> json,
  ) => ConsultationEntity(
    id: json['id'],
    patientId: json['patientId'],
    audiologistId: json['audiologistId'],
    centreId: json['centreId'],
    patientStatus:
        json['patientStatus'] != null
            ? patientConsultationStatusFromApi(json['patientStatus'])
            : null,
    audiologistStatus:
        json['audiologistStatus'] != null
            ? audiologistConsultationStatusFromApi(json['audiologistStatus'])
            : null,
    audiometry:
        json['audiometry'] != null
            ? AudiometryTestEntity.fromJson(json['audiometry'])
            : null,
    tympanometry:
        json['tympanometry'] != null
            ? TympanometryTestEntity.fromJson(json['tympanometry'])
            : null,
    oae: json['oae'] != null ? OAETestEntity.fromJson(json['oae']) : null,
    otoscopy:
        json['otoscopy'] != null
            ? OtoscopyTestEntity.fromJson(json['otoscopy'])
            : null,
    notes: json['notes'],
    status:
        json['status'] != null ? sessionStatusFromApi(json['status']) : null,
    createdAt:
        json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
    updatedAt:
        json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    patient:
        json['patient'] != null
            ? PatientEntity.fromJson(json['patient'])
            : null,
    audiologist:
        json['audiologist'] != null
            ? AudiologistEntity.fromJson(json['audiologist'])
            : null,
    centre:
        json['centre'] != null ? CentreEntity.fromJson(json['centre']) : null,
    recordings:
        (json['recordings'] as List?)
            ?.map((x) => ConsultationRecording.fromJson(x))
            .toList(),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'patientId': patientId,
    'audiologistId': audiologistId,
    'centreId': centreId,
    'patientStatus': patientStatus?.name,
    'audiologistStatus': audiologistStatus?.name,
    'audiometry': audiometry?.toJson(),
    'tympanometry': tympanometry?.toJson(),
    'oae': oae?.toJson(),
    'otoscopy': otoscopy?.toJson(),
    'notes': notes,
    'status': status?.name,
    'createdAt': createdAt?.toIso8601String(),
    'updatedAt': updatedAt?.toIso8601String(),
    'patient': patient?.toJson(),
    'audiologist': audiologist?.toJson(),
    'centre': centre?.toJson(),
    'recordings': recordings?.map((x) => x.toJson()).toList(),
  };

  @override
  List<Object?> get props => [
    id,
    patientId,
    audiologistId,
    centreId,
    patientStatus,
    audiologistStatus,
    audiometry,
    tympanometry,
    oae,
    otoscopy,
    notes,
    status,
    createdAt,
    updatedAt,
    patient,
    audiologist,
    centre,
    recordings,
  ];
}
