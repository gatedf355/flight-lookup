import { useEffect, useState, useCallback } from 'react';

export function useCooldown(initialMs = 0, storageKey = 'searchCooldownUntil') {
  const [until, setUntil] = useState<number>(0);
  const [now, setNow] = useState(Date.now());
  
  // Initialize from localStorage after component mounts (SSR safe)
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(storageKey) || 0);
      if (Number.isFinite(saved)) {
        setUntil(saved);
      }
    } catch (error) {
      // localStorage not available (SSR)
      console.warn('localStorage not available:', error);
    }
  }, [storageKey]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const remainingMs = Math.max(0, until - now);
  const active = remainingMs > 0;

  const start = useCallback((ms: number) => {
    const t = Date.now() + ms;
    setUntil(t);
    try {
      localStorage.setItem(storageKey, String(t));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }, [storageKey]);

  const clear = useCallback(() => {
    setUntil(0);
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }, [storageKey]);

  return { active, remainingMs, start, clear };
}
