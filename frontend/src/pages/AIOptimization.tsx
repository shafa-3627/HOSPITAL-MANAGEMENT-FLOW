import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { 
  Check, X, Sparkles, ArrowRight, Zap, RefreshCw, 
  Layers, CheckCircle2, AlertCircle, Clock, ShieldCheck, Building2
} from 'lucide-react'

interface RecommendationItem {
  id: number
  title: string
  description: string
  action_type: string
  expected_impact: string
  confidence: number
  affected_department: string | number
  status: string
  alert_id?: number | null
  reason?: string | null
  approved_at?: string | null
}

export default function AIOptimization() {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'all'>('pending')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null)

  const navigate = useNavigate()

  const fetchRecommendations = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get('/optimization')
      setRecommendations(res.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load optimization recommendations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const handleApply = async (id: number, title: string) => {
    setActionLoading(true)
    try {
      const res = await apiClient.post(`/optimization/apply/${id}`)
      setToast({
        message: res.data.message || `Optimization applied: "${title}". Ward capacity updated.`,
        type: 'success'
      })
      await fetchRecommendations()
    } catch (err: any) {
      setToast({
        message: `Failed to apply optimization: ${err.message}`,
        type: 'info'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDismiss = async (id: number, title: string) => {
    setActionLoading(true)
    try {
      const res = await apiClient.post(`/optimization/${id}/reject`)
      setToast({
        message: res.data.message || `Optimization dismissed: "${title}".`,
        type: 'info'
      })
      await fetchRecommendations()
    } catch (err: any) {
      setToast({
        message: `Failed to dismiss optimization: ${err.message}`,
        type: 'info'
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingState message="Calculating prescriptive hospital flow optimizations..." />
  if (error) return <ErrorState message={error} onRetry={fetchRecommendations} />

  const pendingRecs = recommendations.filter(r => r.status.toLowerCase() === 'pending')
  const approvedRecs = recommendations.filter(r => r.status.toLowerCase() === 'approved')
  const displayRecs = selectedTab === 'pending' ? pendingRecs : selectedTab === 'approved' ? approvedRecs : recommendations

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              AI Prescriptive Flow Optimization
            </h1>
            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
              Apex General Hospital
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Automated recommendations with expected impact and clinician decision approval
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchRecommendations} className="gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Prescriptions
          </Button>
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 text-xs shadow-sm" onClick={() => navigate('/app/digital-twin')}>
            <Layers className="h-3.5 w-3.5" /> Simulate in Twin
          </Button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in ${
          toast.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-slate-100 text-slate-800 border-slate-300'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Principle Banner */}
      <Card className="border-teal-200 dark:border-teal-900/60 bg-teal-50/40 dark:bg-teal-950/20 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-teal-600 text-white mt-0.5 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Human-in-the-Loop Governance
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                  AI Recommends. Human Decides.
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Each prescriptive optimization calculates expected bed gains and delay reductions. Applying an action executes ward staging and records an immutable entry in the hospital audit trail.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTab('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTab === 'pending'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending Clinical Review ({pendingRecs.length})
          </button>
          <button
            onClick={() => setSelectedTab('approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTab === 'approved'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Enacted Optimizations ({approvedRecs.length})
          </button>
          <button
            onClick={() => setSelectedTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTab === 'all'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({recommendations.length})
          </button>
        </div>

        <span className="text-xs text-slate-500">
          Showing {displayRecs.length} recommendations
        </span>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {displayRecs.length === 0 ? (
          <div className="col-span-2 p-12 text-center border border-dashed rounded-xl bg-slate-50 text-slate-500">
            {selectedTab === 'pending' ? 'No pending optimization recommendations. Hospital operations are currently balanced.' : 'No items found in this view.'}
          </div>
        ) : (
          displayRecs.map((rec) => {
            const isApproved = rec.status.toLowerCase() === 'approved'
            const isRejected = rec.status.toLowerCase() === 'rejected'

            return (
              <Card 
                key={rec.id} 
                className={`border shadow-sm flex flex-col justify-between transition-all ${
                  isApproved 
                    ? 'border-emerald-300 bg-emerald-50/20' 
                    : isRejected
                      ? 'border-slate-200 bg-slate-50/50 opacity-60'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-400'
                }`}
              >
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-50 text-teal-700'}`}>
                        <Zap className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                          {rec.title}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 capitalize">
                          Ward: {String(rec.affected_department)} • Action: {rec.action_type.replace('_', ' ')}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="text-right">
                      {isApproved ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ENACTED
                        </span>
                      ) : isRejected ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          DISMISSED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                          {Math.round((rec.confidence || 0.90) * 100)}% CONFIDENCE
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-3 flex-1">
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {rec.description}
                  </p>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border text-xs space-y-1">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Expected Clinical & Capacity Impact:
                    </div>
                    <div className="flex items-center gap-2 font-bold text-teal-700 dark:text-teal-400">
                      <ArrowRight className="h-3.5 w-3.5" />
                      <span>{rec.expected_impact}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-2">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 text-xs text-slate-500 hover:text-slate-700 gap-1"
                    onClick={() => navigate('/app/digital-twin')}
                  >
                    <Layers className="h-3.5 w-3.5" /> Simulate Outcome
                  </Button>

                  {!isApproved && !isRejected && (
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs border-slate-300 text-slate-600 hover:bg-slate-100"
                        onClick={() => handleDismiss(rec.id, rec.title)}
                        disabled={actionLoading}
                      >
                        <X className="h-3.5 w-3.5 mr-1" /> Dismiss
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white font-semibold gap-1 shadow-sm"
                        onClick={() => handleApply(rec.id, rec.title)}
                        disabled={actionLoading}
                      >
                        <Check className="h-3.5 w-3.5" /> Apply Optimization
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
