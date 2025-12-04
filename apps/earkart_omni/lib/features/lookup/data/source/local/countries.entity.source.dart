import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class CountryEntityDataSource {
  static const String _boxName = Constants.countryDb;
  late Box<List<CountryEntity>> countryEntityBox;

  Future<void> init() async {
    try {
      await Hive.openBox<List<CountryEntity>>(_boxName);
      countryEntityBox = Hive.box<List<CountryEntity>>(_boxName);
    } catch (e) {
      print("Error opening country box, clearing corrupted data: $e");
      try {
        try {
          await Hive.deleteBoxFromDisk(_boxName);
        } catch (deleteError) {
          print(
            "Note: Could not delete box files (may not exist): $deleteError",
          );
        }
        await Hive.openBox<List<CountryEntity>>(_boxName);
        countryEntityBox = Hive.box<List<CountryEntity>>(_boxName);
        print("Successfully cleared corrupted data and reopened box");
      } catch (clearError) {
        print("Failed to clear corrupted data: $clearError");
        try {
          await Hive.deleteFromDisk();
          await Hive.initFlutter();
          await Hive.openBox<List<CountryEntity>>(_boxName);
          countryEntityBox = Hive.box<List<CountryEntity>>(_boxName);
          print("Successfully cleared all Hive data and reopened box");
        } catch (finalError) {
          print("Final attempt failed: $finalError");
          rethrow;
        }
      }
    }
  }

  Box<CountryEntity> getBox() {
    return Hive.box<CountryEntity>(_boxName);
  }

  Future<void> addCountryEntities(List<CountryEntity> countryEntities) async {
    await countryEntityBox.put(0, countryEntities);
  }

  List<CountryEntity>? getCountryEntities() {
    return countryEntityBox.get(0);
  }

  Future<void> clearBox() async {
    print("Clearing country box....");
    try {
      await countryEntityBox.deleteAll(countryEntityBox.keys);
    } catch (e) {
      print(
        "Warning: Could not clear country box - it may not be initialized: $e",
      );
    }
  }
}
