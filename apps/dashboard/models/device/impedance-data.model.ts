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

const EtfCurveSchema = z.object({
  Peak: PeakSchema.optional(),
  Gradient: z.number().optional(),
  GradientPressure: z.number().optional(),
  gradient: z.number().optional(), // Keep for backward compatibility
  gradientpressure: z.number().optional(), // Keep for backward compatibility
  PressureData: z.array(z.number()).optional(),
  ComplianceData: z.array(z.number()).optional(),
});

const EtfIntactSchema = z.object({
  ECV: z.number().optional(),
  Curves: z.array(EtfCurveSchema).optional(),
});

export const ImpedanceDataSchema = z.object({
  PacketType: z.number().optional(),
  PacketName: z.string().optional(),
  ProbetoneFrequency: z.number().optional(),
  Interrupted: z.boolean().optional(),
  Tymp: TympDataSchema.optional(),
  EtfIntact: EtfIntactSchema.optional(),
});

export type ImpedanceData = z.infer<typeof ImpedanceDataSchema>;
