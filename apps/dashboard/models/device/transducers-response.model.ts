import { z } from "zod";

const CalibrationFrequencySchema = z.object({
  Frequency: z.number(),
  MaxLevelHL: z.number(),
  MinLevelHL: z.number(),
  Calibration: z.number(),
});

const CalibrationSchema = z.object({
  SignalType: z.number(),
  CalibrationFrequencies: z.array(CalibrationFrequencySchema),
});

const TransducerSchema = z.object({
  ID: z.string().uuid(),
  Name: z.string(),
  HF: z.boolean(),
  CalibrationDate: z.string(),
  ConductionType: z.number(),
  EarSides: z.array(z.number()),
  SignalTypes: z.array(z.number()),
  Rates: z.array(z.number()),
  Calibrations: z.array(CalibrationSchema),
});

// Impedance transducers for reflex/tympanometry testing (IPSI/CONTRA)
const ImpedanceTransducerSchema = z.object({
  ID: z.string().uuid(),
  Name: z.string(), // "IPSI" or "Insert"
  CalibrationDate: z.string(),
  EarType: z.number(), // 0 = IPSI, 1 = CONTRA (Insert)
  SignalTypes: z.array(z.number()),
  ReflexStimulusDuration: z.array(z.number()).optional(),
  DecayStimulusDuration: z.array(z.number()).optional(),
  Calibrations: z.array(CalibrationSchema),
});

const PhonemeListSchema = z.object({
  Name: z.string(),
  Phonemes: z.array(z.string()).optional(),
});

const MaterialSchema = z.union([
  z.string(),
  z.object({
    Name: z.string(),
    PhonemeLists: z.array(PhonemeListSchema).optional(),
  }),
]);

const LanguageSchema = z.object({
  Name: z.string(),
  Materials: z.array(MaterialSchema),
});

const SelectedItemSchema = z.object({
  Index: z.number(),
  Name: z.string(),
});

const SelectedSchema = z.object({
  Language: SelectedItemSchema,
  Material: SelectedItemSchema,
  List: SelectedItemSchema,
  Phoneme: SelectedItemSchema,
});

const SpeechMaterialSchema = z.object({
  Languages: z.array(LanguageSchema),
  Selected: SelectedSchema,
});

export const TransducersResponseSchema = z.object({
  PacketType: z.number(),
  PacketName: z.string(),
  Transducers: z.array(TransducerSchema),
  ImpedanceTransducers: z.array(ImpedanceTransducerSchema).optional(),
  SpeechMaterial: SpeechMaterialSchema,
});

export type TransducersResponse = z.infer<typeof TransducersResponseSchema>;
