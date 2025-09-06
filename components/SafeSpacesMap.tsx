import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { locationService, LocationData } from '@/services/LocationService';
import { safeSpotsService, SafeSpot } from '@/services/SafeSpotsService';

// Removed unused width, height

type SafeSpace = SafeSpot & { id: string; distance?: number };

export const SafeSpacesMap: React.FC = () => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [safeSpaces, setSafeSpaces] = useState<SafeSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<SafeSpace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    initializeMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeMap = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get current location
      const location = await locationService.getCurrentLocation();
      if (!location) throw new Error('Could not get current location');
      setCurrentLocation(location);

      // Fetch police and hospital spots from OSM
      const policeSpots = await safeSpotsService.fetchSafeSpots('police');
      const hospitalSpots = await safeSpotsService.fetchSafeSpots('hospital');
      const allSpots: SafeSpace[] = [...policeSpots, ...hospitalSpots].map((spot, idx) => ({
        ...spot,
        id: (spot.name || 'Unknown') + '_' + idx,
        distance: calculateDistance(
          location.latitude,
          location.longitude,
          spot.latitude,
          spot.longitude
        ),
      }));
      allSpots.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setSafeSpaces(allSpots);
    } catch (err: any) {
      setError(err.message || 'Failed to load safe spaces');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleMarkerPress = (space: SafeSpace) => {
    setSelectedSpace(space);
  };


  const handleCall = (phone: string) => {
    Alert.alert(
      'Call Emergency',
      `Call ${selectedSpace?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => Linking.openURL(`tel:${phone}`) },
      ]
    );
  };


  const handleDirections = () => {
    if (selectedSpace && currentLocation) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${selectedSpace.latitude},${selectedSpace.longitude}`;
      Linking.openURL(url);
    }
  };

  const getMarkerIcon = (type: string) => {
    switch (type) {
      case 'police':
        return 'shield';
      case 'hospital':
        return 'medical';
      case 'safehouse':
        return 'home';
      default:
        return 'location';
    }
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'police':
        return '#3b82f6';
      case 'hospital':
        return '#10b981';
      case 'safehouse':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };


  if (loading || !currentLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="map" size={48} color="#9ca3af" />
        <Text style={styles.loadingText}>{error ? error : 'Loading map...'}</Text>
        {loading && <ActivityIndicator size="large" color="#a78bfa" style={{ marginBottom: 16 }} />}
        <TouchableOpacity onPress={initializeMap} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {/* Current location marker */}
        <Marker
          coordinate={{
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          }}
          title="Your Location"
          description="You are here"
          pinColor="#dc2626"
        />

        {/* Safe spaces markers */}
        {safeSpaces.map((space) => (
          <Marker
            key={space.id}
            coordinate={{
              latitude: space.latitude,
              longitude: space.longitude,
            }}
            title={space.name}
            description={`${space.type} - ${space.distance?.toFixed(1)}km away`}
            onPress={() => handleMarkerPress(space)}
          >
            <View style={[styles.customMarker, { backgroundColor: getMarkerColor(space.type) }]}>
              <Ionicons name={getMarkerIcon(space.type) as any} size={16} color="white" />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Safe spaces list */}
      <View style={styles.spacesList}>
        <Text style={styles.spacesListTitle}>Nearby Safe Spaces</Text>
        {safeSpaces.slice(0, 3).map((space) => (
          <TouchableOpacity
            key={space.id}
            style={styles.spaceItem}
            onPress={() => handleMarkerPress(space)}
          >
            <View style={[styles.spaceIcon, { backgroundColor: getMarkerColor(space.type) }]}>
              <Ionicons name={getMarkerIcon(space.type) as any} size={16} color="white" />
            </View>
            <View style={styles.spaceInfo}>
              <Text style={styles.spaceName}>{space.name}</Text>
              <Text style={styles.spaceType}>{space.type}</Text>
              <Text style={styles.spaceDistance}>
                {space.distance?.toFixed(1)}km away
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Selected space details */}
      {selectedSpace && (
        <View style={styles.selectedSpaceDetails}>
          <View style={styles.selectedSpaceHeader}>
            <Text style={styles.selectedSpaceName}>{selectedSpace.name}</Text>
            <TouchableOpacity
              onPress={() => setSelectedSpace(null)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.selectedSpaceType}>{selectedSpace.type}</Text>
          
          {/* Phone number not available from OSM, so call button is omitted */}
          
          <TouchableOpacity
            onPress={handleDirections}
            style={styles.directionsButton}
          >
            <Ionicons name="navigate" size={16} color="white" />
            <Text style={styles.directionsButtonText}>Get Directions</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  spacesList: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  spacesListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  spaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  spaceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  spaceInfo: {
    flex: 1,
  },
  spaceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  spaceType: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  spaceDistance: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  selectedSpaceDetails: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedSpaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedSpaceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  selectedSpaceType: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
    marginBottom: 16,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: 'center',
  },
  callButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  directionsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});