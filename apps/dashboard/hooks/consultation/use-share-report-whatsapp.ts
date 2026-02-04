import { useState, useCallback } from "react";
import { toast } from "sonner";
import { exportElementToPdfBlob } from "@/lib/pdf";
import initiateReportUpload from "@/actions/consultations/initiate-report-upload";
import completeReportUpload from "@/actions/consultations/complete-report-upload";
import { ReportType } from "@/models/enums";

interface UseShareReportWhatsAppProps {
  consultationId: string;
  reportType: ReportType;
  patientName?: string;
  patientContact?: string;
  reportRef: React.RefObject<HTMLDivElement | null>;
}

export function useShareReportWhatsApp({
  consultationId,
  reportType,
  patientName,
  patientContact,
  reportRef,
}: UseShareReportWhatsAppProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [sharePhone, setSharePhone] = useState("");

  // Format phone number for WhatsApp (91XXXXXXXXXX)
  const formatPhoneForWhatsApp = useCallback((phone: string): string => {
    const stripped = phone.replace(/^\+/, "");
    return stripped.startsWith("91") ? stripped : (stripped ? `91${stripped}` : "");
  }, []);

  // Default patient phone formatted
  const defaultPatientPhone = formatPhoneForWhatsApp(patientContact || "");

  /**
   * Parse multiple phone numbers from input string
   * Supports comma or space-separated numbers
   */
  const parsePhoneNumbers = useCallback((input: string): string[] => {
    if (!input || !input.trim()) return [];
    
    return input
      .split(/[\s,]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(formatPhoneForWhatsApp)
      .filter(n => n.length >= 10);
  }, [formatPhoneForWhatsApp]);

  /**
   * Share report via WhatsApp
   * Generates PDF, uploads to S3, and sends via WhatsApp
   */
  const shareReport = useCallback(async (toNumbersInput: string) => {
    console.log('🚀 Starting WhatsApp share process');
    
    if (!patientName) {
      toast.error('Patient name not available');
      return;
    }

    setIsSharing(true);

    try {
      // Generate fresh PDF
      console.log('📄 Generating fresh PDF for sharing...');
      toast.info("Generating fresh report...", {
        description: "Creating PDF from current report data",
        duration: 2000,
      });
      
      if (!reportRef.current) {
        throw new Error('Report element not available');
      }
      
      const blob = await exportElementToPdfBlob(reportRef.current, {
        singlePage: true,
        fullPage: true,
        captureScale: reportType === ReportType.AUDIOMETRY ? 2 : 1.5,
      });
      const fileName = `${reportType.toLowerCase()}-report-${patientName.replace(/\s+/g, '-')}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });
      
      console.log('✅ PDF generated:', file.size, 'bytes');

      // Initiate S3 upload
      console.log('☁️ Initiating S3 upload...');
      toast.info("Uploading report...", {
        description: "Preparing to upload report to cloud storage",
        duration: 2000,
      });
      
      const initiateResult = await initiateReportUpload({
        consultationId,
        fileName: file.name,
        contentType: file.type,
        reportType,
      });
      
      if (!initiateResult.success || !initiateResult.data) {
        throw new Error(initiateResult.message || "Failed to initiate upload");
      }
      
      const { presignedUrl, uploadId } = initiateResult.data;
      
      let finalReportUrl: string;
      
      // Upload to S3 with fallback mechanism
      try {
        console.log('📤 Uploading to S3...');
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`S3 upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }
        
        console.log('✅ Uploaded to S3 successfully');
        
        // Complete the upload
        console.log('🔗 Completing upload and getting final URL...');
        const completeResult = await completeReportUpload({
          uploadId,
          consultationId,
          reportType,
        });
        
        if (!completeResult.success || !completeResult.data) {
          throw new Error(completeResult.message || "Failed to complete upload");
        }
        
        finalReportUrl = completeResult.data.fileUrl;
        console.log('✅ Final report URL:', finalReportUrl);
        
      } catch (s3Error) {
        console.error("S3 upload/complete failed, using fallback:", s3Error);
        toast.warning("Upload failed, using fallback URL for sharing");
        
        // Fallback to test URLs based on report type
        const fallbackUrls: Record<string, string> = {
          'AUDIOMETRY': 'https://omni-two.s3.ap-south-1.amazonaws.com/reports/test-audiometry-report.pdf',
          'TYMPANOMETRY': 'https://omni-two.s3.ap-south-1.amazonaws.com/reports/test-tympanometry-report.pdf',
          'ETF': 'https://omni-two.s3.ap-south-1.amazonaws.com/reports/test-etf-report.pdf',
          'TONE': 'https://omni-two.s3.ap-south-1.amazonaws.com/reports/test-tone-decay-report.pdf',
        };
        
        finalReportUrl = fallbackUrls[reportType] || 'https://fpu.branding-element.com/prod/61017/BROADCAST_TEMPLATE_ATTACHMENT/67563-04092025_062434-V2.SENDTEXTMEDIAMESSAGE.pdf';
        console.log('🔧 Using fallback URL:', finalReportUrl);
      }

      // Parse recipients
      const rawList = toNumbersInput || patientContact || "";
      const recipients = rawList
        .split(/[\s,]+/)
        .map(s => s.trim())
        .filter(Boolean);

      const formatNumber = (n: string) => {
        let x = n.replace(/^\+/, '');
        if (!/^91\d{10}$/.test(x)) {
          if (/^\d{10}$/.test(x)) x = `91${x}`;
        }
        return x;
      };

      const uniqueRecipients = Array.from(new Set(recipients.map(formatNumber)));
      
      if (uniqueRecipients.length === 0) {
        toast.error("No valid phone number provided");
        return;
      }

      console.log('📱 Sending WhatsApp to recipients:', uniqueRecipients);
      
      // Send WhatsApp messages (client-side API route calls)
      const results = await Promise.allSettled(uniqueRecipients.map(async (to) => {
        try {
          const response = await fetch('/api/whatsapp/send-report-dialog', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              to, 
              patientName, 
              reportUrl: finalReportUrl, 
              reportType: reportType.toLowerCase() 
            })
          });
          const json = await response.json();
          if (!json.success) throw new Error(json.error || 'Unknown error');
          return { to, success: true };
        } catch (e: any) {
          return { to, success: false, error: e?.message || String(e) };
        }
      }));

      const succeeded = results.filter(r => r.status === 'fulfilled' && (r as any).value?.success).length;
      const failed = uniqueRecipients.length - succeeded;

      if (failed === 0) {
        toast.success(`Report shared to ${succeeded} recipient(s)`);
      } else if (succeeded > 0) {
        toast.warning(`Shared to ${succeeded}, failed for ${failed}`);
        console.warn('Some sends failed:', results);
      } else {
        toast.error('Failed to share report to all recipients');
      }

      console.log('✅ WhatsApp sharing completed');
      
    } catch (error) {
      console.error('❌ Failed to share report:', error);
      toast.error("Failed to share report", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSharing(false);
    }
  }, [
    consultationId,
    reportType,
    patientName,
    patientContact,
    reportRef,
  ]);

  /**
   * Handle share button click
   * For AIIMS employees, sends to hardcoded number
   * For others, opens dialog
   */
  const handleShareClick = useCallback(() => {
    // Check if user is AIIMS employee
    const isAiims = typeof window !== 'undefined' && localStorage.getItem('isAiims') === 'true';
    
    if (isAiims) {
      console.log('🏥 AIIMS employee detected - sending report to hardcoded number');
      shareReport('919980936971');
    } else {
      setIsShareDialogOpen(true);
    }
  }, [shareReport]);

  /**
   * Handle dialog confirm
   */
  const handleDialogConfirm = useCallback(async () => {
    setIsShareDialogOpen(false);
    await shareReport(sharePhone);
  }, [sharePhone, shareReport]);

  return {
    isSharing,
    isShareDialogOpen,
    setIsShareDialogOpen,
    sharePhone,
    setSharePhone,
    defaultPatientPhone,
    handleShareClick,
    handleDialogConfirm,
    shareReport,
  };
}

