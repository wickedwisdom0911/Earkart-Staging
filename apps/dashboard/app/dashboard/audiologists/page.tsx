import { Button } from "@/components/ui/button";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Plus } from "lucide-react";
import HandleAudiologistDialog from "./_components/handle-audiologist-dialog";

export default function Audiologists() {
  return (
    <DashboardBodyWrapper
      pageTitle="All Audiologists"
      button={
        <HandleAudiologistDialog
          trigger={
            <Button className="bg-primary-500 cursor-pointer text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add Audiologist
            </Button>
          }
        />
      }
    >
      <div>soons</div>
    </DashboardBodyWrapper>
  );
}
