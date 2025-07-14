import axios from 'axios';

export interface GeocodeResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
  local_names?: Record<string, string>;
}

export interface ReverseGeocodeResult {
  name: string;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export class LocationService {
  private baseUrl: string;
  private apiKey: string | null = null;

  constructor(baseUrl = 'http://api.openweathermap.org') {
    this.baseUrl = baseUrl;
  }

  private getApiKey(): string {
    if (!this.apiKey) {
      this.apiKey = process.env.OPENWEATHER_API_KEY || null;
      if (!this.apiKey) {
        throw new Error('OPENWEATHER_API_KEY environment variable is not set');
      }
    }
    return this.apiKey;
  }

  /**
   * Direct geocoding: Convert city name to coordinates
   */
  async geocodeLocation(query: string, limit = 5): Promise<GeocodeResult[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/geo/1.0/direct`, {
        params: {
          q: query,
          limit,
          appid: this.getApiKey(),
        },
      });

      return response.data.map(
        (item: {
          name: string;
          lat: number;
          lon: number;
          country: string;
          state?: string;
          local_names?: Record<string, string>;
        }) => ({
          name: item.name,
          lat: item.lat,
          lon: item.lon,
          country: item.country,
          state: item.state,
          local_names: item.local_names,
        })
      );
    } catch (error) {
      throw new Error(`Geocoding failed: ${error}`);
    }
  }

  /**
   * Reverse geocoding: Convert coordinates to location name
   */
  async reverseGeocode(
    lat: number,
    lon: number,
    limit = 5
  ): Promise<ReverseGeocodeResult[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/geo/1.0/reverse`, {
        params: {
          lat,
          lon,
          limit,
          appid: this.getApiKey(),
        },
      });

      return response.data.map(
        (item: {
          name: string;
          lat: number;
          lon: number;
          country: string;
          state?: string;
        }) => ({
          name: item.name,
          lat: item.lat,
          lon: item.lon,
          country: item.country,
          state: item.state,
        })
      );
    } catch (error) {
      throw new Error(`Reverse geocoding failed: ${error}`);
    }
  }

  /**
   * Geocode by ZIP code
   */
  async geocodeZip(
    zipCode: string,
    countryCode = 'US'
  ): Promise<GeocodeResult> {
    try {
      const response = await axios.get(`${this.baseUrl}/geo/1.0/zip`, {
        params: {
          zip: `${zipCode},${countryCode}`,
          appid: this.getApiKey(),
        },
      });

      return {
        name: response.data.name,
        lat: response.data.lat,
        lon: response.data.lon,
        country: response.data.country,
      };
    } catch (error) {
      throw new Error(`ZIP geocoding failed: ${error}`);
    }
  }

  /**
   * Validate coordinates
   */
  static validateCoordinates(lat: number, lon: number): boolean {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export default new LocationService();
