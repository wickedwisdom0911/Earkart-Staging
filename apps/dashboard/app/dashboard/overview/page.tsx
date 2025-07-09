"use client";

import { useDashboardSummary, useHealthStatus } from "@/hooks/analytics/use-dashboard-summary";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  UserCheck, 
  Building2, 
  Activity, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Zap,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Globe,
  MessageSquare,
  Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";

const MetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  trend,
  color = "blue",
  subtitle,
  className = ""
}: {
  title: string;
  value: string | number;
  icon: any;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'cyan';
  subtitle?: string;
  className?: string;
}) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    red: "bg-red-50 border-red-200 text-red-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    orange: "bg-orange-50 border-orange-200 text-orange-600",
    cyan: "bg-cyan-50 border-cyan-200 text-cyan-600",
  };

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (title.toLowerCase().includes('revenue')) {
        return `$${val.toLocaleString()}`;
      }
      if (title.toLowerCase().includes('rate') || title.toLowerCase().includes('utilization')) {
        return `${val}%`;
      }
      if (title.toLowerCase().includes('duration')) {
        return `${val} min`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <Card className={cn("transition-all duration-300 hover:shadow-md hover:scale-[1.01] border-l-4 border-l-purple-500", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn("p-2 rounded-lg", colorClasses[color])}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">{title}</p>
              <p className="text-xl font-bold text-gray-900">{formatValue(value)}</p>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center space-x-1 text-xs font-medium px-2 py-1 rounded-full",
              trend === 'up' ? 'text-green-700 bg-green-100' : 
              trend === 'down' ? 'text-red-700 bg-red-100' : 
              'text-gray-700 bg-gray-100'
            )}>
              <TrendingUp className={cn(
                "h-3 w-3",
                trend === 'down' && "rotate-180"
              )} />
              <span>{change > 0 ? '+' : ''}{change}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const ServiceCard = ({ 
  name, 
  status, 
  responseTime, 
  uptime, 
  icon: Icon
}: {
  name: string;
  status: string;
  responseTime: number;
  uptime: number;
  icon: any;
}) => {
  const isHealthy = status === 'healthy';
  
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    return `${hours}h`;
  };

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-md border-l-4",
      isHealthy ? "border-l-green-500" : "border-l-red-500"
    )}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={cn(
              "p-1.5 rounded-lg",
              isHealthy ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">{name}</h4>
              <div className="flex items-center space-x-1">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isHealthy ? "bg-green-500" : "bg-red-500"
                )} />
                <span className={cn(
                  "text-xs font-medium",
                  isHealthy ? "text-green-700" : "text-red-700"
                )}>
                  {status}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Response:</span>
            <span className="font-medium">{responseTime}ms</span>
          </div>
          <div className="flex justify-between">
            <span>Uptime:</span>
            <span className="font-medium">{formatUptime(uptime)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-48 space-y-4">
    <div className="relative">
      <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-10 h-10 border-4 border-transparent border-r-purple-400 rounded-full animate-spin animation-delay-150"></div>
    </div>
    <div className="text-center">
      <p className="text-lg font-medium text-gray-700">Loading dashboard...</p>
      <p className="text-sm text-gray-500">Fetching real-time data</p>
    </div>
  </div>
);

export default function DashboardOverviewPage() {
  const { data: dashboardData, isLoading: isDashboardLoading, isError: isDashboardError, refetch: refetchDashboard } = useDashboardSummary();
  const { data: healthData, isLoading: isHealthLoading, isError: isHealthError, refetch: refetchHealth } = useHealthStatus();

  const isLoading = isDashboardLoading || isHealthLoading;
  const isError = isDashboardError || isHealthError;

  const handleRefresh = () => {
    refetchDashboard();
    refetchHealth();
  };

  const RefreshButton = (
    <button
      onClick={handleRefresh}
      disabled={isLoading}
      className="flex items-center space-x-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
    >
      <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
      <span>Refresh</span>
    </button>
  );

  return (
    <DashboardBodyWrapper pageTitle="📊 Dashboard Overview" button={RefreshButton}>
      <div className="space-y-6">
        {/* Loading State */}
        {isLoading && <LoadingSpinner />}

        {/* Error State */}
        {isError && (
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-4 text-lg font-medium text-red-900">Error loading dashboard</h3>
                <p className="mt-2 text-sm text-red-600">There was an error fetching dashboard data. Please try again.</p>
                <button 
                  onClick={handleRefresh} 
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Try Again
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Data */}
        {!isLoading && !isError && dashboardData && (
          <>
            {/* Key Metrics - Simplified Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Consultations"
                value={dashboardData.dashboard.totalConsultations}
                icon={Users}
                color="blue"
              />
              <MetricCard
                title="Active Patients"
                value={dashboardData.dashboard.activePatients}
                icon={UserCheck}
                color="green"
              />
              <MetricCard
                title="Active Audiologists"
                value={dashboardData.dashboard.activeAudiologists}
                icon={Activity}
                color="purple"
              />
              <MetricCard
                title="Revenue This Month"
                value={dashboardData.dashboard.revenueThisMonth}
                icon={DollarSign}
                color="orange"
              />
            </div>

            {/* Performance & Real-Time Combined */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                title="Success Rate"
                value={dashboardData.dashboard.successRate}
                icon={TrendingUp}
                color="green"
              />
              <MetricCard
                title="Device Utilization"
                value={dashboardData.dashboard.deviceUtilization}
                icon={Zap}
                color="cyan"
              />
              <MetricCard
                title="Active Consultations"
                value={dashboardData.realTime.activeConsultations}
                icon={Activity}
                color="purple"
                subtitle="Currently running"
              />
            </div>
          </>
        )}

        {/* System Health Status - Simplified */}
        {!isLoading && !isError && healthData && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">🔧 System Health</h2>
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-2.5 h-2.5 rounded-full",
                  healthData.summary.healthy === healthData.summary.total ? "bg-green-500" : "bg-red-500"
                )} />
                <span className="text-sm font-medium text-gray-700">
                  {healthData.summary.healthy}/{healthData.summary.total} Services Healthy
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ServiceCard
                name="API Gateway"
                status={healthData.services.gateway.details.status}
                responseTime={healthData.services.gateway.responseTime}
                uptime={healthData.services.gateway.details.uptime}
                icon={Globe}
              />
              <ServiceCard
                name="User Service"
                status={healthData.services.user.details.status}
                responseTime={healthData.services.user.responseTime}
                uptime={healthData.services.user.details.uptime}
                icon={Users}
              />
              <ServiceCard
                name="Communication"
                status={healthData.services.communication.details.status}
                responseTime={healthData.services.communication.responseTime}
                uptime={healthData.services.communication.details.uptime}
                icon={MessageSquare}
              />
              <ServiceCard
                name="MDM Service"
                status={healthData.services.mdm.details.status}
                responseTime={healthData.services.mdm.responseTime}
                uptime={healthData.services.mdm.details.uptime}
                icon={Smartphone}
              />
            </div>
          </div>
        )}

        {/* Data Timestamp - More Compact */}
        {!isLoading && !isError && dashboardData && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg border">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Last updated: {new Date(dashboardData.generatedAt).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </DashboardBodyWrapper>
  );
} 