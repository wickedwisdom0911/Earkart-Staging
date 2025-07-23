// app/dashboard/metrics/page.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Filter, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  BarChart3,
  Target,
  Activity,
  Users,
  ChevronDown
} from "lucide-react";

import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {

  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { DatetimePicker } from "@/components/DateTimePicker";
import { useGetMetrics } from "@/hooks/consultation/use-get-consultation-anayltics";
import { cn } from "@/lib/utils";
import { 
  MetricType, 
  AggregationType, 
  GroupByType, 
  TimeRangeType, 
  ConsultationStatus, 
  TestStatus, 
  PatientSoldStatus, 
  Gender 
} from "@/models/enums";

// Filter form schema
const filterSchema = z.object({
  metricType: z.nativeEnum(MetricType),
  aggregation: z.nativeEnum(AggregationType),
  groupBy: z.nativeEnum(GroupByType),
  timeRange: z.nativeEnum(TimeRangeType),
  useCustomDate: z.boolean(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  centreIds: z.array(z.string()),
  audiologistIds: z.array(z.string()),
  cityIds: z.array(z.string()),
  stateIds: z.array(z.string()),
  consultationStatuses: z.array(z.nativeEnum(ConsultationStatus)),
  testStatuses: z.array(z.nativeEnum(TestStatus)),
  patientSoldStatuses: z.array(z.nativeEnum(PatientSoldStatus)),
  genders: z.array(z.nativeEnum(Gender)),
  minAge: z.number().optional(),
  maxAge: z.number().optional(),
  limit: z.number(),
  offset: z.number(),
});

type FilterFormData = z.infer<typeof filterSchema>;

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
    <Card className="transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-l-4 border-l-purple-500">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn("p-2 rounded-lg", colorClasses[color])}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center space-x-1 text-sm font-medium",
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
            )}>
              <TrendIcon className="h-4 w-4" />
              <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center h-64 space-y-4">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-purple-400 rounded-full animate-spin animation-delay-150"></div>
    </div>
    <div className="text-center">
      <p className="text-lg font-medium text-gray-700">Loading metrics...</p>
      <p className="text-sm text-gray-500">Please wait while we fetch your data</p>
    </div>
  </div>
);

export default function MetricsPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const form = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      metricType: "consultations",
      aggregation: "count",
      groupBy: "day",
      timeRange: "daily",
      useCustomDate: false,
      startDate: new Date(new Date().getFullYear(), 0, 1),
      endDate: new Date(),
      centreIds: [],
      audiologistIds: [],
      cityIds: [],
      stateIds: [],
      consultationStatuses: [],
      testStatuses: [],
      patientSoldStatuses: [],
      genders: [],
      limit: 1000,
      offset: 0,
    },
  });

  const watchedValues = form.watch();

  const requestBody = {
    metricType: watchedValues.metricType,
    aggregation: watchedValues.aggregation,
    groupBy: watchedValues.groupBy,
    filters: {
      timeRange: watchedValues.timeRange,
      startDate: watchedValues.useCustomDate && watchedValues.startDate 
        ? watchedValues.startDate.toISOString() 
        : null,
      endDate: watchedValues.useCustomDate && watchedValues.endDate 
        ? watchedValues.endDate.toISOString() 
        : null,
      centreIds: watchedValues.centreIds || [],
      audiologistIds: watchedValues.audiologistIds || [],
      cityIds: watchedValues.cityIds || [],
      stateIds: watchedValues.stateIds || [],
      consultationStatuses: watchedValues.consultationStatuses || [],
      testStatuses: watchedValues.testStatuses || [],
      patientSoldStatuses: watchedValues.patientSoldStatuses || [],
      genders: watchedValues.genders || [],
      ...(watchedValues.minAge && { minAge: watchedValues.minAge }),
      ...(watchedValues.maxAge && { maxAge: watchedValues.maxAge }),
    },
    limit: watchedValues.limit,
    offset: watchedValues.offset,
  };

  const { data, isLoading, isError, refetch } = useGetMetrics(requestBody);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Implementation for exporting data
      console.log("Exporting data...", data);
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsExporting(false);
    }
  };

  const FilterButton = (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowFilters(!showFilters)}
        className="transition-all duration-200 hover:bg-purple-50 hover:border-purple-300"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
        <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform", showFilters && "rotate-180")} />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => refetch()}
        disabled={isLoading}
        className="transition-all duration-200 hover:bg-green-50 hover:border-green-300"
      >
        <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
        Refresh
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={isExporting}
        className="transition-all duration-200 hover:bg-purple-50 hover:border-purple-300"
      >
        <Download className={cn("h-4 w-4 mr-2", isExporting && "animate-bounce")} />
        Export
      </Button>
    </div>
  );

  return (
    <DashboardBodyWrapper pageTitle="📊 Metrics Dashboard" button={FilterButton}>
      <div className="space-y-6">
        {/* Enhanced Filters Section */}
        {showFilters && (
          <div className="transition-all duration-500 ease-in-out">
            <Card className="border-2 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Advanced Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...form}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* Enhanced form fields with better styling */}
                    <FormField
                      control={form.control}
                      name="metricType"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                            <BarChart3 className="h-4 w-4" />
                            <span>Metric Type</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors">
                                <SelectValue placeholder="Select metric type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="consultations">📋 Consultations</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aggregation"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                            <Target className="h-4 w-4" />
                            <span>Aggregation</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors">
                                <SelectValue placeholder="Select aggregation" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="count">🔢 Count</SelectItem>
                              <SelectItem value="sum">➕ Sum</SelectItem>
                              <SelectItem value="avg">📊 Average</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="groupBy"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                            <Calendar className="h-4 w-4" />
                            <span>Group By</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors">
                                <SelectValue placeholder="Select grouping" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="day">📅 Day</SelectItem>
                              <SelectItem value="week">📆 Week</SelectItem>
                              <SelectItem value="month">🗓️ Month</SelectItem>
                              <SelectItem value="year">📋 Year</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="timeRange"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                            <Activity className="h-4 w-4" />
                            <span>Time Range</span>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-11 border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 transition-colors">
                                <SelectValue placeholder="Select time range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">🌅 Daily</SelectItem>
                              <SelectItem value="weekly">🗓️ Weekly</SelectItem>
                              <SelectItem value="monthly">📅 Monthly</SelectItem>
                              <SelectItem value="yearly">📆 Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Enhanced Date Pickers */}
                    {/* Custom Date Toggle */}
                    <FormField
                      control={form.control}
                      name="useCustomDate"
                      render={({ field }) => (
                        <FormItem className="space-y-2 col-span-full">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id="useCustomDate"
                              checked={field.value}
                              onChange={field.onChange}
                              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                            />
                            <FormLabel 
                              htmlFor="useCustomDate" 
                              className="text-sm font-semibold text-gray-700 flex items-center space-x-2 cursor-pointer"
                            >
                              <Calendar className="h-4 w-4" />
                              <span>Use Custom Date Range</span>
                            </FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Date Fields - Only show when custom date is enabled */}
                    {form.watch("useCustomDate") && (
                      <>
                        <FormField
                          control={form.control}
                          name="startDate"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                              <FormLabel className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>Start Date</span>
                              </FormLabel>
                          <FormControl>
                            <DatetimePicker
                              value={field.value}
                              onChange={field.onChange}
                              format={[["months", "days", "years"], []]}
                                  className="w-full h-11 border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                              <FormLabel className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>End Date</span>
                              </FormLabel>
                          <FormControl>
                            <DatetimePicker
                              value={field.value}
                              onChange={field.onChange}
                              format={[["months", "days", "years"], []]}
                                  className="w-full h-11 border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 transition-colors"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                      </>
                    )}

                    {/* Rest of the form fields with similar styling improvements */}
                    {/* ... (continuing with other form fields with enhanced styling) */}
                  </div>
                </Form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {isLoading && <LoadingSpinner />}

        {/* Error State */}
        {isError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-red-800 font-medium">Error loading metrics</p>
                  <p className="text-red-600 text-sm">Please try refreshing the page or contact support if the issue persists.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Data Display */}
        {!isLoading && !isError && data && (
          <div className="space-y-6">
            {/* Beautiful Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <MetricCard
                title="Total"
                value={data.summary.total.toLocaleString()}
                icon={Users}
                color="blue"
              />
              <MetricCard
                title="Average"
                value={data.summary.average.toFixed(1)}
                icon={BarChart3}
                color="green"
              />
              <MetricCard
                title="Minimum"
                value={data.summary.min}
                icon={TrendingDown}
                color="red"
              />
              <MetricCard
                title="Maximum"
                value={data.summary.max}
                icon={TrendingUp}
                color="purple"
              />
              <MetricCard
                title="Growth Rate"
                value={`${data.summary.growthRate > 0 ? '+' : ''}${data.summary.growthRate.toFixed(1)}%`}
                change={data.summary.growthRate}
                trend={data.summary.growthRate > 0 ? 'up' : data.summary.growthRate < 0 ? 'down' : 'stable'}
                icon={Activity}
                color="orange"
              />
              <MetricCard
                title="Trend"
                value={data.summary.trend.toUpperCase()}
                icon={data.summary.trend === 'up' ? TrendingUp : data.summary.trend === 'down' ? TrendingDown : Minus}
                color="cyan"
              />
            </div>

            {/* Enhanced Chart */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Metrics Over Time</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={data.data}>
                    <defs>
                      <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8" 
                      strokeWidth={3}
                      fill="url(#colorUv)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Enhanced Data Table */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                <CardTitle>📊 Data Points</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change %</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {data.data.map((point, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{point.label}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {point.value.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                              (point.percentageChange ?? 0) >= 0 
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            )}>
                              {typeof point.percentageChange === 'number' ? (
                                `${point.percentageChange > 0 ? '+' : ''}${point.percentageChange.toFixed(1)}%`
                              ) : (
                                'N/A'
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Metadata */}
            <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-700">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Query Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Records</p>
                      <p className="text-lg font-semibold text-gray-900">{data.totalRecords}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Execution Time</p>
                      <p className="text-lg font-semibold text-gray-900">{data.executionTime}ms</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Generated At</p>
                      <p className="text-lg font-semibold text-gray-900">{new Date(data.generatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced No Data State */}
        {!isLoading && !isError && data && data.data.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No data found</h3>
                <p className="mt-2 text-sm text-gray-500">Try adjusting your filters or date range to see more results.</p>
              </div>
              </CardContent>
         </Card>
       )}
     </div>
   </DashboardBodyWrapper>
 );
}