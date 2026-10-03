import React, { useState, useEffect } from 'react'
import { apiClient } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { 
  AlertTriangle, Siren, PhoneCall, CheckCircle2, 
  Clock, ShieldAlert, ArrowRight, RefreshCw, Users, 
  RotateCcw, Sparkles, Building2, UserCheck, Flame, Zap, X,
  Radio, Check, AlertCircle, PhoneForwarded, Layers, Stethoscope,
  Send, SendHorizontal, Bot, BedDouble
} from 'lucide-react'

interface StaffRecallItem {
  recall_id: string
  alert_id: string
  staff_id: number
  staff_code: string
  staff_name: string
  role: string
  department: string
  specialization: string
  shift: string
  status: string
  escalation_tier: number
  notified_at: string
  notified_time: string
  acknowledged_at?: string | null
  responded_at?: string | null
  eta_minutes?: number
}

interface CongestionAlert {
  id: number
  alert_code: string
  title: string
  department_key: string
  department_name: string
  severity: string
  current_occupancy: number
  predicted_occupancy: number
  horizon_hours: number
  waiting_patients: number
  reason: string
  required_response: string
  status: string
  created_at: string
  created_time_display: string
  staff_recalls: StaffRecallItem[]
  acknowledged_count: number
  total_staff_notified: number
  coordinator_approved: boolean
  approved_by?: string
  telegram_status?: string
  telegram_chat_id?: string
  telegram_error?: string
}

export default function CongestionAlerts() {
  const [alerts, setAlerts] = useState<CongestionAlert[]>([])
  const [selectedAlertCode, setSelectedAlertCode] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'warning' | 'error' } | null>(null)
  const [contacts, setContacts] = useState<Record<string, any>>({})

  const fetchData = async () => {
    try {
      const [alertsRes, contactsRes] = await Promise.all([
        apiClient.get('/alerts/active'),
        apiClient.get('/alerts/contacts')
      ])
      
      setAlerts(alertsRes.data || [])
      if (alertsRes.data && alertsRes.data.length > 0) {
        if (!selectedAlertCode || !alertsRes.data.some((a: any) => a.alert_code === selectedAlertCode)) {
          setSelectedAlertCode(alertsRes.data[0].alert_code)
        }
      }
      if (contactsRes.data?.department_contacts) {
        setContacts(contactsRes.data.department_contacts)
      }
      setError(null)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch congestion alerts telemetry')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [selectedAlertCode])

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleAcknowledgeStaff = async (alertCode: string, recallId: string, staffName: string) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/alerts/${alertCode}/acknowledge-staff`, {
        recall_id: recallId,
        staff_name: staffName
      })
      showToast(`${staffName} acknowledged emergency recall.`, 'success')
      await fetchData()
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRespondStaff = async (alertCode: string, recallId: string, staffName: string, eta: number = 15) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/alerts/${alertCode}/respond-staff`, {
        recall_id: recallId,
        staff_name: staffName,
        eta_minutes: eta
      })
      showToast(`${staffName} confirmed en-route (ETA: ${eta} mins).`, 'success')
      await fetchData()
    } catch (err: any) {
      showToast(`Action failed: ${err.message}`, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEscalate = async (alertCode: string) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/alerts/${alertCode}/escalate`, {
        reason: 'Surge escalation: Incident Command activated.'
      })
      showToast(`Alert ${alertCode} escalated to Tier 2 Command.`, 'warning')
      await fetchData()
    } catch (err: any) {
      showToast(`Escalation failed: ${err.message}`, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApprovePlan = async (alertCode: string) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/alerts/${alertCode}/approve`, {
        coordinator_name: 'Dr. Medical Director'
      })
      showToast(`Surge Protocol & Bed Plan approved for ${alertCode}!`, 'success')
      await fetchData()
    } catch (err: any) {
      showToast(`Approval failed: ${err.message}`, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDismiss = async (alertCode: string) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/alerts/${alertCode}/dismiss`)
      showToast(`Alert ${alertCode} resolved and archived to audit log.`, 'info')
      await fetchData()
    } catch (err: any) {
      showToast(`Dismissal failed: ${err.message}`, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleTriggerScenario = async (deptKey: string) => {
    setActionLoading(true)
    try {
      const endpoint = deptKey === 'ICU' ? '/scenarios/icu-surge' : deptKey === 'ED' ? '/scenarios/ed-congestion' : deptKey === 'BED_OVERFLOW' ? '/scenarios/bed-overflow' : deptKey === 'DOCTOR_SHORTAGE' ? '/scenarios/doctor-shortage' : '/scenarios/ward-surge'
      const res = await apiClient.post(endpoint)
      showToast(`Triggered: ${res.data.message || deptKey + ' Scenario'}`, 'warning')
      await fetchData()
    } catch (err: any) {
      showToast(`Trigger failed: ${err.message}`, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const [telegramStatusMap, setTelegramStatusMap] = useState<Record<string, { status: 'READY' | 'SENDING...' | 'SENT / ACCEPTED' | 'FAILED'; error?: string; chatId?: string }>>({})

  const handleSendTelegram = async (alertCode: string) => {
    setTelegramStatusMap(prev => ({
      ...prev,
      [alertCode]: { status: 'SENDING...' }
    }))
    try {
      const res = await apiClient.post(`/alerts/${alertCode}/send-telegram`)
      if (res.data?.success) {
        setTelegramStatusMap(prev => ({
          ...prev,
          [alertCode]: { status: 'SENT / ACCEPTED', chatId: res.data.chat_id }
        }))
        showToast(`Telegram emergency alert dispatched to department lead!`, 'success')
      } else {
        const errorMsg = res.data?.error || 'Telegram rejected the message.'
        setTelegramStatusMap(prev => ({
          ...prev,
          [alertCode]: { status: 'FAILED', error: errorMsg, chatId: res.data?.chat_id }
        }))
        showToast(`Telegram notification failed: ${errorMsg}`, 'error')
      }
      await fetchData()
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to dispatch Telegram alert'
      setTelegramStatusMap(prev => ({
        ...prev,
        [alertCode]: { status: 'FAILED', error: errMsg }
      }))
      showToast(`Telegram dispatch error: ${errMsg}`, 'error')
    }
  }

  const handleTestTelegram = async () => {
    setActionLoading(true)
    try {
      const res = await apiClient.post('/test-telegram')
      if (res.data?.success) {
        showToast('Telegram test message sent & accepted by @CrewResponsebot!', 'success')
      } else {
        showToast(`Telegram test failed: ${res.data?.error || 'Rejection'}`, 'error')
      }
    } catch (err: any) {
      showToast(`Telegram test error: ${err.message}`, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const [bedOverflowStatus, setBedOverflowStatus] = useState<{
    status: 'READY' | 'SENDING...' | 'SENT / ACCEPTED' | 'FAILED';
    error?: string;
    chatId?: string;
  }>({ status: 'READY', chatId: '******4406' })

  const handleSendBedOverflowTelegram = async (deptKey: string = 'ICU') => {
    setBedOverflowStatus({ status: 'SENDING...' })
    try {
      const res = await apiClient.post(`/beds/trigger-overflow-alert?dept_key=${deptKey}`)
      if (res.data?.success) {
        setBedOverflowStatus({
          status: 'SENT / ACCEPTED',
          chatId: res.data.telegram_response?.chat_id || '******4406'
        })
        showToast(`Bed Overflow Telegram Alert dispatched to Staff Manager!`, 'success')
      } else {
        const errorMsg = res.data?.telegram_response?.error || 'Telegram rejected the bed overflow alert.'
        setBedOverflowStatus({
          status: 'FAILED',
          error: errorMsg,
          chatId: res.data?.telegram_response?.chat_id
        })
        showToast(`Bed Overflow dispatch failed: ${errorMsg}`, 'error')
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to dispatch Bed Overflow Telegram'
      setBedOverflowStatus({
        status: 'FAILED',
        error: errMsg
      })
      showToast(`Bed Overflow error: ${errMsg}`, 'error')
    }
  }

  const [doctorAlertStatus, setDoctorAlertStatus] = useState<{
    status: 'READY' | 'SENDING...' | 'SENT / ACCEPTED' | 'FAILED';
    error?: string;
    chatId?: string;
  }>({ status: 'READY', chatId: '******4733' })

  const handleSendDoctorAlert = async (deptKey: string = 'ICU') => {
    setDoctorAlertStatus({ status: 'SENDING...' })
    try {
      const res = await apiClient.post(`/staff/trigger-doctor-alert?dept_key=${deptKey}`)
      if (res.data?.success) {
        setDoctorAlertStatus({
          status: 'SENT / ACCEPTED',
          chatId: res.data.telegram_response?.chat_id || '******4733'
        })
        showToast(`Doctor Availability Alert dispatched to Doctor Telegram!`, 'success')
      } else {
        const errorMsg = res.data?.telegram_response?.error || 'Telegram rejected the doctor alert.'
        setDoctorAlertStatus({
          status: 'FAILED',
          error: errorMsg,
          chatId: res.data?.telegram_response?.chat_id
        })
        showToast(`Doctor Alert dispatch failed: ${errorMsg}`, 'error')
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to dispatch Doctor Telegram'
      setDoctorAlertStatus({
        status: 'FAILED',
        error: errMsg
      })
      showToast(`Doctor Alert error: ${errMsg}`, 'error')
    }
  }

  const handleResetBaseline = async () => {
    setActionLoading(true)
    try {
      await apiClient.post('/alerts/reset')
      showToast('All alerts and staff rosters reset to baseline state.', 'info')
      await fetchData()
    } catch (err: any) {
      showToast(`Reset failed: ${err.message}`, 'error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingState message="Connecting to YODHA Emergency Telemetry Engine..." />
  if (error && alerts.length === 0) return <ErrorState message={error} onRetry={fetchData} />

  const selectedAlert = alerts.find(a => a.alert_code === selectedAlertCode) || alerts[0]

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Dynamic Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 border animate-in fade-in slide-in-from-top-2 ${
          toast.type === 'success' ? 'bg-emerald-950 text-emerald-200 border-emerald-700' :
          toast.type === 'warning' ? 'bg-amber-950 text-amber-200 border-amber-700' :
          toast.type === 'error' ? 'bg-red-950 text-red-200 border-red-700' :
          'bg-slate-900 text-slate-200 border-slate-700'
        }`}>
          <Zap className="h-4 w-4 text-amber-400" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. TOP HERO HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-[#dadce0] dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-[#1D3557] dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Siren className="h-7 w-7 text-red-600 animate-pulse" />
              Emergency Congestion Alerts & Staff Recall
            </h1>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs font-bold">
              4–12h Horizon Early Warning
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#727586] dark:text-slate-400 mt-1">
            Automated bed saturation detection, clinical surge protocol execution, and on-call response team recall
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button 
            size="sm" 
            variant="outline" 
            className="border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold rounded-full gap-1.5 h-9"
            onClick={() => handleTriggerScenario('ICU')}
            disabled={actionLoading}
          >
            <Flame className="h-3.5 w-3.5 text-red-600" /> ICU Surge
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-amber-200 text-amber-700 hover:bg-amber-50 text-xs font-bold rounded-full gap-1.5 h-9"
            onClick={() => handleTriggerScenario('ED')}
            disabled={actionLoading}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> ED Surge
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-50 text-xs font-bold rounded-full gap-1.5 h-9"
            onClick={() => handleTriggerScenario('BED_OVERFLOW')}
            disabled={actionLoading}
          >
            <BedDouble className="h-3.5 w-3.5 text-purple-600" /> Bed Overflow
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-emerald-300 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 text-xs font-bold rounded-full gap-1.5 h-9"
            onClick={() => handleTriggerScenario('DOCTOR_SHORTAGE')}
            disabled={actionLoading}
          >
            <Stethoscope className="h-3.5 w-3.5 text-emerald-600" /> Doctor Shortage
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-sky-300 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-xs font-bold rounded-full gap-1.5 h-9"
            onClick={handleTestTelegram}
            disabled={actionLoading}
          >
            <Send className="h-3.5 w-3.5 text-[#2AABEE]" /> Test Bot (@CrewResponsebot)
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-full gap-1.5 h-9"
            onClick={fetchData}
            disabled={actionLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${actionLoading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button 
            size="sm" 
            variant="secondary" 
            className="bg-slate-100 hover:bg-slate-200 text-[#1D3557] text-xs font-bold rounded-full gap-1.5 h-9"
            onClick={handleResetBaseline}
            disabled={actionLoading}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset State
          </Button>
        </div>
      </div>

      {/* 2. MAIN ACTIVE ALERTS & SELECTED DETAIL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Active Alerts Feed (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-red-500 animate-pulse" /> Active Congestion Warnings ({alerts.length})
            </span>
            <span className="text-[11px] font-semibold text-slate-400">Select to inspect</span>
          </div>

          {alerts.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-slate-300 bg-slate-50 dark:bg-slate-900 rounded-2xl">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No Active Congestion Alerts</p>
              <p className="text-xs text-slate-400 mt-1">All departments operating within safety thresholds.</p>
              <Button size="sm" className="mt-4 bg-[#357df9] text-white text-xs rounded-full" onClick={() => handleTriggerScenario('ICU')}>
                Trigger Test Surge
              </Button>
            </Card>
          ) : (
            alerts.map((alert) => {
              const isSelected = selectedAlert?.alert_code === alert.alert_code
              const isCritical = alert.severity === 'CRITICAL'

              return (
                <div 
                  key={alert.alert_code}
                  onClick={() => setSelectedAlertCode(alert.alert_code)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    isSelected 
                      ? 'bg-red-50/50 dark:bg-red-950/30 border-red-500 shadow-md ring-2 ring-red-400/20' 
                      : 'bg-white dark:bg-slate-900 border-[#dadce0] dark:border-slate-800 hover:border-slate-400 shadow-xs'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase ${
                        isCritical ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {alert.severity}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#1D3557] dark:text-slate-200">
                        {alert.alert_code}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {alert.created_time_display}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-[#1D3557] dark:text-slate-100 mt-2 line-clamp-1">
                    {alert.title}
                  </h3>

                  <div className="mt-2.5 space-y-1">
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      <span>{alert.department_name}</span>
                      <span className="font-bold text-red-600">{alert.current_occupancy}% → {alert.predicted_occupancy}%</span>
                    </div>
                    <Progress value={alert.current_occupancy} className="h-1.5 [&>div]:bg-red-500 rounded-full" />
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="h-3 w-3 text-slate-400" />
                      {alert.acknowledged_count}/{alert.total_staff_notified} Recalls Acked
                    </span>
                    <span className="text-red-600 font-bold text-[10px] flex items-center gap-0.5">
                      {isSelected ? 'ACTIVE VIEW' : 'INSPECT →'}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Right Column: Selected Alert Detailed Inspection & Action Panel (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedAlert ? (
            <>
              {/* Alert Master Banner */}
              <Card className="border-red-200 dark:border-red-900/50 bg-gradient-to-br from-red-50/40 via-white to-white dark:from-red-950/20 dark:via-slate-900 dark:to-slate-900 rounded-2xl shadow-sm overflow-hidden">
                <div className="bg-red-600 text-white px-5 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" />
                    <span className="text-xs font-black tracking-wider uppercase">
                      CRITICAL CLINICAL SURGE WARNING • {selectedAlert.alert_code}
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-white/20 text-white border-white/30 text-[10px] font-bold">
                    {selectedAlert.status}
                  </Badge>
                </div>

                <CardContent className="p-6 space-y-6">
                  {/* Top Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Affected Ward</div>
                      <div className="text-sm font-extrabold text-[#1D3557] dark:text-slate-100 mt-0.5 truncate">
                        {selectedAlert.department_name}
                      </div>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Current Load</div>
                      <div className="text-sm font-extrabold text-red-600 mt-0.5">
                        {selectedAlert.current_occupancy}% Occupancy
                      </div>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Predicted Peak</div>
                      <div className="text-sm font-extrabold text-red-700 mt-0.5">
                        {selectedAlert.predicted_occupancy}% in {selectedAlert.horizon_hours}h
                      </div>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Recall Response</div>
                      <div className="text-sm font-extrabold text-emerald-600 mt-0.5">
                        {selectedAlert.acknowledged_count}/{selectedAlert.total_staff_notified} Responded
                      </div>
                    </div>
                  </div>

                  {/* Operational Context & Root Cause */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="text-xs font-bold text-[#1D3557] dark:text-slate-200 flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-orange-500" />
                      Primary Bottleneck Driver & Root Cause:
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      {selectedAlert.reason}
                    </p>
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 font-medium">
                      <strong>Mandated Protocol:</strong> {selectedAlert.required_response}
                    </div>
                  </div>

                  {/* Telegram Emergency Notification Channel */}
                  {(() => {
                    const alertTg = telegramStatusMap[selectedAlert.alert_code]
                    const tgStatus = alertTg?.status || selectedAlert.telegram_status || 'READY'
                    const tgChatId = alertTg?.chatId || selectedAlert.telegram_chat_id || '******4406'
                    const tgError = alertTg?.error || selectedAlert.telegram_error

                    return (
                      <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-[#2AABEE] text-white rounded-xl shadow-xs">
                            <Send className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-[#1D3557] dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                                Telegram Emergency Channel
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-extrabold uppercase ${
                                  tgStatus === 'SENT / ACCEPTED'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : tgStatus === 'SENDING...'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                                    : tgStatus === 'FAILED'
                                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                                    : 'bg-slate-100 text-slate-700 border-slate-300'
                                }`}
                              >
                                {tgStatus}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                              Recipient: <strong>Emergency Gateway (Diagnostic / Test Channel)</strong> • Chat ID: <span className="font-mono font-bold text-sky-700 dark:text-sky-400">{tgChatId || '******4406'}</span>
                            </p>
                            {tgError && (
                              <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                                Note: {tgError}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className={`font-bold text-xs rounded-full px-4 h-9 shadow-sm gap-1.5 whitespace-nowrap ${
                            tgStatus === 'SENT / ACCEPTED'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-[#2AABEE] hover:bg-[#2297d4] text-white'
                          }`}
                          onClick={() => handleSendTelegram(selectedAlert.alert_code)}
                          disabled={tgStatus === 'SENDING...'}
                        >
                          <SendHorizontal className="h-4 w-4" />
                          {tgStatus === 'SENDING...' ? 'SENDING...' : tgStatus === 'SENT / ACCEPTED' ? 'RE-SEND TELEGRAM' : 'SEND TELEGRAM'}
                        </Button>
                      </div>
                    )
                  })()}

                  {/* Bed Overflow Telegram Channel (Staff Manager) */}
                  <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-xs">
                        <BedDouble className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#1D3557] dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                            Bed Overflow Telegram
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-extrabold uppercase ${
                              bedOverflowStatus.status === 'SENT / ACCEPTED'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : bedOverflowStatus.status === 'SENDING...'
                                ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                                : bedOverflowStatus.status === 'FAILED'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {bedOverflowStatus.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                          Recipient: <strong>Staff Manager</strong> • Chat ID: <span className="font-mono font-bold text-purple-700 dark:text-purple-400">{bedOverflowStatus.chatId || '******4406'}</span>
                        </p>
                        {bedOverflowStatus.error && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                            Note: {bedOverflowStatus.error}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className={`font-bold text-xs rounded-full px-4 h-9 shadow-sm gap-1.5 whitespace-nowrap ${
                        bedOverflowStatus.status === 'SENT / ACCEPTED'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                      onClick={() => handleSendBedOverflowTelegram(selectedAlert?.department_key || 'ICU')}
                      disabled={bedOverflowStatus.status === 'SENDING...'}
                    >
                      <SendHorizontal className="h-4 w-4" />
                      {bedOverflowStatus.status === 'SENDING...' ? 'SENDING...' : bedOverflowStatus.status === 'SENT / ACCEPTED' ? 'RE-SEND OVERFLOW' : 'SEND BED OVERFLOW ALERT'}
                    </Button>
                  </div>

                  {/* Doctor Availability Telegram Channel (Doctor / On-Duty Specialist) */}
                  <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
                        <Stethoscope className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#1D3557] dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                            Doctor Availability Telegram
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-extrabold uppercase ${
                              doctorAlertStatus.status === 'SENT / ACCEPTED'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : doctorAlertStatus.status === 'SENDING...'
                                ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                                : doctorAlertStatus.status === 'FAILED'
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {doctorAlertStatus.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                          Recipient: <strong>Doctor / Specialist</strong> • Chat ID: <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{doctorAlertStatus.chatId || '******4733'}</span>
                        </p>
                        {doctorAlertStatus.error && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium">
                            Note: {doctorAlertStatus.error}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className={`font-bold text-xs rounded-full px-4 h-9 shadow-sm gap-1.5 whitespace-nowrap ${
                        doctorAlertStatus.status === 'SENT / ACCEPTED'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      onClick={() => handleSendDoctorAlert(selectedAlert?.department_key || 'ICU')}
                      disabled={doctorAlertStatus.status === 'SENDING...'}
                    >
                      <SendHorizontal className="h-4 w-4" />
                      {doctorAlertStatus.status === 'SENDING...' ? 'SENDING...' : doctorAlertStatus.status === 'SENT / ACCEPTED' ? 'RE-SEND DOCTOR ALERT' : 'SEND DOCTOR ALERT'}
                    </Button>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        className="bg-[#357df9] hover:bg-[#265ab2] text-white font-bold text-xs rounded-full px-4 h-9 shadow-sm gap-1.5"
                        onClick={() => handleApprovePlan(selectedAlert.alert_code)}
                        disabled={actionLoading}
                      >
                        <CheckCircle2 className="h-4 w-4" /> Approve Surge Bed Plan
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="border-amber-300 text-amber-800 hover:bg-amber-50 font-bold text-xs rounded-full px-4 h-9"
                        onClick={() => handleEscalate(selectedAlert.alert_code)}
                        disabled={actionLoading}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" /> Escalate to Tier 2
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-500 hover:text-slate-800 text-xs rounded-full h-9"
                      onClick={() => handleDismiss(selectedAlert.alert_code)}
                      disabled={actionLoading}
                    >
                      <X className="h-3.5 w-3.5 mr-1" /> Dismiss Alert
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* 3. ON-CALL STAFF RECALL ROSTER TABLE */}
              <Card className="border-[#dadce0] dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
                <CardHeader className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 py-3.5 px-5 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-bold text-[#1D3557] dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#357df9]" />
                    On-Call Staff Recall Roster ({selectedAlert.staff_recalls?.length || 0} Clinicians)
                  </CardTitle>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {selectedAlert.acknowledged_count} Acknowledged
                  </span>
                </CardHeader>

                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-bold border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">Staff Member</th>
                        <th className="py-2.5 px-4">Role & Specialization</th>
                        <th className="py-2.5 px-4">Shift</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Response ETA</th>
                        <th className="py-2.5 px-4 text-right">Interactive Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedAlert.staff_recalls?.map((staff) => {
                        const isAcked = staff.status === 'ACKNOWLEDGED' || staff.status === 'RESPONDED'
                        const isEnRoute = staff.status === 'RESPONDED'

                        return (
                          <tr key={staff.recall_id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4">
                              <div className="font-bold text-[#1D3557] dark:text-slate-200">{staff.staff_name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{staff.staff_code}</div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-700 dark:text-slate-300">{staff.role}</div>
                              <div className="text-[10px] text-slate-400">{staff.specialization}</div>
                            </td>
                            <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-300">
                              {staff.shift}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                isEnRoute ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                                isAcked ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                                'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                {staff.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                              {isEnRoute ? `${staff.eta_minutes || 15} mins` : isAcked ? 'Standing By' : 'Awaiting Response'}
                            </td>
                            <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                              {!isAcked && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 text-[11px] font-bold rounded-full px-2.5 border-blue-300 text-blue-700 hover:bg-blue-50"
                                  onClick={() => handleAcknowledgeStaff(selectedAlert.alert_code, staff.recall_id, staff.staff_name)}
                                  disabled={actionLoading}
                                >
                                  Acknowledge
                                </Button>
                              )}
                              {!isEnRoute && (
                                <Button 
                                  size="sm" 
                                  className="h-7 text-[11px] font-bold rounded-full px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => handleRespondStaff(selectedAlert.alert_code, staff.recall_id, staff.staff_name, 15)}
                                  disabled={actionLoading}
                                >
                                  Confirm En-Route
                                </Button>
                              )}
                              {isEnRoute && (
                                <span className="text-[11px] font-bold text-emerald-600 flex items-center justify-end gap-1">
                                  <Check className="h-3.5 w-3.5" /> En-Route (15m)
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* 4. DEPARTMENT CLINICAL DIRECTORY */}
              <Card className="border-[#dadce0] dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm">
                <CardHeader className="py-3.5 px-5 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-xs font-bold text-[#1D3557] dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#357df9]" />
                    Registered Department Emergency Leads
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(contacts).map(([key, contact]: [string, any]) => (
                    <div key={key} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-xs text-[#1D3557] dark:text-slate-200">{contact.name}</span>
                        <Badge variant="outline" className="text-[9px] bg-white dark:bg-slate-900 font-bold">{key}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">{contact.role}</p>
                      <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 pt-1">{contact.phone}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center border-slate-200 rounded-2xl">
              <p className="text-slate-500 font-semibold text-sm">Select an active alert on the left to inspect telemetry.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
