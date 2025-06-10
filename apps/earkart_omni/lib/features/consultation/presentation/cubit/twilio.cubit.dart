import 'package:earkart_omni/features/consultation/domain/usecases/create_room_usecase.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/delete_room_usecase.dart';
import 'package:earkart_omni/features/consultation/domain/usecases/get_token_usecase.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/twilio.state.dart';

class TwilioCubit extends Cubit<TwilioState> {
  final GetTokenUsecase getTokenUsecase;
  final CreateRoomUsecase createRoomUsecase;
  final DeleteRoomUsecase deleteRoomUsecase;

  TwilioCubit(
    this.getTokenUsecase,
    this.createRoomUsecase,
    this.deleteRoomUsecase,
  ) : super(const TwilioInitial());

  Future<void> getToken(String patientId, String consultationId) async {
    emit(const TwilioLoading());
    final result = await getTokenUsecase(patientId, consultationId);
    result.fold(
      (l) => emit(TwilioError(message: l.message)),
      (r) => emit(TwilioSuccess(token: r.data ?? "")),
    );
  }

  Future<void> createRoom(String consultationId) async {
    emit(const TwilioLoading());
    final result = await createRoomUsecase(consultationId);
    result.fold(
      (l) => emit(TwilioError(message: l.message)),
      (r) => emit(TwilioSuccess(token: r.data ?? "")),
    );
  }

  Future<void> deleteRoom(String consultationId) async {
    emit(const TwilioLoading());
    final result = await deleteRoomUsecase(consultationId);
    result.fold(
      (l) => emit(TwilioError(message: l.message)),
      (r) => emit(TwilioSuccess(token: r.data ?? "")),
    );
  }
}
