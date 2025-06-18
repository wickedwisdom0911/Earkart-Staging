import { z } from "zod";

const YSchema = z.object({
  Compliance: z.number().optional(),
});

const TympSchema = z.object({
  ECV: z.number().optional(),
  Y: YSchema.optional(),
  Pressure: z.number().optional(),
});

const ProbeStatusSchema = z.object({
  IsOpen: z.boolean().optional(),
  IsClose: z.boolean().optional(),
  ProbeOpenComplianceLimit: z.number().optional(),
  ProbeCloseComplianceLimit: z.number().optional(),
});

export const ImpedanceStatusSchema = z.object({
  PacketType: z.number().optional(),
  PacketName: z.string().optional(),
  Compliance: z.number().optional(),
  Pressure: z.number().optional(),
  ProbetoneFrequency: z.number().optional(),
  IsImpedanceOngoing: z.boolean().optional(),
  Status: z.number().optional(),
  StatusName: z.string().optional(),
  ProbeStatus: ProbeStatusSchema.optional(),
  Tymp: TympSchema.optional(),
});

export type ImpedanceStatus = z.infer<typeof ImpedanceStatusSchema>;
