import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/models/agora/agora.entity.dart';

abstract class IAgoraRepository {
  Future<Either<Failure, AgoraEntity>> getAgoraToken(
    bool isUVC,
    String userRole,
  );
}
