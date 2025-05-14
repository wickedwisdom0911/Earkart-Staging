import { z } from "zod";
import { StateModelDataSchema } from "./state.model";
import { StatusEnum } from "./enums";

export const CityModelDataSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  stateId: z.string(),
  status: z.nativeEnum(StatusEnum),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  state: StateModelDataSchema.optional(),
});
export const CreateCityModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: CityModelDataSchema.nullable(),
});
export const CityModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(CityModelDataSchema),
});

export type CityModelData = z.infer<typeof CityModelDataSchema>;
export type CreateCityModel = z.infer<typeof CreateCityModelSchema>;
export type CityModel = z.infer<typeof CityModelSchema>;
