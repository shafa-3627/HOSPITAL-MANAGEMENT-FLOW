export interface Patient {
  id: string
  name: string
  age: number
  gender: string
  status: "Waiting" | "In Treatment" | "Admitted" | "Discharged" | "Transferred"
  priority: "Low" | "Medium" | "High" | "Critical"
  department: string
  waitTime: number // in minutes
  assignedBedId?: string
}

export interface Bed {
  id: string
  ward: string
  department: string
  status: "Available" | "Occupied" | "Cleaning" | "Maintenance"
  patientId?: string
  type: "ICU" | "General" | "Emergency" | "Pediatric"
}

export interface Metrics {
  flowHealthScore: number
  currentPatients: number
  availableBeds: number
  edWaiting: number
  icuOccupancy: number
  staffAvailable: number
  activeAlerts: number
}

export interface Prediction {
  time: string
  actual: number
  predicted: number
  upperBound: number
  lowerBound: number
}

export interface Crisis {
  id: string
  type: string
  severity: "High" | "Critical" | "Medium" | "Low"
  probability: number
  predictedTime: string
  department: string
  drivers: string[]
  recommendedActions: string[]
}
