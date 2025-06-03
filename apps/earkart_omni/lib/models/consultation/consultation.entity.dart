import 'package:earkart_omni/config/utils/hive_types.dart';
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
import 'package:hive/hive.dart';
part 'consultation.entity.g.dart';

@HiveType(typeId: HiveTypes.consultationEntity)
class ConsultationEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String? patientId;
  @HiveField(2)
  final String? audiologistId;
  @HiveField(3)
  final String? centreId;
  @HiveField(4)
  final PatientConsultationStatus? patientStatus;
  @HiveField(5)
  final AudiologistConsultationStatus? audiologistStatus;
  @HiveField(6)
  final AudiometryTestEntity? audiometry;
  @HiveField(7)
  final TympanometryTestEntity? tympanometry;
  @HiveField(8)
  final OAETestEntity? oae;
  @HiveField(9)
  final OtoscopyTestEntity? otoscopy;
  @HiveField(10)
  final String? notes;
  @HiveField(11)
  final SessionStatus? status;
  @HiveField(12)
  final DateTime? updatedAt;
  @HiveField(13)
  final DateTime? createdAt;
  // Relations
  @HiveField(14)
  final PatientEntity? patient;
  @HiveField(15)
  final AudiologistEntity? audiologist;
  @HiveField(16)
  final CentreEntity? centre;
  @HiveField(17)
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
