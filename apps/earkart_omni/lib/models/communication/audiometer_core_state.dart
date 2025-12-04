class CalibrationFrequency {
  final int frequency;
  final int maxLevelHL;
  final int minLevelHL;
  final int calibration;

  CalibrationFrequency({
    required this.frequency,
    required this.maxLevelHL,
    required this.minLevelHL,
    required this.calibration,
  });

  factory CalibrationFrequency.fromJson(Map<String, dynamic> json) {
    return CalibrationFrequency(
      frequency: json['Frequency'] ?? -1,
      maxLevelHL: json['MaxLevelHL'] ?? 0,
      minLevelHL: json['MinLevelHL'] ?? 0,
      calibration: json['Calibration'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'Frequency': frequency,
    'MaxLevelHL': maxLevelHL,
    'MinLevelHL': minLevelHL,
    'Calibration': calibration,
  };
}

class Calibration {
  final int signalType;
  final List<CalibrationFrequency> calibrationFrequencies;

  Calibration({required this.signalType, required this.calibrationFrequencies});

  factory Calibration.fromJson(Map<String, dynamic> json) {
    return Calibration(
      signalType: json['SignalType'] ?? 0,
      calibrationFrequencies:
          (json['CalibrationFrequencies'] as List<dynamic>?)
              ?.map((freq) => CalibrationFrequency.fromJson(freq))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() => {
    'SignalType': signalType,
    'CalibrationFrequencies':
        calibrationFrequencies.map((freq) => freq.toJson()).toList(),
  };
}

class Transducer {
  final String id;
  final String name;
  final bool hf;
  final String calibrationDate;
  final int conductionType;
  final List<int> earSides;
  final List<int> signalTypes;
  final List<double> rates;
  final List<Calibration> calibrations;

  Transducer({
    required this.id,
    required this.name,
    required this.hf,
    required this.calibrationDate,
    required this.conductionType,
    required this.earSides,
    required this.signalTypes,
    required this.rates,
    required this.calibrations,
  });

  factory Transducer.fromJson(Map<String, dynamic> json) {
    return Transducer(
      id: json['ID'] ?? '',
      name: json['Name'] ?? '',
      hf: json['HF'] ?? false,
      calibrationDate: json['CalibrationDate'] ?? '',
      conductionType: json['ConductionType'] ?? 0,
      earSides: (json['EarSides'] as List<dynamic>?)?.cast<int>() ?? [],
      signalTypes: (json['SignalTypes'] as List<dynamic>?)?.cast<int>() ?? [],
      rates:
          (json['Rates'] as List<dynamic>?)
              ?.map((rate) => (rate as num).toDouble())
              .toList() ??
          [],
      calibrations:
          (json['Calibrations'] as List<dynamic>?)
              ?.map((cal) => Calibration.fromJson(cal))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() => {
    'ID': id,
    'Name': name,
    'HF': hf,
    'CalibrationDate': calibrationDate,
    'ConductionType': conductionType,
    'EarSides': earSides,
    'SignalTypes': signalTypes,
    'Rates': rates,
    'Calibrations': calibrations.map((cal) => cal.toJson()).toList(),
  };
}

class ImpedanceCalibrationFrequency {
  final int frequency;
  final int maxLevelHL;
  final int minLevelHL;
  final int calibration;

  ImpedanceCalibrationFrequency({
    required this.frequency,
    required this.maxLevelHL,
    required this.minLevelHL,
    required this.calibration,
  });

  factory ImpedanceCalibrationFrequency.fromJson(Map<String, dynamic> json) {
    return ImpedanceCalibrationFrequency(
      frequency: json['Frequency'] ?? -1,
      maxLevelHL: json['MaxLevelHL'] ?? 0,
      minLevelHL: json['MinLevelHL'] ?? 0,
      calibration: json['Calibration'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'Frequency': frequency,
    'MaxLevelHL': maxLevelHL,
    'MinLevelHL': minLevelHL,
    'Calibration': calibration,
  };
}

class ImpedanceCalibration {
  final int signalType;
  final List<ImpedanceCalibrationFrequency> calibrationFrequencies;

  ImpedanceCalibration({
    required this.signalType,
    required this.calibrationFrequencies,
  });

  factory ImpedanceCalibration.fromJson(Map<String, dynamic> json) {
    return ImpedanceCalibration(
      signalType: json['SignalType'] ?? 0,
      calibrationFrequencies:
          (json['CalibrationFrequencies'] as List<dynamic>?)
              ?.map((freq) => ImpedanceCalibrationFrequency.fromJson(freq))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() => {
    'SignalType': signalType,
    'CalibrationFrequencies':
        calibrationFrequencies.map((freq) => freq.toJson()).toList(),
  };
}

class ImpedanceTransducer {
  final String id;
  final String name;
  final String calibrationDate;
  final int earType;
  final List<int> signalTypes;
  final List<int> reflexStimulusDuration;
  final List<int> decayStimulusDuration;
  final List<ImpedanceCalibration> calibrations;

  ImpedanceTransducer({
    required this.id,
    required this.name,
    required this.calibrationDate,
    required this.earType,
    required this.signalTypes,
    required this.reflexStimulusDuration,
    required this.decayStimulusDuration,
    required this.calibrations,
  });

  factory ImpedanceTransducer.fromJson(Map<String, dynamic> json) {
    return ImpedanceTransducer(
      id: json['ID'] ?? '',
      name: json['Name'] ?? '',
      calibrationDate: json['CalibrationDate'] ?? '',
      earType: json['EarType'] ?? 0,
      signalTypes: (json['SignalTypes'] as List<dynamic>?)?.cast<int>() ?? [],
      reflexStimulusDuration:
          (json['ReflexStimulusDuration'] as List<dynamic>?)?.cast<int>() ?? [],
      decayStimulusDuration:
          (json['DecayStimulusDuration'] as List<dynamic>?)?.cast<int>() ?? [],
      calibrations:
          (json['Calibrations'] as List<dynamic>?)
              ?.map((cal) => ImpedanceCalibration.fromJson(cal))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() => {
    'ID': id,
    'Name': name,
    'CalibrationDate': calibrationDate,
    'EarType': earType,
    'SignalTypes': signalTypes,
    'ReflexStimulusDuration': reflexStimulusDuration,
    'DecayStimulusDuration': decayStimulusDuration,
    'Calibrations': calibrations.map((cal) => cal.toJson()).toList(),
  };
}

class TransducerResponse {
  final int packetType;
  String packetName;
  SpeechMaterial speechMaterial;
  final List<Transducer> transducers;
  final List<ImpedanceTransducer> impedanceTransducers;

  TransducerResponse({
    required this.packetType,
    required this.transducers,
    required this.packetName,
    required this.speechMaterial,
    required this.impedanceTransducers,
  });

  factory TransducerResponse.fromJson(Map<String, dynamic> json) {
    return TransducerResponse(
      packetType: json['PacketType'] ?? 0,

      transducers:
          (json['Transducers'] as List<dynamic>?)
              ?.map((trans) => Transducer.fromJson(trans))
              .toList() ??
          [],
      impedanceTransducers:
          (json['ImpedanceTransducers'] as List<dynamic>?)
              ?.map((trans) => ImpedanceTransducer.fromJson(trans))
              .toList() ??
          [],
      packetName: json['PacketName'] ?? '',
      speechMaterial: SpeechMaterial.fromJson(json['SpeechMaterial']),
    );
  }

  Map<String, dynamic> toJson() => {
    'PacketType': packetType,
    'Transducers': transducers.map((trans) => trans.toJson()).toList(),
    'ImpedanceTransducers':
        impedanceTransducers.map((trans) => trans.toJson()).toList(),
    'PacketName': packetName,
    'SpeechMaterial': speechMaterial.toJson(),
  };
}

class SpeechMaterial {
  List<Language> languages;
  Selected selected;

  SpeechMaterial({required this.languages, required this.selected});

  factory SpeechMaterial.fromJson(Map<String, dynamic> json) => SpeechMaterial(
    languages: List<Language>.from(
      json["Languages"].map((x) => Language.fromJson(x)),
    ),
    selected: Selected.fromJson(json["Selected"]),
  );

  Map<String, dynamic> toJson() => {
    "Languages": List<dynamic>.from(languages.map((x) => x.toJson())),
    "Selected": selected.toJson(),
  };
}

class Language {
  String name;
  List<dynamic> materials;

  Language({required this.name, required this.materials});

  factory Language.fromJson(Map<String, dynamic> json) => Language(
    name: json["Name"],
    materials: List<dynamic>.from(json["Materials"].map((x) => x)),
  );

  Map<String, dynamic> toJson() => {
    "Name": name,
    "Materials": List<dynamic>.from(materials.map((x) => x)),
  };
}

class MaterialClass {
  String name;
  List<PhonemeList>? phonemeLists;

  MaterialClass({required this.name, this.phonemeLists});

  factory MaterialClass.fromJson(Map<String, dynamic> json) => MaterialClass(
    name: json["Name"],
    phonemeLists:
        json["PhonemeLists"] == null
            ? []
            : List<PhonemeList>.from(
              json["PhonemeLists"]!.map((x) => PhonemeList.fromJson(x)),
            ),
  );

  Map<String, dynamic> toJson() => {
    "Name": name,
    "PhonemeLists":
        phonemeLists == null
            ? []
            : List<dynamic>.from(phonemeLists!.map((x) => x.toJson())),
  };
}

class PhonemeList {
  String name;
  List<String>? phonemes;

  PhonemeList({required this.name, this.phonemes});

  factory PhonemeList.fromJson(Map<String, dynamic> json) => PhonemeList(
    name: json["Name"],
    phonemes:
        json["Phonemes"] == null
            ? []
            : List<String>.from(json["Phonemes"]!.map((x) => x)),
  );

  Map<String, dynamic> toJson() => {
    "Name": name,
    "Phonemes":
        phonemes == null ? [] : List<dynamic>.from(phonemes!.map((x) => x)),
  };
}

class Selected {
  ListClass language;
  ListClass material;
  ListClass list;
  ListClass phoneme;

  Selected({
    required this.language,
    required this.material,
    required this.list,
    required this.phoneme,
  });

  factory Selected.fromJson(Map<String, dynamic> json) => Selected(
    language: ListClass.fromJson(json["Language"]),
    material: ListClass.fromJson(json["Material"]),
    list: ListClass.fromJson(json["List"]),
    phoneme: ListClass.fromJson(json["Phoneme"]),
  );

  Map<String, dynamic> toJson() => {
    "Language": language.toJson(),
    "Material": material.toJson(),
    "List": list.toJson(),
    "Phoneme": phoneme.toJson(),
  };
}

class ListClass {
  int index;
  String name;

  ListClass({required this.index, required this.name});

  factory ListClass.fromJson(Map<String, dynamic> json) =>
      ListClass(index: json["Index"], name: json["Name"]);

  Map<String, dynamic> toJson() => {"Index": index, "Name": name};
}
