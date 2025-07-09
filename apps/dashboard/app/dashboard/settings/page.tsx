import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import ListTile from "@/components/ui/ListTile";
import { ROUTES } from "@/lib/routes";
import { ClipboardList, GlobeIcon, MapPinIcon, Tablet } from "lucide-react";
export default function SettingsPage() {
  return (
    <DashboardBodyWrapper pageTitle="Settings">
      <ListTile
        leadingIcon={<MapPinIcon className="stroke-1" />}
        title="Locations"
        path={ROUTES.LOCATIONS}
      />
      <ListTile
        leadingIcon={<GlobeIcon className="stroke-1" />}
        title="Languages"
        path={ROUTES.LANGUAGES}
      />
      <ListTile
        leadingIcon={<Tablet className="stroke-1" />}
        title="Devices"
        path={ROUTES.DEVICES}
      />
       <ListTile
        leadingIcon={<ClipboardList className="stroke-1" />}
        title="Questionnaire"
        path={ROUTES.QUESTIONNAIRE}
      />
   
    </DashboardBodyWrapper>
  );
}
