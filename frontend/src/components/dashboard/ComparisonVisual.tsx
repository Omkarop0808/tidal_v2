import { XCircle, Square, Zap } from 'lucide-react';

interface ComparisonVisualProps {
  activeScenarioId?: number | null;
  selectedZone?: any;
}

export const ComparisonVisual = ({ activeScenarioId = 1, selectedZone }: ComparisonVisualProps) => {
  const zoneName = selectedZone?.zone_name || 'COASTAL HOTSPOT';

  // Compute adaptive metrics based on the active scenario
  const getScenarioMetrics = () => {
    switch (activeScenarioId) {
      case 1: // Deploy to Active Zone
        return {
          recovery: 86,
          recoveryDelta: '+48%',
          clearance: '14H',
          clearanceDelta: '-58H',
          efficiency: 'OPTIMAL',
          desc: `Pre-emptive autonomous skimmer interception deployed to ${zoneName} captures buoyant polymers before peak tidal accumulation, preventing coastal disintegration.`
        };
      case 2: // Offshore Boom
        return {
          recovery: 89,
          recoveryDelta: '+51%',
          clearance: '10H',
          clearanceDelta: '-62H',
          efficiency: 'MAX',
          desc: `Seaward containment boom blocks 45% of incoming Arabian Sea debris influx, consolidating floating plastics for rapid automated vessel retrieval.`
        };
      case 3: // Surge Squads
        return {
          recovery: 93,
          recoveryDelta: '+55%',
          clearance: '6H',
          clearanceDelta: '-66H',
          efficiency: 'PEAK',
          desc: `18 coordinated field squads execute synchronized containment sweeps across rocky breakwaters and sandy shores, reducing shoreline dwelling time to under 6 hours.`
        };
      case 4: // Storm Delay (Monsoon penalty)
        return {
          recovery: 52,
          recoveryDelta: '+14%',
          clearance: '34H',
          clearanceDelta: '-38H',
          efficiency: 'DEGRADED',
          desc: `Monsoon storm surge and turbulent swells disperse debris clusters across seawalls, triggering heavy retrieval penalties and extended operational clearance windows.`
        };
      default:
        return {
          recovery: 78,
          recoveryDelta: '+40%',
          clearance: '18H',
          clearanceDelta: '-54H',
          efficiency: 'HIGH',
          desc: `Predictive hydrodynamics dispatch autonomous interceptors 12 to 24 hours ahead of beached landfall.`
        };
    }
  };

  const metrics = getScenarioMetrics();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-[#333333] border-2 border-[#333333]">
      
      {/* Conventional Reactionary Cleanups (Without TIDAL) */}
      <div className="bg-[#050505] p-8 flex flex-col justify-between gap-8 relative group">
        <div className="absolute top-0 right-0 px-4 py-2 bg-[#111111] text-[#a3a3a3] border-b-2 border-l-2 border-[#333333] font-mono text-[10px] font-bold uppercase tracking-widest">
          CONVENTIONAL CLEANUP
        </div>
        
        <div className="flex items-center gap-6 mt-4">
          <XCircle className="w-8 h-8 text-white shrink-0" />
          <div className="flex flex-col gap-1">
            <h4 className="font-headline font-black text-2xl text-white uppercase tracking-tighter">WITHOUT TIDAL</h4>
            <p className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">Reactionary Manual Sweeps</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-[1px] bg-[#333333] border border-[#333333]">
          <div className="p-4 bg-[#000000] flex flex-col gap-1.5">
            <span className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">Recovery</span>
            <span className="font-headline font-black text-3xl text-white">38%</span>
            <span className="text-[8px] font-mono text-[#737373] uppercase">Manual Limit</span>
          </div>
          <div className="p-4 bg-[#000000] flex flex-col gap-1.5">
            <span className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">Impact</span>
            <span className="font-headline font-black text-3xl text-white">72H+</span>
            <span className="text-[8px] font-mono text-[#737373] uppercase">Lag Time</span>
          </div>
          <div className="p-4 bg-[#000000] flex flex-col gap-1.5">
            <span className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">Efficiency</span>
            <span className="font-headline font-black text-3xl text-white">LOW</span>
            <span className="text-[8px] font-mono text-[#737373] uppercase">Dispersed</span>
          </div>
        </div>

        <p className="text-xs font-mono uppercase font-bold tracking-widest text-[#a3a3a3] leading-relaxed border-l-2 border-[#525252] pl-4">
          Debris fragments into toxic microplastics upon crashing onto rocky seawalls before crews arrive, causing severe ecological contamination and exponentially higher manual retrieval costs.
        </p>
      </div>

      {/* With TIDAL Autonomous Prediction (Adaptive Scenario Deltas) */}
      <div className="bg-[#111111] p-8 flex flex-col justify-between gap-8 relative group border-l-4 border-l-[#ff4d00]">
        <div className="absolute top-0 right-0 px-4 py-2 bg-white text-black border-b-2 border-l-2 border-white font-mono text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
          <Zap className="w-3 h-3 fill-black" />
          <span>PREDICTION-DRIVEN</span>
        </div>
        
        <div className="flex items-center gap-6 mt-4">
          <Square className="w-8 h-8 fill-[#ff4d00] text-[#ff4d00] shrink-0" />
          <div className="flex flex-col gap-1">
            <h4 className="font-headline font-black text-2xl text-white uppercase tracking-tighter">WITH TIDAL</h4>
            <p className="text-[10px] font-mono text-[#ff4d00] uppercase font-bold tracking-widest">
              Adaptive Countermeasure Active
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-[1px] bg-[#333333] border border-[#333333]">
          <div className="p-4 bg-[#050505] flex flex-col gap-1.5">
            <span className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">Recovery</span>
            <span className="font-headline font-black text-3xl text-[#ff4d00]">{metrics.recovery}%</span>
            <span className="text-[8px] font-mono text-[#00e5ff] font-bold uppercase">{metrics.recoveryDelta} Delta</span>
          </div>
          <div className="p-4 bg-[#050505] flex flex-col gap-1.5">
            <span className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">Clearance</span>
            <span className="font-headline font-black text-3xl text-white">{metrics.clearance}</span>
            <span className="text-[8px] font-mono text-[#10b981] font-bold uppercase">{metrics.clearanceDelta} Speedup</span>
          </div>
          <div className="p-4 bg-[#050505] flex flex-col gap-1.5">
            <span className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">Efficiency</span>
            <span className="font-headline font-black text-3xl text-white">{metrics.efficiency}</span>
            <span className="text-[8px] font-mono text-[#ff4d00] font-bold uppercase">Optimized</span>
          </div>
        </div>

        <p className="text-xs font-mono uppercase font-bold tracking-widest text-white leading-relaxed border-l-2 border-[#ff4d00] pl-4">
          {metrics.desc}
        </p>
      </div>

    </div>
  );
};

export default ComparisonVisual;
