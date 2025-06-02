import 'dart:convert';
import 'package:earkart_omni/models/enums.dart';
import 'locations.entity.dart';

CountryModel countryModelFromJson(String str) =>
    CountryModel.fromJson(json.decode(str));
String countryModelToJson(CountryModel data) => json.encode(data.toJson());

class CountryModel {
  final bool success;
  final String message;
  final CountryModelData? data;

  CountryModel({required this.success, required this.message, this.data});

  factory CountryModel.fromJson(Map<String, dynamic> json) {
    return CountryModel(
      success: json['success'],
      message: json['message'],
      data:
          json['data'] != null ? CountryModelData.fromJson(json['data']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {'success': success, 'message': message, 'data': data?.toJson()};
  }
}

class CountryModelData extends CountryEntity {
  CountryModelData({
    String? id,
    required String name,
    required String code,
    List<StateEntity>? states,
    required Status status,
    required DateTime createdAt,
    required DateTime updatedAt,
  }) : super(
         id: id,
         name: name,
         code: code,
         states: states,
         status: status,
         createdAt: createdAt,
         updatedAt: updatedAt,
       );

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
  final StateModelData? data;

  StateModel({required this.success, required this.message, this.data});

  factory StateModel.fromJson(Map<String, dynamic> json) {
    return StateModel(
      success: json['success'],
      message: json['message'],
      data: json['data'] != null ? StateModelData.fromJson(json['data']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {'success': success, 'message': message, 'data': data?.toJson()};
  }
}

class StateModelData extends StateEntity {
  StateModelData({
    String? id,
    required String name,
    required String countryId,
    List<CityEntity>? cities,
    required Status status,
    required DateTime createdAt,
    required DateTime updatedAt,
    CountryEntity? country,
  }) : super(
         id: id,
         name: name,
         countryId: countryId,
         cities: cities,
         status: status,
         createdAt: createdAt,
         updatedAt: updatedAt,
         country: country,
       );

  factory StateModelData.fromJson(Map<String, dynamic> json) {
    return StateModelData(
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
}

// City
CityModel cityModelFromJson(String str) => CityModel.fromJson(json.decode(str));
String cityModelToJson(CityModel data) => json.encode(data.toJson());

class CityModel {
  final bool success;
  final String message;
  final CityModelData? data;

  CityModel({required this.success, required this.message, this.data});

  factory CityModel.fromJson(Map<String, dynamic> json) {
    return CityModel(
      success: json['success'],
      message: json['message'],
      data: json['data'] != null ? CityModelData.fromJson(json['data']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {'success': success, 'message': message, 'data': data?.toJson()};
  }
}

class CityModelData extends CityEntity {
  CityModelData({
    String? id,
    required String name,
    required String stateId,
    required Status status,
    required DateTime createdAt,
    required DateTime updatedAt,
    StateEntity? state,
    List<DistrictEntity>? districts,
  }) : super(
         id: id,
         name: name,
         stateId: stateId,
         status: status,
         createdAt: createdAt,
         updatedAt: updatedAt,
         state: state,
         districts: districts,
       );

  factory CityModelData.fromJson(Map<String, dynamic> json) {
    return CityModelData(
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
}

// District
DistrictModel districtModelFromJson(String str) =>
    DistrictModel.fromJson(json.decode(str));
String districtModelToJson(DistrictModel data) => json.encode(data.toJson());

class DistrictModel {
  final bool success;
  final String message;
  final DistrictModelData? data;

  DistrictModel({required this.success, required this.message, this.data});

  factory DistrictModel.fromJson(Map<String, dynamic> json) {
    return DistrictModel(
      success: json['success'],
      message: json['message'],
      data:
          json['data'] != null
              ? DistrictModelData.fromJson(json['data'])
              : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {'success': success, 'message': message, 'data': data?.toJson()};
  }
}

class DistrictModelData extends DistrictEntity {
  DistrictModelData({
    String? id,
    required String name,
    required String cityId,
    required Status status,
    required DateTime createdAt,
    required DateTime updatedAt,
    CityEntity? city,
  }) : super(
         id: id,
         name: name,
         cityId: cityId,
         status: status,
         createdAt: createdAt,
         updatedAt: updatedAt,
         city: city,
       );

  factory DistrictModelData.fromJson(Map<String, dynamic> json) {
    return DistrictModelData(
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
}
