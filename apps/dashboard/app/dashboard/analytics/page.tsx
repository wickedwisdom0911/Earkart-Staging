"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetUser } from "@/hooks/auth/use-get-user";
import { BarChart3, Users, Stethoscope } from "lucide-react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import ConsultationAnalytics from "./components/ConsultationAnalytics";
import AudiologistAnalytics from "./components/AudiologistAnalytics";
import { cn } from "@/lib/utils";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<string>("consultation");
  const { data: currentUser } = useGetUser();

  // Role-based access control
  const userRole = currentUser?.role;
  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  const isHeadAudiologist = userRole === "HEAD_AUDIOLOGIST";
  const isAudiologist = userRole === "AUDIOLOGIST";

  // Determine which tabs to show
  const showConsultationTab = isAdmin; // Only admins can see consultation analytics
  const showAudiologistTab = true; // All roles can see audiologist analytics

  // Auto-select audiologist tab if user can only see audiologist analytics
  useEffect(() => {
    if ((isAudiologist || isHeadAudiologist) && activeTab === "consultation") {
      setActiveTab("audiologist");
    }
  }, [isAudiologist, isHeadAudiologist, activeTab]);

  return (
    <DashboardBodyWrapper pageTitle="📊 Analytics Dashboard">
      <div className="space-y-6">
        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Analytics Access</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isAdmin ? "Full Access" : "Audiologist Access"}
              </div>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? "Admin & Super Admin" : isHeadAudiologist ? "Head Audiologist" : "Audiologist"}
              </p>
            </CardContent>
          </Card>

          {showConsultationTab && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Consultation Analytics</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Available</div>
                <p className="text-xs text-muted-foreground">
                  View consultation metrics and trends
                </p>
              </CardContent>
            </Card>
          )}

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Audiologist Analytics</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isAdmin || isHeadAudiologist ? "All Users" : "Personal"}
              </div>
              <p className="text-xs text-muted-foreground">
                {isAdmin || isHeadAudiologist ? "View all audiologist data" : "View your own data"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className={cn(
            "grid w-full",
            showConsultationTab ? "grid-cols-2" : "grid-cols-1"
          )}>
            {showConsultationTab && (
              <TabsTrigger value="consultation" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Consultation Analytics</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="audiologist" className="flex items-center space-x-2">
              <Stethoscope className="h-4 w-4" />
              <span>Audiologist Analytics</span>
            </TabsTrigger>
          </TabsList>

          {showConsultationTab && (
            <TabsContent value="consultation" className="space-y-4">
              <ConsultationAnalytics userRole={userRole} currentUser={currentUser} />
            </TabsContent>
          )}

          <TabsContent value="audiologist" className="space-y-4">
            <AudiologistAnalytics userRole={userRole} currentUser={currentUser} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardBodyWrapper>
  );
} 