import 'package:earkart_omni/config/utils/hive_types.dart';
import 'package:earkart_omni/models/audiometry/audiometry_test.entity.dart';
import 'package:earkart_omni/models/tympanometry/tympanometry_test.entity.dart';
import 'package:earkart_omni/models/oae/oae_test.entity.dart';
import 'package:earkart_omni/models/otoscopy/otoscopy_test.entity.dart';
import 'package:earkart_omni/models/consultation/consultation_recording.entity.dart';
import 'package:earkart_omni/models/consultation/consultation_pricing.entity.dart';
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
  final List<ConsultationRecordingEntity>? recordings;
  @HiveField(18)
  final List<ConsultationPricingEntity>? consultationPricing;
  @HiveField(19)
  final String? audiometryReport;
  @HiveField(20)
  final String? tympanometryReport;
  @HiveField(21)
  final String? etfReport;
  @HiveField(22)
  final String? sisiReport;
  @HiveField(23)
  final String? speechReport;
  @HiveField(24)
  final String? reflexesReport;
  @HiveField(25)
  final String? toneReport;
  @HiveField(26)
  final String? oaeReport;
  @HiveField(27)
  final String? otoscopyReport;
  @HiveField(28)
  final String? paymentId;

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
    this.consultationPricing,
    this.audiometryReport,
    this.tympanometryReport,
    this.etfReport,
    this.sisiReport,
    this.speechReport,
    this.reflexesReport,
    this.toneReport,
    this.oaeReport,
    this.otoscopyReport,
    this.paymentId,
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
        json['recordings'] != null && json['recordings'] is List
            ? (json['recordings'] as List)
                .map((x) => ConsultationRecordingEntity.fromJson(x))
                .toList()
            : <ConsultationRecordingEntity>[],
    consultationPricing:
        (json['consultationPricing'] as List?)
            ?.map((x) => ConsultationPricingEntity.fromJson(x))
            .toList(),
    audiometryReport: json['audiometryReport'],
    tympanometryReport: json['tympanometryReport'],
    etfReport: json['etfReport'],
    sisiReport: json['sisiReport'],
    speechReport: json['speechReport'],
    reflexesReport: json['reflexesReport'],
    toneReport: json['toneReport'],
    oaeReport: json['oaeReport'],
    otoscopyReport: json['otoscopyReport'],
    paymentId: json['paymentId'],
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'patientId': patientId,
    'audiologistId': audiologistId,
    'centreId': centreId,
    'patientStatus': patientStatus?.name.toUpperCase(),
    'audiologistStatus': audiologistStatus?.name.toUpperCase(),
    // 'audiometry': audiometry?.toJson(),
    // 'tympanometry': tympanometry?.toJson(),
    // 'oae': oae?.toJson(),
    // 'otoscopy': otoscopy?.toJson(),
    'notes': notes,
    'status': status != null ? toUpperSnakeCase(status!.name) : null,
    'selectedServices': consultationPricing?.map((x) => x.toJson()).toList(),
    'audiometryReport': audiometryReport,
    'tympanometryReport': tympanometryReport,
    'etfReport': etfReport,
    'sisiReport': sisiReport,
    'speechReport': speechReport,
    'reflexesReport': reflexesReport,
    'toneReport': toneReport,
    'oaeReport': oaeReport,
    'otoscopyReport': otoscopyReport,
    'paymentId': paymentId,
  };

  ConsultationEntity copyWith({
    String? id,
    String? patientId,
    String? audiologistId,
    String? centreId,
    PatientConsultationStatus? patientStatus,
    AudiologistConsultationStatus? audiologistStatus,
    AudiometryTestEntity? audiometry,
    TympanometryTestEntity? tympanometry,
    OAETestEntity? oae,
    OtoscopyTestEntity? otoscopy,
    String? notes,
    SessionStatus? status,
    DateTime? updatedAt,
    DateTime? createdAt,
    PatientEntity? patient,
    AudiologistEntity? audiologist,
    CentreEntity? centre,
    List<ConsultationRecordingEntity>? recordings,
    List<ConsultationPricingEntity>? consultationPricing,
    String? audiometryReport,
    String? tympanometryReport,
    String? etfReport,
    String? sisiReport,
    String? speechReport,
    String? reflexesReport,
    String? toneReport,
    String? oaeReport,
    String? otoscopyReport,
    String? paymentId,
  }) {
    return ConsultationEntity(
      id: id ?? this.id,
      patientId: patientId ?? this.patientId,
      audiologistId: audiologistId ?? this.audiologistId,
      centreId: centreId ?? this.centreId,
      patientStatus: patientStatus ?? this.patientStatus,
      audiologistStatus: audiologistStatus ?? this.audiologistStatus,
      audiometry: audiometry ?? this.audiometry,
      tympanometry: tympanometry ?? this.tympanometry,
      oae: oae ?? this.oae,
      otoscopy: otoscopy ?? this.otoscopy,
      notes: notes ?? this.notes,
      status: status ?? this.status,
      updatedAt: updatedAt ?? this.updatedAt,
      createdAt: createdAt ?? this.createdAt,
      patient: patient ?? this.patient,
      audiologist: audiologist ?? this.audiologist,
      centre: centre ?? this.centre,
      recordings: recordings ?? this.recordings,
      consultationPricing: consultationPricing ?? this.consultationPricing,
      paymentId: paymentId ?? this.paymentId,
    );
  }

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
    consultationPricing,
    audiometryReport,
    tympanometryReport,
    etfReport,
    sisiReport,
    speechReport,
    reflexesReport,
    toneReport,
    oaeReport,
    otoscopyReport,
    paymentId,
  ];
}
