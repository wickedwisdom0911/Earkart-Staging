import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/consultation/domain/repositories/agora.respository.dart';
import 'package:earkart_omni/models/agora/agora.entity.dart';

class GetAgoraTokenUsecase {
  final IAgoraRepository agoraRepository;

  GetAgoraTokenUsecase(this.agoraRepository);

  Future<Either<Failure, AgoraEntity>> call(bool isUVC, String userRole) async {
    return await agoraRepository.getAgoraToken(isUVC, userRole);
  }
}
