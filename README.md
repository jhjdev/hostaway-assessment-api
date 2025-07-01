# Hostaway Assessment API

A secure Fastify TypeScript REST API backend for weather data management with user authentication, search history tracking, and MongoDB integration.

## Features

- 🔐 **JWT Authentication** - Secure user registration and login
- 🌤️ **Weather Integration** - OpenWeather API for current weather and forecasts
- 📊 **Search History** - Track and manage user weather searches
- 👤 **User Profiles** - User management and profile endpoints
- 🔒 **Security** - CORS, rate limiting, helmet security headers
- 🗄️ **MongoDB** - Database integration for user data and search history
- 🚀 **Deployment Ready** - Configured for Render.com deployment

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Weather
- `GET /api/weather/current?q={location}` - Get current weather
- `GET /api/weather/forecast?q={location}` - Get weather forecast
- `GET /api/weather/history` - Get user's search history
- `DELETE /api/weather/history` - Clear search history
- `GET /api/weather/health` - Health check endpoint

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `DELETE /api/profile` - Delete user account

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

## Deployment on Render.com

### Automatic Deployment

1. **Connect Repository**
   - Go to [Render.com](https://render.com)
   - Create a new Web Service
   - Connect your GitHub repository

2. **Configure Service**
   - **Name**: `hostaway-assessment-api`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or your preferred plan)

3. **Set Environment Variables** ⚠️ **CRITICAL STEP**
   
   In the Render dashboard, go to **Environment** and add these variables:
   
   | Variable | Value | Notes |
   |----------|-------|-------|
   | `NODE_ENV` | `production` | Already configured in render.yaml |
   | `MONGODB_URI` | Your MongoDB connection string | From your hosted MongoDB |
   | `MONGODB_DB_NAME` | Your database name | From your hosted MongoDB |
   | `PORT` | `4000` | Already configured in render.yaml |
   | `OPENWEATHER_API_KEY` | Your OpenWeather API key | ⚠️ **Set as secret** |
   | `OPENWEATHER_API_URL` | `https://api.openweathermap.org` | Already configured |
   | `JWT_SECRET` | Your production JWT secret | ⚠️ **Set as secret** |

4. **Security Configuration**
   - Mark `OPENWEATHER_API_KEY` and `JWT_SECRET` as **secret** environment variables
   - These variables are intentionally **not** included in `render.yaml` for security
   - Use a strong, unique JWT secret for production (64+ characters)

5. **Deploy**
   - Click **Deploy**
   - Monitor the build logs for any issues
   - Once deployed, test the health endpoint: `https://your-app.onrender.com/api/weather/health`

### Health Check

The service includes a health check endpoint at `/api/weather/health` that Render will use to monitor your service.

## Security Features

- 🔐 **Environment Variables** - All sensitive data stored in environment variables
- 🚫 **No Hardcoded Secrets** - API keys and secrets are never committed to git
- 🔒 **JWT Authentication** - Secure token-based authentication
- 🛡️ **Rate Limiting** - Prevents API abuse
- 🔰 **CORS Protection** - Configured for secure cross-origin requests
- 🪖 **Security Headers** - Helmet.js for additional security
- 📝 **Input Validation** - All endpoints validate input data

## Technology Stack

- **Framework**: Fastify (Node.js)
- **Language**: TypeScript
- **Database**: MongoDB (hosted)
- **Authentication**: JWT
- **Security**: Helmet, CORS, Rate Limiting
- **Weather API**: OpenWeather
- **Deployment**: Render.com

## Development Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build TypeScript to JavaScript
npm start        # Start production server
npm run lint     # Run linting (if configured)
npm test         # Run tests (if configured)
```

---

**🔒 Security Note**: Never commit API keys, JWT secrets, or database credentials to version control. Always use environment variables and keep sensitive files in `.gitignore`.
