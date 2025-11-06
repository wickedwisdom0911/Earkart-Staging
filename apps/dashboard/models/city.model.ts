import { z } from "zod";
import { StatusEnum } from "./enums";
import { DistrictModelDataSchema } from "./district.model";

export const CityModelDataSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  districtId: z.string(),
  district: DistrictModelDataSchema.optional(),
  status: z.nativeEnum(StatusEnum),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export const CreateCityModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: CityModelDataSchema.nullable(),
});
export const CityModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(CityModelDataSchema).nullable(),
});

export type CityModelData = z.infer<typeof CityModelDataSchema>;
export type CreateCityModel = z.infer<typeof CreateCityModelSchema>;
export type CityModel = z.infer<typeof CityModelSchema>;
