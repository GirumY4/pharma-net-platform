// src/features/users/hooks/useUserProfile.ts
import { useCallback, useEffect, useState } from "react";
import { handleApiError } from "../../../utils/errorMapper";
import { fetchUserProfile } from "../services/usersApi";
import type { IUserProfile } from "../types";

interface UseUserProfileReturn {
  profile: IUserProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useUserProfile = (autoFetch = true): UseUserProfileReturn => {
  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(autoFetch);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchUserProfile();
      // Compute derived fields for UI
      const enrichedProfile: IUserProfile = {
        ...result,
        displayName: result.name,
        isPharmacyManager: result.role === "pharmacy_manager",
        pharmacyName:
          result.role === "pharmacy_manager" ? result.name : undefined,
      };
      setProfile(enrichedProfile);
    } catch (err) {
      const message = handleApiError(err);
      setError(message);
      console.error("Profile fetch failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return {
    profile,
    loading,
    error,
    refresh: fetchData,
  };
};
