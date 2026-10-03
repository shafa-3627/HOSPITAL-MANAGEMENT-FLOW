import { create } from "zustand"

interface DemoState {
  isDemoMode: boolean
  isJudgeDemoOpen: boolean
  openJudgeDemo: () => void
  closeJudgeDemo: () => void
  toggleJudgeDemo: () => void
}

export const useDemoStore = create<DemoState>((set) => ({
  isDemoMode: true,
  isJudgeDemoOpen: false,
  openJudgeDemo: () => set({ isJudgeDemoOpen: true }),
  closeJudgeDemo: () => set({ isJudgeDemoOpen: false }),
  toggleJudgeDemo: () => set((state) => ({ isJudgeDemoOpen: !state.isJudgeDemoOpen })),
}))
