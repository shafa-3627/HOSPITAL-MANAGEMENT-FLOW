import { create } from "zustand"
import { persist } from "zustand/middleware"
import { apiClient } from "@/services/api"

interface User {
  id: number
  username: string
  full_name: string
  role: string
  email: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const DEMO_USERS: Record<string, User> = {
  admin: { id: 1, username: "admin", full_name: "Hospital Administrator", role: "admin", email: "admin@yodha.com" },
  doctor: { id: 2, username: "doctor", full_name: "Dr. Sarah Jenkins", role: "doctor", email: "doc@yodha.com" },
  nurse: { id: 3, username: "nurse", full_name: "Head Nurse Marcus", role: "nurse", email: "nurse@yodha.com" },
  bedmgr: { id: 4, username: "bedmgr", full_name: "Bed Manager Alex", role: "bed_manager", email: "bedmgr@yodha.com" },
}

const DEMO_PASSWORDS: Record<string, string> = {
  admin: "admin123",
  doctor: "doctor123",
  nurse: "nurse123",
  bedmgr: "bedmgr123",
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (username: string, password: string) => {
        try {
          const formData = new URLSearchParams()
          formData.append("username", username)
          formData.append("password", password)
          const resp = await apiClient.post("/auth/login", formData, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          })
          const token = resp.data.access_token
          const user = DEMO_USERS[username] || { id: 0, username, full_name: username, role: "admin", email: "" }
          set({ user, token, isAuthenticated: true })
        } catch {
          if (DEMO_PASSWORDS[username] === password) {
            const user = DEMO_USERS[username]
            set({ user, token: `demo-${username}`, isAuthenticated: true })
          } else {
            throw new Error("Invalid username or password")
          }
        }
      },
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: "yodha-auth" }
  )
)
