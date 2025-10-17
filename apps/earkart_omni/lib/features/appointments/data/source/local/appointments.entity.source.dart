import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/appointments/appointments.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class AppointmentEntityDataSource {
  static const String _boxName = Constants.appointmentDb;
  late Box<AppointmentEntity> _appointmentEntityBox;

  Future<void> init() async {
    await Hive.openBox<AppointmentEntity>(_boxName);
    _appointmentEntityBox = Hive.box<AppointmentEntity>(_boxName);
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
    print("Clearning appointments box....");
    await _appointmentEntityBox.deleteAll(_appointmentEntityBox.keys);
  }
}
