# FR24 Base Plan — Working Notes

## Core endpoints we will use
- Flight-number lookup: `/flights/search?ident=<callsign>` (working)
- Live flight positions: `/live/flight-positions/light?bounds=<N,S,E,W>&limit=<n>` (working)

## Configuration
- Base URL: `https://fr24api.flightradar24.com/api` (no /v1)
- Auth: `Authorization: Bearer <FR24_API_KEY}`
- Version: `Accept-Version: v1`
- Content: `Accept: application/json`
- User-Agent: `flightlookup/1.0`

## Implementation
- Single axios instance with proper headers
- Direct endpoint calls (no proxy)
- Clean error handling and logging

## Fields to map
- status, delay_min, eta_utc, remaining_minutes
- airline_name, flight_number, callsign
- aircraft_type, registration
- position: lat, lon, altitude, speed (if Base includes)
- times: scheduled/actual off/on (UTC)

## Not in Base
- Anything not listed in Base docs
