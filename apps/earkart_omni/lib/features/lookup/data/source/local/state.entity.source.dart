import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class StateEntityDataSource {
  static const String _boxName = Constants.stateDb;
  late Box<List<StateEntity>> stateEntityBox;

  Future<void> init() async {
    await Hive.openBox<List<StateEntity>>(_boxName);
    stateEntityBox = Hive.box<List<StateEntity>>(_boxName);
  }

  Box<List<StateEntity>> getBox() {
    return Hive.box<List<StateEntity>>(_boxName);
  }

  Future<void> addStateEntities(List<StateEntity> stateEntities) async {
    await stateEntityBox.put(0, stateEntities);
  }

  List<StateEntity>? getStateEntities() {
    return stateEntityBox.get(0);
  }

  Future<void> clearBox() async {
    print("Clearning state box....");
    await stateEntityBox.deleteAll(stateEntityBox.keys);
  }
}
