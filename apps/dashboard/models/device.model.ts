import { z } from "zod";
import { CentreModelDataSchema } from "./centre.model";
import { StatusEnum } from "./enums";
export const DeviceModelDataSchema = z.object({
  id: z.string().optional(),
  deviceCode: z
    .string()
    .min(11, { message: "Device code must be at least 3 characters" }),
  tabletID: z.string().optional().nullable(),
  deviceID: z.string().optional().nullable(),
  tabletAppVersion: z.string().optional().nullable(),
  status: z.nativeEnum(StatusEnum),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  centreId: z.string().optional().nullable(),
  centre: CentreModelDataSchema.optional().nullable(),
});

export const CreateDeviceModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: DeviceModelDataSchema.nullable().optional(),
});

export const DeviceModelSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.array(DeviceModelDataSchema),
});

export type DeviceModel = z.infer<typeof DeviceModelSchema>;
export type CreateDeviceModel = z.infer<typeof CreateDeviceModelSchema>;
export type DeviceModelData = z.infer<typeof DeviceModelDataSchema>;
