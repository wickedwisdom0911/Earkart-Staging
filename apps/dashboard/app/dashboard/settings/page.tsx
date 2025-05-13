import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import ListTile from "@/components/ui/ListTile";
import { ROUTES } from "@/lib/routes";
import { GlobeIcon, MapPinIcon, Tablet } from "lucide-react";
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
    </DashboardBodyWrapper>
  );
}
