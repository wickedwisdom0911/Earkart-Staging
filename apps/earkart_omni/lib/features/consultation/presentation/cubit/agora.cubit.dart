import 'package:earkart_omni/features/consultation/domain/usecases/get_agora_token.usecase.dart';
import 'package:earkart_omni/features/consultation/presentation/cubit/agora.state.dart';
import 'package:earkart_omni/features/consultation/services/agora_token_renewal_service.dart';
import 'package:earkart_omni/models/agora/agora.entity.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class AgoraCubit extends Cubit<AgoraState> {
  final GetAgoraTokenUsecase getAgoraTokenUsecase;
  AgoraTokenRenewalService? _tokenRenewalService;

  AgoraCubit(this.getAgoraTokenUsecase) : super(AgoraState.initial()) {
    _initializeTokenRenewalService();
  }

  void _initializeTokenRenewalService() {
    _tokenRenewalService = AgoraTokenRenewalService(getAgoraTokenUsecase);

    // Set up callbacks
    _tokenRenewalService!.onTokenRenewed = (AgoraEntity newToken) {
      emit(AgoraSuccess(agora: newToken));
    };

    _tokenRenewalService!.onRenewalError = (String error) {
      emit(AgoraError(message: error));
    };
  }

  Future<void> getAgoraToken(bool isUVC, String userRole) async {
    emit(AgoraLoading());
    final result = await getAgoraTokenUsecase(isUVC, userRole);
    result.fold((failure) => emit(AgoraError(message: failure.message)), (
      agora,
    ) {
      // Get current state to preserve existing tokens

      // Create AgoraEntity with appropriate token storage
      final agoraEntity = AgoraEntity(
        token: agora.token, // Keep existing token for video calls
        appId: agora.appId,
        userId: agora.userId,
        expiresAt: agora.expiresAt,
        createdAt: agora.createdAt,
        isUVC: isUVC,
      );

      emit(AgoraSuccess(agora: agoraEntity));
      // Set up token renewal monitoring
      _tokenRenewalService?.setToken(agoraEntity, isUVC, userRole);
    });
  }

  /// Start monitoring token for automatic renewal
  void startTokenRenewalMonitoring(bool isUVC, String userRole) {
    _tokenRenewalService?.startMonitoring(isUVC, userRole);
  }

  /// Stop monitoring token renewal
  void stopTokenRenewalMonitoring() {
    _tokenRenewalService?.stopMonitoring();
  }

  /// Manually renew token
  Future<void> renewToken(bool isUVC, String userRole) async {
    await _tokenRenewalService?.renewToken(isUVC, userRole);
  }

  /// Get the token renewal service for use in other components
  AgoraTokenRenewalService? get tokenRenewalService => _tokenRenewalService;

  /// Check if token renewal is in progress
  bool get isRenewing => _tokenRenewalService?.isRenewing ?? false;

  /// Check if current token is valid
  bool get isTokenValid {
    final currentState = state;
    if (currentState is AgoraSuccess) {
      return !currentState.agora.isExpired;
    }
    return false;
  }

  /// Get time until token expires
  Duration? get timeUntilExpiration {
    final currentState = state;
    if (currentState is AgoraSuccess) {
      return currentState.agora.timeUntilExpiration;
    }
    return null;
  }

  @override
  Future<void> close() {
    _tokenRenewalService?.dispose();
    return super.close();
  }
}
