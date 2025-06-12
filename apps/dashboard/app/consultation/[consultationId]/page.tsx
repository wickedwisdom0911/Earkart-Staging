"use client";
import { useParams } from "next/navigation";
import { VideoCall } from "./_components/video-call";

export default function ConsultationPage() {
  const { consultationId } = useParams();
  return (
    <div>
      <h1>Consultation Page: {consultationId}</h1>
      <VideoCall channel={consultationId as string} />
    </div>
  );
}
