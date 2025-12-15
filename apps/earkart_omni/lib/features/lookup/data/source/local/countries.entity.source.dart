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

  Box<List<CountryEntity>> getBox() {
    return Hive.box<List<CountryEntity>>(_boxName);
  }

  Future<void> addCountryEntities(List<CountryEntity> countryEntities) async {
    await countryEntityBox.put(0, countryEntities);
  }

  List<CountryEntity>? getCountryEntities() {
    try {
      final data = countryEntityBox.get(0);
      if (data == null) return null;

      // Convert to List<CountryEntity> explicitly to handle type safety
      // This handles cases where Hive stored CountryModelData or other subtypes
      // by creating new CountryEntity instances
      final result = <CountryEntity>[];
      for (final item in data) {
        // Create a new CountryEntity instance to ensure it's not a subtype
        // This handles cases where old cache might have CountryModelData instances
        result.add(
          CountryEntity(
            id: item.id,
            name: item.name,
            code: item.code,
            states: item.states,
            status: item.status,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          ),
        );
      }
      return result;
    } catch (e) {
      print('Error retrieving countries from cache: $e');
      // Clear corrupted cache and return null
      clearBox();
      return null;
    }
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
