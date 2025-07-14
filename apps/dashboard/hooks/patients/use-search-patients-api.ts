"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchPatients } from "@/actions/patients/search-patients";
import { getAllPatients } from "@/actions/patients/get-all-patients";
import { useDebounce } from "@/utils/hooks/useDebounce";

export function useSearchPatientsApi(searchQuery: string) {
  const debouncedSearchQuery = useDebounce(searchQuery.trim(), 500);
  const hasSearchTerm = debouncedSearchQuery.length > 0;

  // Search patients using API when there's a search term
  const searchResult = useQuery({
    queryKey: ["patients", "search", debouncedSearchQuery],
    queryFn: () => searchPatients(debouncedSearchQuery),
    enabled: hasSearchTerm && debouncedSearchQuery.length >= 2, // Only search if at least 2 characters
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Get all patients when no search term
  const allPatientsResult = useQuery({
    queryKey: ["patients", "all"],
    queryFn: getAllPatients,
    enabled: !hasSearchTerm,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Determine which result to use
  const activeResult = hasSearchTerm ? searchResult : allPatientsResult;

  return {
    data: activeResult.data,
    isLoading: activeResult.isLoading,
    error: activeResult.error,
    refetch: activeResult.refetch,
    isSearching: hasSearchTerm,
    hasResults: (activeResult.data?.data?.length || 0) > 0,
    totalResults: activeResult.data?.data?.length || 0,
    searchTerm: debouncedSearchQuery,
  };
} 