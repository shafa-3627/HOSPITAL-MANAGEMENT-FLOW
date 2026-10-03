import { AlertTriangle, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/Button"

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = "An error occurred while loading data.", onRetry }: ErrorStateProps) {
  return (
    <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center space-y-4 text-center">
      <div className="rounded-full bg-destructive/10 p-3">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <p className="text-sm font-medium text-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  )
}
