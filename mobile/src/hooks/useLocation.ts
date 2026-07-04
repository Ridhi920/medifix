import { useState, useEffect } from "react";
import * as Location from "expo-location";

export type UserLocation = { latitude: number; longitude: number } | null;

export function useLocation() {
  const [location, setLocation] = useState<UserLocation>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
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
      const { latitude, longitude } = pos.coords;
      setLocation({ latitude, longitude });
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        if (data.address) {
          const name =
            data.address.suburb ||
            data.address.neighbourhood ||
            data.address.city_district ||
            data.address.city ||
            data.address.town ||
            data.address.county ||
            "Current Location";
          setLocationName(name);
        }
      } catch {
        setLocationName("Current Location");
      }
    } catch {
      setLocationError("Unable to get location");
    } finally {
      setLocationLoading(false);
    }
  };

  const setManualName = (name: string) => {
    setLocationName(name);
  };

  return { location, locationName, locationError, locationLoading, requestLocation, setManualName };
}
