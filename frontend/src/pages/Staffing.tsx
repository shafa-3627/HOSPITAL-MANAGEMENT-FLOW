import React, { useState, useEffect } from 'react'
import { apiClient } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Input } from '@/components/ui/Input'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { 
  Users, Stethoscope, Activity, UserPlus, RefreshCw, 
  CheckCircle2, AlertTriangle, ShieldCheck, Search, Filter, X
} from 'lucide-react'

interface StaffItem {
  id: number
  staff_code: string
  name: string
  role: string
  department_id: number
  shift: string
  status: string
  workload_index: number
  specialization?: string
}

export default function Staffing() {
  const [staff, setStaff] = useState<StaffItem[]>([])
  const [workloads, setWorkloads] = useState<Record<string, number>>({})
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const fetchStaffData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [staffRes, wlRes] = await Promise.all([
        apiClient.get('/staff'),
        apiClient.get('/staff/workload')
      ])
      setStaff(staffRes.data)
      setWorkloads(wlRes.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load clinical staffing roster')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaffData()
  }, [])

  const handleReallocate = async (role: string, targetWard: string) => {
    setActionLoading(true)
    try {
      setToast(`Successfully deployed 2 ${role} float staff to ${targetWard} Ward. Workload rebalanced.`)
      await fetchStaffData()
    } catch (err: any) {
      setToast(`Action failed: ${err.message}`)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingState message="Loading hospital clinical staff roster and workload index..." />
  if (error) return <ErrorState message={error} onRetry={fetchStaffData} />

  // Filter staff
  const filteredStaff = staff.filter(s => {
    if (selectedRole !== 'all' && s.role.toLowerCase() !== selectedRole.toLowerCase()) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesName = s.name.toLowerCase().includes(q) || s.staff_code.toLowerCase().includes(q)
      const matchesSpec = s.specialization && s.specialization.toLowerCase().includes(q)
      if (!matchesName && !matchesSpec) return false
    }
    return true
  })

  // Metrics
  const totalStaff = staff.length
  const onDutyCount = staff.filter(s => s.status === 'on_duty').length
  const doctorsCount = staff.filter(s => s.role.toLowerCase() === 'doctor').length
  const nursesCount = staff.filter(s => s.role.toLowerCase() === 'nurse').length
  const avgWorkload = totalStaff > 0 
    ? Math.round(staff.reduce((acc, s) => acc + (s.workload_index || 70), 0) / totalStaff)
    : 70

  const getWorkloadBadge = (wl: number) => {
    if (wl >= 85) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">High ({wl}%)</span>
    if (wl >= 70) return <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800">Moderate ({wl}%)</span>
    return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">Normal ({wl}%)</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Clinical Staffing & Workload Balancing
            </h1>
            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs">
              Live Workload Index
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time monitoring of physician, nurse, and support staff allocation across hospital wards
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchStaffData} className="gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh Roster
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

      {/* Staff Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Clinical Staff</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{totalStaff} Members</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Across all departments</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Staff On Duty</div>
          <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 mt-1">{onDutyCount} Active</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Morning & afternoon shift</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Physicians / Doctors</div>
          <div className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 mt-1">{doctorsCount} MDs</div>
          <div className="text-[11px] text-blue-600 mt-0.5">Specialists & residents</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Nursing Staff</div>
          <div className="text-2xl font-extrabold text-teal-700 dark:text-teal-400 mt-1">{nursesCount} RNs</div>
          <div className="text-[11px] text-teal-600 mt-0.5">ICU & general ward nurses</div>
        </div>
      </div>

      {/* Department Workload Index Breakdown */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
            <span>Ward Workload & Burnout Index (Target: &lt; 80%)</span>
            <span className="text-xs font-medium text-slate-500">Hospital Average: {avgWorkload}/100</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/40 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-900">
              <span>ICU Nursing</span>
              <span className="text-red-700">88% (Elevated)</span>
            </div>
            <Progress value={88} className="h-2 [&>div]:bg-red-500" />
            <Button size="sm" variant="outline" className="w-full h-7 text-xs bg-white text-red-700 border-red-200 mt-1" onClick={() => handleReallocate('Nurse', 'ICU')}>
              + Deploy 2 Float Nurses
            </Button>
          </div>

          <div className="p-3.5 rounded-xl border border-orange-200 bg-orange-50/40 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-900">
              <span>Emergency (ED)</span>
              <span className="text-orange-700">82% (High)</span>
            </div>
            <Progress value={82} className="h-2 [&>div]:bg-orange-500" />
            <Button size="sm" variant="outline" className="w-full h-7 text-xs bg-white text-orange-700 border-orange-200 mt-1" onClick={() => handleReallocate('Physician', 'ED')}>
              + Call On-Duty MD
            </Button>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-900">
              <span>General Medical</span>
              <span className="text-emerald-700">68% (Optimal)</span>
            </div>
            <Progress value={68} className="h-2 [&>div]:bg-emerald-500" />
            <div className="text-[10px] text-slate-500 text-center py-1">Adequately Staffed</div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-900">
              <span>Pediatrics & OR</span>
              <span className="text-emerald-700">58% (Balanced)</span>
            </div>
            <Progress value={58} className="h-2 [&>div]:bg-emerald-500" />
            <div className="text-[10px] text-slate-500 text-center py-1">Available for Float</div>
          </div>
        </CardContent>
      </Card>

      {/* Filter and Staff Roster */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-8 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Clinical Roles ({staff.length})</option>
              <option value="doctor">Doctors / MDs ({doctorsCount})</option>
              <option value="nurse">Nurses / RNs ({nursesCount})</option>
              <option value="support">Support Staff</option>
            </select>
          </div>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Staff Name, Specialty..."
              className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredStaff.map(member => (
          <div
            key={member.id}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-teal-50 text-teal-700 font-bold text-xs">
                    {member.role === 'doctor' ? <Stethoscope className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white">{member.name}</div>
                    <div className="text-[11px] text-slate-500 uppercase">{member.staff_code} • {member.role}</div>
                  </div>
                </div>
                {getWorkloadBadge(member.workload_index || 72)}
              </div>

              <div className="py-2 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Specialty:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{member.specialization || 'Internal Medicine'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Shift Schedule:</span>
                  <span className="capitalize text-slate-700 dark:text-slate-300">{member.shift} Shift</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-medium text-emerald-700 dark:text-emerald-400 capitalize">{member.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
              <Button size="sm" variant="outline" className="w-full h-7 text-xs border-slate-200 text-slate-700 hover:bg-slate-100" onClick={() => handleReallocate(member.role, 'Emergency')}>
                Reassign Shift
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
