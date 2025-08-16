import React from 'react';
import FlightLookup from './FlightLookup.jsx';

function FlightLookupDemo({ onBack }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        {onBack && (
          <div className="mb-6">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
            >
              ← Back to Original App
            </button>
          </div>
        )}
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Flight Lookup Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            This demo showcases the new Flightradar24 API integration. 
            Search for flights by flight number (e.g., UA2151) or callsign (e.g., UAL2151).
          </p>
        </div>
        
        <FlightLookup />
        
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-3">
              How It Works
            </h2>
            <div className="text-blue-800 space-y-2">
              <p>• <strong>Flight Summary Search:</strong> Searches Flightradar24's historical flight data within a 36-hour window</p>
              <p>• <strong>Data Enrichment:</strong> Automatically fetches airline and airport names</p>
              <p>• <strong>Track Data:</strong> Retrieves complete flight path when available</p>
              <p>• <strong>Live Fallback:</strong> Falls back to live flight positions if historical data isn't found</p>
              <p>• <strong>Smart Detection:</strong> Automatically detects whether you entered a flight number or callsign</p>
            </div>
          </div>
          
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-900 mb-3">
              Setup Required
            </h2>
            <div className="text-yellow-800 space-y-2">
              <p>• <strong>Backend Server:</strong> Make sure the Node.js server is running on port 4000</p>
              <p>• <strong>API Key:</strong> Set your Flightradar24 API key in the server's .env file</p>
              <p>• <strong>CORS:</strong> The backend is configured to allow cross-origin requests</p>
            </div>
          </div>
          
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-900 mb-3">
              Example Searches
            </h2>
            <div className="text-green-800 space-y-2">
              <p>• <strong>Flight Numbers:</strong> UA2151, DL1234, BA789</p>
              <p>• <strong>Callsigns:</strong> UAL2151, DAL1234, BAW789</p>
              <p>• <strong>Mixed:</strong> The system automatically detects the format</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlightLookupDemo;
