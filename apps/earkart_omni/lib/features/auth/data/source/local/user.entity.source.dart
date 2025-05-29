import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/user/user.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class UserEntityDataSource {
  static const String _boxName = Constants.userDb;
  late Box<UserEntity> _userEntityBox;

  Future<void> init() async {
    await Hive.openBox<UserEntity>(_boxName);
    _userEntityBox = Hive.box<UserEntity>(_boxName);
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
    print("Clearning user box....");
    await _userEntityBox.deleteAll(_userEntityBox.keys);
  }
}
