import { Button } from "@/components/ui/button";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { PlusIcon } from "lucide-react";

export default function LanguagesPage() {
  return (
    <DashboardBodyWrapper
      pageTitle="Languages"
      button={
        <Button className="bg-primary-500 cursor-pointer text-white">
          <PlusIcon />
          Add Language
        </Button>
      }
    >
      <div>LanguagesPage</div>
    </DashboardBodyWrapper>
  );
}
