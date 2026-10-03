import { Link } from "react-router-dom"
import { Button } from "@/components/ui/Button"

export default function NotFound() {
  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col items-center justify-center text-center space-y-4">
      <h1 className="text-8xl font-bold text-primary/20">404</h1>
      <h2 className="text-2xl font-semibold">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md">The page you are looking for doesn't exist or has been moved.</p>
      <Button asChild className="mt-4">
        <Link to="/">Return to Dashboard</Link>
      </Button>
    </div>
  )
}
