import React, { useState, useEffect } from 'react'
import { apiClient } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { 
  GitBranch, Users, Clock, ArrowRight, CheckCircle2, AlertTriangle, 
  Search, Filter, Activity, BedDouble, RefreshCw, X, ShieldAlert, HeartPulse
} from 'lucide-react'

interface PatientItem {
  id: number
  patient_code: string
  age: number
  gender: string
  priority: string
  status: string
  current_stage?: string
  diagnosis_category?: string
  waiting_time_minutes?: number
  department_id?: number
  bed_id?: number | null
}

const FLOW_STAGES = [
  { id: 'ambulance', label: '1. Arrival / EMS', desc: 'Incoming trauma & walk-ins' },
  { id: 'registration', label: '2. Registration', desc: 'Identity & intake verification' },
  { id: 'triage', label: '3. Clinical Triage', desc: 'Manchester / Canadian acuity' },
  { id: 'diagnosis', label: '4. Diagnostics', desc: 'Labs, X-Ray, CT imaging' },
  { id: 'admission', label: '5. Ward Admission', desc: 'Physician admission order' },
  { id: 'bed_allocation', label: '6. Bed Allocation', desc: 'Bed matching & room prep' },
  { id: 'treatment', label: '7. Inpatient Care', desc: 'Medical & nursing care' },
  { id: 'transfer', label: '8. Ward Transfer', desc: 'ICU / stepdown transfer' },
  { id: 'discharge', label: '9. Discharge', desc: 'Handover & bed release' },
]

export default function PatientFlow() {
  const [patients, setPatients] = useState<PatientItem[]>([])
  const [selectedStage, setSelectedStage] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get('/patients')
      setPatients(res.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load patient flow telemetry')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Advance Patient Stage
  const handleAdvanceStage = async (patient: PatientItem, nextStage: string) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/patients/${patient.id}/update-stage?stage=${nextStage}`)
      setToast(`Patient ${patient.patient_code} advanced to stage: ${nextStage.replace('_', ' ').toUpperCase()}`)
      await fetchData()
    } catch (err: any) {
      setToast(`Failed to update stage: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // Update Triage Priority
  const handleUpdatePriority = async (patientId: number, priority: string) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/patients/${patientId}/triage?priority=${priority}`)
      setToast(`Triage priority updated to ${priority.toUpperCase()}`)
      await fetchData()
    } catch (err: any) {
      setToast(`Triage update failed: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  // Discharge Patient
  const handleDischarge = async (patientId: number) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/patients/${patientId}/discharge`)
      setToast(`Patient successfully discharged and bed marked free.`)
      await fetchData()
    } catch (err: any) {
      setToast(`Discharge failed: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingState message="Mapping hospital patient flow pathways..." />
  if (error) return <ErrorState message={error} onRetry={fetchData} />

  // Filter patients
  const filteredPatients = patients.filter(p => {
    if (selectedStage !== 'all' && (p.current_stage || 'triage') !== selectedStage) return false
    if (selectedPriority !== 'all' && p.priority.toLowerCase() !== selectedPriority.toLowerCase()) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesCode = p.patient_code.toLowerCase().includes(q)
      const matchesDiag = p.diagnosis_category && p.diagnosis_category.toLowerCase().includes(q)
      if (!matchesCode && !matchesDiag) return false
    }
    return true
  })

  // Calculate Stage Counts
  const stageCounts: Record<string, number> = {}
  FLOW_STAGES.forEach(s => { stageCounts[s.id] = 0 })
  patients.forEach(p => {
    const s = p.current_stage || 'triage'
    if (stageCounts[s] !== undefined) stageCounts[s]++
    else stageCounts['triage'] = (stageCounts['triage'] || 0) + 1
  })

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-800 border border-red-200">Critical (L1)</span>
      case 'high':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">Emergent (L2)</span>
      case 'medium':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">Urgent (L3)</span>
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">Standard (L4/L5)</span>
    }
  }

  const getNextStageId = (currentStage?: string) => {
    const idx = FLOW_STAGES.findIndex(s => s.id === (currentStage || 'ambulance'))
    if (idx >= 0 && idx < FLOW_STAGES.length - 1) {
      return FLOW_STAGES[idx + 1].id
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Patient Flow & Bottleneck Pathway
            </h1>
            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
              9-Stage Pipeline
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time visual tracking of patient journeys from arrival and triage to admission, bed assignment, and discharge
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5 text-xs">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Pipeline
        </Button>
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

      {/* 9-Stage Flow Pipeline Visualizer */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <GitBranch className="h-4 w-4 text-teal-600" />
              Live Hospital Flow Stage Radar
            </CardTitle>
            <span className="text-xs text-slate-500">
              Click any stage to filter active patients
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2">
            {FLOW_STAGES.map((stage, i) => {
              const count = stageCounts[stage.id] || 0
              const isSelected = selectedStage === stage.id
              const isBottleneck = stage.id === 'bed_allocation' && count > 15

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setSelectedStage(selectedStage === stage.id ? 'all' : stage.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative ${
                    isSelected 
                      ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/60 shadow-sm'
                      : isBottleneck
                        ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20 hover:border-red-400'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-500 truncate">{stage.label}</div>
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-lg font-extrabold text-slate-900 dark:text-white">{count}</span>
                    <span className="text-[10px] text-slate-500">pts</span>
                  </div>
                  {isBottleneck && (
                    <span className="inline-block mt-1 px-1 py-0.2 rounded text-[9px] font-bold bg-red-100 text-red-700">
                      Choke Point
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filter and Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Stage Selector */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="all">All 9 Stages ({patients.length} patients)</option>
                {FLOW_STAGES.map(s => (
                  <option key={s.id} value={s.id}>{s.label} ({stageCounts[s.id] || 0} pts)</option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Triage Levels</option>
              <option value="critical">Critical (L1)</option>
              <option value="high">Emergent (L2)</option>
              <option value="medium">Urgent (L3)</option>
              <option value="low">Standard (L4/L5)</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Patient Code, Diagnosis..."
              className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patient Directory Table & Cards */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-1">
          Active Patients in Selected Stage ({filteredPatients.length})
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPatients.map(patient => {
            const nextStage = getNextStageId(patient.current_stage)

            return (
              <div
                key={patient.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:border-teal-400 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{patient.patient_code}</span>
                      <div className="text-[11px] text-slate-500">{patient.age} yrs • {patient.gender}</div>
                    </div>
                    {getPriorityBadge(patient.priority)}
                  </div>

                  <div className="py-2 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Condition:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{patient.diagnosis_category || 'Clinical Evaluation'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Stage:</span>
                      <span className="font-bold text-teal-700 dark:text-teal-400 uppercase text-[11px]">
                        {(patient.current_stage || 'triage').replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Wait / Flow Time:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{patient.waiting_time_minutes || 24} mins</span>
                    </div>
                    {patient.bed_id && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Assigned Bed:</span>
                        <span className="font-semibold text-blue-600">Bed #{patient.bed_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5">
                  {nextStage && (
                    <Button
                      size="sm"
                      className="flex-1 h-7 text-xs bg-teal-600 hover:bg-teal-700 text-white font-medium gap-1 shadow-sm"
                      onClick={() => handleAdvanceStage(patient, nextStage)}
                      disabled={actionLoading}
                    >
                      <span>Move to {nextStage.replace('_', ' ')}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}

                  {patient.status !== 'discharged' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => handleDischarge(patient.id)}
                      disabled={actionLoading}
                    >
                      Discharge
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
