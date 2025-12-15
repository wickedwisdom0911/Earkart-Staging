import 'dart:async';
import 'package:earkart_omni/features/lookup/domain/usecases/get_cities.usecase.dart';
import 'package:earkart_omni/features/lookup/domain/usecases/get_countries.usecase.dart';
import 'package:earkart_omni/features/lookup/domain/usecases/get_districts.usecase.dart';
import 'package:earkart_omni/features/lookup/domain/usecases/get_languages.usecase.dart';
import 'package:earkart_omni/features/lookup/domain/usecases/get_states.usecase.dart';
import 'package:earkart_omni/features/lookup/presentation/cubit/lookup.state.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class LookupCubit extends Cubit<LookupState> {
  final GetDistrictsUsecase getDistrictsUsecase;
  final GetCitiesUsecase getCitiesUsecase;
  final GetStatesUsecase getStatesUsecase;
  final GetCountriesUsecase getCountriesUsecase;
  final GetLanguagesUsecase getLanguagesUsecase;

  // Cache flags to prevent unnecessary API calls
  bool _languagesLoaded = false;
  bool _countriesLoaded = false;

  LookupCubit({
    required this.getDistrictsUsecase,
    required this.getCitiesUsecase,
    required this.getStatesUsecase,
    required this.getCountriesUsecase,
    required this.getLanguagesUsecase,
  }) : super(const LookupState()) {
    // Load essential data from cache immediately on initialization
    _loadFromCache();
  }

  // Helper method to check if essential data is loaded
  bool get isEssentialDataLoaded =>
      state.languages.isNotEmpty && state.countries.isNotEmpty;

  /// Load essential lookup data from cache immediately (non-blocking)
  /// This provides instant UI rendering while API fetch happens in background
  void _loadFromCache() {
    // The repository's cache-first strategy will handle loading from cache
    // We just need to trigger the fetch which will return cached data first
    unawaited(getLanguages());
    unawaited(getCountries());
  }

  /// Preload essential lookup data (languages and countries)
  /// This should be called on app startup or when entering screens that need this data
  Future<void> preloadEssentialData() async {
    // Load both in parallel for better performance
    await Future.wait([
      getLanguages(),
      getCountries(),
    ]);
  }

  Future<void> getLanguages({bool forceRefresh = false}) async {
    // Return early if already loaded and not forcing refresh
    if (!forceRefresh && _languagesLoaded && state.languages.isNotEmpty) {
      return;
    }

    // Only show loading if we don't have cached data
    if (state.languages.isEmpty && !isClosed) {
      emit(state.copyWith(isLoading: true, error: null));
    }

    try {
      final result = await getLanguagesUsecase.call().timeout(
        const Duration(seconds: 10),
        onTimeout:
            () =>
                throw TimeoutException(
                  'Languages fetch timed out',
                  const Duration(seconds: 10),
                ),
      );

      result.fold(
        (failure) {
          if (!isClosed) {
            print('⚠️ Languages fetch failed: ${failure.message}');
            emit(state.copyWith(isLoading: false, error: failure.message));
          }
        },
        (languages) {
          if (!isClosed) {
            _languagesLoaded = true;
            print('✅ Languages loaded successfully: ${languages.length} items');
            emit(state.copyWith(isLoading: false, languages: languages));
          }
        },
      );
    } catch (e) {
      if (!isClosed) {
        print('❌ Languages fetch error: $e');
        emit(
          state.copyWith(
            isLoading: false,
            error: 'Failed to load languages: $e',
          ),
        );
      }
    }
  }

  Future<void> getCountries({bool forceRefresh = false}) async {
    // Return early if already loaded and not forcing refresh
    if (!forceRefresh && _countriesLoaded && state.countries.isNotEmpty) {
      return;
    }

    // Only show loading if we don't have cached data
    if (state.countries.isEmpty && !isClosed) {
      emit(state.copyWith(isLoading: true, error: null));
    }

    try {
      final result = await getCountriesUsecase.call().timeout(
        const Duration(seconds: 10),
        onTimeout:
            () =>
                throw TimeoutException(
                  'Countries fetch timed out',
                  const Duration(seconds: 10),
                ),
      );

      result.fold(
        (failure) {
          if (!isClosed) {
            print('⚠️ Countries fetch failed: ${failure.message}');
            emit(state.copyWith(isLoading: false, error: failure.message));
          }
        },
        (countries) {
          if (!isClosed) {
            _countriesLoaded = true;
            print('✅ Countries loaded successfully: ${countries.length} items');
            emit(state.copyWith(isLoading: false, countries: countries));
          }
        },
      );
    } catch (e) {
      if (!isClosed) {
        print('❌ Countries fetch error: $e');
        emit(
          state.copyWith(
            isLoading: false,
            error: 'Failed to load countries: $e',
          ),
        );
      }
    }
  }

  Future<void> getStates(String countryId) async {
    if (!isClosed) emit(state.copyWith(isLoading: true, error: null));
    final result = await getStatesUsecase.call(countryId);
    result.fold(
      (failure) {
        if (!isClosed) {
          emit(state.copyWith(isLoading: false, error: failure.message));
        }
      },
      (states) {
        if (!isClosed) {
          emit(state.copyWith(isLoading: false, states: states));
        }
      },
    );
  }

  Future<void> getCities(String districtId) async {
    if (!isClosed) emit(state.copyWith(isLoading: true, error: null));
    final result = await getCitiesUsecase.call(districtId);
    result.fold(
      (failure) {
        if (!isClosed) {
          emit(state.copyWith(isLoading: false, error: failure.message));
        }
      },
      (cities) {
        if (!isClosed) {
          emit(state.copyWith(isLoading: false, cities: cities));
        }
      },
    );
  }

  Future<void> getDistricts(String stateId) async {
    if (!isClosed) emit(state.copyWith(isLoading: true, error: null));
    final result = await getDistrictsUsecase.call(stateId);
    result.fold(
      (failure) {
        if (!isClosed) {
          emit(state.copyWith(isLoading: false, error: failure.message));
        }
      },
      (districts) {
        if (!isClosed) {
          emit(state.copyWith(isLoading: false, districts: districts));
        }
      },
    );
  }
}
