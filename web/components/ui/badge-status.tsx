import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface BadgeStatusProps {
  status: string
  className?: string
}

const statusConfig = {
  ENROUTE: { color: "bg-amber-500 text-amber-50 border-amber-600", label: "En Route" },
  LANDED: { color: "bg-orange-500 text-orange-50 border-orange-600", label: "Landed" },
  INACTIVE: { color: "bg-slate-500 text-slate-50 border-slate-600", label: "Inactive" },
  UNKNOWN: { color: "bg-gray-500 text-gray-50 border-gray-600", label: "Unknown" },
  ERROR: { color: "bg-rose-500 text-rose-50 border-rose-600", label: "Error" },
}

export function BadgeStatus({ status, className }: BadgeStatusProps) {
  // Don't show badge for UNKNOWN status
  if (status === 'UNKNOWN') {
    return null
  }
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ERROR

  return <Badge className={cn("px-3 py-1 text-sm font-semibold border", config.color, className)}>{config.label}</Badge>
}
