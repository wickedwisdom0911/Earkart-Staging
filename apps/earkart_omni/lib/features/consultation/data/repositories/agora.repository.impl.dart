import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/consultation/data/source/remote/agora.remote.source.dart';
import 'package:earkart_omni/features/consultation/domain/repositories/agora.respository.dart';
import 'package:earkart_omni/models/agora/agora.entity.dart';

class AgoraRepositoryImpl implements IAgoraRepository {
  final IAgoraRemoteSource agoraRemoteSource;

  AgoraRepositoryImpl(this.agoraRemoteSource);

  @override
  Future<Either<Failure, AgoraEntity>> getAgoraToken() async {
    return await agoraRemoteSource.getAgoraToken();
  }
}
