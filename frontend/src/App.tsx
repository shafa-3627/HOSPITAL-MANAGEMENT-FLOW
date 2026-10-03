import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useAuthStore } from "@/stores/authStore"
import { Layout } from "@/components/layout/Layout"

// Pages
import Landing from "@/pages/Landing"
import Login from "@/pages/Login"
import CommandCenter from "@/pages/CommandCenter"
import AdmissionEntry from "@/pages/AdmissionEntry"
import AgenticAI from "@/pages/AgenticAI"
import AICopilot from "@/pages/AICopilot"
import PatientFlow from "@/pages/PatientFlow"
import Emergency from "@/pages/Emergency"
import BedManagement from "@/pages/BedManagement"
import AIForecast from "@/pages/AIForecast"
import AIOptimization from "@/pages/AIOptimization"
import CrisisCenter from "@/pages/CrisisCenter"
import CongestionAlerts from "@/pages/CongestionAlerts"
import DigitalTwin from "@/pages/DigitalTwin"
import ExplainableAI from "@/pages/ExplainableAI"
import BottleneckDetection from "@/pages/BottleneckDetection"
import Staffing from "@/pages/Staffing"
import Resources from "@/pages/Resources"
import EMSSimulation from "@/pages/EMSSimulation"
import AnomalyDetection from "@/pages/AnomalyDetection"
import LiveEvents from "@/pages/LiveEvents"
import IntegrationHub from "@/pages/IntegrationHub"
import AIModelLab from "@/pages/AIModelLab"
import Analytics from "@/pages/Analytics"
import Impact from "@/pages/Impact"
import Reports from "@/pages/Reports"
import SecurityCenter from "@/pages/SecurityCenter"
import AISafety from "@/pages/AISafety"
import AuditTrail from "@/pages/AuditTrail"
import HospitalNetwork from "@/pages/HospitalNetwork"
import Settings from "@/pages/Settings"
import NotFound from "@/pages/NotFound"
import Unauthorized from "@/pages/Unauthorized"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/app/command-center" replace />} />
          
          <Route path="command-center" element={<CommandCenter />} />
          <Route path="admissions" element={<AdmissionEntry />} />
          <Route path="agentic-ai" element={<AgenticAI />} />
          <Route path="copilot" element={<AICopilot />} />
          <Route path="ai-copilot" element={<AICopilot />} />
          <Route path="patient-flow" element={<PatientFlow />} />
          <Route path="emergency" element={<Emergency />} />
          <Route path="beds" element={<BedManagement />} />
          <Route path="crisis" element={<CrisisCenter />} />
          <Route path="alerts" element={<CongestionAlerts />} />
          <Route path="staff-recall" element={<CongestionAlerts />} />
          
          <Route path="forecast" element={<AIForecast />} />
          <Route path="ai-forecast" element={<AIForecast />} />
          <Route path="optimization" element={<AIOptimization />} />
          <Route path="ai-optimization" element={<AIOptimization />} />
          <Route path="explainability" element={<ExplainableAI />} />
          <Route path="bottlenecks" element={<BottleneckDetection />} />
          
          <Route path="staffing" element={<Staffing />} />
          <Route path="resources" element={<Resources />} />
          
          <Route path="digital-twin" element={<DigitalTwin />} />
          <Route path="ems" element={<EMSSimulation />} />
          <Route path="model-lab" element={<AIModelLab />} />
          <Route path="network" element={<HospitalNetwork />} />
          
          <Route path="anomalies" element={<AnomalyDetection />} />
          <Route path="events" element={<LiveEvents />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="impact" element={<Impact />} />
          <Route path="reports" element={<Reports />} />
          
          <Route path="integrations" element={<IntegrationHub />} />
          <Route path="security" element={<SecurityCenter />} />
          <Route path="safety" element={<AISafety />} />
          <Route path="audit" element={<AuditTrail />} />
          <Route path="settings" element={<Settings />} />
          
          <Route path="unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  )
}
