import { useMutation } from "@tanstack/react-query";
import { sendWhatsAppReport, SendWhatsAppReportRequest } from "@/actions/whatsapp/send-report";
import { toast } from "sonner";

export function useSendWhatsAppReport() {
  return useMutation({
    mutationFn: (data: SendWhatsAppReportRequest) => sendWhatsAppReport(data),
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Report sent successfully');
      } else {
        toast.error(response.message || 'Failed to send report');
      }
    },
    onError: (error: Error) => {
      toast.error(`Error sending report: ${error.message}`);
    }
  });
}
