import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/shared/Logo'
import { useAuthStore } from '@/stores/authStore'
import { Shield, Activity, Stethoscope, BedDouble, Lock, ArrowRight, Building2, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react'

const DEMO_ACCOUNTS = [
  { 
    role: 'Hospital Administrator', 
    username: 'admin', 
    pass: 'admin123', 
    icon: Shield, 
    desc: 'Full operational control, regional network, and governance',
    color: 'border-[#357df9] hover:bg-[#357df9]/5 text-[#357df9]'
  },
  { 
    role: 'Doctor / Attending Physician', 
    username: 'doctor', 
    pass: 'doctor123', 
    icon: Stethoscope, 
    desc: 'Clinical triage, inpatient admission, and discharge approval',
    color: 'border-[#33bd4a] hover:bg-[#33bd4a]/5 text-[#33bd4a]'
  },
  { 
    role: 'Head Nurse / Ward Supervisor', 
    username: 'nurse', 
    pass: 'nurse123', 
    icon: Activity, 
    desc: 'Bed occupancy status, patient flow stages, and shift nursing',
    color: 'border-teal-500 hover:bg-teal-500/5 text-teal-600'
  },
  { 
    role: 'Bed Manager / Capacity Lead', 
    username: 'bedmgr', 
    pass: 'bedmgr123', 
    icon: BedDouble, 
    desc: 'Smart bed allocation, multi-ward balancing, and transfers',
    color: 'border-indigo-500 hover:bg-indigo-500/5 text-indigo-600'
  },
]

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogin = async (e?: React.FormEvent, demoUser?: string, demoPass?: string) => {
    if (e) e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const u = demoUser || username
      const p = demoPass || password
      
      if (!u || !p) {
        throw new Error('Please enter username and password')
      }
      
      await login(u, p)
      
      const from = (location.state as any)?.from?.pathname || '/app/command-center'
      navigate(from, { replace: true })
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f2f3f6] flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-sans">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center">
        <div 
          className="cursor-pointer mb-2"
          onClick={() => navigate('/')}
        >
          <Logo size="lg" subtitle="Predictive Hospital Flow Management System" />
        </div>
        <p className="mt-1 text-xs text-[#727586]">
          Single Facility Hub: <strong>Apex General Hospital</strong> • The Crew
        </p>
      </div>

      {/* Main Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl flex flex-col md:flex-row gap-6 px-4">
        
        {/* Left: Credentials Form */}
        <Card className="flex-1 shadow-md border border-[#dadce0] bg-white rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-black text-[#1D3557]">Clinical Sign In</CardTitle>
              <span className="text-[11px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Live Server
              </span>
            </div>
            <CardDescription className="text-xs text-[#727586]">
              Enter your clinical credentials or select a role on the right for 1-click access.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700 flex items-start gap-2">
                <Lock className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={(e) => handleLogin(e)} className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-xs font-bold text-[#1D3557]">Username / Staff ID</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="e.g. admin, doctor, nurse, bedmgr"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="mt-1 h-10 text-sm border-[#dadce0] focus:ring-2 focus:ring-[#357df9]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-xs font-bold text-[#1D3557]">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 h-10 text-sm border-[#dadce0] focus:ring-2 focus:ring-[#357df9]"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#357df9] hover:bg-[#265ab2] text-white font-bold h-11 rounded-full text-sm shadow-md transition-all mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to Command Center'}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-xs text-[#357df9] hover:underline font-semibold"
                >
                  ← Back to Public Website
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Right: 1-Click Role Direct Logins */}
        <Card className="flex-1 shadow-md border border-[#dadce0] bg-white rounded-2xl flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#357df9]" />
              <CardTitle className="text-lg font-black text-[#1D3557]">1-Click Clinical Roles</CardTitle>
            </div>
            <CardDescription className="text-xs text-[#727586]">
              Instant access pre-configured with 4 essential hospital roles:
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-2.5">
            {DEMO_ACCOUNTS.map((acc) => {
              const Icon = acc.icon
              return (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => handleLogin(undefined, acc.username, acc.pass)}
                  disabled={loading}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${acc.color} bg-white shadow-sm hover:shadow`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-50 border border-[#dadce0]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1D3557] flex items-center gap-1.5">
                        <span>{acc.role}</span>
                        <span className="text-[10px] text-gray-500 font-mono bg-gray-100 px-1.5 py-0.2 rounded font-normal">({acc.username})</span>
                      </div>
                      <div className="text-[11px] text-[#727586] leading-tight line-clamp-1">{acc.desc}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                </button>
              )
            })}
          </CardContent>

          <div className="p-4 pt-0 text-[11px] text-[#727586] flex items-center justify-between border-t border-[#dadce0] mx-6 pt-3">
            <span className="flex items-center gap-1 font-medium"><Lock className="h-3 w-3 text-green-600" /> HIPAA Compliant</span>
            <span className="font-semibold text-[#1D3557]">Apex General Hospital</span>
          </div>
        </Card>

      </div>

    </div>
  )
}
