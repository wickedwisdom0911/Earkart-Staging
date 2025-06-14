"use client";
import { useParams } from "next/navigation";
import { VideoCall } from "./_components/video-call";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { useGetConsultation } from "@/hooks/consultation/use-get-consultation";
import { ConsultationModelData } from "@/models/consultation.model";
import PatientDetails from "./_components/patient-details";

export default function ConsultationPage() {
  const { consultationId } = useParams();
  const {
    data: consultation,
    isLoading,
    error,
  } = useGetConsultation(consultationId as string);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!consultation?.data) return <div>No data</div>;

  const consultationData = consultation.data as ConsultationModelData;
  console.log(consultationData);

  return (
    <DashboardBodyWrapper
      pageTitle={`Consultation with ${consultationData.centre?.user?.name}`}
    >
      <div className="flex border border-red-400 items-center justify-start overflow-hidden">
        <VideoCall channel={consultationId as string} />
        {consultationData.patient && (
          <PatientDetails patient={consultationData.patient} />
        )}
      </div>
    </DashboardBodyWrapper>
  );
}
