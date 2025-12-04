import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/language/language.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class LanguageEntityDataSource {
  static const String _boxName = Constants.languageDb;
  late Box<List<LanguageEntity>> languageEntityBox;

  Future<void> init() async {
    try {
      await Hive.openBox<List<LanguageEntity>>(_boxName);
      languageEntityBox = Hive.box<List<LanguageEntity>>(_boxName);
    } catch (e) {
      print("Error opening language box, clearing corrupted data: $e");
      try {
        try {
          await Hive.deleteBoxFromDisk(_boxName);
        } catch (deleteError) {
          print(
            "Note: Could not delete box files (may not exist): $deleteError",
          );
        }
        await Hive.openBox<List<LanguageEntity>>(_boxName);
        languageEntityBox = Hive.box<List<LanguageEntity>>(_boxName);
        print("Successfully cleared corrupted data and reopened box");
      } catch (clearError) {
        print("Failed to clear corrupted data: $clearError");
        try {
          await Hive.deleteFromDisk();
          await Hive.initFlutter();
          await Hive.openBox<List<LanguageEntity>>(_boxName);
          languageEntityBox = Hive.box<List<LanguageEntity>>(_boxName);
          print("Successfully cleared all Hive data and reopened box");
        } catch (finalError) {
          print("Final attempt failed: $finalError");
          rethrow;
        }
      }
    }
  }

  Box<List<LanguageEntity>> getBox() {
    return Hive.box<List<LanguageEntity>>(_boxName);
  }

  Future<void> addLanguageEntities(
    List<LanguageEntity> languageEntities,
  ) async {
    await languageEntityBox.put(0, languageEntities);
  }

  List<LanguageEntity>? getLanguageEntities() {
    return languageEntityBox.get(0);
  }

  Future<void> clearBox() async {
    print("Clearing language box....");
    try {
      await languageEntityBox.deleteAll(languageEntityBox.keys);
    } catch (e) {
      print(
        "Warning: Could not clear language box - it may not be initialized: $e",
      );
    }
  }
}
