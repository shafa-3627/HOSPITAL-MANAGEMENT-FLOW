import React, { useState, useEffect } from 'react'
import { apiClient } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Play, Settings2, Database, TrendingDown, TrendingUp, Layers, CheckCircle, ArrowRight, Activity, Users, BedDouble, RefreshCw } from 'lucide-react'

interface Preset {
  id: string
  name: string
  description: string
}

interface DeptMetric {
  occupancy: number
  occupied: number
  total: number
  available: number
}

interface StateSummary {
  total_occupancy: number
  waiting_patients: number
  avg_workload: number
  crisis_risk: string
  departments: Record<string, DeptMetric>
}

interface SimulationResponse {
  before: StateSummary
  after: StateSummary
  scenario: string
  simulation_id: number
}

export default function DigitalTwin() {
  const [presets, setPresets] = useState<Preset[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string>('normal')
  const [params, setParams] = useState({
    additional_beds: 4,
    additional_staff: 2,
    expected_discharges: 6,
    arrival_surge: 15
  })
  const [result, setResult] = useState<SimulationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPresets = async () => {
    try {
      const res = await apiClient.get('/simulation/presets')
      setPresets(res.data)
    } catch (err: any) {
      console.error('Failed to load simulation presets', err)
    } finally {
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    fetchPresets()
  }, [])

  const handleRun = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.post('/simulation/run', {
        scenario: selectedPreset,
        ...params
      })
      setResult(res.data)
    } catch (err: any) {
      setError(err.message || 'Simulation execution failed')
    } finally {
      setLoading(false)
    }
  }

  const handleParamChange = (key: string, value: string) => {
    setParams(prev => ({ ...prev, [key]: parseInt(value) || 0 }))
  }

  if (initialLoading) return <LoadingState message="Initializing Digital Twin virtual replica..." />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Hospital Digital Twin</h1>
            <Badge variant="outline" className="border-primary/30 text-primary text-xs">M/M/c Queue Sandbox</Badge>
          </div>
          <p className="text-muted-foreground text-sm">Deterministic simulation engine to test operational surges and interventions risk-free</p>
        </div>
        <Button onClick={handleRun} disabled={loading} className="gap-2 font-semibold shadow-md">
          <Play className="w-4 h-4" />
          {loading ? 'Simulating Replica...' : 'Run Simulation'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-primary" />
              Scenario & Parameters
            </CardTitle>
            <CardDescription className="text-xs">Adjust parameters to simulate hospital response</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Scenario Preset</Label>
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {presets.map(p => (
                  <option key={p.id} value={p.id}>{p.name} - {p.description}</option>
                ))}
                <option value="custom">Custom Parameters</option>
              </select>
            </div>

            <div className="space-y-3.5 pt-3 border-t">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-xs">Additional Temporary Beds</Label>
                  <span className="font-semibold text-primary">+{params.additional_beds}</span>
                </div>
                <Input 
                  type="number" 
                  min={0} 
                  max={50}
                  value={params.additional_beds} 
                  onChange={(e) => handleParamChange('additional_beds', e.target.value)} 
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-xs">Additional On-Call Staff</Label>
                  <span className="font-semibold text-primary">+{params.additional_staff}</span>
                </div>
                <Input 
                  type="number" 
                  min={0} 
                  max={25}
                  value={params.additional_staff} 
                  onChange={(e) => handleParamChange('additional_staff', e.target.value)} 
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-xs">Expedited Discharges (Next 4h)</Label>
                  <span className="font-semibold text-green-600">+{params.expected_discharges}</span>
                </div>
                <Input 
                  type="number" 
                  min={0} 
                  max={30}
                  value={params.expected_discharges} 
                  onChange={(e) => handleParamChange('expected_discharges', e.target.value)} 
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <Label className="text-xs">Simulated Arrival Surge (%)</Label>
                  <span className="font-semibold text-destructive">+{params.arrival_surge}%</span>
                </div>
                <Input 
                  type="number" 
                  min={0} 
                  max={100}
                  value={params.arrival_surge} 
                  onChange={(e) => handleParamChange('arrival_surge', e.target.value)} 
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <Button className="w-full text-xs font-semibold gap-2 mt-2" onClick={handleRun} disabled={loading}>
              <Play className="w-3.5 h-3.5" />
              {loading ? 'Running Queue Simulation...' : 'Execute What-If Model'}
            </Button>
            {error && <p className="text-xs text-destructive mt-2">{error}</p>}
          </CardContent>
        </Card>

        {/* Results Column */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Twin Metrics: Before vs. After Intervention
                </CardTitle>
                <CardDescription className="text-xs">Deterministic state projection on hospital capacity and waiting times</CardDescription>
              </div>
              {result && (
                <Badge variant="outline" className="text-xs bg-primary/5 text-primary border-primary/20">
                  Simulation #{result.simulation_id}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {!result ? (
              <div className="h-72 flex flex-col items-center justify-center text-muted-foreground border border-dashed rounded-xl p-8 text-center bg-muted/20">
                <Database className="w-10 h-10 mb-3 text-muted-foreground/40" />
                <h4 className="font-semibold text-sm text-foreground">Digital Twin Ready</h4>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Select a scenario preset or adjust the temporary capacity parameters on the left, then click &quot;Execute What-If Model&quot; to project outcomes.
                </p>
                <Button size="sm" variant="outline" onClick={handleRun} className="mt-4 text-xs gap-1.5">
                  <Play className="w-3.5 h-3.5" /> Run Default Scenario
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 3 Key Delta Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Occupancy Card */}
                  <div className="rounded-xl border bg-card p-3.5 shadow-sm space-y-1">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase">Hospital Occupancy</div>
                    <div className="flex items-baseline justify-between mt-1">
                      <div className="text-lg font-bold text-foreground">
                        {result.before.total_occupancy}% <span className="text-xs font-normal text-muted-foreground">→</span> <span className="text-primary">{result.after.total_occupancy}%</span>
                      </div>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        result.after.total_occupancy <= result.before.total_occupancy 
                          ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' 
                          : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      }`}>
                        {result.after.total_occupancy - result.before.total_occupancy > 0 ? '+' : ''}
                        {(result.after.total_occupancy - result.before.total_occupancy).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* ED Queue Card */}
                  <div className="rounded-xl border bg-card p-3.5 shadow-sm space-y-1">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase">ED Waiting Queue</div>
                    <div className="flex items-baseline justify-between mt-1">
                      <div className="text-lg font-bold text-foreground">
                        {result.before.waiting_patients} <span className="text-xs font-normal text-muted-foreground">→</span> <span className="text-primary">{result.after.waiting_patients} pts</span>
                      </div>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        result.after.waiting_patients <= result.before.waiting_patients 
                          ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' 
                          : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      }`}>
                        {result.after.waiting_patients - result.before.waiting_patients > 0 ? '+' : ''}
                        {result.after.waiting_patients - result.before.waiting_patients} pts
                      </span>
                    </div>
                  </div>

                  {/* Staff Workload Card */}
                  <div className="rounded-xl border bg-card p-3.5 shadow-sm space-y-1">
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase">Avg Staff Workload</div>
                    <div className="flex items-baseline justify-between mt-1">
                      <div className="text-lg font-bold text-foreground">
                        {result.before.avg_workload} <span className="text-xs font-normal text-muted-foreground">→</span> <span className="text-primary">{result.after.avg_workload}/100</span>
                      </div>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                        result.after.avg_workload <= result.before.avg_workload 
                          ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' 
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300'
                      }`}>
                        {result.after.avg_workload - result.before.avg_workload > 0 ? '+' : ''}
                        {(result.after.avg_workload - result.before.avg_workload).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Department Capacity Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Projected Ward Utilization Comparison
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(result.after.departments || {}).map(([deptType, afterMetric]) => {
                      const beforeMetric = result.before.departments?.[deptType] || afterMetric
                      return (
                        <div key={deptType} className="p-3 rounded-lg border bg-muted/30 space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{deptType} Department</span>
                            <span className="text-foreground">
                              {beforeMetric.occupancy}% <span className="text-muted-foreground font-normal">→</span> <strong className="text-primary">{afterMetric.occupancy}%</strong>
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <div className="text-[10px] text-muted-foreground mb-0.5">Current: {beforeMetric.occupied}/{beforeMetric.total} beds</div>
                              <Progress value={beforeMetric.occupancy} className="h-1.5 bg-muted" />
                            </div>
                            <div>
                              <div className="text-[10px] text-muted-foreground mb-0.5">Projected: {afterMetric.occupied}/{afterMetric.total} beds</div>
                              <Progress value={afterMetric.occupancy} className="h-1.5 [&>div]:bg-primary" />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
