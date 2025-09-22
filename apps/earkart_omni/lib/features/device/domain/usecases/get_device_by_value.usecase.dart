import 'package:earkart_omni/features/device/domain/repositories/device.repository.interface.dart';
import 'package:earkart_omni/models/device/device.entity.dart';

class GetDeviceByValueUsecase {
  final IDeviceRepository deviceRepository;

  GetDeviceByValueUsecase({required this.deviceRepository});

  Future<DeviceEntity?> call(String value) async {
    return await deviceRepository.getDeviceByValue(value);
  }
}
