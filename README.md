# Hostaway Assessment API

A secure Fastify TypeScript REST API backend for weather data management with user authentication, search history tracking, and MongoDB integration.

## 🌟 Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 🌤️ **Weather Integration** - OpenWeather API for current weather and forecasts
- 📊 **Search History** - Track and manage user weather searches in MongoDB
- 👤 **User Profiles** - User management and profile endpoints
- 🔒 **Security** - CORS, rate limiting, helmet security headers
- � **API Versioning** - Support for multiple API versions (v1)
- 📖 **OpenAPI/Swagger** - Interactive API documentation
- 🚀 **Deployment Ready** - Configured for Render.com deployment
- ⚡ **Performance** - Built with Fastify for high performance
- 🛡️ **TypeScript** - Full type safety and modern development

## 🔗 Live API

- **🌐 Production API**: https://hostaway-assessment-api.onrender.com
- **� Interactive Documentation**: https://hostaway-assessment-api.onrender.com/api/v1/docs
- **🔄 API Versions**: https://hostaway-assessment-api.onrender.com/api/versions

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification

### Weather

- `GET /api/weather/current?city={location}` - Get current weather
- `GET /api/weather/forecast?city={location}` - Get 5-day weather forecast
- `GET /api/weather/history` - Get user's search history
- `DELETE /api/weather/history` - Clear all search history
- `DELETE /api/weather/history/:id` - Delete specific search
- `GET /api/weather/health` - Service health check

### Profile

- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `PATCH /api/profile/preferences` - Update user preferences
- `DELETE /api/profile` - Delete user account

### API Versioning

- `GET /api/versions` - Get API version information
- `GET /api/v1/*` - Access versioned endpoints (all endpoints available under v1)

## 📖 API Documentation

### Interactive Documentation

- **Swagger UI**: `/api/v1/docs` - Interactive API testing interface
- **OpenAPI Spec**: `/api/v1/openapi.json` - Complete OpenAPI 3.0 specification
- **Features**: Request/response examples, authentication support, error documentation

### Authentication

All protected endpoints require a JWT token:

```bash
Authorization: Bearer <your-jwt-token>
```

### Example API Calls

#### Register a new user

```bash
curl -X POST https://hostaway-assessment-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "StrongPassword123"}'
```

#### Get current weather (requires authentication)

```bash
curl -X GET "https://hostaway-assessment-api.onrender.com/api/weather/current?city=London" \
  -H "Authorization: Bearer <your-jwt-token>"
```

#### Get search history

```bash
curl -X GET https://hostaway-assessment-api.onrender.com/api/weather/history \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB (hosted instance)
- OpenWeather API key

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd hostaway-assessment-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to create your environment files:
     ```bash
     cp .env.example .env.development
     cp .env.example .env.production
     cp .env.example .env.test
     ```
   - Update each environment file with your actual values:
     - `MONGODB_URI` - Your hosted MongoDB connection string
     - `MONGODB_DB_NAME` - Your database name
     - `OPENWEATHER_API_KEY` - Your OpenWeather API key
     - `JWT_SECRET` - A secure random string (different for each environment)

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 🚀 Deployment

### Render.com Deployment (Recommended)

1. **Create Web Service**
   - Go to [Render.com](https://render.com) and create a new Web Service
   - Connect your GitHub repository
   - Configure the service:
     - **Build Command**: `npm ci && npm run build`
     - **Start Command**: `npm start`
     - **Environment**: Node.js

2. **Environment Variables** ⚠️ **Critical Step**

   Set these environment variables in your Render dashboard:

   | Variable              | Required | Type    | Description                    |
   | --------------------- | -------- | ------- | ------------------------------ |
   | `MONGODB_URI`         | ✅       | Secret  | MongoDB connection string      |
   | `MONGODB_DB_NAME`     | ✅       | Regular | Database name                  |
   | `OPENWEATHER_API_KEY` | ✅       | Secret  | OpenWeather API key            |
   | `JWT_SECRET`          | ✅       | Secret  | JWT signing secret (64+ chars) |

   **Auto-configured variables** (via render.yaml):
   - `NODE_ENV=production`
   - `PORT=4000`
   - `OPENWEATHER_API_URL=https://api.openweathermap.org`

3. **Deploy**
   - Click "Create Web Service"
   - Monitor build logs
   - Test health endpoint: `https://your-app.onrender.com/api/weather/health`

### Manual Deployment

For other platforms, ensure you set the required environment variables and use:

- **Build**: `npm ci && npm run build`
- **Start**: `npm start`
- **Health Check**: `/api/weather/health`

## 🔒 Security Features

- 🔐 **JWT Authentication** - Secure token-based user authentication
- 🛡️ **Environment Variables** - All sensitive data stored securely
- 🚫 **No Hardcoded Secrets** - API keys and secrets never committed to git
- 🔰 **CORS Protection** - Configured for secure cross-origin requests
- 🪖 **Security Headers** - Helmet.js for additional security
- � **Rate Limiting** - Prevents API abuse and DoS attacks
- �📝 **Input Validation** - All endpoints validate input data
- 🔍 **Request Logging** - Comprehensive logging for security monitoring

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Fastify (High-performance web framework)
- **Language**: TypeScript (Full type safety)
- **Database**: MongoDB (Document database)
- **Authentication**: JWT (JSON Web Tokens)
- **Weather API**: OpenWeather API
- **Security**: Helmet, CORS, Rate Limiting
- **Documentation**: OpenAPI/Swagger
- **Testing**: Jest, Supertest
- **Deployment**: Render.com
- **CI/CD**: GitHub Actions

## 📁 Project Structure

```
├── src/
│   ├── index.ts              # Main application entry point
│   ├── models/               # Database models (User, SearchHistory)
│   ├── routes/               # API route handlers
│   │   ├── auth.ts          # Authentication routes
│   │   ├── weather.ts       # Weather routes
│   │   ├── profile.ts       # Profile routes
│   │   └── v1/              # Versioned API routes
│   ├── services/            # Business logic services
│   │   ├── database.ts      # Database connection
│   │   ├── swagger.ts       # API documentation
│   │   └── versioning.ts    # API versioning
│   ├── utils/               # Utility functions
│   └── types/               # TypeScript type definitions
├── docs/                    # Additional documentation
├── dist/                    # Compiled JavaScript (production)
└── coverage/               # Test coverage reports
```

## 🧪 Development

### Prerequisites

- Node.js 18+
- MongoDB (hosted instance recommended)
- OpenWeather API key

### Setup

1. **Clone and install**

   ```bash
   git clone <repository-url>
   cd hostaway-assessment-api
   npm install
   ```

2. **Environment Configuration**

   ```bash
   # Copy example environment files
   cp .env.example .env.development
   cp .env.example .env.production
   cp .env.example .env.test
   ```

   **Update each environment file with your values:**
   - `MONGODB_URI` - Your MongoDB connection string
   - `MONGODB_DB_NAME` - Your database name
   - `OPENWEATHER_API_KEY` - Your OpenWeather API key
   - `JWT_SECRET` - A secure random string (different for each environment)

3. **Development Commands**

   ```bash
   npm run dev      # Start development server with hot reload
   npm run build    # Build TypeScript to JavaScript
   npm start        # Start production server
   npm run lint     # Run ESLint
   npm test         # Run Jest tests
   npm run test:coverage  # Run tests with coverage report
   ```

4. **Access the API**
   - **Local API**: http://localhost:4000
   - **Local Docs**: http://localhost:4000/api/v1/docs
   - **Health Check**: http://localhost:4000/api/weather/health

### Environment Files

The project uses three environment files:

- **`.env.development`** - Local development configuration
- **`.env.production`** - Production deployment configuration
- **`.env.test`** - Test environment configuration

All three files are required and should contain the same variables with environment-appropriate values.

## 📚 Additional Documentation

- **[API Enhancement Roadmap](docs/API_ENHANCEMENT_ROADMAP.md)** - Future development plans and roadmap
- **[Environment Files Analysis](ENVIRONMENT_FILES_ANALYSIS.md)** - Environment configuration details
- **[OpenAPI Specification](https://hostaway-assessment-api.onrender.com/api/v1/openapi.json)** - Complete API specification

---

**🔒 Security Note**: Never commit API keys, JWT secrets, or database credentials to version control. Always use environment variables and keep sensitive files in `.gitignore`.
