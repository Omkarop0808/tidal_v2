import { useNavigate } from 'react-router-dom';
import { Zap, ShieldCheck, Users, Clock, Square, ArrowRight } from 'lucide-react';
import { useSim } from '../../store';

interface InterventionSimulatorProps {
  activeScenarioId?: number | null;
  onSelectScenario?: (id: number) => void;
  selectedZone?: any;
}

export const InterventionSimulator = ({
  activeScenarioId = 1,
  onSelectScenario,
  selectedZone
}: InterventionSimulatorProps) => {
  const navigate = useNavigate();
  const setScenario = useSim(state => state.setScenario);
  const setActiveMissionZone = useSim(state => state.setActiveMissionZone);

  const zoneName = selectedZone?.zone_name || 'COASTAL HOTSPOT';
  const zoneShort = zoneName.split(' ')[0].toUpperCase();

  const scenarios = [
    {
      id: 1,
      icon: Zap,
      title: `DEPLOY TO ${zoneShort}`,
      desc: `Pre-emptive autonomous skimmer interception before peak tidal accumulation at ${zoneName}.`,
      impactLabel: 'RECOVERY DELTA',
      impactValue: '+34% CAPTURE',
      impactColor: 'text-[#ff4d00]',
      isPositive: true,
      config: { isBarrierActive: true, barrierEfficiency: 50, cleanupTeams: 14 }
    },
    {
      id: 2,
      icon: ShieldCheck,
      title: 'OFFSHORE BOOM',
      desc: `Anchor containment boom across ${zoneShort} channel entrance to block seaward debris drift.`,
      impactLabel: 'SEAWARD INFLUX',
      impactValue: '-45% INFLUX',
      impactColor: 'text-[#00e5ff]',
      isPositive: true,
      config: { isBarrierActive: true, barrierEfficiency: 75, cleanupTeams: 12 }
    },
    {
      id: 3,
      icon: Users,
      title: 'SURGE SQUADS',
      desc: `Scale active ground response teams from 12 to 18 squads for rapid rocky breakwater retrieval.`,
      impactLabel: 'CLEARANCE TIME',
      impactValue: '6.0H EXPEDITED',
      impactColor: 'text-[#10b981]',
      isPositive: true,
      config: { isBarrierActive: false, barrierEfficiency: 0, cleanupTeams: 18 }
    },
    {
      id: 4,
      icon: Clock,
      title: 'STORM DELAY',
      desc: `Model heavy monsoon storm surge and unconstrained high-swell tidal dispersion penalty.`,
      impactLabel: 'MONSOON PENALTY',
      impactValue: '-26% RECOVERY',
      impactColor: 'text-[#a3a3a3]',
      isPositive: false,
      config: { windSpeed: 45, precipitation: 60, cleanupTeams: 8 }
    }
  ];

  const handleApplyTo3DTwin = (scenario: typeof scenarios[0]) => {
    if (selectedZone?.id) {
      setActiveMissionZone(selectedZone.id);
    }
    setScenario(scenario.config);
    navigate('/simulate');
  };

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  return (
    <div className="flex flex-col gap-6 mt-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-[#333333] pb-4">
        <div className="flex items-center gap-4">
          <Square className="w-5 h-5 fill-white text-white" />
          <div className="flex flex-col gap-1">
            <h3 className="font-headline font-black text-2xl text-white uppercase tracking-tighter">Intervention Simulator</h3>
            <span className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">
              Countermeasure Impact Modeling for {zoneName}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-[#ff4d00] uppercase font-bold tracking-widest">
            [ CLICK SCENARIO TO PREDICT DELTAS ]
          </span>
        </div>
      </div>
      
      {/* 4 Interactive Scenario Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[1px] bg-[#333333] border-2 border-[#333333]">
        {scenarios.map((scenario) => {
          const isActive = activeScenarioId === scenario.id;
          const Icon = scenario.icon;

          return (
            <div 
              key={scenario.id} 
              onClick={() => onSelectScenario?.(scenario.id)}
              className={`p-6 cursor-pointer flex flex-col justify-between gap-6 transition-none ${
                isActive
                  ? 'bg-[#111111] border-l-4 border-l-[#ff4d00] ring-1 ring-[#ff4d00]'
                  : 'bg-[#000000] border-l-4 border-l-transparent hover:bg-[#0a0a0a]'
              }`}
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Icon className={`w-6 h-6 ${isActive ? 'text-[#ff4d00]' : 'text-white'}`} />
                  {isActive && (
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 bg-white text-black">
                      ACTIVE SCENARIO
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <h4 className={`font-headline font-black text-sm uppercase ${isActive ? 'text-[#ff4d00]' : 'text-white'}`}>
                    {scenario.title}
                  </h4>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#a3a3a3] font-bold border-l-2 border-[#333333] pl-2 leading-relaxed">
                    {scenario.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t-2 border-[#333333] font-mono text-[10px] uppercase font-bold tracking-widest">
                <span className="text-[#a3a3a3]">{scenario.impactLabel}</span>
                <span className={scenario.impactColor}>{scenario.impactValue}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Scenario Action Bar */}
      <div className="p-4 bg-[#111111] border-2 border-[#333333] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs uppercase font-bold tracking-widest">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 bg-[#ff4d00] animate-ping"></span>
          <span className="text-[#a3a3a3]">SELECTED INTERVENTION:</span>
          <span className="text-white">{activeScenario.title}</span>
          <span className="text-[#ff4d00]">({activeScenario.impactValue})</span>
        </div>

        <button
          onClick={() => handleApplyTo3DTwin(activeScenario)}
          className="px-5 py-2.5 bg-white hover:bg-[#ff4d00] text-black font-headline font-black text-[11px] uppercase tracking-widest transition-none flex items-center gap-2"
        >
          <span>SIMULATE SCENARIO IN 3D TWIN</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default InterventionSimulator;
