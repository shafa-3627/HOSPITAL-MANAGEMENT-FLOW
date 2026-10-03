import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Activity, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react"

interface FlowHealthScoreProps {
  score: number
  status?: string
}

export function FlowHealthScore({ score, status }: FlowHealthScoreProps) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score || 0)))

  // Color mapping based on score thresholds
  const isOptimal = safeScore >= 80
  const isWarning = safeScore >= 60 && safeScore < 80
  const isCritical = safeScore < 60

  const strokeColor = isOptimal ? "#16a34a" : isWarning ? "#d97706" : "#dc2626"
  const textColor = isOptimal ? "text-emerald-600" : isWarning ? "text-amber-600" : "text-red-600"
  const badgeConfig = isOptimal 
    ? { label: "OPTIMAL FLOW", bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 }
    : isWarning 
    ? { label: "MODERATE LOAD", bg: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertCircle }
    : { label: "CRITICAL SURGE", bg: "bg-red-50 text-red-700 border-red-200", icon: ShieldAlert }

  const Icon = badgeConfig.icon

  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (safeScore / 100) * circumference

  return (
    <Card className="flex flex-col items-center justify-between p-5 bg-white dark:bg-slate-900 border border-[#dadce0] dark:border-slate-800 rounded-2xl shadow-sm h-full">
      <CardHeader className="p-0 pb-3 w-full flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#357df9]" />
          <CardTitle className="text-sm font-bold text-[#1D3557] dark:text-slate-100 tracking-tight">
            Hospital Flow Health
          </CardTitle>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOptimal ? 'bg-emerald-400' : isWarning ? 'bg-amber-400' : 'bg-red-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isOptimal ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-red-500'}`}></span>
          </span>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Live ML</span>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center p-0 pt-4 w-full">
        {/* Animated Radial Gauge */}
        <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90 drop-shadow-xs" viewBox="0 0 100 100">
            {/* Background Track Circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="#e2e8f0"
              strokeWidth="9"
              fill="transparent"
              className="dark:stroke-slate-800"
            />
            {/* Dynamic Value Circle */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke={strokeColor}
              strokeWidth="9"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease"
              }}
            />
          </svg>

          {/* Center Score Metric */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="flex items-baseline gap-0.5">
              <span className={`text-4xl sm:text-5xl font-black tracking-tight ${textColor}`}>
                {safeScore}
              </span>
              <span className="text-xs font-bold text-slate-400">/100</span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              Flow Index
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="mt-3">
          <Badge variant="outline" className={`px-2.5 py-0.5 text-[11px] font-extrabold flex items-center gap-1 shadow-2xs ${badgeConfig.bg}`}>
            <Icon className="h-3 w-3" />
            {badgeConfig.label}
          </Badge>
        </div>

        {/* Dynamic Contextual Guidance */}
        <p className="text-xs mt-2.5 text-center text-slate-500 dark:text-slate-400 font-medium px-2 leading-relaxed">
          {isOptimal && "Optimal flow balance. Bed and ICU capacity within safety margins."}
          {isWarning && "Moderate congestion detected. Early intervention advised to avoid ED boarding."}
          {isCritical && "Critical bottlenecks detected. ICU saturation or ED backlog requires protocol response."}
        </p>

        {/* Mini Driver Breakdown Pills */}
        <div className="grid grid-cols-3 gap-1.5 w-full mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px]">
          <div className="text-center p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="text-slate-400 font-semibold uppercase text-[9px]">Bed Load</div>
            <div className="font-bold text-[#1D3557] dark:text-slate-200 mt-0.5">
              {isOptimal ? "Normal" : isWarning ? "Elevated" : "High"}
            </div>
          </div>
          <div className="text-center p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="text-slate-400 font-semibold uppercase text-[9px]">ICU Buffer</div>
            <div className="font-bold text-[#1D3557] dark:text-slate-200 mt-0.5">
              {isCritical ? "Saturated" : isWarning ? "Guarded" : "Stable"}
            </div>
          </div>
          <div className="text-center p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="text-slate-400 font-semibold uppercase text-[9px]">AI Health</div>
            <div className={`font-bold mt-0.5 ${textColor}`}>
              {safeScore >= 80 ? "Healthy" : safeScore >= 60 ? "Warning" : "Surge"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
