"use client"

import { useState, useEffect } from "react"

export function useRelativeTime(timestamp: string | number) {
  const [relativeTime, setRelativeTime] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const updateRelativeTime = () => {
      const now = Date.now()
      const time = typeof timestamp === "string" ? new Date(timestamp).getTime() : timestamp
      const diff = now - time

      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)

      if (days > 0) {
        setRelativeTime(`${days}d ago`)
      } else if (hours > 0) {
        setRelativeTime(`${hours}h ago`)
      } else if (minutes > 0) {
        setRelativeTime(`${minutes}m ago`)
      } else {
        setRelativeTime(`${seconds}s ago`)
      }
    }

    updateRelativeTime()
    const interval = setInterval(updateRelativeTime, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [timestamp, mounted])

  // Return empty string during SSR to prevent hydration mismatch
  if (!mounted) return ""
  
  return relativeTime
}
