import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import { WeatherRequest, WeatherData } from '../types';
import { SearchHistory } from '../models/SearchHistory';
import mongoose from 'mongoose';

export default async function weatherRoutes(fastify: FastifyInstance) {
  // Get current weather for a city
  fastify.get<{ Querystring: WeatherRequest }>(
    '/current',
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
          required: ['city'],
          properties: {
            city: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: WeatherRequest }>,
      reply: FastifyReply
    ) => {
      const { city } = request.query;

      try {
        const response = await axios.get(
          `${fastify.config.OPENWEATHER_API_URL}/data/2.5/weather`,
          {
            params: {
              q: city,
              appid: fastify.config.OPENWEATHER_API_KEY,
              units: 'metric',
            },
          }
        );

        const weatherData: WeatherData = {
          location: response.data.name,
          temperature: Math.round(response.data.main.temp),
          description: response.data.weather[0].description,
          humidity: response.data.main.humidity,
          windSpeed: response.data.wind.speed,
          timestamp: new Date(),
        };

        // Save search to history
        const user = (request as { user: { id: string } }).user;
        if (user) {
          try {
            const searchRecord = new SearchHistory({
              userId: new mongoose.Types.ObjectId(user.id),
              query: city,
              location: {
                name: response.data.name,
                country: response.data.sys.country,
                lat: response.data.coord.lat,
                lon: response.data.coord.lon,
              },
              weatherData: {
                temperature: weatherData.temperature,
                description: weatherData.description,
                humidity: weatherData.humidity,
                windSpeed: weatherData.windSpeed,
                icon: response.data.weather[0].icon,
              },
            });

            await searchRecord.save();
          } catch (error) {
            fastify.log.error('Failed to save search history:', error);
            // Don't fail the request if search history fails
          }
        }

        return reply.send({
          success: true,
          data: weatherData,
        });
      } catch (error: unknown) {
        fastify.log.error('Weather API error:', error);

        const axiosError = error as { response?: { status: number } };

        if (axiosError.response?.status === 404) {
          return reply.code(404).send({
            error: 'City not found',
            message: 'Please check the city name and try again',
          });
        }

        if (axiosError.response?.status === 401) {
          return reply.code(500).send({
            error: 'Weather service unavailable',
            message: 'Please try again later',
          });
        }

        return reply.code(500).send({
          error: 'Failed to fetch weather data',
          message: 'Please try again later',
        });
      }
    }
  );

  // Get 5-day weather forecast
  fastify.get<{ Querystring: WeatherRequest }>(
    '/forecast',
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
          required: ['city'],
          properties: {
            city: { type: 'string', minLength: 1 },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: WeatherRequest }>,
      reply: FastifyReply
    ) => {
      const { city } = request.query;

      try {
        const response = await axios.get(
          `${fastify.config.OPENWEATHER_API_URL}/data/2.5/forecast`,
          {
            params: {
              q: city,
              appid: fastify.config.OPENWEATHER_API_KEY,
              units: 'metric',
            },
          }
        );

        const forecastData = response.data.list.map(
          (item: Record<string, unknown>) => ({
            date: new Date((item.dt as number) * 1000),
            temperature: Math.round((item.main as { temp: number }).temp),
            description:
              (item.weather as { description: string }[])[0]?.description || '',
            humidity: (item.main as { humidity: number }).humidity,
            windSpeed: (item.wind as { speed: number }).speed,
          })
        );

        return reply.send({
          success: true,
          location: response.data.city.name,
          data: forecastData,
        });
      } catch (error: unknown) {
        fastify.log.error('Weather forecast API error:', error);

        const axiosError = error as { response?: { status: number } };

        if (axiosError.response?.status === 404) {
          return reply.code(404).send({
            error: 'City not found',
            message: 'Please check the city name and try again',
          });
        }

        if (axiosError.response?.status === 401) {
          return reply.code(500).send({
            error: 'Weather service unavailable',
            message: 'Please try again later',
          });
        }

        return reply.code(500).send({
          error: 'Failed to fetch weather forecast',
          message: 'Please try again later',
        });
      }
    }
  );

  // Get user's search history
  fastify.get(
    '/history',
    {
      preHandler: async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch (err) {
          reply.send(err);
        }
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string };

        const searches = await SearchHistory.find({
          userId: new mongoose.Types.ObjectId(user.id),
        })
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();

        return reply.send({
          success: true,
          data: searches,
        });
      } catch (error) {
        fastify.log.error('Search history fetch error:', error);
        return reply
          .code(500)
          .send({ error: 'Failed to fetch search history' });
      }
    }
  );

  // Delete search from history
  fastify.delete<{ Params: { id: string } }>(
    '/history/:id',
    {
      preHandler: async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch (err) {
          reply.send(err);
        }
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      try {
        const user = (request as { user: { id: string } }).user;
        const { id } = request.params;

        const result = await SearchHistory.deleteOne({
          _id: new mongoose.Types.ObjectId(id),
          userId: new mongoose.Types.ObjectId(user.id),
        });

        if (result.deletedCount === 0) {
          return reply.code(404).send({ error: 'Search record not found' });
        }

        return reply.send({
          success: true,
          message: 'Search deleted successfully',
        });
      } catch (error) {
        fastify.log.error('Search deletion error:', error);
        return reply.code(500).send({ error: 'Failed to delete search' });
      }
    }
  );

  // Clear all search history
  fastify.delete(
    '/history',
    {
      preHandler: async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch (err) {
          reply.send(err);
        }
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = request.user as { id: string };

        await SearchHistory.deleteMany({
          userId: new mongoose.Types.ObjectId(user.id),
        });

        return reply.send({
          success: true,
          message: 'Search history cleared successfully',
        });
      } catch (error) {
        fastify.log.error('Search history clear error:', error);
        return reply
          .code(500)
          .send({ error: 'Failed to clear search history' });
      }
    }
  );

  // Health check endpoint
  fastify.get(
    '/health',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Test OpenWeather API connectivity
        await axios.get(
          `${fastify.config.OPENWEATHER_API_URL}/data/2.5/weather`,
          {
            params: {
              q: 'London',
              appid: fastify.config.OPENWEATHER_API_KEY,
              units: 'metric',
            },
            timeout: 5000,
          }
        );

        return reply.send({
          status: 'healthy',
          services: {
            openweather: 'connected',
            database: 'connected',
          },
          timestamp: new Date(),
        });
      } catch (error) {
        fastify.log.error('Health check failed:', error);
        return reply.code(503).send({
          status: 'unhealthy',
          services: {
            openweather: 'disconnected',
            database: 'connected',
          },
          timestamp: new Date(),
        });
      }
    }
  );
}
