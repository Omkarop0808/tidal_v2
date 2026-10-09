import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Recycle, Sparkles, MapPin } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DebrisAnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activityId?: string;
}

const mockAnalysis = {
  confidence: 94,
  trashType: 'High-Density Polyethylene & Ghost Nets',
  threatLevel: 'High Environmental Risk',
  size: 'Large Aggregation (approx 25-40 kg)',
  decompositionYears: 450,
  location: 'Versova Outfall Channel (19.135° N, 72.814° E)',
  environmentalImpact: 'High risk of microplastic fragmentation and marine entanglement with local coastal biodiversity within 18 hours.',
  probableSource: 'Stormwater drainage outfall combined with tidal regurgitation.',
  disposalInstructions: 'Route to mechanical shredding and washing facility for pelletized upcycling via Lucro Plastecycle.'
};

export function DebrisAnalysisPanel({ isOpen, onClose, activityId }: DebrisAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [feedMode, setFeedMode] = useState<'optical' | 'thermal' | 'mesh'>('optical');
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      if (activityId) {
        import('../lib/api').then(({ api }) => {
          api.getTelemetryAnalysis(activityId)
            .then(res => {
              setAnalysis(res.analysis || mockAnalysis);
            })
            .catch(() => {
              setAnalysis(mockAnalysis);
            })
            .finally(() => {
              setLoading(false);
            });
        });
      } else {
        setAnalysis(mockAnalysis);
        setLoading(false);
      }
    }
  }, [isOpen, activityId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-[4000]"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-[#000000] border-l border-[#142336] z-[5000] overflow-y-auto flex flex-col"
          >
            <div className="p-6 sm:p-10 flex flex-col gap-8">
              
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-[#142336]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-glow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-mono text-[10px] tracking-widest uppercase font-semibold block">
                      OceanEye Vision Telemetry Link
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-headline font-bold tracking-tight text-on-surface">
                      Debris Classification
                    </h2>
                  </div>
                </div>

                <button 
                  onClick={onClose} 
                  className="p-2.5 bg-[#090E17] hover:bg-[#142336] transition-colors text-on-surface-variant hover:text-on-surface border border-[#142336]"
                  aria-label="Close Debris Analysis"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {loading || !analysis ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                  <div className="w-12 h-12 rounded-full border-3 border-surface-container-highest border-t-primary animate-spin"></div>
                  <span className="text-on-surface-variant font-mono text-xs tracking-widest uppercase">
                    Analyzing Drone Optical Telemetry...
                  </span>
                </div>
              ) : (
                <div className="flex flex-col gap-8">
                  
                  {/* Drone Image & Multispectral Telemetry Frame */}
                  <div className="w-full flex flex-col gap-2">
                    <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-[#a3a3a3]">
                      <span className="flex items-center gap-1.5 text-[#ff4d00] font-bold">
                        <span className="w-2 h-2 bg-[#ff4d00] rounded-full animate-pulse"></span>
                        CAM-04 // VERSOVA AERIAL RECON (60 FPS)
                      </span>
                      <div className="flex gap-1">
                        {(['optical', 'thermal', 'mesh'] as const).map(mode => (
                          <button
                            key={mode}
                            onClick={() => setFeedMode(mode)}
                            className={`px-2 py-0.5 border text-[8px] font-bold uppercase transition-none ${
                              feedMode === mode
                                ? 'bg-white text-black border-white'
                                : 'bg-[#111111] text-[#a3a3a3] border-[#333333] hover:text-white'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="w-full h-64 sm:h-72 bg-[#050b14] relative border border-[#142336] overflow-hidden select-none">
                      {/* Procedural Tactical Marine Recon Feed Canvas / Graphic */}
                      <div className={`absolute inset-0 transition-opacity duration-300 ${feedMode === 'thermal' ? 'bg-[#0f051d]' : feedMode === 'mesh' ? 'bg-[#020d08]' : 'bg-[#061826]'}`}>
                        {/* Sea Texture & Waves SVG Pattern */}
                        <svg className="w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <radialGradient id="oceanGlow" cx="50%" cy="50%" r="70%">
                              <stop offset="0%" stopColor={feedMode === 'thermal' ? '#7928ca' : feedMode === 'mesh' ? '#003b1f' : '#0e3a5a'} stopOpacity="0.8" />
                              <stop offset="100%" stopColor="#000000" stopOpacity="1" />
                            </radialGradient>
                            <filter id="thermalFilter">
                              <feColorMatrix type="matrix" values="
                                1.5 0 0 0 0.2
                                0 0.8 0 0 0.1
                                0.2 0 1.8 0 0.4
                                0 0 0 1 0" />
                            </filter>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#oceanGlow)" />
                          
                          {/* Ambient Wave Ripple Lines */}
                          <path d="M 0,40 Q 150,20 300,50 T 600,45 T 900,55" fill="none" stroke={feedMode === 'thermal' ? '#9945ff' : '#00e5ff'} strokeWidth="1" strokeOpacity="0.25" />
                          <path d="M 0,90 Q 200,110 400,85 T 800,100" fill="none" stroke={feedMode === 'thermal' ? '#ff0080' : '#00e5ff'} strokeWidth="1" strokeOpacity="0.2" />
                          <path d="M 0,160 Q 180,140 360,170 T 720,150" fill="none" stroke={feedMode === 'thermal' ? '#ff4d00' : '#14b8a6'} strokeWidth="1" strokeOpacity="0.25" />
                          <path d="M 0,220 Q 220,240 440,210 T 880,230" fill="none" stroke={feedMode === 'thermal' ? '#ff0080' : '#00e5ff'} strokeWidth="1" strokeOpacity="0.2" />

                          {/* Primary Floating Ghost Net & HDPE Polymer Mass */}
                          <g transform="translate(180, 80)">
                            {/* Ghost Net Polyfilament Web */}
                            <ellipse cx="60" cy="50" rx="80" ry="42" fill={feedMode === 'thermal' ? '#ff4d00' : feedMode === 'mesh' ? '#00ff66' : '#2dd4bf'} fillOpacity={feedMode === 'thermal' ? '0.45' : '0.15'} />
                            <path d="M 10,40 Q 50,15 100,35 Q 130,65 95,85 Q 35,90 10,40 Z" fill={feedMode === 'thermal' ? '#ff0055' : '#0f766e'} fillOpacity="0.4" />
                            <path d="M 25,30 L 90,70 M 35,65 L 85,25 M 20,45 L 105,45 M 55,20 L 65,80" stroke={feedMode === 'thermal' ? '#ffea00' : '#ffffff'} strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="3,3" />
                            {/* Entangled rigid containers / floaters */}
                            <rect x="70" y="30" width="22" height="14" rx="2" fill={feedMode === 'thermal' ? '#ffff00' : '#f97316'} opacity="0.85" />
                            <circle cx="35" cy="52" r="7" fill={feedMode === 'thermal' ? '#ff3366' : '#38bdf8'} opacity="0.9" />
                            <rect x="42" y="32" width="16" height="10" rx="1" fill={feedMode === 'thermal' ? '#ffffff' : '#e2e8f0'} opacity="0.8" />
                          </g>

                          {/* Secondary Debris Fragment Clustered Nearby */}
                          <g transform="translate(380, 140)">
                            <ellipse cx="30" cy="20" rx="35" ry="18" fill={feedMode === 'thermal' ? '#ff00aa' : '#0e7490'} fillOpacity="0.3" />
                            <rect x="15" y="12" width="18" height="12" rx="2" fill={feedMode === 'thermal' ? '#ffff55' : '#38bdf8'} opacity="0.75" />
                            <circle cx="42" cy="22" r="5" fill={feedMode === 'thermal' ? '#ff5500' : '#f59e0b'} opacity="0.85" />
                          </g>

                          {/* Scanning Grid / Crosshairs */}
                          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="8,8" />
                          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.1" strokeDasharray="8,8" />
                        </svg>

                        {/* Optional underlying optical photo if available with seamless fallback */}
                        {feedMode === 'optical' && !imageFailed && (
                          <img 
                            src="https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80" 
                            alt="Coastal Debris Surveillance" 
                            onError={() => setImageFailed(true)}
                            className="absolute inset-0 w-full h-full object-cover mix-blend-luminosity opacity-40 filter contrast-150 pointer-events-none" 
                          />
                        )}

                        {/* Thermal HUD False-Color Scanlines */}
                        {feedMode === 'thermal' && (
                          <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,0,128,0.06)_3px)]"></div>
                        )}
                        {feedMode === 'mesh' && (
                          <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,255,100,0.08)_3px)]"></div>
                        )}
                      </div>
                      
                      {/* YOLO11 Bounding Box 1: Ghost Net & Polyethylene */}
                      <div className="absolute top-[20%] left-[22%] w-[48%] h-[58%] border-2 border-[#ff4d00] bg-[#ff4d00]/15 flex flex-col justify-between p-1.5 shadow-2xl pointer-events-none">
                        <div className="flex items-center justify-between">
                          <span className="bg-[#ff4d00] text-black text-[9px] font-mono px-1.5 py-0.5 font-black uppercase tracking-wider">
                            YOLO11: {analysis.trashType.substring(0, 22)}
                          </span>
                          <span className="bg-black/90 text-white border border-[#ff4d00] text-[8px] font-mono px-1 py-0.2 font-bold">
                            94.2% CONF
                          </span>
                        </div>
                        <div className="flex justify-between items-end text-[7px] font-mono text-white/80 uppercase">
                          <span>VOL: ~32 KG</span>
                          <span>POLYMER: HDPE/PP</span>
                        </div>
                      </div>

                      {/* YOLO11 Bounding Box 2: Secondary Rigid Plastic Cluster */}
                      <div className="absolute top-[48%] left-[66%] w-[26%] h-[32%] border border-[#00e5ff] bg-[#00e5ff]/10 flex flex-col justify-between p-1 pointer-events-none">
                        <span className="bg-[#00e5ff] text-black text-[8px] font-mono px-1 py-0.2 font-black uppercase tracking-wider self-start">
                          POLYMER CLUSTER (88%)
                        </span>
                        <span className="text-[7px] font-mono text-[#00e5ff] self-end">
                          TIDAL DRIFT
                        </span>
                      </div>

                      {/* Drone Telemetry Status Badge */}
                      <div className="absolute top-3 left-3 bg-black/90 px-2.5 py-1 border border-[#333333] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#ff4d00] rounded-full animate-ping"></span>
                        <span className="text-white font-mono text-[9px] font-bold uppercase tracking-wider">
                          LAT: 19.1350° N • LON: 72.8140° E
                        </span>
                      </div>

                      {/* Optical/Thermal Resolution Tag */}
                      <div className="absolute bottom-3 right-3 bg-black/90 px-2 py-0.5 border border-[#333333] font-mono text-[8px] text-[#a3a3a3] uppercase font-bold tracking-widest">
                        {feedMode.toUpperCase()} // 850NM NIR // ALT: 35M AGL
                      </div>
                    </div>
                  </div>

                  {/* Classification header */}
                  <div className="flex flex-col gap-3">
                    <h3 className="text-2xl sm:text-3xl font-headline font-bold text-on-surface">
                      {analysis.trashType}
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                      <span className="px-3 py-1 bg-error/10 text-error font-mono text-xs font-semibold border border-error/30">
                        {analysis.threatLevel}
                      </span>
                      <span className="px-3 py-1 bg-[#090E17] text-on-surface-variant font-mono text-xs border border-[#142336]">
                        {analysis.size}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-[1px] bg-[#142336]">
                    <div className="p-5 bg-[#090E17] flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-warning font-mono text-xs">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="uppercase tracking-widest text-on-surface-variant text-[10px]">Decomposition</span>
                      </div>
                      <span className="text-2xl font-headline font-bold text-on-surface">
                        {analysis.decompositionYears} Years
                      </span>
                    </div>

                    <div className="p-5 bg-[#090E17] flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-primary font-mono text-xs">
                        <MapPin className="w-4 h-4" />
                        <span className="uppercase tracking-widest text-on-surface-variant text-[10px]">Coordinate Vector</span>
                      </div>
                      <span className="text-sm font-mono font-semibold text-on-surface truncate" title={analysis.location}>
                        {analysis.location}
                      </span>
                    </div>
                  </div>

                  {/* Impact Analysis & Strategy */}
                  <div className="flex flex-col gap-[1px] bg-[#142336]">
                    <div className="p-5 bg-[#090E17] flex flex-col gap-1.5 border-l border-error">
                      <span className="font-mono text-[10px] tracking-widest uppercase text-error font-bold">
                        Environmental Threat Profile
                      </span>
                      <p className="text-xs sm:text-sm text-on-surface leading-relaxed">
                        {analysis.environmentalImpact}
                      </p>
                    </div>

                    <div className="p-5 bg-[#090E17] flex flex-col gap-1.5">
                      <span className="font-mono text-[10px] tracking-widest uppercase text-secondary font-bold">
                        Probable Outfall Source
                      </span>
                      <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                        {analysis.probableSource}
                      </p>
                    </div>

                    <div className="p-5 bg-[#090E17] flex flex-col gap-1.5 border-l border-emerald-500">
                      <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold">
                        <Recycle className="w-4 h-4" />
                        <span className="uppercase tracking-widest text-[10px]">Upcycler Routing Strategy</span>
                      </div>
                      <p className="text-xs sm:text-sm text-on-surface leading-relaxed">
                        {analysis.disposalInstructions}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      // Dispatched log
                      console.log("Vessel SKM-01 Dispatched to Debris Coordinates!");
                      setTimeout(onClose, 500);
                    }}
                    className="w-full py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 font-headline font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                  >
                    Acknowledge & Dispatch Autonomous Skimmer
                  </motion.button>

                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default DebrisAnalysisPanel;
