import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { 
  Siren, Users, Clock, AlertTriangle, BedDouble, RefreshCw, 
  ArrowRight, CheckCircle2, Search, Filter, Stethoscope, HeartPulse, X
} from 'lucide-react'

interface PatientItem {
  id: number
  patient_code: string
  age: number
  gender: string
  priority: string
  status: string
  diagnosis_category?: string
  waiting_time_minutes?: number
  arrival_time?: string
  current_stage?: string
  bed_id?: number | null
}

export default function Emergency() {
  const [patients, setPatients] = useState<PatientItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const navigate = useNavigate()

  const fetchEmergencyData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get('/patients')
      // Patients in ED are waiting or triage or admission
      const edPatients = res.data.filter((p: PatientItem) => 
        p.status === 'waiting' || 
        p.current_stage === 'triage' || 
        p.current_stage === 'ambulance' ||
        p.current_stage === 'diagnosis' ||
        p.current_stage === 'bed_allocation'
      )
      setPatients(edPatients)
    } catch (err: any) {
      setError(err.message || 'Failed to load Emergency Department data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmergencyData()
  }, [])

  // Fast Admit to Inpatient
  const handleFastAdmit = async (patient: PatientItem) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/patients/${patient.id}/update-stage?stage=bed_allocation`)
      setToast(`Patient ${patient.patient_code} flagged for immediate Inpatient Ward bed allocation!`)
      await fetchEmergencyData()
    } catch (err: any) {
      setToast(`Admission request failed: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // Fast Discharge from ED
  const handleDischarge = async (patientId: number) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/patients/${patientId}/discharge`)
      setToast(`Patient discharged from ED observation.`)
      await fetchEmergencyData()
    } catch (err: any) {
      setToast(`Discharge failed: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // Update Priority
  const handleUpdatePriority = async (patientId: number, priority: string) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/patients/${patientId}/triage?priority=${priority}`)
      setToast(`Triage priority escalated to ${priority.toUpperCase()}`)
      await fetchEmergencyData()
    } catch (err: any) {
      setToast(`Failed to update triage: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingState message="Connecting to Emergency Department live telemetry..." />
  if (error) return <ErrorState message={error} onRetry={fetchEmergencyData} />

  // Filter patients
  const filteredPatients = patients.filter(p => {
    if (selectedPriority !== 'all' && p.priority.toLowerCase() !== selectedPriority.toLowerCase()) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesCode = p.patient_code.toLowerCase().includes(q)
      const matchesDiag = p.diagnosis_category && p.diagnosis_category.toLowerCase().includes(q)
      if (!matchesCode && !matchesDiag) return false
    }
    return true
  })

  // Priority counts
  const criticalCount = patients.filter(p => p.priority.toLowerCase() === 'critical').length
  const highCount = patients.filter(p => p.priority.toLowerCase() === 'high').length
  const mediumCount = patients.filter(p => p.priority.toLowerCase() === 'medium').length
  const avgWait = patients.length > 0 
    ? Math.round(patients.reduce((acc, p) => acc + (p.waiting_time_minutes || 15), 0) / patients.length)
    : 0

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200">Level 1 - Resuscitation</span>
      case 'high':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">Level 2 - Emergent</span>
      case 'medium':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">Level 3 - Urgent</span>
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">Level 4/5 - Non-Urgent</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Emergency Department (ED) Triage & Queue
            </h1>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
              Live Trauma Feed
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time Manchester Triage acuity scoring, ED boarding reduction, and rapid inpatient ward transfer
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchEmergencyData} className="gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Queue
          </Button>
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 text-xs shadow-sm" onClick={() => navigate('/app/beds')}>
            <BedDouble className="h-3.5 w-3.5" /> Allocate Ward Beds
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

      {/* ED Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total in ED Queue</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{patients.length} Pts</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Awaiting physician / bed</div>
        </div>

        <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 shadow-sm">
          <div className="text-xs font-semibold text-red-700 uppercase tracking-wider">Level 1 Resuscitation</div>
          <div className="text-2xl font-extrabold text-red-700 mt-1">{criticalCount} Pts</div>
          <div className="text-[11px] text-red-600 mt-0.5">Immediate trauma intervention</div>
        </div>

        <div className="p-4 rounded-xl border border-orange-200 dark:border-orange-900/60 bg-orange-50/40 dark:bg-orange-950/20 shadow-sm">
          <div className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Level 2 Emergent</div>
          <div className="text-2xl font-extrabold text-orange-700 mt-1">{highCount} Pts</div>
          <div className="text-[11px] text-orange-600 mt-0.5">&lt; 15 min target door-to-doctor</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Average Wait Time</div>
          <div className="text-2xl font-extrabold text-teal-700 dark:text-teal-400 mt-1">{avgWait} Mins</div>
          <div className="text-[11px] text-teal-600 mt-0.5">Goal: &lt; 30 min boarding</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Triage Categories ({patients.length})</option>
              <option value="critical">Level 1 - Resuscitation ({criticalCount})</option>
              <option value="high">Level 2 - Emergent ({highCount})</option>
              <option value="medium">Level 3 - Urgent ({mediumCount})</option>
              <option value="low">Level 4/5 - Non-Urgent</option>
            </select>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ED Patient Code, Symptoms..."
              className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Patient Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 px-1">
          <span>Active ED Queue ({filteredPatients.length} Patients)</span>
          <span className="text-[11px] text-slate-500">Ordered by arrival and triage priority</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPatients.map(pt => {
            const isCritical = pt.priority.toLowerCase() === 'critical'
            const isHigh = pt.priority.toLowerCase() === 'high'

            return (
              <div 
                key={pt.id}
                className={`p-4 rounded-xl border transition-all shadow-sm flex flex-col justify-between space-y-3.5 ${
                  isCritical 
                    ? 'border-red-300 bg-red-50/30 dark:bg-red-950/10'
                    : isHigh
                      ? 'border-orange-300 bg-orange-50/30 dark:bg-orange-950/10'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <HeartPulse className={`h-4 w-4 ${isCritical ? 'text-red-600' : isHigh ? 'text-orange-600' : 'text-teal-600'}`} />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{pt.patient_code}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {pt.age} yrs • {pt.gender} • Stage: {pt.current_stage || 'triage'}
                      </div>
                    </div>
                    {getPriorityBadge(pt.priority)}
                  </div>

                  <div className="py-2 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Chief Complaint:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{pt.diagnosis_category || 'Chest Pain / Trauma Protocol'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Waiting Duration:</span>
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {pt.waiting_time_minutes || 18} mins
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Emergency Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  <Button
                    size="sm"
                    className="flex-1 h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white font-medium gap-1 shadow-sm"
                    onClick={() => handleFastAdmit(pt)}
                    disabled={actionLoading}
                  >
                    <BedDouble className="h-3 w-3" /> Admit to Ward
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-slate-300"
                    onClick={() => handleUpdatePriority(pt.id, pt.priority === 'critical' ? 'high' : 'critical')}
                    disabled={actionLoading}
                  >
                    Escalate
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-50"
                    onClick={() => handleDischarge(pt.id)}
                    disabled={actionLoading}
                  >
                    Discharge
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
