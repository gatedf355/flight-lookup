import { useEffect, useRef, useState } from "react";
import { isValidFlightNumber } from "../lib/util.js";
import { Button, Card } from "./Atoms.jsx";

export default function SearchBar({ onSearch }){
  const [v,setV]=useState(""); 
  const [ok,setOk]=useState(false); 
  const ref=useRef(null);
  
  useEffect(()=>{ref.current?.focus();},[]);
  
  useEffect(()=>{
    const id=setTimeout(()=>setOk(isValidFlightNumber(v.toUpperCase().replace(/\s+/g,""))),100);
    return()=>clearTimeout(id);
  },[v]);
  
  const go=()=>{
    const n=v.toUpperCase().replace(/\s+/g,""); 
    if(isValidFlightNumber(n)) {
      // Convert to uppercase for display
      setV(n);
      onSearch(n);
    }
  };
  
  const handleKeyDown = (e) => {
    if(e.key === "Enter") {
      e.preventDefault();
      go();
    }
  };
  
  const handleInputChange = (e) => {
    // Only allow letters and numbers
    const filtered = e.target.value.replace(/[^A-Za-z0-9]/g, '');
    setV(filtered);
  };
  
  return (
    <Card className="px-5 py-4">
      <div className="flex items-center gap-3">
        <input
          ref={ref} 
          value={v} 
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="DL45, DAL45, AC1714…"
          className="flex-1 rounded-xl bg-[#0e1426] text-white placeholder-white/50 px-5 py-4 outline-none ring-1 ring-black/10 focus:ring-2 focus:ring-[var(--primary)] uppercase"
        />
        <Button onClick={go} disabled={!ok}>Search</Button>
      </div>
      <div className="mt-1 text-xs text-[var(--muted)]">Supports IATA or ICAO airline codes, e.g., DL/DAL, AC/ACA.</div>
    </Card>
  );
}
