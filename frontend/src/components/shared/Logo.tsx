import React from "react"
import { cn } from "@/utils/cn"

interface LogoProps {
  className?: string
  iconSize?: number | string
  showText?: boolean
  subtitle?: string
  variant?: "default" | "light" | "white"
  size?: "sm" | "md" | "lg" | "xl"
}

export function LogoIcon({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 drop-shadow-sm", className)}
    >
      <defs>
        {/* Background Gradient */}
        <linearGradient id="yodhaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#357df9" />
          <stop offset="100%" stopColor="#33bd4a" />
        </linearGradient>

        {/* Glow / Accent Gradient */}
        <linearGradient id="pulseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
        </linearGradient>

        {/* Shadow Filter */}
        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#1D3557" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Rounded Squircle Container */}
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="12"
        fill="url(#yodhaGrad)"
        filter="url(#softShadow)"
      />

      {/* Subtle Inner Glow Border */}
      <rect
        x="3"
        y="3"
        width="42"
        height="42"
        rx="11"
        stroke="#ffffff"
        strokeWidth="1"
        strokeOpacity="0.3"
        fill="none"
      />

      {/* Stylized Medical Cross Base */}
      {/* Vertical Bar */}
      <rect x="21" y="9" width="6" height="30" rx="3" fill="#ffffff" fillOpacity="0.95" />
      {/* Horizontal Bar */}
      <rect x="9" y="21" width="30" height="6" rx="3" fill="#ffffff" fillOpacity="0.95" />

      {/* Predictive ECG Pulse Wave Overlay across the cross */}
      <path
        d="M10 24H16L18.5 16L23.5 32L26.5 21L29 25.5L31 24H38"
        stroke="#1D3557"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* AI Intelligence Nodes (Glowing Points) */}
      <circle cx="18.5" cy="16" r="2" fill="#357df9" stroke="#ffffff" strokeWidth="1" />
      <circle cx="23.5" cy="32" r="2" fill="#33bd4a" stroke="#ffffff" strokeWidth="1" />
      <circle cx="26.5" cy="21" r="1.5" fill="#ffffff" />
    </svg>
  )
}

export function Logo({
  className,
  showText = true,
  subtitle = "HOSPITAL FLOW OS",
  variant = "default",
  size = "md"
}: LogoProps) {
  const iconSizes = {
    sm: 28,
    md: 36,
    lg: 44,
    xl: 54
  }

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl"
  }

  const badgeSizes = {
    sm: "text-[9px] px-1.5 py-0.2",
    md: "text-[11px] px-2 py-0.5",
    lg: "text-xs px-2.5 py-0.5",
    xl: "text-sm px-3 py-1"
  }

  const titleColor = variant === "white" ? "text-white" : "text-[#1D3557]"
  const subtitleColor = variant === "white" ? "text-white/80" : "text-[#727586]"

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      <LogoIcon size={iconSizes[size]} />

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2 leading-none">
            <span className={cn("font-black tracking-tight", titleColor, textSizes[size])}>
              YODHA
            </span>
            <span
              className={cn(
                "bg-[#357df9] text-white font-extrabold rounded-full tracking-wide shadow-xs",
                badgeSizes[size]
              )}
            >
              2.0
            </span>
          </div>

          {subtitle && (
            <span
              className={cn(
                "text-[10px] font-bold tracking-wider mt-1 uppercase",
                subtitleColor
              )}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
