import { z } from "zod";

/** Flexible ERP employee row — backend field names may vary */
export const ErpEmployeeRowSchema = z
  .object({
    id: z.string().optional(),
    employeeId: z.string().optional(),
    userId: z.string().optional(),
    name: z.string().optional(),
    fullName: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    designationName: z.string().optional(),
    employeeName: z.string().optional(),
    displayName: z.string().optional(),
    userName: z.string().optional(),
    full_name: z.string().optional(),
    employee_name: z.string().optional(),
  })
  .passthrough();

export type ErpEmployeeRow = z.infer<typeof ErpEmployeeRowSchema>;

export const ErpDesignationRowSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().optional(),
    designationName: z.string().optional(),
  })
  .passthrough();
