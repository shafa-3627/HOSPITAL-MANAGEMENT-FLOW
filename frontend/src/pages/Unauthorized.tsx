import { Link } from "react-router-dom"
import { Button } from "@/components/ui/Button"
import { ShieldAlert } from "lucide-react"

export default function Unauthorized() {
  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center text-center space-y-4">
      <ShieldAlert className="h-16 w-16 text-destructive mb-2" />
      <h2 className="text-2xl font-semibold text-destructive">Access Denied</h2>
      <p className="text-muted-foreground max-w-md">You do not have the required permissions to view this module.</p>
      <Button asChild className="mt-4">
        <Link to="/">Return to Dashboard</Link>
      </Button>
    </div>
  )
}
