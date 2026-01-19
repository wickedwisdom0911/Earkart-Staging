// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'payment.state.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

/// @nodoc
mixin _$PaymentState {
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(PaymentInitiateResponse response)
        initiatePaymentSuccess,
    required TResult Function(PaymentEntity payment) completePaymentSuccess,
    required TResult Function(PaymentEntity payment) getPaymentSuccess,
    required TResult Function(String message) error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(PaymentInitiateResponse response)? initiatePaymentSuccess,
    TResult? Function(PaymentEntity payment)? completePaymentSuccess,
    TResult? Function(PaymentEntity payment)? getPaymentSuccess,
    TResult? Function(String message)? error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(PaymentInitiateResponse response)? initiatePaymentSuccess,
    TResult Function(PaymentEntity payment)? completePaymentSuccess,
    TResult Function(PaymentEntity payment)? getPaymentSuccess,
    TResult Function(String message)? error,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(PaymentInitial value) initial,
    required TResult Function(PaymentLoading value) loading,
    required TResult Function(InitiatePaymentSuccess value)
        initiatePaymentSuccess,
    required TResult Function(CompletePaymentSuccess value)
        completePaymentSuccess,
    required TResult Function(GetPaymentSuccess value) getPaymentSuccess,
    required TResult Function(PaymentError value) error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(PaymentInitial value)? initial,
    TResult? Function(PaymentLoading value)? loading,
    TResult? Function(InitiatePaymentSuccess value)? initiatePaymentSuccess,
    TResult? Function(CompletePaymentSuccess value)? completePaymentSuccess,
    TResult? Function(GetPaymentSuccess value)? getPaymentSuccess,
    TResult? Function(PaymentError value)? error,
  }) =>
      throw _privateConstructorUsedError;
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(PaymentInitial value)? initial,
    TResult Function(PaymentLoading value)? loading,
    TResult Function(InitiatePaymentSuccess value)? initiatePaymentSuccess,
    TResult Function(CompletePaymentSuccess value)? completePaymentSuccess,
    TResult Function(GetPaymentSuccess value)? getPaymentSuccess,
    TResult Function(PaymentError value)? error,
    required TResult orElse(),
  }) =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $PaymentStateCopyWith<$Res> {
  factory $PaymentStateCopyWith(
          PaymentState value, $Res Function(PaymentState) then) =
      _$PaymentStateCopyWithImpl<$Res, PaymentState>;
}

/// @nodoc
class _$PaymentStateCopyWithImpl<$Res, $Val extends PaymentState>
    implements $PaymentStateCopyWith<$Res> {
  _$PaymentStateCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;
}

/// @nodoc
abstract class _$$PaymentInitialImplCopyWith<$Res> {
  factory _$$PaymentInitialImplCopyWith(_$PaymentInitialImpl value,
          $Res Function(_$PaymentInitialImpl) then) =
      __$$PaymentInitialImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$PaymentInitialImplCopyWithImpl<$Res>
    extends _$PaymentStateCopyWithImpl<$Res, _$PaymentInitialImpl>
    implements _$$PaymentInitialImplCopyWith<$Res> {
  __$$PaymentInitialImplCopyWithImpl(
      _$PaymentInitialImpl _value, $Res Function(_$PaymentInitialImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$PaymentInitialImpl implements PaymentInitial {
  const _$PaymentInitialImpl();

  @override
  String toString() {
    return 'PaymentState.initial()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$PaymentInitialImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(PaymentInitiateResponse response)
        initiatePaymentSuccess,
    required TResult Function(PaymentEntity payment) completePaymentSuccess,
    required TResult Function(PaymentEntity payment) getPaymentSuccess,
    required TResult Function(String message) error,
  }) {
    return initial();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(PaymentInitiateResponse response)? initiatePaymentSuccess,
    TResult? Function(PaymentEntity payment)? completePaymentSuccess,
    TResult? Function(PaymentEntity payment)? getPaymentSuccess,
    TResult? Function(String message)? error,
  }) {
    return initial?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(PaymentInitiateResponse response)? initiatePaymentSuccess,
    TResult Function(PaymentEntity payment)? completePaymentSuccess,
    TResult Function(PaymentEntity payment)? getPaymentSuccess,
    TResult Function(String message)? error,
    required TResult orElse(),
  }) {
    if (initial != null) {
      return initial();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(PaymentInitial value) initial,
    required TResult Function(PaymentLoading value) loading,
    required TResult Function(InitiatePaymentSuccess value)
        initiatePaymentSuccess,
    required TResult Function(CompletePaymentSuccess value)
        completePaymentSuccess,
    required TResult Function(GetPaymentSuccess value) getPaymentSuccess,
    required TResult Function(PaymentError value) error,
  }) {
    return initial(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(PaymentInitial value)? initial,
    TResult? Function(PaymentLoading value)? loading,
    TResult? Function(InitiatePaymentSuccess value)? initiatePaymentSuccess,
    TResult? Function(CompletePaymentSuccess value)? completePaymentSuccess,
    TResult? Function(GetPaymentSuccess value)? getPaymentSuccess,
    TResult? Function(PaymentError value)? error,
  }) {
    return initial?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(PaymentInitial value)? initial,
    TResult Function(PaymentLoading value)? loading,
    TResult Function(InitiatePaymentSuccess value)? initiatePaymentSuccess,
    TResult Function(CompletePaymentSuccess value)? completePaymentSuccess,
    TResult Function(GetPaymentSuccess value)? getPaymentSuccess,
    TResult Function(PaymentError value)? error,
    required TResult orElse(),
  }) {
    if (initial != null) {
      return initial(this);
    }
    return orElse();
  }
}

abstract class PaymentInitial implements PaymentState {
  const factory PaymentInitial() = _$PaymentInitialImpl;
}

/// @nodoc
abstract class _$$PaymentLoadingImplCopyWith<$Res> {
  factory _$$PaymentLoadingImplCopyWith(_$PaymentLoadingImpl value,
          $Res Function(_$PaymentLoadingImpl) then) =
      __$$PaymentLoadingImplCopyWithImpl<$Res>;
}

/// @nodoc
class __$$PaymentLoadingImplCopyWithImpl<$Res>
    extends _$PaymentStateCopyWithImpl<$Res, _$PaymentLoadingImpl>
    implements _$$PaymentLoadingImplCopyWith<$Res> {
  __$$PaymentLoadingImplCopyWithImpl(
      _$PaymentLoadingImpl _value, $Res Function(_$PaymentLoadingImpl) _then)
      : super(_value, _then);
}

/// @nodoc

class _$PaymentLoadingImpl implements PaymentLoading {
  const _$PaymentLoadingImpl();

  @override
  String toString() {
    return 'PaymentState.loading()';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType && other is _$PaymentLoadingImpl);
  }

  @override
  int get hashCode => runtimeType.hashCode;

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(PaymentInitiateResponse response)
        initiatePaymentSuccess,
    required TResult Function(PaymentEntity payment) completePaymentSuccess,
    required TResult Function(PaymentEntity payment) getPaymentSuccess,
    required TResult Function(String message) error,
  }) {
    return loading();
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(PaymentInitiateResponse response)? initiatePaymentSuccess,
    TResult? Function(PaymentEntity payment)? completePaymentSuccess,
    TResult? Function(PaymentEntity payment)? getPaymentSuccess,
    TResult? Function(String message)? error,
  }) {
    return loading?.call();
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(PaymentInitiateResponse response)? initiatePaymentSuccess,
    TResult Function(PaymentEntity payment)? completePaymentSuccess,
    TResult Function(PaymentEntity payment)? getPaymentSuccess,
    TResult Function(String message)? error,
    required TResult orElse(),
  }) {
    if (loading != null) {
      return loading();
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(PaymentInitial value) initial,
    required TResult Function(PaymentLoading value) loading,
    required TResult Function(InitiatePaymentSuccess value)
        initiatePaymentSuccess,
    required TResult Function(CompletePaymentSuccess value)
        completePaymentSuccess,
    required TResult Function(GetPaymentSuccess value) getPaymentSuccess,
    required TResult Function(PaymentError value) error,
  }) {
    return loading(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(PaymentInitial value)? initial,
    TResult? Function(PaymentLoading value)? loading,
    TResult? Function(InitiatePaymentSuccess value)? initiatePaymentSuccess,
    TResult? Function(CompletePaymentSuccess value)? completePaymentSuccess,
    TResult? Function(GetPaymentSuccess value)? getPaymentSuccess,
    TResult? Function(PaymentError value)? error,
  }) {
    return loading?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(PaymentInitial value)? initial,
    TResult Function(PaymentLoading value)? loading,
    TResult Function(InitiatePaymentSuccess value)? initiatePaymentSuccess,
    TResult Function(CompletePaymentSuccess value)? completePaymentSuccess,
    TResult Function(GetPaymentSuccess value)? getPaymentSuccess,
    TResult Function(PaymentError value)? error,
    required TResult orElse(),
  }) {
    if (loading != null) {
      return loading(this);
    }
    return orElse();
  }
}

abstract class PaymentLoading implements PaymentState {
  const factory PaymentLoading() = _$PaymentLoadingImpl;
}

/// @nodoc
abstract class _$$InitiatePaymentSuccessImplCopyWith<$Res> {
  factory _$$InitiatePaymentSuccessImplCopyWith(
          _$InitiatePaymentSuccessImpl value,
          $Res Function(_$InitiatePaymentSuccessImpl) then) =
      __$$InitiatePaymentSuccessImplCopyWithImpl<$Res>;
  @useResult
  $Res call({PaymentInitiateResponse response});
}

/// @nodoc
class __$$InitiatePaymentSuccessImplCopyWithImpl<$Res>
    extends _$PaymentStateCopyWithImpl<$Res, _$InitiatePaymentSuccessImpl>
    implements _$$InitiatePaymentSuccessImplCopyWith<$Res> {
  __$$InitiatePaymentSuccessImplCopyWithImpl(
      _$InitiatePaymentSuccessImpl _value,
      $Res Function(_$InitiatePaymentSuccessImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? response = null,
  }) {
    return _then(_$InitiatePaymentSuccessImpl(
      response: null == response
          ? _value.response
          : response // ignore: cast_nullable_to_non_nullable
              as PaymentInitiateResponse,
    ));
  }
}

/// @nodoc

class _$InitiatePaymentSuccessImpl implements InitiatePaymentSuccess {
  const _$InitiatePaymentSuccessImpl({required this.response});

  @override
  final PaymentInitiateResponse response;

  @override
  String toString() {
    return 'PaymentState.initiatePaymentSuccess(response: $response)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$InitiatePaymentSuccessImpl &&
            (identical(other.response, response) ||
                other.response == response));
  }

  @override
  int get hashCode => Object.hash(runtimeType, response);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$InitiatePaymentSuccessImplCopyWith<_$InitiatePaymentSuccessImpl>
      get copyWith => __$$InitiatePaymentSuccessImplCopyWithImpl<
          _$InitiatePaymentSuccessImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(PaymentInitiateResponse response)
        initiatePaymentSuccess,
    required TResult Function(PaymentEntity payment) completePaymentSuccess,
    required TResult Function(PaymentEntity payment) getPaymentSuccess,
    required TResult Function(String message) error,
  }) {
    return initiatePaymentSuccess(response);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(PaymentInitiateResponse response)? initiatePaymentSuccess,
    TResult? Function(PaymentEntity payment)? completePaymentSuccess,
    TResult? Function(PaymentEntity payment)? getPaymentSuccess,
    TResult? Function(String message)? error,
  }) {
    return initiatePaymentSuccess?.call(response);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(PaymentInitiateResponse response)? initiatePaymentSuccess,
    TResult Function(PaymentEntity payment)? completePaymentSuccess,
    TResult Function(PaymentEntity payment)? getPaymentSuccess,
    TResult Function(String message)? error,
    required TResult orElse(),
  }) {
    if (initiatePaymentSuccess != null) {
      return initiatePaymentSuccess(response);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(PaymentInitial value) initial,
    required TResult Function(PaymentLoading value) loading,
    required TResult Function(InitiatePaymentSuccess value)
        initiatePaymentSuccess,
    required TResult Function(CompletePaymentSuccess value)
        completePaymentSuccess,
    required TResult Function(GetPaymentSuccess value) getPaymentSuccess,
    required TResult Function(PaymentError value) error,
  }) {
    return initiatePaymentSuccess(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(PaymentInitial value)? initial,
    TResult? Function(PaymentLoading value)? loading,
    TResult? Function(InitiatePaymentSuccess value)? initiatePaymentSuccess,
    TResult? Function(CompletePaymentSuccess value)? completePaymentSuccess,
    TResult? Function(GetPaymentSuccess value)? getPaymentSuccess,
    TResult? Function(PaymentError value)? error,
  }) {
    return initiatePaymentSuccess?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(PaymentInitial value)? initial,
    TResult Function(PaymentLoading value)? loading,
    TResult Function(InitiatePaymentSuccess value)? initiatePaymentSuccess,
    TResult Function(CompletePaymentSuccess value)? completePaymentSuccess,
    TResult Function(GetPaymentSuccess value)? getPaymentSuccess,
    TResult Function(PaymentError value)? error,
    required TResult orElse(),
  }) {
    if (initiatePaymentSuccess != null) {
      return initiatePaymentSuccess(this);
    }
    return orElse();
  }
}

abstract class InitiatePaymentSuccess implements PaymentState {
  const factory InitiatePaymentSuccess(
          {required final PaymentInitiateResponse response}) =
      _$InitiatePaymentSuccessImpl;

  PaymentInitiateResponse get response;
  @JsonKey(ignore: true)
  _$$InitiatePaymentSuccessImplCopyWith<_$InitiatePaymentSuccessImpl>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$CompletePaymentSuccessImplCopyWith<$Res> {
  factory _$$CompletePaymentSuccessImplCopyWith(
          _$CompletePaymentSuccessImpl value,
          $Res Function(_$CompletePaymentSuccessImpl) then) =
      __$$CompletePaymentSuccessImplCopyWithImpl<$Res>;
  @useResult
  $Res call({PaymentEntity payment});
}

/// @nodoc
class __$$CompletePaymentSuccessImplCopyWithImpl<$Res>
    extends _$PaymentStateCopyWithImpl<$Res, _$CompletePaymentSuccessImpl>
    implements _$$CompletePaymentSuccessImplCopyWith<$Res> {
  __$$CompletePaymentSuccessImplCopyWithImpl(
      _$CompletePaymentSuccessImpl _value,
      $Res Function(_$CompletePaymentSuccessImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? payment = null,
  }) {
    return _then(_$CompletePaymentSuccessImpl(
      payment: null == payment
          ? _value.payment
          : payment // ignore: cast_nullable_to_non_nullable
              as PaymentEntity,
    ));
  }
}

/// @nodoc

class _$CompletePaymentSuccessImpl implements CompletePaymentSuccess {
  const _$CompletePaymentSuccessImpl({required this.payment});

  @override
  final PaymentEntity payment;

  @override
  String toString() {
    return 'PaymentState.completePaymentSuccess(payment: $payment)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$CompletePaymentSuccessImpl &&
            (identical(other.payment, payment) || other.payment == payment));
  }

  @override
  int get hashCode => Object.hash(runtimeType, payment);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$CompletePaymentSuccessImplCopyWith<_$CompletePaymentSuccessImpl>
      get copyWith => __$$CompletePaymentSuccessImplCopyWithImpl<
          _$CompletePaymentSuccessImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(PaymentInitiateResponse response)
        initiatePaymentSuccess,
    required TResult Function(PaymentEntity payment) completePaymentSuccess,
    required TResult Function(PaymentEntity payment) getPaymentSuccess,
    required TResult Function(String message) error,
  }) {
    return completePaymentSuccess(payment);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(PaymentInitiateResponse response)? initiatePaymentSuccess,
    TResult? Function(PaymentEntity payment)? completePaymentSuccess,
    TResult? Function(PaymentEntity payment)? getPaymentSuccess,
    TResult? Function(String message)? error,
  }) {
    return completePaymentSuccess?.call(payment);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(PaymentInitiateResponse response)? initiatePaymentSuccess,
    TResult Function(PaymentEntity payment)? completePaymentSuccess,
    TResult Function(PaymentEntity payment)? getPaymentSuccess,
    TResult Function(String message)? error,
    required TResult orElse(),
  }) {
    if (completePaymentSuccess != null) {
      return completePaymentSuccess(payment);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(PaymentInitial value) initial,
    required TResult Function(PaymentLoading value) loading,
    required TResult Function(InitiatePaymentSuccess value)
        initiatePaymentSuccess,
    required TResult Function(CompletePaymentSuccess value)
        completePaymentSuccess,
    required TResult Function(GetPaymentSuccess value) getPaymentSuccess,
    required TResult Function(PaymentError value) error,
  }) {
    return completePaymentSuccess(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(PaymentInitial value)? initial,
    TResult? Function(PaymentLoading value)? loading,
    TResult? Function(InitiatePaymentSuccess value)? initiatePaymentSuccess,
    TResult? Function(CompletePaymentSuccess value)? completePaymentSuccess,
    TResult? Function(GetPaymentSuccess value)? getPaymentSuccess,
    TResult? Function(PaymentError value)? error,
  }) {
    return completePaymentSuccess?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(PaymentInitial value)? initial,
    TResult Function(PaymentLoading value)? loading,
    TResult Function(InitiatePaymentSuccess value)? initiatePaymentSuccess,
    TResult Function(CompletePaymentSuccess value)? completePaymentSuccess,
    TResult Function(GetPaymentSuccess value)? getPaymentSuccess,
    TResult Function(PaymentError value)? error,
    required TResult orElse(),
  }) {
    if (completePaymentSuccess != null) {
      return completePaymentSuccess(this);
    }
    return orElse();
  }
}

abstract class CompletePaymentSuccess implements PaymentState {
  const factory CompletePaymentSuccess({required final PaymentEntity payment}) =
      _$CompletePaymentSuccessImpl;

  PaymentEntity get payment;
  @JsonKey(ignore: true)
  _$$CompletePaymentSuccessImplCopyWith<_$CompletePaymentSuccessImpl>
      get copyWith => throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$GetPaymentSuccessImplCopyWith<$Res> {
  factory _$$GetPaymentSuccessImplCopyWith(_$GetPaymentSuccessImpl value,
          $Res Function(_$GetPaymentSuccessImpl) then) =
      __$$GetPaymentSuccessImplCopyWithImpl<$Res>;
  @useResult
  $Res call({PaymentEntity payment});
}

/// @nodoc
class __$$GetPaymentSuccessImplCopyWithImpl<$Res>
    extends _$PaymentStateCopyWithImpl<$Res, _$GetPaymentSuccessImpl>
    implements _$$GetPaymentSuccessImplCopyWith<$Res> {
  __$$GetPaymentSuccessImplCopyWithImpl(_$GetPaymentSuccessImpl _value,
      $Res Function(_$GetPaymentSuccessImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? payment = null,
  }) {
    return _then(_$GetPaymentSuccessImpl(
      payment: null == payment
          ? _value.payment
          : payment // ignore: cast_nullable_to_non_nullable
              as PaymentEntity,
    ));
  }
}

/// @nodoc

class _$GetPaymentSuccessImpl implements GetPaymentSuccess {
  const _$GetPaymentSuccessImpl({required this.payment});

  @override
  final PaymentEntity payment;

  @override
  String toString() {
    return 'PaymentState.getPaymentSuccess(payment: $payment)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$GetPaymentSuccessImpl &&
            (identical(other.payment, payment) || other.payment == payment));
  }

  @override
  int get hashCode => Object.hash(runtimeType, payment);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$GetPaymentSuccessImplCopyWith<_$GetPaymentSuccessImpl> get copyWith =>
      __$$GetPaymentSuccessImplCopyWithImpl<_$GetPaymentSuccessImpl>(
          this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(PaymentInitiateResponse response)
        initiatePaymentSuccess,
    required TResult Function(PaymentEntity payment) completePaymentSuccess,
    required TResult Function(PaymentEntity payment) getPaymentSuccess,
    required TResult Function(String message) error,
  }) {
    return getPaymentSuccess(payment);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(PaymentInitiateResponse response)? initiatePaymentSuccess,
    TResult? Function(PaymentEntity payment)? completePaymentSuccess,
    TResult? Function(PaymentEntity payment)? getPaymentSuccess,
    TResult? Function(String message)? error,
  }) {
    return getPaymentSuccess?.call(payment);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(PaymentInitiateResponse response)? initiatePaymentSuccess,
    TResult Function(PaymentEntity payment)? completePaymentSuccess,
    TResult Function(PaymentEntity payment)? getPaymentSuccess,
    TResult Function(String message)? error,
    required TResult orElse(),
  }) {
    if (getPaymentSuccess != null) {
      return getPaymentSuccess(payment);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(PaymentInitial value) initial,
    required TResult Function(PaymentLoading value) loading,
    required TResult Function(InitiatePaymentSuccess value)
        initiatePaymentSuccess,
    required TResult Function(CompletePaymentSuccess value)
        completePaymentSuccess,
    required TResult Function(GetPaymentSuccess value) getPaymentSuccess,
    required TResult Function(PaymentError value) error,
  }) {
    return getPaymentSuccess(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(PaymentInitial value)? initial,
    TResult? Function(PaymentLoading value)? loading,
    TResult? Function(InitiatePaymentSuccess value)? initiatePaymentSuccess,
    TResult? Function(CompletePaymentSuccess value)? completePaymentSuccess,
    TResult? Function(GetPaymentSuccess value)? getPaymentSuccess,
    TResult? Function(PaymentError value)? error,
  }) {
    return getPaymentSuccess?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(PaymentInitial value)? initial,
    TResult Function(PaymentLoading value)? loading,
    TResult Function(InitiatePaymentSuccess value)? initiatePaymentSuccess,
    TResult Function(CompletePaymentSuccess value)? completePaymentSuccess,
    TResult Function(GetPaymentSuccess value)? getPaymentSuccess,
    TResult Function(PaymentError value)? error,
    required TResult orElse(),
  }) {
    if (getPaymentSuccess != null) {
      return getPaymentSuccess(this);
    }
    return orElse();
  }
}

abstract class GetPaymentSuccess implements PaymentState {
  const factory GetPaymentSuccess({required final PaymentEntity payment}) =
      _$GetPaymentSuccessImpl;

  PaymentEntity get payment;
  @JsonKey(ignore: true)
  _$$GetPaymentSuccessImplCopyWith<_$GetPaymentSuccessImpl> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class _$$PaymentErrorImplCopyWith<$Res> {
  factory _$$PaymentErrorImplCopyWith(
          _$PaymentErrorImpl value, $Res Function(_$PaymentErrorImpl) then) =
      __$$PaymentErrorImplCopyWithImpl<$Res>;
  @useResult
  $Res call({String message});
}

/// @nodoc
class __$$PaymentErrorImplCopyWithImpl<$Res>
    extends _$PaymentStateCopyWithImpl<$Res, _$PaymentErrorImpl>
    implements _$$PaymentErrorImplCopyWith<$Res> {
  __$$PaymentErrorImplCopyWithImpl(
      _$PaymentErrorImpl _value, $Res Function(_$PaymentErrorImpl) _then)
      : super(_value, _then);

  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? message = null,
  }) {
    return _then(_$PaymentErrorImpl(
      message: null == message
          ? _value.message
          : message // ignore: cast_nullable_to_non_nullable
              as String,
    ));
  }
}

/// @nodoc

class _$PaymentErrorImpl implements PaymentError {
  const _$PaymentErrorImpl({required this.message});

  @override
  final String message;

  @override
  String toString() {
    return 'PaymentState.error(message: $message)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$PaymentErrorImpl &&
            (identical(other.message, message) || other.message == message));
  }

  @override
  int get hashCode => Object.hash(runtimeType, message);

  @JsonKey(ignore: true)
  @override
  @pragma('vm:prefer-inline')
  _$$PaymentErrorImplCopyWith<_$PaymentErrorImpl> get copyWith =>
      __$$PaymentErrorImplCopyWithImpl<_$PaymentErrorImpl>(this, _$identity);

  @override
  @optionalTypeArgs
  TResult when<TResult extends Object?>({
    required TResult Function() initial,
    required TResult Function() loading,
    required TResult Function(PaymentInitiateResponse response)
        initiatePaymentSuccess,
    required TResult Function(PaymentEntity payment) completePaymentSuccess,
    required TResult Function(PaymentEntity payment) getPaymentSuccess,
    required TResult Function(String message) error,
  }) {
    return error(message);
  }

  @override
  @optionalTypeArgs
  TResult? whenOrNull<TResult extends Object?>({
    TResult? Function()? initial,
    TResult? Function()? loading,
    TResult? Function(PaymentInitiateResponse response)? initiatePaymentSuccess,
    TResult? Function(PaymentEntity payment)? completePaymentSuccess,
    TResult? Function(PaymentEntity payment)? getPaymentSuccess,
    TResult? Function(String message)? error,
  }) {
    return error?.call(message);
  }

  @override
  @optionalTypeArgs
  TResult maybeWhen<TResult extends Object?>({
    TResult Function()? initial,
    TResult Function()? loading,
    TResult Function(PaymentInitiateResponse response)? initiatePaymentSuccess,
    TResult Function(PaymentEntity payment)? completePaymentSuccess,
    TResult Function(PaymentEntity payment)? getPaymentSuccess,
    TResult Function(String message)? error,
    required TResult orElse(),
  }) {
    if (error != null) {
      return error(message);
    }
    return orElse();
  }

  @override
  @optionalTypeArgs
  TResult map<TResult extends Object?>({
    required TResult Function(PaymentInitial value) initial,
    required TResult Function(PaymentLoading value) loading,
    required TResult Function(InitiatePaymentSuccess value)
        initiatePaymentSuccess,
    required TResult Function(CompletePaymentSuccess value)
        completePaymentSuccess,
    required TResult Function(GetPaymentSuccess value) getPaymentSuccess,
    required TResult Function(PaymentError value) error,
  }) {
    return error(this);
  }

  @override
  @optionalTypeArgs
  TResult? mapOrNull<TResult extends Object?>({
    TResult? Function(PaymentInitial value)? initial,
    TResult? Function(PaymentLoading value)? loading,
    TResult? Function(InitiatePaymentSuccess value)? initiatePaymentSuccess,
    TResult? Function(CompletePaymentSuccess value)? completePaymentSuccess,
    TResult? Function(GetPaymentSuccess value)? getPaymentSuccess,
    TResult? Function(PaymentError value)? error,
  }) {
    return error?.call(this);
  }

  @override
  @optionalTypeArgs
  TResult maybeMap<TResult extends Object?>({
    TResult Function(PaymentInitial value)? initial,
    TResult Function(PaymentLoading value)? loading,
    TResult Function(InitiatePaymentSuccess value)? initiatePaymentSuccess,
    TResult Function(CompletePaymentSuccess value)? completePaymentSuccess,
    TResult Function(GetPaymentSuccess value)? getPaymentSuccess,
    TResult Function(PaymentError value)? error,
    required TResult orElse(),
  }) {
    if (error != null) {
      return error(this);
    }
    return orElse();
  }
}

abstract class PaymentError implements PaymentState {
  const factory PaymentError({required final String message}) =
      _$PaymentErrorImpl;

  String get message;
  @JsonKey(ignore: true)
  _$$PaymentErrorImplCopyWith<_$PaymentErrorImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
