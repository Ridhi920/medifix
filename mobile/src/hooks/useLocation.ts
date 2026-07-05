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

      // Permission can be granted while the device's location services are off.
      const servicesOn = await Location.hasServicesEnabledAsync();
      if (!servicesOn) {
        setLocationError("Location services are turned off");
        return;
      }

      // Try a fresh fix; fall back to the last known position if that times out
      // or returns nothing (common indoors or right after enabling GPS).
      let pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      }).catch(() => null);
      if (!pos) {
        pos = await Location.getLastKnownPositionAsync();
      }
      if (!pos) {
        setLocationError("Unable to get location");
        return;
      }

      const { latitude, longitude } = pos.coords;
      setLocation({ latitude, longitude });
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { "Accept-Language": "en", "User-Agent": "Medifix/0.1 (medifix app)" } }
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
