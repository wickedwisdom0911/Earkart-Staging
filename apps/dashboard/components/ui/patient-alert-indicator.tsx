"use client";

import React, { useState } from "react";
import { usePatientAlertsOptional } from "@/providers/patient-alert-provider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  BellOff,
  X,
  ExternalLink,
  Clock,
  User,
  Building2,
  AlertTriangle,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const PatientAlertIndicator: React.FC = () => {
  const context = usePatientAlertsOptional();
  const [isOpen, setIsOpen] = useState(false);

  if (!context) return null;

  const {
    alerts,
    activeAlertsCount,
    dismissAlert,
    dismissAllAlerts,
  } = context;

  const activeAlerts = alerts.filter((alert) => alert.isActive);

  const handleAlertClick = (consultationId: string, alertId: string) => {
    console.log(`Opening consultation ${consultationId} and dismissing alert ${alertId}`);
    window.open(`/consultation/${consultationId}`, "_blank");
    dismissAlert(alertId);
    setIsOpen(false);
  };

  const handleDismiss = (alertId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent any parent handlers
    console.log(`User dismissed alert: ${alertId}`);
    dismissAlert(alertId);
  };

  const handleDismissAll = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent any parent handlers
    console.log("User dismissed all alerts");
    dismissAllAlerts();
  };

  const handlePopoverOpen = (open: boolean) => {
    setIsOpen(open);
  };

  const getReasonIcon = (reason: "NO_AUDIOLOGIST" | "PENDING_STATUS") => {
    return reason === "NO_AUDIOLOGIST" ? (
      <UserX className="h-4 w-4 text-orange-600" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-yellow-600" />
    );
  };

  const getReasonText = (reason: "NO_AUDIOLOGIST" | "PENDING_STATUS") => {
    return reason === "NO_AUDIOLOGIST" ? "No Audiologist Assigned" : "Consultation Pending";
  };

  const getReasonColor = (reason: "NO_AUDIOLOGIST" | "PENDING_STATUS") => {
    return reason === "NO_AUDIOLOGIST" ? "text-orange-700" : "text-yellow-700";
  };

  if (activeAlertsCount === 0) {
    return (
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={handlePopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2 hover:bg-orange-50 transition-colors"
          >
            <Bell className="h-5 w-5 text-orange-600 animate-pulse" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs bg-orange-600 border-2 border-white shadow-md"
            >
              {activeAlertsCount}
            </Badge>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-96 p-0 border-2 border-orange-200"
          align="end"
          sideOffset={10}
        >
          <div className="bg-orange-50 border-b border-orange-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-orange-900">
                  Consultation Alerts
                </h3>
                <Badge variant="destructive" className="text-xs bg-orange-600">
                  {activeAlertsCount}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismissAll}
                  className="text-orange-600 hover:text-orange-700 text-xs h-7"
                >
                  Clear All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="border-b border-gray-100 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                      <span className={`font-medium text-sm ${getReasonColor(alert.reason)}`}>
                        {getReasonText(alert.reason)}
                      </span>
                      {getReasonIcon(alert.reason)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-900">
                          {alert.patientName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="h-4 w-4" />
                        <span>{alert.centreName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(alert.timestamp, "MMM dd, hh:mm a")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      {/* <Button
                        size="sm"
                        onClick={() =>
                          handleAlertClick(alert.consultationId, alert.id)
                        }
                        className="h-7 text-xs bg-orange-600 hover:bg-orange-700"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Consultation
                      </Button> */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDismiss(alert.id, e)}
                        className="h-7 text-xs text-gray-600 hover:text-gray-800"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {activeAlerts.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No active alerts</p>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}; 