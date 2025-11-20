import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/user/user.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class UserEntityDataSource {
  static const String _boxName = Constants.userDb;
  late Box<UserEntity> _userEntityBox;

  Future<void> init() async {
    try {
      await Hive.openBox<UserEntity>(_boxName);
      _userEntityBox = Hive.box<UserEntity>(_boxName);
    } catch (e) {
      print("Error opening user box, clearing corrupted data: $e");
      try {
        try {
          await Hive.deleteBoxFromDisk(_boxName);
        } catch (deleteError) {
          print(
            "Note: Could not delete box files (may not exist): $deleteError",
          );
        }
        await Hive.openBox<UserEntity>(_boxName);
        _userEntityBox = Hive.box<UserEntity>(_boxName);
        print("Successfully cleared corrupted data and reopened box");
      } catch (clearError) {
        print("Failed to clear corrupted data: $clearError");
        try {
          await Hive.deleteFromDisk();
          await Hive.initFlutter();
          await Hive.openBox<UserEntity>(_boxName);
          _userEntityBox = Hive.box<UserEntity>(_boxName);
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

  Future<void> addUserEntity(UserEntity userEntity) async {
    await _userEntityBox.put(0, userEntity);
  }

  UserEntity? getUserEntity() {
    return _userEntityBox.get(0);
  }

  Future<void> clearBox() async {
    print("Clearing user box....");
    await _userEntityBox.deleteAll(_userEntityBox.keys);
  }
}
