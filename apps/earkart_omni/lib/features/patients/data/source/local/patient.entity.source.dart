import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class PatientEntityDataSource {
  static const String _boxName = Constants.patientDb;
  late Box<PatientEntity> _patientEntityBox;

  Future<void> init() async {
    try {
      await Hive.openBox<PatientEntity>(_boxName);
      _patientEntityBox = Hive.box<PatientEntity>(_boxName);
    } catch (e) {
      print("Error opening patient box, clearing corrupted data: $e");
      try {
        try {
          await Hive.deleteBoxFromDisk(_boxName);
        } catch (deleteError) {
          print(
            "Note: Could not delete box files (may not exist): $deleteError",
          );
        }
        await Hive.openBox<PatientEntity>(_boxName);
        _patientEntityBox = Hive.box<PatientEntity>(_boxName);
        print("Successfully cleared corrupted data and reopened box");
      } catch (clearError) {
        print("Failed to clear corrupted data: $clearError");
        try {
          await Hive.deleteFromDisk();
          await Hive.initFlutter();
          await Hive.openBox<PatientEntity>(_boxName);
          _patientEntityBox = Hive.box<PatientEntity>(_boxName);
          print("Successfully cleared all Hive data and reopened box");
        } catch (finalError) {
          print("Final attempt failed: $finalError");
          rethrow;
        }
      }
    }
  }

  Box<PatientEntity> getBox() {
    return Hive.box<PatientEntity>(_boxName);
  }

  Future<void> addPatientEntity(PatientEntity patientEntity) async {
    await _patientEntityBox.put(0, patientEntity);
  }

  PatientEntity? getPatientEntity() {
    return _patientEntityBox.get(0);
  }

  Future<void> clearBox() async {
    print("Clearing patient box....");
    await _patientEntityBox.deleteAll(_patientEntityBox.keys);
  }
}
