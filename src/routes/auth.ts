import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  User,
  RegisterRequest,
  LoginRequest,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from '../types';
import { 
  hashPassword, 
  comparePassword, 
  generateVerificationToken, 
  generateResetToken,
  isValidEmail,
  isStrongPassword
} from '../utils/auth';

export default async function authRoutes(fastify: FastifyInstance) {
  // Register route
  fastify.post<{ Body: RegisterRequest }>('/register', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: RegisterRequest }>, reply: FastifyReply) => {
    const { email, password } = request.body;

    // Validate input
    if (!isValidEmail(email)) {
      return reply.code(400).send({ error: 'Invalid email format' });
    }

    if (!isStrongPassword(password)) {
      return reply.code(400).send({ 
        error: 'Password must be at least 8 characters with uppercase, lowercase, and number' 
      });
    }

    try {
      const usersCollection = fastify.mongo.collection<User>('users');
      
      // Check if user already exists
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return reply.code(409).send({ error: 'User already exists' });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const verificationToken = generateVerificationToken();
      
      const newUser: Omit<User, '_id'> = {
        email,
        password: hashedPassword,
        isVerified: false,
        verificationToken,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await usersCollection.insertOne(newUser);
      
      return reply.code(201).send({ 
        message: 'User registered successfully',
        userId: result.insertedId,
        verificationToken // In production, send this via email instead
      });

    } catch (error) {
      fastify.log.error('Registration error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Login route
  fastify.post<{ Body: LoginRequest }>('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) => {
    const { email, password } = request.body;

    try {
      const usersCollection = fastify.mongo.collection<User>('users');
      const user = await usersCollection.findOne({ email });

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      if (!user.isVerified) {
        return reply.code(401).send({ error: 'Please verify your email first' });
      }

      const isValidPassword = await comparePassword(password, user.password);
      if (!isValidPassword) {
        return reply.code(401).send({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = fastify.jwt.sign({ 
        id: user._id, 
        email: user.email, 
        role: user.role 
      });

      return reply.send({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      fastify.log.error('Login error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Verify email route
  fastify.post<{ Body: VerifyEmailRequest }>('/verify-email', {
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: VerifyEmailRequest }>, reply: FastifyReply) => {
    const { token } = request.body;

    try {
      const usersCollection = fastify.mongo.collection<User>('users');
      const user = await usersCollection.findOne({ verificationToken: token });

      if (!user) {
        return reply.code(400).send({ error: 'Invalid verification token' });
      }

      await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { isVerified: true, updatedAt: new Date() },
          $unset: { verificationToken: 1 }
        }
      );

      return reply.send({ message: 'Email verified successfully' });

    } catch (error) {
      fastify.log.error('Email verification error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // Get current user profile (protected route)
  fastify.get('/profile', {
    preHandler: async (request, reply) => {
      try {
        await request.jwtVerify();
      } catch (err) {
        reply.send(err);
      }
    }
  }, async (request: any, reply: FastifyReply) => {
    try {
      const usersCollection = fastify.mongo.collection<User>('users');
      const user = await usersCollection.findOne(
        { _id: request.user.id },
        { projection: { password: 0, verificationToken: 0, resetPasswordToken: 0 } }
      );

      if (!user) {
        return reply.code(404).send({ error: 'User not found' });
      }

      return reply.send({ user });

    } catch (error) {
      fastify.log.error('Profile fetch error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
