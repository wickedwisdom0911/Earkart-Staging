"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  RefreshCw,
  Calendar,
  User,
  Stethoscope,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useGetIndividualAudiologistAnalytics from "@/hooks/audiologist/use-get-individual-audiologist-analytics";
import useGetAudiologist from "@/hooks/audiologist/use-get-audiologist";
import { useGetConsultationsByAudiologist } from "@/hooks/consultations/use-get-consultations-by-audiologist";

const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend, 
  color = "blue" 
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: any;
  trend?: 'up' | 'down' | 'stable';
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'cyan';
}) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    red: "bg-red-50 border-red-200 text-red-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    orange: "bg-orange-50 border-orange-200 text-orange-600",
    cyan: "bg-cyan-50 border-cyan-200 text-cyan-600",
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <Card className="transition-all duration-300 hover:shadow-md hover:scale-[1.01] border-l-4 border-l-purple-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn("p-2 rounded-lg", colorClasses[color])}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-600">{title}</p>
              <p className="text-xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center space-x-1 text-xs font-medium",
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
            )}>
              <TrendIcon className="h-3 w-3" />
              <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
            </div>
          )}
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
      <p className="text-lg font-medium text-gray-700">Loading analytics...</p>
      <p className="text-sm text-gray-500">Fetching audiologist performance data</p>
    </div>
  </div>
);

export default function AudiologistAnalyticsPage() {
  const { audiologistId } = useParams();
  const [timeRange, setTimeRange] = useState<"daily" | "weekly" | "monthly" | "yearly">("monthly");

  const { 
    data: analyticsData, 
    isLoading: isAnalyticsLoading, 
    isError: isAnalyticsError, 
    refetch: refetchAnalytics 
  } = useGetIndividualAudiologistAnalytics(audiologistId as string, timeRange);
  
  const { 
    data: audiologistData, 
    isLoading: isAudiologistLoading 
  } = useGetAudiologist(audiologistId as string);

  const { 
    data: consultationsData, 
    isLoading: isConsultationsLoading 
  } = useGetConsultationsByAudiologist(audiologistId as string);

  const audiologist = audiologistData?.data;
  const isLoading = isAnalyticsLoading || isAudiologistLoading;

  // Debug: Log analytics data to see its structure
  if (analyticsData) {
    console.log('Analytics Data:', analyticsData);
  }

  const RefreshButton = (
    <div className="flex items-center gap-2">
      <Select value={timeRange} onValueChange={(value: "daily" | "weekly" | "monthly" | "yearly") => setTimeRange(value)}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="yearly">Yearly</SelectItem>
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="sm"
        onClick={() => refetchAnalytics()}
        disabled={isAnalyticsLoading}
        className="text-sm"
      >
        <RefreshCw className={cn("h-4 w-4 mr-2", isAnalyticsLoading && "animate-spin")} />
        Refresh
      </Button>
    </div>
  );

  return (
    <DashboardBodyWrapper 
      pageTitle={`📊 ${audiologist?.user?.name || 'Audiologist'} Analytics`}
      button={RefreshButton}
    >
      <div className="space-y-6">
        {/* Audiologist Info Card */}
        {audiologist && (
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                  <User className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{audiologist.user?.name}</h3>
                  <p className="text-gray-600 text-sm">{audiologist.user?.email}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>RCI: {audiologist.rciNumber}</span>
                    <span>Contact: {audiologist.contactNumber}</span>
                    <span className={cn(
                      "px-2 py-1 rounded-full font-medium",
                      audiologist.isInHouse ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {audiologist.isInHouse ? "In-House" : "External"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && <LoadingSpinner />}

        {/* Error State */}
        {isAnalyticsError && (
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="pt-8 pb-8">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-4 text-lg font-medium text-red-900">Error loading analytics</h3>
                <p className="mt-2 text-sm text-red-600">There was an error fetching analytics data. Please try again.</p>
                <Button 
                  onClick={() => refetchAnalytics()} 
                  className="mt-4 bg-red-600 hover:bg-red-700 text-white text-sm"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analytics Data */}
        {!isLoading && !isAnalyticsError && analyticsData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Total Sessions"
                value={typeof analyticsData.summary?.total === 'number' ? analyticsData.summary.total.toLocaleString() : '0'}
                icon={Stethoscope}
                color="purple"
              />
              <MetricCard
                title="Average Performance"
                value={typeof analyticsData.summary?.average === 'number' ? analyticsData.summary.average.toFixed(1) : '0.0'}
                icon={BarChart3}
                color="green"
              />
              <MetricCard
                title="Growth Rate"
                value={typeof analyticsData.summary?.growthRate === 'number' 
                  ? `${analyticsData.summary.growthRate > 0 ? '+' : ''}${analyticsData.summary.growthRate.toFixed(1)}%`
                  : '0%'}
                change={typeof analyticsData.summary?.growthRate === 'number' ? analyticsData.summary.growthRate : 0}
                trend={typeof analyticsData.summary?.growthRate === 'number' 
                  ? (analyticsData.summary.growthRate > 0 ? 'up' : analyticsData.summary.growthRate < 0 ? 'down' : 'stable')
                  : 'stable'}
                icon={Activity}
                color="orange"
              />
              <MetricCard
                title="Trend"
                value={typeof analyticsData.summary?.trend === 'string' ? analyticsData.summary.trend.toUpperCase() : 'STABLE'}
                icon={typeof analyticsData.summary?.trend === 'string' 
                  ? (analyticsData.summary.trend === 'up' ? TrendingUp : analyticsData.summary.trend === 'down' ? TrendingDown : Minus)
                  : Minus}
                color="cyan"
              />
            </div>

            {/* Performance Chart */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Performance Over Time ({timeRange || 'monthly'})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {Array.isArray(analyticsData.data) && analyticsData.data.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={analyticsData.data}>
                      <defs>
                        <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
                      <XAxis 
                        dataKey="label" 
                        stroke="#6b7280"
                      />
                      <YAxis 
                        stroke="#6b7280"
                      />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        fill="url(#colorPerformance)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-96 text-gray-500">
                    <p>No chart data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Analytics Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Analytics Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-gray-700">Time Range:</p>
                    <p className="text-gray-600 capitalize">
                      {typeof analyticsData.timeRange === 'string' 
                        ? analyticsData.timeRange 
                        : typeof analyticsData.timeRange === 'object' && analyticsData.timeRange?.preset
                        ? analyticsData.timeRange.preset
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Total Records:</p>
                    <p className="text-gray-600">
                      {typeof analyticsData.totalRecords === 'number' 
                        ? analyticsData.totalRecords.toLocaleString() 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Data Generated:</p>
                    <p className="text-gray-600">
                      {analyticsData.generatedAt 
                        ? new Date(analyticsData.generatedAt).toLocaleString() 
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Execution Time:</p>
                    <p className="text-gray-600">
                      {typeof analyticsData.executionTime === 'number' 
                        ? `${analyticsData.executionTime}ms` 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consultations Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Stethoscope className="h-5 w-5" />
                  <span>Recent Consultations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isConsultationsLoading ? (
                  <div className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading consultations...</p>
                  </div>
                ) : consultationsData?.success && consultationsData.data.length > 0 ? (
                  <div className="space-y-3">
                    {consultationsData.data.map((consultation) => (
                      <div key={consultation.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span className="font-medium text-gray-900">Consultation #{consultation.id.slice(0, 8)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              consultation.status === 'COMPLETED' ? "bg-green-100 text-green-700" :
                              consultation.status === 'IN_PROGRESS' ? "bg-blue-100 text-blue-700" :
                              consultation.status === 'PENDING' ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-700"
                            )}>
                              {consultation.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Patient:</span> {consultation.patientId.slice(0, 8)}...
                          </div>
                          <div>
                            <span className="font-medium">Centre:</span> {consultation.centreId.slice(0, 8)}...
                          </div>
                          <div>
                            <span className="font-medium">Patient Status:</span> 
                            <span className={cn(
                              "ml-1 px-1 py-0.5 rounded text-xs",
                              consultation.patientStatus === 'CONFIRMED' ? "bg-green-100 text-green-600" :
                              consultation.patientStatus === 'REQUESTED' ? "bg-yellow-100 text-yellow-600" :
                              "bg-red-100 text-red-600"
                            )}>
                              {consultation.patientStatus}
                            </span>
                          </div>
                                                     <div>
                             <span className="font-medium">Audiologist Status:</span>
                             <span className={cn(
                               "ml-1 px-1 py-0.5 rounded text-xs",
                               consultation.audiologistStatus === 'ACCEPTED' ? "bg-green-100 text-green-600" :
                               consultation.audiologistStatus === 'JOINED' ? "bg-blue-100 text-blue-600" :
                               consultation.audiologistStatus === 'PENDING' ? "bg-yellow-100 text-yellow-600" :
                               "bg-red-100 text-red-600"
                             )}>
                               {consultation.audiologistStatus}
                             </span>
                           </div>
                        </div>
                        {consultation.notes && (
                          <div className="mt-2 text-sm text-gray-600">
                            <span className="font-medium">Notes:</span> {consultation.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Stethoscope className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2">No consultations found for this audiologist</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardBodyWrapper>
  );
} 