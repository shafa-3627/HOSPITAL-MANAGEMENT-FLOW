import * as React from "react"
import { cn } from "@/utils/cn"

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <div className="group relative inline-block">{children}</div>
}

export function TooltipTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  return <div className="inline-block">{children}</div>
}

export function TooltipContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 group-hover:block", className)}>
      {children}
    </div>
  )
}
