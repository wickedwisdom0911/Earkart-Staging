import { useQuery } from "@tanstack/react-query";
import getConsultationsPage, {
  GetConsultationsPageParams,
} from "@/actions/consultations/get_consultations_page";

export function useGetConsultationsPaginated(params: GetConsultationsPageParams = {}) {
  const { page = 1, limit = 10, audiologistId } = params;

  return useQuery({
    queryKey: ["consultations", "paginated", page, limit, audiologistId],
    queryFn: () => getConsultationsPage({ page, limit, audiologistId }),
    staleTime: 30 * 1000,
  });
}
