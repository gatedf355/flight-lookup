import { useState } from 'react'
import './App.css'

function App() {
  const [flightNumber, setFlightNumber] = useState('')
  const [flightData, setFlightData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!flightNumber.trim()) return

    setLoading(true)
    setError('')
    setFlightData(null)

    try {
      const response = await fetch(`/api/flight?number=${encodeURIComponent(flightNumber.trim())}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch flight data')
      }
      
      setFlightData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>FlightLookup</h1>
        <p>Search for flight information</p>
      </header>

      <main className="app-main">
        <form onSubmit={handleSubmit} className="search-form">
          <div className="input-group">
            <input
              type="text"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
              placeholder="Enter flight number (e.g., AA123)"
              className="flight-input"
              disabled={loading}
            />
            <button 
              type="submit" 
              className="search-button"
              disabled={loading || !flightNumber.trim()}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {flightData && (
          <div className="flight-results">
            <h2>Flight Information</h2>
            <div className="flight-details">
              <pre>{JSON.stringify(flightData, null, 2)}</pre>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
