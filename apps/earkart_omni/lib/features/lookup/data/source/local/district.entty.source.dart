import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class DistrictEntityDataSource {
  static const String _boxName = Constants.districtDb;
  late Box<List<DistrictEntity>> districtEntityBox;

  Future<void> init() async {
    try {
      await Hive.openBox<List<DistrictEntity>>(_boxName);
      districtEntityBox = Hive.box<List<DistrictEntity>>(_boxName);
    } catch (e) {
      print("Error opening district box, clearing corrupted data: $e");
      try {
        try {
          await Hive.deleteBoxFromDisk(_boxName);
        } catch (deleteError) {
          print(
            "Note: Could not delete box files (may not exist): $deleteError",
          );
        }
        await Hive.openBox<List<DistrictEntity>>(_boxName);
        districtEntityBox = Hive.box<List<DistrictEntity>>(_boxName);
        print("Successfully cleared corrupted data and reopened box");
      } catch (clearError) {
        print("Failed to clear corrupted data: $clearError");
        try {
          await Hive.deleteFromDisk();
          await Hive.initFlutter();
          await Hive.openBox<List<DistrictEntity>>(_boxName);
          districtEntityBox = Hive.box<List<DistrictEntity>>(_boxName);
          print("Successfully cleared all Hive data and reopened box");
        } catch (finalError) {
          print("Final attempt failed: $finalError");
          rethrow;
        }
      }
    }
  }

  Box<List<DistrictEntity>> getBox() {
    return Hive.box<List<DistrictEntity>>(_boxName);
  }

  Future<void> addDistrictEntities(
    List<DistrictEntity> districtEntities,
  ) async {
    await districtEntityBox.put(0, districtEntities);
  }

  List<DistrictEntity>? getDistrictEntities() {
    return districtEntityBox.get(0);
  }

  Future<void> clearBox() async {
    print("Clearing district box....");
    try {
      await districtEntityBox.deleteAll(districtEntityBox.keys);
    } catch (e) {
      print(
        "Warning: Could not clear district box - it may not be initialized: $e",
      );
    }
  }
}
