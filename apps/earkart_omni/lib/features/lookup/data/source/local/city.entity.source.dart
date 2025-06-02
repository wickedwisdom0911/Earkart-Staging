import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class CityEntityDataSource {
  static const String _boxName = Constants.cityDb;
  late Box<List<CityEntity>> cityEntityBox;

  Future<void> init() async {
    await Hive.openBox<List<CityEntity>>(_boxName);
    cityEntityBox = Hive.box<List<CityEntity>>(_boxName);
  }

  Box<List<CityEntity>> getBox() {
    return Hive.box<List<CityEntity>>(_boxName);
  }

  Future<void> addCityEntities(List<CityEntity> cityEntities) async {
    await cityEntityBox.put(0, cityEntities);
  }

  List<CityEntity>? getCityEntities() {
    return cityEntityBox.get(0);
  }

  Future<void> clearBox() async {
    print("Clearning city box....");
    await cityEntityBox.deleteAll(cityEntityBox.keys);
  }
}
