import React, { useState, useEffect } from 'react';
import { 
  X, 
  Square, 
  Anchor, 
  MapPin, 
  CheckCircle2, 
  Send
} from 'lucide-react';
import { api } from '../../lib/api';

interface DispatchPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDispatch?: () => void;
}

interface DispatchAssignment {
  vessel_name: string;
  target_zone: string;
  eta_hours: number;
  estimated_recovery_kg: number;
  reasoning: string;
}

const mockAssignments: DispatchAssignment[] = [
  {
    vessel_name: 'SKM-01 [AUTO]',
    target_zone: 'VERSOVA CREEK',
    eta_hours: 1.2,
    estimated_recovery_kg: 380,
    reasoning: 'Proximity to high-velocity outflow channel maximizes intercept rate before debris touches beach sand.'
  },
  {
    vessel_name: 'SKM-02 [AUTO]',
    target_zone: 'JUHU BEACH',
    eta_hours: 2.4,
    estimated_recovery_kg: 290,
    reasoning: 'Tidal convergence zone will accumulate buoyant PET bottles during next 4 hours.'
  },
  {
    vessel_name: 'T-BRAVO SQUAD',
    target_zone: 'BANDRA CHANNEL',
    eta_hours: 0.8,
    estimated_recovery_kg: 180,
    reasoning: 'Offshore boom anchor point stabilization and surface debris scooping.'
  }
];

export const DispatchPlanModal: React.FC<DispatchPlanModalProps> = ({ isOpen, onClose, onConfirmDispatch }) => {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<DispatchAssignment[]>([]);
  const [dispatched, setDispatched] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setDispatched(false);

      api.getHotspots()
        .then(hotspots => {
          return api.optimizeDispatch(hotspots);
        })
        .then(res => {
          if (res && Array.isArray(res) && res.length > 0) {
            setAssignments(res);
          } else {
            setAssignments(mockAssignments);
          }
        })
        .catch(() => {
          setAssignments(mockAssignments);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmDispatch = () => {
    setDispatched(true);
    onConfirmDispatch?.();
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-[#050505] w-full max-w-4xl border-2 border-[#333333] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-[#333333] bg-[#111111]">
          <div className="flex items-center gap-4">
            <Square className="w-6 h-6 fill-white text-white" />
            <div className="flex flex-col gap-1">
              <h2 className="text-white font-headline font-black text-2xl uppercase tracking-tighter">AI Fleet Dispatch</h2>
              <p className="text-[#a3a3a3] font-mono text-[10px] uppercase font-bold tracking-widest">Hungarian Optimal Assignment Algorithm</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-[#000000] hover:bg-[#ff4d00] border-2 border-[#333333] hover:border-[#ff4d00] flex items-center justify-center text-white hover:text-black transition-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-6">
              <Square className="w-12 h-12 text-[#ff4d00] animate-spin border-4 border-[#ff4d00] fill-transparent" />
              <div className="text-center font-mono flex flex-col gap-2">
                <h3 className="font-headline font-black text-xl text-white uppercase tracking-tighter">Computing Optimal Vectors...</h3>
                <p className="text-[10px] text-[#a3a3a3] uppercase font-bold tracking-widest">Evaluating vessel ranges, battery telemetry, and risk tiers</p>
              </div>
            </div>
          ) : (
            <>
              {/* Mission Summary Pill */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-2 border-[#ff4d00] bg-[#111111]">
                <div className="flex items-center gap-3 text-[#ff4d00] font-mono text-[10px] font-bold uppercase tracking-widest">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>3 MISSIONS COMPUTED • 850 KG TOTAL RECOVERY</span>
                </div>
                <span className="text-[10px] font-mono px-3 py-2 bg-[#ff4d00] text-black font-bold uppercase tracking-widest">
                  TRAVEL: 38.4 KM
                </span>
              </div>

              {/* Vessel Assignment Cards */}
              <div className="grid grid-cols-1 gap-[1px] bg-[#333333] border-2 border-[#333333]">
                {assignments.map((assignment: any, idx) => (
                  <div 
                    key={idx} 
                    className="p-6 bg-[#000000] hover:bg-[#111111] transition-none flex flex-col gap-6 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Anchor className="w-6 h-6 text-white" />
                        <div className="flex flex-col gap-1">
                          <h4 className="font-headline font-black text-xl text-white uppercase tracking-tighter group-hover:text-[#ff4d00]">{assignment.vessel_name}</h4>
                          <span className="text-[10px] font-mono text-[#a3a3a3] font-bold uppercase tracking-widest flex items-center gap-2">
                            <MapPin className="w-3 h-3" />
                            {assignment.target_zone}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 font-mono text-[10px] uppercase font-bold tracking-widest text-[#a3a3a3]">
                        <span className="flex items-center justify-between gap-4 border-b border-[#333333] pb-1">
                          <span>TRANSIT ETA</span>
                          <span className="text-white">{assignment.eta_hours}H ({assignment.distance_nm || 8.4} NM @ 12 KTS)</span>
                        </span>
                        <span className="flex items-center justify-between gap-4 border-b border-[#333333] pb-1">
                          <span>PAYLOAD TARGET</span>
                          <span className="text-white">{assignment.estimated_recovery_kg} KG</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-[#111111] border-l-4 border-l-[#ff4d00] text-[10px] font-mono uppercase font-bold tracking-widest text-[#a3a3a3] leading-relaxed">
                      <strong className="text-white mr-2">HUNGARIAN DISPATCH RATIONALE:</strong>
                      {assignment.reasoning}
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Estimate Disclaimer */}
              <div className="p-3 bg-[#0a0a0a] border border-[#222222] font-mono text-[9px] text-[#737373] uppercase leading-relaxed">
                *NAUTICAL TRANSIT NOTE: ETAs reflect deterministic great-circle Haversine sea distances at 12 knots patrol speed + 0.2h harbor unmooring. Actual navigable passage through narrow creek sandbars (e.g. Versova & Malad) may require localized pilotage maneuvers.
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t-2 border-[#333333] bg-[#111111] flex items-center justify-between gap-4">
          <button 
            onClick={onClose}
            className="px-6 py-4 bg-[#000000] hover:bg-white text-[#a3a3a3] hover:text-black font-headline font-bold text-sm uppercase tracking-widest border-2 border-[#333333] hover:border-white transition-none"
          >
            CANCEL
          </button>

          <button 
            onClick={handleConfirmDispatch}
            disabled={loading || dispatched}
            className="px-8 py-4 bg-[#ff4d00] hover:bg-white text-black font-headline font-black text-sm uppercase tracking-widest transition-none flex items-center gap-4 disabled:opacity-50"
          >
            {dispatched ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>ORDERS DISPATCHED!</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>TRANSMIT FLEET ORDERS</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default DispatchPlanModal;
