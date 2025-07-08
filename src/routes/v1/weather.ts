import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import axios from 'axios';
import { WeatherRequest, WeatherData } from '../../types';
import { SearchHistory } from '../../models/SearchHistory';
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
        tags: ['Weather'],
        summary: 'Get current weather',
        description: 'Get current weather data for a specific city',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          required: ['city'],
          properties: {
            city: {
              type: 'string',
              minLength: 1,
              description: 'City name to get weather for',
            },
          },
        },
        response: {
          200: {
            description: 'Current weather data',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  location: { type: 'string' },
                  temperature: { type: 'number' },
                  description: { type: 'string' },
                  humidity: { type: 'number' },
                  windSpeed: { type: 'number' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
          400: {
            description: 'Invalid city name',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          401: {
            description: 'Authentication required',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = (request as any).user;
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        fastify.log.error('Weather API error:', error);

        if (error.response?.status === 404) {
          return reply.code(404).send({
            error: 'City not found',
            message: 'Please check the city name and try again',
          });
        }

        if (error.response?.status === 401) {
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
        tags: ['Weather'],
        summary: 'Get weather forecast',
        description: 'Get 5-day weather forecast for a specific city',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          required: ['city'],
          properties: {
            city: {
              type: 'string',
              minLength: 1,
              description: 'City name to get forecast for',
            },
          },
        },
        response: {
          200: {
            description: 'Weather forecast data',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              location: { type: 'string' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    location: { type: 'string' },
                    temperature: { type: 'number' },
                    description: { type: 'string' },
                    humidity: { type: 'number' },
                    windSpeed: { type: 'number' },
                    timestamp: { type: 'string' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Invalid city name',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          401: {
            description: 'Authentication required',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const forecastData = response.data.list.map((item: any) => ({
          date: new Date(item.dt * 1000),
          temperature: Math.round(item.main.temp),
          description: item.weather[0].description,
          humidity: item.main.humidity,
          windSpeed: item.wind.speed,
        }));

        return reply.send({
          success: true,
          location: response.data.city.name,
          data: forecastData,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (error: any) {
        fastify.log.error('Weather forecast API error:', error);

        if (error.response?.status === 404) {
          return reply.code(404).send({
            error: 'City not found',
            message: 'Please check the city name and try again',
          });
        }

        if (error.response?.status === 401) {
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
      schema: {
        tags: ['Weather'],
        summary: 'Get search history',
        description: 'Get user weather search history',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Search history retrieved successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    _id: { type: 'string' },
                    query: { type: 'string' },
                    location: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        country: { type: 'string' },
                        lat: { type: 'number' },
                        lon: { type: 'number' },
                      },
                    },
                    weatherData: {
                      type: 'object',
                      properties: {
                        temperature: { type: 'number' },
                        description: { type: 'string' },
                        humidity: { type: 'number' },
                        windSpeed: { type: 'number' },
                        icon: { type: 'string' },
                      },
                    },
                    createdAt: { type: 'string' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Authentication required',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as { user: { id: string } }).user;

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
      schema: {
        tags: ['Weather'],
        summary: 'Clear search history',
        description: 'Clear all user weather search history',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Search history cleared successfully',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: {
                type: 'string',
                example: 'Search history cleared successfully',
              },
            },
          },
          401: {
            description: 'Authentication required',
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const user = (request as { user: { id: string } }).user;

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
    {
      preHandler: async (request, reply) => {
        try {
          // Require JWT authentication to access detailed health check
          await request.jwtVerify();
        } catch (err) {
          reply.send(err);
        }
      },
      schema: {
        tags: ['Health'],
        summary: 'Health check',
        description:
          'Check the health of the weather service and external APIs',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            description: 'Service is healthy',
            type: 'object',
            properties: {
              status: { type: 'string' },
              services: {
                type: 'object',
                properties: {
                  openweather: { type: 'string' },
                  database: { type: 'string' },
                },
              },
              timestamp: {
                type: 'string',
                format: 'date-time',
                example: '2025-07-06T12:00:00.000Z',
              },
            },
          },
          503: {
            description: 'Service unhealthy',
            type: 'object',
            properties: {
              status: { type: 'string' },
              error: {
                type: 'string',
                example: 'OpenWeather API not responding',
              },
            },
          },
        },
      },
    },
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
