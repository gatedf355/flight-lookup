"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plane,
  Search,
  MapPin,
  Clock,
  Gauge,
  Navigation,
  Copy,
  Printer,
  Moon,
  Sun,
  Settings,
  Code,
  Filter,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"
import { BadgeStatus } from "@/components/ui/badge-status"
import { ProgressWithLabels } from "@/components/ui/progress-with-labels"
import { TimeAgo } from "@/components/ui/time-ago"
import { MapShell } from "@/components/ui/map-shell"
import { useHotkeys } from "@/hooks/use-hotkeys"
import { fetchFlight } from '@/lib/api'

// Mock flight data with timestamp
const mockFlightData = {
  callsign: "THY8DE",
  fr24Id: "3bc32052",
  aircraftHex: "4BB0E8",
  squawk: "2731",
  status: "ENROUTE",
  position: {
    lat: 65.577,
    lon: -12.428,
    altitude: "FL369",
    groundSpeed: "454 kt",
    verticalSpeed: "+320 ft/min",
    track: "298°",
  },
  lastUpdate: Date.now() - 120000, // 2 minutes ago
  dataSource: "ADSB",
  airline: "Turkish Airlines",
  aircraft: "Boeing 777-300ER",
  route: "IST → JFK",
  progress: 67,
  origin: "IST",
  destination: "JFK",
}

export default function FlightLookup() {
  const [searchQuery, setSearchQuery] = useState("")
  const [flightData, setFlightData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [units, setUnits] = useState({ altitude: "ft", speed: "kt", distance: "nm" })
  const [jsonFilter, setJsonFilter] = useState("")
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [jsonModalOpen, setJsonModalOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    document.documentElement.style.setProperty("--color-primary", "hsl(24, 95%, 53%)")
    document.documentElement.style.setProperty("--color-accent", "hsl(43, 96%, 56%)")

    const savedUnits = localStorage.getItem("flight-units")
    if (savedUnits) {
      setUnits(JSON.parse(savedUnits))
    }
  }, [])

  useHotkeys([
    {
      key: "/",
      callback: () => {
        const searchInput = document.querySelector('input[placeholder*="flight number"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      },
    },
    {
      key: "Enter",
      callback: () => {
        if (document.activeElement?.tagName === "INPUT") {
          handleSearch()
        }
      },
      preventDefault: false,
    },
    {
      key: "Escape",
      callback: () => {
        setJsonModalOpen(false)
        setSettingsOpen(false)
      },
    },
  ])

  const handleSearch = async () => {
    const q = searchQuery.trim()
    if (!q) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchFlight(q)
      setFlightData(data) // expect {summary, progressPercent, lastPosition, ...}
    } catch (e: any) {
      const msg = String(e?.message || '')
      if (/404/.test(msg)) setError('Flight not found or inactive')
      else if (/401|403/.test(msg)) setError('Auth problem with flight data service')
      else if (/429/.test(msg)) setError('Rate limited—please wait a bit')
      else setError('Internal Server Error')
      setFlightData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = (newUnits: typeof units) => {
    setUnits(newUnits)
    localStorage.setItem("flight-units", JSON.stringify(newUnits))
  }

  const filteredJson = jsonFilter
    ? JSON.stringify(flightData, null, 2)
        .split("\n")
        .filter((line) => line.toLowerCase().includes(jsonFilter.toLowerCase()))
        .join("\n")
    : JSON.stringify(flightData, null, 2)

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <header
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 transition-all duration-300"
        role="banner"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--color-primary)] rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Plane className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-black text-foreground">FlightNerd</h1>
                <p className="text-sm text-muted-foreground">Real-time flight tracking & analytics</p>
              </div>
              {!autoRefresh && (
                <Badge variant="secondary" className="ml-4 bg-muted text-muted-foreground">
                  Cached ✓
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="hover:bg-muted/80 transition-all duration-200">
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              <Button variant="ghost" size="sm" className="hover:bg-muted/80 transition-all duration-200">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>

              <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-muted/80 transition-all duration-200"
                    aria-label="Open settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px]">
                  <SheetHeader className="pb-6">
                    <SheetTitle className="text-2xl font-serif font-black text-foreground">Settings</SheetTitle>
                  </SheetHeader>

                  <div className="px-4 space-y-6">
                    <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold text-foreground">Units</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-all duration-300">
                          <label className="text-sm font-medium text-foreground">Altitude</label>
                          <Select
                            value={units.altitude}
                            onValueChange={(value) => saveSettings({ ...units, altitude: value })}
                          >
                            <SelectTrigger className="w-[100px] h-9 bg-background border-border hover:border-[var(--color-primary)]/30 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border shadow-lg">
                              <SelectItem
                                value="ft"
                                className="hover:bg-[var(--color-primary)]/10 focus:bg-[var(--color-primary)]/10 text-foreground hover:text-foreground focus:text-foreground"
                              >
                                Feet
                              </SelectItem>
                              <SelectItem
                                value="m"
                                className="hover:bg-[var(--color-primary)]/10 focus:bg-[var(--color-primary)]/10 text-foreground hover:text-foreground focus:text-foreground"
                              >
                                Meters
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-all duration-300">
                          <label className="text-sm font-medium text-foreground">Speed</label>
                          <Select
                            value={units.speed}
                            onValueChange={(value) => saveSettings({ ...units, speed: value })}
                          >
                            <SelectTrigger className="w-[100px] h-9 bg-background border-border hover:border-[var(--color-primary)]/30 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border shadow-lg">
                              <SelectItem
                                value="kt"
                                className="hover:bg-[var(--color-primary)]/10 focus:bg-[var(--color-primary)]/10 text-foreground hover:text-foreground focus:text-foreground"
                              >
                                Knots
                              </SelectItem>
                              <SelectItem
                                value="mph"
                                className="hover:bg-[var(--color-primary)]/10 focus:bg-[var(--color-primary)]/10 text-foreground hover:text-foreground focus:text-foreground"
                              >
                                MPH
                              </SelectItem>
                              <SelectItem
                                value="kmh"
                                className="hover:bg-[var(--color-primary)]/10 focus:bg-[var(--color-primary)]/10 text-foreground hover:text-foreground focus:text-foreground"
                              >
                                KM/H
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold text-foreground">Preferences</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-all duration-300">
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-foreground">Auto-refresh</label>
                            <p className="text-xs text-muted-foreground">
                              Automatically update flight data every 30 seconds
                            </p>
                          </div>
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={autoRefresh}
                              onChange={(e) => setAutoRefresh(e.target.checked)}
                              className="sr-only"
                              id="auto-refresh-toggle"
                            />
                            <label
                              htmlFor="auto-refresh-toggle"
                              className={`flex items-center cursor-pointer transition-all duration-200 ${
                                autoRefresh
                                  ? "text-[var(--color-primary)]"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <div
                                className={`relative w-12 h-6 rounded-full transition-all duration-200 ${
                                  autoRefresh ? "bg-[var(--color-primary)]" : "bg-muted border-2 border-border"
                                }`}
                              >
                                <div
                                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all duration-200 transform ${
                                    autoRefresh ? "translate-x-6" : "translate-x-0"
                                  }`}
                                />
                              </div>
                            </label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  {/* End of added padding container */}
                </SheetContent>
              </Sheet>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newTheme = theme === "dark" ? "light" : "dark"
                  setTheme(newTheme)
                }}
                aria-label="Toggle theme"
                className="hover:bg-muted/80 transition-all duration-200 min-w-[40px] min-h-[40px] rounded-md focus-visible:ring-2 focus-visible:ring-ring"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8" role="main">
        <div className="max-w-2xl mx-auto mb-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-serif font-black text-foreground mb-4">Track Any Flight Worldwide</h2>
            <p className="text-lg text-muted-foreground">
              Enter a flight number, callsign, or aircraft registration to get real-time tracking data
            </p>
          </div>

          <Card className="border-2 border-[var(--color-primary)]/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-[var(--color-primary)]/30 rounded-xl">
            <CardContent className="p-6">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors duration-200" />
                  <Input
                    placeholder="Enter flight number (e.g., UAL1409, DAL934, AS1154...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 h-12 text-lg !border-[var(--color-primary)]/20 focus:!ring-1 focus:!ring-[var(--color-primary)]/40 focus:!outline-none focus:!border-[var(--color-primary)]/40 transition-all duration-200 hover:!border-[var(--color-primary)]/25 focus-visible:!ring-1 focus-visible:!ring-[var(--color-primary)]/40 focus-visible:!ring-offset-0 !shadow-none rounded-lg"
                    aria-label="Flight search input"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="h-12 px-8 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-semibold transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:hover:scale-100 shadow-lg rounded-lg"
                  aria-label="Search for flight"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Search className="h-5 w-5 ml-1 mr-1" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {flightData && (
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-3xl font-sans font-semibold text-foreground mb-2 tracking-tight">
                    Flight {flightData.callsign}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    <span>{flightData.airline}</span>
                    <Separator orientation="vertical" className="h-4 hidden sm:block" />
                    <span>{flightData.aircraft}</span>
                    <Separator orientation="vertical" className="h-4 hidden sm:block" />
                    <span>{flightData.route}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BadgeStatus status={flightData.status} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 shadow-md hover:shadow-lg transition-all duration-300 border-border/50 hover:border-[var(--color-primary)]/20 rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="h-5 w-5 text-[var(--color-primary)]" />
                    Flight Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ProgressWithLabels
                    percentage={flightData.progress}
                    origin={flightData.origin}
                    destination={flightData.destination}
                  />

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Squawk</div>
                        <div className="text-lg font-bold text-foreground">{flightData.squawk}</div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Altitude
                        </div>
                        <div className="text-lg font-bold text-foreground">{flightData.position.altitude}</div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Ground Speed
                        </div>
                        <div className="text-lg font-bold text-foreground">{flightData.position.groundSpeed}</div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Track</div>
                        <div className="text-lg font-bold text-foreground flex items-center justify-center gap-1">
                          <Navigation className="h-4 w-4" />
                          {flightData.position.track}
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Vertical Speed
                        </div>
                        <div className="text-lg font-bold text-foreground">{flightData.position.verticalSpeed}</div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Position
                        </div>
                        <div className="text-sm font-bold text-foreground">
                          {flightData.position.lat}, {flightData.position.lon}
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-center items-center text-sm">
                      <span className="text-muted-foreground">
                        Last Update: <TimeAgo timestamp={flightData.lastUpdate} />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-border/50 hover:border-[var(--color-primary)]/20 rounded-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-[var(--color-primary)]" />
                      Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className="p-4 bg-secondary/10 rounded-lg hover:bg-secondary/20 transition-all duration-300 border border-transparent hover:border-[var(--color-primary)]/20">
                        <Gauge className="h-8 w-8 text-[var(--color-accent)] mx-auto mb-2 animate-pulse" />
                        <BadgeStatus status={flightData.status} className="mb-2" />
                        <p className="text-sm text-muted-foreground">Current Status</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-border/50 hover:border-[var(--color-primary)]/20 rounded-xl">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:translate-x-1 rounded-lg"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      View on Map
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start bg-transparent hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:translate-x-1 rounded-lg"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Flight History
                    </Button>

                    <Dialog open={jsonModalOpen} onOpenChange={setJsonModalOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start bg-transparent hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:translate-x-1 rounded-lg"
                        >
                          <Code className="h-4 w-4 mr-2" />
                          Raw JSON
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
                        <DialogHeader>
                          <DialogTitle className="flex items-center justify-between">
                            Raw Flight Data
                            <div className="flex items-center gap-2">
                              <div className="relative">
                                <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Filter JSON..."
                                  value={jsonFilter}
                                  onChange={(e) => setJsonFilter(e.target.value)}
                                  className="pl-8 w-48"
                                />
                              </div>
                              {jsonFilter && (
                                <Button variant="ghost" size="sm" onClick={() => setJsonFilter("")}>
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="overflow-auto max-h-[60vh]">
                          <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
                            <code>{filteredJson}</code>
                          </pre>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {!flightData && !isLoading && (
          <div className="text-center py-16" role="region" aria-label="Empty state">
            <div className="p-4 bg-muted/50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center hover:bg-muted/70 transition-all duration-300 hover:scale-105">
              <Plane className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Track Flights</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter a flight number above to get started with real-time tracking data, flight status, and detailed
              aircraft information. Press <kbd className="px-2 py-1 bg-muted rounded text-xs">/</kbd> to focus search.
            </p>
          </div>
        )}

        <MapShell />
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--color-primary)] rounded-lg shadow-lg">
                  <Plane className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-serif font-black text-foreground">FlightNerd</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Professional flight tracking and analytics platform for aviation enthusiasts and industry professionals.
              </p>
            </div>

            {/* Product Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Product</h4>
              <div className="space-y-2">
                <a
                  href="#"
                  className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                >
                  Flight Tracking
                </a>
                <br />
                <a
                  href="#"
                  className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                >
                  Live Map
                </a>
                <br />
                <a
                  href="#"
                  className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                >
                  Flight History
                </a>
                <br />
                <a
                  href="#"
                  className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                >
                  Aircraft Database
                </a>
                <br />
                <a
                  href="#"
                  className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                >
                  API Access
                </a>
              </div>
            </div>

            {/* Company Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Company</h4>
              <div className="space-y-2">
                <a
                  href="#"
                  className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                >
                  About Us
                </a>
                <br />
                <a
                  href="#"
                  className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                >
                  Careers
                </a>
                <br />
                <a
                  href="#"
                  className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                >
                  Press
                </a>
                <br />
                <a
                  href="#"
                  className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                >
                  Blog
                </a>
                <br />
                <a
                  href="#"
                  className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                >
                  Contact
                </a>
              </div>
            </div>

            {/* Support Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Support</h4>
              <div className="space-y-2">
                <a
                  href="#"
                  className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                >
                  Help Center
                </a>
                <br />
                <a
                  href="#"
                  className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                >
                  Documentation
                </a>
                <br />
                <a
                  href="#"
                  className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                >
                  Privacy Policy
                </a>
                <br />
                <a
                  href="#"
                  className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                >
                  Terms of Service
                </a>
                <br />
                <a
                  href="#"
                  className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                >
                  Status Page
                </a>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2024 FlightNerd. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a
                href="#"
                className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
              >
                Privacy
              </a>
              <a
                href="#"
                className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
              >
                Terms
              </a>
              <a
                href="#"
                className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
              >
                Cookies
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
