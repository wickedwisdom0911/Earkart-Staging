"use client";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default function EndConsultationPage() {
  const { consultationId } = useParams();
  const router = useRouter();

  const handleBackToTestSelection = () => {
    router.push(ROUTES.CONSULTATION_TEST_SELECTION(consultationId as string));
  };

  const handleBackToReport = () => {
    router.push(ROUTES.AUDIOMETRY_TEST_REPORT(consultationId as string));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">📞</span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          End Consultation
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-8 leading-relaxed">
          You can ask the patient to end the call. Only the patient has the ability to 
          end the consultation session from their side.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleBackToTestSelection}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            Do Another Test
          </Button>
          <Button
            onClick={handleBackToReport}
            variant="outline"
            className="w-full"
          >
            Back to Report
          </Button>
        </div>
      </div>
    </div>
  );
} 