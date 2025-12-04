import { useMutation } from "@tanstack/react-query";
import sendWhatsAppReport from "@/actions/consultations/send-whatsapp-report";
import type { SendWhatsAppReportBatchRequest, SendWhatsAppReportBatchResponse } from "@/models/whatsapp-report.model";
import { toast } from "sonner";

export function useSendWhatsAppReport() {
  return useMutation<
    SendWhatsAppReportBatchResponse,
    Error,
    SendWhatsAppReportBatchRequest
  >({
    mutationFn: async (request: SendWhatsAppReportBatchRequest) => {
      return await sendWhatsAppReport(request);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Report sent successfully!", {
          description: data.message || `Sent to ${data.totalSent} recipient(s)`,
        });
      } else {
        toast.error("Failed to send report", {
          description: data.message,
        });
      }
    },
    onError: (error) => {
      console.error("Failed to send WhatsApp report:", error);
      toast.error("Failed to send report via WhatsApp", {
        description: error.message,
      });
    },
  });
}

