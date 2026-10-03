import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { cn } from "@/utils/cn"

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  subtitle?: string
  trend?: string
  trendDirection?: "up" | "down" | "neutral"
  status?: "normal" | "warning" | "critical"
  className?: string
}

export function MetricCard({
  title,
  value,
  icon,
  subtitle,
  trend,
  trendDirection = "neutral",
  status = "normal",
  className,
}: MetricCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "warning":
        return "text-amber-600"
      case "critical":
        return "text-red-600"
      default:
        return "text-[#1D3557]"
    }
  }

  const getTrendColor = () => {
    if (trendDirection === "up") return "text-red-600"
    if (trendDirection === "down") return "text-green-600"
    return "text-[#727586]"
  }

  return (
    <Card className={cn("border-[#dadce0] bg-white rounded-2xl shadow-sm hover:shadow transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5">
        <CardTitle className="text-xs font-bold text-[#727586] uppercase tracking-wider">{title}</CardTitle>
        <div className="h-5 w-5 flex items-center justify-center">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-black tracking-tight", getStatusColor())}>{value}</div>
        {subtitle && (
          <p className="text-[11px] text-[#727586] font-medium mt-0.5 leading-tight">{subtitle}</p>
        )}
        {trend && (
          <p className={cn("text-xs mt-1 font-semibold", getTrendColor())}>
            {trendDirection === "up" ? "↑" : trendDirection === "down" ? "↓" : "→"} {trend}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
