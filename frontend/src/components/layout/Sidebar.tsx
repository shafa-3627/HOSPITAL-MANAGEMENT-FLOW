import { Link, useLocation } from "react-router-dom"
import { Logo, LogoIcon } from "@/components/shared/Logo"
import { cn } from "@/utils/cn"
import {
  LayoutDashboard,
  Bot,
  GitBranch,
  Siren,
  BedDouble,
  TrendingUp,
  Zap,
  AlertTriangle,
  Layers,
  Brain,
  Filter,
  Users,
  Package,
  SearchX,
  Radio,
  Plug,
  FlaskConical,
  BarChart3,
  Target,
  FileText,
  Shield,
  ShieldCheck,
  ClipboardList,
  Network,
  Settings,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  PackageCheck,
  Building2,
  Sparkles,
  UserPlus
} from "lucide-react"

const NAV_ITEMS = [
  { group: "Operations", items: [
    { name: "Command Center", path: "/app/command-center", icon: LayoutDashboard },
    { name: "Admission Entry", path: "/app/admissions", icon: UserPlus },
    { name: "Congestion Alerts & Protocols", path: "/app/alerts", icon: ShieldAlert },
    { name: "Patient Flow (9 Stages)", path: "/app/patient-flow", icon: GitBranch },
    { name: "Emergency Triage", path: "/app/emergency", icon: Siren },
    { name: "Bed Management", path: "/app/beds", icon: BedDouble },
    { name: "Crisis Warning Radar", path: "/app/crisis", icon: AlertTriangle },
  ]},

  { group: "AI & Optimization", items: [
    { name: "Agentic AI Control", path: "/app/agentic-ai", icon: Sparkles },
    { name: "AI Copilot (Queries)", path: "/app/copilot", icon: Bot },
    { name: "AI Forecast (4-24h)", path: "/app/forecast", icon: TrendingUp },
    { name: "AI Optimization", path: "/app/optimization", icon: Zap },
    { name: "Explainable AI (SHAP)", path: "/app/explainability", icon: Brain },
    { name: "Bottleneck Radar", path: "/app/bottlenecks", icon: Filter },
  ]},
  { group: "Resources & Logistics", items: [
    { name: "Staffing & Float Pool", path: "/app/staffing", icon: Users },
    { name: "Emergency Auto-Orders", path: "/app/resources", icon: PackageCheck },
  ]},
  { group: "Digital Twin & Lab", items: [
    { name: "Digital Twin (M/M/c)", path: "/app/digital-twin", icon: Layers },
    { name: "EMS Feed Simulation", path: "/app/ems", icon: Siren },
    { name: "AI Model Lab", path: "/app/model-lab", icon: FlaskConical },
    { name: "Hospital Network", path: "/app/network", icon: Network },
  ]},
  { group: "Monitoring & Analytics", items: [
    { name: "Anomaly Detection", path: "/app/anomalies", icon: SearchX },
    { name: "Live Event Stream", path: "/app/events", icon: Radio },
    { name: "Operational Analytics", path: "/app/analytics", icon: BarChart3 },
    { name: "Impact Estimator", path: "/app/impact", icon: Target },
    { name: "Clinical Reports", path: "/app/reports", icon: FileText },
  ]},
  { group: "Governance & Hub", items: [
    { name: "FHIR R4 Integration", path: "/app/integrations", icon: Plug },
    { name: "Security (RBAC)", path: "/app/security", icon: Shield },
    { name: "AI Safety Guardrails", path: "/app/safety", icon: ShieldCheck },
    { name: "Audit Trail (100%)", path: "/app/audit", icon: ClipboardList },
    { name: "Settings", path: "/app/settings", icon: Settings },
  ]}
]

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (val: boolean) => void
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation()

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-[#dadce0] bg-[#ffffff] transition-all duration-300 relative z-20 shadow-sm",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Sidebar Header with Vector Medical & AI Logo */}
      <div className="flex h-16 items-center justify-between border-b border-[#dadce0] px-3.5 bg-[#f8fafc]">
        {!collapsed ? (
          <Link to="/app/command-center" className="flex items-center gap-2.5 truncate hover:opacity-90 transition-opacity">
            <Logo size="sm" subtitle="Apex General Hospital" />
          </Link>
        ) : (
          <Link to="/app/command-center" className="mx-auto hover:opacity-90 transition-opacity">
            <LogoIcon size={32} />
          </Link>
        )}
      </div>

      {/* Collapse/Expand Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label="Toggle Sidebar"
        className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-[#dadce0] bg-white text-[#1D3557] shadow-md hover:bg-slate-50 transition-colors z-30"
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-thin">
        {NAV_ITEMS.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!collapsed && (
              <div className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-[#727586]/90">
                {group.group}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all group",
                      isActive
                        ? "bg-[#357df9] text-white shadow-sm font-bold"
                        : "text-[#36344d] hover:bg-[#f2f3f6] hover:text-[#1D3557]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0 transition-colors",
                        isActive ? "text-white" : "text-[#727586] group-hover:text-[#357df9]"
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.name}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer Indicator */}
      {!collapsed && (
        <div className="p-3 border-t border-[#dadce0] bg-[#f8fafc]">
          <div className="flex items-center justify-between text-[11px] text-[#727586]">
            <span className="flex items-center gap-1.5 font-semibold text-[#1D3557]">
              <div className="h-2 w-2 rounded-full bg-[#33bd4a] animate-pulse" />
              Apex IoT Core
            </span>
            <span className="text-[10px] bg-blue-50 text-[#357df9] font-bold px-1.5 py-0.5 rounded border border-blue-200">
              v2.0 LIVE
            </span>
          </div>
        </div>
      )}
    </aside>
  )
}
