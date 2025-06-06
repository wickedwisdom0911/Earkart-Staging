"use client";
import TwilioVideoRoom from "@/components/twilioVideoRoom";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { useParams } from "next/navigation";

export default function ConsultationPage() {
  const { consultationId } = useParams();
  const { data: user } = useGetUser();
  return (
    <div>
      <TwilioVideoRoom
        identity={user?.id || ""}
        roomName={consultationId?.toString() || ""}
      />
    </div>
  );
}
