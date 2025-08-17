"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react"

interface HealthStatus {
  ok: boolean;
  ts: number;
  responseTime?: number;
}

export default function HealthPage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const checkHealth = async () => {
    setIsLoading(true)
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/health')
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      if (response.ok) {
        const data = await response.json()
        setHealthStatus({ ...data, responseTime })
      } else {
        setHealthStatus({ ok: false, ts: Date.now(), responseTime })
      }
    } catch (error) {
      setHealthStatus({ ok: false, ts: Date.now(), responseTime: Date.now() - startTime })
    } finally {
      setIsLoading(false)
      setLastCheck(new Date())
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">API Health Check</h1>
          <p className="text-lg text-muted-foreground">
            Monitor the status of the FlightLookup backend API
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Backend API Status</CardTitle>
              <Button onClick={checkHealth} disabled={isLoading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {healthStatus ? (
              <>
                <div className="flex items-center gap-3">
                  {healthStatus.ok ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-500" />
                  )}
                  <div>
                    <span className="font-semibold">
                      Status: {healthStatus.ok ? 'Healthy' : 'Unhealthy'}
                    </span>
                    <Badge 
                      variant={healthStatus.ok ? "default" : "destructive"}
                      className="ml-2"
                    >
                      {healthStatus.ok ? 'OK' : 'ERROR'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Response Time:</span>
                    <span className="ml-2 font-mono">
                      {healthStatus.responseTime}ms
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Timestamp:</span>
                    <span className="ml-2 font-mono">
                      {new Date(healthStatus.ts).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {healthStatus.responseTime && (
                  <div className="mt-4">
                    <span className="text-sm text-muted-foreground">Performance:</span>
                    <div className="mt-2">
                      {healthStatus.responseTime < 100 ? (
                        <Badge variant="default" className="bg-green-500">Excellent</Badge>
                      ) : healthStatus.responseTime < 500 ? (
                        <Badge variant="default" className="bg-yellow-500">Good</Badge>
                      ) : (
                        <Badge variant="destructive">Slow</Badge>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Checking health status...</p>
              </div>
            )}

            {lastCheck && (
              <div className="pt-4 border-t text-sm text-muted-foreground">
                Last checked: {lastCheck.toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            ← Back to Flight Lookup
          </Button>
        </div>
      </div>
    </div>
  )
}
