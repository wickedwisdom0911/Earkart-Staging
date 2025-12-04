import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/device/domain/repositories/device.repository.interface.dart';
import 'package:earkart_omni/models/device/device.entity.dart';

class GetCurrentDeviceUsecase {
  final IDeviceRepository deviceRepository;

  GetCurrentDeviceUsecase({required this.deviceRepository});

  Future<Either<Failure, DeviceEntity?>> call() async {
    return await deviceRepository.getCurrentDevice();
  }
}
