import 'package:dartz/dartz.dart';
import 'package:earkart_omni/config/services/failure.dart';
import 'package:earkart_omni/features/lookup/data/source/local/city.entity.source.dart';
import 'package:earkart_omni/features/lookup/data/source/local/countries.entity.source.dart';
import 'package:earkart_omni/features/lookup/data/source/local/district.entty.source.dart';
import 'package:earkart_omni/features/lookup/data/source/local/language.entity.source.dart';
import 'package:earkart_omni/features/lookup/data/source/local/state.entity.source.dart';
import 'package:earkart_omni/features/lookup/data/source/remote/lookup.remote.source.dart';
import 'package:earkart_omni/features/lookup/domain/repositories/lookup.repository.interface.dart';
import 'package:earkart_omni/models/language/language.entity.dart';
import 'package:earkart_omni/models/locations/locations.entity.dart';

class LookupRepositoryImpl extends ILookupRepository {
  final ILookupRemoteSource remoteSource;
  final LanguageEntityDataSource languageLocalSource;
  final CountryEntityDataSource countryLocalSource;
  final StateEntityDataSource stateLocalSource;
  final DistrictEntityDataSource districtLocalSource;
  final CityEntityDataSource cityLocalSource;

  LookupRepositoryImpl({
    required this.remoteSource,
    required this.languageLocalSource,
    required this.countryLocalSource,
    required this.stateLocalSource,
    required this.districtLocalSource,
    required this.cityLocalSource,
  });

  /// Cache-first strategy: Load from local storage first, then fetch from API
  /// Returns cached data immediately if available, then updates in background
  @override
  Future<Either<Failure, List<LanguageEntity>>> getLanguages() async {
    return getLanguagesWithRefresh(forceRefresh: false);
  }

  /// Internal method with refresh control
  Future<Either<Failure, List<LanguageEntity>>> getLanguagesWithRefresh({
    bool forceRefresh = false,
  }) async {
    // Try to load from cache first (unless force refresh)
    if (!forceRefresh) {
      final cachedLanguages = languageLocalSource.getLanguageEntities();
      if (cachedLanguages != null && cachedLanguages.isNotEmpty) {
        // Return cached data immediately, then refresh in background
        _refreshLanguagesInBackground();
        return Right(cachedLanguages);
      }
    }

    // No cache or force refresh - fetch from API
    final result = await remoteSource.getLanguages();
    result.fold(
      (failure) => null, // Error handling done by return
      (languages) {
        // Save to cache on success
        languageLocalSource.addLanguageEntities(languages);
      },
    );
    return result;
  }

  /// Background refresh for languages (non-blocking)
  void _refreshLanguagesInBackground() {
    remoteSource.getLanguages().then((result) {
      result.fold(
        (_) => null, // Ignore errors in background refresh
        (languages) {
          languageLocalSource.addLanguageEntities(languages);
        },
      );
    });
  }

  @override
  Future<Either<Failure, List<CountryEntity>>> getCountries() async {
    return getCountriesWithRefresh(forceRefresh: false);
  }

  /// Internal method with refresh control
  Future<Either<Failure, List<CountryEntity>>> getCountriesWithRefresh({
    bool forceRefresh = false,
  }) async {
    // Try to load from cache first (unless force refresh)
    if (!forceRefresh) {
      final cachedCountries = countryLocalSource.getCountryEntities();
      if (cachedCountries != null && cachedCountries.isNotEmpty) {
        // Return cached data immediately, then refresh in background
        _refreshCountriesInBackground();
        return Right(cachedCountries);
      }
    }

    // No cache or force refresh - fetch from API
    final result = await remoteSource.getCountries();
    result.fold(
      (failure) => null, // Error handling done by return
      (countries) {
        // Save to cache on success
        countryLocalSource.addCountryEntities(countries);
      },
    );
    return result;
  }

  /// Background refresh for countries (non-blocking)
  void _refreshCountriesInBackground() {
    remoteSource.getCountries().then((result) {
      result.fold(
        (_) => null, // Ignore errors in background refresh
        (countries) {
          countryLocalSource.addCountryEntities(countries);
        },
      );
    });
  }

  @override
  Future<Either<Failure, List<StateEntity>>> getStates(String countryId) async {
    return getStatesWithRefresh(countryId, forceRefresh: false);
  }

  /// Internal method with refresh control
  Future<Either<Failure, List<StateEntity>>> getStatesWithRefresh(
    String countryId, {
    bool forceRefresh = false,
  }) async {
    // Try to load from cache first (unless force refresh)
    if (!forceRefresh) {
      final cachedStates = stateLocalSource.getStateEntities();
      if (cachedStates != null && cachedStates.isNotEmpty) {
        // Filter by countryId if needed, or return all cached states
        // Note: Cache might contain states for multiple countries
        // For simplicity, we'll fetch fresh data if countryId is provided
        // In a more sophisticated implementation, you'd cache by countryId
      }
    }

    // Fetch from API
    final result = await remoteSource.getStates(countryId);
    result.fold((failure) => null, (states) {
      // Save to cache on success
      stateLocalSource.addStateEntities(states);
    });
    return result;
  }

  @override
  Future<Either<Failure, List<CityEntity>>> getCities(String districtId) async {
    // Fetch from API (cities are typically small and district-specific)
    final result = await remoteSource.getCities(districtId);
    result.fold((failure) => null, (cities) {
      // Save to cache on success
      cityLocalSource.addCityEntities(cities);
    });
    return result;
  }

  @override
  Future<Either<Failure, List<DistrictEntity>>> getDistricts(
    String stateId,
  ) async {
    // Fetch from API (districts are state-specific)
    final result = await remoteSource.getDistricts(stateId);
    result.fold((failure) => null, (districts) {
      // Save to cache on success
      districtLocalSource.addDistrictEntities(districts);
    });
    return result;
  }
}
