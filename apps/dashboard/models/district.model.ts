import { z } from "zod";
import { CityModelDataSchema } from "./city.model";
import { StatusEnum } from "./enums";
export const DistrictModelDataSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  status: z.nativeEnum(StatusEnum),
  cityId: z.string(),
  city: CityModelDataSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export const CreateDistrictModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: DistrictModelDataSchema.nullable(),
});
export const DistrictModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(DistrictModelDataSchema),
});

export type DistrictModelData = z.infer<typeof DistrictModelDataSchema>;
export type CreateDistrictModel = z.infer<typeof CreateDistrictModelSchema>;
export type DistrictModel = z.infer<typeof DistrictModelSchema>;
