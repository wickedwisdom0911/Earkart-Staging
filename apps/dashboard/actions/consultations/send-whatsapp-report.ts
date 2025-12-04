"use server";

import { 
  SendWhatsAppReportBatchRequestSchema,
  SendWhatsAppReportBatchResponseSchema,
  type SendWhatsAppReportBatchRequest,
  type SendWhatsAppReportBatchResponse
} from "@/models/whatsapp-report.model";

/**
 * Send WhatsApp report to multiple recipients
 * This action sends the report PDF via WhatsApp to one or more phone numbers
 */
export default async function sendWhatsAppReport(
  request: SendWhatsAppReportBatchRequest
): Promise<SendWhatsAppReportBatchResponse> {
  console.log('🔄 sendWhatsAppReport called with:', { 
    recipients: request.recipients,
    patientName: request.patientName,
    reportType: request.reportType,
    reportUrlPreview: request.reportUrl.substring(0, 50) + '...'
  });
  
  // Validate request body
  const validatedRequest = SendWhatsAppReportBatchRequestSchema.parse(request);
  console.log('✅ Request validated');

  const { recipients, patientName, reportUrl, reportType } = validatedRequest;
  
  // Format phone numbers
  const formatNumber = (n: string): string => {
    let x = n.replace(/^\+/, '').replace(/\D/g, '');
    if (x.length === 10) x = '91' + x;
    return x;
  };

  const formattedRecipients = recipients.map(formatNumber);
  console.log('📱 Formatted recipients:', formattedRecipients);

  // Send to each recipient
  const results = await Promise.all(
    formattedRecipients.map(async (to) => {
      try {
        console.log(`📤 Sending WhatsApp to ${to}...`);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/send-report-dialog`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            to, 
            patientName, 
            reportUrl, 
            reportType 
          })
        });
        
        const json = await response.json();
        
        if (!json.success) {
          console.error(`❌ Failed to send to ${to}:`, json.error);
          throw new Error(json.error || 'Unknown error');
        }
        
        console.log(`✅ Successfully sent to ${to}`);
        return { to, success: true };
      } catch (error: any) {
        console.error(`❌ Error sending to ${to}:`, error);
        return { 
          to, 
          success: false, 
          error: error?.message || String(error) 
        };
      }
    })
  );

  const totalSent = results.filter(r => r.success).length;
  const totalFailed = results.filter(r => !r.success).length;
  
  console.log(`📊 Results: ${totalSent} sent, ${totalFailed} failed`);

  const response: SendWhatsAppReportBatchResponse = {
    success: totalSent > 0,
    message: totalSent > 0 
      ? `Report sent successfully to ${totalSent} recipient(s)` 
      : 'Failed to send report to any recipients',
    results,
    totalSent,
    totalFailed,
  };

  return SendWhatsAppReportBatchResponseSchema.parse(response);
}

