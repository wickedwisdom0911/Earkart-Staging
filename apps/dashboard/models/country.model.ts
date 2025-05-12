import { StatusEnum } from "@/models/enums";
import { z } from "zod";

export const CountryModelDataSchema = z.object({
  id: z.string().optional().nullable(),
  name: z.string(),
  code: z.string(),
  status: z.nativeEnum(StatusEnum),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
});
export const CreateCountryModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: CountryModelDataSchema.nullable().optional(),
});

export const CountryModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(CountryModelDataSchema),
});
export type CountryModel = z.infer<typeof CountryModelSchema>;
export type CountryModelData = z.infer<typeof CountryModelDataSchema>;
export type CreateCountryModel = z.infer<typeof CreateCountryModelSchema>;
