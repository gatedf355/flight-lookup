'use client';

import RouteProgress from '@/components/RouteProgress';

export default function TestProgressPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Route Progress Component Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Test Case 1: Toronto to New York */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Toronto (CYYZ) → New York (KJFK)</h2>
          <p className="text-sm text-muted-foreground">
            Position: 42.0°N, -76.0°W (should show ~59% progress)
          </p>
          <RouteProgress
            originCode="CYYZ"
            destCode="KJFK"
            position={{ lat: 42.0, lon: -76.0 }}
          />
        </div>

        {/* Test Case 2: Istanbul to New York */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Istanbul (LTFM) → New York (KJFK)</h2>
          <p className="text-sm text-muted-foreground">
            Position: 65.577°N, -12.428°W (should show ~44% progress)
          </p>
          <RouteProgress
            originCode="LTFM"
            destCode="KJFK"
            position={{ lat: 65.577, lon: -12.428 }}
          />
        </div>

        {/* Test Case 3: Toronto to New York - Different Position */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Toronto (CYYZ) → New York (KJFK)</h2>
          <p className="text-sm text-muted-foreground">
            Position: 43.7°N, -79.6°W (should show ~0% progress - near origin)
          </p>
          <RouteProgress
            originCode="CYYZ"
            destCode="KJFK"
            position={{ lat: 43.7, lon: -79.6 }}
          />
        </div>

        {/* Test Case 4: Invalid airport codes */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Invalid Airport Codes</h2>
          <p className="text-sm text-muted-foreground">
            Should show error for non-existent airports
          </p>
          <RouteProgress
            originCode="INVALID"
            destCode="ALSO_INVALID"
            position={{ lat: 40.0, lon: -74.0 }}
          />
        </div>
      </div>

      <div className="mt-12 p-6 bg-muted rounded-lg">
        <h3 className="text-lg font-semibold mb-4">How it works:</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• Uses great-circle distance calculations with along-track progress</li>
          <li>• Tolerant to ICAO/IATA airport codes</li>
          <li>• Automatically loads airport coordinates from your dataset</li>
          <li>• Shows percentage complete, distance covered, and total distance</li>
          <li>• Handles edge cases gracefully (invalid codes, positions, etc.)</li>
        </ul>
      </div>
    </div>
  );
}
