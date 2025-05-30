import 'package:earkart_mdm/features/device/domain/repositories/device.repository.interface.dart';
import 'package:earkart_mdm/models/device/device.entity.dart';

class SetupDeviceUsecase {
  final IDeviceRepository deviceRepository;
  SetupDeviceUsecase({required this.deviceRepository});
  Future<DeviceEntity?> call(DeviceEntity deviceEntity) async {
    return await deviceRepository.setupDevice(deviceEntity);
  }
}
