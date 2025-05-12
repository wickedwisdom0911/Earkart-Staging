import { Button } from "@/components/ui/button";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { PlusIcon } from "lucide-react";

export default function LocationsPage() {
  return (
    <DashboardBodyWrapper
      pageTitle="Locations"
      button={
        <Button className="bg-primary-500 cursor-pointer text-white">
          <PlusIcon />
          Add Country
        </Button>
      }
    >
      <div>LocationsPage</div>
    </DashboardBodyWrapper>
  );
}
