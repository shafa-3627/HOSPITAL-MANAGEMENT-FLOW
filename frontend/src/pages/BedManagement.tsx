import React, { useState, useEffect } from 'react'
import { apiClient } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { 
  BedDouble, UserPlus, LogOut, RefreshCw, ArrowRightLeft, 
  Search, CheckCircle2, AlertCircle, Sparkles, Filter, X, ShieldAlert, HeartPulse
} from 'lucide-react'

interface BedItem {
  id: number
  department_id: number
  bed_number: string
  ward: string
  type: string
  status: string
  patient_id?: number | null
  equipment?: string
  isolation_capable?: boolean
}

interface PatientItem {
  id: number
  patient_code: string
  age: number
  gender: string
  priority: string
  status: string
  diagnosis_category?: string
  waiting_time_minutes?: number
  current_stage?: string
}

interface DepartmentItem {
  id: number
  name: string
  type: string
  total_beds: number
  occupied_beds: number
  available_beds: number
}

export default function BedManagement() {
  const [beds, setBeds] = useState<BedItem[]>([])
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [waitingPatients, setWaitingPatients] = useState<PatientItem[]>([])
  const [allPatients, setAllPatients] = useState<Record<number, PatientItem>>({})
  const [selectedDept, setSelectedDept] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Modal States
  const [assignModalBed, setAssignModalBed] = useState<BedItem | null>(null)
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null)
  
  const [transferModalBed, setTransferModalBed] = useState<BedItem | null>(null)
  const [targetBedId, setTargetBedId] = useState<number | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [bedsRes, deptsRes, patientsRes] = await Promise.all([
        apiClient.get('/beds'),
        apiClient.get('/departments'),
        apiClient.get('/patients')
      ])

      setBeds(bedsRes.data)
      setDepartments(deptsRes.data)

      const patientList: PatientItem[] = patientsRes.data
      const patientMap: Record<number, PatientItem> = {}
      const waitingList: PatientItem[] = []

      patientList.forEach(p => {
        patientMap[p.id] = p
        if (p.status === 'waiting' || !p.current_stage || p.current_stage === 'triage' || p.current_stage === 'bed_allocation') {
          waitingList.push(p)
        }
      })

      setAllPatients(patientMap)
      setWaitingPatients(waitingList)
      if (waitingList.length > 0) {
        setSelectedPatientId(waitingList[0].id)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load bed and patient matrix')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Assign Bed Action
  const handleAssignConfirm = async () => {
    if (!assignModalBed || !selectedPatientId) return
    setActionLoading(true)
    try {
      await apiClient.post(`/beds/allocate?bed_id=${assignModalBed.id}&patient_id=${selectedPatientId}`)
      const assignedPt = allPatients[selectedPatientId]
      setNotification({
        message: `Bed #${assignModalBed.bed_number} (${assignModalBed.ward}) successfully assigned to Patient ${assignedPt?.patient_code || selectedPatientId}!`,
        type: 'success'
      })
      setAssignModalBed(null)
      await fetchData()
    } catch (err: any) {
      setNotification({ message: err.message || 'Bed assignment failed', type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  // Release / Discharge Bed Action
  const handleReleaseConfirm = async (bed: BedItem) => {
    setActionLoading(true)
    try {
      await apiClient.post(`/beds/release?bed_id=${bed.id}`)
      setNotification({
        message: `Bed #${bed.bed_number} released and marked for sanitization/ready!`,
        type: 'success'
      })
      await fetchData()
    } catch (err: any) {
      setNotification({ message: err.message || 'Failed to release bed', type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  // Transfer Bed Action
  const handleTransferConfirm = async () => {
    if (!transferModalBed || !targetBedId) return
    setActionLoading(true)
    try {
      await apiClient.post(`/beds/transfer?source_bed_id=${transferModalBed.id}&target_bed_id=${targetBedId}`)
      setNotification({
        message: `Patient transferred from Bed #${transferModalBed.bed_number} to target Bed!`,
        type: 'success'
      })
      setTransferModalBed(null)
      await fetchData()
    } catch (err: any) {
      setNotification({ message: err.message || 'Transfer failed', type: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingState message="Loading hospital ward bed matrix..." />
  if (error) return <ErrorState message={error} onRetry={fetchData} />

  // Filter beds
  const filteredBeds = beds.filter(bed => {
    if (selectedDept !== 'all' && String(bed.department_id) !== selectedDept) return false
    if (selectedStatus !== 'all' && bed.status.toLowerCase() !== selectedStatus.toLowerCase()) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const patient = bed.patient_id ? allPatients[bed.patient_id] : null
      const matchesBed = bed.bed_number.toLowerCase().includes(q) || bed.ward.toLowerCase().includes(q)
      const matchesPatient = patient && (patient.patient_code.toLowerCase().includes(q) || (patient.diagnosis_category && patient.diagnosis_category.toLowerCase().includes(q)))
      if (!matchesBed && !matchesPatient) return false
    }
    return true
  })

  // Summary Metrics
  const totalBedsCount = beds.length
  const occupiedCount = beds.filter(b => b.status === 'occupied').length
  const availableCount = beds.filter(b => b.status === 'available').length
  const reservedCount = beds.filter(b => b.status === 'reserved').length
  const occupancyRate = totalBedsCount > 0 ? Math.round((occupiedCount / totalBedsCount) * 100) : 0

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Available</span>
      case 'occupied':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Occupied</span>
      case 'reserved':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Reserved</span>
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">Critical</span>
      case 'high':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700">High</span>
      case 'medium':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-800">Urgent</span>
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">Standard</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ward Bed Management & Allocation
            </h1>
            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
              Live Census
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time multi-ward occupancy, smart bed assignment, and clinical patient transfer
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Wards
          </Button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Ward Capacity Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Hospital Beds</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalBedsCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across all 5 clinical wards</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Available Beds</div>
          <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">{availableCount}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Ready for immediate admission</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Occupied Beds</div>
          <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 mt-1">{occupiedCount}</div>
          <div className="text-[11px] text-blue-600 mt-0.5">{occupancyRate}% Total Hospital Occupancy</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Waiting for Beds</div>
          <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 mt-1">{waitingPatients.length}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Triage & ED queue backlog</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Department Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="all">All Wards / Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={String(d.id)}>{d.name} ({d.type})</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Bed #, Ward, Patient..."
              className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bed Grid Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 px-1">
          <span>Showing {filteredBeds.length} of {beds.length} Ward Beds</span>
          <span className="text-[11px] text-slate-500">Green = Available • Blue = Occupied • Amber = Reserved</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredBeds.map(bed => {
            const isOccupied = bed.status.toLowerCase() === 'occupied'
            const isAvailable = bed.status.toLowerCase() === 'available'
            const patient = bed.patient_id ? allPatients[bed.patient_id] : null

            return (
              <div 
                key={bed.id}
                className={`rounded-xl border p-4 transition-all shadow-sm flex flex-col justify-between ${
                  isAvailable 
                    ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400' 
                    : isOccupied 
                      ? 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900/60 hover:border-blue-400'
                      : 'bg-white dark:bg-slate-900 border-amber-200 dark:border-amber-900/60'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <BedDouble className={`h-4 w-4 ${isAvailable ? 'text-emerald-600' : isOccupied ? 'text-blue-600' : 'text-amber-600'}`} />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">Bed #{bed.bed_number}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {bed.ward} • {bed.type}
                      </div>
                    </div>
                    {getStatusBadge(bed.status)}
                  </div>

                  {/* Patient Info or Equipment Details */}
                  <div className="py-3 text-xs space-y-1.5 min-h-[64px]">
                    {isOccupied && patient ? (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">{patient.patient_code}</span>
                          {getPriorityBadge(patient.priority)}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                          {patient.age}y / {patient.gender} • {patient.diagnosis_category || 'General Inpatient'}
                        </div>
                        <div className="text-teal-700 dark:text-teal-400 text-[10px] font-medium mt-1">
                          Stage: {patient.current_stage || 'treatment'}
                        </div>
                      </div>
                    ) : isAvailable ? (
                      <div className="space-y-1">
                        <div className="text-emerald-700 dark:text-emerald-400 font-medium text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Sanitized & Ready
                        </div>
                        <div className="text-slate-500 text-[11px]">
                          Equipped: {bed.equipment || 'Standard Vitals Monitor'}
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-500 text-[11px]">
                        Reserved for incoming critical transfer
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  {isAvailable && (
                    <Button 
                      size="sm" 
                      className="w-full h-8 text-xs bg-teal-600 hover:bg-teal-700 text-white font-medium gap-1"
                      onClick={() => setAssignModalBed(bed)}
                    >
                      <UserPlus className="h-3.5 w-3.5" /> Assign Bed
                    </Button>
                  )}

                  {isOccupied && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-8 text-xs border-slate-300 hover:bg-slate-100 gap-1"
                        onClick={() => setTransferModalBed(bed)}
                        title="Transfer Patient to another ward/bed"
                      >
                        <ArrowRightLeft className="h-3 w-3 text-slate-600" /> Transfer
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1 h-8 text-xs border-red-200 text-red-700 hover:bg-red-50 gap-1"
                        onClick={() => handleReleaseConfirm(bed)}
                        title="Discharge Patient and Free Bed"
                      >
                        <LogOut className="h-3 w-3 text-red-600" /> Discharge
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ASSIGN BED MODAL */}
      {/* ========================================================================= */}
      {assignModalBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Assign Patient to Bed #{assignModalBed.bed_number}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {assignModalBed.ward} • {assignModalBed.type} Ward
                  </p>
                </div>
              </div>
              <button onClick={() => setAssignModalBed(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300">Selected Bed Details:</div>
                <div className="text-slate-500">Ward: <strong className="text-slate-900 dark:text-white">{assignModalBed.ward}</strong> | Equipment: {assignModalBed.equipment || 'Standard Vitals Monitor'}</div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold">Select Waiting / Triage Patient to Admit:</Label>
                {waitingPatients.length === 0 ? (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    No patients currently waiting in triage queue.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {waitingPatients.map(pt => (
                      <div
                        key={pt.id}
                        onClick={() => setSelectedPatientId(pt.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                          selectedPatientId === pt.id 
                            ? 'border-teal-600 bg-teal-50/70 dark:bg-teal-950/40 text-slate-900 dark:text-white font-medium shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{pt.patient_code}</span>
                            <span className="text-[11px] font-normal text-slate-500">({pt.age}y / {pt.gender})</span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {pt.diagnosis_category || 'Triage Evaluation'} • Waiting: {pt.waiting_time_minutes || 15}m
                          </div>
                        </div>
                        {getPriorityBadge(pt.priority)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button variant="ghost" size="sm" onClick={() => setAssignModalBed(null)}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs gap-1.5 shadow-sm"
                onClick={handleAssignConfirm}
                disabled={actionLoading || !selectedPatientId}
              >
                <CheckCircle2 className="h-4 w-4" />
                {actionLoading ? 'Allocating Bed...' : 'Confirm Admission'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TRANSFER BED MODAL */}
      {/* ========================================================================= */}
      {transferModalBed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="relative w-full max-w-md rounded-2xl border bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Transfer Patient from Bed #{transferModalBed.bed_number}
                  </h3>
                  <p className="text-xs text-slate-500">Current Ward: {transferModalBed.ward}</p>
                </div>
              </div>
              <button onClick={() => setTransferModalBed(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <Label className="text-xs font-semibold">Select Destination Available Bed:</Label>
              <select
                value={targetBedId || ''}
                onChange={(e) => setTargetBedId(Number(e.target.value))}
                className="w-full h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">-- Choose Available Target Bed --</option>
                {beds.filter(b => b.status === 'available' && b.id !== transferModalBed.id).map(b => (
                  <option key={b.id} value={b.id}>
                    Bed #{b.bed_number} ({b.ward} - {b.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button variant="ghost" size="sm" onClick={() => setTransferModalBed(null)}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs gap-1.5 shadow-sm"
                onClick={handleTransferConfirm}
                disabled={actionLoading || !targetBedId}
              >
                <ArrowRightLeft className="h-4 w-4" />
                {actionLoading ? 'Transferring...' : 'Confirm Ward Transfer'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
