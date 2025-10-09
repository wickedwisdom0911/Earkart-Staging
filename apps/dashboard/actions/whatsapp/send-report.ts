import { ApiResponse } from "@/models/api.model";

export interface SendWhatsAppReportRequest {
  to: string;
  patientName: string;
  reportUrl: string;
  reportType: string;
}

export interface SendWhatsAppReportResponse {
  success: boolean;
  messageId?: string;
}

export async function sendWhatsAppReport(data: SendWhatsAppReportRequest): Promise<ApiResponse<SendWhatsAppReportResponse>> {
  try {
    const response = await fetch('/api/whatsapp/send-report-dialog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to send WhatsApp report');
    }
    
    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to send WhatsApp report'
    };
  }
}
