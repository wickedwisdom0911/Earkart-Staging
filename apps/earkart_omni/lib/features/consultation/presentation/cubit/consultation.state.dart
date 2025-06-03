import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'consultation.state.freezed.dart';

@freezed
class ConsultationState with _$ConsultationState {
  const factory ConsultationState.initial() = ConsultationInitial;
  const factory ConsultationState.loading() = ConsultationLoading;
  const factory ConsultationState.success({
    required ConsultationEntity consultation,
  }) = ConsultationSuccess;
  const factory ConsultationState.createConsultationSuccess({
    required ConsultationEntity consultation,
  }) = CreateConsultationSuccess;
  const factory ConsultationState.allConsultationsSuccess({
    required List<ConsultationEntity> consultations,
  }) = AllConsultationsSuccess;
  const factory ConsultationState.currentConsultationSuccess({
    required ConsultationEntity consultation,
  }) = CurrentConsultationSuccess;
  const factory ConsultationState.deleteConsultationSessionSuccess() =
      DeleteConsultationSessionSuccess;
  const factory ConsultationState.error({required String message}) =
      ConsultationError;
}
