import 'package:earkart_omni/config/utils/hive_types.dart';
import 'package:earkart_omni/models/enums.dart';
import 'package:equatable/equatable.dart';
import 'package:hive/hive.dart';

part 'locations.entity.g.dart';

@HiveType(typeId: HiveTypes.countryEntity)
class CountryEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String name;
  @HiveField(2)
  final String code;
  @HiveField(3)
  final List<StateEntity>? states; // List<StateEntity>
  @HiveField(4)
  final Status status;
  @HiveField(5)
  final DateTime createdAt;
  @HiveField(6)
  final DateTime updatedAt;

  const CountryEntity({
    this.id,
    required this.name,
    required this.code,
    this.states,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory CountryEntity.fromJson(Map<String, dynamic> json) {
    return CountryEntity(
      id: json['id'],
      name: json['name'],
      code: json['code'],
      states:
          json['states'] != null
              ? List<StateEntity>.from(
                (json['states'] as List).map((x) => StateEntity.fromJson(x)),
              )
              : null,
      status: statusFromApi(json['status']),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'code': code,
      'states': states?.map((x) => x.toJson()).toList(),
      'status': status.name.toUpperCase(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  CountryEntity copyWith({
    String? id,
    String? name,
    String? code,
    List<StateEntity>? states,
    Status? status,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return CountryEntity(
      id: id ?? this.id,
      name: name ?? this.name,
      code: code ?? this.code,
      states: states ?? this.states,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  @override
  List<Object?> get props => [
    id,
    name,
    code,
    states,
    status,
    createdAt,
    updatedAt,
  ];
}

@HiveType(typeId: HiveTypes.stateEntity)
class StateEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String name;
  @HiveField(2)
  final String countryId;
  @HiveField(3)
  final List<CityEntity>? cities; // List<CityEntity>
  @HiveField(4)
  final Status status;
  @HiveField(5)
  final DateTime createdAt;
  @HiveField(6)
  final DateTime updatedAt;
  @HiveField(7)
  final CountryEntity? country; // CountryEntity

  const StateEntity({
    this.id,
    required this.name,
    required this.countryId,
    this.cities,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.country,
  });

  factory StateEntity.fromJson(Map<String, dynamic> json) {
    return StateEntity(
      id: json['id'],
      name: json['name'],
      countryId: json['countryId'],
      cities:
          json['cities'] != null
              ? List<CityEntity>.from(
                (json['cities'] as List).map((x) => CityEntity.fromJson(x)),
              )
              : null,
      status: statusFromApi(json['status']),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      country:
          json['country'] != null
              ? CountryEntity.fromJson(json['country'])
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'countryId': countryId,
      'cities': cities?.map((x) => x.toJson()).toList(),
      'status': status.name.toUpperCase(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'country': country?.toJson(),
    };
  }

  StateEntity copyWith({
    String? id,
    String? name,
    String? countryId,
    List<CityEntity>? cities,
    Status? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    CountryEntity? country,
  }) {
    return StateEntity(
      id: id ?? this.id,
      name: name ?? this.name,
      countryId: countryId ?? this.countryId,
      cities: cities ?? this.cities,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      country: country ?? this.country,
    );
  }

  @override
  List<Object?> get props => [
    id,
    name,
    countryId,
    cities,
    status,
    createdAt,
    updatedAt,
    country,
  ];
}

@HiveType(typeId: HiveTypes.cityEntity)
class CityEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String name;
  @HiveField(2)
  final String stateId;
  @HiveField(3)
  final Status status;
  @HiveField(4)
  final DateTime createdAt;
  @HiveField(5)
  final DateTime updatedAt;
  @HiveField(6)
  final StateEntity? state; // StateEntity
  @HiveField(7)
  final List<DistrictEntity>? districts; // List<DistrictEntity>

  const CityEntity({
    this.id,
    required this.name,
    required this.stateId,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.state,
    this.districts,
  });

  factory CityEntity.fromJson(Map<String, dynamic> json) {
    return CityEntity(
      id: json['id'],
      name: json['name'],
      stateId: json['stateId'],
      status: statusFromApi(json['status']),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      state: json['state'] != null ? StateEntity.fromJson(json['state']) : null,
      districts:
          json['districts'] != null
              ? List<DistrictEntity>.from(
                (json['districts'] as List).map(
                  (x) => DistrictEntity.fromJson(x),
                ),
              )
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'stateId': stateId,
      'status': status.name.toUpperCase(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'state': state?.toJson(),
      'districts': districts?.map((x) => x.toJson()).toList(),
    };
  }

  CityEntity copyWith({
    String? id,
    String? name,
    String? stateId,
    Status? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    StateEntity? state,
    List<DistrictEntity>? districts,
  }) {
    return CityEntity(
      id: id ?? this.id,
      name: name ?? this.name,
      stateId: stateId ?? this.stateId,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      state: state ?? this.state,
      districts: districts ?? this.districts,
    );
  }

  @override
  List<Object?> get props => [
    id,
    name,
    stateId,
    status,
    createdAt,
    updatedAt,
    state,
    districts,
  ];
}

@HiveType(typeId: HiveTypes.districtEntity)
class DistrictEntity extends Equatable {
  @HiveField(0)
  final String? id;
  @HiveField(1)
  final String name;
  @HiveField(2)
  final String cityId;
  @HiveField(3)
  final Status status;
  @HiveField(4)
  final DateTime createdAt;
  @HiveField(5)
  final DateTime updatedAt;
  @HiveField(6)
  final CityEntity? city; // CityEntity

  const DistrictEntity({
    this.id,
    required this.name,
    required this.cityId,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    this.city,
  });

  factory DistrictEntity.fromJson(Map<String, dynamic> json) {
    return DistrictEntity(
      id: json['id'],
      name: json['name'],
      cityId: json['cityId'],
      status: statusFromApi(json['status']),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      city: json['city'] != null ? CityEntity.fromJson(json['city']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'cityId': cityId,
      'status': status.name.toUpperCase(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'city': city?.toJson(),
    };
  }

  DistrictEntity copyWith({
    String? id,
    String? name,
    String? cityId,
    Status? status,
    DateTime? createdAt,
    DateTime? updatedAt,
    CityEntity? city,
  }) {
    return DistrictEntity(
      id: id ?? this.id,
      name: name ?? this.name,
      cityId: cityId ?? this.cityId,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      city: city ?? this.city,
    );
  }

  @override
  List<Object?> get props => [
    id,
    name,
    cityId,
    status,
    createdAt,
    updatedAt,
    city,
  ];
}
