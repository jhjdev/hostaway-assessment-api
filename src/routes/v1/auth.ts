import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RegisterRequest, LoginRequest, VerifyEmailRequest } from '../../types';
import { User } from '../../models/User';
import {
  hashPassword,
  comparePassword,
  isValidEmail,
  isStrongPassword,
} from '../../utils/auth';

export default async function authRoutes(fastify: FastifyInstance) {
  // Register route
  fastify.post<{ Body: RegisterRequest }>(
    '/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: RegisterRequest }>,
      reply: FastifyReply
    ) => {
      const { email, password } = request.body;

      // Validate input
      if (!isValidEmail(email)) {
        return reply.code(400).send({ error: 'Invalid email format' });
      }

      if (!isStrongPassword(password)) {
        return reply.code(400).send({
          error:
            'Password must be at least 8 characters with uppercase, lowercase, and number',
        });
      }

      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return reply.code(409).send({ error: 'User already exists' });
        }

        // Hash password and create user
        const hashedPassword = await hashPassword(password);
        const verificationCode = Math.floor(
          100000 + Math.random() * 900000
        ).toString(); // 6-digit code
        const verificationCodeExpiry = new Date(
          Date.now() + 24 * 60 * 60 * 1000
        ); // 24 hours

        const newUser = new User({
          email,
          password: hashedPassword,
          firstName: 'User', // Default values - can be updated in profile
          lastName: 'User',
          isVerified: false,
          verificationCode,
          verificationCodeExpiry,
          preferences: {
            temperatureUnit: 'celsius',
            theme: 'system',
            notifications: true,
          },
        });

        const savedUser = await newUser.save();

        return reply.code(201).send({
          message: 'User registered successfully',
          userId: savedUser._id,
          verificationCode, // In production, send this via email instead
        });
      } catch (error) {
        fastify.log.error('Registration error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Login route
  fastify.post<{ Body: LoginRequest }>(
    '/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: LoginRequest }>,
      reply: FastifyReply
    ) => {
      const { email, password } = request.body;

      try {
        const user = await User.findOne({ email });

        if (!user) {
          return reply.code(401).send({ error: 'Invalid credentials' });
        }

        if (!user.isVerified) {
          return reply
            .code(401)
            .send({ error: 'Please verify your email first' });
        }

        const isValidPassword = await comparePassword(password, user.password);
        if (!isValidPassword) {
          return reply.code(401).send({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = fastify.jwt.sign({
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        });

        return reply.send({
          message: 'Login successful',
          token,
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            preferences: user.preferences,
          },
        });
      } catch (error) {
        fastify.log.error('Login error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Verify email route
  fastify.post<{ Body: VerifyEmailRequest }>(
    '/verify-email',
    {
      schema: {
        body: {
          type: 'object',
          required: ['token'],
          properties: {
            token: { type: 'string' },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: VerifyEmailRequest }>,
      reply: FastifyReply
    ) => {
      const { token } = request.body;

      try {
        const user = await User.findOne({
          verificationCode: token,
          verificationCodeExpiry: { $gt: new Date() },
        });

        if (!user) {
          return reply
            .code(400)
            .send({ error: 'Invalid or expired verification code' });
        }

        user.isVerified = true;
        delete user.verificationCode;
        delete user.verificationCodeExpiry;
        await user.save();

        return reply.send({ message: 'Email verified successfully' });
      } catch (error) {
        fastify.log.error('Email verification error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  // Get current user profile (protected route)
  fastify.get(
    '/profile',
    {
      preHandler: async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch (err) {
          reply.send(err);
        }
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (request: any, reply: FastifyReply) => {
      try {
        const user = await User.findById(request.user.id).select(
          '-password -verificationCode -verificationCodeExpiry'
        );

        if (!user) {
          return reply.code(404).send({ error: 'User not found' });
        }

        return reply.send({ user });
      } catch (error) {
        fastify.log.error('Profile fetch error:', error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );
}
