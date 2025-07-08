# Backend API Enhancement Roadmap

## Current State Analysis

The current API provides basic weather functionality:
- ✅ **JWT Authentication** with user registration and login
- ✅ **Current Weather** endpoint with OpenWeather API integration
- ✅ **5-Day Forecast** endpoint 
- ✅ **Search History** tracking and management
- ✅ **User Profile** management with preferences
- ✅ **Health Check** and monitoring

## Required Backend Enhancements

Based on the frontend roadmap, the backend needs significant enhancements to support new weather app features:

### 1. Extended Weather Data Integration

#### Current Limitations:
- Only basic weather data (temperature, humidity, wind speed)
- No hourly forecasts
- No astronomical data (sunrise/sunset, moon phases)
- No air quality information
- No UV index or weather alerts

#### Required New Endpoints:

**A. Enhanced Current Weather**
- `GET /api/v1/weather/current/enhanced?lat={lat}&lon={lon}`
- Include: UV index, air quality, sunrise/sunset, visibility, pressure
- Support coordinates-based requests for GPS integration

**B. Hourly Forecast**
- `GET /api/v1/weather/hourly?lat={lat}&lon={lon}&hours={24}`
- 24-48 hour detailed hourly forecasts
- Include precipitation probability, cloud cover, wind direction

**C. Astronomical Data**
- `GET /api/v1/weather/astronomy?lat={lat}&lon={lon}`
- Moon phases, moonrise/moonset times
- Sunrise/sunset with accurate times
- Zodiac sign calculation based on date

**D. Air Quality**
- `GET /api/v1/weather/air-quality?lat={lat}&lon={lon}`
- Air Quality Index (AQI)
- Pollutant levels (PM2.5, PM10, CO, NO2, SO2, O3)

**E. Weather Alerts**
- `GET /api/v1/weather/alerts?lat={lat}&lon={lon}`
- Severe weather warnings
- Government weather alerts
- User-defined alert thresholds

### 2. Location Services Enhancement

#### Current Limitations:
- Only city-based weather requests
- No reverse geocoding
- No location validation

#### Required Enhancements:

**A. Coordinate-Based Requests**
- Update all weather endpoints to accept `lat` and `lon` parameters
- Maintain backward compatibility with city-based requests

**B. Reverse Geocoding**
- `GET /api/v1/location/reverse?lat={lat}&lon={lon}`
- Convert coordinates to human-readable location names

**C. Location Search**
- `GET /api/v1/location/search?q={query}`
- City name autocomplete suggestions
- Location validation and coordinates

### 3. User Preferences Enhancement

#### Current Limitations:
- Basic preferences (temperature unit, theme, notifications)
- No weather-specific preferences
- No alert configurations

#### Required Enhancements:

**A. Weather Preferences**
```typescript
interface WeatherPreferences {
  temperatureUnit: 'celsius' | 'fahrenheit';
  windSpeedUnit: 'kmh' | 'mph' | 'ms';
  pressureUnit: 'hpa' | 'inhg';
  timeFormat: '12' | '24';
  language: string;
  defaultLocation?: {
    name: string;
    lat: number;
    lon: number;
  };
}
```

**B. Alert Preferences**
```typescript
interface AlertPreferences {
  enabled: boolean;
  temperatureThresholds: {
    high: number;
    low: number;
  };
  weatherAlerts: {
    severe: boolean;
    precipitation: boolean;
    wind: boolean;
  };
  notificationMethod: 'push' | 'email' | 'both';
}
```

**C. New Preference Endpoints**
- `GET /api/v1/profile/preferences/weather`
- `PUT /api/v1/profile/preferences/weather`
- `GET /api/v1/profile/preferences/alerts`  
- `PUT /api/v1/profile/preferences/alerts`

### 4. Favorites and Saved Locations

#### Current Limitations:
- No way to save favorite locations
- Only search history available

#### Required New Features:

**A. Favorite Locations Model**
```typescript
interface FavoriteLocation {
  id: string;
  userId: string;
  name: string;
  lat: number;
  lon: number;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

**B. Favorite Locations Endpoints**
- `GET /api/v1/weather/favorites` - Get user's favorite locations
- `POST /api/v1/weather/favorites` - Add location to favorites
- `DELETE /api/v1/weather/favorites/:id` - Remove from favorites
- `PUT /api/v1/weather/favorites/:id` - Update favorite (e.g., set as default)

### 5. Enhanced Search History

#### Current Limitations:
- Basic search history with limited data
- No categorization or search capabilities

#### Required Enhancements:

**A. Enhanced Search History Model**
```typescript
interface EnhancedSearchHistory {
  id: string;
  userId: string;
  query: string;
  location: {
    name: string;
    country: string;
    lat: number;
    lon: number;
  };
  weatherData: {
    temperature: number;
    description: string;
    humidity: number;
    windSpeed: number;
    icon: string;
    uv: number;
    aqi: number;
  };
  searchType: 'city' | 'coordinates' | 'current_location';
  timestamp: Date;
}
```

**B. Enhanced History Endpoints**
- `GET /api/v1/weather/history?limit={50}&search={query}` - Enhanced search history
- `GET /api/v1/weather/history/recent?limit={10}` - Recent searches
- `DELETE /api/v1/weather/history/:id` - Delete specific search

### 6. Third-Party API Integration

#### Current Integration:
- ✅ OpenWeather API (current weather and forecast)

#### Required New Integrations:

**A. OpenWeather One Call API**
- Enhanced weather data with UV index, air quality
- Hourly and daily forecasts
- Weather alerts and warnings

**B. Air Quality API**
- Real-time air quality data
- Pollution forecasts
- Health recommendations

**C. Astronomy API**
- Moon phases and astronomical events
- Sunrise/sunset calculations
- Zodiac and seasonal information

### 7. Performance and Caching

#### Current Limitations:
- No caching of weather data
- Multiple API calls for same location
- No rate limiting for external APIs

#### Required Enhancements:

**A. Redis Caching**
- Cache weather data for 10-15 minutes
- Cache location data for longer periods
- Implement cache invalidation strategies

**B. Database Optimization**
- Add indexes for location-based queries
- Optimize search history queries
- Implement data archiving for old searches

**C. Rate Limiting**
- Implement per-user rate limiting
- Cache external API responses
- Queue system for high-volume requests

### 8. Real-time Features

#### Current Limitations:
- No real-time weather updates
- No push notifications
- No live alert system

#### Required Enhancements:

**A. WebSocket Integration**
- Real-time weather updates
- Live alert notifications
- Background sync for favorites

**B. Push Notifications**
- Weather alert notifications
- Daily weather summaries
- Severe weather warnings

### 9. Data Models Updates

#### New Database Collections:

**A. FavoriteLocations**
```typescript
const FavoriteLocationSchema = new Schema({
  userId: { type: ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lon: { type: Number, required: true },
  country: String,
  isDefault: { type: Boolean, default: false },
  weatherData: {
    temperature: Number,
    description: String,
    icon: String,
    lastUpdated: Date
  }
}, { timestamps: true });
```

**B. WeatherAlerts**
```typescript
const WeatherAlertSchema = new Schema({
  userId: { type: ObjectId, ref: 'User', required: true },
  alertType: { type: String, enum: ['temperature', 'weather', 'air_quality'] },
  location: {
    name: String,
    lat: Number,
    lon: Number
  },
  threshold: {
    value: Number,
    condition: String // 'above', 'below', 'equals'
  },
  isActive: { type: Boolean, default: true },
  lastTriggered: Date
}, { timestamps: true });
```

**C. WeatherCache**
```typescript
const WeatherCacheSchema = new Schema({
  location: {
    lat: Number,
    lon: Number
  },
  dataType: { type: String, enum: ['current', 'hourly', 'daily', 'alerts'] },
  data: Object,
  expiresAt: { type: Date, expires: 0 }
});
```

## Implementation Priority

### Phase 1: Core Weather Enhancements (Immediate)
1. **Coordinate-based weather endpoints**
2. **Hourly forecast endpoint**
3. **Enhanced current weather with UV/AQI**
4. **Favorite locations CRUD**
5. **Enhanced user preferences**

### Phase 2: Advanced Features (Medium Priority)
1. **Astronomical data endpoint**
2. **Air quality detailed endpoint**
3. **Weather alerts system**
4. **Location search and reverse geocoding**
5. **Redis caching implementation**

### Phase 3: Real-time and Advanced Features (Later)
1. **WebSocket integration**
2. **Push notifications**
3. **Advanced alert system**
4. **Analytics and reporting**
5. **Performance optimizations**

## Technical Requirements

### New Dependencies:
```json
{
  "redis": "^4.6.0",
  "node-cron": "^3.0.3",
  "socket.io": "^4.7.0",
  "web-push": "^3.6.0",
  "suncalc": "^1.9.0"
}
```

### Environment Variables:
```
REDIS_URL=redis://localhost:6379
OPENWEATHER_ONE_CALL_API_KEY=your_key_here
AIR_QUALITY_API_KEY=your_key_here
PUSH_NOTIFICATION_VAPID_PUBLIC_KEY=your_key_here
PUSH_NOTIFICATION_VAPID_PRIVATE_KEY=your_key_here
```

### OpenWeather API Upgrade:
- Current: Basic weather API
- Required: One Call API 3.0 subscription
- Cost: $40/month for up to 2M calls

## API Versioning Strategy

### V1 (Current)
- Maintain backward compatibility
- Gradual deprecation of old endpoints
- Support existing mobile app versions

### V2 (Enhanced)
- New coordinate-based endpoints
- Enhanced data models
- Improved response formats
- Better error handling

### Migration Plan:
1. **Dual Version Support**: Run V1 and V2 simultaneously
2. **Gradual Migration**: Update frontend to use V2 endpoints
3. **Deprecation Timeline**: 6 months notice for V1 sunset
4. **Documentation**: Clear migration guides

## Success Metrics

### Performance Targets:
- API response time: <200ms (95th percentile)
- Cache hit rate: >80%
- External API rate limit utilization: <70%
- Database query performance: <50ms average

### User Experience Metrics:
- Weather data accuracy: >95%
- Alert delivery time: <30 seconds
- Offline capability: 24 hours cached data
- User preference sync: <5 seconds

## Security Considerations

### Data Privacy:
- Location data encryption
- User preference protection
- Search history anonymization options
- GDPR compliance for EU users

### API Security:
- Rate limiting per user and IP
- API key rotation strategy
- Input validation and sanitization
- SQL injection prevention

This roadmap provides a comprehensive plan for transforming the basic weather API into a robust, feature-rich backend that can support a professional weather application with all modern features users expect.
