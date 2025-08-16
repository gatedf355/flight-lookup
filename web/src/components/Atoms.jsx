export function Badge({ tone="info", children }){
  const m = {
    info: "bg-[var(--primary)] text-black",
    ok: "bg-[var(--ok)] text-black",
    warn: "bg-[var(--warn)] text-black",
    bad: "bg-[var(--bad)] text-black",
  }[tone] || "bg-[var(--primary)] text-black";
  return <span className={`pill ${m}`}>{children}</span>;
}

export function Button({ kind="primary", className="", ...p }){
  const base = "btn " + (kind==="primary" ? "btn-primary" : "btn-ghost");
  return <button className={`${base} ${className}`} {...p} />;
}

export function Card({ className="", ...p }){
  return <div className={`card ${className}`} {...p} />;
}
