import 'package:earkart_omni/features/consultation/domain/usecases/create_consultation.usecase.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/delete_current_consultation_session.usecase.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/get_consultation_by_id.usecase.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/get_consultations_by_centre_id.usecase.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/get_current_consultation.usecase.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/update_consultation.usecase.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/consultation.state.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:earkart_omni/models/consultation/consultation_pricing.entity.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class ConsultationCubit extends Cubit<ConsultationState> {
  final GetConsultationByIdUsecase getConsultationByIdUsecase;
  final CreateConsultationUsecase createConsultationUsecase;
  final UpdateConsultationUsecase updateConsultationUsecase;
  final DeleteCurrentConsultationSessionUsecase
  deleteCurrentConsultationSessionUsecase;
  final GetConsultationsByCentreIdUsecase getConsultationsByCentreIdUsecase;
  final GetCurrentConsultationUsecase getCurrentConsultationUsecase;

  static const int _pageSize = 10;
  int _currentOffset = 0;

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

  Future<void> createConsultation({
    List<ConsultationPricingEntity>? selectedServices,
    String? paymentId,
  }) async {
    emit(ConsultationLoading());
    final result = await createConsultationUsecase(
      selectedServices: selectedServices,
      paymentId: paymentId,
    );
    result.fold(
      (l) {
        emit(ConsultationError(message: l.message));
      },
      (r) {
        emit(CreateConsultationSuccess(consultation: r));
      },
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

  Future<void> getConsultationsByCentreId({bool refresh = false}) async {
    if (refresh) {
      _currentOffset = 0;
      emit(ConsultationLoading());
    } else {
      final currentState = state;
      if (currentState is AllConsultationsSuccess) {
        // Prevent duplicate calls if already loading more
        if (currentState.isLoadingMore) return;
        emit(currentState.copyWith(isLoadingMore: true));
      } else {
        emit(ConsultationLoading());
      }
    }

    final result = await getConsultationsByCentreIdUsecase(
      limit: _pageSize,
      offset: _currentOffset,
    );

    result.fold((l) => emit(AllConsultationsError(message: l.message)), (r) {
      final consultations = r.consultations;
      final currentState = state;
      if (currentState is AllConsultationsSuccess && !refresh) {
        // Append new consultations to existing list
        final updatedConsultations = [
          ...currentState.consultations,
          ...consultations,
        ];
        _currentOffset += consultations.length;
        emit(
          AllConsultationsSuccess(
            consultations: updatedConsultations,
            hasMore: r.hasNext,
            isLoadingMore: false,
          ),
        );
      } else {
        // First load or refresh
        _currentOffset = consultations.length;
        emit(
          AllConsultationsSuccess(
            consultations: consultations,
            hasMore: r.hasNext,
            isLoadingMore: false,
          ),
        );
      }
    });
  }

  Future<void> loadMoreConsultations() async {
    final currentState = state;
    if (currentState is AllConsultationsSuccess) {
      if (!currentState.isLoadingMore && currentState.hasMore) {
        await getConsultationsByCentreId(refresh: false);
      }
    }
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
