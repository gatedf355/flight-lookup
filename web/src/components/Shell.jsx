import { useEffect, useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle.jsx";

export default function Shell({ right, children }) {
  const headerRef = useRef(null);
  const [h, setH] = useState(0);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setH(el.getBoundingClientRect().height));
    ro.observe(el);
    setH(el.getBoundingClientRect().height);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-grad-from)] to-[var(--bg-grad-to)]">
      {/* pinned banner */}
      <header ref={headerRef} className="fixed inset-x-0 top-0 z-50">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <div className="card px-6 py-4 flex items-center justify-between">
            <div>
              <div className="text-3xl font-semibold">Flight Lookup</div>
              <div className="text-sm text-[var(--muted)]">Find your flight. No map required.</div>
            </div>
            <div className="flex items-center gap-3">{right}<ThemeToggle/></div>
          </div>
        </div>
      </header>

      {/* bumper: content scrolls ONLY below banner */}
      <main
        className="fixed inset-x-0 z-0"
        style={{ top: h, bottom: 0, overflowY: "auto" }}
      >
        <div className="mx-auto max-w-6xl px-6 pb-6">
          {children}
        </div>
      </main>
    </div>
  );
}
