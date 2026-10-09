import { useLocation, Link } from 'react-router-dom';
import { 
  Crosshair, 
  Compass, 
  Wind, 
  Anchor, 
  ClipboardCheck, 
  Recycle, 
  Cpu, 
  ChevronRight
} from 'lucide-react';
import { useSim, OUTFALL_LOCATIONS } from '../../store';

interface TacticalMissionRibbonProps {
  isCollapsed?: boolean;
}

const LIFECYCLE_STEPS = [
  { path: '/overview', label: '01 DETECT', icon: Compass, title: 'Spatial Telemetry & Hotspot Detection' },
  { path: '/simulate', label: '02 FORECAST', icon: Wind, title: '72H RK4 Monte Carlo Drift & Boom Intercept' },
  { path: '/hotspots', label: '03 DISPATCH', icon: Anchor, title: 'Hungarian Fleet Optimization & Routing' },
  { path: '/field-ops', label: '04 EXECUTE', icon: ClipboardCheck, title: 'Field Unit Sweeps & Before/After Audit' },
  { path: '/circular-recovery', label: '05 RECOVER', icon: Recycle, title: 'YOLO11 Valuation & Cryptographic Manifests' },
  { path: '/model-lab', label: '06 CALIBRATE', icon: Cpu, title: 'Continuous Active Learning & Model Retraining' },
];

export const TacticalMissionRibbon = ({ isCollapsed = false }: TacticalMissionRibbonProps) => {
  const location = useLocation();
  const activeMission = useSim(state => state.activeMission);
  const setActiveMissionZone = useSim(state => state.setActiveMissionZone);

  const currentStepIndex = LIFECYCLE_STEPS.findIndex(s => s.path === location.pathname);

  return (
    <div className={`fixed top-16 ${isCollapsed ? 'lg:left-20' : 'lg:left-72'} left-0 right-0 h-12 bg-[#090909] z-30 flex items-center justify-between px-4 sm:px-6 border-b border-[#262626] font-mono text-[11px] select-none transition-all duration-300`}>
      
      {/* Left: Active Mission Target Selector */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 px-2.5 py-1 bg-black border border-[#333333] text-white">
          <Crosshair className="w-3.5 h-3.5 text-[#ff4d00] animate-pulse" />
          <span className="text-[#737373] text-[9px] uppercase hidden sm:inline">ACTIVE TARGET:</span>
          
          <select 
            value={activeMission.zoneId}
            onChange={(e) => setActiveMissionZone(e.target.value)}
            className="bg-transparent text-white font-bold uppercase text-[10px] focus:outline-none cursor-pointer appearance-none pr-3"
            title="Switch primary tactical operational focus"
          >
            {OUTFALL_LOCATIONS.map(loc => (
              <option key={loc.id} value={loc.id} className="bg-black text-white">
                {loc.name.split(' ')[0].toUpperCase()} ({loc.sector})
              </option>
            ))}
          </select>
        </div>

        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase hidden md:inline-flex items-center gap-1.5 border ${
          activeMission.riskScore >= 80 
            ? 'bg-[#ff4d00]/15 text-[#ff4d00] border-[#ff4d00]/50' 
            : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/50'
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
          {activeMission.riskScore}% RISK
        </span>
      </div>

      {/* Middle/Right: Tactical Incident Lifecycle Stages */}
      <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
        {LIFECYCLE_STEPS.map((step, idx) => {
          const isActive = location.pathname === step.path;
          const isPassed = currentStepIndex > idx;
          const StepIcon = step.icon;

          return (
            <Link
              key={step.path}
              to={step.path}
              title={step.title}
              className={`flex items-center gap-1.5 px-2.5 py-1 border transition-none shrink-0 ${
                isActive
                  ? 'bg-white text-black border-white font-bold'
                  : isPassed
                  ? 'bg-[#141414] text-[#d4d4d4] border-[#262626] hover:border-[#525252]'
                  : 'bg-black text-[#737373] border-[#1f1f1f] hover:text-white hover:border-[#333333]'
              }`}
            >
              <StepIcon className={`w-3 h-3 ${isActive ? 'text-black' : isPassed ? 'text-white' : 'text-[#737373]'}`} />
              <span className="text-[9px] tracking-wider uppercase font-bold">{step.label}</span>
              {idx < LIFECYCLE_STEPS.length - 1 && (
                <ChevronRight className="w-2.5 h-2.5 text-[#404040] ml-0.5 hidden xl:inline" />
              )}
            </Link>
          );
        })}
      </div>

    </div>
  );
};

export default TacticalMissionRibbon;
