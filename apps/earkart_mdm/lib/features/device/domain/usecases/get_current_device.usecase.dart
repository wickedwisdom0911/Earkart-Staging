import 'package:earkart_mdm/features/device/domain/repositories/device.repository.interface.dart';
import 'package:earkart_mdm/models/device/device.entity.dart';

class GetCurrentDeviceUsecase {
  final IDeviceRepository _deviceRepository;

  GetCurrentDeviceUsecase({required IDeviceRepository deviceRepository})
    : _deviceRepository = deviceRepository;

  Future<DeviceEntity?> call() async {
    return await _deviceRepository.getCurrentDevice();
  }
}
