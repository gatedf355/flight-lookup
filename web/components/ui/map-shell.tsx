"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"

export function MapShell() {
  return (
    <Card className="hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Live Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
          <div className="text-center space-y-2">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">Map integration coming soon</p>
            <p className="text-xs text-muted-foreground">TODO: Implement map view</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
