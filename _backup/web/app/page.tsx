"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plane, Search, MapPin, Clock, Gauge, Navigation, Wifi, Copy, Printer, Moon, Sun, Palette, Code, X } from "lucide-react"
import { useTheme } from "next-themes"

// Flight data interface based on server API response
interface FlightData {
  summary: {
    callsign: string;
    fr24_id: string | null;
    status: string;
  };
  lastPosition: any;
  fr24: {
    data: any[];
  };
  progressPercent: number | null;
  success: boolean;
  full: boolean;
  meta?: {
    cache: string;
    ageMs: number;
    full: boolean;
  };
}

const colorSchemes = [
  { name: "Aviation Green", primary: "hsl(142, 76%, 36%)", accent: "hsl(84, 81%, 44%)" },
  { name: "Ocean Blue", primary: "hsl(217, 91%, 60%)", accent: "hsl(199, 89%, 48%)" },
  { name: "Sunset Orange", primary: "hsl(24, 95%, 53%)", accent: "hsl(43, 96%, 56%)" },
  { name: "Corporate Purple", primary: "hsl(262, 83%, 58%)", accent: "hsl(280, 100%, 70%)" },
  { name: "Classic Gray", primary: "hsl(215, 28%, 17%)", accent: "hsl(215, 20%, 65%)" },
]

export default function FlightLookup() {
  const [searchQuery, setSearchQuery] = useState("")
  const [flightData, setFlightData] = useState<FlightData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentColorScheme, setCurrentColorScheme] = useState(0)
  const [showRawJson, setShowRawJson] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const scheme = colorSchemes[currentColorScheme]
    document.documentElement.style.setProperty("--color-primary", scheme.primary)
    document.documentElement.style.setProperty("--color-accent", scheme.accent)
  }, [currentColorScheme])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/flight?number=${encodeURIComponent(searchQuery.trim())}&full=true`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Flight not found. Please check the flight number and try again.")
        } else if (response.status === 429) {
          const errorData = await response.json()
          setError(`Rate limited. Please wait ${errorData.retryAfter || 15} seconds before trying again.`)
        } else {
          setError("An error occurred while searching for the flight.")
        }
        setFlightData(null)
        return
      }

      const data = await response.json()
      setFlightData(data)
    } catch (err) {
      setError("Network error. Please check your connection and try again.")
      setFlightData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const cycleColorScheme = () => {
    setCurrentColorScheme((prev) => (prev + 1) % colorSchemes.length)
  }

  const copyToClipboard = async () => {
    if (flightData) {
      try {
        await navigator.clipboard.writeText(JSON.stringify(flightData, null, 2))
        // You could add a toast notification here
      } catch (err) {
        console.error('Failed to copy to clipboard:', err)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--color-primary)] rounded-lg">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-black text-foreground">FlightNerd</h1>
                <p className="text-sm text-muted-foreground">Real-time flight tracking & analytics</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={cycleColorScheme}>
                <Palette className="h-4 w-4 mr-2" />
                {colorSchemes[currentColorScheme].name}
              </Button>
              {flightData && (
                <Button variant="ghost" size="sm" onClick={() => setShowRawJson(!showRawJson)}>
                  <Code className="h-4 w-4 mr-2" />
                  {showRawJson ? 'Hide' : 'Raw'} JSON
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={copyToClipboard} disabled={!flightData}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button variant="ghost" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <a href="/health">Health</a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="Toggle theme"
              >
                {mounted && (theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-serif font-black text-foreground mb-4">Track Any Flight Worldwide</h2>
            <p className="text-lg text-muted-foreground">
              Enter a flight number, callsign, or aircraft registration to get real-time tracking data
            </p>
          </div>

          <Card className="border-2 border-[var(--color-primary)]/20 shadow-lg">
            <CardContent className="p-6">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Enter flight number (e.g., UAL1409, DAL934, AS1154...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 h-12 text-lg border-border focus:ring-2 focus:ring-[var(--color-primary)]/50"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="h-12 px-8 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-semibold"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Search className="h-5 w-5 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Popular searches:</span>
                {["UAL1409", "DAL934", "AS1154", "THY8DE"].map((flight) => (
                  <Button
                    key={flight}
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery(flight)}
                    className="text-xs"
                  >
                    {flight}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="font-medium">{error}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Raw JSON Viewer */}
        {showRawJson && flightData && (
          <div className="max-w-6xl mx-auto mb-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-[var(--color-primary)]" />
                    Raw API Response
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Cache: {flightData.meta?.cache || 'Unknown'}
                    </Badge>
                    {flightData.meta?.ageMs && (
                      <Badge variant="outline" className="text-xs">
                        Age: {Math.round(flightData.meta.ageMs / 1000)}s
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setShowRawJson(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
                  {JSON.stringify(flightData, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Flight Results */}
        {flightData && flightData.success && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-3xl font-serif font-black text-foreground mb-2">
                    Flight {flightData.summary.callsign}
                  </h3>
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <span>FR24 ID: {flightData.summary.fr24_id || 'N/A'}</span>
                    <Separator orientation="vertical" className="h-4" />
                    <span>Status: {flightData.summary.status}</span>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-secondary text-secondary-foreground px-4 py-2 text-sm font-semibold"
                >
                  <Wifi className="h-4 w-4 mr-2" />
                  {flightData.summary.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Flight Details */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="h-5 w-5 text-[var(--color-primary)]" />
                    Flight Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">FR24 ID</p>
                      <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {flightData.summary.fr24_id || 'N/A'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Callsign</p>
                      <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {flightData.summary.callsign}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                        {flightData.summary.status}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {flightData.lastPosition && (
                    <>
                      <div>
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-[var(--color-primary)]" />
                          Live Position & Movement
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Coordinates</span>
                              <span className="font-mono text-sm">
                                {flightData.lastPosition.lat?.toFixed(6)}, {flightData.lastPosition.lon?.toFixed(6)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Altitude</span>
                              <span className="font-semibold text-[var(--color-primary)]">
                                {flightData.lastPosition.altitude || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Ground Speed</span>
                              <span className="font-semibold">
                                {flightData.lastPosition.speed ? `${flightData.lastPosition.speed} kt` : 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Track</span>
                              <span className="font-semibold flex items-center gap-1">
                                <Navigation className="h-4 w-4" />
                                {flightData.lastPosition.track ? `${flightData.lastPosition.track}°` : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Vertical Speed</span>
                              <span className="font-semibold text-[var(--color-accent)]">
                                {flightData.lastPosition.vertical_speed || 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Data Source</span>
                              <Badge variant="outline" className="text-xs">
                                {flightData.lastPosition.source || 'Unknown'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Status Card */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-[var(--color-primary)]" />
                      Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="p-4 bg-secondary/10 rounded-lg">
                        <Gauge className="h-8 w-8 text-[var(--color-accent)] mx-auto mb-2" />
                        <p className="font-semibold text-lg">{flightData.summary.status}</p>
                        <p className="text-sm text-muted-foreground">Current Status</p>
                      </div>
                      {flightData.meta && (
                        <div className="text-sm text-muted-foreground">
                          Cache: {flightData.meta.cache} • Age: {Math.round(flightData.meta.ageMs / 1000)}s
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start bg-transparent" disabled>
                      <MapPin className="h-4 w-4 mr-2" />
                      View on Map (Coming Soon)
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent" disabled>
                      <Clock className="h-4 w-4 mr-2" />
                      Flight History (Coming Soon)
                    </Button>
                    <Button variant="outline" className="w-full justify-start bg-transparent" disabled>
                      <Plane className="h-4 w-4 mr-2" />
                      Aircraft Details (Coming Soon)
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!flightData && !isLoading && !error && (
          <div className="text-center py-16">
            <div className="p-4 bg-muted/50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Plane className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Track Flights</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter a flight number above to get started with real-time tracking data, flight status, and detailed
              aircraft information.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
