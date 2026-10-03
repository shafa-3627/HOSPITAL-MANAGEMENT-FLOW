import { useState, useEffect } from "react"
import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { JudgeDemoModal } from "@/components/shared/JudgeDemoModal"
import { useDemoStore } from "@/stores/demoStore"

export function Layout() {
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    return saved === "true"
  })

  const { isJudgeDemoOpen, closeJudgeDemo } = useDemoStore()

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed))
  }, [collapsed])

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#f2f3f6] text-[#1d1e20] font-sans selection:bg-[#357df9]/20">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto bg-[#f2f3f6] p-4 lg:p-6 relative">
            <div className="mx-auto w-full max-w-7xl h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <JudgeDemoModal open={isJudgeDemoOpen} onClose={closeJudgeDemo} />
    </div>
  )
}
