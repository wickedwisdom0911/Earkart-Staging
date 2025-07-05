import 'dart:convert';
import 'package:earkart_omni/models/enums.dart';
import 'locations.entity.dart';

CountryModel countryModelFromJson(String str) =>
    CountryModel.fromJson(json.decode(str));
String countryModelToJson(CountryModel data) => json.encode(data.toJson());

class CountryModel {
  final bool success;
  final String message;
  final List<CountryModelData>? data;

  CountryModel({required this.success, required this.message, this.data});

  factory CountryModel.fromJson(Map<String, dynamic> json) {
    return CountryModel(
      success: json['success'],
      message: json['message'],
      data:
          json['data'] != null
              ? List<CountryModelData>.from(
                json['data'].map((x) => CountryModelData.fromJson(x)),
              )
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'success': success,
      'message': message,
      'data': data?.map((x) => x.toJson()).toList(),
    };
  }
}

class CountryModelData extends CountryEntity {
  const CountryModelData({
    super.id,
    required super.name,
    required super.code,
    super.states,
    required super.status,
    required super.createdAt,
    required super.updatedAt,
  });

  factory CountryModelData.fromJson(Map<String, dynamic> json) {
    return CountryModelData(
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

  @override
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
}

// State
StateModel stateModelFromJson(String str) =>
    StateModel.fromJson(json.decode(str));
String stateModelToJson(StateModel data) => json.encode(data.toJson());

class StateModel {
  final bool success;
  final String message;
  final List<StateModelData>? data;

  StateModel({required this.success, required this.message, this.data});

  factory StateModel.fromJson(Map<String, dynamic> json) {
    return StateModel(
      success: json['success'],
      message: json['message'],
      data:
          json['data'] != null
              ? List<StateModelData>.from(
                json['data'].map((x) => StateModelData.fromJson(x)),
              )
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'success': success,
      'message': message,
      'data': data?.map((x) => x.toJson()).toList(),
    };
  }
}

class StateModelData extends StateEntity {
  const StateModelData({
    super.id,
    required super.name,
    required super.countryId,
    super.districts,
    required super.status,
    required super.createdAt,
    required super.updatedAt,
    super.country,
  });

  factory StateModelData.fromJson(Map<String, dynamic> json) {
    return StateModelData(
      id: json['id'],
      name: json['name'],
      countryId: json['countryId'],
      districts:
          json['districts'] != null
              ? List<DistrictEntity>.from(
                (json['districts'] as List).map(
                  (x) => DistrictEntity.fromJson(x),
                ),
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

  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'countryId': countryId,
      'districts': districts?.map((x) => x.toJson()).toList(),
      'status': status.name.toUpperCase(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'country': country?.toJson(),
    };
  }
}

// City
CityModel cityModelFromJson(String str) => CityModel.fromJson(json.decode(str));
String cityModelToJson(CityModel data) => json.encode(data.toJson());

class CityModel {
  final bool success;
  final String message;
  final List<CityModelData>? data;

  CityModel({required this.success, required this.message, this.data});

  factory CityModel.fromJson(Map<String, dynamic> json) {
    return CityModel(
      success: json['success'],
      message: json['message'],
      data:
          json['data'] != null
              ? List<CityModelData>.from(
                json['data'].map((x) => CityModelData.fromJson(x)),
              )
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'success': success,
      'message': message,
      'data': data?.map((x) => x.toJson()).toList(),
    };
  }
}

class CityModelData extends CityEntity {
  const CityModelData({
    super.id,
    required super.name,
    required super.districtId,
    required super.status,
    required super.createdAt,
    required super.updatedAt,
    super.state,
    super.districts,
  });

  factory CityModelData.fromJson(Map<String, dynamic> json) {
    return CityModelData(
      id: json['id'],
      name: json['name'],
      districtId: json['districtId'],
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

  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'districtId': districtId,
      'status': status.name.toUpperCase(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'state': state?.toJson(),
      'districts': districts?.map((x) => x.toJson()).toList(),
    };
  }
}

// District
DistrictModel districtModelFromJson(String str) =>
    DistrictModel.fromJson(json.decode(str));
String districtModelToJson(DistrictModel data) => json.encode(data.toJson());

class DistrictModel {
  final bool success;
  final String message;
  final List<DistrictModelData>? data;

  DistrictModel({required this.success, required this.message, this.data});

  factory DistrictModel.fromJson(Map<String, dynamic> json) {
    return DistrictModel(
      success: json['success'],
      message: json['message'],
      data:
          json['data'] != null
              ? List<DistrictModelData>.from(
                json['data'].map((x) => DistrictModelData.fromJson(x)),
              )
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'success': success,
      'message': message,
      'data': data?.map((x) => x.toJson()).toList(),
    };
  }
}

class DistrictModelData extends DistrictEntity {
  const DistrictModelData({
    super.id,
    required super.name,
    required super.stateId,
    required super.status,
    required super.createdAt,
    required super.updatedAt,
    super.cities,
  });

  factory DistrictModelData.fromJson(Map<String, dynamic> json) {
    return DistrictModelData(
      id: json['id'],
      name: json['name'],
      stateId: json['stateId'],
      status: statusFromApi(json['status']),
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
      cities:
          json['cities'] != null
              ? List<CityEntity>.from(
                (json['cities'] as List).map((x) => CityEntity.fromJson(x)),
              )
              : null,
    );
  }

  @override
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'stateId': stateId,
      'status': status.name.toUpperCase(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'cities': cities?.map((x) => x.toJson()).toList(),
    };
  }
}
