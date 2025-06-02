import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/patient/patient.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class PatientEntityDataSource {
  static const String _boxName = Constants.patientDb;
  late Box<PatientEntity> _patientEntityBox;

  Future<void> init() async {
    await Hive.openBox<PatientEntity>(_boxName);
    _patientEntityBox = Hive.box<PatientEntity>(_boxName);
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
    print("Clearning patient box....");
    await _patientEntityBox.deleteAll(_patientEntityBox.keys);
  }
}
