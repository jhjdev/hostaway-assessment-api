# Apidog Testing Guide for Hostaway Assessment API

## 📥 Import Instructions

1. **Open Apidog**
2. **Import Collection**:
   - Click "Import" → "OpenAPI/Swagger"
   - Select the `apidog-collection.json` file
   - Click "Import"

## 🔧 Setup for Testing

### 1. Environment Variables (Recommended)

Create an environment in Apidog with these variables:

| Variable Name | Value                                          | Description           |
| ------------- | ---------------------------------------------- | --------------------- |
| `baseUrl`     | `https://hostaway-assessment-api.onrender.com` | Production API URL    |
| `localUrl`    | `http://localhost:4000`                        | Local development URL |
| `bearerToken` | `{{token}}`                                    | JWT token from login  |

### 2. Authentication Setup

**Important**: You'll need to authenticate first to test protected endpoints.

## 🧪 Testing Workflow

### Step 1: Test Health Check

```
GET /api/weather/health
```

- No authentication required
- Verifies API is running

### Step 2: Register a New User

```
POST /api/auth/register
Body:
{
  "email": "testuser@example.com",
  "password": "StrongPassword123"
}
```

- Creates a new test user
- Returns verification code

### Step 3: Verify Email (Optional)

```
POST /api/auth/verify-email
Body:
{
  "token": "123456"
}
```

- Use the verification code from registration

### Step 4: Login to Get JWT Token

```
POST /api/auth/login
Body:
{
  "email": "testuser@example.com",
  "password": "StrongPassword123"
}
```

- **Important**: Copy the `token` from the response
- Set it as your `bearerToken` environment variable

### Step 5: Test Protected Endpoints

All the following require the JWT token in the Authorization header:

#### Weather Endpoints:

- `GET /api/weather/current?city=London`
- `GET /api/weather/forecast?city=Paris`
- `GET /api/weather/history`
- `DELETE /api/weather/history`

#### Profile Endpoints:

- `GET /api/profile`
- `PUT /api/profile`
- `PATCH /api/profile/preferences`
- `DELETE /api/profile`

## 🔐 Authentication in Apidog

### Method 1: Environment Variable (Recommended)

1. Set `bearerToken` environment variable to your JWT token
2. Use `{{bearerToken}}` in Authorization header

### Method 2: Manual Setup

1. Go to each protected endpoint
2. Add Authorization header: `Bearer <your-jwt-token>`

## 📝 Example Test Scenarios

### Scenario 1: Complete User Journey

1. Register → Login → Get Profile → Update Profile → Get Weather

### Scenario 2: Weather Data Testing

1. Login → Get Current Weather → Get Forecast → Check History

### Scenario 3: Error Testing

1. Try protected endpoints without token (401 errors)
2. Try invalid city names (404 errors)
3. Try invalid credentials (401 errors)

## 🌐 Server Endpoints

### Production (Default)

- **URL**: `https://hostaway-assessment-api.onrender.com`
- **Status**: Live and ready for testing

### Local Development

- **URL**: `http://localhost:4000`
- **Requirements**: Run `npm run dev` locally

## 🔍 Response Examples

### Successful Login Response:

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64a7b2c1e4f5d6789abcdef0",
    "email": "testuser@example.com",
    "firstName": "User",
    "lastName": "User",
    "preferences": {
      "temperatureUnit": "celsius",
      "theme": "system",
      "notifications": true
    }
  }
}
```

### Weather Data Response:

```json
{
  "success": true,
  "data": {
    "location": "London",
    "temperature": 15,
    "description": "partly cloudy",
    "humidity": 65,
    "windSpeed": 3.5,
    "timestamp": "2025-07-14T10:00:00.000Z"
  }
}
```

## 🚨 Important Notes

1. **JWT Token Expiration**: Tokens may expire. Re-login if you get 401 errors.
2. **Rate Limiting**: The API has rate limiting. Space out your requests if needed.
3. **Test Data**: Use unique email addresses for testing registration.
4. **Search History**: Weather searches are automatically saved to history.

## 🔗 Additional Resources

- **Live API Documentation**: https://hostaway-assessment-api.onrender.com/api/v1/docs
- **API Version Info**: https://hostaway-assessment-api.onrender.com/api/versions
- **Health Check**: https://hostaway-assessment-api.onrender.com/api/weather/health

Happy Testing! 🧪✨
