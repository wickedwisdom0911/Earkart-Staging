// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'consultation_pricing.entity.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class ConsultationPricingEntityAdapter
    extends TypeAdapter<ConsultationPricingEntity> {
  @override
  final int typeId = 36;

  @override
  ConsultationPricingEntity read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return ConsultationPricingEntity(
      id: fields[0] as String?,
      consultationId: fields[1] as String?,
      pricingId: fields[2] as String?,
      quantity: fields[3] as int,
      actualPrice: fields[4] as double,
      discountApplied: fields[5] as double,
      discountReason: fields[6] as String?,
      notes: fields[7] as String?,
      createdAt: fields[8] as DateTime?,
      updatedAt: fields[9] as DateTime?,
      pricing: fields[10] as CentrePricingEntity?,
    );
  }

  @override
  void write(BinaryWriter writer, ConsultationPricingEntity obj) {
    writer
      ..writeByte(11)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.consultationId)
      ..writeByte(2)
      ..write(obj.pricingId)
      ..writeByte(3)
      ..write(obj.quantity)
      ..writeByte(4)
      ..write(obj.actualPrice)
      ..writeByte(5)
      ..write(obj.discountApplied)
      ..writeByte(6)
      ..write(obj.discountReason)
      ..writeByte(7)
      ..write(obj.notes)
      ..writeByte(8)
      ..write(obj.createdAt)
      ..writeByte(9)
      ..write(obj.updatedAt)
      ..writeByte(10)
      ..write(obj.pricing);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ConsultationPricingEntityAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
