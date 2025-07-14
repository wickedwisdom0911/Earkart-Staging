"use client";

import React, { useState } from "react";
import { usePatientAlerts } from "@/providers/patient-alert-provider";
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
  Volume2,
  VolumeX,
  Clock,
  User,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const PatientAlertIndicator: React.FC = () => {
  const {
    alerts,
    activeAlertsCount,
    dismissAlert,
    dismissAllAlerts,
    isAudioEnabled,
    toggleAudio,
  } = usePatientAlerts();
  
  const [isOpen, setIsOpen] = useState(false);

  const activeAlerts = alerts.filter((alert) => alert.isActive);

  const handleAlertClick = (consultationId: string, alertId: string) => {
    window.open(`/consultation/${consultationId}`, "_blank");
    dismissAlert(alertId);
    setIsOpen(false);
  };

  if (activeAlertsCount === 0) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleAudio}
          className="p-2"
          title={isAudioEnabled ? "Disable alert sounds" : "Enable alert sounds"}
        >
          {isAudioEnabled ? (
            <Volume2 className="h-4 w-4 text-green-600" />
          ) : (
            <VolumeX className="h-4 w-4 text-gray-400" />
          )}
        </Button>
        <Bell className="h-5 w-5 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleAudio}
        className="p-2"
        title={isAudioEnabled ? "Disable alert sounds" : "Enable alert sounds"}
      >
        {isAudioEnabled ? (
          <Volume2 className="h-4 w-4 text-green-600" />
        ) : (
          <VolumeX className="h-4 w-4 text-gray-400" />
        )}
      </Button>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="relative p-2 hover:bg-red-50 transition-colors"
          >
            <Bell className="h-5 w-5 text-red-600 animate-pulse" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs animate-bounce"
            >
              {activeAlertsCount}
            </Badge>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-96 p-0 border-2 border-red-200"
          align="end"
          sideOffset={10}
        >
          <div className="bg-red-50 border-b border-red-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-900">
                  Patient Join Alerts
                </h3>
                <Badge variant="destructive" className="text-xs">
                  {activeAlertsCount}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissAllAlerts}
                  className="text-red-600 hover:text-red-700 text-xs h-7"
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
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="font-medium text-green-700 text-sm">
                        Patient Joined
                      </span>
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
                      <Button
                        size="sm"
                        onClick={() =>
                          handleAlertClick(alert.consultationId, alert.id)
                        }
                        className="h-7 text-xs bg-blue-600 hover:bg-blue-700"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Join Consultation
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissAlert(alert.id)}
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