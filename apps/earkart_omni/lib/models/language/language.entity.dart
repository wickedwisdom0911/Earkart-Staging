import 'package:earkart_omni/config/utils/hive_types.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:equatable/equatable.dart';
import 'package:hive/hive.dart';

part 'language.entity.g.dart';

@HiveType(typeId: HiveTypes.languageEntity)
class LanguageEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String name;
  @HiveField(2)
  final String code;
  @HiveField(3)
  final Status status;
  @HiveField(4)
  final DateTime createdAt;
  @HiveField(5)
  final DateTime updatedAt;

  const LanguageEntity({
    this.id,
    required this.name,
    required this.code,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory LanguageEntity.fromJson(Map<String, dynamic> json) {
    return LanguageEntity(
      id: json['id'],
      name: json['name'],
      code: json['code'],
      status: statusFromApi(json['status']),
      createdAt:
          json['createdAt'] != null
              ? DateTime.parse(json['createdAt'])
              : DateTime.now(),
      updatedAt:
          json['updatedAt'] != null
              ? DateTime.parse(json['updatedAt'])
              : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'code': code,
      'status': status.name.toUpperCase(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  @override
  List<Object?> get props => [id, name, code, status, createdAt, updatedAt];
}
