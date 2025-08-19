'use client';

export default function BasicTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Basic Component Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded bg-blue-50">
          <h2 className="text-xl font-semibold">Static Content Test</h2>
          <p>This should always be visible</p>
        </div>
        
        <div className="p-4 border rounded bg-green-50">
          <h2 className="text-xl font-semibold">API Test</h2>
          <p>Testing direct API call...</p>
          <button 
            onClick={async () => {
              try {
                console.log('Testing API...');
                const response = await fetch('/api/flight-progress?origin=CYYZ&dest=KJFK&lat=42.0&lon=-76.0');
                console.log('API Response:', response.status);
                if (response.ok) {
                  const data = await response.json();
                  console.log('API Data:', data);
                  alert(`Success! Progress: ${data.progress.pct}%`);
                } else {
                  alert(`API failed: ${response.status}`);
                }
              } catch (error) {
                console.error('API Error:', error);
                alert('API Error: ' + error);
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Test API Call
          </button>
        </div>
      </div>
    </div>
  );
}
