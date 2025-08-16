# Flight Lookup Server

A Node.js/Express server that provides a REST API for looking up flight information using the Flightradar24 API.

## Features

- **Flight Search**: Search for flights by flight number (e.g., UA2151) or callsign (e.g., UAL2151)
- **Comprehensive Data**: Returns flight summary, track data, and enriched information
- **Fallback Support**: Falls back to live flight data if historical data isn't available
- **Airline Code Mapping**: Automatically converts between IATA and ICAO airline codes
- **CORS Enabled**: Cross-origin requests supported for frontend integration

## Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Flightradar24 API key (get one at [Flightradar24](https://www.flightradar24.com/api))

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the server directory:
   ```bash
   # Flightradar24 API configuration
   FR24_API_KEY=YOUR_FR24_API_KEY_HERE
   
   # Server configuration
   PORT=4000
   NODE_ENV=development
   ```

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on port 4000 (or the port specified in your `.env` file).

## API Endpoints

### Health Check

```
GET /api/health
```

Returns server status and timestamp.

**Response:**
```json
{
  "ok": true,
  "ts": 1755304743477
}
```

### Flight Lookup

```
GET /api/flight?number={flightNumber}
GET /api/flight?callsign={callsign}
```

Search for flight information by flight number or callsign.

**Parameters:**
- `number` (optional): Flight number (e.g., UA2151)
- `callsign` (optional): Aircraft callsign (e.g., UAL2151)

**Example Requests:**
```bash
# Search by flight number
curl "http://localhost:4000/api/flight?number=UA2151"

# Search by callsign
curl "http://localhost:4000/api/flight?callsign=UAL2151"
```

**Response Structure:**
```json
{
  "summary": {
    "fr24_id": "3a01b036",
    "flight": "UA2151",
    "callsign": "UAL2151",
    "origin_icao": "KEWR",
    "destination_icao": "KDEN",
    "datetime_takeoff": "2025-04-22T14:48:36Z",
    "datetime_landed": "2025-04-22T18:53:23Z",
    "registration": "N28457",
    "aircraft_type": "B739",
    "flight_ended": true
  },
  "track": [
    {
      "lat": 40.6895,
      "lon": -74.1745,
      "altitude": 0,
      "time": "2025-04-22T14:48:36Z"
    }
  ],
  "lastPosition": {
    "lat": 39.8561,
    "lon": -104.6737,
    "altitude": 0,
    "time": "2025-04-22T18:53:23Z"
  },
  "airlineName": "United Airlines",
  "originName": "Newark Liberty International Airport",
  "destinationName": "Denver International Airport"
}
```

### Live Flight Positions

```
GET /api/live/positions?bounds={bounds}&limit={limit}
```

Get live flight positions within specified bounds.

**Parameters:**
- `bounds` (required): Geographic bounds in format "N,S,E,W" (e.g., "40,-40,10,-10")
- `limit` (optional): Maximum number of flights to return (default: 10)

**Example:**
```bash
curl "http://localhost:4000/api/live/positions?bounds=40,-40,10,-10&limit=20"
```

## How It Works

1. **Flight Summary Search**: The server first attempts to find flight information using the Flightradar24 Flight Summary API, searching within a 36-hour window around the current time.

2. **Data Enrichment**: If flight data is found, the server enriches it by fetching:
   - Airline names from the airlines static endpoint
   - Airport names from the airports static endpoint

3. **Track Data**: If available, the server fetches the complete flight track using the flight-tracks endpoint.

4. **Live Data Fallback**: If no historical data is found, the server falls back to searching live flight positions by callsign.

5. **Airline Code Conversion**: The server automatically converts between IATA (2-letter) and ICAO (3-letter) airline codes using the built-in mapping.

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Flight found successfully
- `400 Bad Request`: Missing or invalid parameters
- `403 Forbidden`: API plan limit exceeded
- `404 Not Found`: Flight not found
- `502 Bad Gateway`: Upstream API error

## Configuration

### Environment Variables

- `FR24_API_KEY`: Your Flightradar24 API key (required)
- `PORT`: Server port (default: 4000)
- `NODE_ENV`: Environment (development/production)

### Airline Code Mapping

The server includes a mapping of common IATA airline codes to ICAO codes in `data/airlinesMap.json`. This mapping is used to convert flight numbers to callsigns and vice versa.

## Development

### Scripts

- `npm run dev`: Start development server with nodemon
- `npm run build`: Build TypeScript to JavaScript
- `npm start`: Start production server
- `npm test`: Run tests (not yet implemented)

### Project Structure

```
server/
├── data/
│   └── airlinesMap.json    # Airline code mappings
├── middleware/
│   └── requestId.ts        # Request ID middleware
├── index.ts                # Main server file
├── logger.ts               # Logging configuration
├── package.json            # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

## Testing

Test the API endpoints using curl:

```bash
# Health check
curl http://localhost:4000/api/health

# Flight search
curl "http://localhost:4000/api/flight?number=UA2151"

# Live positions
curl "http://localhost:4000/api/live/positions?bounds=40,-40,10,-10"
```

## Notes

- The server requires a valid Flightradar24 API key to function
- API responses depend on your Flightradar24 plan level
- Some endpoints may be restricted based on your plan
- The server automatically handles CORS for frontend integration
- All API calls are logged with request IDs for debugging
