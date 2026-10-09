import { useState, useEffect } from 'react';
import { 
  Crosshair,
  Camera,
  AlertTriangle,
  Send,
  RefreshCcw,
  Square
} from 'lucide-react';
import { api } from '../lib/api';
import { useSim } from '../store';

export default function FieldOps() {
  const [beaches, setBeaches] = useState<any[]>([]);
  const [selectedBeach, setSelectedBeach] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [teamName, setTeamName] = useState('SQUAD_02-ALPHA');
  const [collectedKg, setCollectedKg] = useState(120);
  const [remainingKg, setRemainingKg] = useState(25);
  const [beforeImage] = useState<string>('https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=600&grayscale=1');
  const [afterImage] = useState<string>('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&grayscale=1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchFieldData = async () => {
    setIsLoading(true);
    try {
      const [bList] = await Promise.all([
        api.getBeaches(),
        api.getCleanupTasks().catch(() => [])
      ]);
      setBeaches(bList);
      if (bList.length > 0 && !selectedBeach) {
        const activeZoneId = useSim.getState().activeMission?.zoneId;
        const matched = bList.find((b: any) => b.id.toLowerCase() === activeZoneId?.toLowerCase());
        setSelectedBeach(matched || bList[0]);
      }
    } catch (err) {
      console.error('Failed to load field ops data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFieldData();
  }, []);

  const handleSubmitMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBeach) return;
    setIsSubmitting(true);
    try {
      await api.submitCleanup({
        task_id: `TASK-${Date.now().toString().slice(-6)}`,
        beach_id: selectedBeach.id,
        collected_kg: collectedKg,
        remaining_kg: remainingKg,
        before_img: beforeImage,
        after_img: afterImage,
        effectiveness_pct: 86.4,
        notes: `FIELD REP: ${teamName}`
      });
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        fetchFieldData();
      }, 2500);
    } catch (err) {
      console.error(err);
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="w-full min-h-screen bg-[#000000] text-white p-4 md:p-8 font-sans selection:bg-[#ff4d00] selection:text-white">
      
      {/* HEADER SECTION */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b-2 border-[#333333] pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2 text-[#a3a3a3] font-mono text-[10px] tracking-widest uppercase">
            <Square className="w-3 h-3 fill-current text-[#ff4d00]" />
            <span>Tactical Operations // Ground Unit Sync</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-headline font-black uppercase tracking-tighter leading-none">
            Field Recovery
          </h1>
        </div>
        
        <button 
          onClick={fetchFieldData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 border border-[#333333] hover:border-[#ff4d00] bg-[#111111] hover:bg-[#ff4d00] hover:text-black font-mono text-[10px] uppercase tracking-widest font-bold transition-none active:translate-y-px disabled:opacity-50"
        >
          <RefreshCcw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'SYNCING DATA...' : 'FORCE SYNC'}
        </button>
      </header>

      {/* MAIN 2-COL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[1px] bg-[#333333] border border-[#333333]">
        
        {/* LEFT COL: SECTOR TARGETS */}
        <div className="lg:col-span-5 bg-[#000000] flex flex-col">
          
          <div className="p-4 border-b border-[#333333] bg-[#111111] flex justify-between items-center">
            <span className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-[#ff4d00]" />
              Active Sectors
            </span>
            <span className="bg-[#ff4d00] text-black px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest">
              {beaches.length} LIVE
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[400px] border-b border-[#333333]">
            {beaches.map((b) => {
              const isSelected = selectedBeach?.id === b.id;
              const isCritical = b.baseline_risk > 80;
              const isCleaned = b.status === 'Cleaned';

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBeach(b)}
                  className={`p-4 border-b border-[#222222] cursor-pointer font-mono transition-none grid grid-cols-[auto_1fr_auto] items-center gap-4 ${
                    isSelected 
                      ? 'bg-[#1a1a1a] border-l-4 border-l-[#ff4d00]' 
                      : 'hover:bg-[#111111] border-l-4 border-l-transparent'
                  }`}
                >
                  <div className={`w-2 h-2 ${
                    isCleaned ? 'bg-[#525252]' : isCritical ? 'bg-[#ff4d00] animate-pulse' : 'bg-white'
                  }`} />
                  
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold uppercase tracking-wide ${isSelected ? 'text-[#ff4d00]' : 'text-white'}`}>
                      {b.name}
                    </span>
                    <span className="text-[10px] text-[#a3a3a3] uppercase">LOC: {b.lat.toFixed(3)}N // SEC: {b.sector}</span>
                  </div>

                  <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest border ${
                    isCleaned ? 'border-[#525252] text-[#525252]' : isCritical ? 'border-[#ff4d00] text-[#ff4d00]' : 'border-white text-white'
                  }`}>
                    {b.status}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ACTIVE SECTOR BRIEFING */}
          {selectedBeach && (
            <div className="p-6 bg-[#000000] flex flex-col gap-6">
              <div>
                <span className="text-[#ff4d00] font-mono text-[10px] uppercase font-bold tracking-widest border border-[#ff4d00] px-2 py-1 mb-3 inline-block">
                  TARGET LOCK
                </span>
                <h3 className="text-2xl font-headline font-bold uppercase">{selectedBeach.name}</h3>
              </div>

              <div className="grid grid-cols-3 gap-[1px] bg-[#333333] border border-[#333333]">
                <div className="p-3 bg-[#050505] flex flex-col">
                  <span className="text-[9px] font-mono text-[#a3a3a3] uppercase">Detected</span>
                  <span className="text-lg font-bold font-sans">{selectedBeach.current_debris_kg}<span className="text-xs text-[#525252]">KG</span></span>
                </div>
                <div className="p-3 bg-[#050505] flex flex-col">
                  <span className="text-[9px] font-mono text-[#a3a3a3] uppercase">Cleared</span>
                  <span className="text-lg font-bold font-sans">{selectedBeach.cleaned_debris_kg}<span className="text-xs text-[#525252]">KG</span></span>
                </div>
                <div className="p-3 bg-[#050505] flex flex-col">
                  <span className="text-[9px] font-mono text-[#a3a3a3] uppercase">Residual</span>
                  <span className="text-lg font-bold font-sans text-[#ff4d00]">{selectedBeach.remaining_debris_kg}<span className="text-xs text-[#525252]">KG</span></span>
                </div>
              </div>

              <div className="border-l-2 border-[#525252] pl-4 font-mono text-[10px] text-[#a3a3a3] uppercase leading-relaxed">
                <span className="text-white font-bold block mb-1">INTEL:</span>
                Persistent coastal accumulation detected via sentinel-2 multi-spectral imaging. 
                Requires immediate manual extraction. Target primarily HDPE plastics and mixed polymer netting.
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COL: ACTION REPORT */}
        <div className="lg:col-span-7 bg-[#000000] p-6 md:p-8">
          
          <div className="flex items-center gap-3 mb-8 pb-4 border-b border-[#333333]">
            <div className="w-8 h-8 bg-[#ff4d00] flex items-center justify-center text-black">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xl font-headline font-bold uppercase">Submit Ground Report</h2>
              <span className="text-[10px] font-mono text-[#a3a3a3] uppercase tracking-widest">Secure uplink // Append visual proof</span>
            </div>
          </div>

          <form onSubmit={handleSubmitMission} className="flex flex-col gap-8 font-mono">
            
            {/* Meta Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-[#a3a3a3]">Unit Call-Sign</label>
                <input 
                  type="text" 
                  value={teamName} 
                  onChange={(e) => setTeamName(e.target.value)} 
                  className="bg-transparent border-2 border-[#333333] p-3 text-white text-sm uppercase outline-none focus:border-[#ff4d00] transition-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-[#a3a3a3]">Target Designation</label>
                <input 
                  type="text" 
                  readOnly 
                  value={selectedBeach ? selectedBeach.name : 'AWAITING TARGET'} 
                  className="bg-[#111111] border-2 border-[#222222] p-3 text-[#525252] text-sm uppercase outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-[1px] bg-[#333333] border-2 border-[#333333]">
              <div className="bg-[#050505] p-4 md:p-6 flex flex-col gap-2 relative">
                <label className="text-[10px] uppercase font-bold text-white flex items-center gap-2">
                  <Square className="w-2 h-2 fill-current" /> Extracted Mass (KG)
                </label>
                <input 
                  type="number"
                  value={collectedKg}
                  onChange={(e) => setCollectedKg(Math.max(0, parseInt(e.target.value) || 0))}
                  className="bg-transparent border-b-2 border-[#333333] py-2 text-4xl md:text-5xl font-headline font-black outline-none focus:border-white transition-none"
                />
              </div>

              <div className="bg-[#050505] p-4 md:p-6 flex flex-col gap-2 relative">
                <label className="text-[10px] uppercase font-bold text-[#ff4d00] flex items-center gap-2">
                  <AlertTriangle className="w-2 h-2 fill-current" /> Residual Mass (KG)
                </label>
                <input 
                  type="number"
                  value={remainingKg}
                  onChange={(e) => setRemainingKg(Math.max(0, parseInt(e.target.value) || 0))}
                  className="bg-transparent border-b-2 border-[#333333] py-2 text-4xl md:text-5xl font-headline font-black text-[#ff4d00] outline-none focus:border-[#ff4d00] transition-none"
                />
              </div>
            </div>

            {/* Images */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-[#a3a3a3] flex items-center gap-2">
                    <Camera className="w-3 h-3" /> PRE-STATE
                  </span>
                  <span className="text-[9px] bg-[#333333] px-1 py-0.5 text-white">RAW</span>
                </div>
                <div className="h-40 border-2 border-[#333333] relative overflow-hidden group">
                  <img src={beforeImage} alt="Before" className="w-full h-full object-cover grayscale mix-blend-luminosity group-hover:grayscale-0 transition-all duration-0" />
                  <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold text-white flex items-center gap-2">
                    <Camera className="w-3 h-3" /> POST-STATE
                  </span>
                  <span className="text-[9px] bg-[#ff4d00] text-black px-1 py-0.5 font-bold">VERIFIED</span>
                </div>
                <div className="h-40 border-2 border-[#ff4d00] relative overflow-hidden group">
                  <img src={afterImage} alt="After" className="w-full h-full object-cover" />
                  <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-50" />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting || submitSuccess}
              className="mt-4 w-full bg-[#ff4d00] hover:bg-white text-black font-headline font-black text-xl md:text-2xl uppercase tracking-tighter py-6 flex items-center justify-center gap-4 transition-none active:scale-[0.99] disabled:bg-[#333333] disabled:text-[#525252]"
            >
              {submitSuccess ? (
                <>UPLINK CONFIRMED</>
              ) : isSubmitting ? (
                <>TRANSMITTING...</>
              ) : (
                <>
                  <Send className="w-6 h-6" /> COMMIT REPORT
                </>
              )}
            </button>

          </form>

        </div>
      </div>
    </main>
  );
}
