import 'package:earkart_omni/features/consultation/domain/usecases/create_consultation.usecase.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/delete_current_consultation_session.usecase.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/get_consultation_by_id.usecase.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/get_consultations_by_centre_id.usecase.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/get_current_consultation.usecase.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/update_consultation.usecase.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class ConsultationCubit extends Cubit<ConsultationState> {
  final GetConsultationByIdUsecase getConsultationByIdUsecase;
  final CreateConsultationUsecase createConsultationUsecase;
  final UpdateConsultationUsecase updateConsultationUsecase;
  final DeleteCurrentConsultationSessionUsecase
  deleteCurrentConsultationSessionUsecase;
  final GetConsultationsByCentreIdUsecase getConsultationsByCentreIdUsecase;
  final GetCurrentConsultationUsecase getCurrentConsultationUsecase;

  ConsultationCubit({
    required this.getConsultationByIdUsecase,
    required this.createConsultationUsecase,
    required this.updateConsultationUsecase,
    required this.deleteCurrentConsultationSessionUsecase,
    required this.getConsultationsByCentreIdUsecase,
    required this.getCurrentConsultationUsecase,
  }) : super(ConsultationInitial());

  Future<void> getConsultationById(String id) async {
    emit(ConsultationLoading());
    final result = await getConsultationByIdUsecase(id);
    result.fold(
      (l) => emit(ConsultationError(message: l.message)),
      (r) => emit(ConsultationSuccess(consultation: r)),
    );
  }

  Future<void> createConsultation() async {
    emit(ConsultationLoading());
    final result = await createConsultationUsecase();
    result.fold(
      (l) => emit(ConsultationError(message: l.message)),
      (r) => emit(CreateConsultationSuccess(consultation: r)),
    );
  }

  Future<void> updateConsultation(ConsultationEntity consultation) async {
    emit(ConsultationLoading());
    final result = await updateConsultationUsecase(consultation);
    result.fold(
      (l) => emit(ConsultationError(message: l.message)),
      (r) => emit(ConsultationSuccess(consultation: r)),
    );
  }

  Future<void> deleteCurrentConsultationSession() async {
    emit(ConsultationLoading());
    final result = await deleteCurrentConsultationSessionUsecase();
    result.fold(
      (l) => emit(ConsultationError(message: l.message)),
      (r) => emit(DeleteConsultationSessionSuccess()),
    );
  }

  Future<void> getConsultationsByCentreId() async {
    emit(ConsultationLoading());
    final result = await getConsultationsByCentreIdUsecase();
    result.fold(
      (l) => emit(ConsultationError(message: l.message)),
      (r) => emit(AllConsultationsSuccess(consultations: r)),
    );
  }

  Future<void> getCurrentConsultation() async {
    emit(ConsultationLoading());
    final result = await getCurrentConsultationUsecase();
    result.fold(
      (l) => emit(ConsultationError(message: l.message)),
      (r) => emit(CurrentConsultationSuccess(consultation: r)),
    );
  }
}
