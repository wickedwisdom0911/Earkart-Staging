import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class CityEntityDataSource {
  static const String _boxName = Constants.cityDb;
  late Box<List<CityEntity>> cityEntityBox;

  Future<void> init() async {
    try {
      await Hive.openBox<List<CityEntity>>(_boxName);
      cityEntityBox = Hive.box<List<CityEntity>>(_boxName);
    } catch (e) {
      print("Error opening city box, clearing corrupted data: $e");
      try {
        try {
          await Hive.deleteBoxFromDisk(_boxName);
        } catch (deleteError) {
          print(
            "Note: Could not delete box files (may not exist): $deleteError",
          );
        }
        await Hive.openBox<List<CityEntity>>(_boxName);
        cityEntityBox = Hive.box<List<CityEntity>>(_boxName);
        print("Successfully cleared corrupted data and reopened box");
      } catch (clearError) {
        print("Failed to clear corrupted data: $clearError");
        try {
          await Hive.deleteFromDisk();
          await Hive.initFlutter();
          await Hive.openBox<List<CityEntity>>(_boxName);
          cityEntityBox = Hive.box<List<CityEntity>>(_boxName);
          print("Successfully cleared all Hive data and reopened box");
        } catch (finalError) {
          print("Final attempt failed: $finalError");
          rethrow;
        }
      }
    }
  }

  Box<List<CityEntity>> getBox() {
    return Hive.box<List<CityEntity>>(_boxName);
  }

  Future<void> addCityEntities(List<CityEntity> cityEntities) async {
    await cityEntityBox.put(0, cityEntities);
  }

  List<CityEntity>? getCityEntities() {
    try {
      final data = cityEntityBox.get(0);
      if (data == null) return null;

      // Convert to List<CityEntity> explicitly to handle type safety
      final result = <CityEntity>[];
      for (final item in data) {
        result.add(
          CityEntity(
            id: item.id,
            name: item.name,
            districtId: item.districtId,
            status: item.status,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            state: item.state,
            districts: item.districts,
          ),
        );
      }
      return result;
    } catch (e) {
      print('Error retrieving cities from cache: $e');
      clearBox();
      return null;
    }
  }

  Future<void> clearBox() async {
    print("Clearing city box....");
    try {
      await cityEntityBox.deleteAll(cityEntityBox.keys);
    } catch (e) {
      print(
        "Warning: Could not clear city box - it may not be initialized: $e",
      );
    }
  }
}
