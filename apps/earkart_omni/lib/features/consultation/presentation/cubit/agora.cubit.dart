import 'package:earkart_omni/features/consultation/domain/usecases/get_agora_token.usecase.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.state.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class AgoraCubit extends Cubit<AgoraState> {
  final GetAgoraTokenUsecase getAgoraTokenUsecase;
  AgoraCubit(this.getAgoraTokenUsecase) : super(AgoraState.initial());

  Future<void> getAgoraToken() async {
    emit(AgoraLoading());
    final result = await getAgoraTokenUsecase();
    result.fold(
      (failure) => emit(AgoraError(message: failure.message)),
      (agora) => emit(AgoraSuccess(agora: agora)),
    );
  }
}
