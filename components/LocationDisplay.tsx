import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { locationService, LocationData } from '@/services/LocationService';

interface LocationDisplayProps {
  onLocationUpdate?: (location: LocationData) => void;
}

export const LocationDisplay: React.FC<LocationDisplayProps> = ({
  onLocationUpdate,
}) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Get initial location
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        setLastUpdate(new Date());
        onLocationUpdate?.(location);
      }
    } catch (error) {
      console.error('Failed to get current location:', error);
    }
  };

  const toggleLocationTracking = async () => {
    if (isTracking) {
      locationService.stopLocationTracking();
      setIsTracking(false);
    } else {
      setIsTracking(true);
      await locationService.startLocationTracking((location) => {
        setCurrentLocation(location);
        setLastUpdate(new Date());
        onLocationUpdate?.(location);
      });
    }
  };

  const refreshLocation = async () => {
    await getCurrentLocation();
  };

  const formatCoordinates = (lat: number, lng: number): string => {
    const latStr = lat.toFixed(6);
    const lngStr = lng.toFixed(6);
    return `${latStr}, ${lngStr}`;
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const openInMaps = () => {
    if (currentLocation) {
      const url = `https://maps.google.com/?q=${currentLocation.latitude},${currentLocation.longitude}`;
      // In a real app, you'd use Linking.openURL(url)
      Alert.alert('Open in Maps', `Would open: ${url}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="location" size={24} color="#3b82f6" />
        <Text style={styles.title}>Current Location</Text>
        <TouchableOpacity onPress={refreshLocation} style={styles.refreshButton}>
          <Ionicons name="refresh" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {currentLocation ? (
        <View style={styles.locationContainer}>
          <View style={styles.coordinatesContainer}>
            <Text style={styles.coordinatesLabel}>Coordinates:</Text>
            <Text style={styles.coordinates}>
              {formatCoordinates(currentLocation.latitude, currentLocation.longitude)}
            </Text>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time:</Text>
              <Text style={styles.detailValue}>
                {formatTime(currentLocation.timestamp)}
              </Text>
            </View>

            {currentLocation.accuracy && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Accuracy:</Text>
                <Text style={styles.detailValue}>
                  ±{currentLocation.accuracy.toFixed(1)}m
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity onPress={openInMaps} style={styles.mapsButton}>
            <Ionicons name="map" size={16} color="white" />
            <Text style={styles.mapsButtonText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noLocationContainer}>
          <Ionicons name="location" size={32} color="#9ca3af" />
          <Text style={styles.noLocationText}>Location not available</Text>
          <TouchableOpacity onPress={getCurrentLocation} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.trackingContainer}>
        <TouchableOpacity
          onPress={toggleLocationTracking}
          style={[
            styles.trackingButton,
            isTracking ? styles.trackingButtonActive : styles.trackingButtonInactive,
          ]}
        >
          <Ionicons
            name={isTracking ? 'stop-circle' : 'play-circle'}
            size={20}
            color={isTracking ? 'white' : '#6b7280'}
          />
          <Text
            style={[
              styles.trackingButtonText,
              isTracking ? styles.trackingButtonTextActive : styles.trackingButtonTextInactive,
            ]}
          >
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>

        {lastUpdate && (
          <Text style={styles.lastUpdateText}>
            Last update: {lastUpdate.toLocaleTimeString()}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
    flex: 1,
  },
  refreshButton: {
    padding: 4,
  },
  locationContainer: {
    marginBottom: 16,
  },
  coordinatesContainer: {
    marginBottom: 12,
  },
  coordinatesLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: 'monospace',
  },
  detailsContainer: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  mapsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  noLocationContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noLocationText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 8,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  trackingContainer: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  trackingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  trackingButtonActive: {
    backgroundColor: '#dc2626',
  },
  trackingButtonInactive: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  trackingButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  trackingButtonTextActive: {
    color: 'white',
  },
  trackingButtonTextInactive: {
    color: '#6b7280',
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});