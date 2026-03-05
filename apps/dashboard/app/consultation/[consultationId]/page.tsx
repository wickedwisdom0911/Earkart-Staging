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

  if (isLoading) return <div className="flex items-center justify-center h-full text-gray-500 text-sm">Loading...</div>;
  if (error) return <div className="flex items-center justify-center h-full text-red-500 text-sm">Error: {error.message}</div>;
  if (!consultationData?.patient) return <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>;

  return (
    <PatientDetails patient={consultationData.patient} consultation={consultationData} />
  );
}
