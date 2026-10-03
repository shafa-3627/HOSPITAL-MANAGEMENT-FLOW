import * as React from "react"
import { cn } from "@/utils/cn"

export function DropdownMenu({ children }: { children: React.ReactNode }) {
  return <div className="relative inline-block text-left">{children}</div>
}

export function DropdownMenuTrigger({ asChild, children, onClick }: { asChild?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return <div onClick={onClick} className="inline-block cursor-pointer">{children}</div>
}

export function DropdownMenuContent({ className, children, open }: { className?: string; children: React.ReactNode; open?: boolean }) {
  if (!open) return null
  return (
    <div className={cn("absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80", className)}>
      {children}
    </div>
  )
}

export function DropdownMenuItem({ className, children, onClick }: { className?: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)}
    >
      {children}
    </div>
  )
}

export function DropdownMenuLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("px-2 py-1.5 text-sm font-semibold", className)}>{children}</div>
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn("-mx-1 my-1 h-px bg-muted", className)} />
}
