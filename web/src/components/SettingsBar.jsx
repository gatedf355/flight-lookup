import { UI } from "../config/ui.js";

export default function SettingsBar({ timeMode, setTimeMode, units, setUnits, onCopy, onPrint }){
  return (
    <div className="flex items-center gap-3">
      <select value={timeMode} onChange={e=>setTimeMode(e.target.value)} className="btn btn-ghost">
        <option value="both">UTC + local</option><option value="utc">UTC only</option><option value="local">Local only</option>
      </select>
      <select value={units} onChange={e=>setUnits(e.target.value)} className="btn btn-ghost">
        <option value="imperial">ft / kts</option><option value="metric">m / km/h</option>
      </select>
      <button onClick={onCopy} className="btn btn-ghost">Copy link</button>
      <button onClick={onPrint} className="btn btn-ghost">Print</button>
    </div>
  );
}
