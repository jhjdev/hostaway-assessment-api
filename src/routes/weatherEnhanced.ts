import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { WeatherRequest } from '../types';
import oneCallService from '../services/oneCall';
import airQualityService from '../services/airQuality';
import locationService from '../services/location';
import { SearchHistory } from '../models/SearchHistory';
import mongoose from 'mongoose';

export default async function enhancedWeatherRoutes(fastify: FastifyInstance) {
  // Enhanced current weather with One Call API 3.0
  fastify.get<{ Querystring: WeatherRequest & { units?: string } }>(
    '/current/enhanced',
    {
      preHandler: async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch (err) {
          reply.send(err);
        }
      },
      schema: {
        querystring: {
          type: 'object',
          properties: {
            city: { type: 'string', minLength: 1 },
            lat: { type: 'number', minimum: -90, maximum: 90 },
            lon: { type: 'number', minimum: -180, maximum: 180 },
            units: { type: 'string', enum: ['metric', 'imperial', 'kelvin'] },
          },
          anyOf: [{ required: ['city'] }, { required: ['lat', 'lon'] }],
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: WeatherRequest & { units?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { city, lat, lon, units = 'metric' } = request.query;

      try {
        let coordinates = { lat: 0, lon: 0 };
        let locationName = '';

        // Get coordinates
        if (lat && lon) {
          coordinates = { lat, lon };
          // Get location name from reverse geocoding
          const locationData = await locationService.reverseGeocode(lat, lon);
          if (locationData && locationData.length > 0 && locationData[0]) {
            locationName = `${locationData[0].name}, ${locationData[0].country}`;
          } else {
            locationName = `${lat}, ${lon}`;
          }
        } else if (city) {
          // Get coordinates from city name
          const locationData = await locationService.geocodeLocation(city);
          if (!locationData || locationData.length === 0 || !locationData[0]) {
            return reply.code(404).send({
              error: 'Location not found',
              message: 'Please check the location name and try again',
            });
          }
          coordinates = { lat: locationData[0].lat, lon: locationData[0].lon };
          locationName = `${locationData[0].name}, ${locationData[0].country}`;
        }

        // Get enhanced weather data from One Call API
        const weatherResponse = await oneCallService.getCurrentWeatherEnhanced(
          coordinates.lat,
          coordinates.lon,
          units
        );

        // Get air quality data
        const airQualityData = await airQualityService.getCurrentAirPollution(
          coordinates.lat,
          coordinates.lon
        );

        // Build enhanced weather response
        const enhancedWeatherData = {
          location: locationName,
          temperature: Math.round(weatherResponse.current.temp),
          description:
            weatherResponse.current.weather[0]?.description || 'Unknown',
          humidity: weatherResponse.current.humidity,
          windSpeed: weatherResponse.current.wind_speed,
          timestamp: new Date(),
          country: locationName.split(', ')[1] || 'Unknown',
          lat: coordinates.lat,
          lon: coordinates.lon,
          // Enhanced data
          visibility: weatherResponse.current.visibility,
          pressure: weatherResponse.current.pressure,
          sunrise: weatherResponse.current.sunrise,
          sunset: weatherResponse.current.sunset,
          feelsLike: weatherResponse.current.feels_like,
          // UV Index
          uvi: weatherResponse.current.uvi,
          uvDescription: oneCallService.getUVIndexDescription(
            weatherResponse.current.uvi
          ),
          uvRecommendations: oneCallService.getUVRecommendations(
            weatherResponse.current.uvi
          ),
          // Air quality
          airQuality: airQualityData
            ? {
                aqi: airQualityData.aqi,
                co: airQualityData.co,
                no: airQualityData.no,
                no2: airQualityData.no2,
                o3: airQualityData.o3,
                so2: airQualityData.so2,
                pm2_5: airQualityData.pm2_5,
                pm10: airQualityData.pm10,
                nh3: airQualityData.nh3,
              }
            : undefined,
          // Hourly forecast (next 24 hours)
          hourlyForecast: weatherResponse.hourly?.slice(0, 24) || [],
        };

        // Save search to history
        const user = (request as { user: { id: string } }).user;
        if (user) {
          try {
            const searchRecord = new SearchHistory({
              userId: new mongoose.Types.ObjectId(user.id),
              query: city || `${lat},${lon}`,
              location: {
                name: locationName.split(', ')[0],
                country: locationName.split(', ')[1] || '',
                lat: coordinates.lat,
                lon: coordinates.lon,
              },
              weatherData: {
                temperature: enhancedWeatherData.temperature,
                description: enhancedWeatherData.description,
                humidity: enhancedWeatherData.humidity,
                windSpeed: enhancedWeatherData.windSpeed,
                icon: weatherResponse.current.weather[0]?.icon || 'unknown',
              },
            });

            await searchRecord.save();
          } catch (error) {
            fastify.log.error('Failed to save search history:', error);
          }
        }

        return reply.send({
          success: true,
          data: enhancedWeatherData,
        });
      } catch (error: unknown) {
        fastify.log.error('Enhanced weather API error:', error);

        return reply.code(500).send({
          error: 'Weather service unavailable',
          message: 'Please try again later',
        });
      }
    }
  );

  // Hourly forecast endpoint
  fastify.get<{
    Querystring: WeatherRequest & { hours?: number; units?: string };
  }>(
    '/hourly',
    {
      preHandler: async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch (err) {
          reply.send(err);
        }
      },
      schema: {
        querystring: {
          type: 'object',
          properties: {
            city: { type: 'string', minLength: 1 },
            lat: { type: 'number', minimum: -90, maximum: 90 },
            lon: { type: 'number', minimum: -180, maximum: 180 },
            hours: { type: 'number', minimum: 1, maximum: 48 },
            units: { type: 'string', enum: ['metric', 'imperial', 'kelvin'] },
          },
          anyOf: [{ required: ['city'] }, { required: ['lat', 'lon'] }],
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: WeatherRequest & { hours?: number; units?: string };
      }>,
      reply: FastifyReply
    ) => {
      const { city, lat, lon, hours = 24, units = 'metric' } = request.query;

      try {
        let coordinates = { lat: 0, lon: 0 };

        // Get coordinates
        if (lat && lon) {
          coordinates = { lat, lon };
        } else if (city) {
          const locationData = await locationService.geocodeLocation(city);
          if (!locationData || locationData.length === 0 || !locationData[0]) {
            return reply.code(404).send({
              error: 'Location not found',
              message: 'Please check the location name and try again',
            });
          }
          coordinates = { lat: locationData[0].lat, lon: locationData[0].lon };
        }

        // Get hourly forecast
        const forecastData = await oneCallService.getHourlyForecast(
          coordinates.lat,
          coordinates.lon,
          hours,
          units
        );

        return reply.send({
          success: true,
          data: forecastData,
        });
      } catch (error: unknown) {
        fastify.log.error('Hourly forecast API error:', error);

        return reply.code(500).send({
          error: 'Weather service unavailable',
          message: 'Please try again later',
        });
      }
    }
  );

  // Air quality endpoint
  fastify.get<{ Querystring: { lat: number; lon: number } }>(
    '/air-quality',
    {
      preHandler: async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch (err) {
          reply.send(err);
        }
      },
      schema: {
        querystring: {
          type: 'object',
          required: ['lat', 'lon'],
          properties: {
            lat: { type: 'number', minimum: -90, maximum: 90 },
            lon: { type: 'number', minimum: -180, maximum: 180 },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: { lat: number; lon: number } }>,
      reply: FastifyReply
    ) => {
      const { lat, lon } = request.query;

      try {
        const currentAirQuality =
          await airQualityService.getCurrentAirPollution(lat, lon);
        const forecastAirQuality =
          await airQualityService.getAirPollutionForecast(lat, lon);

        if (!currentAirQuality) {
          return reply.code(404).send({
            error: 'Air quality data not available',
            message: 'Air quality data is not available for this location',
          });
        }

        return reply.send({
          success: true,
          data: {
            current: {
              ...currentAirQuality,
              description: airQualityService.getAQIDescription(
                currentAirQuality.aqi
              ),
              recommendations: airQualityService.getHealthRecommendations(
                currentAirQuality.aqi
              ),
            },
            forecast: forecastAirQuality.slice(0, 24).map(item => ({
              ...item,
              description: airQualityService.getAQIDescription(item.aqi),
            })),
          },
        });
      } catch (error: unknown) {
        fastify.log.error('Air quality API error:', error);

        return reply.code(500).send({
          error: 'Air quality service unavailable',
          message: 'Please try again later',
        });
      }
    }
  );

  // Weather alerts endpoint
  fastify.get<{ Querystring: WeatherRequest }>(
    '/alerts',
    {
      preHandler: async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch (err) {
          reply.send(err);
        }
      },
      schema: {
        querystring: {
          type: 'object',
          properties: {
            city: { type: 'string', minLength: 1 },
            lat: { type: 'number', minimum: -90, maximum: 90 },
            lon: { type: 'number', minimum: -180, maximum: 180 },
          },
          anyOf: [{ required: ['city'] }, { required: ['lat', 'lon'] }],
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: WeatherRequest }>,
      reply: FastifyReply
    ) => {
      const { city, lat, lon } = request.query;

      try {
        let coordinates = { lat: 0, lon: 0 };

        // Get coordinates
        if (lat && lon) {
          coordinates = { lat, lon };
        } else if (city) {
          const locationData = await locationService.geocodeLocation(city);
          if (!locationData || locationData.length === 0 || !locationData[0]) {
            return reply.code(404).send({
              error: 'Location not found',
              message: 'Please check the location name and try again',
            });
          }
          coordinates = { lat: locationData[0].lat, lon: locationData[0].lon };
        }

        // Get weather alerts
        const alertsData = await oneCallService.getWeatherAlerts(
          coordinates.lat,
          coordinates.lon
        );

        return reply.send({
          success: true,
          data: alertsData,
        });
      } catch (error: unknown) {
        fastify.log.error('Weather alerts API error:', error);

        return reply.code(500).send({
          error: 'Weather alerts service unavailable',
          message: 'Please try again later',
        });
      }
    }
  );
}
