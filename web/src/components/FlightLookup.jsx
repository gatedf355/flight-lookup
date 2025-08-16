import React, { useState } from 'react';
import axios from 'axios';

function FlightLookup() {
  const [input, setInput] = useState('');
  const [flightData, setFlightData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setFlightData(null);
    const query = input.trim();
    
    if (!query) {
      setError('Please enter a flight number or callsign.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Determine if input looks like a callsign (usually 3-letter prefix) or flight number
      let url = 'http://localhost:4000/api/flight?';
      if (isCallsign(query)) {
        url += 'callsign=' + encodeURIComponent(query.toUpperCase());
      } else {
        url += 'number=' + encodeURIComponent(query.toUpperCase());
      }
      
      const response = await axios.get(url);
      setFlightData(response.data);
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(err.message || 'An error occurred while searching for the flight.');
      }
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isCallsign = (query) => {
    // Simplistic check: callsigns are often 3 letters + digits, whereas flight numbers can be 2 letters + digits
    // We'll assume 3 or more letters at start indicates callsign
    const match = query.match(/^([A-Za-z]+)(\d+)/);
    if (!match) return false;
    const letters = match[1];
    // if airline code is 3 letters (ICAO) vs 2 letters (IATA)
    return letters.length >= 3;
  };

  // Helper to format date/time strings nicely
  const formatDateTime = (dtStr) => {
    if (!dtStr) return '';
    // dtStr expected in ISO format
    const options = { 
      timeZone: 'UTC', 
      hour12: false, 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    
    try {
      const d = new Date(dtStr);
      return d.toLocaleString(undefined, options) + ' UTC';
    } catch {
      return dtStr;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Flight Lookup</h1>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="Enter flight number (e.g., UA2151) or callsign (e.g., UAL2151)" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button 
            type="submit" 
            disabled={loading} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 font-medium">Error:</div>
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {flightData && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Flight {flightData.summary?.flight || 'Unknown'}
          </h2>
          
          <div className="space-y-4">
            {flightData.airlineName && (
              <div>
                <span className="font-medium text-gray-700">Airline:</span>
                <span className="ml-2 text-gray-900">{flightData.airlineName}</span>
              </div>
            )}
            
            {flightData.summary?.callsign && (
              <div>
                <span className="font-medium text-gray-700">Callsign:</span>
                <span className="ml-2 text-gray-900">{flightData.summary.callsign}</span>
              </div>
            )}
            
            <div>
              <span className="font-medium text-gray-700">Route:</span>
              <span className="ml-2 text-gray-900">
                {flightData.originName ? `${flightData.originName} (${flightData.summary?.orig_icao})` : flightData.summary?.orig_icao} 
                → 
                {flightData.destinationName ? `${flightData.destinationName} (${flightData.summary?.dest_icao})` : flightData.summary?.dest_icao}
              </span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Departure:</span>
              <span className="ml-2 text-gray-900">
                {flightData.summary?.datetime_takeoff ? formatDateTime(flightData.summary.datetime_takeoff) : 'N/A'}
              </span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Arrival:</span>
              <span className="ml-2 text-gray-900">
                {flightData.summary?.datetime_landed ? formatDateTime(flightData.summary.datetime_landed) : '(in progress)'}
              </span>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Aircraft:</span>
              <span className="ml-2 text-gray-900">
                {flightData.summary?.type || 'N/A'} 
                {flightData.summary?.reg ? `(${flightData.summary.reg})` : ''}
              </span>
            </div>
            
            {/* Flight status */}
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              {flightData.summary?.flight_ended ? (
                <span className="ml-2 text-green-600 font-medium">Completed</span>
              ) : (
                <span className="ml-2 text-orange-600 font-medium">In Flight</span>
              )}
            </div>
            
            {/* If flight is in progress, show last known position */}
            {!flightData.summary?.flight_ended && flightData.lastPosition && (
              <div>
                <span className="font-medium text-gray-700">Last Known Position:</span>
                <div className="ml-2 text-gray-900">
                  <div>Latitude: {flightData.lastPosition.lat?.toFixed(4)}</div>
                  <div>Longitude: {flightData.lastPosition.lon?.toFixed(4)}</div>
                  {flightData.lastPosition.altitude && (
                    <div>Altitude: {flightData.lastPosition.altitude} ft</div>
                  )}
                  {flightData.lastPosition.time && (
                    <div className="text-sm text-gray-600">
                      As of: {flightData.lastPosition.time}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Track information */}
            {flightData.track && flightData.track.length > 1 && (
              <div>
                <span className="font-medium text-gray-700">Track:</span>
                <span className="ml-2 text-gray-900">
                  {flightData.track.length} position points available
                </span>
                <div className="text-sm text-gray-600 mt-1">
                  (Visualization not implemented - could be extended with a map component)
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FlightLookup;
