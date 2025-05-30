import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class DeviceEntityDataSource {
  static const String _boxName = Constants.deviceDb;
  late Box<DeviceEntity> _deviceEntityBox;

  Future<void> init() async {
    await Hive.openBox<DeviceEntity>(_boxName);
    _deviceEntityBox = Hive.box<DeviceEntity>(_boxName);
  }

  Box<DeviceEntity> getBox() {
    return Hive.box<DeviceEntity>(_boxName);
  }

  Future<void> addDeviceEntity(DeviceEntity deviceEntity) async {
    await _deviceEntityBox.put(0, deviceEntity);
  }

  DeviceEntity? getDeviceEntity() {
    return _deviceEntityBox.get(0);
  }

  Future<void> clearBox() async {
    print("Clearning device box....");
    await _deviceEntityBox.deleteAll(_deviceEntityBox.keys);
  }
}
