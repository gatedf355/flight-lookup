import { Card } from "./Atoms.jsx";
export function Skeleton(){ return (<div className="space-y-5 animate-pulse">
  <div className="h-40 card" />
  <div className="h-64 card" />
</div>); }
export function Empty(){ return <Card className="p-6 text-sm text-[var(--muted)]">Search a flight number to begin.</Card>; }
export function ErrorView({msg}){ return <Card className="p-4 border-red-500/40 bg-red-500/10 text-sm">{msg}</Card>; }
