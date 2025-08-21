"use client"
import { useState, useEffect, useCallback } from "react"
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
  Moon,
  Sun,
  Settings,
  Code,
  Filter,
  X,
  ExternalLink,
  Save,
  RotateCcw,
} from "lucide-react"
import { useTheme } from "next-themes"

import { TimeAgo } from "@/components/ui/time-ago"
import { MapShell } from "@/components/ui/map-shell"
import { useHotkeys } from "@/hooks/use-hotkeys"
// useCooldown removed - now using per-flight cooldown only
// Removed fetchFlight import - now using direct FR24 API calls
import RouteProgress from "@/components/RouteProgress"
import { normalizeFlight, UiFlight } from '@/lib/normalizeFlight'



// Helper function to format time based on user preference
const formatTime = (timestamp: string | number, timezone: string) => {
  if (!timestamp) return 'N/A'
  
  try {
    const date = new Date(timestamp)
    if (timezone === 'local') {
      return date.toLocaleString()
    } else {
      return date.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
    }
  } catch (error) {
    return 'Invalid time'
  }
}

// Mock flight data with timestamp
const mockFlightData = {
  summary: {
    callsign: "THY8DE",
    fr24_id: "3bc32052",
    status: "ENROUTE"
  },
  lastPosition: {
    lat: 65.577,
    lon: -12.428,
    altitude: "FL369",
    groundSpeed: "454 kt",
    verticalSpeed: "+320 ft/min",
    track: "298°",
    squawk: "2731",
    type: "Boeing 777-300ER",
    timestamp: Date.now() - 120000
  },
  airlineName: "Turkish Airlines",
  originName: "Istanbul",
  destinationName: "New York",
  progressPercent: 67,
  success: true
}

export default function FlightLookup() {
      // Performance optimized
          // Performance fixed - v2.0.2
  
  // Footer link configuration - Easy to update!
  const footerLinks = {
    product: {
      "Flight Tracking": "#",
      "Live Map": "https://www.flightradar24.com/37.08,-78.99/2", 
      "Flight History": "https://www.flightradar24.com/data/flights",
      "Aircraft Database": "https://www.planespotters.net/",
      "API Access": "https://fr24api.flightradar24.com/docs/endpoints/overview"
    },
    company: {
      "About Us": "#",
      "Careers": "#",
      "Press": "#", 
      "Blog": "https://aviation.stackexchange.com/",
      "Contact": "https://mail.google.com/mail/?view=cm&to=skynerdinfo@gmail.com&su=Contact from SkyNerd"
    },
    support: {
      "Help Center": "https://www.faa.gov/",
      "Documentation": "https://fr24api.flightradar24.com/docs/getting-started",
      "Privacy Policy": "#",
      "Terms of Service": "#",
      "Status Page": "https://status.flightradar24.com/"
    },
    legal: {
      "Privacy": "#",
      "Terms": "#", 
      "Cookies": "#"
    }
  }

  const [searchQuery, setSearchQuery] = useState("")
  const [flightData, setFlightData] = useState<any>(null)
  const [rawApiResponse, setRawApiResponse] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showError, setShowError] = useState(false)
  const [autoRefresh] = useState<boolean>(true) // Always on for all users
  const [refreshInterval] = useState<30>(30) // Fixed at 30 seconds for all users
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null)
  const [timeSinceUpdate, setTimeSinceUpdate] = useState<string>('')
  const [isFromCache, setIsFromCache] = useState(false)
  const [showCacheNotification, setShowCacheNotification] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [dropdownTimeout, setDropdownTimeout] = useState<NodeJS.Timeout | null>(null)
  const [units, setUnits] = useState({ altitude: "ft", speed: "kt", distance: "nm" })
  const [timezone, setTimezone] = useState("utc") // "utc" or "local"

  const [jsonFilter, setJsonFilter] = useState("")
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  
  // Per-flight cooldown tracking (30s per specific flight)
  const [flightCooldowns, setFlightCooldowns] = useState<Map<string, number>>(new Map())
  
  // Settings state with pending changes tracking
  const [pendingUnits, setPendingUnits] = useState(units)
  const [pendingTimezone, setPendingTimezone] = useState(timezone)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Check if a specific flight is on cooldown
  const isFlightOnCooldown = (flight: string) => {
    const cooldownUntil = flightCooldowns.get(flight.toUpperCase()) || 0
    return Date.now() < cooldownUntil
  }
  
  // Check for unsaved changes
  const checkUnsavedChanges = useCallback(() => {
    const unitsChanged = JSON.stringify(pendingUnits) !== JSON.stringify(units)
    const timezoneChanged = pendingTimezone !== timezone
    
    setHasUnsavedChanges(unitsChanged || timezoneChanged)
  }, [pendingUnits, units, pendingTimezone, timezone])
  
  // Update pending settings and check for changes
  const updatePendingSetting = useCallback((type: string, value: any) => {
    switch (type) {
      case 'units':
        setPendingUnits(value)
        break
      case 'timezone':
        setPendingTimezone(value)
        break
    }
  }, [])
  
  // Save all pending settings
  const saveAllSettings = () => {
    // Save units
    setUnits(pendingUnits)
    localStorage.setItem("flight-units", JSON.stringify(pendingUnits))
    
    // Save timezone
    setTimezone(pendingTimezone)
    localStorage.setItem("flight-timezone", pendingTimezone)
    
    // Auto-refresh is always enabled at 30 seconds (no need to save)
    
    // Clear unsaved changes flag
    setHasUnsavedChanges(false)
    
    // Close settings
    setSettingsOpen(false)
  }
  
  // Reset pending settings to current values
  const resetPendingSettings = () => {
    setPendingUnits(units)
    setPendingTimezone(timezone)
    setHasUnsavedChanges(false)
  }
  
  // Get remaining cooldown time for a specific flight
  const getFlightCooldownMs = (flight: string) => {
    const cooldownUntil = flightCooldowns.get(flight.toUpperCase()) || 0
    return Math.max(0, cooldownUntil - Date.now())
  }
  
  // Start cooldown for a specific flight
  const startFlightCooldown = (flight: string, durationMs: number) => {
    const until = Date.now() + durationMs
    setFlightCooldowns(prev => {
      const newMap = new Map(prev)
      newMap.set(flight.toUpperCase(), until)
      return newMap
    })
  }

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [jsonModalOpen, setJsonModalOpen] = useState(false)

  // Dropdown management functions
  const openDropdownHandler = (dropdownId: string) => {
    // Close any currently open dropdown
    if (openDropdown && openDropdown !== dropdownId) {
      setOpenDropdown(null)
      if (dropdownTimeout) {
        clearTimeout(dropdownTimeout)
        setDropdownTimeout(null)
      }
    }
    
    // Open the new dropdown
    setOpenDropdown(dropdownId)
    
    // Set 5 second auto-close timeout
    const timeout = setTimeout(() => {
      setOpenDropdown(null)
      setDropdownTimeout(null)
    }, 5000)
    
    setDropdownTimeout(timeout)
  }
  
  const closeDropdownHandler = () => {
    setOpenDropdown(null)
    if (dropdownTimeout) {
      clearTimeout(dropdownTimeout)
      setDropdownTimeout(null)
    }
  }

  // Reset function to clear all data and return to initial state
  const resetPage = () => {
    setSearchQuery('')
    setFlightData(null)
    setRawApiResponse(null)
    setError(null)
    setShowError(false)
    setIsLoading(false)
    setLastUpdateTime(null)
    setTimeSinceUpdate('')
    setIsFromCache(false)
    setShowCacheNotification(false)
    setJsonModalOpen(false)
    setJsonFilter('')
    closeDropdownHandler()
    
    // Clear all flight-specific cooldowns
    setFlightCooldowns(new Map())
    
    // Scroll to top when resetting
    window.scrollTo(0, 0)
  }

  // Function to clear cooldown for a specific flight
  const clearFlightCooldown = (flight: string) => {
    setFlightCooldowns(prev => {
      const newMap = new Map(prev)
      newMap.delete(flight.toUpperCase())
      return newMap
    })
  }

  useEffect(() => {
    setMounted(true)
    
    // Force clear any existing error state
    setError(null)
    setShowError(false)
    
    // Scroll to top when page loads
    window.scrollTo(0, 0)
    
    // Set CSS variables for theme colors
    if (resolvedTheme) {
      document.documentElement.style.setProperty("--color-primary", "hsl(24, 95%, 53%)")
      document.documentElement.style.setProperty("--color-accent", "hsl(43, 96%, 56%)")
    }

    const savedUnits = localStorage.getItem("flight-units")
    if (savedUnits) {
      const parsedUnits = JSON.parse(savedUnits)
      setUnits(parsedUnits)
      setPendingUnits(parsedUnits)
    }
    
    const savedTimezone = localStorage.getItem("flight-timezone")
    if (savedTimezone) {
      setTimezone(savedTimezone)
      setPendingTimezone(savedTimezone)
    }

    const savedAutoRefresh = localStorage.getItem("flight-auto-refresh")
    if (savedAutoRefresh) {
      const parsedAutoRefresh = JSON.parse(savedAutoRefresh)
      // Auto-refresh is always enabled, no need to load from localStorage
    }
  }, [resolvedTheme])

  // Initialize theme colors when component mounts
  useEffect(() => {
    if (mounted && resolvedTheme) {
      document.documentElement.style.setProperty("--color-primary", "hsl(24, 95%, 53%)")
      document.documentElement.style.setProperty("--color-accent", "hsl(43, 96%, 56%)")
    }
  }, [mounted, resolvedTheme])

  // Auto-dismiss error after 4 seconds
  useEffect(() => {
    if (error) {
      // Start with showError false so it's off-screen
      setShowError(false)
      // Small delay to ensure it starts off-screen, then slide in
      const slideInTimer = setTimeout(() => {
        setShowError(true)
      }, 50)
      
      const dismissTimer = setTimeout(() => {
        setShowError(false)
        setTimeout(() => setError(null), 500) // Remove from DOM after exit animation
      }, 4000)
      
      return () => {
        clearTimeout(slideInTimer)
        clearTimeout(dismissTimer)
      }
    }
  }, [error])

  // Cleanup dropdown timeout on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeout) {
        clearTimeout(dropdownTimeout)
      }
    }
  }, [dropdownTimeout])

  // Clean up expired flight cooldowns periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setFlightCooldowns(prev => {
        const newMap = new Map()
        for (const [flight, until] of prev.entries()) {
          if (until > now) {
            newMap.set(flight, until)
          }
        }
        return newMap
      })
    }, 5000) // Clean up every 5 seconds

    return () => clearInterval(interval)
  }, [])

  // Debug: Log when flightData changes
  useEffect(() => {
    if (flightData) {
      console.log('🖥️ flightData changed to:', JSON.stringify(flightData, null, 2));
      console.log('🖥️ flightData.squawk:', flightData.squawk);
      console.log('🖥️ flightData.altitude:', flightData.altitude);
      console.log('🖥️ flightData.groundSpeed:', flightData.groundSpeed);
      console.log('🖥️ flightData.track:', flightData.track);
    }
  }, [flightData])

  // Check for unsaved changes whenever pending settings change
  useEffect(() => {
    checkUnsavedChanges()
  }, [checkUnsavedChanges])

  // Initialize pending settings when settings open
  useEffect(() => {
    if (settingsOpen) {
      setPendingUnits(units)
      setPendingTimezone(timezone)
      setHasUnsavedChanges(false)
    }
  }, [settingsOpen, units, timezone])

  // Define handleSearch before useEffects that depend on it
  const handleSearch = useCallback(async () => {
    
    const q = searchQuery.trim()
    if (!q) {
      return
    }
    
    // Check if this specific flight is on cooldown
    if (isFlightOnCooldown(q)) {
      const remainingSeconds = Math.ceil(getFlightCooldownMs(q) / 1000)
      setError(`You already searched for "${q}" recently. Please wait ${remainingSeconds} seconds before searching for this flight again.`)
      setTimeout(() => setError(null), 3000)
      return
    }
    
    // Scroll to top when starting a new search
    window.scrollTo(0, 0)
    
    setIsLoading(true)
    setError(null)
    
    // Auto-detect search type based on input format
    // Registration patterns: C-FJZD, N12345, G-ABCD, etc.
    // Callsign patterns: JZA360, SWA218, UAL123, RPA3566, etc.
    const isRegistration = /^[A-Z]{1,2}-[A-Z0-9]{1,5}$|^[A-Z]{1,2}[0-9]{1,6}[A-Z]$|^[A-Z]{1,2}[0-9]{1,6}$/.test(q)
    const searchType = isRegistration ? 'registration' : 'callsign'
    
    try {
              // Performance optimized
      // Fetch live flight data directly from FR24 API
      
      const liveResponse = await fetch(`https://fr24api.flightradar24.com/api/live/flight-positions/full?callsigns=${encodeURIComponent(q)}`, {
        headers: {
          'accept': 'application/json',
          'accept-version': 'v1',
          'authorization': 'Bearer 0198afd4-a5c1-72d7-9072-5a42113e733e|mjIwxXbV48fYINDljWplQtzAD2gXMQ3t1j9MzEP6ed77aa43'
        }
      });
      
      if (!liveResponse.ok) {
        const errorText = await liveResponse.text();
        
        setIsLoading(false);
        setTimeout(() => {
          setError('Flight not found or currently inactive')
        }, 50);
        setFlightData(null);
        setRawApiResponse(null);
        return;
      }
      
      const liveData = await liveResponse.json();
      
      // Store the raw API response for the Raw Data button
      setRawApiResponse(liveData);
      
      if (!liveData.data || liveData.data.length === 0) {
        setIsLoading(false);
        setTimeout(() => {
          setError('Flight not found or currently inactive')
        }, 50);
        setFlightData(null);
        return;
      }
      
      const liveFlight = liveData.data[0];
      
      // Create normalized flight data from live data
      const normalizedFlight: UiFlight = {
        callsign: liveFlight.callsign || q,
        number: liveFlight.callsign || q,
        airline: {
          name: liveFlight.airline || 'Unknown',
          iata: liveFlight.airline_code || '',
          icao: liveFlight.airline_code || ''
        },
        origin: {
          iata: liveFlight.orig_iata || '',
          icao: liveFlight.orig_iata || '',
          name: liveFlight.orig_name || 'Unknown'
        },
        destination: {
          iata: liveFlight.dest_iata || '',
          icao: liveFlight.dest_iata || '',
          name: liveFlight.dest_name || 'Unknown'
        },
        position: {
          lat: liveFlight.lat,
          lon: liveFlight.lon
        },
        status: {
          live: true
        },
        route: liveFlight.orig_iata && liveFlight.dest_iata ? `${liveFlight.orig_iata} → ${liveFlight.dest_iata}` : 'Unknown',
        source: 'FR24 Live',
        // Live telemetry data
        altitude: liveFlight.alt,
        groundSpeed: liveFlight.gspeed,
        track: liveFlight.track,
        verticalSpeed: liveFlight.vspeed,
        squawk: liveFlight.squawk,
        registration: liveFlight.reg,
        hex: liveFlight.hex,
        aircraft: liveFlight.type,
        // Additional live data
        live: {
          lat: liveFlight.lat,
          lon: liveFlight.lon,
          alt: liveFlight.alt,
          gspeed: liveFlight.gspeed,
          squawk: liveFlight.squawk,
          track: liveFlight.track,
          vspeed: liveFlight.vspeed,
          timestamp: liveFlight.timestamp,
          source: liveFlight.source,
          hex: liveFlight.hex,
          type: liveFlight.type,
          reg: liveFlight.reg,
          painted_as: liveFlight.painted_as,
          operating_as: liveFlight.operating_as,
          orig_iata: liveFlight.orig_iata,
          orig_icao: liveFlight.orig_iata,
          dest_iata: liveFlight.dest_iata,
          dest_icao: liveFlight.dest_iata,
          eta: liveFlight.eta
        }
      };
      
      // Set flight data
      setFlightData(normalizedFlight);
      setIsLoading(false);
      setLastUpdateTime(new Date());
      
      // Start per-flight cooldown (30s for this specific flight)
      startFlightCooldown(q, 30000)
    } catch (e: any) {
      setIsLoading(false) // Clear loading first
      // Small delay to ensure loading state is cleared before error shows
      setTimeout(() => {
        const msg = String(e?.message || '')
        if (/404/.test(msg)) {
          setError('Flight not found or currently inactive')
        } else if (/401|403/.test(msg)) {
          setError('Authentication problem with flight data service')
        } else if (/429/.test(msg)) {
          // Handle rate limiting with cooldown
          const retryAfter = e?.retryAfterSeconds || 10
          const flight = e?.flight
          
          if (flight) {
            // Per-flight rate limit
            startFlightCooldown(flight, retryAfter * 1000)
            setError(`You already searched for "${flight}" recently. Please wait ${retryAfter} seconds before searching for this flight again.`)
          } else {
            // General rate limit - just show error, no cooldown
            setError(`Rate limited - please wait ${retryAfter} seconds before trying again`)
          }
        } else if (/500|502|503/.test(msg)) {
          setError('Flight data service temporarily unavailable')
        } else {
          setError('Unable to search for flights at this time')
        }
      }, 50)
      setFlightData(null)
    }
  }, [searchQuery, flightCooldowns])

  // Hotkeys

  // Auto-refresh based on selected interval only when document is visible
  useEffect(() => {
    if (!autoRefresh || !flightData || !searchQuery.trim()) return

    const interval = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        
        // Check if this is a cache hit before making the request
        const currentCallsign = flightData?.callsign || ''
        const isCacheHit = searchQuery.trim() === currentCallsign
        
        if (isCacheHit) {
          // Show cache notification for auto-refresh cache hits
          setIsFromCache(true)
          setShowCacheNotification(true)
          setTimeout(() => setShowCacheNotification(false), 3000)
        }
        
        handleSearch()
      }
    }, refreshInterval * 1000) // Use selected interval

    return () => clearInterval(interval)
  }, [autoRefresh, flightData, searchQuery, refreshInterval, handleSearch])

  // Update the "time since last update" display every second
  useEffect(() => {
    if (!lastUpdateTime) return

    const interval = setInterval(() => {
      const now = new Date()
      const diff = now.getTime() - lastUpdateTime.getTime()
      const seconds = Math.floor(diff / 1000)
      
      if (seconds < 60) {
        setTimeSinceUpdate(`${seconds}s ago`)
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60)
        setTimeSinceUpdate(`${minutes}m ago`)
      } else {
        const hours = Math.floor(seconds / 3600)
        setTimeSinceUpdate(`${hours}h ago`)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [lastUpdateTime])



  useHotkeys([
    {
      key: "/",
      callback: () => {
        const searchInput = document.querySelector('input[placeholder*="flight"]') as HTMLInputElement
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





  // Fix: Extract speed from multiple possible locations in the flight data
  const extractFlightSpeed = (flight: any) => {
    if (!flight) return null
    
    // Try multiple sources for speed data
    const speed = 
      flight?.lastPosition?.speed ??           // Direct speed property
      flight?.lastPosition?.ground_speed ??    // Ground speed
      flight?.fr24?.data?.[0]?.speed ??       // FR24 data speed
      flight?.fr24?.data?.[0]?.ground_speed ?? // FR24 ground speed
      flight?.speed ??                         // Flight level speed
      flight?.ground_speed ??                  // Flight level ground speed
      null
      
    if (speed != null) {
      // FlightRadar24 gspeed is already in knots, no conversion needed
      return Math.round(speed)
    }
    
    return null
  }

  // Fix: Extract altitude from multiple possible locations
  const extractFlightAltitude = (flight: any) => {
    if (!flight) return null
    
    const altitude = 
      flight?.lastPosition?.altitude ??        // Direct altitude property
      flight?.lastPosition?.alt ??            // Alt property
      flight?.fr24?.data?.[0]?.altitude ??   // FR24 data altitude
      flight?.fr24?.data?.[0]?.alt ??        // FR24 alt property
      flight?.altitude ??                      // Flight level altitude
      flight?.alt ??                          // Flight level alt
      null
      
    if (altitude != null) {
      return Math.round(altitude) // Round to nearest foot
    }
    
    return null
  }

  const saveSettings = (newUnits: typeof units) => {
    setUnits(newUnits)
    localStorage.setItem("flight-units", JSON.stringify(newUnits))
  }

  const saveTimezone = (newTimezone: string) => {
    setTimezone(newTimezone)
    localStorage.setItem("flight-timezone", newTimezone)
  }

  const filteredJson = jsonFilter
    ? JSON.stringify(rawApiResponse, null, 2)
        .split("\n")
        .filter((line) => line.toLowerCase().includes(jsonFilter.toLowerCase()))
        .join("\n")
    : JSON.stringify(rawApiResponse, null, 2)



  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <header
        className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50 transition-all duration-300"
        role="banner"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="cursor-pointer transition-all duration-300 hover:scale-105"
                onClick={resetPage}
                title="Reset page"
              >
                <img
                  src={mounted && resolvedTheme === "dark" ? "/brand/logo-dark.png" : "/brand/logo-light.png"}
                  alt="SkyNerd Logo"
                  className="h-[50px] w-auto"
                />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-black text-foreground">SkyNerd.io</h1>
                <p className="text-sm text-muted-foreground">Real-time flight tracking & analytics</p>

              </div>
              {/* Cache notification - only shows when data comes from cache */}
              {showCacheNotification && (
                <Badge variant="secondary" className="ml-4 bg-orange-600 text-white animate-in slide-in-from-right duration-300">
                  Cached ✓
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const newTheme = theme === "dark" ? "light" : "dark";
                  setTheme(newTheme);
                }}
                aria-label="Toggle theme"
                className="hover:bg-muted/80 hover:bg-orange-100 dark:hover:bg-orange-500/20 hover:border-orange-300 dark:hover:border-orange-500 transition-all duration-200 min-w-[40px] min-h-[40px] rounded-md focus-visible:ring-2 focus-visible:ring-ring relative border border-transparent text-foreground hover:text-foreground"
              >
                {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-muted/80 hover:bg-orange-100 dark:hover:bg-orange-500/20 hover:border-orange-300 dark:hover:border-orange-500 transition-all duration-200 border border-transparent text-foreground hover:text-foreground"
                    aria-label="Open settings"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto scrollbar-hide">
                  <SheetHeader className="pb-6">
                    <SheetTitle className="text-2xl font-serif font-black text-foreground">Settings</SheetTitle>
                  </SheetHeader>

                  <div className="px-4 space-y-6 pb-6">
                    <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
                      <CardHeader className="pb-1">
                        <CardTitle className="text-lg font-semibold text-foreground">Units</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1 pt-0">
                        <div className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-all duration-300">
                          <label className="text-sm font-medium text-foreground">Altitude</label>
                          <Select
                            value={pendingUnits.altitude}
                            onValueChange={(value) => {
                              updatePendingSetting('units', { ...pendingUnits, altitude: value })
                              closeDropdownHandler()
                            }}
                            onOpenChange={(open) => {
                              if (open) {
                                openDropdownHandler('altitude')
                              } else {
                                closeDropdownHandler()
                              }
                            }}
                            open={openDropdown === 'altitude'}
                          >
                            <SelectTrigger className="w-[90px] h-7 bg-background border-border hover:border-[var(--color-primary)]/30 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-200">
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

                        <div className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-all duration-300">
                          <label className="text-sm font-medium text-foreground">Speed</label>
                          <Select
                            value={pendingUnits.speed}
                            onValueChange={(value) => {
                              updatePendingSetting('units', { ...pendingUnits, speed: value })
                              closeDropdownHandler()
                            }}
                            onOpenChange={(open) => {
                              if (open) {
                                openDropdownHandler('speed')
                              } else {
                                closeDropdownHandler()
                              }
                            }}
                            open={openDropdown === 'speed'}
                          >
                            <SelectTrigger className="w-[90px] h-7 bg-background border-border hover:border-[var(--color-primary)]/30 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-200">
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
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg hover:bg-muted/30 transition-all duration-300">
                          <div className="space-y-1">
                            <label className="text-sm font-medium text-foreground">Time Display</label>
                          </div>
                          <Select
                            value={pendingTimezone}
                            onValueChange={(value) => {
                              updatePendingSetting('timezone', value)
                              closeDropdownHandler()
                            }}
                            onOpenChange={(open) => {
                              if (open) {
                                openDropdownHandler('timezone')
                              } else {
                                closeDropdownHandler()
                              }
                            }}
                            open={openDropdown === 'timezone'}
                          >
                            <SelectTrigger className="w-[90px] h-9 bg-background border-border hover:border-[var(--color-primary)]/30 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all duration-200">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background border-border shadow-lg">
                              <SelectItem
                                value="utc"
                                className="hover:bg-[var(--color-primary)]/10 focus:bg-[var(--color-primary)]/10 text-foreground hover:text-foreground focus:text-foreground"
                              >
                                UTC
                              </SelectItem>
                              <SelectItem
                                value="local"
                                className="hover:bg-[var(--color-primary)]/10 focus:bg-[var(--color-primary)]/10 text-foreground hover:text-foreground focus:text-foreground"
                              >
                                Local
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  {/* End of added padding container */}
                  
                  {/* Save button positioned at bottom right */}
                  {hasUnsavedChanges && (
                    <div className="flex justify-end mt-4 px-4">
                      <Button
                        onClick={saveAllSettings}
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white font-medium transition-all duration-200 hover:shadow-lg"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8" role="main">
        <div className="max-w-2xl mx-auto mb-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-serif font-black text-foreground mb-4">Track Any Flight Worldwide</h2>
            <p className="text-lg text-muted-foreground">
              Enter a flight callsign or aircraft registration to get real-time tracking data
            </p>
          </div>

          <Card className="border-2 border-orange-500/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-orange-500/30 rounded-xl bg-card/50">
            <CardContent className="p-6">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors duration-200" />
                  <Input
                    type="text"
                    placeholder="Enter flight callsign or aircraft registration"
                    value={searchQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow letters, numbers, hyphens, and spaces for both callsigns and registrations
                      let cleanValue = value.replace(/[^A-Za-z0-9\-\s]/g, '').toUpperCase();
                      
                      // Limit to maximum 8 characters
                      if (cleanValue.length > 8) {
                        cleanValue = cleanValue.substring(0, 8);
                      }
                      
                      // Prevent typing more than one hyphen
                      const hyphenCount = (cleanValue.match(/-/g) || []).length;
                      if (hyphenCount > 1) {
                        // Remove the last character if it would create a second hyphen
                        cleanValue = cleanValue.slice(0, -1);
                      }
                      
                      setSearchQuery(cleanValue);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-10 h-12 text-lg !border-orange-500/20 focus:!ring-1 focus:!ring-orange-500/40 focus:!outline-none focus:!border-orange-500/40 transition-all duration-200 hover:!border-orange-500/25 focus-visible:!ring-1 focus-visible:!ring-orange-500/40 focus-visible:!ring-offset-0 shadow-none rounded-lg bg-background"
                    style={{ borderColor: 'rgb(249 115 22 / 0.2)' }}
                    aria-label="Flight callsign or aircraft registration search input"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || isFlightOnCooldown(searchQuery.trim())}
                  className="h-12 px-8 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 text-white font-semibold transition-all duration-200 hover:shadow-lg hover:scale-105 disabled:hover:scale-100 shadow-lg rounded-lg"
                  aria-label="Search for flight or aircraft"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : isFlightOnCooldown(searchQuery.trim()) ? (
                    <>
                      <Clock className="h-5 w-5 ml-1 mr-1" />
                      {searchQuery.trim()} - {Math.ceil(getFlightCooldownMs(searchQuery.trim()) / 1000)}s
                    </>
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

        {/* Error Message Display */}
        {error && (
          <div className={`fixed top-29 right-7 z-50 transition-all duration-500 ease-in-out transform scale-105 ${
            showError ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
          }`}>
            <div className="bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg border border-red-600 max-w-xs">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                <span className="font-medium text-sm">Flight not active</span>
              </div>
              <p className="text-red-100 text-xs mt-1">
                This flight isn't currently available, or has disappeared from our satellites... 
              </p>
            </div>
          </div>
        )}



        {flightData && (
          <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-foreground">
                      Flight {flightData.callsign || 'N/A'}
                    </h3>
                    {/* All status badges completely removed */}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    <span>{flightData.airline?.name || 'N/A'}</span>
                    <Separator orientation="vertical" className="h-4 hidden sm:block" />
                    <span>{flightData.aircraft || 'N/A'}</span>
                    <Separator orientation="vertical" className="h-4 hidden sm:block" />
                    <span>{flightData.route || 'N/A'}</span>

                  </div>
                </div>
                {/* Status badges removed */}
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
                  {/* Route Progress Bar */}
                  <div className="p-4 bg-muted/20 border-border/50 rounded-lg">
                    <RouteProgress flight={flightData} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Squawk</div>
                        <div className="text-lg font-bold text-foreground">{flightData.squawk || 'N/A'}</div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Altitude
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          {flightData.altitude ? `${flightData.altitude} ft` : 'N/A'}
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Ground Speed
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          {flightData.groundSpeed ? `${flightData.groundSpeed} kt` : 'N/A'}
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Track</div>
                        <div className="text-lg font-bold text-foreground flex items-center justify-center gap-1">
                          <Navigation className="h-4 w-4" />
                          {flightData.track ? `${flightData.track}°` : 'N/A'}
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Vertical Speed
                        </div>
                        <div className="text-lg font-bold text-foreground">
                          {flightData.verticalSpeed ? `${flightData.verticalSpeed} ft/min` : 'N/A'}
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Position
                        </div>
                        <div className="text-sm font-bold text-foreground">
                          {flightData.position?.lat && flightData.position?.lon 
                            ? `${flightData.position.lat.toFixed(3)}, ${flightData.position.lon.toFixed(3)}`
                            : 'N/A'
                          }
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* New data boxes for full API information */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Registration</div>
                        <div className="text-lg font-bold text-foreground">{flightData.registration || 'N/A'}</div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hex Code</div>
                        <div className="text-lg font-bold text-foreground font-mono">{flightData.hex || 'N/A'}</div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</div>
                        <div className="text-lg font-bold text-foreground">{flightData.source || 'N/A'}</div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Origin IATA</div>
                        <div className="text-lg font-bold text-foreground">{flightData.origin?.iata || 'N/A'}</div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Origin ICAO</div>
                        <div className="text-lg font-bold text-foreground">{flightData.origin?.icao || 'N/A'}</div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Destination IATA</div>
                        <div className="text-lg font-bold text-foreground">{flightData.destination?.iata || 'N/A'}</div>
                      </div>
                    </Card>

                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Destination ICAO</div>
                        <div className="text-lg font-bold text-foreground">{flightData.destination?.icao || 'N/A'}</div>
                      </div>
                    </Card>



                    <Card className="p-4 bg-muted/20 border-border/50 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:shadow-md rounded-lg">
                      <div className="text-center space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Operating As</div>
                        <div className="text-lg font-bold text-foreground">{flightData.operatingAs || 'N/A'}</div>
                      </div>
                    </Card>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-center items-center text-sm">
                      <span className="text-muted-foreground">
                        Last Update: <TimeAgo timestamp={lastUpdateTime || flightData.lastPosition?.timestamp || flightData.lastUpdate || Date.now()} />
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
                      <div className="p-6 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-accent)]/10 rounded-2xl border border-[var(--color-primary)]/20 hover:border-[var(--color-primary)]/40 transition-all duration-300 hover:shadow-lg">
                        <div className="flex items-center justify-center mb-4">
                          <Plane className="h-12 w-12 text-[var(--color-primary)] animate-pulse" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">
                          Flight {flightData.callsign || 'N/A'}
                        </h2>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div><span className="font-semibold">Airline:</span> <span>{flightData.airline?.name || 'N/A'}</span></div>
                          <div><span className="font-semibold">Aircraft:</span> <span>{flightData.aircraft || 'N/A'}</span></div>
                          <div><span className="font-semibold">Route:</span> <span>{flightData.route || 'N/A'}</span></div>
                        </div>
                                        {/* Status badge removed */}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-border/50 hover:border-[var(--color-primary)]/20 rounded-xl">
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-4 bg-muted/20 border-border/50 rounded-lg hover:border-[var(--color-primary)]/30 transition-all duration-200">
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-transparent hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:scale-102 rounded-lg text-foreground hover:text-foreground"
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        View on Map
                      </Button>
                    </div>
                    <div className="p-4 bg-muted/20 border-border/50 rounded-lg hover:border-[var(--color-primary)]/30 transition-all duration-200">
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-transparent hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:scale-102 rounded-lg text-foreground hover:text-foreground"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Flight History
                      </Button>
                    </div>

                    <Dialog open={jsonModalOpen} onOpenChange={setJsonModalOpen}>
                      <DialogTrigger asChild>
                        <div className="p-4 bg-muted/20 border-border/50 rounded-lg hover:border-[var(--color-primary)]/30 transition-all duration-200">
                          <Button
                            variant="outline"
                            className="w-full justify-start bg-transparent hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:scale-102 rounded-lg text-foreground hover:text-foreground"
                          >
                            <Code className="h-4 w-4 mr-2" />
                            Raw Data
                          </Button>
                        </div>
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
                    
                    <div className="p-4 bg-muted/20 border-border/50 rounded-lg hover:border-[var(--color-primary)]/30 transition-all duration-200">
                      <Button
                        variant="outline"
                        className="w-full justify-start bg-transparent hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/30 transition-all duration-200 hover:scale-102 rounded-lg text-foreground hover:text-foreground"
                        onClick={() => {
                          if (flightData?.summary?.callsign || flightData?.callsign) {
                            const callsign = flightData?.summary?.callsign || flightData?.callsign
                            const url = `https://www.flightradar24.com/${callsign}/`
                            
                            // Copy to clipboard as backup
                            try {
                              navigator.clipboard.writeText(url)
                            } catch (e) {
                              console.error('Failed to copy to clipboard:', e)
                            }
                            
                            // Create a temporary link element and click it (simulates user click)
                            const link = document.createElement('a')
                            link.href = url
                            link.target = '_blank'
                            link.rel = 'noopener noreferrer'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                          }
                        }}
                        disabled={!flightData?.summary?.callsign && !flightData?.callsign}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on FlightRadar24
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {!flightData && (
          <div className="text-center py-16" role="region" aria-label="Empty state">
            <div className="p-4 bg-muted/50 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center hover:bg-muted/70 transition-all duration-300 hover:scale-105">
              <Plane className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Ready to Track Flights</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter an active flight number or registration above to see real-time tracking data, flight status, and aircraft information. Press <kbd className="px-2 py-1 bg-muted rounded text-xs">/</kbd> to focus search.
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
                <img
                  src={mounted && resolvedTheme === "dark" ? "/brand/logo-dark.png" : "/brand/logo-light.png"}
                  alt="SkyNerd Logo"
                  className="h-10 w-auto"
                />
                <h3 className="text-xl font-serif font-black text-foreground">SkyNerd</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
              A flight tracking and data tracking platform built for me and my fellow avgeeks to use.
              </p>
            </div>

            {/* Product Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Product</h4>
              <div className="space-y-2">
                <div>
                  <span className="inline text-sm text-muted-foreground cursor-default">
                    Flight Tracking
                  </span>
                </div>
                <br />
                <div>
                  <a
                    href="https://www.flightradar24.com/37.08,-78.99/2"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                  >
                    Live Map
                  </a>
                </div>
                <br />
                <div>
                  <a
                    href="https://www.flightradar24.com/data/flights"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                  >
                    Flight History
                  </a>
                </div>
                <br />
                <div>
                  <a
                    href="https://www.planespotters.net/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                  >
                    Aircraft Database
                  </a>
                </div>
                <br />
                <div>
                  <a
                    href="https://fr24api.flightradar24.com/docs/endpoints/overview"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                  >
                    API Access
                  </a>
                </div>
              </div>
            </div>

            {/* Company Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Company</h4>
              <div className="space-y-2">
                {Object.entries(footerLinks.company).map(([name, url], index) => (
                  <div key={name}>
                    {url === "#" || url === "" ? (
                      <span className="inline text-sm text-muted-foreground cursor-default">
                        {name}
                      </span>
                    ) : (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                      >
                        {name}
                      </a>
                    )}
                    {index < Object.keys(footerLinks.company).length - 1 && <br />}
                  </div>
                ))}
              </div>
            </div>

            {/* Support Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Support</h4>
              <div className="space-y-2">
                {Object.entries(footerLinks.support).map(([name, url], index) => (
                  <div key={name}>
                    {url === "#" || url === "" ? (
                      <span className="inline text-sm text-muted-foreground cursor-default">
                        {name}
                      </span>
                    ) : (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                      >
                        {name}
                      </a>
                    )}
                    {index < Object.keys(footerLinks.support).length - 1 && <br />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© 2025 SkyNerd. All rights reserved.</p>
            <div className="flex items-center gap-6">
              {Object.entries(footerLinks.legal).map(([name, url]) => (
                url === "#" || url === "" ? (
                  <span key={name} className="inline text-sm text-muted-foreground cursor-default">
                    {name}
                  </span>
                ) : (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline text-sm text-muted-foreground hover:text-[var(--color-primary)] transition-colors duration-200"
                  >
                    {name}
                  </a>
                )
              ))}
            </div>
          </div>
          

        </div>
      </footer>
    </div>
  )
}
