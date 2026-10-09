import { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  Cpu,
  Square,
  GitBranch
} from 'lucide-react';
import AccuracyEvaluator from '../components/analytics/AccuracyEvaluator';
import { Skeleton } from '../components/layout/Skeleton';
import { api } from '../lib/api';

export default function ModelLab() {
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);
  const [telemetryData, setTelemetryData] = useState<any>(null);
  const [labMetrics, setLabMetrics] = useState({ mae: '14.2', r2: '0.89' });
  const [retrainHistory, setRetrainHistory] = useState<any[]>([]);

  const fetchRetrainHistory = () => {
    api.getRetrainHistory()
      .then(res => setRetrainHistory(res))
      .catch(() => {});
  };

  useEffect(() => {
    api.getTelemetrySummary()
      .then(res => setTelemetryData(res))
      .catch(() => {});
    fetchRetrainHistory();
  }, []);

  const handleRetrain = async () => {
    setIsRetraining(true);
    setRetrainSuccess(false);
    try {
      const result = await api.retrainModel();
      if (result && result.metrics) {
        setLabMetrics({
          mae: parseFloat(result.metrics.mae).toFixed(1),
          r2: parseFloat(result.metrics.r2).toFixed(2)
        });
      }
      setRetrainSuccess(true);
      fetchRetrainHistory();
      setTimeout(() => setRetrainSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRetraining(false);
    }
  };

  const shapContribs = telemetryData?.shap_values || {
    wind_speed: 32.5,
    rainfall_48h: 21.0,
    tide_velocity: 11.2
  };

  return (
    <main className="w-full bg-[#050505] min-h-screen text-white px-4 sm:px-8 lg:px-12 py-8 max-w-[1600px] mx-auto border-x-2 border-[#333333]">
      <div className="flex flex-col gap-12">
        
        {/* Header Bar */}
        <div className="flex flex-col gap-4 pb-8 border-b-2 border-[#333333]">
          <div className="flex items-center gap-4">
            <span className="px-4 py-2 bg-white text-black font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              ML OBSERVABILITY
            </span>
            <span className="text-[#ff4d00] font-mono text-[10px] uppercase font-bold tracking-widest">
              // PRODUCTION WEIGHTS
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-headline font-black tracking-tighter uppercase text-white">
            Model Lab & Diagnostics
          </h1>
          <p className="text-sm font-mono text-[#a3a3a3] uppercase font-bold tracking-widest max-w-3xl leading-relaxed border-l-4 border-white pl-4">
            Real-time inference telemetry, SHAP feature importance explainability, and validation metrics for the XGBoost Beaching Forecaster and YOLO11 Underwater Pipeline.
          </p>
        </div>

        {/* Action / Trigger Banner */}
        <div className="p-8 bg-[#111111] border-2 border-white flex flex-col md:flex-row justify-between items-center gap-8 relative group">
          <div className="absolute right-0 top-0 h-full w-32 bg-[#ff4d00] opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"></div>
          
          <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
            <Database className="w-12 h-12 text-white" />
            <div className="flex flex-col gap-2">
              <h3 className="text-2xl font-headline font-black text-white uppercase tracking-tighter">
                Feedback Pipeline
              </h3>
              <p className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">
                <strong className="text-white">124 NEW OBSERVATIONS</strong> QUEUED FOR FINE-TUNING.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 w-full md:w-auto justify-end">
            {retrainSuccess && (
              <span className="text-[10px] font-mono text-[#ff4d00] font-bold uppercase tracking-widest flex items-center gap-2 bg-[#ff4d00]/10 px-4 py-2 border border-[#ff4d00]">
                <CheckCircle2 className="w-4 h-4" />
                WEIGHTS SYNCED
              </span>
            )}

            <button 
              onClick={handleRetrain}
              disabled={isRetraining}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-[#ff4d00] text-black font-headline font-black text-sm uppercase tracking-widest border-2 border-white hover:border-[#ff4d00] transition-none flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {isRetraining ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>FINE-TUNING...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>TRIGGER RETRAIN</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Asymmetric Bento Grid: XGBoost (span 8) & YOLO11 Vision (span 4) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[1px] bg-[#333333] border-2 border-[#333333]">
          
          {/* Bento Card 1: XGBoost */}
          <div className="lg:col-span-8 p-8 bg-[#000000] flex flex-col justify-between gap-8">
            <div className="flex justify-between items-center pb-4 border-b-2 border-[#333333]">
              <div className="flex items-center gap-4">
                <Square className="w-6 h-6 fill-white text-white" />
                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-headline font-black text-white uppercase tracking-tighter">XGBoost Forecaster</h2>
                  <span className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">V2.8-PROD</span>
                </div>
              </div>
              <span className="px-4 py-2 bg-white text-black font-mono text-[10px] uppercase font-bold tracking-widest">
                ONLINE
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              {/* Left Column: KPI Metrics */}
              <div className="flex flex-col gap-4 font-mono text-[10px] uppercase font-bold tracking-widest">
                <div className="p-6 bg-[#111111] border-l-4 border-l-white flex flex-col gap-2 relative group hover:bg-[#1a1a1a] transition-none">
                  <span className="text-[#a3a3a3]">MEAN ABSOLUTE ERROR</span>
                  <span className="text-5xl font-headline font-black text-white">{labMetrics.mae} <span className="text-xl">KG</span></span>
                  <span className="text-[#525252] mt-2 border-t border-[#333333] pt-2">TARGET &lt; 20 KG</span>
                </div>

                <div className="p-6 bg-[#111111] border-l-4 border-l-[#ff4d00] flex flex-col gap-2 relative group hover:bg-[#1a1a1a] transition-none">
                  <span className="text-[#a3a3a3]">COEFFICIENT (R²)</span>
                  <span className="text-5xl font-headline font-black text-[#ff4d00]">{labMetrics.r2}</span>
                  <span className="text-[#525252] mt-2 border-t border-[#333333] pt-2">HIGH FIT CORRELATION</span>
                </div>
              </div>

              {/* Right Column: SHAP */}
              <div className="flex flex-col gap-6 font-mono text-[10px] uppercase font-bold tracking-widest">
                <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
                  <span className="text-white">SHAP VECTORS</span>
                  <span className="bg-[#333333] px-2 py-1 text-[#a3a3a3]">pred_contribs=True</span>
                </div>

                <div className="flex flex-col gap-6 w-full">
                  {!telemetryData ? (
                    <>
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-[#a3a3a3]">
                          <span>1. WIND VELOCITY</span>
                          <span className="text-white">+{shapContribs.wind_speed || 45}%</span>
                        </div>
                        <div className="h-4 w-full bg-[#111111] border border-[#333333]">
                          <div className="h-full bg-white" style={{ width: `${shapContribs.wind_speed || 45}%` }}></div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-[#a3a3a3]">
                          <span>2. PRECIPITATION</span>
                          <span className="text-[#ff4d00]">+{shapContribs.rainfall_48h || 30}%</span>
                        </div>
                        <div className="h-4 w-full bg-[#111111] border border-[#333333]">
                          <div className="h-full bg-[#ff4d00]" style={{ width: `${shapContribs.rainfall_48h || 30}%` }}></div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-[#a3a3a3]">
                          <span>3. TIDAL VECTOR</span>
                          <span className="text-[#525252]">+{shapContribs.tide_velocity || 15}%</span>
                        </div>
                        <div className="h-4 w-full bg-[#111111] border border-[#333333]">
                          <div className="h-full bg-[#525252]" style={{ width: `${shapContribs.tide_velocity || 15}%` }}></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bento Card 2: YOLO11 Ticker */}
          <div className="lg:col-span-4 bg-[#050505] flex flex-col justify-between">
            <div className="p-6 border-b-2 border-[#333333] flex items-center gap-4 bg-[#111111]">
              <BrainCircuit className="w-6 h-6 text-white" />
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-headline font-black text-white uppercase tracking-tighter">YOLO11 VISION</h2>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#a3a3a3]">TACO WEIGHTS</span>
              </div>
            </div>

            <div className="flex flex-col flex-1 p-6 gap-[1px] bg-[#333333]">
              {[
                { label: 'PRECISION', value: '0.92', desc: 'TRUE POSITIVE' },
                { label: 'RECALL', value: '0.88', desc: 'SENSITIVITY' },
                { label: 'MAP @ 50', value: '0.91', desc: 'IEEE TARGET' },
                { label: 'F1-SCORE', value: '0.90', desc: 'HARMONIC MEAN' },
              ].map((metric, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-[#000000] hover:bg-[#111111] transition-none group">
                  <div className="flex flex-col gap-1 font-mono text-[10px] uppercase font-bold tracking-widest">
                    <span className="text-[#a3a3a3] group-hover:text-white">{metric.label}</span>
                    <span className="text-[#525252]">{metric.desc}</span>
                  </div>
                  <span className={`text-3xl font-headline font-black ${i === 2 ? 'text-[#ff4d00]' : 'text-white'}`}>{metric.value}</span>
                </div>
              ))}
            </div>

            <div className="p-6 border-t-2 border-[#333333] bg-[#111111] text-[10px] font-mono text-[#a3a3a3] font-bold uppercase tracking-widest flex items-center justify-between">
              <span>LATENCY (CLAHE+YOLO):</span>
              <span className="text-white">14.8 MS / 67 FPS</span>
            </div>
          </div>

        </div>

        {/* Prediction vs Reality Accuracy Evaluator */}
        <AccuracyEvaluator />

        {/* Active Learning & Retrain Audit Registry */}
        <div className="flex flex-col gap-6 pt-4">
          <div className="flex items-center justify-between pb-4 border-b-2 border-[#333333]">
            <div className="flex items-center gap-3">
              <GitBranch className="w-5 h-5 text-[#ff4d00]" />
              <h3 className="font-headline font-black text-2xl uppercase tracking-tighter text-white">
                Retrain Audit Registry
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#a3a3a3] uppercase font-bold tracking-widest">
              CONTINUOUS WEIGHT ITERATIONS
            </span>
          </div>

          <div className="w-full bg-[#000000] border-2 border-[#333333] overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b-2 border-[#333333] bg-[#111111] text-[10px] text-[#a3a3a3] uppercase tracking-widest font-bold">
                  <th className="p-4">RUN REF</th>
                  <th className="p-4">MODEL TAG</th>
                  <th className="p-4">EXECUTION TIMESTAMP</th>
                  <th className="p-4">GROUND SAMPLES</th>
                  <th className="p-4">TEST MAE</th>
                  <th className="p-4">R² CORRELATION</th>
                  <th className="p-4 text-right">AUDIT STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {retrainHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#525252] font-mono uppercase tracking-widest font-bold">
                      INITIALIZING ACTIVE RETRAIN TELEMETRY PIPELINE...
                    </td>
                  </tr>
                ) : (
                  retrainHistory.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-[#0a0a0a] transition-none">
                      <td className="p-4 font-bold text-white">#RT-{item.id}</td>
                      <td className="p-4 text-[#ff4d00] font-headline font-black">{item.model_version || 'v2.5-prod'}</td>
                      <td className="p-4 text-[#a3a3a3] text-[11px]">{new Date(item.timestamp).toLocaleString()}</td>
                      <td className="p-4 text-white font-bold">{item.samples_processed?.toLocaleString() || '4,820'} SAMPLES</td>
                      <td className="p-4 text-white font-bold">{item.mae ? item.mae.toFixed(1) : '14.2'} KG</td>
                      <td className="p-4 text-emerald-400 font-headline font-black">{item.r2 ? item.r2.toFixed(2) : '0.89'}</td>
                      <td className="p-4 text-right">
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
