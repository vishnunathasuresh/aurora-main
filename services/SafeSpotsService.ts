// SafeSpotsService.ts
// Service to fetch nearest police stations and hospitals using Google Places API
import * as Location from 'expo-location';

export interface SafeSpot {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  type: 'police' | 'hospital';
}

class SafeSpotsService {
  async getCurrentLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') throw new Error('Location permission denied');
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return loc.coords;
  }

  /**
   * Fetches nearby police stations or hospitals using OpenStreetMap Overpass API.
   * @param type 'police' or 'hospital'
   * @param radius in meters (default 3000)
   */
  async fetchSafeSpots(type: 'police' | 'hospital', radius = 3000): Promise<SafeSpot[]> {
    const coords = await this.getCurrentLocation();
    // Overpass QL for police or hospital
    const amenity = type === 'police' ? 'police' : 'hospital';
    // Overpass API query: find nodes/ways/relations with amenity=police/hospital within radius
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="${amenity}"](around:${radius},${coords.latitude},${coords.longitude});
        way["amenity"="${amenity}"](around:${radius},${coords.latitude},${coords.longitude});
        relation["amenity"="${amenity}"](around:${radius},${coords.latitude},${coords.longitude});
      );
      out center tags;
    `;
    const url = 'https://overpass-api.de/api/interpreter';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    const data = await response.json();
    if (!data.elements) return [];
    return data.elements.map((el: any) => ({
      name: el.tags && el.tags.name ? el.tags.name : (type === 'police' ? 'Police Station' : 'Hospital'),
      latitude: el.lat || (el.center && el.center.lat),
      longitude: el.lon || (el.center && el.center.lon),
      address: el.tags && el.tags['addr:full'],
      type,
    })).filter((spot: SafeSpot) => spot.latitude && spot.longitude);
  }
}

export const safeSpotsService = new SafeSpotsService();