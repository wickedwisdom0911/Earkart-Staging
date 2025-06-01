import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/centre/centre.entity.dart';
import 'package:earkart_omni/models/user/user.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class CentreEntityDataSource {
  static const String _boxName = Constants.centreDb;
  late Box<CentreEntity> _centreEntityBox;

  Future<void> init() async {
    await Hive.openBox<CentreEntity>(_boxName);
    _centreEntityBox = Hive.box<CentreEntity>(_boxName);
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
    print("Clearning centre box....");
    await _centreEntityBox.deleteAll(_centreEntityBox.keys);
  }
}
