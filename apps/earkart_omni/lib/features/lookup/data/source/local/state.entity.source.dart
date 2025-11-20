import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class StateEntityDataSource {
  static const String _boxName = Constants.stateDb;
  late Box<List<StateEntity>> stateEntityBox;

  Future<void> init() async {
    try {
      await Hive.openBox<List<StateEntity>>(_boxName);
      stateEntityBox = Hive.box<List<StateEntity>>(_boxName);
    } catch (e) {
      print("Error opening state box, clearing corrupted data: $e");
      try {
        try {
          await Hive.deleteBoxFromDisk(_boxName);
        } catch (deleteError) {
          print(
            "Note: Could not delete box files (may not exist): $deleteError",
          );
        }
        await Hive.openBox<List<StateEntity>>(_boxName);
        stateEntityBox = Hive.box<List<StateEntity>>(_boxName);
        print("Successfully cleared corrupted data and reopened box");
      } catch (clearError) {
        print("Failed to clear corrupted data: $clearError");
        try {
          await Hive.deleteFromDisk();
          await Hive.initFlutter();
          await Hive.openBox<List<StateEntity>>(_boxName);
          stateEntityBox = Hive.box<List<StateEntity>>(_boxName);
          print("Successfully cleared all Hive data and reopened box");
        } catch (finalError) {
          print("Final attempt failed: $finalError");
          rethrow;
        }
      }
    }
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
    print("Clearing state box....");
    try {
      await stateEntityBox.deleteAll(stateEntityBox.keys);
    } catch (e) {
      print(
        "Warning: Could not clear state box - it may not be initialized: $e",
      );
    }
  }
}
