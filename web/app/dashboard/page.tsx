"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plane, MapPin, Clock, Navigation, Gauge, Activity, TrendingUp, Globe, Wifi } from "lucide-react"
import RouteProgress from "@/components/RouteProgress"

const mockFlightData = {
  callsign: "THY8DE",
  fr24Id: "3bc32052",
  aircraftHex: "4BB0E8",
  squawk: "2731",
  status: "ENROUTE",
  airline: "Turkish Airlines",
  aircraft: "Boeing 777-300ER",
  route: "IST → JFK",
  summary: {
    orig_icao: "LTFM",
    dest_icao: "KJFK"
  },
  position: {
    lat: 65.577,
    lon: -12.428,
    altitude: "FL369",
    groundSpeed: "454 kt",
    verticalSpeed: "+320 ft/min",
    track: "298°",
  },
  progress: 68,
  eta: "14:30 UTC",
  departure: "10:15 UTC",
  flightTime: "8h 15m",
  distance: "5,124 nm",
}

export default function FlightDashboard() {
  const [searchQuery, setSearchQuery] = useState("")
  const [flightData, setFlightData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsLoading(true)
    setTimeout(() => {
      setFlightData(mockFlightData)
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Plane className="h-6 w-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-serif font-black text-foreground">Flight Control</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">1,247</p>
                  <p className="text-xs text-muted-foreground">Active Flights</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-secondary">98.7%</p>
                  <p className="text-xs text-muted-foreground">On Time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search flights, routes, or aircraft..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 h-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={isLoading} className="bg-primary hover:bg-primary/90">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Track
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {flightData && (
          <div className="space-y-6">
            {/* Flight Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-serif font-black text-foreground mb-1">{flightData.callsign}</h2>
                <p className="text-muted-foreground">
                  {flightData.airline} • {flightData.aircraft} • {flightData.route}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  <Wifi className="h-3 w-3 mr-1" />
                  {flightData.status}
                </Badge>
                <Badge variant="outline">Live</Badge>
              </div>
            </div>

            {/* Route Progress Bar */}
            <Card>
              <CardContent className="p-6">
                <RouteProgress
                  originCode={flightData?.summary?.orig_icao ?? flightData?.route?.split(' → ')?.[0] ?? null}
                  destCode={flightData?.summary?.dest_icao ?? flightData?.route?.split(' → ')?.[1] ?? null}
                  position={{
                    lat: flightData?.position?.lat ?? null,
                    lon: flightData?.position?.lon ?? null,
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-4">
                  <span>Departed {flightData.departure}</span>
                  <span>ETA {flightData.eta}</span>
                </div>
              </CardContent>
            </Card>

            {/* Main Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Flight Data */}
              <div className="lg:col-span-2 space-y-6">
                <Tabs defaultValue="position" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="position">Position</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="route">Route</TabsTrigger>
                  </TabsList>

                  <TabsContent value="position" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          Live Position
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Coordinates</span>
                              <span className="font-mono text-sm">
                                {flightData.position.lat}, {flightData.position.lon}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Altitude</span>
                              <span className="font-bold text-primary text-lg">{flightData.position.altitude}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Ground Speed</span>
                              <span className="font-semibold">{flightData.position.groundSpeed}</span>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Track</span>
                              <span className="font-semibold flex items-center gap-1">
                                <Navigation className="h-4 w-4" />
                                {flightData.position.track}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Vertical Speed</span>
                              <span className="font-semibold text-secondary">{flightData.position.verticalSpeed}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Distance Remaining</span>
                              <span className="font-semibold">1,640 nm</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="details" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Aircraft Information</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">FR24 ID</p>
                            <p className="font-mono bg-muted px-2 py-1 rounded text-sm">{flightData.fr24Id}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Aircraft Hex</p>
                            <p className="font-mono bg-muted px-2 py-1 rounded text-sm">{flightData.aircraftHex}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Squawk</p>
                            <p className="font-mono bg-muted px-2 py-1 rounded text-sm">{flightData.squawk}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Aircraft Type</p>
                            <p className="font-semibold">{flightData.aircraft}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="route" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Flight Route</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div>
                              <p className="font-semibold">Istanbul (IST)</p>
                              <p className="text-sm text-muted-foreground">Departure</p>
                            </div>
                            <div className="text-center">
                              <Plane className="h-6 w-6 text-primary mx-auto mb-1" />
                              <p className="text-xs text-muted-foreground">{flightData.distance}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">New York (JFK)</p>
                              <p className="text-sm text-muted-foreground">Arrival</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Flight Time</p>
                              <p className="font-semibold">{flightData.flightTime}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Distance</p>
                              <p className="font-semibold">{flightData.distance}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right Column - Stats & Actions */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Flight Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="p-6 bg-secondary/10 rounded-lg">
                        <Gauge className="h-12 w-12 text-secondary mx-auto mb-3" />
                        <p className="font-bold text-xl">{flightData.status}</p>
                        <p className="text-sm text-muted-foreground">Current Status</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="text-center p-3 bg-muted/50 rounded">
                          <p className="font-semibold">{flightData.progress}%</p>
                          <p className="text-muted-foreground">Complete</p>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded">
                          <p className="font-semibold">On Time</p>
                          <p className="text-muted-foreground">Schedule</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Globe className="h-4 w-4 mr-2" />
                      View on Map
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Flight History
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Clock className="h-4 w-4 mr-2" />
                      Set Alerts
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      <Plane className="h-4 w-4 mr-2" />
                      Aircraft Info
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!flightData && !isLoading && (
          <div className="text-center py-16">
            <div className="p-6 bg-muted/30 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Plane className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground mb-3">Flight Control Center</h3>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Professional flight tracking dashboard with comprehensive data visualization. Search for any flight to
              access detailed real-time information and analytics.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
