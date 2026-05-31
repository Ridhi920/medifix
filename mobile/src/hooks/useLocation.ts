import { useState, useEffect } from "react";
import * as Location from "expo-location";

export type UserLocation = { latitude: number; longitude: number } | null;

export function useLocation() {
  const [location, setLocation] = useState<UserLocation>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationError("Location permission denied");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    } catch {
      setLocationError("Unable to get location");
    } finally {
      setLocationLoading(false);
    }
  };

  return { location, locationError, locationLoading, requestLocation };
}
