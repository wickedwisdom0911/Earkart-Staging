import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import HandleCentreDialog from "./_components/handle-centre-dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function CentresPage() {
  return (
    <DashboardBodyWrapper
      pageTitle="Centres"
      button={
        <HandleCentreDialog
          trigger={
            <Button className="flex items-center gap-2 bg-primary-500 cursor-pointer text-white">
              <Plus className="w-4 h-4" /> Create Centre
            </Button>
          }
        />
      }
    >
      <div>CentresPage</div>
    </DashboardBodyWrapper>
  );
}
