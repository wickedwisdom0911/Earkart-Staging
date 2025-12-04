import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/user/user.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class CentreEntityDataSource {
  static const String _boxName = Constants.centreDb;
  late Box<CentreEntity> _centreEntityBox;

  Future<void> init() async {
    try {
      await Hive.openBox<CentreEntity>(_boxName);
      _centreEntityBox = Hive.box<CentreEntity>(_boxName);
    } catch (e) {
      print("Error opening centre box, clearing corrupted data: $e");
      try {
        try {
          await Hive.deleteBoxFromDisk(_boxName);
        } catch (deleteError) {
          print(
            "Note: Could not delete box files (may not exist): $deleteError",
          );
        }
        await Hive.openBox<CentreEntity>(_boxName);
        _centreEntityBox = Hive.box<CentreEntity>(_boxName);
        print("Successfully cleared corrupted data and reopened box");
      } catch (clearError) {
        print("Failed to clear corrupted data: $clearError");
        try {
          await Hive.deleteFromDisk();
          await Hive.initFlutter();
          await Hive.openBox<CentreEntity>(_boxName);
          _centreEntityBox = Hive.box<CentreEntity>(_boxName);
          print("Successfully cleared all Hive data and reopened box");
        } catch (finalError) {
          print("Final attempt failed: $finalError");
          rethrow;
        }
      }
    }
  }

  Box<UserEntity> getBox() {
    return Hive.box<UserEntity>(_boxName);
  }

  Future<void> addCentreEntity(CentreEntity centreEntity) async {
    await _centreEntityBox.put(0, centreEntity);
  }

  CentreEntity? getCentreEntity() {
    return _centreEntityBox.get(0);
  }

  Future<void> clearBox() async {
    print("Clearing centre box....");
    await _centreEntityBox.deleteAll(_centreEntityBox.keys);
  }
}
