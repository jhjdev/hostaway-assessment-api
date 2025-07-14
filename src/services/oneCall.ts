import axios from 'axios';

// One Call API 3.0 interfaces
export interface OneCallWeatherData {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: CurrentWeather;
  minutely?: MinutelyWeather[];
  hourly?: HourlyWeather[];
  daily?: DailyWeather[];
  alerts?: WeatherAlert[];
}

export interface CurrentWeather {
  dt: number;
  sunrise: number;
  sunset: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  dew_point: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: WeatherDescription[];
}

export interface MinutelyWeather {
  dt: number;
  precipitation: number;
}

export interface HourlyWeather {
  dt: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  dew_point: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: WeatherDescription[];
  pop: number; // Probability of precipitation
}

export interface DailyWeather {
  dt: number;
  sunrise: number;
  sunset: number;
  moonrise: number;
  moonset: number;
  moon_phase: number;
  summary: string;
  temp: {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
  };
  feels_like: {
    day: number;
    night: number;
    eve: number;
    morn: number;
  };
  pressure: number;
  humidity: number;
  dew_point: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: WeatherDescription[];
  clouds: number;
  pop: number;
  rain?: number;
  snow?: number;
  uvi: number;
}

export interface WeatherDescription {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface WeatherAlert {
  sender_name: string;
  event: string;
  start: number;
  end: number;
  description: string;
  tags: string[];
}

export class OneCallService {
  private readonly baseUrl: string;
  private apiKey: string | null = null;

  constructor() {
    this.baseUrl = 'https://api.openweathermap.org/data/3.0/onecall';
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
   * Get comprehensive weather data using One Call API 3.0
   */
  async getWeatherData(
    lat: number,
    lon: number,
    exclude?: string[],
    units: string = 'metric'
  ): Promise<OneCallWeatherData> {
    try {
      const params: any = {
        lat,
        lon,
        appid: this.getApiKey(),
        units,
      };

      if (exclude && exclude.length > 0) {
        params.exclude = exclude.join(',');
      }

      const response = await axios.get(this.baseUrl, { params });
      return response.data as OneCallWeatherData;
    } catch (error) {
      console.error('Error fetching One Call weather data:', error);
      throw new Error('Failed to fetch comprehensive weather data');
    }
  }

  /**
   * Get current weather with enhanced data (UV index, air quality)
   */
  async getCurrentWeatherEnhanced(
    lat: number,
    lon: number,
    units: string = 'metric'
  ) {
    try {
      const data = await this.getWeatherData(
        lat,
        lon,
        ['minutely', 'daily', 'alerts'],
        units
      );

      return {
        location: {
          lat: data.lat,
          lon: data.lon,
          timezone: data.timezone,
          timezone_offset: data.timezone_offset,
        },
        current: data.current,
        hourly: data.hourly?.slice(0, 24), // Next 24 hours
      };
    } catch (error) {
      console.error('Error fetching enhanced current weather:', error);
      throw new Error('Failed to fetch enhanced current weather');
    }
  }

  /**
   * Get hourly forecast for next 48 hours
   */
  async getHourlyForecast(
    lat: number,
    lon: number,
    hours: number = 48,
    units: string = 'metric'
  ) {
    try {
      const data = await this.getWeatherData(
        lat,
        lon,
        ['minutely', 'daily', 'alerts'],
        units
      );
      return {
        location: {
          lat: data.lat,
          lon: data.lon,
          timezone: data.timezone,
        },
        forecast: data.hourly?.slice(0, Math.min(hours, 48)) || [],
      };
    } catch (error) {
      console.error('Error fetching hourly forecast:', error);
      throw new Error('Failed to fetch hourly forecast');
    }
  }

  /**
   * Get minutely precipitation forecast for next 60 minutes
   */
  async getMinutelyForecast(lat: number, lon: number) {
    try {
      const data = await this.getWeatherData(lat, lon, [
        'hourly',
        'daily',
        'alerts',
      ]);
      return {
        location: {
          lat: data.lat,
          lon: data.lon,
          timezone: data.timezone,
        },
        forecast: data.minutely || [],
      };
    } catch (error) {
      console.error('Error fetching minutely forecast:', error);
      throw new Error('Failed to fetch minutely precipitation forecast');
    }
  }

  /**
   * Get daily forecast for next 8 days
   */
  async getDailyForecast(
    lat: number,
    lon: number,
    days: number = 8,
    units: string = 'metric'
  ) {
    try {
      const data = await this.getWeatherData(
        lat,
        lon,
        ['minutely', 'hourly', 'alerts'],
        units
      );
      return {
        location: {
          lat: data.lat,
          lon: data.lon,
          timezone: data.timezone,
        },
        forecast: data.daily?.slice(0, Math.min(days, 8)) || [],
      };
    } catch (error) {
      console.error('Error fetching daily forecast:', error);
      throw new Error('Failed to fetch daily forecast');
    }
  }

  /**
   * Get weather alerts for location
   */
  async getWeatherAlerts(lat: number, lon: number) {
    try {
      const data = await this.getWeatherData(lat, lon, [
        'minutely',
        'hourly',
        'daily',
      ]);
      return {
        location: {
          lat: data.lat,
          lon: data.lon,
          timezone: data.timezone,
        },
        alerts: data.alerts || [],
      };
    } catch (error) {
      console.error('Error fetching weather alerts:', error);
      throw new Error('Failed to fetch weather alerts');
    }
  }

  /**
   * Get historical weather data
   */
  async getHistoricalWeather(
    lat: number,
    lon: number,
    dt: number,
    units: string = 'metric'
  ) {
    try {
      const response = await axios.get(`${this.baseUrl}/timemachine`, {
        params: {
          lat,
          lon,
          dt,
          appid: this.apiKey,
          units,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching historical weather:', error);
      throw new Error('Failed to fetch historical weather data');
    }
  }

  /**
   * Get UV index description
   */
  getUVIndexDescription(uvi: number): string {
    if (uvi <= 2) return 'Low';
    if (uvi <= 5) return 'Moderate';
    if (uvi <= 7) return 'High';
    if (uvi <= 10) return 'Very High';
    return 'Extreme';
  }

  /**
   * Get UV index recommendations
   */
  getUVRecommendations(uvi: number): string[] {
    if (uvi <= 2) {
      return ['Minimal protection required', 'Safe to be outside'];
    }
    if (uvi <= 5) {
      return [
        'Moderate protection required',
        'Seek shade during midday',
        'Wear sunscreen',
      ];
    }
    if (uvi <= 7) {
      return [
        'High protection required',
        'Avoid sun during midday',
        'Wear protective clothing',
        'Use sunscreen SPF 30+',
      ];
    }
    if (uvi <= 10) {
      return [
        'Very high protection required',
        'Minimize sun exposure 10am-4pm',
        'Seek shade',
        'Wear protective clothing and hat',
        'Use sunscreen SPF 50+',
      ];
    }
    return [
      'Extreme protection required',
      'Avoid sun exposure 10am-4pm',
      'Stay indoors if possible',
      'Full protective clothing required',
      'Use highest SPF sunscreen',
    ];
  }

  /**
   * Calculate moon phase description
   */
  getMoonPhaseDescription(phase: number): string {
    if (phase === 0 || phase === 1) return 'New Moon';
    if (phase < 0.25) return 'Waxing Crescent';
    if (phase === 0.25) return 'First Quarter';
    if (phase < 0.5) return 'Waxing Gibbous';
    if (phase === 0.5) return 'Full Moon';
    if (phase < 0.75) return 'Waning Gibbous';
    if (phase === 0.75) return 'Last Quarter';
    return 'Waning Crescent';
  }
}

export default new OneCallService();
