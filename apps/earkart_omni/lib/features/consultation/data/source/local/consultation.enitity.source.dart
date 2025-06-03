import 'package:earkart_omni/config/utils/constants.dart';
import 'package:earkart_omni/models/consultation/consultation.entity.dart';
import 'package:hive_flutter/hive_flutter.dart';

class ConsultationEntityDataSource {
  static const String _boxName = Constants.consultationDb;
  late Box<ConsultationEntity> _consultationEntityBox;

  Future<void> init() async {
    await Hive.openBox<ConsultationEntity>(_boxName);
    _consultationEntityBox = Hive.box<ConsultationEntity>(_boxName);
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
    print("Clearning consultation box....");
    await _consultationEntityBox.deleteAll(_consultationEntityBox.keys);
  }
}
