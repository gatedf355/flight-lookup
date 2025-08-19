export default function ServerTestPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Server-Side Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded bg-blue-50">
          <h2 className="text-xl font-semibold">Static Content</h2>
          <p>This is server-side rendered content.</p>
        </div>
        
        <div className="p-4 border rounded bg-green-50">
          <h2 className="text-xl font-semibold">Direct API Test</h2>
          <p>Testing API endpoint directly...</p>
          <a 
            href="/api/flight-progress?origin=CYYZ&dest=KJFK&lat=42.0&lon=-76.0"
            className="inline-block px-4 py-2 bg-blue-500 text-white rounded"
            target="_blank"
          >
            Test API in New Tab
          </a>
        </div>
      </div>
    </div>
  );
}
