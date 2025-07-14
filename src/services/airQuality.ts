import axios from 'axios';

export interface AirQualityData {
  aqi: number;
  co: number;
  no: number;
  no2: number;
  o3: number;
  so2: number;
  pm2_5: number;
  pm10: number;
  nh3: number;
  dt: number;
}

interface AirQualityApiItem {
  dt: number;
  main: {
    aqi: number;
  };
  components: {
    co: number;
    no: number;
    no2: number;
    o3: number;
    so2: number;
    pm2_5: number;
    pm10: number;
    nh3: number;
  };
}

interface AirQualityApiResponse {
  coord: {
    lon: number;
    lat: number;
  };
  list: AirQualityApiItem[];
}

export class AirQualityService {
  private readonly baseUrl: string;
  private apiKey: string | null = null;

  constructor() {
    this.baseUrl = 'http://api.openweathermap.org/data/2.5';
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

  async getCurrentAirPollution(
    lat: number,
    lon: number
  ): Promise<AirQualityData | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/air_pollution`, {
        params: { lat, lon, appid: this.getApiKey() },
      });

      const data = response.data as AirQualityApiResponse;
      if (data.list && data.list.length > 0) {
        const item = data.list[0];
        if (item && item.main && item.components) {
          return {
            aqi: item.main.aqi,
            co: item.components.co,
            no: item.components.no,
            no2: item.components.no2,
            o3: item.components.o3,
            so2: item.components.so2,
            pm2_5: item.components.pm2_5,
            pm10: item.components.pm10,
            nh3: item.components.nh3,
            dt: item.dt,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching current air pollution:', error);
      throw new Error('Failed to fetch air pollution data');
    }
  }

  async getAirPollutionForecast(
    lat: number,
    lon: number
  ): Promise<AirQualityData[]> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/air_pollution/forecast`,
        {
          params: { lat, lon, appid: this.getApiKey() },
        }
      );

      const data = response.data as AirQualityApiResponse;
      return data.list.map((item: AirQualityApiItem) => ({
        aqi: item.main.aqi,
        co: item.components.co,
        no: item.components.no,
        no2: item.components.no2,
        o3: item.components.o3,
        so2: item.components.so2,
        pm2_5: item.components.pm2_5,
        pm10: item.components.pm10,
        nh3: item.components.nh3,
        dt: item.dt,
      }));
    } catch (error) {
      console.error('Error fetching air pollution forecast:', error);
      throw new Error('Failed to fetch air pollution forecast');
    }
  }

  getHealthRecommendations(aqi: number): string[] {
    switch (aqi) {
      case 1:
        return [
          'Air quality is satisfactory',
          'Perfect for outdoor activities',
        ];
      case 2:
        return ['Air quality is acceptable', 'Outdoor activities are safe'];
      case 3:
        return [
          'Moderate air quality',
          'Sensitive individuals should limit exposure',
        ];
      case 4:
        return ['Poor air quality', 'Limit outdoor activities'];
      case 5:
        return ['Very poor air quality', 'Avoid outdoor activities'];
      default:
        return ['Air quality data unavailable'];
    }
  }

  getAQIDescription(aqi: number): string {
    const descriptions = [
      'Unknown',
      'Good',
      'Fair',
      'Moderate',
      'Poor',
      'Very Poor',
    ];
    return descriptions[aqi] || 'Unknown';
  }
}

export default new AirQualityService();
