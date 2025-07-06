import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/User';
import { SearchHistory } from '../models/SearchHistory';
import mongoose from 'mongoose';

export default async function profileRoutes(fastify: FastifyInstance) {
  // Get user profile
  fastify.get(
    '/',
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

        const userData = await User.findById(user.id).select(
          '-password -verificationCode -verificationCodeExpiry'
        );

        if (!userData) {
          return reply.code(404).send({ error: 'User not found' });
        }

        return reply.send({
          success: true,
          data: {
            id: userData._id,
            email: userData.email,
            firstName: userData.firstName,
            lastName: userData.lastName,
            preferences: userData.preferences,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
          },
        });
      } catch (error) {
        fastify.log.error('Profile fetch error:', error);
        return reply.code(500).send({ error: 'Failed to fetch profile' });
      }
    }
  );

  // Update user profile
  fastify.put<{
    Body: {
      firstName?: string;
      lastName?: string;
      preferences?: Record<string, unknown>;
    };
  }>(
    '/',
    {
      preHandler: async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch (err) {
          reply.send(err);
        }
      },
      schema: {
        body: {
          type: 'object',
          properties: {
            firstName: { type: 'string', maxLength: 50 },
            lastName: { type: 'string', maxLength: 50 },
            preferences: {
              type: 'object',
              properties: {
                temperatureUnit: {
                  type: 'string',
                  enum: ['celsius', 'fahrenheit'],
                },
                theme: { type: 'string', enum: ['light', 'dark', 'system'] },
                notifications: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: {
          firstName?: string;
          lastName?: string;
          preferences?: Record<string, unknown>;
        };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = (request as { user: { id: string } }).user;
        const profileUpdate = request.body;

        // Get current user
        const currentUser = await User.findById(user.id);
        if (!currentUser) {
          return reply.code(404).send({ error: 'User not found' });
        }

        // Update user fields
        if (profileUpdate.firstName)
          currentUser.firstName = profileUpdate.firstName;
        if (profileUpdate.lastName)
          currentUser.lastName = profileUpdate.lastName;
        if (profileUpdate.preferences) {
          currentUser.preferences = {
            ...currentUser.preferences,
            ...profileUpdate.preferences,
          };
        }

        const updatedUser = await currentUser.save();

        return reply.send({
          success: true,
          message: 'Profile updated successfully',
          data: {
            id: updatedUser._id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            preferences: updatedUser.preferences,
          },
        });
      } catch (error) {
        fastify.log.error('Profile update error:', error);
        return reply.code(500).send({ error: 'Failed to update profile' });
      }
    }
  );

  // Update user preferences only
  fastify.patch<{ Body: { preferences: Record<string, unknown> } }>(
    '/preferences',
    {
      preHandler: async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch (err) {
          reply.send(err);
        }
      },
      schema: {
        body: {
          type: 'object',
          required: ['preferences'],
          properties: {
            preferences: {
              type: 'object',
              properties: {
                temperatureUnit: {
                  type: 'string',
                  enum: ['celsius', 'fahrenheit'],
                },
                theme: { type: 'string', enum: ['light', 'dark', 'system'] },
                notifications: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{
        Body: { preferences: Record<string, unknown> };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = (request as { user: { id: string } }).user;
        const { preferences } = request.body;

        const currentUser = await User.findById(user.id);
        if (!currentUser) {
          return reply.code(404).send({ error: 'User not found' });
        }

        currentUser.preferences = {
          ...currentUser.preferences,
          ...preferences,
        };

        await currentUser.save();

        return reply.send({
          success: true,
          message: 'Preferences updated successfully',
          data: { preferences: currentUser.preferences },
        });
      } catch (error) {
        fastify.log.error('Preferences update error:', error);
        return reply.code(500).send({ error: 'Failed to update preferences' });
      }
    }
  );

  // Delete user account
  fastify.delete(
    '/',
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

        // Delete user's search history
        await SearchHistory.deleteMany({
          userId: new mongoose.Types.ObjectId(user.id),
        });

        // Delete user account
        const result = await User.deleteOne({
          _id: new mongoose.Types.ObjectId(user.id),
        });

        if (result.deletedCount === 0) {
          return reply.code(404).send({ error: 'User not found' });
        }

        return reply.send({
          success: true,
          message: 'Account deleted successfully',
        });
      } catch (error) {
        fastify.log.error('Account deletion error:', error);
        return reply.code(500).send({ error: 'Failed to delete account' });
      }
    }
  );
}
