import { useQuery } from "@tanstack/react-query";
import { getDesignations } from "@/actions/erp/get-designations";
import { getEmployeesByDesignationName } from "@/actions/erp/get-employees-by-designation-name";
import { mergeErpEmployeesByDesignation } from "@/lib/erp-team-parse";

/**
 * ERP team-management query params must match backend exactly:
 * - `GET .../get-designations?name=ASM`
 * - `GET .../get-employees-by-designation-name?designationName=ASM`
 */
export const ERP_DESIGNATION_NAME_ASM = "ASM" as const;

export default function useErpCentreManagerOptions() {
  return useQuery({
    queryKey: ["erp", "centre-asm-employees", ERP_DESIGNATION_NAME_ASM],
    queryFn: async () => {
      const designation = ERP_DESIGNATION_NAME_ASM;
      const [, employeesJson] = await Promise.all([
        getDesignations(designation).catch(() => null),
        getEmployeesByDesignationName(designation).catch(() => null),
      ]);
      return mergeErpEmployeesByDesignation([
        { designation, json: employeesJson ?? [] },
      ]);
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
