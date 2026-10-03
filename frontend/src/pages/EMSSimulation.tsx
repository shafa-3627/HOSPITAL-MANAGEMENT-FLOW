import { Siren, Radio } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"

export default function EMSSimulation() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Siren className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">EMS Inbound Feed</h1>
        </div>
        <Badge variant="warning" className="animate-pulse flex gap-1 items-center"><Radio className="h-3 w-3" /> Simulation Mode</Badge>
      </div>

      <div className="grid gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader className="py-3 flex flex-row justify-between items-center bg-muted/20 border-b">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                Ambulance Unit {200 + i} <Badge variant="outline">ETA: {15 * i} mins</Badge>
              </CardTitle>
              <Badge variant={i === 1 ? 'critical' : 'warning'}>Priority {i}</Badge>
            </CardHeader>
            <CardContent className="py-4">
              <div className="grid grid-cols-2 text-sm gap-2">
                <div><span className="text-muted-foreground block text-xs">Patient Info</span>55yo M, Chest Pain</div>
                <div><span className="text-muted-foreground block text-xs">Vitals</span>HR 110, BP 150/90, O2 94%</div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="default">Accept & Route to Resus</Button>
                <Button size="sm" variant="outline" className="text-destructive">Divert (Capacity Full)</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button className="w-full" variant="outline">Simulate New Inbound</Button>
    </div>
  )
}
