# Frontend HTTP Configuration Guide

## Overview

The frontend has been updated with improved HTTP utilities and error handling to work seamlessly with the backend API. This guide explains the configuration and usage.

## Configuration Files

### 1. API Configuration (`src/config/api.js`)

Centralized API configuration that handles:
- Base URL configuration
- Endpoint definitions
- URL building utilities
- Development vs production settings

### 2. HTTP Utilities (`src/lib/http.ts`)

Enhanced HTTP utility functions with:
- Proper error handling for different HTTP status codes
- Progress tracking support
- Comprehensive logging
- Error message formatting

### 3. Vite Configuration (`vite.config.js`)

Development server configuration with:
- API proxy to backend (localhost:4000)
- Port configuration (3000)
- CORS handling

## API Endpoints

The frontend is configured to work with these backend endpoints:

- **Flight Lookup**: `/api/flight?number={flightNumber}` or `/api/flight?callsign={callsign}`
- **Health Check**: `/api/health`
- **Live Positions**: `/api/live/positions?bounds={bounds}&limit={limit}`

## Error Handling

### HTTP Status Codes

The frontend now properly handles different HTTP status codes:

- **200-299**: Success responses
- **404**: Flight not found - shows user-friendly message
- **401/403**: Authentication errors - shows configuration help
- **5xx**: Server errors - shows retry message
- **Network errors**: Connection issues - shows connectivity help

### Error Messages

Users will see clear, actionable error messages instead of technical HTTP errors.

## Development Setup

### 1. Start the Backend Server

```bash
cd server
npm run dev
# Server runs on http://localhost:4000
```

### 2. Start the Frontend Development Server

```bash
cd web
npm run dev
# Frontend runs on http://localhost:3000
```

### 3. API Proxying

During development, the frontend automatically proxies `/api/*` requests to the backend server. This means:
- Frontend makes requests to `/api/flight`
- Vite proxies these to `http://localhost:4000/api/flight`
- No CORS issues during development

## Production Configuration

For production deployment:

1. **Set Environment Variables**:
   ```bash
   VITE_API_BASE=https://your-api-domain.com/api
   ```

2. **Update API Configuration**:
   The `src/config/api.js` file will automatically use the production API base URL.

3. **Remove Proxy Configuration**:
   The Vite proxy is only for development and should not be used in production.

## Usage Examples

### Basic Flight Lookup

```javascript
import { fetchFlight } from './lib/http';

try {
  const flightData = await fetchFlight('UA2151');
  console.log('Flight progress:', flightData.progressPercent);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Using the API Configuration

```javascript
import { getFlightApiUrl } from './config/api';

const url = getFlightApiUrl('UA2151');
// Returns: /api/flight?number=UA2151
```

### Error Handling

```javascript
import { handleHttpError } from './lib/http';

try {
  // API call
} catch (error) {
  const userMessage = handleHttpError(error, 'flight lookup');
  setError(userMessage);
}
```

## Troubleshooting

### Common Issues

1. **API calls failing with CORS errors**:
   - Ensure the backend server is running on port 4000
   - Check that the Vite proxy is configured correctly
   - Verify the vite.config.js proxy settings

2. **404 errors not showing user-friendly messages**:
   - Check that the error handling is properly implemented in components
   - Verify the HTTP utility functions are being used

3. **Progress bar not updating**:
   - Ensure the backend is returning `progressPercent` in the response
   - Check that the frontend is reading the `progressPercent` field

### Debug Mode

Enable detailed logging by checking the browser console for:
- HTTP request/response details
- Error information
- Progress calculation logs

## Migration Notes

If you're updating from the old implementation:

1. **Replace hardcoded URLs**: Use the API configuration instead of hardcoded localhost URLs
2. **Update error handling**: Use the new error handling utilities
3. **Check progress support**: Ensure components can handle the new `progressPercent` field
4. **Test API proxying**: Verify that development requests are properly proxied to the backend

## Security Considerations

- API keys and sensitive data are handled server-side only
- Frontend only makes requests to public API endpoints
- No sensitive configuration is exposed in the frontend code
- CORS is properly configured for development and production
