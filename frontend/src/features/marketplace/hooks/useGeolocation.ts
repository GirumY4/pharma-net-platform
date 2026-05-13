// src/features/marketplace/hooks/useGeolocation.ts
import { useCallback, useEffect, useState } from "react";

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  loading: boolean;
  error: string | null;
}

export const useGeolocation = (enabled = true) => {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    loading: false,
    error: null,
  });

  const requestLocation = useCallback(() => {
    if (!enabled || !navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser.",
      }));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          loading: false,
          error: null,
        });
      },
      (err) => {
        setState({
          lat: null,
          lng: null,
          loading: false,
          error:
            err.code === err.PERMISSION_DENIED
              ? "Location access denied. Please enable location services to see nearby pharmacies."
              : "Unable to retrieve your location. Please try again.",
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      requestLocation();
    }
  }, [enabled, requestLocation]);

  return {
    ...state,
    requestLocation,
  };
};
