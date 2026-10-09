import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  ShieldCheck, 
  PlayCircle, 
  StopCircle, 
  Sparkles, 
  Recycle, 
  Truck, 
  FileText,
  Sliders,
  Square,
  CheckCircle2,
  Clock,
  RefreshCw
} from 'lucide-react';
import { api } from '../lib/api';

export default function CircularRecovery() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isClaheActive, setIsClaheActive] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [manifestGenerated, setManifestGenerated] = useState(false);
  const [manifestHash, setManifestHash] = useState('');
  const [isGeneratingManifest, setIsGeneratingManifest] = useState(false);
  const [manifests, setManifests] = useState<any[]>([]);
  const [isLoadingManifests, setIsLoadingManifests] = useState(false);
  const [signingId, setSigningId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadManifests = async () => {
    setIsLoadingManifests(true);
    try {
      const data = await api.getCircularManifests();
      setManifests(data);
    } catch (err) {
      console.error("Failed to load circular manifests:", err);
    } finally {
      setIsLoadingManifests(false);
    }
  };

  useEffect(() => {
    loadManifests();
  }, []);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setManifestGenerated(false);
      
      const formData = new FormData();
      formData.append('file', file);

      setIsAnalyzing(true);
      try {
        const result = await api.reportObservation(formData);
        setAnalysisResult(result);
      } catch (error) {
        console.error("Error analyzing image:", error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleExecuteManifest = async () => {
    setIsGeneratingManifest(true);
    try {
      const pending = manifests.find(m => m.status === 'PENDING_VALUATION');
      if (pending) {
        await api.signCircularManifest({ manifest_id: pending.id });
        setManifestHash(pending.id);
      } else {
        const hash = '0x' + Array.from({length: 8}, () => Math.floor(Math.random()*16).toString(16)).join('').toUpperCase();
        setManifestHash(hash);
      }
      await loadManifests();
      setManifestGenerated(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingManifest(false);
    }
  };

  const handleSignRowManifest = async (id: string) => {
    setSigningId(id);
    try {
      await api.signCircularManifest({ manifest_id: id });
      await loadManifests();
    } catch (err) {
      console.error("Failed to sign manifest:", err);
    } finally {
      setSigningId(null);
    }
  };

  const estimatedWeight = isLiveMode ? 25.0 : (analysisResult?.ai_analysis?.estimated_weight_kg || 18.4);
  const spotRate = 35.0; 
  const grossValue = Math.round(estimatedWeight * spotRate);

  const totalMassKg = manifests.reduce((acc, m) => acc + (m.plastic_mass_kg || 0), 0);
  const totalGrossInr = manifests.reduce((acc, m) => acc + (m.gross_valuation_inr || 0), 0);
  const totalCo2e = manifests.reduce((acc, m) => acc + (m.co2e_avoided_kg || 0), 0);
  const totalCredits = manifests.reduce((acc, m) => acc + (m.epr_credits || 0), 0);

  return (
    <main className="w-full bg-[#050505] min-h-screen text-white px-4 sm:px-8 lg:px-12 py-8 max-w-[1600px] mx-auto border-x-2 border-[#333333]">
      <div className="flex flex-col gap-12">
        
        {/* Header Bar */}
        <div className="flex flex-col gap-4 pb-8 border-b-2 border-[#333333]">
          <div className="flex items-center gap-4">
            <span className="px-4 py-2 bg-white text-black font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
              <Recycle className="w-4 h-4" />
              CIRCULAR VALUATION
            </span>
            <span className="text-[#ff4d00] font-mono text-[10px] uppercase font-bold tracking-widest">
              // YOLO11 + GEMINI PIPELINE
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-headline font-black tracking-tighter uppercase text-white">
            Upcycler Exchange
          </h1>
          <p className="text-sm font-mono text-[#a3a3a3] uppercase font-bold tracking-widest max-w-3xl leading-relaxed border-l-4 border-[#ff4d00] pl-4">
            Upload field drone imagery or activate the live coastal camera stream. YOLO11 executes classification, while Gemini determines polymer composition, calculates real-time spot valuation, and matches local upcycling facilities.
          </p>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[1px] bg-[#333333] border-2 border-[#333333]">
          
          {/* Left: Drone Feed / Vision Upload Viewport (6 cols) */}
          <div className="lg:col-span-6 bg-[#000000] p-8 flex flex-col justify-between gap-8 group">
            <div className="relative w-full h-[500px] bg-[#111111] border-2 border-[#333333] overflow-hidden flex items-center justify-center">
              
              {isLiveMode ? (
                <div className="absolute inset-0 bg-[#000000] overflow-hidden flex flex-col justify-center items-center">
                  <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-4 pointer-events-none">
                    <div className="flex items-center gap-3 px-4 py-2 bg-black border-2 border-[#ff4d00] text-[10px] font-mono text-[#ff4d00] font-bold uppercase tracking-widest pointer-events-auto">
                      <span className="w-2 h-2 bg-[#ff4d00] animate-ping"></span>
                      <span>LIVE FEED // SEC-04</span>
                    </div>

                    <button 
                      onClick={() => setIsClaheActive(!isClaheActive)}
                      className={`px-4 py-2 font-mono text-[10px] uppercase font-bold tracking-widest border-2 pointer-events-auto transition-none flex items-center gap-2 ${
                        isClaheActive 
                          ? 'bg-white text-black border-white' 
                          : 'bg-black text-[#525252] border-[#333333]'
                      }`}
                    >
                      <Sliders className="w-4 h-4" />
                      <span>CLAHE: {isClaheActive ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  <div className={`relative w-full h-full bg-[url('https://images.unsplash.com/photo-1621451537084-482c73073e0f?auto=format&fit=crop&q=80&w=1000')] bg-cover bg-center transition-none ${
                    isClaheActive ? 'filter grayscale contrast-125' : 'opacity-50 grayscale'
                  }`}>
                    <div className="absolute border-2 border-[#ff4d00] bg-[#ff4d00]/20 top-[38%] left-[28%] w-[20%] h-[22%] flex items-start justify-start p-2">
                      <span className="bg-[#ff4d00] text-black font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-1">
                        PET (88%)
                      </span>
                    </div>

                    <div className="absolute border-2 border-white bg-white/20 top-[58%] left-[56%] w-[24%] h-[20%] flex items-start justify-start p-2">
                      <span className="bg-white text-black font-mono text-[10px] uppercase font-bold tracking-widest px-2 py-1">
                        NET (92%)
                      </span>
                    </div>

                    <div className="absolute top-0 left-0 w-full h-1 bg-[#ff4d00] animate-pulse"></div>
                  </div>
                </div>
              ) : selectedImage ? (
                <div className="relative w-full h-full">
                  <img 
                    src={selectedImage} 
                    alt="Uploaded Debris" 
                    className="w-full h-full object-cover filter grayscale contrast-125" 
                  />

                  {analysisResult?.ai_analysis?.bounding_boxes?.map((box: any, i: number) => {
                    const [y1, x1, y2, x2] = box.box_2d || [50, 50, 200, 200];
                    return (
                      <div 
                        key={i}
                        className="absolute border-2 border-white bg-white/10"
                        style={{
                          top: `${(y1 / 480) * 100}%`,
                          left: `${(x1 / 640) * 100}%`,
                          height: `${((y2 - y1) / 480) * 100}%`,
                          width: `${((x2 - x1) / 640) * 100}%`,
                        }}
                      >
                        <span className="absolute -top-8 left-0 bg-white text-black font-mono text-[10px] uppercase px-2 py-1 font-bold whitespace-nowrap">
                          {box.label} {((box.confidence || 0.89) * 100).toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6 text-[#525252] p-8 text-center font-mono uppercase font-bold tracking-widest">
                  <Camera className="w-16 h-16 text-[#333333]" />
                  <div className="flex flex-col gap-2">
                    <p className="text-white text-sm">AWAITING VISUAL TELEMETRY</p>
                    <p className="text-[10px]">UPLOAD IMAGE OR START DRONE FEED</p>
                  </div>
                </div>
              )}

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col sm:flex-row items-center gap-4 z-30">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => { setIsLiveMode(false); handleImageUpload(e); }} 
                  accept="image/*" 
                  className="hidden" 
                />

                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-[#111111] hover:bg-white text-white hover:text-black font-headline font-bold text-xs uppercase tracking-widest border-2 border-[#333333] hover:border-white transition-none flex items-center gap-3"
                >
                  <Upload className="w-4 h-4" />
                  <span>UPLOAD</span>
                </button>

                <button 
                  onClick={() => setIsLiveMode(!isLiveMode)}
                  className={`px-6 py-3 font-headline font-black text-xs uppercase tracking-widest border-2 transition-none flex items-center gap-3 ${
                    isLiveMode 
                      ? 'bg-black text-[#ff4d00] border-[#ff4d00]' 
                      : 'bg-white text-black border-white hover:bg-black hover:text-white'
                  }`}
                >
                  {isLiveMode ? (
                    <>
                      <StopCircle className="w-4 h-4" />
                      <span>TERMINATE FEED</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      <span>START FEED</span>
                    </>
                  )}
                </button>
              </div>

              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-6 z-50">
                  <Square className="w-12 h-12 text-white animate-spin border-4 border-white fill-transparent" />
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white font-bold bg-[#111111] px-4 py-2 border-2 border-[#333333]">
                    ANALYZING TELEMETRY...
                  </p>
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 bg-[#111111] border-2 border-[#333333] text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-white" />
              <span>CLAHE ALGORITHM CLARIFIES MURKY COASTAL WATERS FOR NEURAL SEGMENTATION.</span>
            </div>
          </div>

          {/* Right: Plastics Exchange HUD & Upcycler Matching (6 cols) */}
          <div className="lg:col-span-6 bg-[#000000] p-8 flex flex-col gap-8">
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#333333]">
              <h2 className="text-2xl font-headline font-black text-white uppercase tracking-tighter flex items-center gap-3">
                <Square className="w-5 h-5 fill-white text-white" />
                EXCHANGE TERMINAL
              </h2>
              <span className="text-[10px] font-mono bg-white text-black px-3 py-1 font-bold uppercase tracking-widest">
                LIVE MARKET
              </span>
            </div>

            {/* Live Spot Market Rates */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center bg-[#111111] px-4 py-2 border-2 border-[#333333]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white font-bold">
                  SPOT POLYMER BENCHMARK
                </span>
                <span className="font-mono text-[10px] text-[#ff4d00] font-bold">UPDATED 5M AGO</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-[1px] bg-[#333333] border-2 border-[#333333]">
                <div className="p-4 bg-[#050505] flex flex-col gap-2">
                  <div className="font-mono text-[10px] text-[#a3a3a3] uppercase font-bold tracking-widest">CLEAR PET</div>
                  <div className="font-headline font-black text-2xl text-white">₹35.00</div>
                </div>
                <div className="p-4 bg-[#050505] flex flex-col gap-2">
                  <div className="font-mono text-[10px] text-[#a3a3a3] uppercase font-bold tracking-widest">RIGID HDPE</div>
                  <div className="font-headline font-black text-2xl text-white">₹28.50</div>
                </div>
                <div className="p-4 bg-[#050505] flex flex-col gap-2">
                  <div className="font-mono text-[10px] text-[#a3a3a3] uppercase font-bold tracking-widest">NYLON NETS</div>
                  <div className="font-headline font-black text-2xl text-[#ff4d00]">₹42.00</div>
                </div>
              </div>
            </div>

            {/* Current Catch Valuation */}
            <div className="flex flex-col gap-4 mt-4">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-[#a3a3a3] font-bold">
                BATCH ESTIMATION
              </h3>

              <div className="grid grid-cols-2 gap-[1px] bg-[#333333] border-2 border-[#333333]">
                <div className="p-6 bg-[#000000] flex flex-col gap-2 border-l-4 border-l-white">
                  <span className="font-mono text-[10px] text-[#a3a3a3] uppercase font-bold tracking-widest">CLASSIFIED MASS</span>
                  <span className="text-4xl font-headline font-black text-white">
                    {estimatedWeight.toFixed(1)} KG
                  </span>
                </div>

                <div className="p-6 bg-[#000000] flex flex-col gap-2 border-l-4 border-l-[#ff4d00]">
                  <span className="font-mono text-[10px] text-[#a3a3a3] uppercase font-bold tracking-widest">GROSS VALUE</span>
                  <span className="text-4xl font-headline font-black text-[#ff4d00]">
                    ₹{grossValue}
                  </span>
                </div>
              </div>
            </div>

            {/* Smart Upcycler Match Contract */}
            <div className="mt-auto p-8 bg-[#111111] border-2 border-white flex flex-col gap-6 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none transition-transform group-hover:scale-110">
                <ShieldCheck className="w-48 h-48 text-white" />
              </div>

              <div className="relative z-10 flex items-center justify-between border-b-2 border-[#333333] pb-4">
                <span className="text-[10px] font-mono uppercase tracking-widest text-white font-bold flex items-center gap-2">
                  <Square className="w-3 h-3 fill-white text-white" />
                  UPCYCLER CONTRACT
                </span>
                <span className="font-mono text-[10px] px-3 py-1 bg-white text-black font-bold uppercase tracking-widest">
                  CERTIFIED
                </span>
              </div>

              <div className="relative z-10 flex flex-col gap-2">
                <h3 className="text-3xl font-headline font-black text-white uppercase tracking-tighter">
                  {isLiveMode ? 'LUCRO PLASTECYCLE' : (analysisResult?.matched_upcycler || 'LUCRO PLASTECYCLE')}
                </h3>
                <span className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest flex items-center gap-2">
                  <Truck className="w-4 h-4 text-white" />
                  DISTANCE: 12.4 KM VIA COASTAL EXPRESSWAY
                </span>
              </div>

              {manifestGenerated ? (
                <div className="relative z-10 p-6 bg-[#000000] border-2 border-[#ff4d00] flex flex-col gap-4 font-mono text-[10px] uppercase font-bold tracking-widest mt-4">
                  <div className="flex items-center justify-between border-b border-[#333333] pb-2">
                    <span className="flex items-center gap-2 text-[#ff4d00]">
                      <FileText className="w-4 h-4" />
                      MANIFEST VERIFIED
                    </span>
                    <span className="text-[#a3a3a3]">HASH: {manifestHash}</span>
                  </div>
                  <span className="text-white leading-relaxed">
                    BATCH: {estimatedWeight}KG • STATUS: DISPATCH QUEUED
                  </span>
                </div>
              ) : (
                <button 
                  onClick={handleExecuteManifest}
                  disabled={isGeneratingManifest}
                  className="relative z-10 self-start px-8 py-4 bg-white hover:bg-[#ff4d00] text-black font-headline font-black text-sm uppercase tracking-widest border-2 border-white hover:border-[#ff4d00] transition-none flex items-center gap-4 mt-4 disabled:opacity-50"
                >
                  {isGeneratingManifest ? (
                    <>
                      <Square className="w-4 h-4 text-black animate-spin border-2 border-black fill-transparent" />
                      <span>MINTING LEDGER...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      <span>EXECUTE MANIFEST</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Circular Economy & Real-Time EPR Material Audit Ledger */}
        <div className="flex flex-col gap-6 pt-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b-2 border-[#333333]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 text-[10px] font-mono text-[#ff4d00] uppercase font-bold tracking-widest">
                <Recycle className="w-4 h-4 text-[#ff4d00]" />
                <span>OFFICIAL VERIFICATION // RECOVERY REPOSITORY</span>
              </div>
              <h2 className="text-3xl font-headline font-black text-white uppercase tracking-tighter">
                EPR Material Audit Ledger
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={loadManifests}
                disabled={isLoadingManifests}
                className="px-4 py-2 bg-[#111111] hover:bg-white text-white hover:text-black border-2 border-[#333333] hover:border-white font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 transition-none"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingManifests ? 'animate-spin' : ''}`} />
                <span>REFRESH LEDGER</span>
              </button>
            </div>
          </div>

          {/* Aggregate KPI Summary Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-[#333333] border-2 border-[#333333]">
            <div className="p-6 bg-[#000000] flex flex-col gap-1 border-l-4 border-l-white">
              <span className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">TOTAL RECOVERED</span>
              <span className="text-3xl sm:text-4xl font-headline font-black text-white">{totalMassKg.toLocaleString()} KG</span>
              <span className="text-[9px] font-mono text-[#525252] uppercase font-bold">ALL COASTAL SWEEPS</span>
            </div>

            <div className="p-6 bg-[#000000] flex flex-col gap-1 border-l-4 border-l-[#ff4d00]">
              <span className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">MARKET VALUE</span>
              <span className="text-3xl sm:text-4xl font-headline font-black text-[#ff4d00]">₹{totalGrossInr.toLocaleString()}</span>
              <span className="text-[9px] font-mono text-[#525252] uppercase font-bold">REALIZED INFLOW</span>
            </div>

            <div className="p-6 bg-[#000000] flex flex-col gap-1 border-l-4 border-l-emerald-500">
              <span className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">CO₂e AVOIDED</span>
              <span className="text-3xl sm:text-4xl font-headline font-black text-emerald-400">+{totalCo2e.toFixed(0)} KG</span>
              <span className="text-[9px] font-mono text-[#525252] uppercase font-bold">VIRGIN RESIN OFFSET</span>
            </div>

            <div className="p-6 bg-[#000000] flex flex-col gap-1 border-l-4 border-l-sky-500">
              <span className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">EPR CREDITS</span>
              <span className="text-3xl sm:text-4xl font-headline font-black text-sky-400">{totalCredits}</span>
              <span className="text-[9px] font-mono text-[#525252] uppercase font-bold">CPCB COMPLIANT</span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="w-full bg-[#000000] border-2 border-[#333333] overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b-2 border-[#333333] bg-[#111111] text-[10px] text-[#a3a3a3] uppercase tracking-widest font-bold">
                  <th className="p-4">MANIFEST REF</th>
                  <th className="p-4">COASTAL ZONE</th>
                  <th className="p-4">MASS & POLYMER</th>
                  <th className="p-4">VALUATION (₹)</th>
                  <th className="p-4">CERTIFIED UPCYCLER</th>
                  <th className="p-4">STATUS</th>
                  <th className="p-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {manifests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#525252] font-mono uppercase tracking-widest font-bold">
                      AWAITING FIRST COMPLETED FIELD OPERATION TO MINT CERTIFICATE
                    </td>
                  </tr>
                ) : (
                  manifests.map((m) => {
                    const isIssued = m.status === 'MANIFEST_ISSUED' || m.status === 'DISPATCHED_TO_UPCYCLER';
                    return (
                      <tr key={m.id} className="hover:bg-[#0a0a0a] transition-none">
                        <td className="p-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-white font-headline font-black text-sm tracking-tight">{m.id}</span>
                            <span className="text-[9px] text-[#737373]">{m.created_at ? new Date(m.created_at).toLocaleDateString() : 'ACTIVE'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-white font-bold uppercase">{m.beach_name || m.beach_id}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-white font-bold">{m.plastic_mass_kg} KG</span>
                            <span className="text-[9px] text-[#a3a3a3] line-clamp-1">{m.composition || 'MIXED POLYMERS'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[#ff4d00] font-headline font-black text-sm">₹{Number(m.gross_valuation_inr).toLocaleString()}</span>
                            <span className="text-[9px] text-emerald-400">+{m.co2e_avoided_kg} KG CO₂</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2 text-[#a3a3a3]">
                            <Truck className="w-3.5 h-3.5 text-white shrink-0" />
                            <span className="text-[10px] text-white uppercase font-bold">{m.upcycler_facility}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 ${
                            isIssued ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-[#ff4d00]/10 text-[#ff4d00] border border-[#ff4d00]/30'
                          }`}>
                            {isIssued ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Clock className="w-3 h-3 text-[#ff4d00]" />}
                            {m.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {isIssued ? (
                            <span className="text-[9px] text-[#737373] uppercase font-bold tracking-widest">
                              SIGNED
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSignRowManifest(m.id)}
                              disabled={signingId === m.id}
                              className="px-4 py-2 bg-white hover:bg-[#ff4d00] text-black font-headline font-black text-[10px] uppercase tracking-widest transition-none disabled:opacity-50"
                            >
                              {signingId === m.id ? 'SIGNING...' : 'SIGN & ISSUE'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
