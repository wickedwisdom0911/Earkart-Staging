import { z } from "zod";

const PeakSchema = z.object({
  Compliance: z.number().optional(),
  CompensatedWithECV: z.number().optional(),
  Pressure: z.number().optional(),
});

const YDataSchema = z.object({
  Peak: PeakSchema.optional(),
  Gradient: z.number().optional(),
  GradientPressure: z.number().optional(),
  ComplianceData: z.array(z.number()).optional(),
});

const TympDataSchema = z.object({
  Result: z.string().optional(),
  Classification: z.string().optional(),
  ECV: z.number().optional(),
  PressureData: z.array(z.number()).optional(),
  Y: YDataSchema.optional(),
});

export const ImpedanceDataSchema = z.object({
  PacketType: z.number().optional(),
  PacketName: z.string().optional(),
  ProbetoneFrequency: z.number().optional(),
  Interrupted: z.boolean().optional(),
  Tymp: TympDataSchema.optional(),
});

export type ImpedanceData = z.infer<typeof ImpedanceDataSchema>;
