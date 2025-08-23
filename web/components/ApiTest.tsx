'use client';

import { useState, useEffect } from 'react';

export default function ApiTest() {
  const [result, setResult] = useState<string>('Not loaded');
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    try {
      console.log('Testing API call...');
      const response = await fetch('/api/flight-progress?origin=CYYZ&dest=KJFK&lat=42.0&lon=-76.0');
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        setResult(`Success! Progress: ${data.progress.pct}%`);
      } else {
        setResult(`Failed: ${response.status}`);
      }
    } catch (error) {
      console.error('API Error:', error);
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testApi();
  }, []);

  return (
    <div className="p-4 border border-blue-500 rounded">
      <h3 className="font-bold mb-2">API Test Component</h3>
      <div className="space-y-2">
        <p>Status: {loading ? 'Loading...' : result}</p>
        <button 
          onClick={testApi}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          disabled={loading}
        >
          Retry API Call
        </button>
      </div>
    </div>
  );
}
