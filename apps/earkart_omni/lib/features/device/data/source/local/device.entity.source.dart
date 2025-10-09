import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/device/device.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class DeviceEntityDataSource {
  static const String _boxName = Constants.deviceDb;
  late Box<DeviceEntity> _deviceEntityBox;

  Future<void> init() async {
    try {
      await Hive.openBox<DeviceEntity>(_boxName);
      _deviceEntityBox = Hive.box<DeviceEntity>(_boxName);
    } catch (e) {
      print("Error opening device box, clearing corrupted data: $e");
      try {
        try {
          await Hive.deleteBoxFromDisk(_boxName);
        } catch (deleteError) {
          print(
            "Note: Could not delete box files (may not exist): $deleteError",
          );
        }
        await Hive.openBox<DeviceEntity>(_boxName);
        _deviceEntityBox = Hive.box<DeviceEntity>(_boxName);
        print("Successfully cleared corrupted data and reopened box");
      } catch (clearError) {
        print("Failed to clear corrupted data: $clearError");
        try {
          await Hive.deleteFromDisk();
          await Hive.initFlutter();
          await Hive.openBox<DeviceEntity>(_boxName);
          _deviceEntityBox = Hive.box<DeviceEntity>(_boxName);
          print("Successfully cleared all Hive data and reopened box");
        } catch (finalError) {
          print("Final attempt failed: $finalError");
          rethrow;
        }
      }
    }
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
    print("Clearing device box....");
    await _deviceEntityBox.deleteAll(_deviceEntityBox.keys);
  }
}
