import { NextResponse } from "next/server";

interface SendReportDialogRequest {
  to: string;
  patientName: string;
  reportUrl: string;
}

export async function POST(request: Request) {
  try {
    const { to, patientName, reportUrl }: SendReportDialogRequest = await request.json();
    
    console.log('📱 WhatsApp API - API route called');
    console.log('📱 WhatsApp API - Sending request:', { to, patientName, reportUrl });
    
    const requestBody = {
      template: {
        namespace: "065adc48_d91a_473f_a962_c1259f818555",
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
    
    const response = await fetch('https://orailap.azurewebsites.net/api/cloud/Dialog', {
      method: 'POST',
      headers: {
        'API-KEY': 'T1ubpczmBmxRzk37ag9jzRxvAK',
        'Content-Type': 'application/json',
        'Cookie': 'ARRAffinity=c0c9a2297c18e61f589a86f4a5429bbde348eef095609f221ea5dfcbbe54bb8c; ARRAffinitySameSite=c0c9a2297c18e61f589a86f4a5429bbde348eef095609f221ea5dfcbbe54bb8c'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📱 WhatsApp API - Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ WhatsApp Dialog API error:', errorData);
      return NextResponse.json({
        success: false,
        error: `WhatsApp API error: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`
      }, { status: 500 });
    }

    const result = await response.json();
    console.log('✅ WhatsApp Dialog API success:', result);

    return NextResponse.json({
      success: true,
      message: 'Report sent successfully via WhatsApp'
    });

  } catch (error) {
    console.error('Failed to send report via WhatsApp Dialog API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
