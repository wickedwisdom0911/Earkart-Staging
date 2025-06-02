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

  LookupCubit({
    required this.getDistrictsUsecase,
    required this.getCitiesUsecase,
    required this.getStatesUsecase,
    required this.getCountriesUsecase,
    required this.getLanguagesUsecase,
  }) : super(const LookupState());

  Future<void> getLanguages() async {
    if (!isClosed) emit(state.copyWith(isLoading: true, error: null));
    final result = await getLanguagesUsecase.call();
    result.fold(
      (failure) {
        if (!isClosed) {
          emit(state.copyWith(isLoading: false, error: failure.message));
        }
      },
      (languages) {
        if (!isClosed) {
          emit(state.copyWith(isLoading: false, languages: languages));
        }
      },
    );
  }

  Future<void> getCountries() async {
    if (!isClosed) emit(state.copyWith(isLoading: true, error: null));
    final result = await getCountriesUsecase.call();
    result.fold(
      (failure) {
        if (!isClosed) {
          emit(state.copyWith(isLoading: false, error: failure.message));
        }
      },
      (countries) {
        if (!isClosed) {
          emit(state.copyWith(isLoading: false, countries: countries));
        }
      },
    );
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

  Future<void> getCities(String stateId) async {
    if (!isClosed) emit(state.copyWith(isLoading: true, error: null));
    final result = await getCitiesUsecase.call(stateId);
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

  Future<void> getDistricts(String cityId) async {
    if (!isClosed) emit(state.copyWith(isLoading: true, error: null));
    final result = await getDistrictsUsecase.call(cityId);
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
