import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/device/domain/repositories/device.repository.interface.dart';
import 'package:earkart_omni/models/app_provisioning/app_provisioning.entity.dart';

class GetTabletUpdateUsecase {
  final IDeviceRepository deviceRepository;

  GetTabletUpdateUsecase({required this.deviceRepository});

  Future<Either<Failure, AppProvisioningEntity>> call() async {
    return await deviceRepository.getTabletUpdate();
  }
}
