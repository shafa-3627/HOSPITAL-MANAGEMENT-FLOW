import React, { useState, useEffect } from 'react'
import { apiClient } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Progress } from '@/components/ui/Progress'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { 
  Cpu, Sparkles, Activity, ShieldAlert, Bell, MessageSquare, 
  Send, RefreshCw, CheckCircle2, AlertTriangle, Play, Pause, 
  Sliders, ArrowRight, Clock, Users, BedDouble, Stethoscope, 
  Layers, PhoneCall, HelpCircle, AlertCircle, FileText, Check, X,
  Radio, Flame, Waves, Wind, Mountain, Siren, Database
} from 'lucide-react'

interface AgentStatusData {
  status: 'ACTIVE' | 'PAUSED'
  last_analysis_time: string
  emergency_mode: {
    active: boolean
    type: string
    severity: string
    activated_at: string | null
    affected_department: string
    simulated: boolean
    description: string
  }
  bed_stats: {
    total: number
    occupied: number
    available: number
    available_pct: number
    occupancy_pct: number
    icu_occupancy: number
    ed_waiting: number
    total_patients: number
  }
  thresholds: {
    bed_warning_pct: number
    bed_critical_pct: number
    ed_waiting_backlog: number
    icu_occupancy_critical: number
  }
  recent_decisions: Array<{
    id: string
    timestamp: string
    title: string
    observed_data: string
    rule_applied: string
    decision: string
    action_taken: string
    notification_status: string
    status: string
  }>
  configured_recipients: {
    staff_manager_mask: string
    doctor_alert_mask: string
  }
}

interface NotificationItem {
  id: string
  channel: string
  recipient_role: string
  recipient_mask: string
  title: string
  message: string
  severity: string
  delivery_status: 'DELIVERED' | 'NOT_CONFIGURED' | 'PENDING' | 'FAILED'
  provider_note: string
  timestamp_display: string
}

interface QAEvidence {
  source: string
  metric: string
  value: string
}

interface QAResponse {
  question: string
  answer: string
  evidence: QAEvidence[]
  timestamp: string
}

const LIFECYCLE_STAGES = [
  { step: 1, name: 'MONITOR', desc: 'Real-time telemetry ingestion from beds, ED queue, and patient admissions', icon: Radio },
  { step: 2, name: 'DETECT', desc: 'Threshold breach & emergency disaster mode event detection', icon: Activity },
  { step: 3, name: 'ANALYZE', desc: 'Risk classification, ward load modeling, and triage acuity check', icon: Cpu },
  { step: 4, name: 'DECIDE', desc: 'Rule-based expert operational planning & escalation routing', icon: Sparkles },
  { step: 5, name: 'NOTIFY', desc: 'Automated clinical notification to Staff Manager & On-Call Doctor', icon: Bell },
  { step: 6, name: 'AUDIT', desc: 'Immutable, tamper-evident recording to hospital Audit Trail', icon: FileText },

  { step: 7, name: 'CONTINUE', desc: 'Autonomous background monitoring loop (10-second cycle)', icon: RefreshCw },
]

const DISASTER_PRESETS = [
  { id: 'FLOOD', label: 'Flood Influx', icon: Waves, color: 'border-blue-300 hover:bg-blue-50 text-blue-700' },
  { id: 'TSUNAMI', label: 'Tsunami Surge', icon: Siren, color: 'border-cyan-300 hover:bg-cyan-50 text-cyan-800' },
  { id: 'CYCLONE', label: 'Cyclone Trauma', icon: Wind, color: 'border-teal-300 hover:bg-teal-50 text-teal-800' },
  { id: 'EARTHQUAKE', label: 'Earthquake Casualty', icon: Mountain, color: 'border-amber-300 hover:bg-amber-50 text-amber-800' },
  { id: 'FIRE', label: 'Major Fire Burn Ward', icon: Flame, color: 'border-orange-300 hover:bg-orange-50 text-orange-800' },
  { id: 'MASS_CASUALTY', label: 'Mass Casualty', icon: ShieldAlert, color: 'border-red-300 hover:bg-red-50 text-red-700' },
]

const SAMPLE_QUESTIONS = [
  "Are we running low on beds?",
  "How many ICU beds are available?",
  "How many emergency patients need immediate attention?",
  "Is there an active emergency?",
  "Why was this alert generated?",
  "What actions should the hospital take right now?"
]

export default function AgenticAI() {
  const [data, setData] = useState<AgentStatusData | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' } | null>(null)

  // AI Q&A State
  const [questionInput, setQuestionInput] = useState('')
  const [qaHistory, setQaHistory] = useState<QAResponse[]>([])
  const [qaLoading, setQaLoading] = useState(false)

  // Threshold edit state
  const [showConfig, setShowConfig] = useState(false)
  const [editWarningPct, setEditWarningPct] = useState<number>(15)
  const [editCriticalPct, setEditCriticalPct] = useState<number>(10)

  const fetchStatus = async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const [statusRes, notifsRes] = await Promise.all([
        apiClient.get('/agent/status'),
        apiClient.get('/agent/notifications')
      ])
      setData(statusRes.data)
      setNotifications(notifsRes.data)
      setEditWarningPct(statusRes.data.thresholds.bed_warning_pct)
      setEditCriticalPct(statusRes.data.thresholds.bed_critical_pct)
    } catch (err: any) {
      setError(err.message || 'Failed to connect to YODHA Agentic AI controller')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(() => {
      fetchStatus(true)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  // 1. Toggle Agent (Active / Paused)
  const handleToggleAgent = async () => {
    setActionLoading(true)
    try {
      const res = await apiClient.post('/agent/toggle')
      setToast({ message: res.data.message, type: 'success' })
      await fetchStatus(true)
    } catch (err: any) {
      setToast({ message: `Failed to toggle agent: ${err.message}`, type: 'warning' })
    } finally {
      setActionLoading(false)
    }
  }

  // 2. Activate Emergency Disaster Scenario
  const handleActivateDisaster = async (type: string) => {
    setActionLoading(true)
    try {
      const res = await apiClient.post('/agent/emergency/activate', {
        disaster_type: type,
        severity: 'CRITICAL',
        affected_department: 'Emergency & Trauma Hub',
        is_simulation: true
      })
      setToast({
        message: `🚨 Emergency Mode Activated: ${type.toUpperCase()}! Doctor notifications dispatched.`,
        type: 'warning'
      })
      await fetchStatus(true)
    } catch (err: any) {
      setToast({ message: `Activation failed: ${err.message}`, type: 'info' })
    } finally {
      setActionLoading(false)
    }
  }

  // 3. Deactivate / Reset Emergency
  const handleDeactivateDisaster = async () => {
    setActionLoading(true)
    try {
      await apiClient.post('/agent/emergency/deactivate')
      setToast({ message: 'Emergency mode cleared. System restored to normal baseline.', type: 'success' })
      await fetchStatus(true)
    } catch (err: any) {
      setToast({ message: `Deactivation failed: ${err.message}`, type: 'info' })
    } finally {
      setActionLoading(false)
    }
  }

  // 4. Trigger Simulation Presets
  const handleSimulation = async (scenarioType: string) => {
    setActionLoading(true)
    try {
      const res = await apiClient.post('/agent/simulation/trigger', { scenario_type: scenarioType })
      setToast({ message: res.data.message, type: 'info' })
      await fetchStatus(true)
    } catch (err: any) {
      setToast({ message: `Simulation trigger failed: ${err.message}`, type: 'warning' })
    } finally {
      setActionLoading(false)
    }
  }

  // 5. Update Thresholds
  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionLoading(true)
    try {
      await apiClient.put('/agent/thresholds', {
        bed_warning_pct: Number(editWarningPct),
        bed_critical_pct: Number(editCriticalPct)
      })
      setToast({ message: 'Agent monitoring thresholds updated successfully.', type: 'success' })
      setShowConfig(false)
      await fetchStatus(true)
    } catch (err: any) {
      setToast({ message: `Failed to update thresholds: ${err.message}`, type: 'warning' })
    } finally {
      setActionLoading(false)
    }
  }

  // 6. Natural Language AI Q&A
  const handleAskQuestion = async (qText?: string) => {
    const query = qText || questionInput
    if (!query.trim()) return
    setQaLoading(true)
    try {
      const res = await apiClient.post('/agent/ask', { question: query })
      setQaHistory(prev => [res.data, ...prev])
      setQuestionInput('')
    } catch (err: any) {
      setToast({ message: `AI Assistant query error: ${err.message}`, type: 'warning' })
    } finally {
      setQaLoading(false)
    }
  }

  if (loading) return <LoadingState message="Initializing YODHA Agentic AI Operations Control Center..." />
  if (error || !data) return <ErrorState message={error || 'Failed to load Agent telemetry'} onRetry={() => fetchStatus()} />

  const isEmergency = data.emergency_mode.active
  const isAgentActive = data.status === 'ACTIVE'
  const isBedCritical = data.bed_stats.available_pct <= data.thresholds.bed_critical_pct
  const isBedWarning = data.bed_stats.available_pct <= data.thresholds.bed_warning_pct

  return (
    <div className="space-y-6 pb-14 font-sans selection:bg-[#357df9]/20">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`p-4 rounded-2xl shadow-lg border flex items-center justify-between text-xs font-bold transition-all animate-in fade-in ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-300' :
          toast.type === 'warning' ? 'bg-red-50 text-red-900 border-red-300' :
          'bg-blue-50 text-blue-900 border-blue-300'
        }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="p-1 hover:opacity-75"><X size={14} /></button>
        </div>
      )}

      {/* 1. TOP HERO: AGENT STATUS & DISASTER STATE BANNER */}
      <div className={`rounded-2xl p-6 border shadow-sm transition-all ${
        isEmergency 
          ? 'bg-gradient-to-r from-red-950 via-slate-900 to-red-900 text-white border-red-700' 
          : 'bg-white border-[#dadce0] text-[#1D3557]'
      }`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#357df9] to-[#33bd4a] text-white flex items-center justify-center shadow-md">
                <Cpu className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                YODHA Agentic AI Control Hub
              </h1>
              
              {/* Agent Active / Paused Badge */}
              <Badge className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-xs ${
                isAgentActive 
                  ? 'bg-[#33bd4a] text-white' 
                  : 'bg-amber-500 text-white'
              }`}>
                {isAgentActive ? '● AGENT ACTIVE' : '❚❚ AGENT PAUSED'}
              </Badge>

              {/* Emergency Mode Pill */}
              {isEmergency ? (
                <span className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5 shadow-md">
                  <Siren className="h-3.5 w-3.5" />
                  <span>EMERGENCY: {data.emergency_mode.type}</span>
                </span>
              ) : (
                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200">
                  Normal Baseline Mode
                </span>
              )}
            </div>

            <p className={`text-xs sm:text-sm font-medium ${isEmergency ? 'text-red-200' : 'text-[#727586]'}`}>
              Autonomous hospital operations monitoring, predictive capacity alerts, and multi-channel clinician dispatch.
            </p>
          </div>

          {/* Quick Actions Header */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            <Button
              size="sm"
              variant={isAgentActive ? "outline" : "default"}
              onClick={handleToggleAgent}
              disabled={actionLoading}
              className={`h-9 text-xs font-bold rounded-full gap-1.5 shadow-xs ${
                isAgentActive 
                  ? 'border-amber-400 text-amber-800 hover:bg-amber-50 bg-amber-50/50' 
                  : 'bg-[#33bd4a] hover:bg-[#28a745] text-white'
              }`}
            >
              {isAgentActive ? <Pause size={14} /> : <Play size={14} />}
              <span>{isAgentActive ? 'Pause Agent' : 'Resume Agent'}</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowConfig(!showConfig)}
              className="h-9 text-xs font-bold rounded-full border-[#dadce0] hover:bg-slate-50 gap-1.5"
            >
              <Sliders size={14} className="text-[#357df9]" />
              <span>Thresholds</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchStatus()}
              className="h-9 text-xs font-bold rounded-full border-[#dadce0] hover:bg-slate-50 gap-1.5"
            >
              <RefreshCw size={13} className="text-[#33bd4a]" />
              <span>Poll Now</span>
            </Button>
          </div>
        </div>

        {/* Configurable Threshold Drawer */}
        {showConfig && (
          <form onSubmit={handleSaveThresholds} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-4 text-xs font-medium animate-in fade-in">
            <div className="flex items-center gap-2">
              <label className="font-bold text-[#1D3557]">Warning Threshold (% Free):</label>
              <Input
                type="number"
                value={editWarningPct}
                onChange={e => setEditWarningPct(Number(e.target.value))}
                className="w-20 h-8 text-xs font-bold"
                min={1}
                max={50}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="font-bold text-[#1D3557]">Critical Threshold (% Free):</label>
              <Input
                type="number"
                value={editCriticalPct}
                onChange={e => setEditCriticalPct(Number(e.target.value))}
                className="w-20 h-8 text-xs font-bold"
                min={1}
                max={30}
              />
            </div>
            <Button size="sm" type="submit" className="h-8 bg-[#357df9] text-white text-xs font-bold rounded-full px-4">
              Save Thresholds
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={() => setShowConfig(false)} className="h-8 text-xs text-slate-500">
              Cancel
            </Button>
          </form>
        )}
      </div>

      {/* 2. LIVE 7-STAGE AGENTIC LIFECYCLE BAR */}
      <Card className="border-[#dadce0] bg-white rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="py-3 px-6 bg-[#f8fafc] border-b border-[#dadce0]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#357df9]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#1D3557]">
                Autonomous Agent Execution Pipeline
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#727586]">
              Cycle Interval: 10s • Last Analyzed: {new Date(data.last_analysis_time).toLocaleTimeString()}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {LIFECYCLE_STAGES.map((st) => {
              const Icon = st.icon
              return (
                <div key={st.step} className="p-3 rounded-xl bg-[#f8fafc] border border-slate-200/80 hover:border-blue-300 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black text-[#357df9] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                        STAGE {st.step}
                      </span>
                      <Icon className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                    <div className="text-xs font-black text-[#1D3557]">{st.name}</div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-snug line-clamp-2">
                    {st.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. LIVE BED CAPACITY & ADMISSION PRESSURE MONITORING TILES */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Available Beds Status */}
        <Card className={`rounded-2xl border shadow-sm p-4 ${
          isBedCritical ? 'bg-red-50 border-red-300' : isBedWarning ? 'bg-amber-50 border-amber-300' : 'bg-white border-[#dadce0]'
        }`}>
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-600">Bed Capacity Status</span>
            <BedDouble className={`h-4 w-4 ${isBedCritical ? 'text-red-600' : isBedWarning ? 'text-amber-600' : 'text-[#33bd4a]'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1D3557]">{data.bed_stats.available}</span>
            <span className="text-xs font-semibold text-slate-500">/ {data.bed_stats.total} Beds Free</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-600">
              <span>Availability: {data.bed_stats.available_pct}%</span>
              <span>Warn: &le;{data.thresholds.bed_warning_pct}%</span>
            </div>
            <Progress value={data.bed_stats.available_pct} className="h-2 bg-slate-100" />
          </div>
          <div className="mt-2.5 text-[10px] font-bold">
            {isBedCritical ? (
              <span className="text-red-700 flex items-center gap-1">🚨 CRITICAL CAPACITY: Manager Alert Dispatched</span>
            ) : isBedWarning ? (
              <span className="text-amber-700 flex items-center gap-1">⚠️ LOW CAPACITY: Warning Threshold Breached</span>
            ) : (
              <span className="text-emerald-700 flex items-center gap-1">✓ NORMAL: Capacity within safe threshold</span>
            )}
          </div>
        </Card>

        {/* ICU Saturation Gauge */}
        <Card className="rounded-2xl border border-[#dadce0] bg-white shadow-sm p-4">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-600">ICU Capacity Load</span>
            <Activity className="h-4 w-4 text-red-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1D3557]">{data.bed_stats.icu_occupancy}%</span>
            <span className="text-xs font-semibold text-slate-500">Occupancy</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-600">
              <span>ICU Utilization</span>
              <span>Critical: &ge;90%</span>
            </div>
            <Progress value={data.bed_stats.icu_occupancy} className="h-2 bg-slate-100" />
          </div>
          <p className="mt-2.5 text-[10px] text-slate-500 font-medium">
            {data.bed_stats.icu_occupancy > 85 ? 'ICU saturation elevated. Swing beds recommended.' : 'ICU capacity is operating normally.'}
          </p>
        </Card>

        {/* Admission Pressure & ED Waiting */}
        <Card className="rounded-2xl border border-[#dadce0] bg-white shadow-sm p-4">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-slate-600">ED Waiting Backlog</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#1D3557]">{data.bed_stats.ed_waiting}</span>
            <span className="text-xs font-semibold text-slate-500">Unallocated Patients</span>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-[11px] font-semibold text-slate-600">
              <span>Admission Pressure</span>
              <span>Threshold: 15 pts</span>
            </div>
            <Progress value={(data.bed_stats.ed_waiting / 25) * 100} className="h-2 bg-slate-100" />
          </div>
          <p className="mt-2.5 text-[10px] text-slate-500 font-medium">
            Total active hospital census: <strong>{data.bed_stats.total_patients} inpatients</strong>.
          </p>
        </Card>

        {/* Configured Notification Channels */}
        <Card className="rounded-2xl border border-[#dadce0] bg-white shadow-sm p-4">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-xs font-bold text-slate-600">Clinician Channels</span>
            <PhoneCall className="h-4 w-4 text-teal-600" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Staff Manager Channel:</div>
              <div className="font-semibold text-[#1D3557] flex items-center justify-between mt-0.5">
                <span>Bed Capacity Manager</span>
                <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold">IN-APP</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Doctor Alert Channel:</div>
              <div className="font-semibold text-[#1D3557] flex items-center justify-between mt-0.5">
                <span>On-Call Emergency Physician</span>
                <span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-bold">URGENT</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 4. EMERGENCY & DISASTER SITUATION PANEL + SIMULATION SANDBOX */}
      <Card className="border-[#dadce0] bg-white rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="bg-[#f8fafc] border-b border-[#dadce0] pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <CardTitle className="text-base font-black text-[#1D3557] flex items-center gap-2">
                <Siren className="h-4 w-4 text-red-600" />
                Emergency & Disaster Mode Simulation Sandbox
              </CardTitle>
              <CardDescription className="text-xs text-[#727586]">
                Simulate catastrophic external disaster events to evaluate automated doctor dispatch and triage scaling.
              </CardDescription>
            </div>
            
            {isEmergency && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDeactivateDisaster}
                disabled={actionLoading}
                className="text-xs font-bold rounded-full"
              >
                Clear Emergency State
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {DISASTER_PRESETS.map((dp) => {
              const Icon = dp.icon
              const isCurrent = isEmergency && data.emergency_mode.type === dp.id
              return (
                <Button
                  key={dp.id}
                  size="sm"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => handleActivateDisaster(dp.id)}
                  className={`h-11 text-xs font-bold rounded-xl flex items-center gap-2 transition-all ${dp.color} ${
                    isCurrent ? 'ring-2 ring-red-500 bg-red-50' : ''
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{dp.label}</span>
                </Button>
              )
            })}
          </div>

          {/* Additional Quick Simulation Triggers */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="font-bold text-slate-600">One-Click Operational Triggers:</span>
            
            <Button
              size="sm"
              variant="outline"
              disabled={actionLoading}
              onClick={() => handleSimulation('low_beds')}
              className="h-8 text-xs font-bold rounded-full border-amber-300 text-amber-800 hover:bg-amber-50"
            >
              Simulate Low Bed Capacity
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={actionLoading}
              onClick={() => handleSimulation('high_priority_patient')}
              className="h-8 text-xs font-bold rounded-full border-red-300 text-red-800 hover:bg-red-50"
            >
              Simulate High-Priority Patient
            </Button>

            <Button
              size="sm"
              variant="secondary"
              disabled={actionLoading}
              onClick={() => handleSimulation('reset')}
              className="h-8 text-xs font-bold rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              <RefreshCw size={12} className="mr-1" /> Reset Simulation
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 5. MAIN 2-COLUMN SECTION: DECISION EXPLANATION TRACE + NOTIFICATION CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Explainable Decision Trails (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-[#dadce0] bg-white rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-[#dadce0]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-black text-[#1D3557] flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#357df9]" />
                  Agent Decisions & Explanation Trails
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-bold">
                  {data.recent_decisions.length} Active Records
                </Badge>
              </div>
              <CardDescription className="text-xs text-[#727586]">
                Every automated recommendation displays the full 5-step clinical reasoning trace.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 max-h-[520px] overflow-y-auto scrollbar-thin">
              {data.recent_decisions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No automated threshold breaches or emergency escalations recorded in the current session.
                </div>
              ) : (
                data.recent_decisions.map((dec) => (
                  <div key={dec.id} className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200 text-xs space-y-2 hover:border-blue-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#357df9] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          {dec.id}
                        </span>
                        <span className="font-black text-[#1D3557]">{dec.title}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-semibold">{dec.timestamp}</span>
                    </div>

                    {/* 5-Step Breakdown */}
                    <div className="space-y-1.5 pt-1 text-slate-700">
                      <div className="grid grid-cols-12 gap-1.5">
                        <span className="col-span-3 text-[10px] font-bold text-slate-400 uppercase">1. Observed:</span>
                        <span className="col-span-9 font-medium">{dec.observed_data}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1.5">
                        <span className="col-span-3 text-[10px] font-bold text-slate-400 uppercase">2. Rule / Model:</span>
                        <span className="col-span-9 font-mono text-[11px] text-[#357df9]">{dec.rule_applied}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1.5">
                        <span className="col-span-3 text-[10px] font-bold text-slate-400 uppercase">3. Decision:</span>
                        <span className="col-span-9 font-semibold text-[#1D3557]">{dec.decision}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-1.5">
                        <span className="col-span-3 text-[10px] font-bold text-slate-400 uppercase">4. Action:</span>
                        <span className="col-span-9 font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {dec.action_taken}
                        </span>
                      </div>
                      <div className="grid grid-cols-12 gap-1.5">
                        <span className="col-span-3 text-[10px] font-bold text-slate-400 uppercase">5. Dispatch:</span>
                        <span className="col-span-9">
                          <Badge className="text-[10px] font-bold bg-slate-200 text-slate-800">
                            Status: {dec.notification_status}
                          </Badge>
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Multi-Channel Notification Center (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-[#dadce0] bg-white rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-[#dadce0]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-black text-[#1D3557] flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#33bd4a]" />
                  Clinician Notification Center
                </CardTitle>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  In-App Telemetry
                </span>

              </div>
              <CardDescription className="text-xs text-[#727586]">
                Transparent delivery status tracking across clinical notification channels.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3 max-h-[520px] overflow-y-auto scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No notifications dispatched yet in this monitoring session.
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#1D3557]">{n.recipient_role}</span>
                      <span className="font-mono text-[10px] font-bold text-slate-500">{n.timestamp_display}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-800 whitespace-pre-line leading-relaxed">
                      {n.message}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-slate-500 font-medium">To: {n.recipient_mask}</span>
                      
                      {n.delivery_status === 'NOT_CONFIGURED' ? (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1" title={n.provider_note}>
                          <AlertCircle size={11} /> Provider Not Configured (.env)
                        </span>
                      ) : n.delivery_status === 'DELIVERED' ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 size={11} /> Delivered
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {n.delivery_status}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* 6. AI Q&A ASSISTANT (Natural Language SQL Telemetry) */}
      <Card className="border-[#dadce0] bg-white rounded-2xl shadow-sm">
        <CardHeader className="pb-3 border-b border-[#dadce0]">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-black text-[#1D3557] flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#357df9]" />
              Agent Clinical Q&amp;A Assistant
            </CardTitle>
            <span className="text-xs text-slate-500 font-semibold">
              Live SQL Telemetry • Zero Hallucination
            </span>
          </div>
          <CardDescription className="text-xs text-[#727586]">
            Ask operational queries about hospital census, bed pressure, emergency alerts, or recommended actions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4">
          
          {/* Quick Suggestions Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#1D3557]">Suggested:</span>
            {SAMPLE_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAskQuestion(q)}
                disabled={qaLoading}
                className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-[#357df9] text-slate-700 border border-slate-200 transition-colors text-left"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleAskQuestion(); }}
            className="flex items-center gap-2"
          >
            <Input
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              placeholder="Ask anything (e.g. 'How many beds are available?' or 'Are we in emergency mode?')"
              className="h-10 text-xs sm:text-sm font-medium rounded-xl border-[#dadce0]"
              disabled={qaLoading}
            />
            <Button
              type="submit"
              disabled={qaLoading || !questionInput.trim()}
              className="h-10 bg-[#357df9] hover:bg-[#265ab2] text-white font-bold rounded-xl px-5 text-xs gap-1.5 shadow-sm"
            >
              <Send size={13} />
              <span>Ask AI</span>
            </Button>
          </form>

          {/* Q&A Stream */}
          {qaLoading && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 flex items-center gap-2 animate-pulse">
              <Sparkles className="h-4 w-4 animate-spin text-[#357df9]" />
              <span>Agentic AI querying real-time hospital database tables...</span>
            </div>
          )}

          {qaHistory.length > 0 && (
            <div className="space-y-3 pt-2">
              {qaHistory.map((item, qIdx) => (
                <div key={qIdx} className="p-4 rounded-xl bg-[#f8fafc] border border-slate-200 text-xs space-y-2.5">
                  <div className="flex items-center justify-between font-bold text-[#1D3557]">
                    <span className="flex items-center gap-1.5">
                      <HelpCircle size={14} className="text-[#357df9]" />
                      <span>{item.question}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-slate-200 text-slate-800 leading-relaxed font-medium">
                    {item.answer}
                  </div>

                  {/* Evidence Cards */}
                  {item.evidence && item.evidence.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Source Evidence Telemetry:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {item.evidence.map((ev, evIdx) => (
                          <div key={evIdx} className="p-2 rounded bg-white border border-slate-200 text-[11px]">
                            <div className="text-[9px] font-bold text-slate-400 uppercase">{ev.source}</div>
                            <div className="font-semibold text-[#1D3557]">{ev.metric}:</div>
                            <div className="font-bold text-[#357df9]">{ev.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </CardContent>
      </Card>

    </div>
  )
}
