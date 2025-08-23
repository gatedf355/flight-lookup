'use client';

import { useState, useEffect } from 'react';

export default function SimpleProgress() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const testAPI = async () => {
      setLoading(true);
      try {
        console.log('Testing API call...');
        const response = await fetch('/api/flight-progress?origin=CYYZ&dest=KJFK&lat=42.0&lon=-76.0');
        console.log('Response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('Response data:', data);
          setData(data);
        } else {
          console.error('API call failed:', response.status);
        }
      } catch (error) {
        console.error('Error calling API:', error);
      } finally {
        setLoading(false);
      }
    };

    testAPI();
  }, []);

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Simple Progress Test</h3>
      {loading && <p>Loading...</p>}
      {data && (
        <div>
          <p>Origin: {data.origin?.code}</p>
          <p>Destination: {data.destination?.code}</p>
          <p>Progress: {data.progress?.pct}%</p>
          <p>Distance: {data.progress?.coveredKm} / {data.progress?.totalKm} km</p>
        </div>
      )}
      {!loading && !data && <p>No data loaded</p>}
    </div>
  );
}
