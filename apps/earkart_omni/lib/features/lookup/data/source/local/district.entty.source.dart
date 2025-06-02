import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class DistrictEntityDataSource {
  static const String _boxName = Constants.districtDb;
  late Box<List<DistrictEntity>> districtEntityBox;

  Future<void> init() async {
    await Hive.openBox<List<DistrictEntity>>(_boxName);
    districtEntityBox = Hive.box<List<DistrictEntity>>(_boxName);
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
    print("Clearning city box....");
    await districtEntityBox.deleteAll(districtEntityBox.keys);
  }
}
