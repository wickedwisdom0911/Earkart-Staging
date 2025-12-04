import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/appointments/appointments.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class AppointmentEntityDataSource {
  static const String _boxName = Constants.appointmentDb;
  late Box<AppointmentEntity> _appointmentEntityBox;

  Future<void> init() async {
    try {
      await Hive.openBox<AppointmentEntity>(_boxName);
      _appointmentEntityBox = Hive.box<AppointmentEntity>(_boxName);
    } catch (e) {
      print("Error opening appointment box, clearing corrupted data: $e");
      try {
        try {
          await Hive.deleteBoxFromDisk(_boxName);
        } catch (deleteError) {
          print(
            "Note: Could not delete box files (may not exist): $deleteError",
          );
        }
        await Hive.openBox<AppointmentEntity>(_boxName);
        _appointmentEntityBox = Hive.box<AppointmentEntity>(_boxName);
        print("Successfully cleared corrupted data and reopened box");
      } catch (clearError) {
        print("Failed to clear corrupted data: $clearError");
        try {
          await Hive.deleteFromDisk();
          await Hive.initFlutter();
          await Hive.openBox<AppointmentEntity>(_boxName);
          _appointmentEntityBox = Hive.box<AppointmentEntity>(_boxName);
          print("Successfully cleared all Hive data and reopened box");
        } catch (finalError) {
          print("Final attempt failed: $finalError");
          rethrow;
        }
      }
    }
  }

  Box<AppointmentEntity> getBox() {
    return Hive.box<AppointmentEntity>(_boxName);
  }

  Future<void> addAppointmentEntities(
    List<AppointmentEntity> appointmentEntities,
  ) async {
    for (final appointmentEntity in appointmentEntities) {
      await _appointmentEntityBox.put(appointmentEntity.id, appointmentEntity);
    }
  }

  List<AppointmentEntity> getAppointmentEntities() {
    return _appointmentEntityBox.values.toList();
  }

  Future<void> clearBox() async {
    print("Clearing appointments box....");
    await _appointmentEntityBox.deleteAll(_appointmentEntityBox.keys);
  }
}
