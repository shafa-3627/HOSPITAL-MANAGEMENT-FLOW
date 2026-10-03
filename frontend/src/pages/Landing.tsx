import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Logo } from "@/components/shared/Logo"
import { 
  Brain, Layers, GitBranch, ShieldCheck, Activity, 
  TrendingUp, Zap, Clock, Users, ArrowRight, CheckCircle2, 
  AlertTriangle, Database, Network, ShieldAlert, Cpu, HeartPulse,
  Phone, MessageSquare, Send, Check, Sparkles, Building2,
  Calendar, BedDouble, Stethoscope, PackageCheck, HelpCircle,
  ChevronDown, Star, Lock, Award, Shield, FileCheck, CheckCircle,
  Smartphone, MessageCircle, PhoneCall, FileText, Video,
  FolderLock, UserCheck, Share2, BarChart3, RefreshCw
} from "lucide-react"

export default function Landing() {
  const navigate = useNavigate()

  // Form state for Lead Capture / Instant Demo
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    hospital: "",
    message: ""
  })
  const [submitted, setSubmitted] = useState(false)

  // Interactive Bitrix24-style Grow-Up Tab Selector
  const [activeTab, setActiveTab] = useState(0)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      navigate('/login')
    }, 1200)
  }

  // Bitrix24 Healthcare CRM Pillars
  const crmPillars = [
    {
      id: 0,
      title: "Patient Relationship Management (CRM)",
      subtitle: "From First Triage Contact to Post-Discharge Follow-Up",
      icon: Users,
      badge: "PATIENT LIFECYCLE",
      points: [
        "Securely store and organize patient medical histories, vitals, and bed records in one centralized CRM timeline.",
        "Automatically gather patient intakes from web forms, ER registration kiosks, or EMS ambulance feeds.",
        "Send automated appointment confirmations, queue updates, and triage status reminders.",
        "Collect patient satisfaction feedback through automated HIPAA-compliant digital surveys."
      ],
      previewStats: {
        metric1: "12,480+",
        label1: "Patient Records Managed",
        metric2: "99.4%",
        label2: "Intake Accuracy",
        metric3: "Zero",
        label3: "Paperwork Loss"
      }
    },
    {
      id: 1,
      title: "Appointment & ED Triage Scheduling",
      subtitle: "Book in Seconds. Reduce Emergency Congestion Immediately",
      icon: Calendar,
      badge: "SMART SCHEDULING",
      points: [
        "Interactive calendar & queue management with Manchester 1–5 triage acuity prioritization.",
        "Track attendance, reduce no-shows automatically, and route surge patients to step-down wards.",
        "Coordinate on-duty specialists, operation theatres, and smart beds in one unified workflow.",
        "Automated alerts to nursing supervisors when wait times exceed safe clinical thresholds."
      ],
      previewStats: {
        metric1: "-38 min",
        label1: "Avg ED Wait Reduction",
        metric2: "4–24h",
        label2: "Surge Forecast Window",
        metric3: "100%",
        label3: "Queue Visibility"
      }
    },
    {
      id: 2,
      title: "Omnichannel Contact Center & Telephony",
      subtitle: "All Patient Communications in One Unified Cockpit",
      icon: PhoneCall,
      badge: "CONTACT CENTER",
      points: [
        "Full-featured cloud telephony with integrated SIP PBX for emergency inbound and dispatch calls.",
        "AI CoPilot audio transcription and automated clinical summarization for consultation logs.",
        "Instant supervisor notifications for critical triage escalations and unassigned inbound calls.",
        "Multi-channel communications across in-app alerts, Email, voice telephony, and live portal chat."
      ],

      previewStats: {
        metric1: "< 15s",
        label1: "Call Response Time",
        metric2: "AI-Powered",
        label2: "Call Transcription",
        metric3: "100%",
        label3: "Audit Trail"
      }
    },
    {
      id: 3,
      title: "Tele-Health & Remote Consultations",
      subtitle: "Simpler Virtual Care and Family Caregiver Updates",
      icon: Video,
      badge: "TELE-HEALTH",
      points: [
        "High-definition video consultations for pre-admission intake and post-discharge recovery monitoring.",
        "Remote patient check-ins when in-person physical examination is not required.",
        "Secure family and caregiver portal with live status updates on hospitalized loved ones.",
        "Clinical guidance and digital prescription delivery directly to patient mobile devices."
      ],
      previewStats: {
        metric1: "HD Video",
        label1: "Encrypted Streams",
        metric2: "256-Bit",
        label2: "SSL Security",
        metric3: "Global",
        label3: "Browser Access"
      }
    },
    {
      id: 4,
      title: "Mobile Workplace & Field Staff",
      subtitle: "Stay Connected to Every Patient and Bed Anywhere",
      icon: Smartphone,
      badge: "MOBILE CLOUD",
      points: [
        "Access real-time bed grids, patient vitals, and surge alerts from any smartphone or tablet.",
        "Fast-track ward rounds with mobile nurse progress charting and 1-click bed release.",
        "Secure team communication in departmental workgroups, push alerts, and direct chats.",
        "Immediate emergency notifications dispatched to on-call doctors during critical hospital surges."
      ],
      previewStats: {
        metric1: "Zero-Install",
        label1: "PWA & Mobile Web",
        metric2: "Real-time",
        label2: "Push Sync",
        metric3: "4 Roles",
        label3: "Custom Dashboards"
      }
    },
    {
      id: 5,
      title: "Online Documents, EMR & e-Sign",
      subtitle: "Paperless Hospital Operations without the Headaches",
      icon: FileText,
      badge: "FHIR R4 EMR",
      points: [
        "Digital patient consent forms, electronic admission agreements, and clinical discharge summaries.",
        "HL7 FHIR R4 schema interoperability with PACS imaging, LIS labs, and EHR connectors.",
        "Fast digital e-signature for physician orders, emergency requisitions, and care plans.",
        "Compliant cloud storage with automatic backup and immutable audit logging."
      ],
      previewStats: {
        metric1: "HL7 FHIR R4",
        label1: "Standard Schemas",
        metric2: "HIPAA",
        label2: "Compliant Storage",
        metric3: "1-Click",
        label3: "PDF Export"
      }
    }
  ]

  // PappyJoe 6-Feature Grid with Emergency Auto-Ordering
  const pappyJoeFeatures = [
    {
      title: "SMART APPOINTMENT & ED TRIAGE",
      desc: "Easy scheduling, rescheduling, all with automated clinical alerts with an easy calendar and Manchester 1-5 acuity queue.",
      icon: Calendar,
      tag: "TRIAGE & SCHEDULING"
    },
    {
      title: "IN-PATIENT & BED MANAGEMENT",
      desc: "Handle admissions, bed allocation, nurse notes, progress charts, automated sanitation flags, and discharge summaries all in one place.",
      icon: BedDouble,
      tag: "BED ALLOCATION"
    },
    {
      title: "EMERGENCY AUTO-ORDER & PHARMACY",
      desc: "Monitor inventory stock in real-time. Automatically dispatch emergency supplier requisitions when ventilators or oxygen run low.",
      icon: PackageCheck,
      tag: "AUTO-REPLENISHMENT"
    },
    {
      title: "LAB & RADIOLOGY (PACS)",
      desc: "Track diagnostic orders, integrate PACS imaging feeds, and eliminate turnaround time bottlenecks before ED admissions stall.",
      icon: Activity,
      tag: "DIAGNOSTICS & PACS"
    },
    {
      title: "EASY MEDICAL RECORDS (EHR/FHIR)",
      desc: "Save and retrieve patient profiles with visit history, clinical vitals, HL7 FHIR R4 schema interoperability, and instant report export.",
      icon: Stethoscope,
      tag: "FHIR R4 EHR"
    },
    {
      title: "DIGITAL TWIN & CRISIS RADAR",
      desc: "Run deterministic M/M/c queueing simulations and 4–24h surge forecasting to test operational capacity before crises hit.",
      icon: Brain,
      tag: "AI PREDICTIVE ENGINE"
    }
  ]

  // Supported Healthcare Facilities
  const healthcareTeams = [
    { name: "Multi-Specialty Hospitals", desc: "Flagship tertiary care & inpatient flow control", icon: Building2 },
    { name: "Emergency & Trauma Centers", desc: "Rapid triage, ambulance intake & surge alerts", icon: HeartPulse },
    { name: "Diagnostic Labs & PACS Imaging", desc: "Turnaround time tracking & DICOM feeds", icon: Activity },
    { name: "ICU & Critical Care Units", desc: "Telemetry monitoring & ventilator auto-orders", icon: Cpu },
    { name: "Specialized Clinics & Practices", desc: "Appointment scheduling & patient CRM", icon: Stethoscope },
    { name: "Telemedicine & Home Care", desc: "Virtual consultations & mobile field staff", icon: Video }
  ]

  // Clinician Testimonials
  const testimonials = [
    {
      name: "Dr. Barath Balaji",
      role: "Chief Medical Officer",
      clinic: "Balagam Dental & Medical Clinic, Chennai",
      quote: "One Hundred LIKES for YODHA. It is one of the best hospital and healthcare CRM softwares available. It's very simple, efficient, and the predictive flow engine keeps our emergency department running smoothly without overcrowding.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80"
    },
    {
      name: "Dr. Vashi Narula",
      role: "Lead Clinician",
      clinic: "VCare Multispeciality Clinic, Delhi",
      quote: "I evaluated most hospital softwares in the market and YODHA has exceeded my expectations. The automated emergency resource replenishment, patient CRM timeline, and 1-click bed matching save our staff hours every shift.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80"
    },
    {
      name: "Dr. George Benedict Rajkumar",
      role: "Director of Operations",
      clinic: "Doss Medical Center, Tirunelveli",
      quote: "It's nice and simple software that we've been using for our practice. The AI Copilot, contact center, and crisis early-warning allow our team to prepare hours before patient surges arrive. Highly recommended.",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80"
    }
  ]

  // FAQs
  const faqs = [
    {
      q: "What is YODHA 2.0 and who is it for?",
      a: "YODHA 2.0 is an enterprise healthcare CRM and predictive hospital flow management platform designed for hospital administrators, doctors, bed managers, and nursing teams. It combines real-time bed tracking, 4–24h AI surge forecasting, crisis warning radar, emergency equipment auto-ordering, and HL7 FHIR R4 interoperability."
    },
    {
      q: "How does YODHA merge Healthcare CRM with Hospital Flow Management?",
      a: "Like Bitrix24 Healthcare CRM, YODHA provides full patient relationship tracking, multi-channel clinical alerts, online appointment scheduling, and digital consent forms. It combines this with PappyJoe's clinical workflows, real-time bed grids, and automated emergency equipment replenishment."
    },

    {
      q: "How does the Emergency Auto-Order system work?",
      a: "When critical equipment (ventilators, oxygen units, telemetry monitors, infusion pumps) drops below the safe hospital threshold or during an active surge crisis, YODHA automatically generates expedited purchase requisitions with tracking IDs and supplier dispatch."
    },
    {
      q: "Can I access YODHA Cloud from multiple devices or locations?",
      a: "Yes! Since it's cloud-based, you can securely access YODHA from any computer, workstation, tablet, or smartphone — anytime, anywhere. It is perfect for doctors managing multiple departments or administrators monitoring live hospital census remotely."
    },
    {
      q: "Is patient data secure on YODHA Cloud?",
      a: "Absolutely. YODHA uses 256-bit SSL encryption, HIPAA-compliant storage protocols, role-based access control (RBAC), and immutable audit logs. All demonstration patient data is fully synthetic and anonymized."
    },
    {
      q: "Can I try the software before deploying to my hospital?",
      a: "Yes! We offer a full live interactive demo environment preloaded with Apex General Hospital's operational data. You can test all features immediately with zero credit card or setup fees."
    }
  ]

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1d1e20] font-sans flex flex-col selection:bg-[#357df9]/20">
      
      {/* 1. TOP ANNOUNCEMENT BAR (PappyJoe & Bitrix24 Synergy) */}
      <div className="bg-[#1D3557] text-white py-2 px-4 text-xs font-medium tracking-wide border-b border-[#265ab2]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-[#357df9] text-white px-2 py-0.5 rounded text-[11px] font-bold uppercase">HACKATHON 2026</span>
            <span>Healthcare CRM & Predictive Hospital Flow Platform • V.S.B. Engineering College, Karur • <strong>Team: The Crew</strong></span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a 
              href="tel:+919496499891" 
              className="flex items-center gap-1 text-[#33bd4a] hover:underline font-semibold"
            >
              <Phone className="h-3.5 w-3.5" /> +91 94964 99891 (Clinical Hotline)
            </a>
          </div>
        </div>
      </div>

      {/* 2. STICKY HEADER NAVIGATION */}
      <header className="sticky top-0 z-50 bg-[#ffffff] border-b border-[#dadce0] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <Logo size="md" subtitle="HEALTHCARE CRM & HOSPITAL FLOW OS" />
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#1d1e20]">
            <a href="#crm-solutions" className="hover:text-[#357df9] transition-colors">Healthcare CRM</a>
            <a href="#features" className="hover:text-[#357df9] transition-colors">Hospital Flow</a>
            <a href="#teams" className="hover:text-[#357df9] transition-colors">Solutions</a>
            <a href="#promise" className="hover:text-[#357df9] transition-colors">Our Promise</a>
            <a href="#testimonials" className="hover:text-[#357df9] transition-colors">Reviews</a>
            <a href="#faq" className="hover:text-[#357df9] transition-colors">FAQ</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-3">
            <Button 
              size="sm" 
              className="hidden sm:inline-flex items-center gap-1.5 bg-[#33bd4a] hover:bg-[#28a745] text-white text-xs font-bold px-4 py-2.5 rounded-full transition-all shadow-sm"
              onClick={() => navigate('/login')}
            >
              <Zap className="h-4 w-4" />
              <span>Live Demo</span>
            </Button>

            <Button 
              variant="outline" 
              size="sm" 
              className="border-[#357df9] text-[#357df9] hover:bg-[#357df9]/10 font-bold rounded-full px-4"
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>


            <Button 
              size="sm" 
              className="bg-[#357df9] hover:bg-[#265ab2] text-white font-bold rounded-full px-5 shadow-md hover:shadow-lg transition-all"
              onClick={() => navigate('/login')}
            >
              FREE DEMO
            </Button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION (PappyJoe Vibrant Gradient + Bitrix24 Value Proposition + Lead Form) */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#357df9] to-[#33bd4a] py-14 lg:py-20 text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase text-white border border-white/30">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span>HIPAA-COMPLIANT • PREDICTIVE • HEALTHCARE CRM</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight uppercase">
                YODHA 2.0 – ALL-IN-ONE HEALTHCARE CRM & HOSPITAL FLOW OS
              </h1>

              <p className="text-base sm:text-lg text-white/90 leading-relaxed font-medium max-w-2xl">
                Manage patient relationships, emergency triage, bed allocations, omnichannel communication, and medical records securely. From 4–24h AI surge forecasting to automated resource replenishment, prescribe efficiency for your hospital.
              </p>

              {/* Trust Checkmarks (Bitrix24 Hero Style) */}
              <div className="space-y-2 text-sm font-semibold text-white/95 pt-1">
                <div className="flex items-center gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-white"><Check className="h-3.5 w-3.5" /></div>
                  <span>Easy appointment scheduling & Manchester 1-5 triage queue</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-white"><Check className="h-3.5 w-3.5" /></div>
                  <span>Automated patient base CRM with digital & telephony follow-ups</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center text-white"><Check className="h-3.5 w-3.5" /></div>
                  <span>Automated emergency equipment auto-ordering during critical surges</span>
                </div>

              </div>

              {/* Statistics highlight bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                  <div className="text-2xl lg:text-3xl font-black">12000+</div>
                  <div className="text-[11px] font-semibold text-white/80 uppercase">Patients Managed</div>
                </div>
                <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                  <div className="text-2xl lg:text-3xl font-black">5000+</div>
                  <div className="text-[11px] font-semibold text-white/80 uppercase">Hospital Beds</div>
                </div>
                <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                  <div className="text-2xl lg:text-3xl font-black">94.8%</div>
                  <div className="text-[11px] font-semibold text-white/80 uppercase">AI Accuracy</div>
                </div>
                <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center">
                  <div className="text-2xl lg:text-3xl font-black">-38 min</div>
                  <div className="text-[11px] font-semibold text-white/80 uppercase">ED Wait Time</div>
                </div>
              </div>

              {/* Dual Action CTAs */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Button 
                  size="lg"
                  className="bg-[#18181a] hover:bg-black text-white font-black text-sm rounded-full px-8 py-6 shadow-xl hover:scale-105 transition-transform"
                  onClick={() => navigate('/login')}
                >
                  <Zap className="h-5 w-5 mr-2 text-yellow-400" />
                  EXPLORE LIVE DEMO
                </Button>

                <Button 
                  size="lg"
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-2 border-white font-bold text-sm rounded-full px-8 py-6 backdrop-blur-sm"
                  onClick={() => navigate('/login')}
                >
                  <Users className="h-5 w-5 mr-2" />
                  ROLE ACCESS (4 ROLES)
                </Button>
              </div>

              <div className="flex items-center gap-3 text-xs text-white/90 font-medium pt-2">
                <ShieldCheck className="h-4 w-4 text-white" />
                <span>Dedicated Single Hospital Model: <strong>Apex General Hospital (Main Campus)</strong></span>
              </div>
            </div>

            {/* Hero Right Contact/Demo Lead Form */}
            <div className="lg:col-span-5" id="signup">
              <div className="bg-[#ffffff] text-[#1d1e20] rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/50">
                <div className="mb-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#357df9] bg-[#357df9]/10 px-2.5 py-1 rounded-full">
                    Instant Demo Booking
                  </span>
                  <h3 className="text-2xl font-black text-[#1D3557] mt-2">Book a Live Demo</h3>
                  <p className="text-xs text-[#727586] mt-1">Experience healthcare CRM, emergency triage, bed allocation & auto-ordering.</p>
                </div>

                {submitted ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="h-14 w-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">Thank You for Your Request!</h4>
                    <p className="text-xs text-gray-600">Redirecting to Apex General Hospital interactive workspace...</p>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1d1e20] mb-1">Full Name *</label>
                      <input 
                        type="text"
                        required
                        placeholder="Dr. Rajesh Kumar"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#dadce0] focus:ring-2 focus:ring-[#357df9] focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-[#1d1e20] mb-1">Mobile No *</label>
                        <input 
                          type="tel"
                          required
                          placeholder="+91 98765 43210"
                          value={formData.mobile}
                          onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#dadce0] focus:ring-2 focus:ring-[#357df9] focus:border-transparent outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#1d1e20] mb-1">Email Address *</label>
                        <input 
                          type="email"
                          required
                          placeholder="doctor@hospital.org"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#dadce0] focus:ring-2 focus:ring-[#357df9] focus:border-transparent outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1d1e20] mb-1">Hospital / Department</label>
                      <input 
                        type="text"
                        placeholder="Apex General Hospital — Emergency / ICU"
                        value={formData.hospital}
                        onChange={(e) => setFormData({...formData, hospital: e.target.value})}
                        className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#dadce0] focus:ring-2 focus:ring-[#357df9] focus:border-transparent outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#1d1e20] mb-1">Message / Requirements</label>
                      <textarea 
                        rows={2}
                        placeholder="Need predictive surge forecasting & automated bed allocation..."
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#dadce0] focus:ring-2 focus:ring-[#357df9] focus:border-transparent outline-none transition-all resize-none"
                      />
                    </div>

                    <Button 
                      type="submit"
                      className="w-full bg-[#357df9] hover:bg-[#265ab2] text-white font-bold py-3.5 rounded-full shadow-lg hover:shadow-xl text-sm transition-all"
                    >
                      GET A FREE DEMO
                    </Button>

                    <div className="flex items-center justify-between text-[11px] text-[#727586] pt-1">
                      <span className="flex items-center gap-1"><Lock className="h-3 w-3 text-green-600" /> 256-Bit SSL Encrypted</span>
                      <span>No Credit Card Required</span>
                    </div>
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. BITRIX24-STYLE INTERACTIVE HEALTHCARE CRM PILLARS (Interactive Tabs) */}
      <section className="py-20 bg-[#f8fafc] border-b border-[#dadce0]" id="crm-solutions">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold text-[#357df9] uppercase tracking-wider bg-[#357df9]/10 px-3 py-1 rounded-full">
              ENTERPRISE HEALTHCARE CRM
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1D3557] tracking-tight uppercase">
              Help Your Medical Practice Grow with YODHA CRM
            </h2>
            <p className="text-sm text-[#727586]">
              A complete suite of patient relationship management, telephony, smart scheduling, and tele-health tools.
            </p>
          </div>

          {/* Interactive Tabs Header (Bitrix24 Style) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
            {crmPillars.map((p, idx) => {
              const Icon = p.icon
              const isActive = activeTab === idx
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isActive 
                      ? "bg-white border-[#357df9] shadow-md ring-2 ring-[#357df9]/20" 
                      : "bg-white/80 border-[#dadce0] hover:bg-white hover:border-gray-400"
                  }`}
                >
                  <div className={`p-2 rounded-lg w-fit mb-2 ${isActive ? "bg-[#357df9] text-white" : "bg-gray-100 text-gray-700"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className={`text-xs font-bold leading-tight ${isActive ? "text-[#357df9]" : "text-[#1d1e20]"}`}>
                    {p.title.split("(")[0]}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Active Tab Showcase Panel */}
          <div className="bg-white rounded-2xl border border-[#dadce0] p-6 sm:p-10 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              <div className="lg:col-span-7 space-y-5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#33bd4a] bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                  {crmPillars[activeTab].badge}
                </span>

                <h3 className="text-2xl sm:text-3xl font-black text-[#1D3557]">
                  {crmPillars[activeTab].title}
                </h3>
                
                <p className="text-sm font-semibold text-[#357df9]">
                  {crmPillars[activeTab].subtitle}
                </p>

                <ul className="space-y-3 text-sm text-[#36344d]">
                  {crmPillars[activeTab].points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-[#33bd4a] shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <Button 
                    className="bg-[#357df9] hover:bg-[#265ab2] text-white font-bold rounded-full px-6 py-2.5 shadow-md"
                    onClick={() => navigate('/login')}
                  >
                    START FOR FREE
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-[#dadce0] hover:bg-gray-50 text-[#1d1e20] font-bold rounded-full px-6 py-2.5"
                    onClick={() => navigate('/login')}
                  >
                    Explore in Apex Hub →
                  </Button>
                </div>
              </div>

              {/* Interactive Visual Card / Metrics */}
              <div className="lg:col-span-5">
                <div className="bg-[#f2f3f6] rounded-xl p-6 border border-[#dadce0] space-y-4 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-[#dadce0]">
                    <span className="text-xs font-bold text-[#1D3557]">Live Clinical Metrics</span>
                    <Badge className="bg-[#33bd4a] text-white text-[10px]">REAL-TIME SYNC</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-3 rounded-lg border border-[#dadce0]">
                      <div className="text-lg font-black text-[#357df9]">{crmPillars[activeTab].previewStats.metric1}</div>
                      <div className="text-[10px] text-gray-500 font-medium">{crmPillars[activeTab].previewStats.label1}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-[#dadce0]">
                      <div className="text-lg font-black text-[#33bd4a]">{crmPillars[activeTab].previewStats.metric2}</div>
                      <div className="text-[10px] text-gray-500 font-medium">{crmPillars[activeTab].previewStats.label2}</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-[#dadce0]">
                      <div className="text-lg font-black text-[#1D3557]">{crmPillars[activeTab].previewStats.metric3}</div>
                      <div className="text-[10px] text-gray-500 font-medium">{crmPillars[activeTab].previewStats.label3}</div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-[#dadce0] text-xs text-[#727586] space-y-1.5">
                    <div className="font-bold text-[#1D3557] flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-[#357df9]" />
                      <span>CoPilot AI Intelligence</span>
                    </div>
                    <p className="leading-snug">
                      Continuously evaluates patient flow transitions, auto-fills EMR intake templates, and triggers surge protocols when department load exceeds 85%.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 5. "BUILT TO SUPPORT HEALTHCARE TEAMS LIKE YOURS" (Bitrix24 Solution Categories) */}
      <section className="py-16 bg-[#ffffff] border-b border-[#dadce0]" id="teams">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold text-[#357df9] uppercase tracking-wider bg-[#357df9]/10 px-3 py-1 rounded-full">
              TAILORED CLINICAL SOLUTIONS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1D3557] tracking-tight uppercase">
              YODHA is Built to Support Teams Like Yours
            </h2>
            <p className="text-xs sm:text-sm text-[#727586]">
              Scalable from standalone specialty clinics to multi-department enterprise general hospitals.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {healthcareTeams.map((team, idx) => {
              const Icon = team.icon
              return (
                <div 
                  key={idx}
                  className="p-5 rounded-xl border border-[#dadce0] bg-[#f8fafc] hover:bg-white hover:border-[#357df9] transition-all hover:shadow-md flex items-start gap-4"
                >
                  <div className="h-11 w-11 rounded-lg bg-[#357df9]/10 text-[#357df9] flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[#1D3557]">{team.name}</h3>
                    <p className="text-xs text-[#727586] mt-1">{team.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* 6. "OUR FEATURES" (PappyJoe Vibrant Gradient Section with Emergency Auto-Ordering) */}
      <section className="py-20 bg-gradient-to-r from-[#357df9] to-[#33bd4a] text-white" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="bg-white/20 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-white border border-white/30">
              EXPLORE OUR CAPABILITIES
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
              OUR CLINICAL & FLOW FEATURES
            </h2>
            <p className="text-base text-white/90 font-medium">
              Everything required to run modern hospital operations with zero delays and high predictive confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pappyJoeFeatures.map((item, idx) => {
              const Icon = item.icon
              return (
                <div 
                  key={idx}
                  className="bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/25 transition-all hover:-translate-y-1 shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-white text-[#357df9] flex items-center justify-center mb-4 shadow-md font-bold">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-yellow-300">
                      {item.tag}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-white/85 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/15 flex items-center justify-between text-xs font-semibold">
                    <span className="text-white/90">Apex Hospital Module</span>
                    <span className="text-white flex items-center gap-1">Active <Check className="h-3.5 w-3.5" /></span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center mt-12">
            <Button 
              size="lg"
              className="bg-transparent hover:bg-white hover:text-[#357df9] text-white border-2 border-white font-extrabold text-sm rounded-full px-10 py-6 transition-all shadow-xl"
              onClick={() => navigate('/login')}
            >
              SIGNUP FOR FREE DEMO
            </Button>
          </div>

        </div>
      </section>

      {/* 7. "WHAT IS OUR PROMISE ?" (PappyJoe + Bitrix24 Security Badges) */}
      <section className="py-16 bg-[#18181a] text-white border-b border-gray-800" id="promise">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-bold text-[#357df9] uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">
                ENTERPRISE CLINICAL COMPLIANCE
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase">
                WHAT IS OUR PROMISE ?
              </h2>
              <p className="text-base text-gray-300 leading-relaxed max-w-3xl">
                We promise 100% satisfaction with reliable clinical support, seamless cloud performance, and intelligent algorithms that simplify your hospital&apos;s workflow without disruptive IT overhead.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <Award className="h-6 w-6 text-[#33bd4a] mb-2" />
                  <div className="font-bold text-sm text-white">99.9% Uptime SLA</div>
                  <div className="text-xs text-gray-400 mt-1">High-availability clinical cloud cluster</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <Shield className="h-6 w-6 text-[#357df9] mb-2" />
                  <div className="font-bold text-sm text-white">HIPAA & FHIR R4 Ready</div>
                  <div className="text-xs text-gray-400 mt-1">Standardized health record security</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <FileCheck className="h-6 w-6 text-amber-400 mb-2" />
                  <div className="font-bold text-sm text-white">100% Immutable Audit</div>
                  <div className="text-xs text-gray-400 mt-1">Every clinical & order action logged</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 text-center lg:text-right">
              <div className="p-8 rounded-2xl bg-gradient-to-tr from-[#357df9]/20 to-[#33bd4a]/20 border border-white/10 inline-block text-left w-full">
                <div className="text-3xl font-black text-white">24/7</div>
                <div className="text-sm font-bold text-[#33bd4a]">Dedicated Hospital Support</div>
                <p className="text-xs text-gray-400 mt-2">Direct hotline and clinical assistance for clinical directors and nursing supervisors.</p>
                <Button 

                  className="w-full mt-5 bg-[#357df9] hover:bg-[#265ab2] text-white font-bold rounded-full py-2.5 text-xs"
                  onClick={() => navigate('/login')}
                >
                  Contact Hospital Team
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 8. "WHAT OUR CLIENTS SAY" (Doctor Testimonials) */}
      <section className="py-20 bg-[#f2f3f6] text-[#1d1e20] border-b border-[#dadce0]" id="testimonials">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-[#357df9] uppercase tracking-wider bg-[#357df9]/10 px-3 py-1 rounded-full">
              CLINICIAN ENDORSEMENTS
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1D3557] tracking-tight uppercase">
              What Our Clients Say
            </h2>
            <p className="text-sm text-[#727586]">
              Real feedback from healthcare providers and hospital directors using YODHA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-2xl p-6 sm:p-7 border border-[#dadce0] shadow-md flex flex-col justify-between space-y-4 hover:shadow-xl transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-[#36344d] italic leading-relaxed">
                    &quot;{t.quote}&quot;
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-[#dadce0]">
                  <img 
                    src={t.avatar} 
                    alt={t.name}
                    className="h-11 w-11 rounded-full object-cover border-2 border-[#357df9]"
                  />
                  <div>
                    <div className="font-bold text-sm text-[#1D3557]">{t.name}</div>
                    <div className="text-[11px] text-[#357df9] font-semibold">{t.role}</div>
                    <div className="text-[10px] text-[#727586]">{t.clinic}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button 
              className="bg-[#357df9] hover:bg-[#265ab2] text-white font-bold rounded-full px-8 py-3 shadow-md"
              onClick={() => navigate('/login')}
            >
              JOIN 5000+ HEALTHCARE PROFESSIONALS
            </Button>
          </div>

        </div>
      </section>

      {/* 9. FREQUENTLY ASKED QUESTIONS (FAQ in Azure Blue) */}
      <section className="py-20 bg-[#357df9] text-white border-b border-[#265ab2]" id="faq">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
              Frequently asked questions
            </h2>
            <p className="text-sm text-white/90">
              Clear answers on healthcare CRM features, data privacy, cloud access, and automated replenishment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all"
              >
                <h3 className="text-base font-bold text-white mb-2.5 flex items-start gap-2">
                  <HelpCircle className="h-5 w-5 text-yellow-300 shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs text-white/85 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <div className="inline-flex items-center gap-2 text-xs font-semibold bg-white/20 px-4 py-2 rounded-full text-white">
              <span>Have more questions? Call our sales & support team at</span>
              <strong className="text-yellow-300">+91 94964 99891</strong>
            </div>
          </div>

        </div>
      </section>

      {/* 10. LIMITED TIME OFFER BANNER */}
      <section className="py-12 bg-[#ea580c] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <span className="bg-black/20 text-white text-xs font-extrabold uppercase px-3 py-1 rounded-full">
            SPECIAL HACKATHON DEMO
          </span>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight uppercase">
            Experience Full Predictive Hospital Control Today!
          </h2>
          <p className="text-sm text-white/90 max-w-2xl mx-auto">
            Try the 4 dedicated clinical roles: Hospital Administrator, Doctor, Nurse / Ward Staff, and Bed Manager.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Button 
              size="lg"
              className="bg-[#ffffff] text-[#ea580c] hover:bg-gray-100 font-black rounded-full px-8 shadow-lg"
              onClick={() => navigate('/login')}
            >
              LAUNCH DEMO NOW
            </Button>
          </div>
        </div>
      </section>

      {/* 11. FOOTER (PappyJoe & Bitrix24 Synergy `#1D3557`) */}
      <footer className="bg-[#1D3557] text-white py-14 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            
            {/* Col 1: About */}
            <div className="space-y-3">
              <div className="cursor-pointer" onClick={() => navigate('/')}>
                <Logo size="sm" variant="white" subtitle="Apex General Hospital" />
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                India&apos;s leading healthcare CRM and predictive hospital flow management platform. Designed to eliminate emergency saturation, balance ward beds, and automate clinical resource replenishment.
              </p>
              <div className="text-xs text-[#33bd4a] font-semibold">
                Single Hospital Hub: Apex General Hospital
              </div>
            </div>

            {/* Col 2: Hospital Modules */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Clinical Modules</h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li><a href="/login" className="hover:text-[#357df9]">Command Center</a></li>
                <li><a href="/login" className="hover:text-[#357df9]">Patient CRM Timeline</a></li>
                <li><a href="/login" className="hover:text-[#357df9]">Bed Management Grid</a></li>
                <li><a href="/login" className="hover:text-[#357df9]">Emergency Triage (Manchester 1-5)</a></li>
                <li><a href="/login" className="hover:text-[#357df9]">Emergency Auto-Ordering Hub</a></li>
                <li><a href="/login" className="hover:text-[#357df9]">4-24h Surge Forecasting</a></li>
                <li><a href="/login" className="hover:text-[#357df9]">HL7 FHIR R4 Integration</a></li>
              </ul>
            </div>

            {/* Col 3: 4 Core Roles */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Demo Credentials (4 Roles)</h4>
              <div className="space-y-1.5 text-xs text-gray-300">
                <div>👑 <strong>Admin:</strong> admin / admin123</div>
                <div>🩺 <strong>Doctor:</strong> doctor / doctor123</div>
                <div>👩‍⚕️ <strong>Nurse:</strong> nurse / nurse123</div>
                <div>🛏️ <strong>Bed Manager:</strong> bedmgr / bedmgr123</div>
              </div>
              <div className="pt-2">
                <Button 
                  size="sm"
                  className="bg-[#357df9] hover:bg-[#265ab2] text-white text-[11px] font-bold rounded-full w-full py-1"
                  onClick={() => navigate('/login')}
                >
                  Go to Login →
                </Button>
              </div>
            </div>

            {/* Col 4: Development Team */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Development Team</h4>
              <div className="text-xs font-semibold text-[#33bd4a]">The Crew</div>
              <p className="text-[11px] text-gray-400">Department of Computer Science & Engineering, V.S.B. Engineering College, Karur</p>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-gray-300 pt-1">
                <div>• RITHISH T</div>
                <div>• RITHIKAN T</div>
                <div>• RAMJI S</div>
                <div>• SHAFAAT Muhammad S</div>
              </div>
            </div>

          </div>

          <div className="pt-8 border-t border-gray-700/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400">
            <div>
              © 2026 YODHA 2.0. Inspired by PappyJoe & Bitrix24 Healthcare CRM Design Systems.
            </div>
            <div className="text-center sm:text-right text-[11px] max-w-lg">
              <strong>Clinical Decision Disclaimer:</strong> YODHA 2.0 provides operational forecasting, CRM workflows, and simulations based on synthetic datasets. Final clinical and triage decisions remain with certified medical staff.
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
