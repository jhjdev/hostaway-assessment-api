import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { User, UserProfile } from '../types';

export default async function profileRoutes(fastify: FastifyInstance) {
  // Get user profile
  fastify.get('/', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  }, async (request: any, reply: FastifyReply) => {
    try {
      const user = request.user;
      const usersCollection = fastify.mongo.collection<User>('users');
      
      const userData = await usersCollection.findOne(
        { _id: user.id },
        { projection: { password: 0, verificationToken: 0, resetPasswordToken: 0 } }
      );

      if (!userData) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.send({
        success: true,
        data: {
          id: userData._id,
          email: userData.email,
          role: userData.role,
          profile: userData.profile || {
            preferences: {
              units: 'metric',
              language: 'en',
              notifications: true
            }
          },
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt
        }
      });

    } catch (error) {
      fastify.log.error('Profile fetch error:', error);
      return reply.code(500).send({ error: 'Failed to fetch profile' });
    }
  });

  // Update user profile
  fastify.put<{ Body: Partial<UserProfile> }>('/', {
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
          avatar: { type: 'string' },
          location: { type: 'string', maxLength: 100 },
          timezone: { type: 'string' },
          preferences: {
            type: 'object',
            properties: {
              units: { type: 'string', enum: ['metric', 'imperial'] },
              language: { type: 'string', enum: ['en', 'es', 'fr', 'de'] },
              notifications: { type: 'boolean' }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: Partial<UserProfile> }>, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const profileUpdate = request.body;
      const usersCollection = fastify.mongo.collection<User>('users');

      // Get current user data
      const currentUser = await usersCollection.findOne({ _id: user.id });
      if (!currentUser) {
        return reply.code(404).send({ error: 'User not found' });
      }

      // Merge current profile with updates
      const updatedProfile: UserProfile = {
        ...currentUser.profile,
        ...profileUpdate,
        preferences: {
          ...currentUser.profile?.preferences,
          ...profileUpdate.preferences
        }
      };

      // Update user profile
      const result = await usersCollection.updateOne(
        { _id: user.id },
        { 
          $set: { 
            profile: updatedProfile,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.send({
        success: true,
        message: 'Profile updated successfully',
        data: updatedProfile
      });

    } catch (error) {
      fastify.log.error('Profile update error:', error);
      return reply.code(500).send({ error: 'Failed to update profile' });
    }
  });

  // Update user preferences only
  fastify.patch<{ Body: { preferences: UserProfile['preferences'] } }>('/preferences', {
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
            required: ['units', 'language', 'notifications'],
            properties: {
              units: { type: 'string', enum: ['metric', 'imperial'] },
              language: { type: 'string', enum: ['en', 'es', 'fr', 'de'] },
              notifications: { type: 'boolean' }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: { preferences: UserProfile['preferences'] } }>, reply: FastifyReply) => {
    try {
      const user = (request as any).user;
      const { preferences } = request.body;
      const usersCollection = fastify.mongo.collection<User>('users');

      const result = await usersCollection.updateOne(
        { _id: user.id },
        { 
          $set: { 
            'profile.preferences': preferences,
            updatedAt: new Date()
          }
        }
      );

      if (result.matchedCount === 0) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.send({
        success: true,
        message: 'Preferences updated successfully',
        data: { preferences }
      });

    } catch (error) {
      fastify.log.error('Preferences update error:', error);
      return reply.code(500).send({ error: 'Failed to update preferences' });
    }
  });

  // Delete user account
  fastify.delete('/', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  }, async (request: any, reply: FastifyReply) => {
    try {
      const user = request.user;
      const usersCollection = fastify.mongo.collection<User>('users');
      const searchHistoryCollection = fastify.mongo.collection('weatherSearches');

      // Delete user's search history
      await searchHistoryCollection.deleteMany({ userId: user.id });

      // Delete user account
      const result = await usersCollection.deleteOne({ _id: user.id });

      if (result.deletedCount === 0) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.send({
        success: true,
        message: 'Account deleted successfully'
      });

    } catch (error) {
      fastify.log.error('Account deletion error:', error);
      return reply.code(500).send({ error: 'Failed to delete account' });
    }
  });
}
