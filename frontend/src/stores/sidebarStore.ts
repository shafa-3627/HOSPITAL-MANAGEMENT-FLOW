import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SidebarState {
  collapsed: boolean
  toggle: () => void
  setCollapsed: (val: boolean) => void
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((state) => ({ collapsed: !state.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
    }),
    { name: "yodha-sidebar" }
  )
)
