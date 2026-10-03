import { Inbox } from "lucide-react"

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
}

export function EmptyState({ 
  title = "No Data Found", 
  description = "There is no data to display for the current selection.",
  icon = <Inbox className="h-8 w-8 text-muted-foreground" />
}: EmptyStateProps) {
  return (
    <div className="flex h-full min-h-[200px] w-full flex-col items-center justify-center space-y-4 text-center p-8 border border-dashed rounded-lg">
      <div className="rounded-full bg-muted p-4">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>
      </div>
    </div>
  )
}
