import { Button } from "@/components/ui/button";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Plus } from "lucide-react";

export default function Audiologists() {
  return (
    <DashboardBodyWrapper>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center ">
          <h1 className="text-2xl font-bold">All Audiologists</h1>
          <Button className="bg-primary-500 cursor-pointer text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add Audiologist
          </Button>
        </div>
      </div>
    </DashboardBodyWrapper>
  );
}
