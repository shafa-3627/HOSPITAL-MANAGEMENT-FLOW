import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { 
  Filter, AlertTriangle, Clock, ArrowRight, Zap, RefreshCw, 
  CheckCircle2, Layers, GitBranch, X
} from 'lucide-react'

interface BottleneckItem {
  id: string
  rank: number
  transition: string
  severity: string
  current_delay_mins: number
  predicted_delay_mins: number
  queue_length: number
  root_cause: string
  prescribed_fix: string
}

const BOTTLENECKS: BottleneckItem[] = [
  {
    id: 'b1',
    rank: 1,
    transition: 'Emergency Department → ICU Inpatient Admission',
    severity: 'critical',
    current_delay_mins: 58,
    predicted_delay_mins: 92,
    queue_length: 12,
    root_cause: 'ICU ward at 92% occupancy with 0 prepared swing beds ready for transfer.',
    prescribed_fix: 'Expedite discharge review for 3 stable ICU stepdown patients to General Ward.'
  },
  {
    id: 'b2',
    rank: 2,
    transition: 'Clinical Triage → Diagnostic Imaging (CT / Labs)',
    severity: 'high',
    current_delay_mins: 38,
    predicted_delay_mins: 55,
    queue_length: 18,
    root_cause: 'High trauma arrival volume during afternoon shift changeover.',
    prescribed_fix: 'Prioritize fast-track lab orders and dedicate CT scanner 2 to emergency priority.'
  },
  {
    id: 'b3',
    rank: 3,
    transition: 'General Ward Discharge → Bed Sanitization Turnover',
    severity: 'medium',
    current_delay_mins: 42,
    predicted_delay_mins: 48,
    queue_length: 8,
    root_cause: 'Housekeeping team bottleneck across 3rd floor surgical ward.',
    prescribed_fix: 'Deploy environmental services float staff to prep ready beds.'
  },
  {
    id: 'b4',
    rank: 4,
    transition: 'Post-Anesthesia Recovery (PACU) → General Surgical Ward',
    severity: 'medium',
    current_delay_mins: 28,
    predicted_delay_mins: 35,
    queue_length: 5,
    root_cause: 'Pending physician sign-off on postoperative pain protocol.',
    prescribed_fix: 'Notify on-call surgical resident for expedited digital chart review.'
  }
]

export default function BottleneckDetection() {
  const [bottlenecks, setBottlenecks] = useState<BottleneckItem[]>(BOTTLENECKS)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleApplyFix = async (item: BottleneckItem) => {
    setActionLoading(true)
    try {
      await apiClient.post('/beds/optimize')
      setToast(`Optimization fix applied: "${item.prescribed_fix}". Audit log updated.`)
    } catch (err: any) {
      setToast(`Failed to apply fix: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Hospital Bottleneck Radar & Choke Points
            </h1>
            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
              Live Queue Analysis
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time identification of patient transit delays between triage, diagnostics, wards, and discharge
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 text-xs shadow-sm" onClick={() => navigate('/app/digital-twin')}>
            <Layers className="h-3.5 w-3.5" /> Simulate in Twin
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 dark:bg-red-950/20 shadow-sm">
          <div className="text-xs font-semibold text-red-700 uppercase tracking-wider">Primary Choke Point</div>
          <div className="text-lg font-bold text-red-800 mt-1">ED → ICU Admission</div>
          <div className="text-[11px] text-red-600 mt-0.5">58 min current delay (Predicted +34m)</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Delayed Patients</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">43 Patients</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across 4 operational transitions</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Estimated Recovery Gain</div>
          <div className="text-2xl font-extrabold text-teal-700 dark:text-teal-400 mt-1">-38 Mins</div>
          <div className="text-[11px] text-teal-600 mt-0.5">Potential wait time reduction</div>
        </div>
      </div>

      {/* Ranked Bottleneck Cards */}
      <div className="space-y-4">
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-1">
          Ranked Flow Choke Points (Highest Impact to Lowest)
        </div>

        {bottlenecks.map(item => {
          const isCritical = item.severity === 'critical'
          const isHigh = item.severity === 'high'

          return (
            <Card 
              key={item.id}
              className={`border shadow-sm transition-all ${
                isCritical 
                  ? 'border-red-300 bg-white dark:bg-slate-900' 
                  : isHigh 
                    ? 'border-orange-300 bg-white dark:bg-slate-900' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              }`}
            >
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isCritical ? 'bg-red-600 text-white' : isHigh ? 'bg-orange-600 text-white' : 'bg-slate-700 text-white'
                    }`}>
                      #{item.rank}
                    </div>
                    <div>
                      <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {item.transition}
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        {item.queue_length} patients queued in this transition stage
                      </CardDescription>
                    </div>
                  </div>

                  <Badge variant={isCritical ? 'critical' : isHigh ? 'warning' : 'outline'} className="text-xs">
                    {item.severity.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">Root Cause Analysis:</div>
                    <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                      {item.root_cause}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Transit Latency:</span>
                      <span className="text-red-700 dark:text-red-400 font-bold">
                        {item.current_delay_mins}m <span className="text-slate-400 font-normal">→ Projected</span> {item.predicted_delay_mins}m
                      </span>
                    </div>
                    <Progress value={Math.min(100, Math.round((item.current_delay_mins / 90) * 100))} className="h-1.5 [&>div]:bg-red-500" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-teal-900 dark:text-teal-200">Prescribed Intervention: </span>
                    <span className="text-teal-800 dark:text-teal-300">{item.prescribed_fix}</span>
                  </div>

                  <Button 
                    size="sm" 
                    className="h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white font-medium shrink-0 gap-1 shadow-sm"
                    onClick={() => handleApplyFix(item)}
                    disabled={actionLoading}
                  >
                    <Zap className="h-3.5 w-3.5" /> Execute Fix
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
