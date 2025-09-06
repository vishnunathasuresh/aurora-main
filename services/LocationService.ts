import * as Location from 'expo-location';

export interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
}

class LocationService {
  private locationSubscription: Location.LocationSubscription | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Location permission request failed:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Location permission denied');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
        accuracy: location.coords.accuracy || undefined,
      };
    } catch (error) {
      console.error('Failed to get current location:', error);
      return null;
    }
  }

  async startLocationTracking(callback: (location: LocationData) => void): Promise<void> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Location permission denied for tracking');
        return;
      }

      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: new Date().toISOString(),
            accuracy: location.coords.accuracy || undefined,
          };
          callback(locationData);
        }
      );
    } catch (error) {
      console.error('Failed to start location tracking:', error);
    }
  }

  stopLocationTracking(): void {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }

  async getLastKnownLocation(): Promise<LocationData | null> {
    try {
      const location = await Location.getLastKnownPositionAsync({});
      if (location) {
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: new Date().toISOString(),
          accuracy: location.coords.accuracy || undefined,
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get last known location:', error);
      return null;
    }
  }
}

export const locationService = new LocationService();