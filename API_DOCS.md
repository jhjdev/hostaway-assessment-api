# API Documentation

## Base URL

- **Development**: `http://localhost:4000`
- **Production**: `https://hostaway-assessment-api.onrender.com`

## API Versioning

This API supports versioning to ensure backward compatibility and smooth transitions between different versions.

### Version Strategy

- **Current Version**: `v1`
- **Supported Versions**: `v1`
- **Versioned Endpoints**: All endpoints are available under `/api/v1/`
- **Backward Compatibility**: Original endpoints (`/api/`) are still supported

### Version Headers

All responses include version information in headers:

```
X-API-Version: v1
X-API-Current: v1
X-API-Supported: v1
```

### Accessing Versions

- **Version Info**: `GET /api/versions`
- **V1 Endpoints**: `/api/v1/auth`, `/api/v1/weather`, `/api/v1/profile`
- **V1 Documentation**: `/api/v1/docs`

## Documentation

### Interactive Documentation

- **Swagger UI**: Available at `/api/v1/docs`
- **OpenAPI JSON**: Available at `/api/v1/openapi.json`
- **Alternative**: `/docs` redirects to main documentation

### Features

- Complete OpenAPI 3.0 specification
- Interactive API testing
- Authentication support
- Request/response examples
- Error code documentation

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register User

- **POST** `/api/auth/register`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "StrongPassword123"
  }
  ```
- **Response** (201):
  ```json
  {
    "message": "User registered successfully",
    "userId": "user_id",
    "verificationCode": "123456"
  }
  ```

#### Login User

- **POST** `/api/auth/login`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "StrongPassword123"
  }
  ```
- **Response** (200):
  ```json
  {
    "message": "Login successful",
    "token": "jwt_token",
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "preferences": {
        "temperatureUnit": "celsius",
        "theme": "system",
        "notifications": true
      }
    }
  }
  ```

#### Verify Email

- **POST** `/api/auth/verify-email`
- **Body**:
  ```json
  {
    "token": "verification_code"
  }
  ```

### Weather

#### Get Current Weather

- **GET** `/api/weather/current?city=London`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  {
    "success": true,
    "data": {
      "location": "London",
      "temperature": 15,
      "description": "partly cloudy",
      "humidity": 65,
      "windSpeed": 3.5,
      "timestamp": "2025-01-03T10:00:00.000Z"
    }
  }
  ```

#### Get Weather Forecast

- **GET** `/api/weather/forecast?city=London`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  {
    "success": true,
    "location": "London",
    "data": [
      {
        "date": "2025-01-03T12:00:00.000Z",
        "temperature": 16,
        "description": "sunny",
        "humidity": 60,
        "windSpeed": 2.8
      }
    ]
  }
  ```

#### Get Search History

- **GET** `/api/weather/history`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "search_id",
        "query": "London",
        "location": {
          "name": "London",
          "country": "GB",
          "lat": 51.5074,
          "lon": -0.1278
        },
        "weatherData": {
          "temperature": 15,
          "description": "partly cloudy",
          "humidity": 65,
          "windSpeed": 3.5,
          "icon": "03d"
        },
        "createdAt": "2025-01-03T10:00:00.000Z"
      }
    ]
  }
  ```

#### Clear Search History

- **DELETE** `/api/weather/history`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  {
    "success": true,
    "message": "Search history cleared successfully"
  }
  ```

### Profile

#### Get User Profile

- **GET** `/api/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Response** (200):
  ```json
  {
    "success": true,
    "data": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "preferences": {
        "temperatureUnit": "celsius",
        "theme": "system",
        "notifications": true
      },
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-03T10:00:00.000Z"
    }
  }
  ```

#### Update User Profile

- **PUT** `/api/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "firstName": "John",
    "lastName": "Smith",
    "preferences": {
      "temperatureUnit": "fahrenheit",
      "theme": "dark",
      "notifications": false
    }
  }
  ```

#### Update User Preferences

- **PATCH** `/api/profile/preferences`
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "preferences": {
      "temperatureUnit": "fahrenheit",
      "theme": "dark",
      "notifications": false
    }
  }
  ```

### Health

#### Health Check

- **GET** `/api/weather/health`
- **Response** (200):
  ```json
  {
    "status": "healthy",
    "services": {
      "openweather": "connected",
      "database": "connected"
    },
    "timestamp": "2025-01-03T10:00:00.000Z"
  }
  ```

#### API Health

- **GET** `/api/health`
- **Response** (200):
  ```json
  {
    "status": "healthy",
    "timestamp": "2025-07-06T12:00:00.000Z",
    "environment": "production",
    "database": "connected",
    "version": "1.0.0"
  }
  ```

### API Versions

#### Get API Version Information

- **GET** `/api/versions`
- **Response** (200):
  ```json
  {
    "current": "v1",
    "supported": ["v1"],
    "deprecated": [],
    "versions": {
      "v1": {
        "status": "stable",
        "released": "2025-07-06",
        "documentation": "/api/v1/docs",
        "breaking_changes": []
      }
    }
  }
  ```

#### Get V1 API Information

- **GET** `/api/v1`
- **Response** (200):
  ```json
  {
    "version": "v1",
    "status": "stable",
    "description": "Hostaway Assessment API v1",
    "endpoints": {
      "auth": "/api/v1/auth",
      "weather": "/api/v1/weather",
      "profile": "/api/v1/profile"
    },
    "documentation": "/api/v1/docs",
    "deprecated": false,
    "sunset": null
  }
  ```

## Monitoring & Metrics

### Prometheus Metrics

The API exposes Prometheus-compatible metrics for monitoring:

- **Metrics Endpoint**: `GET /metrics`
- **Health Metrics**: `GET /api/metrics/health`

### Available Metrics

- `http_requests_total` - Total HTTP requests by method, route, and status
- `http_request_duration_seconds` - Request duration histogram
- `active_connections` - Number of active connections
- `database_connections` - Database connection status
- `weather_api_requests_total` - Weather API requests by status and city
- `user_registrations_total` - Total user registrations
- `user_logins_total` - Total user logins by status

### Structured Logging

The API uses Winston for structured logging with the following features:

- **JSON Format**: All logs are in JSON format for easy parsing
- **Log Levels**: Debug, info, warn, error
- **Contextual Information**: Each log includes relevant context
- **Environment-based**: Different logging levels for development vs production

### Performance Testing

Performance testing is available using the built-in autocannon-based testing suite:

```bash
# Run all performance tests
npm run perf:test all

# Run specific test
npm run perf:test test "health"

# Run stress test
npm run perf:test stress

# With custom base URL
BASE_URL=https://hostaway-assessment-api.onrender.com npm run perf:test all

# With authentication token
TEST_TOKEN=your-jwt-token npm run perf:test test weather
```

### Test Coverage

Performance tests include:

- Health check endpoint
- Root endpoint
- API versions endpoint
- Weather endpoints (with authentication)
- User registration endpoint
