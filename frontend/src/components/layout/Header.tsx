import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, Moon, Sun, User as UserIcon, LogOut, Settings, Zap, Building2, Activity, PackageCheck, Sparkles, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Avatar, AvatarFallback } from "@/components/ui/Avatar"
import { Badge } from "@/components/ui/Badge"
import { useAuthStore } from "@/stores/authStore"
import { useThemeStore } from "@/stores/themeStore"
import { useDemoStore } from "@/stores/demoStore"

export function Header() {
  const [time, setTime] = useState(new Date())
  const [showDropdown, setShowDropdown] = useState(false)
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const { openJudgeDemo } = useDemoStore()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const initials = user?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "AP"

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#dadce0] bg-[#ffffff] px-4 lg:px-6 shadow-sm z-10">
      {/* Left: Dedicated Apex General Hospital Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 p-1.5 px-3 rounded-xl bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 shadow-sm">
          <Building2 className="h-4 w-4 text-[#357df9]" />
          <span className="text-xs font-black text-[#1D3557]">Apex General Hospital</span>
          <span className="hidden sm:inline-block text-[10px] text-[#33bd4a] font-bold border-l border-gray-300 pl-2">
            Main Campus Hub
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-1.5 text-xs text-[#727586] font-medium">
          <div className="h-2 w-2 rounded-full bg-[#33bd4a] animate-pulse"></div>
          <span className="text-[11px]">Real-time EHR & Smart Bed Sync</span>
        </div>
      </div>
      
      {/* Right: Controls & Clinical Role Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Link to Emergency Auto-Order Hub */}
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => navigate('/app/resources')}
          className="hidden sm:flex h-9 text-xs gap-1.5 border-green-300 bg-green-50/80 text-green-800 hover:bg-green-100 font-bold rounded-full shadow-xs"
        >
          <PackageCheck className="h-4 w-4 text-[#33bd4a]" />
          <span>Auto-Orders</span>
          <span className="h-2 w-2 rounded-full bg-[#33bd4a]"></span>
        </Button>

        {/* Judge Demo Walkthrough Trigger (Azure Blue Pill) */}
        <Button 
          size="sm" 
          onClick={openJudgeDemo}
          className="h-9 text-xs gap-1.5 bg-[#357df9] hover:bg-[#265ab2] text-white font-black rounded-full px-4 shadow-md transition-all hover:scale-105"
        >
          <Zap className="h-4 w-4 text-yellow-300 fill-current" />
          <span className="hidden sm:inline">Judge Demo Tour (13 Steps)</span>
          <span className="sm:hidden">Demo</span>
        </Button>

        {/* Live Date / Time Clock */}
        <div className="hidden lg:block text-xs font-semibold tabular-nums text-[#36344d] bg-[#f2f3f6] px-2.5 py-1.5 rounded-lg border border-[#dadce0]">
          {time.toLocaleDateString("en-US", { month: "short", day: "numeric" })} • {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </div>
        
        {/* Notifications */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-9 w-9 rounded-full text-[#36344d] hover:bg-slate-100" 
          onClick={() => navigate("/app/audit")}
          title="Clinical Audit & Alerts"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </Button>
        
        {/* Theme Toggle */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-full text-[#36344d] hover:bg-slate-100" 
          onClick={toggleTheme}
          title="Toggle Theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        
        {/* Clinical User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded-full hover:bg-slate-100 p-1 transition-all border border-[#dadce0] bg-white shadow-xs"
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-[#357df9] text-white font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col text-left pr-2">
              <span className="text-xs font-bold text-[#1D3557] leading-tight">
                {user?.full_name || "Apex Clinician"}
              </span>
              <span className="text-[10px] text-[#357df9] font-semibold leading-none capitalize">
                {user?.role?.replace('_', ' ') || "Administrator"}
              </span>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-[#dadce0] bg-white p-2 shadow-xl z-50 animate-in fade-in space-y-1">
              <div className="p-3 border-b border-[#dadce0] bg-[#f8fafc] rounded-xl mb-1">
                <p className="text-xs font-bold text-[#1D3557]">{user?.full_name || "Clinical Director"}</p>
                <p className="text-[11px] text-[#357df9] font-medium capitalize">{user?.role?.replace('_', ' ') || "Administrator"}</p>
                <p className="text-[10px] text-[#727586] mt-0.5">Apex General Hospital</p>
              </div>

              <button
                onClick={() => { setShowDropdown(false); navigate("/app/settings") }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1d1e20] hover:bg-blue-50 hover:text-[#357df9] rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Hospital Settings</span>
              </button>

              <button
                onClick={() => { setShowDropdown(false); navigate("/app/safety") }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1d1e20] hover:bg-blue-50 hover:text-[#357df9] rounded-lg transition-colors"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>AI Safety & Governance</span>
              </button>

              <button
                onClick={() => { setShowDropdown(false); navigate("/") }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#1d1e20] hover:bg-blue-50 hover:text-[#357df9] rounded-lg transition-colors"
              >
                <Sparkles className="h-4 w-4" />
                <span>Landing Page</span>
              </button>

              <div className="border-t border-[#dadce0] my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
