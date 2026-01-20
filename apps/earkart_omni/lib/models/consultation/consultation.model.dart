import 'package:earkart_omni/models/audiometry/audiometry_test.model.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/consultation/consultation_pricing.entity.dart';
import 'package:earkart_omni/models/tympanometry/tympanometry_test.model.dart';
import 'package:earkart_omni/models/oae/oae_test.model.dart';
import 'package:earkart_omni/models/otoscopy/otoscopy_test.model.dart';
import 'package:earkart_omni/models/consultation/consultation_recording.model.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:earkart_omni/models/audiologist/audiologist.entity.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/paginated_response.dart';

// Custom class to handle consultation data structures
// All paginated APIs return the same structure: { data: [], total, hasNext, ... }
class ConsultationData {
  final ConsultationDataType type;
  final ConsultationModelData? singleConsultation;
  final PaginatedResponse<ConsultationModelData>? paginatedResponse;

  const ConsultationData._({
    required this.type,
    this.singleConsultation,
    this.paginatedResponse,
  });

  factory ConsultationData.single(ConsultationModelData consultation) {
    return ConsultationData._(
      type: ConsultationDataType.single,
      singleConsultation: consultation,
    );
  }

  factory ConsultationData.paginated(
    PaginatedResponse<ConsultationModelData> paginated,
  ) {
    return ConsultationData._(
      type: ConsultationDataType.list,
      paginatedResponse: paginated,
    );
  }

  factory ConsultationData.empty() {
    return const ConsultationData._(type: ConsultationDataType.empty);
  }

  factory ConsultationData.fromJson(dynamic dataJson) {
    if (dataJson == null) {
      return ConsultationData.empty();
    }

    if (dataJson is Map<String, dynamic>) {
      // Check if it's the paginated response format (has 'data' array and pagination fields)
      if (dataJson.containsKey('data') &&
          dataJson['data'] is List &&
          dataJson.containsKey('total')) {
        return ConsultationData.paginated(
          PaginatedResponse<ConsultationModelData>.fromJson(
            dataJson,
            (json) => ConsultationModelData.fromJson(json),
          ),
        );
      } else {
        // Handle single consultation format (for get-by-id endpoints)
        return ConsultationData.single(
          ConsultationModelData.fromJson(dataJson),
        );
      }
    }

    return ConsultationData.empty();
  }

  dynamic toJson() {
    switch (type) {
      case ConsultationDataType.single:
        return singleConsultation?.toJson() ?? {};
      case ConsultationDataType.list:
        return paginatedResponse?.toJson((item) => item.toJson()) ?? {};
      case ConsultationDataType.empty:
        return {};
    }
  }

  // Helper methods to get consultations in a consistent format
  List<ConsultationModelData> get consultations {
    switch (type) {
      case ConsultationDataType.single:
        return singleConsultation != null ? [singleConsultation!] : [];
      case ConsultationDataType.list:
        return paginatedResponse?.data ?? [];
      case ConsultationDataType.empty:
        return [];
    }
  }

  int get total {
    switch (type) {
      case ConsultationDataType.single:
        return singleConsultation != null ? 1 : 0;
      case ConsultationDataType.list:
        return paginatedResponse?.total ?? 0;
      case ConsultationDataType.empty:
        return 0;
    }
  }

  bool get hasNext {
    return type == ConsultationDataType.list
        ? (paginatedResponse?.hasNext ?? false)
        : false;
  }
}

enum ConsultationDataType { single, list, empty }

class ConsultationModel {
  final bool success;
  final String message;
  final ConsultationData data;

  ConsultationModel({
    required this.success,
    required this.message,
    required this.data,
  });

  factory ConsultationModel.fromJson(Map<String, dynamic> json) {
    return ConsultationModel(
      success: json['success'],
      message: json['message'],
      data: ConsultationData.fromJson(json['data']),
    );
  }

  Map<String, dynamic> toJson() {
    return {'success': success, 'message': message, 'data': data.toJson()};
  }

  // Helper methods to get consultations in a consistent format
  List<ConsultationModelData> get consultations => data.consultations;
  int get total => data.total;
  bool get hasNext => data.hasNext;
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
  @override
  final String? audiometryReport;
  @override
  final String? tympanometryReport;
  @override
  final String? etfReport;
  @override
  final String? sisiReport;
  @override
  final String? speechReport;
  @override
  final String? reflexesReport;
  @override
  final String? toneReport;
  @override
  final String? oaeReport;
  @override
  final String? otoscopyReport;

  // Relations
  final PatientEntity? patient;
  final AudiologistEntity? audiologist;
  final CentreEntity? centre;
  final List<ConsultationRecording>? recordings;
  final List<ConsultationPricingEntity>? consultationPricing;

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
         consultationPricing: consultationPricing,
         audiometryReport: audiometryReport,
         tympanometryReport: tympanometryReport,
         etfReport: etfReport,
         sisiReport: sisiReport,
         speechReport: speechReport,
         reflexesReport: reflexesReport,
         toneReport: toneReport,
         oaeReport: oaeReport,
         otoscopyReport: otoscopyReport,
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
          json['recordings'] != null && json['recordings'] is List
              ? List<ConsultationRecording>.from(
                (json['recordings'] as List).map(
                  (x) => ConsultationRecording.fromJson(x),
                ),
              )
              : <ConsultationRecording>[],
      consultationPricing:
          json['consultationPricing'] != null
              ? List<ConsultationPricingEntity>.from(
                (json['consultationPricing'] as List).map(
                  (x) => ConsultationPricingEntity.fromJson(x),
                ),
              )
              : null,
      audiometryReport: json['audiometryReport'],
      tympanometryReport: json['tympanometryReport'],
      etfReport: json['etfReport'],
      sisiReport: json['sisiReport'],
      speechReport: json['speechReport'],
      reflexesReport: json['reflexesReport'],
      toneReport: json['toneReport'],
      oaeReport: json['oaeReport'],
      otoscopyReport: json['otoscopyReport'],
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
      'consultationPricing':
          consultationPricing?.map((x) => x.toJson()).toList(),
      'audiometryReport': audiometryReport,
      'tympanometryReport': tympanometryReport,
      'etfReport': etfReport,
      'sisiReport': sisiReport,
      'speechReport': speechReport,
      'reflexesReport': reflexesReport,
      'toneReport': toneReport,
      'oaeReport': oaeReport,
      'otoscopyReport': otoscopyReport,
    };
  }
}
