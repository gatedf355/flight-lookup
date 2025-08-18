"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plane, MapPin, Clock, Navigation } from "lucide-react"

const mockFlightData = {
  callsign: "THY8DE",
  status: "ENROUTE",
  altitude: "FL369",
  speed: "454 kt",
  track: "298°",
  coordinates: "65.577, -12.428",
  lastUpdate: "12:45:53 PM",
}

export default function MinimalFlightLookup() {
  const [searchQuery, setSearchQuery] = useState("")
  const [flightData, setFlightData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsLoading(true)
    setTimeout(() => {
      setFlightData(mockFlightData)
      setIsLoading(false)
    }, 800)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary rounded-xl">
              <Plane className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-serif font-black text-foreground">FlightTracker</h1>
          </div>
          <p className="text-muted-foreground">Simple, fast flight tracking</p>
        </div>

        {/* Search */}
        <Card className="border-2 border-primary/20">
          <CardContent className="p-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Enter flight number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 h-12 text-lg"
                />
              </div>
              <Button onClick={handleSearch} disabled={isLoading} className="h-12 px-6 bg-primary hover:bg-primary/90">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div>
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {flightData && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-serif font-black text-foreground">{flightData.callsign}</h2>
                  <p className="text-muted-foreground">Live tracking data</p>
                </div>
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  {flightData.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <MapPin className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Altitude</p>
                  <p className="font-semibold">{flightData.altitude}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Navigation className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Speed</p>
                  <p className="font-semibold">{flightData.speed}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Navigation className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Track</p>
                  <p className="font-semibold">{flightData.track}</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Updated</p>
                  <p className="font-semibold text-xs">{flightData.lastUpdate}</p>
                </div>
              </div>

              <div className="mt-4 p-3 bg-card rounded-lg">
                <p className="text-sm text-muted-foreground">Coordinates</p>
                <p className="font-mono text-sm">{flightData.coordinates}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
