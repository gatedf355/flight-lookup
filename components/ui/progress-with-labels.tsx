import { cn } from "@/lib/utils"

interface ProgressWithLabelsProps {
  percentage: number
  origin: string
  destination: string
  className?: string
}

export function ProgressWithLabels({ percentage, origin, destination, className }: ProgressWithLabelsProps) {
  if (percentage === null || percentage === undefined) {
    return null
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-muted-foreground">Route Progress</span>
        <span className="text-sm font-semibold text-[var(--color-primary)]">{percentage}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] rounded-full transition-all duration-1000 ease-out relative"
          style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
        >
          <div className="absolute right-0 top-0 h-full w-1 bg-white/50 animate-pulse"></div>
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{origin}</span>
        <span>Current Position</span>
        <span>{destination}</span>
      </div>
    </div>
  )
}
