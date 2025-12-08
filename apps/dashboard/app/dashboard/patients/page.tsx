// app/dashboard/patients/page.tsx  (or pages/dashboard/patients.tsx if you're using pages/)
// "use client" because we're using React Query hooks
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { PatientModelData } from "@/models/patient.model";
import { Search, Users, Phone, Mail, MapPin, Calendar, Plus, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useSearchPatientsApi } from "@/hooks/patients/use-search-patients-api";

export default function PatientsPage() {

  const [searchQuery, setSearchQuery] = useState("");
  
  const {
    data: patientsResponse,
    isLoading,
    error,
    refetch,
    isSearching,
    hasResults,
    totalResults,
    searchTerm,
  } = useSearchPatientsApi(searchQuery);

  const patients = patientsResponse?.data || [];

  console.log(patientsResponse, "check")

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Fixed Header Section - Won't scroll */}
      <div className="flex-shrink-0 p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
            <p className="text-gray-600 mt-1">
              Manage and view all patient information
            </p>
          </div>
        </div>

        {/* Search Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search patients by name, email, phone, or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
            >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
                </div>
            {isSearching && (
              <div className="mt-2 text-sm text-gray-600">
                {isLoading ? (
                  <span>Searching...</span>
                ) : (
                  <span>
                    {totalResults > 0 
                      ? `Found ${totalResults} patient${totalResults !== 1 ? 's' : ''} for "${searchTerm}"`
                      : `No patients found for "${searchTerm}"`
                    }
                </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{patients.length}</div>
              <p className="text-xs text-muted-foreground">
                {isSearching ? 'In search results' : 'Registered in system'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {patients.filter((p: PatientModelData) => p.status === "ACTIVE").length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {patients.filter((p: PatientModelData) => {
                  if (!p.createdAt) return false;
                  const created = new Date(p.createdAt);
                  const now = new Date();
                  return created.getMonth() === now.getMonth() && 
                         created.getFullYear() === now.getFullYear();
                }).length}
              </div>
              <p className="text-xs text-muted-foreground">
                New patients
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      

      {/* Scrollable Patients List - This will scroll */}
      <div className="flex-1 overflow-hidden px-6 pb-6">
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {isSearching ? `Search Results` : 'All Patients'}
              {isSearching && totalResults > 0 && (
                <Badge variant="secondary">{totalResults}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading patients...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">Error loading patients</div>
                <Button onClick={() => refetch()} variant="outline">
                  Try Again
                </Button>
              </div>
            ) : patients.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">
                  {isSearching ? `No patients found for "${searchTerm}"` : 'No patients found'}
                </h3>
                <p className="text-gray-400">
                  {isSearching 
                    ? 'Try adjusting your search terms or clear the search to see all patients'
                    : 'No patients available'
                  }
                </p>
                {isSearching && (
                  <Button 
                    variant="outline" 
                    onClick={clearSearch}
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {patients.map((patient: PatientModelData) => (
                  <Card key={patient.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        {/* Patient Name & Status */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {patient.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              ID: {patient.code || patient.id}
                            </p>
                          </div>
                          <Badge 
                            variant={patient.status === "ACTIVE" ? "default" : "secondary"}
                            className={patient.status === "ACTIVE" ? "bg-green-100 text-green-800" : ""}
                          >
                            {patient.status || "ACTIVE"}
                          </Badge>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{patient.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4" />
                            <span>{patient.contactNumber}</span>
                          </div>
                          {patient.city?.name && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span className="truncate">{patient.city.name}</span>
                            </div>
                          )}
                        </div>

                        {/* Patient Details */}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Gender:</span>
                            <span className="ml-1 font-medium">{patient.gender}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">DOB:</span>
                            <span className="ml-1 font-medium">
                              {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>

                        
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
