import { useEffect, useState } from "react";
export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const init = mq.matches; setIsDark(init); document.documentElement.classList.toggle("dark", init);
  }, []);
  const toggle = () => { const next = !isDark; setIsDark(next); document.documentElement.classList.toggle("dark", next); };
  return <button onClick={toggle} className="rounded-xl px-3 py-2 text-sm bg-[#0b1324] text-white/90 dark:bg-white/10"> {isDark ? "Dark" : "Light"} </button>;
}
