import { z } from "zod";
import { CentreModelDataSchema } from "./centre.model";
import { DeviceActivityType, StatusEnum } from "./enums";
import { userModelDataSchema } from "./user.model";
const DeviceActivityModelDataSchema = z.object({
  id: z.string().optional(),
  deviceId: z.string(),
  deviceActivityType: z.nativeEnum(DeviceActivityType),
  centreId: z.string().optional().nullable(),
  actionBy: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  actionByUser: userModelDataSchema.optional().nullable(),
  centre: CentreModelDataSchema.optional().nullable(),
});
export const DeviceModelDataSchema = z.object({
  id: z.string().optional(),
  code: z.string().optional().nullable(),
  codeSequence: z.number().optional().nullable(),
  otoscopeID: z.string().optional().nullable(),
  tabletID: z.string().optional().nullable(),
  deviceID: z.string().optional().nullable(),
  tabletAppVersion: z.string().optional().nullable(),
  tabletAndroidVersion: z.string().optional().nullable(),
  status: z.nativeEnum(StatusEnum),
  pendingUpdate: z.boolean().optional().nullable(),
  pendingLookup: z.boolean().optional().nullable(),
  lastUpdateChecked: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  centreId: z.string().optional().nullable(),
  deviceActivities: z
    .array(DeviceActivityModelDataSchema)
    .optional()
    .nullable(),
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
