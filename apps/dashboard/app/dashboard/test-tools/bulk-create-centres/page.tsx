"use client";

import { useState } from "react";
import DashboardBodyWrapper from "@/components/ui/dashboard-body-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import CountrySelector from "@/components/ui/selector/country-selector";
import StateSelector from "@/components/ui/selector/state-selector";
import DistrictSelector from "@/components/ui/selector/district-selector";
import CitySelector from "@/components/ui/selector/city-selector";
import { createCentre } from "@/actions/centre/create-centre";

export default function BulkCreateCentresPage() {
  const [count, setCount] = useState(50); // Default 50 for pagination testing
  const [isCreating, setIsCreating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Location state
  const [countryId, setCountryId] = useState<string | null>(null);
  const [stateId, setStateId] = useState<string | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Handle location changes
  const handleCountryChange = (newCountryId: string | null) => {
    setCountryId(newCountryId);
    setStateId(null);
    setDistrictId(null);
    setCityId(null);
  };

  const handleStateChange = (newStateId: string | null) => {
    setStateId(newStateId);
    setDistrictId(null);
    setCityId(null);
  };

  const handleDistrictChange = (newDistrictId: string | null) => {
    setDistrictId(newDistrictId);
    setCityId(null);
  };

  const generateCentreData = (index: number) => {
    // Generate DOB (random age between 30-50 years)
    const today = new Date();
    const age = 30 + Math.floor(Math.random() * 20); // 30-50 years old
    const dob = new Date(today.getFullYear() - age, 0, 1).toISOString();

    // Generate working time ISO strings (today's date with specific times)
    const todayDateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const workingTimeStart = `${todayDateStr}T09:00:00.000Z`;
    const workingTimeEnd = `${todayDateStr}T18:00:00.000Z`;
    const breakTimeStart = `${todayDateStr}T13:00:00.000Z`;
    const breakTimeEnd = `${todayDateStr}T14:00:00.000Z`;

    return {
      user: {
        name: `Test Centre ${index.toString().padStart(3, '0')}`,
        email: `testcentre${index.toString().padStart(3, '0')}_${Date.now()}@example.com`,
        password: "Test@123",
        role: "CENTRE" as const,
        gender: "MALE" as const,
        dob: dob,
        status: "ACTIVE" as const,
      },
      centre: {
        address: `${index} Test Street, Test City, Test State`,
        cityId: cityId!,
        pincode: `${400000 + index}`,
        contactNumber: `98765${index.toString().padStart(5, '0')}`,
        entName: `ENT Specialist ${index}`,
        assistantName: `Assistant ${index}`,
        assistantContactNumber: `87654${index.toString().padStart(5, '0')}`,
        isOurAssistant: index % 2 === 0,
        paymentCycle: "MONTHLY" as const,
        workingTimeStart: workingTimeStart,
        workingTimeEnd: workingTimeEnd,
        breakTimeStart: breakTimeStart,
        breakTimeEnd: breakTimeEnd,
        workingDays: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
        centrePricing: [
          {
            name: "Basic Consultation",
            price: 500,
            description: "Standard consultation",
            status: "ACTIVE" as const,
          },
        ],
      },
    };
  };

  const handleBulkCreate = async () => {
    if (!cityId) {
      toast.error("Please select all location fields (Country, State, District, City)");
      return;
    }

    setIsCreating(true);
    setProgress(0);
    setLogs([]);
    addLog(`Starting bulk creation of ${count} centres...`);

    let successCount = 0;
    let failCount = 0;

    for (let i = 1; i <= count; i++) {
      try {
        const centreData = generateCentreData(i);
        addLog(`Creating centre ${i}/${count}...`);

        const result = await createCentre(centreData as any);

        if (result.success) {
          successCount++;
          addLog(`✅ Centre ${i} created: ${result.data?.code}`);
        } else {
          failCount++;
          addLog(`❌ Centre ${i} failed: ${result.message}`);
        }
      } catch (error: any) {
        failCount++;
        addLog(`❌ Centre ${i} error: ${error.message}`);
      }

      setProgress(Math.round((i / count) * 100));

      // Wait 500ms between requests to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setIsCreating(false);
    addLog(`\n🎉 Completed! Success: ${successCount}, Failed: ${failCount}`);
    
    // Invalidate centres cache to refresh the list
    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: ["centres"] });
      toast.success(`Created ${successCount} centres successfully!`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} centres failed to create`);
    }
  };

  return (
    <DashboardBodyWrapper>
      <div className="p-6 max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary-600" />
              Bulk Create Centres (Test Tool)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Configuration */}
            <div className="space-y-4">
              {/* Location Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Country (Required)</Label>
                  <CountrySelector
                    value={countryId}
                    onChange={handleCountryChange}
                    initialValue={countryId}
                  />
                </div>

                <div>
                  <Label>State (Required)</Label>
                  <StateSelector
                    value={stateId}
                    onChange={handleStateChange}
                    initialValue={stateId}
                    countryId={countryId || ""}
                  />
                </div>

                <div>
                  <Label>District (Required)</Label>
                  <DistrictSelector
                    value={districtId}
                    onChange={handleDistrictChange}
                    initialValue={districtId}
                    stateId={stateId || ""}
                  />
                </div>

                <div>
                  <Label>City (Required)</Label>
                  <CitySelector
                    value={cityId}
                    onChange={setCityId}
                    initialValue={cityId}
                    districtId={districtId || ""}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="count">Number of Centres</Label>
                <Input
                  id="count"
                  type="number"
                  min="1"
                  max="500"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                  disabled={isCreating}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max 500 centres per batch. Recommended: 50-100 for pagination testing
                </p>
                {/* Quick select buttons */}
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCount(25)}
                    disabled={isCreating}
                  >
                    25
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCount(50)}
                    disabled={isCreating}
                  >
                    50
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCount(100)}
                    disabled={isCreating}
                  >
                    100
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCount(200)}
                    disabled={isCreating}
                  >
                    200
                  </Button>
                </div>
              </div>
            </div>

            {/* Progress */}
            {isCreating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-semibold">{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Button */}
            <Button
              onClick={handleBulkCreate}
              disabled={isCreating || !cityId}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Centres... ({progress}%)
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  Create {count} Centres
                </>
              )}
            </Button>

            {/* Logs */}
            {logs.length > 0 && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="font-semibold mb-2">Logs</h3>
                <div className="space-y-1 max-h-96 overflow-y-auto font-mono text-xs">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className={`${
                        log.includes("✅")
                          ? "text-green-600"
                          : log.includes("❌")
                          ? "text-red-600"
                          : log.includes("🎉")
                          ? "text-blue-600 font-bold"
                          : "text-gray-700"
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <strong>ℹ️ Info:</strong> This tool creates test centres for pagination testing.
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Select Country, State, District, and City before creating</li>
                <li>Centres will be created with sequential names (Test Centre 1, Test Centre 2, etc.)</li>
                <li>Recommended: Create 50-100 centres to properly test pagination (12 per page grid, 10 per page table)</li>
                <li>Progress and logs are shown in real-time</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardBodyWrapper>
  );
}

