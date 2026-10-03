import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Progress } from "@/components/ui/Progress"
import { 
  Zap, ArrowRight, ArrowLeft, X, CheckCircle, Brain, 
  Layers, ShieldCheck, Activity, Siren, Users, BedDouble, 
  ExternalLink, Sparkles
} from "lucide-react"

interface JudgeDemoModalProps {
  open: boolean
  onClose: () => void
}

const DEMO_STEPS = [
  {
    step: 1,
    title: "1. Command Center & Flow Health Score",
    route: "/app/command-center",
    icon: Activity,
    highlight: "Dynamic 0-100 score synthesized from live occupancy, ED queue, and staff load.",
    details: "The Command Center aggregates multi-department telemetries into a single actionable Flow Health Score. Color-coded risk states immediately alert staff before bed exhaustion occurs.",
    actionLabel: "Go to Command Center"
  },
  {
    step: 2,
    title: "2. Emergency Department & Triage Queue",
    route: "/app/emergency",
    icon: Siren,
    highlight: "Real-time visibility into arriving trauma, critical triage, and waiting times.",
    details: "Live queue tracking with Canadian/Manchester Triage scoring. Direct actions to adjust priority or allocate beds immediately update the state and audit log.",
    actionLabel: "Inspect Emergency Queue"
  },
  {
    step: 3,
    title: "3. 4–24h Ahead Predictive Forecast Engine",
    route: "/app/forecast",
    icon: Brain,
    highlight: "Machine Learning models predicting arrivals, admissions, and discharges.",
    details: "Gradient Boosting models trained on synthetic historical arrival patterns with 90%+ confidence intervals. Evaluates 4h, 8h, 12h, and 24h operational horizons.",
    actionLabel: "View AI Forecasts"
  },
  {
    step: 4,
    title: "4. Explainable AI (XAI) & Factor Attribution",
    route: "/app/explainability",
    icon: Sparkles,
    highlight: "Transparent feature importance showing WHY the AI forecasted congestion.",
    details: "SHAP-style contribution breakdown reveals factors such as shift transition lag, historical weekend surge factors, and incoming ambulance volume.",
    actionLabel: "Explore XAI Attribution"
  },
  {
    step: 5,
    title: "5. Crisis Center & Saturation Warnings",
    route: "/app/crisis",
    icon: Siren,
    highlight: "Early crisis detection preventing ICU and ward overflow.",
    details: "Flags high-probability crisis events before they happen. Includes driver breakdowns and one-click crisis response simulation protocols.",
    actionLabel: "Open Crisis Center"
  },
  {
    step: 6,
    title: "6. Digital Twin What-If Simulator",
    route: "/app/digital-twin",
    icon: Layers,
    highlight: "Risk-free deterministic M/M/c queueing sandbox.",
    details: "Simulate surges, staff additions, expedited discharges, or ward transfers. View side-by-side Before vs. After metrics before enacting changes.",
    actionLabel: "Launch Digital Twin"
  },
  {
    step: 7,
    title: "7. AI Prescriptive Optimization Recommendations",
    route: "/app/optimization",
    icon: Zap,
    highlight: "Ranked operational actions with estimated impact scores.",
    details: "AI calculates optimal interventions (e.g. prep 4 swing beds, expedite stable ward discharges). Requires explicit human approval.",
    actionLabel: "View Recommendations"
  },
  {
    step: 8,
    title: "8. Human-In-The-Loop Approval & Audit Trail",
    route: "/app/audit",
    icon: ShieldCheck,
    highlight: "Immutable regulatory logging for every AI suggestion approved or rejected.",
    details: "Enforces the principle: 'AI recommends. Human decides.' Every state transition, bed allocation, and protocol trigger is immutably timestamped.",
    actionLabel: "Inspect Audit Trail"
  },
  {
    step: 9,
    title: "9. Smart Bed Matching & Multi-Ward Balancing",
    route: "/app/beds",
    icon: BedDouble,
    highlight: "Real-time occupancy grids across ICU, ED, General, and Pediatric wards.",
    details: "Instantly allocate, release, transfer, or reserve beds with automatic conflict checking and ward utilization optimization.",
    actionLabel: "Manage Beds"
  },
  {
    step: 10,
    title: "10. Staffing Workload Balancing",
    route: "/app/staffing",
    icon: Users,
    highlight: "Workload index monitoring across doctors, nurses, and support staff.",
    details: "Identifies clinical burnout zones and recommends proactive shift reallocations to meet incoming forecasted patient influx.",
    actionLabel: "Check Staffing"
  },
  {
    step: 11,
    title: "11. Regional Hospital Network Balancing",
    route: "/app/network",
    icon: Activity,
    highlight: "Multi-hospital load redistribution and regional EMS routing.",
    details: "Monitors regional peer facilities (Apex General, Metro Health, Valley Memorial, St. Jude) to divert incoming ambulances when local saturation nears 100%.",
    actionLabel: "View Hospital Network"
  },
  {
    step: 12,
    title: "12. AI Safety, Guardrails & Governance",
    route: "/app/safety",
    icon: ShieldCheck,
    highlight: "Real-time model confidence, data drift, and clinical boundary enforcement.",
    details: "Displays decision-support guardrails, data quality indices, model confidence calibration, and strict ethical disclaimers.",
    actionLabel: "Review AI Safety"
  },
  {
    step: 13,
    title: "13. Evidence-Grounded AI Copilot",
    route: "/app/copilot",
    icon: Brain,
    highlight: "Conversational query interface grounded directly in live operational database.",
    details: "Clinical and operations leads can ask free-form queries with immediate answers supported by telemetry evidence cards — zero hallucination.",
    actionLabel: "Interact with AI Copilot"
  }
]

export function JudgeDemoModal({ open, onClose }: JudgeDemoModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const navigate = useNavigate()

  if (!open) return null

  const step = DEMO_STEPS[currentStepIndex]
  const Icon = step.icon
  const progress = Math.round(((currentStepIndex + 1) / DEMO_STEPS.length) * 100)

  const handleNext = () => {
    if (currentStepIndex < DEMO_STEPS.length - 1) {
      const nextIdx = currentStepIndex + 1
      setCurrentStepIndex(nextIdx)
      navigate(DEMO_STEPS[nextIdx].route)
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIdx = currentStepIndex - 1
      setCurrentStepIndex(prevIdx)
      navigate(DEMO_STEPS[prevIdx].route)
    }
  }

  const handleNavigateDirect = () => {
    navigate(step.route)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">Judge Evaluation Walkthrough</h3>
                <Badge variant="default" className="text-[10px] font-semibold">Step {step.step} of {DEMO_STEPS.length}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Guided tour of YODHA 2.0 Predictive Flow Control Tower</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
            <span>Overall Progress</span>
            <span>{progress}% Completed</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Step Card Content */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Icon className="h-4 w-4" />
            </div>
            <h4 className="text-base font-bold text-foreground">{step.title}</h4>
          </div>

          <div className="text-xs font-semibold text-primary">
            {step.highlight}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {step.details}
          </p>

          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleNavigateDirect}
            className="text-xs gap-1.5 bg-background hover:bg-muted"
          >
            <span>{step.actionLabel}</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handlePrev} 
            disabled={currentStepIndex === 0}
            className="gap-1.5 text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Button>

          <div className="flex gap-1">
            {DEMO_STEPS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setCurrentStepIndex(i)
                  navigate(DEMO_STEPS[i].route)
                }}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStepIndex 
                    ? "w-5 bg-primary" 
                    : i < currentStepIndex 
                      ? "w-2 bg-primary/50" 
                      : "w-2 bg-muted"
                }`}
                title={`Step ${i + 1}`}
              />
            ))}
          </div>

          <Button 
            size="sm" 
            onClick={handleNext} 
            className="gap-1.5 text-xs font-semibold"
          >
            {currentStepIndex === DEMO_STEPS.length - 1 ? (
              <>Finish Walkthrough <CheckCircle className="h-3.5 w-3.5 ml-1" /></>
            ) : (
              <>Next Step <ArrowRight className="h-3.5 w-3.5" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
