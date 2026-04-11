export enum StatusEnum {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

/** Device inventory status from the device API (distinct from generic ACTIVE/INACTIVE in some payloads). */
export enum DeviceStatusEnum {
  ENABLED = "ENABLED",
  DISABLED = "DISABLED",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

export enum Role {
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
  HEAD_AUDIOLOGIST = "HEAD_AUDIOLOGIST",
  AUDIOLOGIST = "AUDIOLOGIST",
  PATIENT = "PATIENT",
  CENTRE = "CENTRE",
  // Backend roles - allow parsing API responses
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE",
}

export enum PaymentCycle {
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
}

export enum WeekDays {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY",
}

export enum DeviceActivityType {
  ASSIGNED = "ASSIGNED",
  UNASSIGNED = "UNASSIGNED",
  ENABLED = "ENABLED",
  DISABLED = "DISABLED",
}

export enum TestStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  // Keep old values for backward compatibility
  PENDING = "PENDING",
  CANCELLED = "CANCELLED",
}

export enum Ear {
  LEFT = "LEFT",
  RIGHT = "RIGHT",
  BOTH = "BOTH",
}

export enum TympType {
  TYPE_A = "TYPE_A",
  TYPE_B = "TYPE_B",
  TYPE_C = "TYPE_C",
  TYPE_AS = "TYPE_AS",
  TYPE_AD = "TYPE_AD",
  // Keep old values for backward compatibility
  A = "A",
  As = "As",
  Ad = "Ad",
  B = "B",
  C = "C",
}

export enum PatientConsultationStatus {
  REQUESTED = "REQUESTED",
  JOINED = "JOINED",
  LEFT = "LEFT",
  CANCELLED = "CANCELLED",
  // Keep old values for backward compatibility
  DISCONNECTED = "DISCONNECTED",
}

export enum AudiologistConsultationStatus {
  PENDING = "PENDING",
  JOINED = "JOINED",
  LEFT = "LEFT",
  COMPLETED = "COMPLETED",
  // Keep old values for backward compatibility
  ACCEPTED = "ACCEPTED",
  DISCONNECTED = "DISCONNECTED",
}

export enum SessionStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  // Keep CANCELLED for backward compatibility but backend doesn't have it
  CANCELLED = "CANCELLED",
  // Missed calls - used in audiologist monitoring
  MISSED = "MISSED",
}

export enum AnswerType {
  SHORT_TEXT = "SHORT_TEXT",
  LONG_TEXT = "LONG_TEXT",
  NUMBER = "NUMBER",
  DATE = "DATE",
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE",
  CHECKBOX = "CHECKBOX",
}

export enum AudiologistActivityType {
  LUNCH_BREAK = "LUNCH_BREAK",
  BREAK = "BREAK",
  HOME_VISIT = "HOME_VISIT",
  TRAINING = "TRAINING",
  HEARING_AID_FITTING = "HEARING_AID_FITTING",
  FINE_TUNING = "FINE_TUNING",
  OTHER = "OTHER",
}

// Signal types for audiometry tests
export enum SignalType {
  Steady = "Steady",
  Warble = "Warble",
  NB = "NB",
  White = "White",
  SpeechNoise = "SpeechNoise",
}

// Analytics and reporting enums
export enum MetricType {
  CONSULTATIONS = "consultations",
  AUDIOLOGISTS = "audiologists",
}

export enum AggregationType {
  COUNT = "count",
  SUM = "sum",
  AVG = "avg",
}

export enum GroupByType {
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  YEAR = "year",
}

export enum TimeRangeType {
  DAILY = "daily",
  WEEKLY = "weekly",
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export enum ConsultationStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum PatientSoldStatus {
  UNKNOWN = "UNKNOWN",
  SOLD = "SOLD",
  NOT_SOLD = "NOT_SOLD",
}

export enum ReportType {
  AUDIOMETRY = "AUDIOMETRY",
  TYMPANOMETRY = "TYMPANOMETRY",
  ETF = "ETF",
  SISI = "SISI",
  SPEECH = "SPEECH",
  REFLEXES = "REFLEXES",
  TONE = "TONE",
  OAE = "OAE",
  OTOSCOPY = "OTOSCOPY",
  TONE_DECAY = "TONE_DECAY",
}

export enum ToneDecayResult {
  POSITIVE = "POSITIVE",
  NEGATIVE = "NEGATIVE",
  // Keep old values for backward compatibility
  NORMAL = "NORMAL",
  ABNORMAL = "ABNORMAL",
  CANNOT_DETERMINE = "CANNOT_DETERMINE",
  NOT_COMPLETED = "NOT_COMPLETED",
}

/** Sensorineural hearing loss severity on consultation (backend enum). */
export enum HearingLossSeverity {
  MILD = "MILD",
  MODERATE = "MODERATE",
  SEVERE = "SEVERE",
  PROFOUND = "PROFOUND",
}

