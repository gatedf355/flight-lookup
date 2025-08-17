"use client"

import { useRef, ReactNode } from "react"
import { useGentleWheel } from "@/hooks/useGentleWheel"

interface GentleWheelWrapperProps {
  children: ReactNode
  factor?: number
}

export function GentleWheelWrapper({ children, factor = 0.45 }: GentleWheelWrapperProps) {
  const mainRef = useRef<HTMLElement>(null);
  useGentleWheel(mainRef, { factor }); // smaller = slower; 0.35–0.5 is a good range

  return (
    <main ref={mainRef} className="flex-1 overflow-x-hidden">
      {children}
    </main>
  );
}
