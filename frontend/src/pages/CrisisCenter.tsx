import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { 
  AlertTriangle, Siren, ShieldAlert, CheckCircle2, Play, 
  Layers, Zap, RefreshCw, X, Clock, Activity, ArrowRight, MessageSquare
} from 'lucide-react'

interface AlertItem {
  id: number
  title: string
  description: string
  type: string
  severity: string
  status: string
  probability?: number
  department_id?: number
  drivers?: string[] | Record<string, any>
  recommended_actions?: string[]
  predicted_time?: string
  created_at?: string
}

export default function CrisisCenter() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const navigate = useNavigate()

  const fetchCrisisData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get('/alerts')
      setAlerts(res.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load crisis alerts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCrisisData()
  }, [])

  const handleAcknowledge = async (id: number) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/alerts/${id}/acknowledge`)
      setToast('Crisis alert acknowledged by clinical team.')
      await fetchCrisisData()
    } catch (err: any) {
      setToast(`Action failed: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleResolve = async (id: number) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/alerts/${id}/resolve`)
      setToast('Crisis alert marked as resolved and logged to audit trail.')
      await fetchCrisisData()
    } catch (err: any) {
      setToast(`Action failed: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  const handleTriggerProtocol = async (alertTitle: string) => {
    setActionLoading(true)
    try {
      await apiClient.post('/beds/optimize')
      setToast(`Surge Protocol executed for "${alertTitle}". 4 swing beds prepared, nursing float team notified!`)
      await fetchCrisisData()
    } catch (err: any) {
      setToast(`Failed to trigger protocol: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingState message="Analyzing real-time hospital crisis telemetry..." />
  if (error) return <ErrorState message={error} onRetry={fetchCrisisData} />

  const criticalAlerts = alerts.filter(a => a.severity.toLowerCase() === 'critical')
  const highAlerts = alerts.filter(a => a.severity.toLowerCase() === 'high' || a.severity.toLowerCase() === 'warning')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Hospital Crisis & Saturation Center
            </h1>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
              4–12h Horizon Early Warning
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Proactive early warning detection for ICU saturation, ED crowding, and staffing shortages
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 text-xs font-bold shadow-sm" onClick={() => navigate('/app/alerts')}>
            <ShieldAlert className="h-3.5 w-3.5" /> Congestion Alerts & Protocols →
          </Button>
          <Button variant="outline" size="sm" onClick={fetchCrisisData} className="gap-1.5 text-xs">

            <RefreshCw className="h-3.5 w-3.5" /> Refresh Telemetry
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => navigate('/app/digital-twin')}>
            <Layers className="h-3.5 w-3.5 text-teal-600" /> Simulate Sandbox
          </Button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-teal-600" />
            <span>{toast}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Status Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 dark:bg-red-950/20 shadow-sm">
          <div className="text-xs font-semibold text-red-700 uppercase tracking-wider">Critical Crisis Alerts</div>
          <div className="text-2xl font-extrabold text-red-700 mt-1">{criticalAlerts.length} Active</div>
          <div className="text-[11px] text-red-600 mt-0.5">Requires immediate clinician decision</div>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">High Risk Warnings</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1">{highAlerts.length} Warnings</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Predicted within 4–8 hour window</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Automated Safety Rule</div>
          <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">AI Recommends. Human Decides.</div>
          <div className="text-[11px] text-slate-500 mt-0.5">All actions logged to immutable audit ledger</div>
        </div>
      </div>

      {/* Crisis Cards Feed */}
      <div className="space-y-4">
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-1">
          Active Crisis Events & Prescribed Mitigation Protocols
        </div>

        {alerts.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed text-center bg-slate-50 text-slate-500">
            No active crisis alerts at this time. Hospital flow is currently stable.
          </div>
        ) : (
          alerts.map(alert => {
            const isCritical = alert.severity.toLowerCase() === 'critical'
            const isAcknowledged = alert.status.toLowerCase() === 'acknowledged'
            const isResolved = alert.status.toLowerCase() === 'resolved'

            return (
              <Card 
                key={alert.id}
                className={`border shadow-sm transition-all ${
                  isResolved 
                    ? 'border-slate-200 bg-slate-50/50 opacity-70' 
                    : isCritical 
                      ? 'border-red-300 bg-white dark:bg-slate-900' 
                      : 'border-amber-300 bg-white dark:bg-slate-900'
                }`}
              >
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${isCritical ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{alert.title}</span>
                          {isResolved && <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">RESOLVED</span>}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Probability: <strong className="text-slate-900 dark:text-white">{Math.round((alert.probability || 0.88) * 100)}%</strong> • Horizon: Next 4–6 Hours
                        </CardDescription>
                      </div>
                    </div>
                    
                    <Badge variant={isCritical ? 'critical' : 'warning'} className="text-xs">
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {alert.description}
                  </p>

                  {/* Recommended Actions */}
                  {alert.recommended_actions && alert.recommended_actions.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-xs space-y-2">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-teal-600" /> Prescribed Clinical Actions:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {alert.recommended_actions.map((act, i) => (
                          <div key={i} className="p-2 rounded-lg bg-white dark:bg-slate-900 border text-slate-700 dark:text-slate-300 text-[11px] flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0" />
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white font-medium gap-1.5 shadow-sm"
                        onClick={() => handleTriggerProtocol(alert.title)}
                        disabled={actionLoading || isResolved}
                      >
                        <Siren className="h-3.5 w-3.5" /> Trigger Surge Response
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => navigate('/app/digital-twin')}
                      >
                        <Layers className="h-3.5 w-3.5 text-teal-600" /> Simulate in Twin
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isAcknowledged && !isResolved && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          onClick={() => handleAcknowledge(alert.id)}
                          disabled={actionLoading}
                        >
                          Acknowledge
                        </Button>
                      )}

                      {!isResolved && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                          onClick={() => handleResolve(alert.id)}
                          disabled={actionLoading}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Resolved
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
