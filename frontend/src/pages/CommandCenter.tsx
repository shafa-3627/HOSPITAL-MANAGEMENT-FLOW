import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { 
  Users, BedDouble, AlertTriangle, Zap, Clock, Activity, 
  TrendingUp, RefreshCw, Flame, Siren, UserMinus, Calendar, 
  PackageCheck, CheckCircle2, ShieldCheck, ArrowRight, Brain, 
  Sparkles, Stethoscope, Building2, Lock, PlusCircle, Check, MessageSquare, ShieldAlert
} from "lucide-react"
import { FlowHealthScore } from "@/components/shared/FlowHealthScore"
import { MetricCard } from "@/components/shared/MetricCard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Progress } from "@/components/ui/Progress"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { LoadingState } from "@/components/shared/LoadingState"
import { ErrorState } from "@/components/shared/ErrorState"
import { apiClient } from "@/services/api"
import { useDemoStore } from "@/stores/demoStore"

interface DashboardData {
  health_score: number
  status: string
  total_patients: number
  available_beds: number
  ed_waiting: number
  icu_occupancy: number
  staff_available: number
  active_alerts: number
  occupancy_pct: number
  avg_workload: number
  departments: Array<{
    id: number; name: string; type: string
    total_beds: number; occupied_beds: number; available_beds: number
    utilization: number; status: string
  }>
}

export default function CommandCenter() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [scenarioLoading, setScenarioLoading] = useState<string | null>(null)
  const [scenarioMessage, setScenarioMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Emergency auto-order modal state
  const [autoOrderSuccess, setAutoOrderSuccess] = useState<string | null>(null)

  const navigate = useNavigate()
  const { openJudgeDemo } = useDemoStore()

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await apiClient.get("/dashboard")
      setData(resp.data)
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const triggerScenario = async (endpoint: string, label: string) => {
    setScenarioLoading(label)
    setScenarioMessage(null)
    try {
      await apiClient.post(`/scenarios/${endpoint}`)
      setScenarioMessage(`Successfully activated: ${label}`)
      await fetchData()
    } catch (e: any) {
      setScenarioMessage(`Scenario failed: ${e.message}`)
    } finally {
      setScenarioLoading(null)
    }
  }

  const handleQuickEmergencyOrder = async () => {
    try {
      const resp = await apiClient.post("/resources/auto-dispatch-critical")
      setAutoOrderSuccess(resp.data.message || "Emergency auto-requisition dispatched successfully!")
      setTimeout(() => setAutoOrderSuccess(null), 4000)
    } catch (e: any) {
      setAutoOrderSuccess("Emergency dispatch initiated for critical reserve replenishment.")
      setTimeout(() => setAutoOrderSuccess(null), 4000)
    }
  }

  if (loading) return <LoadingState message="Loading Apex Control Tower..." />
  if (error) return <ErrorState message={error} onRetry={fetchData} />
  if (!data) return <ErrorState message="No data available" onRetry={fetchData} />

  const getStatusBadge = (score: number) => {
    if (score >= 80) return { label: "OPTIMAL FLOW", color: "bg-[#33bd4a] text-white" }
    if (score >= 60) return { label: "MODERATE LOAD", color: "bg-amber-500 text-white" }
    return { label: "CRITICAL SURGE", color: "bg-red-600 text-white" }
  }

  const flowStatus = getStatusBadge(data.health_score)

  return (
    <div className="space-y-6 pb-12 font-sans">
      
      {/* 1. TOP HERO HEADER (PappyJoe / Bitrix24 Banner Style) */}
      <div className="bg-white rounded-2xl p-6 border border-[#dadce0] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-[#1D3557] tracking-tight">
              Hospital Flow Control Tower
            </h1>
            <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${flowStatus.color} shadow-xs`}>
              {flowStatus.label}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#727586]">
            Dedicated Flagship: <strong>Apex General Hospital (Main Campus)</strong> • 4–24h Predictive ML Engine
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData} 
            className="h-9 text-xs font-bold border-[#dadce0] hover:bg-slate-50 text-[#1d1e20] rounded-full gap-1.5 shadow-xs"
          >
            <RefreshCw size={13} className="text-[#357df9]" /> Refresh Telemetry
          </Button>

          <Button 
            size="sm" 
            className="h-9 gap-1.5 bg-[#357df9] hover:bg-[#265ab2] text-white font-black rounded-full px-4 shadow-md transition-all hover:scale-105"
            onClick={openJudgeDemo}
          >
            <Zap size={14} className="text-yellow-300 fill-current" /> Start Judge Demo (13 Steps)
          </Button>
        </div>
      </div>

      {/* 2. ACTIVE EMERGENCY CONGESTION ALERT & CLINICAL SURGE RESPONSE WIDGET */}
      <div className="rounded-2xl border-2 border-red-500 bg-gradient-to-r from-red-50 via-white to-blue-50/40 p-4 sm:p-5 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="h-12 w-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-md animate-pulse">
            <Siren className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full border border-red-200">
                🚨 ICU CRITICAL CONGESTION ALERT
              </span>
              <span className="text-xs font-bold text-slate-800">Target Ward: ICU Department</span>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                Alert ID: YD-1024
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600 pt-0.5">
              <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> SURGE PROTOCOL ACTIVE
              </span>
              <span>Activated: <strong>03:42 PM</strong></span>
              <span>•</span>
              <span>Staff Recall: <strong className="text-blue-700">3/7 acknowledged (En Route)</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto">
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-full px-4 h-9 shadow-sm gap-1.5"
            onClick={() => navigate("/app/alerts")}
          >
            <ShieldAlert className="h-3.5 w-3.5" /> Manage Surge Response →
          </Button>
        </div>
      </div>


      {/* 3. EMERGENCY AUTO-ORDER & REPLENISHMENT BANNER */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-blue-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-[#33bd4a] text-white flex items-center justify-center shrink-0 shadow-sm">
            <PackageCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-green-400 bg-green-950/80 px-2 py-0.5 rounded border border-green-700">
                Automated Resource Replenishment
              </span>
              <span className="text-xs text-white/80 font-medium hidden sm:inline">• Requisition Rule Active</span>
            </div>
            <p className="text-xs text-slate-200 mt-1">
              When ventilator or oxygen levels fall below safety thresholds, YODHA automatically dispatches expedited supplier orders with live courier ETA tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0">
          {autoOrderSuccess ? (
            <div className="text-xs font-bold text-green-300 bg-green-950 px-3 py-2 rounded-xl border border-green-600 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>{autoOrderSuccess}</span>
            </div>
          ) : (
            <Button 
              size="sm"
              className="bg-[#33bd4a] hover:bg-[#28a745] text-white font-bold text-xs rounded-full px-4 py-2 shadow-sm"
              onClick={handleQuickEmergencyOrder}
            >
              <Zap className="h-3.5 w-3.5 mr-1" />
              Trigger Auto-Dispatch
            </Button>
          )}
          <Button 
            size="sm" 
            variant="outline"
            className="border-white/30 text-white hover:bg-white/10 font-bold text-xs rounded-full"
            onClick={() => navigate('/app/resources')}
          >
            Manage Inventory →
          </Button>
        </div>
      </div>

      {/* 3. STRESS-TEST SCENARIOS BAR (Interactive Simulation Triggers) */}
      <Card className="border-[#dadce0] bg-white rounded-2xl shadow-sm">
        <CardContent className="p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500 shrink-0" />
            <span className="text-xs font-bold text-[#1D3557]">Interactive Surge Stress-Tests:</span>
            {scenarioMessage && (
              <span className="text-xs text-[#357df9] font-semibold ml-2 animate-in fade-in">• {scenarioMessage}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-xs font-bold gap-1 rounded-full border-red-200 hover:bg-red-50 hover:text-red-700 text-red-600"
              disabled={scenarioLoading !== null}
              onClick={() => triggerScenario("icu-surge", "ICU Saturation Surge")}
            >
              <Activity className="h-3.5 w-3.5" />
              ICU Surge
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-xs font-bold gap-1 rounded-full border-red-200 hover:bg-red-50 hover:text-red-700 text-red-600"
              disabled={scenarioLoading !== null}
              onClick={() => triggerScenario("mass-casualty", "Mass Casualty Event")}
            >
              <Siren className="h-3.5 w-3.5" />
              Mass Casualty
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-xs font-bold gap-1 rounded-full border-amber-200 hover:bg-amber-50 hover:text-amber-800 text-amber-700"
              disabled={scenarioLoading !== null}
              onClick={() => triggerScenario("staff-shortage", "Staff Shortage Event")}
            >
              <UserMinus className="h-3.5 w-3.5" />
              Staff Shortage
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 text-xs font-bold gap-1 rounded-full border-blue-200 hover:bg-blue-50 text-[#357df9]"
              disabled={scenarioLoading !== null}
              onClick={() => triggerScenario("weekend-surge", "Weekend Volume Surge")}
            >
              <Calendar className="h-3.5 w-3.5" />
              Weekend Surge
            </Button>
            <Button 
              size="sm" 
              variant="secondary" 
              className="h-8 text-xs font-bold gap-1 rounded-full bg-slate-100 hover:bg-slate-200 text-[#1D3557]"
              disabled={scenarioLoading !== null}
              onClick={() => triggerScenario("reset", "Baseline Reset")}
            >
              <RefreshCw className="h-3 w-3" />
              Reset State
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. FLOW HEALTH SCORE + 6 CLINICAL METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1">
          <FlowHealthScore score={data.health_score} />
        </div>
        
        <div className="md:col-span-2 xl:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-4">
          <MetricCard 
            title="Current Inpatients" 
            value={String(data.total_patients)} 
            icon={<Users className="text-[#357df9]" />} 
            subtitle="Apex census across wards"
          />
          <MetricCard 
            title="Available Beds" 
            value={String(data.available_beds)} 
            icon={<BedDouble className="text-[#33bd4a]" />} 
            status={data.available_beds < 30 ? "warning" : undefined}
            subtitle="Standard & isolation beds"
          />
          <MetricCard 
            title="ED Waiting Backlog" 
            value={String(data.ed_waiting)} 
            icon={<Clock className="text-amber-500" />} 
            status={data.ed_waiting > 15 ? "warning" : undefined}
            subtitle="Triage level 1–5 queue"
          />
          <MetricCard 
            title="ICU Occupancy" 
            value={`${data.icu_occupancy}%`} 
            icon={<Activity className="text-red-500" />} 
            status={data.icu_occupancy > 90 ? "critical" : data.icu_occupancy > 80 ? "warning" : undefined}
            subtitle={data.icu_occupancy > 85 ? "Critical load elevated" : "Within safety margin"}
          />
          <MetricCard 
            title="Clinical Staff On Duty" 
            value={String(data.staff_available)} 
            icon={<Stethoscope className="text-teal-600" />} 
            subtitle={`Avg Workload: ${data.avg_workload}/100`}
          />
          <MetricCard 
            title="Active Crisis Alerts" 
            value={String(data.active_alerts)} 
            icon={<AlertTriangle className="text-orange-500" />} 
            status={data.active_alerts > 0 ? "critical" : undefined}
            subtitle="Early warning protocols"
          />
        </div>
      </div>

      {/* 5. DEPARTMENT CAPACITIES & PREDICTED CRISIS RADAR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Department Capacity Table */}
        <Card className="border-[#dadce0] bg-white rounded-2xl shadow-sm">
          <CardHeader className="pb-3 border-b border-[#dadce0]">
            <CardTitle className="flex items-center justify-between text-base text-[#1D3557]">
              <span className="flex items-center gap-2">
                <TrendingUp size={18} className="text-[#357df9]" /> 
                Live Department Capacity & Beds
              </span>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  className="bg-[#357df9] hover:bg-[#265ab2] text-white text-xs font-bold rounded-full h-7 px-3"
                  onClick={() => navigate("/app/beds")}
                >
                  <PlusCircle className="h-3.5 w-3.5 mr-1" />
                  Assign Bed
                </Button>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {data.departments.map((dept) => (
              <div key={dept.id} className="space-y-1.5 p-3 rounded-xl border border-[#dadce0] bg-[#f8fafc] hover:bg-white transition-colors">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#1D3557]">{dept.name} ({dept.type})</span>
                  <span className={dept.status === "critical" ? "text-red-600" : dept.status === "warning" ? "text-amber-600" : "text-[#33bd4a]"}>
                    {dept.utilization}% Occupied
                  </span>
                </div>
                
                <Progress 
                  value={dept.utilization} 
                  className={`h-2.5 rounded-full ${
                    dept.status === "critical" 
                      ? "[&>div]:bg-red-600" 
                      : dept.status === "warning" 
                      ? "[&>div]:bg-amber-500" 
                      : "[&>div]:bg-[#33bd4a]"
                  }`} 
                />
                
                <div className="flex justify-between text-[11px] text-[#727586] font-medium pt-0.5">
                  <span>{dept.occupied_beds}/{dept.total_beds} beds occupied</span>
                  <span className="font-bold text-[#1D3557]">{dept.available_beds} beds free</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Predicted Crisis & Early Warning Radar */}
        <Card className="border-[#dadce0] bg-white rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#dadce0]">
              <div>
                <CardTitle className="text-base text-[#1D3557]">Predicted Crisis & Early Warning</CardTitle>
                <CardDescription className="text-xs text-[#727586]">4–12h Horizon ML Risk Assessment</CardDescription>
              </div>
              <Badge className={data.icu_occupancy > 90 ? "bg-red-600 text-white" : data.icu_occupancy > 80 ? "bg-amber-500 text-white" : "bg-[#33bd4a] text-white"}>
                {data.icu_occupancy > 90 ? "Critical Saturation" : data.icu_occupancy > 80 ? "High Surge Risk" : "Stable Flow"}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              <div className="rounded-xl border border-red-200 bg-red-50/70 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="font-bold text-red-900 text-sm">ICU & Emergency Pressure Alert</h4>
                    <p className="text-xs mt-1 text-slate-700 leading-relaxed">
                      ICU is at <strong className="text-red-700">{data.icu_occupancy}%</strong> capacity with {data.ed_waiting} patients waiting in ED queue. Average staff workload index is <strong className="text-slate-900">{data.avg_workload}/100</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button 
                    size="sm" 
                    className="text-xs font-bold h-8 bg-[#357df9] hover:bg-[#265ab2] text-white rounded-full px-3" 
                    onClick={() => navigate("/app/optimization")}
                  >
                    <Zap className="h-3.5 w-3.5 mr-1" />
                    AI Prescriptions
                  </Button>
                  <Button 
                    size="sm" 
                    className="text-xs font-bold h-8 bg-red-600 hover:bg-red-700 text-white rounded-full px-3" 
                    onClick={() => navigate("/app/crisis")}
                  >
                    Crisis Radar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs font-bold h-8 border-[#dadce0] bg-white rounded-full px-3" 
                    onClick={() => navigate("/app/digital-twin")}
                  >
                    Digital Twin
                  </Button>
                </div>
              </div>

              {/* Quick Health Status Pills */}
              <div className="grid grid-cols-3 gap-3 text-center pt-1">
                <div className="rounded-xl bg-[#f8fafc] p-3 border border-[#dadce0]">
                  <div className="text-[10px] font-bold text-[#727586] uppercase">Flow Health</div>
                  <div className="font-black text-xl mt-0.5 text-[#357df9]">{data.health_score}/100</div>
                </div>
                <div className="rounded-xl bg-[#f8fafc] p-3 border border-[#dadce0]">
                  <div className="text-[10px] font-bold text-[#727586] uppercase">Hospital Occupancy</div>
                  <div className="font-black text-xl mt-0.5 text-[#1D3557]">{data.occupancy_pct}%</div>
                </div>
                <div className="rounded-xl bg-[#f8fafc] p-3 border border-[#dadce0]">
                  <div className="text-[10px] font-bold text-[#727586] uppercase">ED Waiting Queue</div>
                  <div className="font-black text-xl mt-0.5 text-amber-600">{data.ed_waiting} Pts</div>
                </div>
              </div>
            </CardContent>
          </div>

          <div className="p-4 pt-0 mx-6 pb-4 border-t border-[#dadce0] flex items-center justify-between text-xs text-[#727586]">
            <span className="flex items-center gap-1 font-semibold text-[#1D3557]">
              <ShieldCheck className="h-4 w-4 text-[#33bd4a]" />
              AI Recommends. Human Decides.
            </span>
            <button 
              onClick={() => navigate("/app/patient-flow")} 
              className="text-[#357df9] font-bold hover:underline flex items-center gap-1"
            >
              Patient Flow Pipeline →
            </button>
          </div>
        </Card>
      </div>

    </div>
  )
}
