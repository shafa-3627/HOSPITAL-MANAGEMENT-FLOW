import axios from "axios"
import { useAuthStore } from "@/stores/authStore"

const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (isLocalhost ? "http://127.0.0.1:8000/api" : "https://spy-jacob-dee-ict.trycloudflare.com/api"),
  timeout: 8000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor for API calls
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// -------------------------------------------------------------
// STANDALONE / GITHUB PAGES OFFLINE MOCK ENGINE
// Ensures all 30 pages work 100% seamlessly without Network Errors
// -------------------------------------------------------------

const MOCK_DEPARTMENTS = [
  { id: 1, name: "Intensive Care Unit (ICU)", type: "ICU", total_beds: 40, occupied_beds: 38, available_beds: 2, utilization: 95.0, status: "critical" },
  { id: 2, name: "Emergency Department (ED)", type: "ED", total_beds: 60, occupied_beds: 51, available_beds: 9, utilization: 85.0, status: "warning" },
  { id: 3, name: "General Medical Ward", type: "General", total_beds: 120, occupied_beds: 89, available_beds: 31, utilization: 74.2, status: "normal" },
  { id: 4, name: "Pediatric Ward", type: "Pediatric", total_beds: 50, occupied_beds: 32, available_beds: 18, utilization: 64.0, status: "normal" },
  { id: 5, name: "Operating Theatre (OR)", type: "OR", total_beds: 30, occupied_beds: 21, available_beds: 9, utilization: 70.0, status: "normal" },
]

const MOCK_PATIENTS = Array.from({ length: 45 }, (_, i) => ({
  id: i + 1,
  patient_code: `P-${1000 + i + 1}`,
  patient_name: `Patient ${1000 + i + 1}`,
  age: 20 + ((i * 7) % 65),
  gender: i % 2 === 0 ? "Male" : "Female",
  priority: i % 5 === 0 ? "critical" : i % 3 === 0 ? "high" : i % 2 === 0 ? "medium" : "low",
  department_id: (i % 5) + 1,
  bed_id: (i % 30) + 1,
  status: i % 4 === 0 ? "waiting" : i % 3 === 0 ? "in_treatment" : "admitted",
  diagnosis_category: ["Cardiology", "Trauma", "Respiratory", "Neurology", "General Surgery"][i % 5],
  current_stage: ["triage", "diagnosis", "admission", "treatment", "discharge_ready"][i % 5],
  waiting_time_minutes: 15 + ((i * 13) % 110),
  is_synthetic: true
}))

const MOCK_BEDS = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  bed_number: `${(i % 5 === 0 ? "ICU" : i % 5 === 1 ? "ED" : "GEN")}-${101 + i}`,
  ward: ["ICU East", "Emergency Bay A", "General Ward North", "Pediatric Wing", "OR Complex"][i % 5],
  type: ["icu", "standard", "isolation", "standard", "or"][i % 5],
  department_id: (i % 5) + 1,
  status: i < 38 ? "occupied" : i < 46 ? "available" : "reserved",
  patient_id: i < 38 ? i + 1 : null,
  equipment: ["Ventilator", "Cardiac Monitor", "Oxygen Port", "Infusion Pump"][i % 4]
}))

const MOCK_STAFF = Array.from({ length: 35 }, (_, i) => ({
  id: i + 1,
  staff_code: `STF-${200 + i + 1}`,
  name: ["Dr. Sarah Jenkins", "Dr. Rajesh Kumar", "Dr. Emily Chen", "Nurse Marcus Vance", "Nurse Priya Sharma", "Dr. Alex Taylor"][i % 6] + ` (#${i + 1})`,
  role: i % 3 === 0 ? "doctor" : "nurse",
  department_id: (i % 5) + 1,
  shift: ["morning", "afternoon", "night"][i % 3],
  status: i % 4 === 0 ? "off_duty" : "on_duty",
  workload_index: 60 + ((i * 9) % 38),
  specialization: ["Intensive Care", "Emergency Medicine", "Cardiology", "Trauma Nursing", "Pediatrics"][i % 5]
}))

const MOCK_ALERTS = [
  {
    id: 1,
    alert_code: "YD-4256",
    title: "ICU BED SATURATION & CRITICAL SURGE",
    department_key: "ICU",
    department_name: "Intensive Care Unit (ICU)",
    severity: "CRITICAL",
    current_occupancy: 95.0,
    predicted_occupancy: 98.5,
    horizon_hours: 4,
    waiting_patients: 12,
    reason: "Severe surge in ED acute respiratory transfers with delayed step-down discharge rate.",
    required_response: "Activate Tier 2 Surge Protocol, recall on-duty clinical team, prep 3 swing beds.",
    status: "ACTIVE",
    created_at: new Date().toISOString(),
    created_time_display: "Just now",
    acknowledged_count: 3,
    total_staff_notified: 4,
    coordinator_approved: false,
    telegram_status: "READY",
    telegram_chat_id: "******4406",
    staff_recalls: [
      {
        recall_id: "RC-ICU-101",
        alert_id: "YD-4256",
        staff_id: 1,
        staff_code: "DOC-ICU-01",
        staff_name: "Dr. Sarah Jenkins",
        role: "Attending Intensivist",
        department: "ICU",
        specialization: "Critical Care",
        shift: "Morning",
        status: "ACKNOWLEDGED",
        escalation_tier: 1,
        notified_at: new Date().toISOString(),
        notified_time: "5 mins ago",
        acknowledged_at: new Date().toISOString()
      },
      {
        recall_id: "RC-ICU-102",
        alert_id: "YD-4256",
        staff_id: 2,
        staff_code: "RN-ICU-08",
        staff_name: "Nurse Marcus Vance",
        role: "Senior Charge Nurse",
        department: "ICU",
        specialization: "Ventilator Support",
        shift: "Morning",
        status: "RESPONDED",
        escalation_tier: 1,
        notified_at: new Date().toISOString(),
        notified_time: "7 mins ago",
        acknowledged_at: new Date().toISOString(),
        responded_at: new Date().toISOString(),
        eta_minutes: 15
      },
      {
        recall_id: "RC-ICU-103",
        alert_id: "YD-4256",
        staff_id: 3,
        staff_code: "DOC-ICU-04",
        staff_name: "Dr. Rajesh Kumar",
        role: "Clinical Specialist",
        department: "ICU",
        specialization: "Cardiology",
        shift: "Afternoon",
        status: "ACKNOWLEDGED",
        escalation_tier: 1,
        notified_at: new Date().toISOString(),
        notified_time: "3 mins ago"
      },
      {
        recall_id: "RC-ICU-104",
        alert_id: "YD-4256",
        staff_id: 4,
        staff_code: "RN-ICU-12",
        staff_name: "Nurse Priya Sharma",
        role: "ICU Float Nurse",
        department: "ICU",
        specialization: "Critical Monitoring",
        shift: "On-Call",
        status: "NOTIFIED",
        escalation_tier: 1,
        notified_at: new Date().toISOString(),
        notified_time: "1 min ago"
      }
    ]
  },
  {
    id: 2,
    alert_code: "YD-3189",
    title: "EMERGENCY DEPARTMENT ADMISSION CONGESTION",
    department_key: "ED",
    department_name: "Emergency Department (ED)",
    severity: "HIGH",
    current_occupancy: 85.0,
    predicted_occupancy: 92.0,
    horizon_hours: 6,
    waiting_patients: 18,
    reason: "Inflow surge exceeding triage processing bandwidth by 28%.",
    required_response: "Open fast-track evaluation bays and deploy 2 float triage nurses.",
    status: "ACTIVE",
    created_at: new Date().toISOString(),
    created_time_display: "12 mins ago",
    acknowledged_count: 2,
    total_staff_notified: 3,
    coordinator_approved: false,
    telegram_status: "READY",
    telegram_chat_id: "******4406",
    staff_recalls: []
  }
]

function getMockResponse(url: string, method: string = "get", data?: any): any {
  const cleanUrl = url.replace(/^\/api/, "").split("?")[0]

  if (cleanUrl === "/dashboard") {
    return {
      health_score: 84,
      status: "STABLE",
      total_patients: 145,
      available_beds: 38,
      ed_waiting: 12,
      icu_occupancy: 95.0,
      staff_available: 48,
      active_alerts: 2,
      occupancy_pct: 82.4,
      avg_workload: 71.5,
      departments: MOCK_DEPARTMENTS
    }
  }

  if (cleanUrl === "/dashboard/capacity" || cleanUrl === "/departments") {
    return MOCK_DEPARTMENTS
  }

  if (cleanUrl === "/dashboard/forecast-summary" || cleanUrl === "/forecast") {
    return [
      { id: 1, department_id: 1, metric: "icu_occupancy", horizon_hours: 4, predicted_value: 98.5, confidence: 0.94, lower_bound: 94.0, upper_bound: 100.0, model_type: "GradientBoosting" },
      { id: 2, department_id: 1, metric: "icu_occupancy", horizon_hours: 8, predicted_value: 96.2, confidence: 0.91, lower_bound: 90.0, upper_bound: 99.0, model_type: "GradientBoosting" },
      { id: 3, department_id: 2, metric: "ed_arrivals", horizon_hours: 12, predicted_value: 48.0, confidence: 0.89, lower_bound: 40.0, upper_bound: 55.0, model_type: "GradientBoosting" },
      { id: 4, department_id: 3, metric: "ward_discharges", horizon_hours: 24, predicted_value: 26.0, confidence: 0.88, lower_bound: 20.0, upper_bound: 31.0, model_type: "GradientBoosting" }
    ]
  }

  if (cleanUrl === "/alerts" || cleanUrl === "/alerts/active") {
    return MOCK_ALERTS
  }

  if (cleanUrl === "/alerts/contacts") {
    return {
      department_contacts: {
        ICU: { name: "Dr. Sarah Jenkins", role: "Attending Intensivist", phone: "+91 98401 23456" },
        ED: { name: "Dr. Marcus Vance", role: "Emergency Department Chief", phone: "+91 94441 67890" },
        General: { name: "Dr. Rajesh Kumar", role: "General Medical Director", phone: "+91 98840 54321" },
        Operations: { name: "Cmdr. Hospital Operations", role: "Incident Command Lead", phone: "+91 97900 11223" }
      }
    }
  }

  if (cleanUrl === "/telegram/status") {
    return {
      bot_username: "@CrewResponsebot",
      service_enabled: true,
      token_configured: true,
      test_chat_id: "******4406",
      staff_manager_chat_id: "******4406",
      doctor_chat_id: "******4733",
      recent_dispatches_count: 14
    }
  }

  if (cleanUrl === "/telegram/logs") {
    return [
      { id: "TG-1004", alert_id: "BOV-2-7113", type: "BED_OVERFLOW_ALERT", department: "ICU", recipient_role: "Staff Manager", chat_id: "******4406", status: "SENT / ACCEPTED", timestamp: new Date().toISOString() },
      { id: "TG-1003", alert_id: "DOC-2-8860", type: "DOCTOR_AVAILABILITY_ALERT", department: "ICU", recipient_role: "Doctor", chat_id: "******4733", status: "SENT / ACCEPTED", timestamp: new Date().toISOString() },
      { id: "TG-1002", alert_id: "YD-4256", type: "EMERGENCY_ALERT", department: "ICU", chat_id: "******4406", status: "SENT / ACCEPTED", timestamp: new Date().toISOString() }
    ]
  }

  if (cleanUrl.startsWith("/scenarios/")) {
    return {
      status: "triggered",
      message: "Scenario activated successfully. Operational protocols initiated.",
      alert: MOCK_ALERTS[0]
    }
  }

  if (cleanUrl === "/beds") return MOCK_BEDS
  if (cleanUrl === "/patients" || cleanUrl === "/patient-flow") return MOCK_PATIENTS
  if (cleanUrl === "/staff") return MOCK_STAFF

  if (cleanUrl === "/staff/workload") {
    return {
      departments: MOCK_DEPARTMENTS.map(d => ({
        department_id: d.id,
        department_name: d.name,
        staff_count: 8,
        avg_workload: d.type === "ICU" ? 88.0 : d.type === "ED" ? 82.0 : 68.0
      }))
    }
  }

  if (cleanUrl === "/staff/recommendations" || cleanUrl === "/optimization" || cleanUrl === "/recommendations") {
    return [
      { id: 1, title: "Prepare 3 ICU Swing Beds", description: "Convert stepdown recovery units to relieve predicted 4h saturation.", confidence: 0.94, expected_impact: "Prevents 4h ICU saturation", affected_department: 1, action_type: "bed_prep", status: "pending" },
      { id: 2, title: "Deploy 2 Float Nurses to ICU", description: "Rebalance nurse-to-patient ratio to reduce workload from 88% to 74%.", confidence: 0.91, expected_impact: "Reduces burnout index by 14%", affected_department: 1, action_type: "staff_reallocation", status: "pending" },
      { id: 3, title: "Expedite 4 General Ward Discharges", description: "Review clinical clearance for patients in discharge stage to free up downstream beds.", confidence: 0.88, expected_impact: "Frees 4 acute care beds", affected_department: 3, action_type: "discharge_review", status: "pending" }
    ]
  }

  if (cleanUrl === "/resources") {
    return [
      { id: 1, name: "Mechanical Ventilators", type: "ventilator", total: 25, available: 4, in_use: 21, maintenance: 0, shortage_risk: "HIGH" },
      { id: 2, name: "High-Flow Oxygen Concentrators", type: "oxygen", total: 50, available: 14, in_use: 36, maintenance: 0, shortage_risk: "LOW" },
      { id: 3, name: "Cardiac Telemetry Monitors", type: "monitor", total: 40, available: 6, in_use: 34, maintenance: 0, shortage_risk: "MODERATE" },
      { id: 4, name: "Infusion Pumps", type: "pump", total: 80, available: 22, in_use: 58, maintenance: 0, shortage_risk: "LOW" }
    ]
  }

  if (cleanUrl === "/crisis") {
    return [
      { id: 1, title: "ICU Capacity Exhaustion", severity: "CRITICAL", probability: 0.94, predicted_time: "In 4 hours", department: "ICU", drivers: ["Surge in ED acute transfers", "Delayed discharge clearances"] },
      { id: 2, title: "Emergency Department Boarding Delay", severity: "HIGH", probability: 0.88, predicted_time: "In 6 hours", department: "ED", drivers: ["Inflow spike +28%", "Triage bottleneck"] }
    ]
  }

  if (cleanUrl === "/simulation/run") {
    return {
      scenario: data?.scenario || "custom",
      simulation_id: Math.floor(Math.random() * 1000) + 1,
      before: { total_occupancy: 82.4, waiting_patients: 12, avg_workload: 71.5, crisis_risk: "High" },
      after: { total_occupancy: 74.1, waiting_patients: 4, avg_workload: 62.0, crisis_risk: "Low" }
    }
  }

  if (cleanUrl === "/copilot/ask") {
    const q = (data?.question || "").toLowerCase()
    return {
      answer: q.includes("icu")
        ? "ICU is currently at 95.0% occupancy with 2 beds remaining. An impending surge is forecast in 4 hours. Recommended actions: activate 3 swing beds and recall on-call intensivist team."
        : q.includes("ed") || q.includes("emergency")
        ? "Emergency Department has 12 waiting patients with an average wait time of 38 minutes. Inflow is elevated (+28%)."
        : "Hospital operational flow is operating under elevated capacity. Current health score is 84/100. Review the Command Center for live telemetry.",
      evidence: [
        { label: "ICU Occupancy", value: "95.0%" },
        { label: "Available Beds", value: "2 / 40" },
        { label: "Forecast Peak", value: "98.5% in 4h" }
      ],
      source: "YODHA AI Engine — Real-time Census"
    }
  }

  if (cleanUrl === "/anomalies") {
    return [
      { id: 1, department: "ICU", metric: "Admission Inflow Rate", current_value: "8.4 pt/hr", baseline_value: "3.2 pt/hr", deviation: "+2.6 σ", severity: "CRITICAL", explanation: "Statistically significant cluster of respiratory emergency transfers." },
      { id: 2, department: "Emergency", metric: "Triage-to-Bed Duration", current_value: "42 min", baseline_value: "22 min", deviation: "+2.1 σ", severity: "HIGH", explanation: "Backlog in laboratory diagnostics turnaround time." }
    ]
  }

  if (cleanUrl === "/events") {
    return [
      { id: "EV-101", event_type: "alert", description: "Critical ICU Surge Protocol activated by AI Engine", timestamp: new Date().toISOString() },
      { id: "EV-102", event_type: "patient_arrival", description: "Patient P-1044 admitted to Emergency Triage Bay", timestamp: new Date().toISOString() },
      { id: "EV-103", event_type: "bed_change", description: "Bed #ICU-104 status updated to Occupied", timestamp: new Date().toISOString() }
    ]
  }

  if (cleanUrl === "/fhir/status") {
    return [
      { id: 1, name: "HL7 FHIR R4 Core Server", type: "fhir", status: "connected", last_sync: "Continuous Real-Time", version: "v4.0.1" },
      { id: 2, name: "Epic Systems EHR Bridge", type: "ehr", status: "connected", last_sync: "1 min ago", version: "v2024" },
      { id: 3, name: "Cerner ADT Feed", type: "adt", status: "connected", last_sync: "Real-time", version: "HL7 v2.5" }
    ]
  }

  if (cleanUrl === "/model/evaluations" || cleanUrl === "/model/info") {
    return [
      { id: 1, model_name: "YODHA-GradientBoost-v2", model_type: "Gradient Boosting Regressor", dataset_size: "14,800 records", mae: 1.84, rmse: 2.42, r2_score: 0.942, prediction_horizon: "4–24 hours", evaluated_at: new Date().toISOString() }
    ]
  }

  if (cleanUrl === "/analytics") {
    return {
      periods: ["Daily", "Weekly", "Monthly"],
      metrics: { avg_los: "3.8 days", ed_boarding_min: 34, flow_efficiency_score: 86.4, diversion_hours_prevented: 18.5 }
    }
  }

  if (cleanUrl === "/security") {
    return { status: "SECURE", role_based_access: "Active", encryption: "AES-256 / TLS 1.3", session_active: true }
  }

  if (cleanUrl === "/safety") {
    return {
      safety_score: 99.4,
      guardrails_active: true,
      human_in_the_loop: "Enforced for all clinical & resource decisions",
      disclaimer: "Decision support prototype for demonstration purposes."
    }
  }

  if (cleanUrl === "/audit") {
    return [
      { id: 1, username: "Clinical Coordinator", role: "admin", action: "TELEGRAM_EMERGENCY_DISPATCH", entity_type: "Alert", entity_id: "YD-4256", timestamp: new Date().toISOString(), reason: "Emergency alert sent to ICU" },
      { id: 2, username: "Bed Manager", role: "bed_manager", action: "BED_ALLOCATED", entity_type: "Bed", entity_id: "ICU-102", timestamp: new Date().toISOString(), reason: "Patient P-1002 assigned" }
    ]
  }

  if (cleanUrl === "/reports/generate") {
    return {
      title: "YODHA 2.0 Operational Shift Report",
      generated_at: new Date().toISOString(),
      census_summary: "145 total patients, 38 beds available, ICU occupancy at 95.0%",
      risk_assessment: "Elevated ICU pressure. 3 swing beds recommended."
    }
  }

  if (cleanUrl === "/network/hospitals") {
    return [
      { id: 1, name: "Apex General Hospital (Main)", status: "Active", total_beds: 300, occupancy_pct: 82.4, risk_level: "HIGH" },
      { id: 2, name: "Metro Health Medical Center", status: "Active", total_beds: 250, occupancy_pct: 68.0, risk_level: "LOW" },
      { id: 3, name: "Valley Memorial Hospital", status: "Active", total_beds: 180, occupancy_pct: 74.5, risk_level: "MODERATE" }
    ]
  }

  if (cleanUrl === "/settings") {
    return {
      hospital_name: "Apex General Hospital",
      demo_mode: true,
      telegram_enabled: true,
      notifications_enabled: true
    }
  }

  if (cleanUrl === "/data-quality") {
    return {
      overall_score: 98.4,
      completeness_pct: 99.1,
      timeliness_pct: 97.8,
      schema_compliance: "FHIR R4 / HL7 v2.5",
      total_records_analyzed: 340,
      active_anomalies: 0,
      last_sync: "Continuous Real-Time"
    }
  }

  // Generic fallback
  return { success: true, message: "OK", data: {} }
}

// Response interceptor: automatically falls back to rich in-memory mock engine if backend unreachable
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async function (error) {
    const config = error.config
    // Do NOT fake Telegram actions if backend is unreachable - propagate real error
    const url = config?.url || ""
    const isTelegramAction = url.includes("telegram") || url.includes("trigger-overflow-alert") || url.includes("trigger-doctor-alert") || url.includes("send-telegram")
    if (isTelegramAction) {
      return Promise.reject(error)
    }

    // If backend is unreachable or CORS/Mixed Content occurs (e.g. GitHub Pages hosted), return realistic mock data
    if (!error.response || error.code === "ERR_NETWORK" || error.message?.includes("Network Error") || error.response.status >= 500) {
      console.info(`[YODHA Demo Engine] Serving standalone fallback for: ${config.method?.toUpperCase()} ${config.url}`)
      const mockData = getMockResponse(config.url || "", config.method || "get", config.data ? JSON.parse(config.data || "{}") : {})
      return {
        data: mockData,
        status: 200,
        statusText: "OK (YODHA Standalone Engine)",
        headers: {},
        config: config
      }
    }

    if (error.response?.status === 401 && !config._retry) {
      config._retry = true
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)
