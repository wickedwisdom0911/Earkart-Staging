import { z } from "zod";

export const CountryModelDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CountryModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: CountryModelDataSchema,
});
export type CountryModel = z.infer<typeof CountryModelSchema>;
export type CountryModelData = z.infer<typeof CountryModelDataSchema>;
