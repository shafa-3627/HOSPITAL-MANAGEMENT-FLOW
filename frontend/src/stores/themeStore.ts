import { create } from "zustand"

interface ThemeState {
  theme: "light" | "dark"
  setTheme: (theme: "light" | "dark") => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem("theme") as "light" | "dark") || "light",
  setTheme: (theme) => {
    localStorage.setItem("theme", theme)
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(theme)
    set({ theme })
  },
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === "light" ? "dark" : "light"
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(newTheme)
    return { theme: newTheme }
  }),
}))
