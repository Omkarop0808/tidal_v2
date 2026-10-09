import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  RotateCw, 
  ArrowRight, 
  CheckCircle2,
  Trash2,
  Square
} from 'lucide-react';
import { HotspotRanking, MOCK_HOTSPOTS } from '../components/dashboard/HotspotRanking';
import { LiveMap } from '../components/dashboard/LiveMap';
import { CleanupOptimization } from '../components/dashboard/CleanupOptimization';
import ComparisonVisual from '../components/dashboard/ComparisonVisual';
import InterventionSimulator from '../components/dashboard/InterventionSimulator';
import { DispatchPlanModal } from '../components/dashboard/DispatchPlanModal';
import FieldCleanupModal from '../components/dashboard/FieldCleanupModal';
import { api } from '../lib/api';
import { useSim } from '../store';

const Hotspots = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCleanupModalOpen, setIsCleanupModalOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(0);
  const [isFleetDispatched, setIsFleetDispatched] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<number>(1);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<any[]>(MOCK_HOTSPOTS);

  const setActiveMissionZone = useSim(state => state.setActiveMissionZone);

  const fetchHotspotsData = async () => {
    try {
      const data = await api.getHotspots();
      if (data && data.length > 0) {
        setHotspots(data);
        const activeZoneId = useSim.getState().activeMission?.zoneId;
        const matchedIdx = data.findIndex((hs: any) => hs.id?.toLowerCase() === activeZoneId?.toLowerCase());
        if (matchedIdx >= 0) {
          setSelectedZoneIndex(matchedIdx);
        }
        const assigns = await api.optimizeDispatch(data);
        setAssignments(assigns || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    await fetchHotspotsData();
    setIsRecalculating(false);
  };

  useEffect(() => {
    fetchHotspotsData();
    const handleCleanup = () => {
      fetchHotspotsData();
    };
    window.addEventListener('CleanupCompletedEvent', handleCleanup);
    const interval = setInterval(fetchHotspotsData, 10000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('CleanupCompletedEvent', handleCleanup);
    };
  }, []);

  const handleSelectZone = (index: number) => {
    setSelectedZoneIndex(index);
    const hs = hotspots[index];
    if (hs && hs.id) {
      setActiveMissionZone(hs.id);
    }
  };

  const currentBeach = hotspots[selectedZoneIndex] || hotspots[0];

  return (
    <div className="flex flex-col w-full p-4 md:p-8 gap-10 bg-[#000000] text-white min-h-screen font-sans selection:bg-[#ff4d00] selection:text-white">
      
      {/* Top Header / Intro Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-2 border-[#333333]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#ff4d00] text-black text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-2">
              <Square className="w-3 h-3 fill-current" />
              TACTICAL DEPLOYMENT & FIELD OPS
            </span>
            <span className="text-[#a3a3a3] font-mono text-[10px] uppercase font-bold tracking-widest">
              // SEC_04 — GREATER MUMBAI COASTLINE
            </span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-headline font-black text-white tracking-tighter uppercase leading-[0.9]">
            HOTSPOTS & <br/> <span className="text-[#ff4d00]">FLEET OPS</span>
          </h1>
          <p className="text-xs font-mono uppercase font-bold tracking-widest text-[#a3a3a3] max-w-2xl leading-relaxed border-l-2 border-[#525252] pl-4 mt-2">
            Transform machine learning forecasts into deterministic intercept missions. Real-time telemetry guides vessel assignment, before/after evidence recording, and central state synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => setIsCleanupModalOpen(true)}
            className="px-6 py-4 bg-[#111111] hover:bg-white hover:text-black text-white font-headline font-bold text-sm uppercase tracking-widest transition-none flex items-center gap-3 border-2 border-[#333333] hover:border-white"
          >
            <Trash2 className="w-4 h-4" />
            <span>LOG FIELD SWEEP ({currentBeach.zone_name.split(' ')[0]})</span>
          </button>

          <button 
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="px-6 py-4 bg-[#111111] hover:bg-[#333333] text-white font-headline font-bold text-sm uppercase tracking-widest transition-none flex items-center gap-3 border-2 border-[#333333]"
          >
            <RotateCw className={`w-4 h-4 text-[#ff4d00] ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>{isRecalculating ? 'SYNCING...' : 'RECALCULATE'}</span>
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="relative px-6 py-4 bg-[#ff4d00] hover:bg-white text-black font-headline font-black text-sm uppercase tracking-widest transition-none flex items-center gap-3"
          >
            <span className="absolute -top-3 -right-3 px-2 py-1 bg-black text-white border-2 border-white text-[10px] font-mono font-bold uppercase tracking-widest">
              {isFleetDispatched ? 'ACTIVE' : 'AI LIVE'}
            </span>
            <Square className="w-4 h-4 fill-current" />
            <span>{isFleetDispatched ? 'RE-OPTIMIZE PLAN' : 'DEPLOY AI PLAN'}</span>
          </button>
        </div>
      </div>

      {/* Fleet Dispatched Banner (if active) */}
      {isFleetDispatched && (
        <div className="p-4 bg-white text-black border-2 border-black flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono text-[10px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
            <span>Fleet Orders Transmitted • 3 Autonomous Skimmers En Route to Coastal Hotspots</span>
          </div>
          <span className="bg-black text-white px-3 py-1">ETA: 0.8H - 2.4H</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[1px] bg-[#333333] border-2 border-[#333333]">
        {/* We need to pass Brutalist props or the components themselves need to be brutalist. We will update the components next. */}
        <div className="col-span-1 lg:col-span-4 bg-[#000000]">
          <HotspotRanking 
            hotspots={hotspots}
            selectedZoneIndex={selectedZoneIndex}
            onSelectZone={handleSelectZone}
            isFleetDispatched={isFleetDispatched}
          />
        </div>
        <div className="col-span-1 lg:col-span-5 bg-[#000000]">
          <LiveMap 
            hotspots={hotspots}
            selectedZoneIndex={selectedZoneIndex}
            onSelectZone={handleSelectZone}
            isFleetDispatched={isFleetDispatched}
          />
        </div>
        <div className="col-span-1 lg:col-span-3 bg-[#000000]">
          <CleanupOptimization 
            assignments={assignments} 
            selectedZone={currentBeach}
            selectedZoneIndex={selectedZoneIndex}
            hotspots={hotspots}
            onSelectZone={handleSelectZone}
            onDispatchTarget={() => setIsModalOpen(true)}
          />
        </div>
      </div>

      {/* Comparison Visual: Reactionary vs TIDAL Predictive (Adaptive Deltas) */}
      <ComparisonVisual 
        activeScenarioId={activeScenarioId} 
        selectedZone={currentBeach} 
      />

      {/* Intervention Simulator: Interactive Action Scenarios */}
      <InterventionSimulator 
        activeScenarioId={activeScenarioId}
        onSelectScenario={setActiveScenarioId}
        selectedZone={currentBeach}
      />

      {/* Bottom CTA connecting to Circular Recovery */}
      <div className="p-8 bg-[#111111] border-2 border-[#333333] flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="flex items-center gap-3 text-[#ff4d00] font-mono text-[10px] font-bold uppercase tracking-widest">
            <Square className="w-3 h-3 fill-current" />
            <span>Downstream Material Routing</span>
          </div>
          <h3 className="text-3xl sm:text-4xl font-headline font-black text-white uppercase tracking-tighter">
            Route Plastics to Circular Recovery?
          </h3>
          <p className="text-xs font-mono uppercase font-bold tracking-widest text-[#a3a3a3] leading-relaxed border-l-2 border-[#525252] pl-4">
            Seamlessly transfer collected ocean debris batches into verified upcycler networks, automated YOLO11 material valuation, and carbon offset ledgers.
          </p>
        </div>

        <Link 
          to="/circular-recovery" 
          className="px-8 py-5 bg-white hover:bg-[#ff4d00] text-black font-headline font-black text-lg uppercase tracking-widest transition-none flex items-center justify-center gap-4 shrink-0 w-full md:w-auto"
        >
          <span>PROCEED TO RECOVERY</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      <DispatchPlanModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onConfirmDispatch={() => setIsFleetDispatched(true)}
      />

      <FieldCleanupModal 
        isOpen={isCleanupModalOpen}
        onClose={() => setIsCleanupModalOpen(false)}
        beach={{
          id: currentBeach.zone_name.toLowerCase().split(' ')[0],
          name: currentBeach.zone_name,
          sector: currentBeach.sector,
          estimated_debris_kg: currentBeach.estimated_debris_kg
        }}
        onSuccess={() => {
          setIsFleetDispatched(true);
        }}
      />
    </div>
  );
};

export default Hotspots;
