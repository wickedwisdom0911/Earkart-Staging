import getSocketUrlAction from "@/actions/helpers/get-socket-url";
import { useQuery } from "@tanstack/react-query";

export const useGetSocketUrl = () => {
  return useQuery({
    queryKey: ["socket-url"],
    queryFn: async () => {
      try {
        const url = await getSocketUrlAction();
        if (!url) throw new Error("No socket URL returned");
        return url;
      } catch (error) {
        console.error("Failed to fetch socket URL:", error);
        // Return a default URL if the server action fails
        return "http://192.168.1.172:3000/";
      }
    },
    // Add caching configuration
    staleTime: Infinity, // The data will never become stale
    gcTime: Infinity, // Keep the data cached indefinitely (renamed from cacheTime)
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
};
