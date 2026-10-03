import { Loader2 } from "lucide-react"

export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
