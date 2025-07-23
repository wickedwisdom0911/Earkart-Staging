"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAllPatients } from "@/actions/patients/get-all-patients";
import { PatientModelData } from "@/models/patient.model";
import { useDebounce } from "@/utils/hooks/useDebounce";

export function useSearchPatients(searchQuery: string) {
  const debouncedSearchQuery = useDebounce(searchQuery.trim().toLowerCase(), 300);

  // Fetch all patients
  const {
    data: allPatientsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["patients", "all"],
    queryFn: getAllPatients,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter patients based on search query
  const filteredPatients = useMemo(() => {
    if (!allPatientsResponse?.data || !debouncedSearchQuery) {
      return allPatientsResponse?.data || [];
    }

    return allPatientsResponse.data.filter((patient: PatientModelData) => {
      const searchLower = debouncedSearchQuery;
      return (
        patient.name?.toLowerCase().includes(searchLower) ||
        patient.email?.toLowerCase().includes(searchLower) ||
        patient.contactNumber?.toLowerCase().includes(searchLower) ||
        patient.code?.toLowerCase().includes(searchLower)
      );
    });
  }, [allPatientsResponse?.data, debouncedSearchQuery]);

  return {
    data: {
      success: allPatientsResponse?.success || false,
      message: allPatientsResponse?.message || "",
      data: filteredPatients,
    },
    isLoading,
    error,
    refetch,
    isSearching: searchQuery.length > 0,
    hasResults: filteredPatients.length > 0,
    totalResults: filteredPatients.length,
  };
} 