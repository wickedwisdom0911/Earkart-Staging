import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/language/language.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class LanguageEntityDataSource {
  static const String _boxName = Constants.languageDb;
  late Box<List<LanguageEntity>> languageEntityBox;

  Future<void> init() async {
    await Hive.openBox<List<LanguageEntity>>(_boxName);
    languageEntityBox = Hive.box<List<LanguageEntity>>(_boxName);
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
