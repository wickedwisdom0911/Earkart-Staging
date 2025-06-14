"use client";

import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter, useParams } from "next/navigation";

const testOptions = [
  {
    id: "pure-tone",
    name: "Pure Tone Audiometry",
    description: "Test hearing sensitivity across different frequencies",
  },
  {
    id: "speech",
    name: "Speech Audiometry",
    description: "Evaluate speech understanding abilities",
  },
  {
    id: "tympanometry",
    name: "Tympanometry",
    description: "Assess middle ear function and mobility",
  },
  {
    id: "otoacoustic",
    name: "Otoacoustic Emissions",
    description: "Measure inner ear response to sound",
  },
  {
    id: "video-otoscopy",
    name: "Video Otoscopy",
    description: "Visualize the middle ear and tympanic membrane",
  },
];

export default function TestSelectionPage() {
  const router = useRouter();
  const params = useParams();

  const handleTestClick = (testId: string) => {
    router.push(`/consultation/${params.consultationId}/test/${testId}`);
  };

  return (
    <DashboardBodyWrapper
      className="border-none justify-center"
      pageTitle="Test Selection"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testOptions.map((test) => (
          <Card
            key={test.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleTestClick(test.id)}
          >
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-2">{test.name}</h2>
              <p className="text-gray-600">{test.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardBodyWrapper>
  );
}
