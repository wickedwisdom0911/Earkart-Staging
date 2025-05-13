import { z } from "zod";
import { CountryModelDataSchema } from "./country.model";
import { StatusEnum } from "./enums";

export const StateModelDataSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  status: z.nativeEnum(StatusEnum),
  countryId: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  country: CountryModelDataSchema.optional(),
});
export const CreateStateModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: StateModelDataSchema.nullable().optional(),
});

export const StateModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(StateModelDataSchema),
});
export type StateModelData = z.infer<typeof StateModelDataSchema>;
export type CreateStateModel = z.infer<typeof CreateStateModelSchema>;
export type StateModel = z.infer<typeof StateModelSchema>;
