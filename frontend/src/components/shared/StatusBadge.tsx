import { Badge } from "@/components/ui/Badge"

export type StatusType = "normal" | "warning" | "critical" | "info" | "success"

interface StatusBadgeProps {
  status: StatusType
  label?: string
  className?: string
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      case "normal":
      case "success":
        return "success"
      case "warning":
        return "warning"
      case "critical":
        return "critical"
      case "info":
        return "info"
      default:
        return "default"
    }
  }

  const text = label || status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <Badge variant={getVariant()} className={className}>
      {text}
    </Badge>
  )
}
