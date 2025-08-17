import { useEffect } from "react";

function isScrollable(el: Element): boolean {
  const style = window.getComputedStyle(el as HTMLElement);
  const oy = style.overflowY;
  const node = el as HTMLElement;
  return /(auto|scroll)/.test(oy) && node.scrollHeight > node.clientHeight;
}

function hasInnerScrollable(target: Element | null, root: Element): boolean {
  let el: Element | null = target;
  while (el && el !== root) {
    if (isScrollable(el)) return true;
    el = el.parentElement;
  }
  return false;
}

/**
 * Slows wheel/trackpad scroll on a container by scaling deltaY.
 * - No effect on pinch-zoom (ctrlKey true)
 * - Skips if a nested scrollable should handle the event
 * - Respects prefers-reduced-motion
 */
export function useGentleWheel(container: React.RefObject<HTMLElement>, options?: { factor?: number }) {
  useEffect(() => {
    const root = container.current;
    if (!root) return;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) return; // honor accessibility

    // Only apply if content is actually scrollable
    const isVertScrollable = () => root.scrollHeight > root.clientHeight;

    let raf = 0;
    let pending = 0;
    const factor = typeof options?.factor === "number" ? options!.factor : 0.45; // 45% of native

    const step = () => {
      if (pending !== 0) {
        root.scrollTop += pending;
        pending = 0;
      }
      raf = 0;
    };

    const onWheel = (e: WheelEvent) => {
      if (!isVertScrollable()) return;
      if (e.ctrlKey) return; // pinch-zoom – don't interfere

      // If an inner scrollable wants it, let it handle
      if (hasInnerScrollable(e.target as Element, root)) return;

      // Scale & animate our own scroll
      e.preventDefault(); // need passive:false
      pending += e.deltaY * factor;
      if (!raf) raf = requestAnimationFrame(step);
    };

    root.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      root.removeEventListener("wheel", onWheel as any);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [container, options?.factor]);
}
