"use client";
import { useState } from "react";
import { fetchProgressForFlight } from "@/lib/progress";

export default function ProgressDebugPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFlights = [
    {
      name: "DAL161 - Full FR24 Structure",
      data: {
        // This matches the actual API response structure
        success: true,
        callsign: "DAL161",
        fr24_id: "3bcd9860",
        flight: "DL161",
        aircraft: "A359",
        registration: "N510DN",
        hex: "A661C7",
        airline: "DAL",
        airlineName: "Delta Air Lines",
        operatingAs: "DAL",
        origin: {
          iata: "AMS",
          icao: "EHAM"
        },
        destination: {
          iata: "MSP",
          icao: "KMSP"
        },
        eta: "2025-08-19T16:17:04Z",
        lastPosition: {
          lat: 55.36487,
          lon: -79.40102,
          alt: 38000,
          altitude: 38000,
          speed: 467,
          groundSpeed: 467,
          track: 223,
          squawk: "2403",
          timestamp: "2025-08-19T14:11:19Z",
          time: "2025-08-19T14:11:19Z",
          verticalSpeed: 0,
          vspeed: 0
        },
        source: "ADSB",
        lat: 55.36487,
        lon: -79.40102,
        alt: 38000,
        altitude: 38000,
        speed: 467,
        groundSpeed: 467,
        track: 223,
        squawk: "2403",
        timestamp: "2025-08-19T14:11:19Z",
        time: "2025-08-19T14:11:19Z",
        gspeed: 467,
        vspeed: 0,
        type: "A359",
        reg: "N510DN",
        painted_as: "DAL",
        operating_as: "DAL",
        orig_iata: "AMS",
        orig_icao: "EHAM",
        dest_iata: "MSP",
        dest_icao: "KMSP"
      }
    },
    {
      name: "UAL1409 - Alternative Structure 1",
      data: {
        callsign: "UAL1409",
        flight: "UA1409",
        aircraft: "B738",
        registration: "N12345",
        origin: {
          iata: "ORD",
          icao: "KORD"
        },
        destination: {
          iata: "LAX",
          icao: "KLAX"
        },
        position: {
          lat: 35.0,
          lon: -110.0
        },
        // Alternative field names
        orig_iata: "ORD",
        orig_icao: "KORD",
        dest_iata: "LAX",
        dest_icao: "KLAX",
        lat: 35.0,
        lon: -110.0
      }
    },
    {
      name: "AAL1234 - Alternative Structure 2",
      data: {
        callsign: "AAL1234",
        flight: "AA1234",
        aircraft: "B789",
        registration: "N67890",
        // Different field structure
        summary: {
          orig_icao: "KDFW",
          dest_icao: "KJFK"
        },
        route: {
          origin: "DFW",
          destination: "JFK"
        },
        // Position in different location
        lastPosition: {
          lat: 40.0,
          lon: -85.0
        }
      }
    },
    {
      name: "SWA5678 - Minimal Structure",
      data: {
        callsign: "SWA5678",
        flight: "WN5678",
        // Minimal required fields
        orig_iata: "MDW",
        dest_iata: "BWI",
        lat: 39.0,
        lon: -87.0
      }
    }
  ];

  const [selectedFlight, setSelectedFlight] = useState(0);
  const testFlight = testFlights[selectedFlight].data;

  const testProgress = async () => {
    setLoading(true);
    try {
      const res = await fetchProgressForFlight(testFlight);
      setResult(res);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Progress Debug Page</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Select Test Flight:</h2>
        <select 
          value={selectedFlight} 
          onChange={(e) => setSelectedFlight(Number(e.target.value))}
          className="mb-4 p-2 border rounded"
        >
          {testFlights.map((flight, index) => (
            <option key={index} value={index}>
              {flight.name}
            </option>
          ))}
        </select>
        
        <h3 className="text-lg font-semibold mb-2">Flight Data Structure:</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
          {JSON.stringify(testFlight, null, 2)}
        </pre>
      </div>

      <button 
        onClick={testProgress}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test Progress Calculation"}
      </button>

      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
