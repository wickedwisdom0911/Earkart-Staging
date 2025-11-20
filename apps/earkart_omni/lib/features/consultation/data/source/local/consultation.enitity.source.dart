import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class ConsultationEntityDataSource {
  static const String _boxName = Constants.consultationDb;
  late Box<ConsultationEntity> _consultationEntityBox;

  Future<void> init() async {
    try {
      await Hive.openBox<ConsultationEntity>(_boxName);
      _consultationEntityBox = Hive.box<ConsultationEntity>(_boxName);
    } catch (e) {
      print("Error opening consultation box, clearing corrupted data: $e");
      try {
        try {
          await Hive.deleteBoxFromDisk(_boxName);
        } catch (deleteError) {
          print(
            "Note: Could not delete box files (may not exist): $deleteError",
          );
        }
        await Hive.openBox<ConsultationEntity>(_boxName);
        _consultationEntityBox = Hive.box<ConsultationEntity>(_boxName);
        print("Successfully cleared corrupted data and reopened box");
      } catch (clearError) {
        print("Failed to clear corrupted data: $clearError");
        try {
          await Hive.deleteFromDisk();
          await Hive.initFlutter();
          await Hive.openBox<ConsultationEntity>(_boxName);
          _consultationEntityBox = Hive.box<ConsultationEntity>(_boxName);
          print("Successfully cleared all Hive data and reopened box");
        } catch (finalError) {
          print("Final attempt failed: $finalError");
          rethrow;
        }
      }
    }
  }

  Box<ConsultationEntity> getBox() {
    return Hive.box<ConsultationEntity>(_boxName);
  }

  Future<void> addConsultationEntity(
    ConsultationEntity consultationEntity,
  ) async {
    await _consultationEntityBox.put(0, consultationEntity);
  }

  ConsultationEntity? getConsultationEntity() {
    return _consultationEntityBox.get(0);
  }

  Future<void> clearBox() async {
    print("Clearing consultation box....");
    await _consultationEntityBox.deleteAll(_consultationEntityBox.keys);
  }
}
