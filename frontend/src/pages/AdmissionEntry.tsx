import React, { useState, useEffect } from 'react'
import { apiClient } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/shared/LoadingState'
import {
  UserPlus,
  BedDouble,
  Building2,
  Stethoscope,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Clock,
  Phone,
  User,
  HeartPulse,
  Check,
  X,
  RefreshCw,
  LogOut,
  Sparkles
} from 'lucide-react'

interface DepartmentItem {
  id: number
  hospital_id: number
  name: string
  type: string
  total_beds: number
  occupied_beds: number
  available_beds: number
}

interface BedItem {
  id: number
  bed_number: string
  ward: string
  type: string
  status: string
  department_id: number
}

interface PatientItem {
  id: number
  patient_code: string
  patient_name?: string
  age: number
  gender: string
  contact_number?: string
  department_id: number
  department_name?: string
  bed_id?: number | null
  bed_number?: string
  status: string
  admission_type?: string
  priority: string
  doctor_name?: string
  chief_complaint?: string
  diagnosis_category?: string
  arrival_time: string
  admission_time?: string
  icu_required?: boolean
  emergency_flag?: boolean
}

const DOCTOR_PRESETS = [
  "Dr. Sarah Lin (Emergency / Trauma)",
  "Dr. Rajesh Sharma (Critical Care & ICU)",
  "Dr. Emily Watson (General Medicine)",
  "Dr. David Kim (Cardiology)",
  "Dr. Ananya Patel (Pediatrics)",
  "Dr. Robert Sterling (General Surgery & OR)"
]

export default function AdmissionEntry() {
  // Data States
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [availableBeds, setAvailableBeds] = useState<BedItem[]>([])
  const [recentPatients, setRecentPatients] = useState<PatientItem[]>([])
  
  // Loading & Error States
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingDepartments, setLoadingDepartments] = useState(false)
  const [deptLoadError, setDeptLoadError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form State
  const [patientName, setPatientName] = useState('')
  const [patientCode, setPatientCode] = useState('')
  const [age, setAge] = useState<string>('')
  const [gender, setGender] = useState('Male')
  const [contactNumber, setContactNumber] = useState('')
  const [departmentId, setDepartmentId] = useState<number | ''>('')
  const [doctorName, setDoctorName] = useState('')
  const [admissionType, setAdmissionType] = useState('General')
  const [priority, setPriority] = useState('medium')
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [icuRequired, setIcuRequired] = useState(false)
  const [bedAssignmentMode, setBedAssignmentMode] = useState<'auto' | 'manual'>('auto')
  const [selectedBedId, setSelectedBedId] = useState<number | ''>('')

  // Form Validation State
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  // Success Notification Dialog
  const [successInfo, setSuccessInfo] = useState<{
    patientCode: string
    patientName: string
    departmentName: string
    priority: string
    bedNumber: string
    admissionTime: string
  } | null>(null)

  // 1. Fetch Departments with Isolated Error Handling
  const fetchDepartments = async () => {
    setLoadingDepartments(true)
    setDeptLoadError(null)
    try {
      const res = await apiClient.get('/departments')
      const data: DepartmentItem[] = res.data || []
      // Prioritize Hospital 1 (Apex General) departments if multi-hospital
      const h1Depts = data.filter(d => d.hospital_id === 1)
      const finalDepts = h1Depts.length > 0 ? h1Depts : data
      setDepartments(finalDepts)
      
      // If no department is currently selected and we have departments, preselect the first available
      if (finalDepts.length > 0 && departmentId === '') {
        setDepartmentId(finalDepts[0].id)
      }
    } catch (err: any) {
      setDeptLoadError(err.message || 'Failed to load hospital departments')
    } finally {
      setLoadingDepartments(false)
    }
  }

  // 2. Fetch Available Beds
  const fetchBeds = async () => {
    try {
      const res = await apiClient.get('/beds?status=available')
      setAvailableBeds(res.data || [])
    } catch (err) {
      console.warn('Could not fetch available beds', err)
    }
  }

  // 3. Fetch Recent Admissions
  const fetchPatients = async () => {
    try {
      const res = await apiClient.get('/patients?limit=30')
      setRecentPatients(res.data || [])
    } catch (err) {
      console.warn('Could not fetch recent patients', err)
    }
  }

  // Initial Orchestrated Load
  const fetchAllData = async () => {
    setLoadingInitial(true)
    setGeneralError(null)
    try {
      await Promise.allSettled([
        fetchDepartments(),
        fetchBeds(),
        fetchPatients()
      ])
    } finally {
      setLoadingInitial(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  const handleClear = () => {
    setPatientName('')
    setPatientCode('')
    setAge('')
    setGender('Male')
    setContactNumber('')
    setDoctorName('')
    setAdmissionType('General')
    setPriority('medium')
    setChiefComplaint('')
    setIcuRequired(false)
    setBedAssignmentMode('auto')
    setSelectedBedId('')
    setFormErrors({})
    // Keep the current departmentId selected or select the first available
    if (departments.length > 0) {
      setDepartmentId(departments[0].id)
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!patientName.trim()) {
      errors.patientName = 'Patient Name is required'
    }

    if (!age || isNaN(Number(age)) || Number(age) < 0 || Number(age) > 130) {
      errors.age = 'Valid age (0 - 130) is required'
    }

    if (!gender) {
      errors.gender = 'Gender selection is required'
    }

    if (!departmentId) {
      errors.departmentId = 'Department is required'
    }

    if (!admissionType) {
      errors.admissionType = 'Admission Type is required'
    }

    if (!priority) {
      errors.priority = 'Priority is required'
    }

    if (bedAssignmentMode === 'manual' && !selectedBedId) {
      errors.selectedBedId = 'Please select a specific available bed'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAdmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    setGeneralError(null)

    try {
      const payload = {
        patient_name: patientName.trim(),
        patient_code: patientCode.trim() || undefined,
        age: Number(age),
        gender,
        contact_number: contactNumber.trim() || undefined,
        department_id: Number(departmentId),
        doctor_name: doctorName.trim() || 'On-Duty Attending Physician',
        admission_type: admissionType,
        priority: priority.toLowerCase(),
        chief_complaint: chiefComplaint.trim() || undefined,
        icu_required: icuRequired || admissionType === 'ICU',
        emergency_flag: admissionType === 'Emergency',
        bed_required: true,
        bed_id: bedAssignmentMode === 'manual' && selectedBedId ? Number(selectedBedId) : undefined
      }

      const res = await apiClient.post('/patients/admit', payload)
      const admitted: PatientItem = res.data

      const selectedDept = departments.find(d => d.id === Number(departmentId))
      const bedDisplay = admitted.bed_number || (admitted.bed_id ? `Bed #${admitted.bed_id}` : 'Assigned')

      setSuccessInfo({
        patientCode: admitted.patient_code || `P-${Math.floor(1000 + Math.random() * 9000)}`,
        patientName: admitted.patient_name || patientName || 'Inpatient',
        departmentName: admitted.department_name || selectedDept?.name?.replace('Apex General Hospital - ', '') || 'Department Assigned',
        priority: (admitted.priority || priority || 'medium').toUpperCase(),
        bedNumber: bedDisplay,
        admissionTime: new Date(admitted.arrival_time || Date.now()).toLocaleTimeString()
      })

      // Reset form fields
      setPatientName('')
      setPatientCode('')
      setAge('')
      setContactNumber('')
      setChiefComplaint('')
      setSelectedBedId('')
      setFormErrors({})

      // Refresh live system state
      await Promise.allSettled([
        fetchDepartments(),
        fetchBeds(),
        fetchPatients()
      ])
    } catch (err: any) {
      setGeneralError(err.response?.data?.detail || err.message || 'Failed to complete admission')
    } finally {
      setSubmitting(false)
    }
  }

  // Quick Discharge Action from Table
  const handleDischargePatient = async (patientId: number) => {
    try {
      await apiClient.post(`/patients/${patientId}/discharge`)
      await Promise.allSettled([
        fetchDepartments(),
        fetchBeds(),
        fetchPatients()
      ])
    } catch (err: any) {
      setGeneralError(err.response?.data?.detail || err.message || 'Failed to discharge patient')
    }
  }

  // Filtered available beds for the currently selected department
  const selectedDeptBeds = availableBeds.filter(b => b.department_id === Number(departmentId))
  const selectedDept = departments.find(d => d.id === Number(departmentId))

  // Filtered search query for table
  const filteredPatients = recentPatients.filter(p => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.patient_code?.toLowerCase().includes(q) ||
      p.patient_name?.toLowerCase().includes(q) ||
      p.doctor_name?.toLowerCase().includes(q) ||
      p.diagnosis_category?.toLowerCase().includes(q) ||
      p.department_name?.toLowerCase().includes(q)
    )
  })

  if (loadingInitial) return <LoadingState message="Connecting to YODHA Admissions Desk and Ward Census..." />

  return (
    <div className="space-y-6 pb-12 font-sans selection:bg-[#357df9]/20">
      
      {/* 1. Header Overview Bar */}
      <div className="rounded-2xl p-6 bg-white border border-[#dadce0] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#357df9] to-[#33bd4a] text-white flex items-center justify-center shadow-md">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#1D3557]">
                Patient Admission Entry
              </h1>
              <p className="text-xs text-[#727586] font-medium">
                Hospital Intake Desk: Register inpatients, assign clinical beds, and synchronize hospital-wide flow telemetry.
              </p>
            </div>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center gap-2">
            <span className="text-emerald-700 font-semibold">Available Beds:</span>
            <span className="font-mono font-black text-emerald-900">{availableBeds.length}</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs flex items-center gap-2">
            <span className="text-blue-700 font-semibold">Active Inpatients:</span>
            <span className="font-mono font-black text-blue-950">
              {recentPatients.filter(p => p.status !== 'discharged').length}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchAllData}
            className="h-8 text-xs font-bold rounded-full border-[#dadce0] hover:bg-slate-50 gap-1.5"
          >
            <RefreshCw size={13} className="text-[#357df9]" />
            <span>Sync</span>
          </Button>
        </div>
      </div>

      {/* 2. Success Banner Modal */}
      {successInfo && (
        <div className="p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 shadow-md animate-in fade-in transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Check className="h-5 w-5 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-sm font-black text-emerald-950">
                  Patient Admitted Successfully
                </h3>
                <p className="text-xs text-emerald-800 font-medium mt-0.5">
                  The admission has been recorded in the database, bed allocation synchronized, and hospital telemetry updated.
                </p>
              </div>
            </div>
            <button
              onClick={() => setSuccessInfo(null)}
              className="p-1 rounded-md text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-emerald-200/80 text-xs font-medium text-emerald-900">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Patient ID</span>
              <span className="font-mono font-black text-sm text-[#1D3557]">{successInfo.patientCode}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Patient Name</span>
              <span className="font-bold text-slate-900">{successInfo.patientName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Department</span>
              <span className="font-bold text-slate-800">{successInfo.departmentName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Priority Acuity</span>
              <Badge className={`text-[10px] font-bold ${
                successInfo.priority === 'CRITICAL' ? 'bg-red-600 text-white' :
                successInfo.priority === 'HIGH' ? 'bg-amber-500 text-white' :
                'bg-emerald-600 text-white'
              }`}>
                {successInfo.priority}
              </Badge>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Assigned Bed</span>
              <span className="font-mono font-bold text-emerald-950">{successInfo.bedNumber}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Admission Time</span>
              <span className="font-mono font-semibold text-slate-700">{successInfo.admissionTime}</span>
            </div>
          </div>
        </div>
      )}

      {/* General Error Banner */}
      {generalError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{generalError}</span>
          </div>
          <button onClick={() => setGeneralError(null)} className="p-1 hover:opacity-75"><X size={14} /></button>
        </div>
      )}

      {/* 3. Main Admission Entry Form */}
      <form onSubmit={handleAdmit}>
        <Card className="border-[#dadce0] bg-white rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="bg-[#f8fafc] border-b border-[#dadce0] py-4 px-6">
            <CardTitle className="text-base font-black text-[#1D3557] flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-[#357df9]" />
              Inpatient Admission Intake Form
            </CardTitle>
            <CardDescription className="text-xs text-[#727586]">
              Please fill in patient demographics, target clinical department, and bed assignment details.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            
            {/* Section 1: Patient Demographics */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-[#357df9] mb-3 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> 1. Patient Demographics
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                
                {/* Patient Full Name */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-[#1D3557]">
                    Patient Full Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g. Eleanor Vance"
                    value={patientName}
                    onChange={e => {
                      setPatientName(e.target.value)
                      if (formErrors.patientName) setFormErrors({ ...formErrors, patientName: '' })
                    }}
                    className={`h-9 text-xs font-semibold ${formErrors.patientName ? 'border-red-400 bg-red-50/40' : 'border-[#dadce0]'}`}
                  />
                  {formErrors.patientName && (
                    <p className="text-[10px] text-red-600 font-semibold">{formErrors.patientName}</p>
                  )}
                </div>

                {/* Patient ID / UHID */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1D3557]">
                    Patient ID / UHID <span className="text-[10px] font-normal text-slate-500">(Auto if blank)</span>
                  </label>
                  <Input
                    placeholder="P-XXXX"
                    value={patientCode}
                    onChange={e => setPatientCode(e.target.value)}
                    className="h-9 text-xs font-mono font-semibold border-[#dadce0]"
                  />
                </div>

                {/* Age */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1D3557]">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="130"
                    placeholder="e.g. 45"
                    value={age}
                    onChange={e => {
                      setAge(e.target.value)
                      if (formErrors.age) setFormErrors({ ...formErrors, age: '' })
                    }}
                    className={`h-9 text-xs font-semibold ${formErrors.age ? 'border-red-400 bg-red-50/40' : 'border-[#dadce0]'}`}
                  />
                  {formErrors.age && (
                    <p className="text-[10px] text-red-600 font-semibold">{formErrors.age}</p>
                  )}
                </div>

                {/* Gender */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1D3557]">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full h-9 rounded-md border border-[#dadce0] bg-white px-3 text-xs font-semibold text-[#1D3557] focus:outline-hidden focus:ring-2 focus:ring-[#357df9]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Contact Number */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-[#1D3557]">
                    Contact Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="e.g. +91 98765 43210"
                    value={contactNumber}
                    onChange={e => setContactNumber(e.target.value)}
                    className="h-9 text-xs font-semibold border-[#dadce0]"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Clinical Placement & Department */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#357df9] flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> 2. Clinical Placement & Acuity
                </h4>
                {selectedDept && (
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {selectedDept.available_beds} beds free in {selectedDept.name.replace('Apex General Hospital - ', '')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                
                {/* Department Selection Dropdown */}
                <div className="space-y-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[#1D3557]">
                      Department <span className="text-red-500">*</span>
                    </label>
                    {deptLoadError && (
                      <button
                        type="button"
                        onClick={fetchDepartments}
                        className="text-[10px] text-blue-600 font-bold hover:underline"
                      >
                        Retry Loading
                      </button>
                    )}
                  </div>

                  <select
                    value={departmentId}
                    disabled={loadingDepartments}
                    onChange={e => {
                      const val = Number(e.target.value)
                      setDepartmentId(val)
                      setSelectedBedId('')
                      if (formErrors.departmentId) setFormErrors({ ...formErrors, departmentId: '' })
                    }}
                    className={`w-full h-9 rounded-md border bg-white px-3 text-xs font-semibold text-[#1D3557] focus:outline-hidden focus:ring-2 focus:ring-[#357df9] ${
                      formErrors.departmentId ? 'border-red-400 bg-red-50/40' : 'border-[#dadce0]'
                    }`}
                  >
                    {loadingDepartments ? (
                      <option value="" disabled>⏳ Loading hospital departments...</option>
                    ) : deptLoadError ? (
                      <option value="" disabled>⚠️ Failed to load departments (click retry)</option>
                    ) : departments.length === 0 ? (
                      <option value="" disabled>No active departments found</option>
                    ) : (
                      <>
                        <option value="">-- Select Hospital Department * --</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name.replace('Apex General Hospital - ', '')} ({d.available_beds} beds free / {d.total_beds} total)
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  {formErrors.departmentId && (
                    <p className="text-[10px] text-red-600 font-semibold">{formErrors.departmentId}</p>
                  )}
                </div>

                {/* Attending Doctor */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-[#1D3557]">
                    Attending / Assigned Doctor
                  </label>
                  <Input
                    placeholder="e.g. Dr. Sarah Lin"
                    value={doctorName}
                    onChange={e => setDoctorName(e.target.value)}
                    className="h-9 text-xs font-semibold border-[#dadce0]"
                    list="doctors-list-presets"
                  />
                  <datalist id="doctors-list-presets">
                    {DOCTOR_PRESETS.map((doc, idx) => (
                      <option key={idx} value={doc} />
                    ))}
                  </datalist>
                </div>

                {/* Admission Type */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1D3557]">
                    Admission Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={admissionType}
                    onChange={e => {
                      const val = e.target.value
                      setAdmissionType(val)
                      if (val === 'ICU') setIcuRequired(true)
                      if (val === 'Emergency') setPriority('high')
                    }}
                    className="w-full h-9 rounded-md border border-[#dadce0] bg-white px-3 text-xs font-semibold text-[#1D3557] focus:outline-hidden focus:ring-2 focus:ring-[#357df9]"
                  >
                    <option value="General">General Inpatient</option>
                    <option value="Emergency">Emergency</option>
                    <option value="ICU">Intensive Care (ICU)</option>
                    <option value="Referral">External Referral</option>
                  </select>
                </div>

                {/* Priority Acuity Selector */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-[#1D3557] block">
                    Triage Priority Acuity <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { val: 'low', label: 'Low', color: 'border-emerald-300 text-emerald-800' },
                      { val: 'medium', label: 'Medium', color: 'border-blue-300 text-blue-800' },
                      { val: 'high', label: 'High', color: 'border-amber-300 text-amber-800' },
                      { val: 'critical', label: 'Critical', color: 'border-red-400 text-red-700' }
                    ].map(p => (
                      <button
                        type="button"
                        key={p.val}
                        onClick={() => setPriority(p.val)}
                        className={`h-9 rounded-lg border text-xs font-bold transition-all ${p.color} ${
                          priority === p.val 
                            ? 'ring-2 ring-[#357df9] bg-slate-100 shadow-xs' 
                            : 'bg-white hover:bg-slate-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ICU Required Checkbox */}
                <div className="space-y-1 flex flex-col justify-center">
                  <label className="text-xs font-bold text-[#1D3557]">ICU Required</label>
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={icuRequired}
                      onChange={e => setIcuRequired(e.target.checked)}
                      className="rounded border-slate-300 text-[#357df9] focus:ring-[#357df9] h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">ICU Isolation / Monitored</span>
                  </label>
                </div>

                {/* Chief Complaint / Symptoms */}
                <div className="space-y-1 md:col-span-3 lg:col-span-4">
                  <label className="text-xs font-bold text-[#1D3557]">
                    Chief Complaint / Diagnosis Summary
                  </label>
                  <Input
                    placeholder="e.g. Acute chest discomfort, suspected ACS, elevated troponin"
                    value={chiefComplaint}
                    onChange={e => setChiefComplaint(e.target.value)}
                    className="h-9 text-xs font-semibold border-[#dadce0]"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Bed Assignment Mode */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#357df9] mb-3 flex items-center gap-1.5">
                <BedDouble className="h-3.5 w-3.5" /> 3. Bed Assignment Mode
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1D3557]">
                    <input
                      type="radio"
                      name="bedAssignmentRadio"
                      checked={bedAssignmentMode === 'auto'}
                      onChange={() => setBedAssignmentMode('auto')}
                      className="text-[#357df9] focus:ring-[#357df9]"
                    />
                    <span>Auto-Assign Bed (Recommended)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1D3557]">
                    <input
                      type="radio"
                      name="bedAssignmentRadio"
                      checked={bedAssignmentMode === 'manual'}
                      onChange={() => setBedAssignmentMode('manual')}
                      className="text-[#357df9] focus:ring-[#357df9]"
                    />
                    <span>Manual Bed Selection</span>
                  </label>
                </div>

                {/* Manual Bed Selection Dropdown */}
                {bedAssignmentMode === 'manual' && (
                  <div className="space-y-1 animate-in fade-in">
                    <select
                      value={selectedBedId}
                      onChange={e => {
                        setSelectedBedId(Number(e.target.value))
                        if (formErrors.selectedBedId) setFormErrors({ ...formErrors, selectedBedId: '' })
                      }}
                      className={`w-full h-9 rounded-md border bg-white px-3 text-xs font-semibold text-[#1D3557] focus:outline-hidden focus:ring-2 focus:ring-[#357df9] ${
                        formErrors.selectedBedId ? 'border-red-400 bg-red-50/40' : 'border-[#dadce0]'
                      }`}
                    >
                      <option value="">-- Choose Available Bed in this Department --</option>
                      {selectedDeptBeds.length === 0 ? (
                        <option value="" disabled>No available beds in this department</option>
                      ) : (
                        selectedDeptBeds.map(b => (
                          <option key={b.id} value={b.id}>
                            Bed #{b.bed_number} ({b.ward} - {b.type})
                          </option>
                        ))
                      )}
                    </select>
                    {formErrors.selectedBedId && (
                      <p className="text-[10px] text-red-600 font-semibold">{formErrors.selectedBedId}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

          </CardContent>

          {/* Form Actions Footer */}
          <CardFooter className="bg-[#f8fafc] border-t border-[#dadce0] py-4 px-6 flex justify-end items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={submitting}
              className="h-9 text-xs font-bold rounded-full px-5 border-[#dadce0] hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
              Clear
            </Button>

            <Button
              type="submit"
              disabled={submitting}
              className="h-9 text-xs font-bold rounded-full px-6 bg-[#357df9] hover:bg-[#2563eb] text-white shadow-xs"
            >
              {submitting ? (
                <span className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 animate-spin" />
                  Processing Admission...
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <UserPlus className="h-3.5 w-3.5" />
                  Admit Patient
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* 4. Live Recent Inpatient Admissions Table */}
      <Card className="border-[#dadce0] bg-white rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="py-4 px-6 bg-[#f8fafc] border-b border-[#dadce0]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-base font-black text-[#1D3557] flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-[#33bd4a]" />
                Recent Inpatient Admissions
              </CardTitle>
              <CardDescription className="text-xs text-[#727586]">
                Real-time admissions synchronized with Patient Flow, Bed Management, and Command Center.
              </CardDescription>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="Search patient, ID, doctor..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs font-medium border-[#dadce0]"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#dadce0] bg-slate-50/75 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Patient ID</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Bed</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Admission Time</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                      No inpatient records found matching your search query.
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((p) => {
                    const deptObj = departments.find(d => d.id === p.department_id)
                    const deptName = p.department_name || (deptObj ? deptObj.name.replace('Apex General Hospital - ', '') : 'General')
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#1D3557]">
                          {p.patient_code}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {p.patient_name || `Patient (${p.gender}, ${p.age}y)`}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {deptName}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            p.priority === 'critical' ? 'bg-red-600 text-white' :
                            p.priority === 'high' ? 'bg-amber-500 text-white' :
                            p.priority === 'medium' ? 'bg-blue-500 text-white' :
                            'bg-slate-500 text-white'
                          }`}>
                            {(p.priority || 'medium').toUpperCase()}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">
                          {p.doctor_name || 'Dr. On Duty'}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-[#1D3557]">
                          {p.bed_number ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {p.bed_number}
                            </span>
                          ) : p.bed_id ? (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Bed #{p.bed_id}
                            </span>
                          ) : (
                            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Queue
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            p.status === 'admitted' ? 'bg-emerald-100 text-emerald-800' :
                            p.status === 'waiting' ? 'bg-amber-100 text-amber-800' :
                            p.status === 'discharged' ? 'bg-slate-100 text-slate-600' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {new Date(p.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {p.status !== 'discharged' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDischargePatient(p.id)}
                              className="h-7 px-2.5 text-[11px] font-bold text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              title="Discharge patient and release bed"
                            >
                              <LogOut className="h-3 w-3 mr-1" />
                              Discharge
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
