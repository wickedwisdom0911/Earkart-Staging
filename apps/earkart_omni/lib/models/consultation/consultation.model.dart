import 'package:earkart_omni/models/audiometry/audiometry_test.model.dart';
import 'package:earkart_omni/models/tympanometry/tympanometry_test.model.dart';
import 'package:earkart_omni/models/oae/oae_test.model.dart';
import 'package:earkart_omni/models/otoscopy/otoscopy_test.model.dart';
import 'package:earkart_omni/models/consultation/consultation_recording.model.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:earkart_omni/models/audiologist/audiologist.entity.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';

class ConsultationModelData {
  final String id;
  final String patientId;
  final String? audiologistId;
  final String centreId;
  final PatientConsultationStatus patientStatus;
  final AudiologistConsultationStatus audiologistStatus;
  final AudiometryTest? audiometry;
  final TympanometryTest? tympanometry;
  final OAETest? oae;
  final OtoscopyTest? otoscopy;
  final String? notes;
  final SessionStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Relations
  final PatientEntity? patient;
  final AudiologistEntity? audiologist;
  final CentreEntity? centre;
  final List<ConsultationRecording>? recordings;

  ConsultationModelData({
    required this.id,
    required this.patientId,
    this.audiologistId,
    required this.centreId,
    required this.patientStatus,
    required this.audiologistStatus,
    this.audiometry,
    this.tympanometry,
    this.oae,
    this.otoscopy,
    this.notes,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.patient,
    this.audiologist,
    this.centre,
    this.recordings,
  });

  factory ConsultationModelData.fromJson(Map<String, dynamic> json) {
    return ConsultationModelData(
      id: json['id'],
      patientId: json['patientId'],
      audiologistId: json['audiologistId'],
      centreId: json['centreId'],
      patientStatus: patientConsultationStatusFromApi(json['patientStatus']),
      audiologistStatus: audiologistConsultationStatusFromApi(
        json['audiologistStatus'],
      ),
      audiometry:
          json['audiometry'] != null
              ? AudiometryTest.fromJson(json['audiometry'])
              : null,
      tympanometry:
          json['tympanometry'] != null
              ? TympanometryTest.fromJson(json['tympanometry'])
              : null,
      oae: json['oae'] != null ? OAETest.fromJson(json['oae']) : null,
      otoscopy:
          json['otoscopy'] != null
              ? OtoscopyTest.fromJson(json['otoscopy'])
              : null,
      notes: json['notes'],
      status: sessionStatusFromApi(json['status']),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
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
          json['recordings'] != null
              ? List<ConsultationRecording>.from(
                (json['recordings'] as List).map(
                  (x) => ConsultationRecording.fromJson(x),
                ),
              )
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patientId': patientId,
      'audiologistId': audiologistId,
      'centreId': centreId,
      'patientStatus': patientStatus.name,
      'audiologistStatus': audiologistStatus.name,
      'audiometry': audiometry?.toJson(),
      'tympanometry': tympanometry?.toJson(),
      'oae': oae?.toJson(),
      'otoscopy': otoscopy?.toJson(),
      'notes': notes,
      'status': status.name,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'patient': patient?.toJson(),
      'audiologist': audiologist?.toJson(),
      'centre': centre?.toJson(),
      'recordings': recordings?.map((x) => x.toJson()).toList(),
    };
  }
}
