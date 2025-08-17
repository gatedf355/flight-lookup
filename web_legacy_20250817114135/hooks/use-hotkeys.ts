"use client"

import { useEffect } from "react"

interface HotkeyConfig {
  key: string
  callback: () => void
  preventDefault?: boolean
}

export function useHotkeys(hotkeys: HotkeyConfig[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      hotkeys.forEach(({ key, callback, preventDefault = true }) => {
        if (event.key === key) {
          if (preventDefault) {
            event.preventDefault()
          }
          callback()
        }
      })
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [hotkeys])
}
