import 'package:earkart_omni/models/audiometry/audiometry_test.model.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/tympanometry/tympanometry_test.model.dart';
import 'package:earkart_omni/models/oae/oae_test.model.dart';
import 'package:earkart_omni/models/otoscopy/otoscopy_test.model.dart';
import 'package:earkart_omni/models/consultation/consultation_recording.model.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:earkart_omni/models/audiologist/audiologist.entity.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';

class ConsultationModel {
  final bool success;
  final String message;
  final ConsultationModelData data;

  ConsultationModel({
    required this.success,
    required this.message,
    required this.data,
  });

  factory ConsultationModel.fromJson(Map<String, dynamic> json) {
    return ConsultationModel(
      success: json['success'],
      message: json['message'],
      data: ConsultationModelData.fromJson(json['data']),
    );
  }
}

class ConsultationModelData extends ConsultationEntity {
  @override
  final String id;
  @override
  final String patientId;
  @override
  final String? audiologistId;
  @override
  final String centreId;
  @override
  final PatientConsultationStatus patientStatus;
  @override
  final AudiologistConsultationStatus audiologistStatus;
  @override
  final AudiometryTest? audiometry;
  @override
  final TympanometryTest? tympanometry;
  @override
  final OAETest? oae;
  @override
  final OtoscopyTest? otoscopy;
  @override
  final String? notes;
  @override
  final SessionStatus status;
  @override
  final DateTime createdAt;
  @override
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
  }) : super(
         id: id,
         patientId: patientId,
         audiologistId: audiologistId,
         centreId: centreId,
         patientStatus: patientStatus,
         audiologistStatus: audiologistStatus,
         audiometry: audiometry,
         tympanometry: tympanometry,
         oae: oae,
         otoscopy: otoscopy,
         notes: notes,
         createdAt: createdAt,
         updatedAt: updatedAt,
         patient: patient,
         audiologist: audiologist,
         centre: centre,
         recordings: recordings,
       );

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
