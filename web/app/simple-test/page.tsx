'use client';

import { useState } from 'react';
import SimpleRouteProgress from '../../components/SimpleRouteProgress';

export default function SimpleTestPage() {
  const [showComponent, setShowComponent] = useState(false);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Simple RouteProgress Test</h1>
      
      <button 
        onClick={() => setShowComponent(!showComponent)}
        className="px-4 py-2 bg-blue-500 text-white rounded mb-4"
      >
        {showComponent ? 'Hide' : 'Show'} RouteProgress Component
      </button>

      {showComponent && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Testing Route Progress</h2>
          <SimpleRouteProgress
            originCode="CYYZ"
            destCode="KJFK"
            position={{ lat: 42.0, lon: -76.0 }}
          />
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold">Debug Info:</h3>
        <p>Component should show ~59% progress for Toronto to New York</p>
        <p>Check browser console for debugging output</p>
      </div>
    </div>
  );
}
