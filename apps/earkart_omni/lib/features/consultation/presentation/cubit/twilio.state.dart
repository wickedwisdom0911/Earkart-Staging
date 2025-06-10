import 'package:freezed_annotation/freezed_annotation.dart';
part 'twilio.state.freezed.dart';

@freezed
class TwilioState with _$TwilioState {
  const factory TwilioState.initial() = TwilioInitial;
  const factory TwilioState.loading() = TwilioLoading;
  const factory TwilioState.success({required String token}) = TwilioSuccess;
  const factory TwilioState.error({required String message}) = TwilioError;
}
