import { useEffect, useState } from "react";
import Shell from "./components/Shell.jsx";
import SearchBar from "./components/SearchBar.jsx";
import SummaryPro from "./components/SummaryPro.jsx";
import DetailsPro from "./components/DetailsPro.jsx";
import SettingsBar from "./components/SettingsBar.jsx";
import FlightLookupDemo from "./components/FlightLookupDemo.jsx";
import { Skeleton, Empty, ErrorView } from "./components/States.jsx";
import { UI } from "./config/ui.js";
import { api } from "./lib/api.js";
import { normalize } from "./lib/normalize.js";

const msFor = (status)=>{
  const s=String(status||"").toLowerCase();
  if(s.startsWith("land")) return UI.poll.landedMs;
  if(s.includes("act")||s.includes("flight")) return UI.poll.activeMs;
  return UI.poll.scheduledMs;
};

export default function App(){
  const [flight,setFlight]=useState(null);
  const [raw,setRaw]=useState(null);
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState(null);
  const [timeMode,setTimeMode]=useState(UI.defaults?.timeMode||"both");
  const [units,setUnits]=useState(UI.defaults?.units||"imperial");
  const [landedAt,setLandedAt]=useState(null);
  const [query,setQuery]=useState(null);
  const [showNewDemo, setShowNewDemo] = useState(false);

  const fetchFlight=async(number)=>{
    setErr(null); setLoading(true); setQuery(number);
    try{
      const {data}=await api.get("/api/flight",{params:{number}});
      const n=normalize(data?.normalized||data);
      setFlight(n); setRaw(data); setLandedAt(n?.times_utc?.actual_arr||null);
    }catch(e){ setErr(e.response?.data?.error||e.message); }
    finally{ setLoading(false); }
  };

  // Load ?number=
  useEffect(()=>{ const n=new URL(location.href).searchParams.get("number"); if(n) fetchFlight(n); },[]);
  // Auto-refresh
  useEffect(()=>{
    if(!flight?.number) return;
    if(String(flight.status||"").toLowerCase().startsWith("land") && landedAt){
      const stopAt=new Date(new Date(landedAt).getTime()+UI.poll.keepAfterLandedMin*60000);
      if(Date.now()>=stopAt.getTime()) return;
    }
    const id=setInterval(()=>fetchFlight(flight.number), msFor(flight.status));
    return ()=>clearInterval(id);
  },[flight?.number, flight?.status, landedAt]);

  const copyLink=async()=>{
    if(!query) return;
    const url=new URL(location.href); url.searchParams.set("number",query);
    await navigator.clipboard.writeText(url.toString());
  };

  // Toggle between old and new demo
  if (showNewDemo) {
    return <FlightLookupDemo onBack={() => setShowNewDemo(false)} />;
  }

  return (
    <Shell
      right={<SettingsBar timeMode={timeMode} setTimeMode={setTimeMode} units={units} setUnits={setUnits} onCopy={copyLink} onPrint={()=>window.print()}/>}
    >
      <div className="mb-4">
        <button
          onClick={() => setShowNewDemo(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Try New Flightradar24 API Demo
        </button>
      </div>
      
      <SearchBar onSearch={fetchFlight}/>
      <div className="mt-6 space-y-6">
        {loading && <Skeleton/>}
        {err && <ErrorView msg={String(err)}/>}
        {!loading && !err && flight && (
          <>
            <SummaryPro f={flight}/>
            <DetailsPro f={flight} units={units} timeMode={timeMode} raw={raw}/>
            <div className="text-[10px] text-[var(--muted)]">Data from Flightradar24</div>
          </>
        )}
        {!loading && !err && !flight && <Empty/>}
      </div>
    </Shell>
  );
}
