import { NextResponse } from "next/server";

// POST /api/whatsapp/send-report
// Accepts multipart/form-data with fields:
// - file: PDF blob (required)
// - filename: string (optional)
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const originalFilename = (formData.get("filename") as string) || "report.pdf";

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const WHATSAPP_TOKEN = process.env.META_WHATSAPP_TOKEN || "EAAS81BMLaZBABPAUaBcVFeH5u4HqbpYrkZCZBqj4Don028T7jZACVYj3dYbGGgl7KcecyfJuETcibfZAZCzkhXHAG9o9CX2GKnZAposr1tntKOpD2JClnTNC7Kb1En6S08MnwEO6HRi0JL0k1jbga5kP2p7IW5GeJ46OOxgVut1ZBAUGQWOGg38M4GAsv9RdrC6mHL9EFTiVwacCYmYx538SlOlGV1GF2R9HDmyIAKa7VAZDZD";
    const PHONE_NUMBER_ID = process.env.META_WHATSAPP_PHONE_NUMBER_ID || "689036807637414";

    if (!WHATSAPP_TOKEN) {
      return NextResponse.json({ error: "META_WHATSAPP_TOKEN not configured" }, { status: 500 });
    }

    // 1) Upload media to WhatsApp Cloud API
    const mediaForm = new FormData();
    mediaForm.append("file", file, originalFilename);
    mediaForm.append("messaging_product", "whatsapp");

    const uploadRes = await fetch(`https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/media`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: mediaForm,
    });

    const uploadJson = await uploadRes.json();
    if (!uploadRes.ok) {
      return NextResponse.json(
        { error: "Failed to upload media", details: uploadJson },
        { status: uploadRes.status }
      );
    }

    const mediaId = uploadJson.id as string | undefined;
    if (!mediaId) {
      return NextResponse.json({ error: "No media id returned" }, { status: 500 });
    }

    // 2) Send a template message that includes the PDF as a document header
    const TO_NUMBER = "919058075653"; // +91 90580 75653
    const templateName = (formData.get("templateName") as string) || process.env.META_WHATSAPP_TEMPLATE_NAME || "report_pdf";
    const languageCode = (formData.get("languageCode") as string) || process.env.META_WHATSAPP_TEMPLATE_LANG || "en_US";

    if (!templateName) {
      return NextResponse.json(
        { error: "Missing templateName. Provide an approved template with a document header." },
        { status: 400 }
      );
    }

    const templateWithDocument = {
      messaging_product: "whatsapp",
      to: TO_NUMBER,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "document",
                document: {
                  id: mediaId,
                  filename: originalFilename,
                },
              },
            ],
          },
        ],
      },
    } as const;

    const sendRes = await fetch(`https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify(templateWithDocument),
    });
    const sendJson = await sendRes.json();
    if (!sendRes.ok) {
      return NextResponse.json(
        { error: "Failed to send template with document header", details: sendJson },
        { status: sendRes.status }
      );
    }

    return NextResponse.json({ success: true, result: sendJson });
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected error", details: (err as Error).message },
      { status: 500 }
    );
  }
}


