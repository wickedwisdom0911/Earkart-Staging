"use client";
import { useParams } from "next/navigation";
import { useGetConsultation, getConsultationFromResponse } from "@/hooks/consultation/use-get-consultation";
import PatientDetails from "./_components/patient-details";

export default function ConsultationPage() {
  const { consultationId } = useParams();
  const {
    data: response,
    isLoading,
    error,
  } = useGetConsultation(consultationId as string);

  const consultationData = response ? getConsultationFromResponse(response) : null;

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!consultationData?.patient) return <div>No data</div>;

  return (
    <>
      <PatientDetails patient={consultationData.patient} consultation={consultationData} />
    </>
  );
}
