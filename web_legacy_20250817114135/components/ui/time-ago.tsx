"use client"

import { useRelativeTime } from "@/hooks/use-relative-time"

interface TimeAgoProps {
  timestamp: string | number
  className?: string
}

export function TimeAgo({ timestamp, className }: TimeAgoProps) {
  const relativeTime = useRelativeTime(timestamp)

  return (
    <span className={className} title={new Date(timestamp).toLocaleString()}>
      {relativeTime}
    </span>
  )
}
