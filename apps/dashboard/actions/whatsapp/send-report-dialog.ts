"use server";

interface SendReportDialogRequest {
  to: string;
  patientName: string;
  reportUrl: string;
}

interface SendReportDialogResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function sendReportDialog({
  to,
  patientName,
  reportUrl,
}: SendReportDialogRequest): Promise<SendReportDialogResponse> {
  try {
    console.log('📱 WhatsApp API - Action function called');
    console.log('📱 WhatsApp API - Sending request:', { to, patientName, reportUrl });
    
    // Check for required environment variables
    const whatsappApiUrl = process.env.WHATSAPP_API_URL;
    const whatsappApiKey = process.env.WHATSAPP_API_KEY;
    const whatsappNamespace = process.env.WHATSAPP_TEMPLATE_NAMESPACE;
    const whatsappCookie = process.env.WHATSAPP_COOKIE;
    
    if (!whatsappApiUrl || !whatsappApiKey || !whatsappNamespace) {
      console.error('❌ Missing WhatsApp API environment variables');
      return {
        success: false,
        error: 'WhatsApp API configuration is missing. Please check environment variables.'
      };
    }
    
    const requestBody = {
      template: {
        namespace: whatsappNamespace,
        name: "final_report_copy",
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "document",
                document: {
                  filename: "V2.SEND TEXT MEDIA MESSAGE.pdf",
                  link: reportUrl
                }
              }
            ]
          },
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: patientName
              }
            ]
          }
        ],
        language: {
          code: "en_US",
          policy: "deterministic"
        }
      },
      messaging_product: "whatsapp",
      to: to,
      type: "template"
    };
    
    console.log('📱 WhatsApp API - Request body:', JSON.stringify(requestBody, null, 2));
    
    const headers: Record<string, string> = {
      'API-KEY': whatsappApiKey,
      'Content-Type': 'application/json',
    };
    
    // Add cookie if provided
    if (whatsappCookie) {
      headers['Cookie'] = whatsappCookie;
    }
    
    const response = await fetch(whatsappApiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    console.log('📱 WhatsApp API - Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ WhatsApp Dialog API error:', errorData);
      return {
        success: false,
        error: `WhatsApp API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      };
    }

    const result = await response.json();
    console.log('✅ WhatsApp Dialog API success:', result);

    return {
      success: true,
      message: 'Report sent successfully via WhatsApp'
    };

  } catch (error) {
    console.error('Failed to send report via WhatsApp Dialog API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
