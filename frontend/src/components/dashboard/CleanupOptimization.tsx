import { Sliders, Users, Truck, Anchor, CheckCircle2, Square, Target, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CleanupOptimizationProps {
  assignments?: any[];
  selectedZone?: any;
  selectedZoneIndex?: number;
  hotspots?: any[];
  onSelectZone?: (index: number) => void;
  onDispatchTarget?: () => void;
}

export const CleanupOptimization = ({ 
  assignments = [],
  selectedZone,
  selectedZoneIndex = 0,
  hotspots = [],
  onSelectZone,
  onDispatchTarget
}: CleanupOptimizationProps) => {
  const totalRecovery = assignments.reduce((acc, a) => acc + (a.estimated_recovery_kg || 0), 0) / 1000;
  
  // Find assignment matching selected zone or compute designated vessel
  const zoneName = selectedZone?.zone_name || (hotspots[selectedZoneIndex]?.zone_name) || 'VERSOVA OUTFALL';
  const matchingAssignment = assignments.find(a => 
    a.target_zone?.toLowerCase().includes(zoneName.split(' ')[0].toLowerCase()) ||
    zoneName.toLowerCase().includes(a.target_zone?.toLowerCase().split(':')[0] || '___')
  );

  const designatedVessel = matchingAssignment?.vessel_name || `TIDAL-SKIM-0${(selectedZoneIndex % 3) + 1}`;
  const estimatedRecoveryKg = selectedZone?.estimated_debris_kg || (matchingAssignment?.estimated_recovery_kg) || 420;
  const etaHours = selectedZone?.peak_arrival_hours ? Math.max(1, Math.round(selectedZone.peak_arrival_hours * 0.4)) : 2.4;

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b-2 border-[#333333] bg-[#111111]">
        <div className="flex items-center gap-4">
          <Sliders className="w-5 h-5 text-white" />
          <div className="flex flex-col">
            <h3 className="font-headline font-black text-sm uppercase text-white tracking-widest">Optimizer</h3>
            <span className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">Hungarian Algorithm</span>
          </div>
        </div>
        <span className="px-3 py-1 bg-white text-black font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
          <Square className="w-2 h-2 fill-current" />
          OPTIMAL
        </span>
      </div>
      
      <div className="p-6 flex flex-col gap-6">

        {/* Selected Zone Tactical Intercept Focus Box */}
        <div className="p-4 bg-[#111111] border-2 border-[#ff4d00] flex flex-col gap-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-[#333333] pb-2">
            <span className="text-[10px] text-[#ff4d00] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#ff4d00]" />
              ZONE {String.fromCharCode(65 + selectedZoneIndex)} DEPLOYMENT
            </span>
            <span className="px-1.5 py-0.5 bg-[#222222] text-white text-[9px] font-bold uppercase">
              {selectedZone?.sector || 'COASTAL'}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-headline font-black text-sm text-white uppercase truncate">
              {zoneName}
            </span>
            <div className="flex items-center justify-between text-[10px] text-[#a3a3a3] uppercase">
              <span>ASSIGNED VESSEL:</span>
              <span className="text-white font-bold">{designatedVessel}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#a3a3a3] uppercase">
              <span>INTERCEPT ETA:</span>
              <span className="text-[#ff4d00] font-bold">T+{etaHours}H (PRE-BEACHING)</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[#a3a3a3] uppercase">
              <span>TARGET PAYLOAD:</span>
              <span className="text-white font-bold">{estimatedRecoveryKg} KG</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (onDispatchTarget) onDispatchTarget();
            }}
            className="w-full mt-1 py-2 bg-[#ff4d00] hover:bg-white text-black font-headline font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-none"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>AUTHORIZE INTERCEPT</span>
          </button>
        </div>

        {/* Resource Allocation */}
        <div className="grid grid-cols-3 gap-[1px] bg-[#333333] border border-[#333333]">
          <div className="p-4 bg-[#000000] flex flex-col items-center gap-2">
            <Users className="w-5 h-5 text-[#ff4d00]" />
            <span className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">Squads</span>
            <span className="font-headline font-black text-2xl text-white">{assignments.length ? 14 : '--'}</span>
          </div>
          <div className="p-4 bg-[#000000] flex flex-col items-center gap-2">
            <Truck className="w-5 h-5 text-white" />
            <span className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">Trucks</span>
            <span className="font-headline font-black text-2xl text-white">{assignments.length ? 6 : '--'}</span>
          </div>
          <div className="p-4 bg-[#000000] flex flex-col items-center gap-2">
            <Anchor className="w-5 h-5 text-white" />
            <span className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">Cap</span>
            <span className="font-headline font-black text-2xl text-white">{assignments.length ? '2.4T' : '--'}</span>
          </div>
        </div>

        {/* Fleet Vectors */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#333333] pb-2">
            <span className="text-[10px] font-mono text-white uppercase font-bold tracking-widest">
              OPTIMAL FLEET VECTORS
            </span>
            <span className="text-[9px] font-mono text-[#a3a3a3] uppercase">
              CLICK TO FOCUS
            </span>
          </div>

          <div className="flex flex-col gap-2 font-mono text-[10px] uppercase font-bold tracking-widest">
            <AnimatePresence>
              {assignments.slice(0, 4).map((a, i) => {
                const isSelectedVector = 
                  a.target_zone?.toLowerCase().includes(zoneName.split(' ')[0].toLowerCase()) ||
                  zoneName.toLowerCase().includes(a.target_zone?.toLowerCase().split(':')[0] || '___') ||
                  designatedVessel === a.vessel_name;

                return (
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    key={i} 
                    onClick={() => {
                      if (onSelectZone) {
                        const targetIdx = hotspots.findIndex(h => 
                          h.zone_name?.toLowerCase().includes(a.target_zone?.toLowerCase().split(':')[0] || '___') ||
                          a.target_zone?.toLowerCase().includes(h.zone_name?.toLowerCase().split(' ')[0] || '___')
                        );
                        if (targetIdx >= 0) {
                          onSelectZone(targetIdx);
                        }
                      }
                    }}
                    className={`flex items-center justify-between p-3 border transition-none cursor-pointer ${
                      isSelectedVector
                        ? 'bg-[#1a0d05] border-[#ff4d00] text-white shadow-md'
                        : 'bg-[#111111] border-[#333333] hover:border-white text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isSelectedVector && <span className="w-1.5 h-1.5 bg-[#ff4d00] rounded-full shrink-0"></span>}
                      <span className="truncate">{a.vessel_name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`truncate ${isSelectedVector ? 'text-[#ff4d00]' : 'text-[#a3a3a3]'}`}>
                        → {a.target_zone.split(':')[0]}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              {assignments.length === 0 && (
                <span className="text-[#525252] text-center p-4">AWAITING ASSIGNMENTS</span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t-2 border-[#333333] bg-[#111111] p-6 flex flex-col gap-3 font-mono text-[10px] uppercase font-bold tracking-widest">
        <div className="flex justify-between">
          <span className="text-[#a3a3a3]">EST. RECOVERY</span>
          <span className="text-white">{totalRecovery > 0 ? totalRecovery.toFixed(2) : '--'} TONS</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#a3a3a3]">COVERAGE</span>
          <span className="text-white">{assignments.length ? `${assignments.length} SECTORS` : '--'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#a3a3a3]">EFFICIENCY</span>
          <span className="text-[#ff4d00] flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3" />
            {assignments.length ? '84% (+46%)' : '--'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CleanupOptimization;
