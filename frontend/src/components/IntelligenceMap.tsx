import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { api } from '../lib/api';
import { useSim } from '../store';
import { Radio } from 'lucide-react';

interface IntelligenceMapProps {
  onSelectBeach?: (beach: any) => void;
  selectedBeachId?: string;
  activeLayers?: string[];
}

const NAVAL_BASE_COORDS: [number, number] = [18.9067, 72.8147]; // Colaba Naval Dock

// Map controller to fly to selected beach and open popup
const MapController = ({ 
  selectedBeach,
  markerRefs
}: { 
  selectedBeach?: any;
  markerRefs: React.MutableRefObject<Record<string, L.Marker | null>>;
}) => {
  const map = useMap();

  useEffect(() => {
    if (selectedBeach && selectedBeach.lat && selectedBeach.lon) {
      map.flyTo([selectedBeach.lat, selectedBeach.lon], 13, {
        duration: 0.9,
        easeLinearity: 0.25
      });

      const timer = setTimeout(() => {
        const marker = markerRefs.current[selectedBeach.id];
        if (marker) {
          marker.openPopup();
        }
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [selectedBeach, map, markerRefs]);

  return null;
};

// Tactical radar beacon generator
const createTacticalMarkerIcon = (beach: any, isSelected: boolean) => {
  const isCritical = beach.baseline_risk >= 70 || beach.status === 'High Risk';
  const isCleaned = beach.status === 'Cleaned' || (beach.remaining_debris_kg !== undefined && beach.remaining_debris_kg <= 20);
  const risk = Math.round(beach.baseline_risk || 60);
  const name = (beach.name || 'ZONE').split(' ')[0].toUpperCase();

  const themeColor = isCleaned ? '#10b981' : isCritical ? '#ff4d00' : '#00e5ff';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex items-center justify-center cursor-pointer group" style="width: 32px; height: 32px;">
        
        <!-- Subtle Sonar Pulse -->
        ${isCritical ? `
          <span class="absolute inset-1 rounded-full border border-[#ff4d00] animate-ping opacity-60 pointer-events-none" style="animation-duration: 2.2s;"></span>
        ` : ''}

        <!-- Active Target Lock Reticle -->
        ${isSelected ? `
          <div class="absolute inset-0 border border-white/80 pointer-events-none animate-pulse scale-110">
            <span class="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-[#ff4d00]"></span>
            <span class="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-[#ff4d00]"></span>
            <span class="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-[#ff4d00]"></span>
            <span class="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-[#ff4d00]"></span>
          </div>
        ` : ''}

        <!-- Tactical Core Beacon -->
        <div class="relative w-3.5 h-3.5 flex items-center justify-center transition-transform duration-150 group-hover:scale-125 shadow-md ${isSelected ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-black' : ''}"
             style="background-color: ${themeColor}; border: 1.5px solid #ffffff;">
          ${isCleaned ? `
            <svg class="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ` : `
            <span class="w-1 h-1 bg-black rounded-full"></span>
          `}
        </div>

        <!-- Selected / Hover Label -->
        <div class="absolute left-full ml-2 px-2 py-0.5 bg-black/95 border border-[${themeColor}] text-white font-mono text-[9px] font-bold uppercase tracking-wider whitespace-nowrap shadow-2xl pointer-events-none transition-all duration-150 z-50 flex items-center gap-1.5 ${
          isSelected 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'
        }">
          <span style="color: ${themeColor}">${name}</span>
          <span class="px-1 py-0.2 text-[8px] font-mono text-black font-extrabold" style="background-color: ${themeColor}">
            ${isCleaned ? 'OK' : `${risk}%`}
          </span>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Custom tactical icon for Wind vectors
const createWindMarkerIcon = (label: string, angleDeg: number = 130) => {
  return L.divIcon({
    className: 'custom-wind-marker',
    html: `
      <div class="flex items-center gap-1.5 px-2 py-0.5 bg-black/90 border border-[#ff8c00] text-[#ff8c00] font-mono text-[8px] font-bold uppercase tracking-wider shadow-lg whitespace-nowrap">
        <svg class="w-2.5 h-2.5 fill-current shrink-0 transform" style="transform: rotate(${angleDeg}deg)" viewBox="0 0 24 24">
          <path d="M12 2L4 19l8-4 8 4z"/>
        </svg>
        <span>${label}</span>
      </div>
    `,
    iconSize: [95, 20],
    iconAnchor: [47, 10],
  });
};

// Custom tactical icon for Current vectors
const createCurrentMarkerIcon = (label: string) => {
  return L.divIcon({
    className: 'custom-current-marker',
    html: `
      <div class="flex items-center gap-1.5 px-2 py-0.5 bg-black/90 border border-[#00e5ff] text-[#00e5ff] font-mono text-[8px] font-bold uppercase tracking-wider shadow-lg whitespace-nowrap">
        <span class="w-1.5 h-1.5 bg-[#00e5ff] rounded-full animate-ping"></span>
        <span>${label}</span>
      </div>
    `,
    iconSize: [110, 20],
    iconAnchor: [55, 10],
  });
};

// Custom tactical icon for Tide surge vectors
const createTideMarkerIcon = (label: string) => {
  return L.divIcon({
    className: 'custom-tide-marker',
    html: `
      <div class="flex items-center gap-1.5 px-2 py-0.5 bg-black/90 border border-[#10b981] text-[#10b981] font-mono text-[8px] font-bold uppercase tracking-wider shadow-lg whitespace-nowrap">
        <span class="w-1.5 h-1.5 bg-[#10b981]"></span>
        <span>${label}</span>
      </div>
    `,
    iconSize: [115, 20],
    iconAnchor: [57, 10],
  });
};

// Static Oceanographic Flow Vectors for Mumbai Coastal Waters
const WIND_FLOW_VECTORS: [number, number][][] = [
  [[19.22, 72.64], [19.175, 72.792]], // Approaching Aksa
  [[19.18, 72.65], [19.135, 72.814]], // Approaching Versova
  [[19.14, 72.67], [19.097, 72.826]], // Approaching Juhu
  [[19.09, 72.68], [19.035, 72.835]], // Approaching Mahim Bay
  [[19.04, 72.69], [19.012, 72.815]], // Approaching Worli
  [[18.98, 72.70], [18.955, 72.812]], // Approaching Marine Drive
];

const CURRENT_STREAMLINES: [number, number][][] = [
  // Primary Northward Littoral Jet
  [
    [18.89, 72.80], 
    [18.93, 72.795], 
    [18.97, 72.80], 
    [19.01, 72.805], 
    [19.05, 72.808], 
    [19.10, 72.815], 
    [19.15, 72.805], 
    [19.21, 72.785]
  ],
  // Mid-Shelf Convergence Streamline
  [
    [18.92, 72.77],
    [18.99, 72.78],
    [19.06, 72.785],
    [19.13, 72.788],
    [19.20, 72.775]
  ]
];

const TIDE_CONVERGENCE_INFLOWS: [number, number][][] = [
  // Inflow to Mithi River / Mahim Creek
  [[19.01, 72.81], [19.035, 72.835], [19.048, 72.862]],
  // Inflow to Versova Estuary Mouth
  [[19.12, 72.79], [19.135, 72.814], [19.148, 72.842]],
  // Back Bay Tidal Surge
  [[18.91, 72.80], [18.935, 72.815], [18.955, 72.822]]
];

export const IntelligenceMap = ({ 
  onSelectBeach, 
  selectedBeachId, 
  activeLayers = ['Current', 'Wind', 'Tide', 'Debris'] 
}: IntelligenceMapProps) => {
  const [beaches, setBeaches] = useState<any[]>([]);
  const [trajectories, setTrajectories] = useState<Record<string, [number, number][]>>({});
  const markerRefs = useRef<Record<string, L.Marker | null>>({});
  const setActiveMissionZone = useSim(state => state.setActiveMissionZone);

  const fetchBeaches = async () => {
    try {
      const data = await api.getBeaches();
      setBeaches(data);
      
      const driftPromises = data
        .filter((b: any) => b.baseline_risk >= 70 || b.status === 'High Risk')
        .map(async (b: any) => {
          try {
            const res = await api.getDriftTrajectory(b.lat, b.lon);
            const path: [number, number][] = res.trajectory.map((frame: any) => [frame.lat, frame.lon]);
            return { id: b.id, path };
          } catch (err) {
            return null;
          }
        });
        
      const results = await Promise.all(driftPromises);
      const trajMap: Record<string, [number, number][]> = {};
      results.forEach(res => {
        if (res && res.path.length > 0) {
          trajMap[res.id] = res.path;
        }
      });
      setTrajectories(trajMap);
    } catch (e) {
      console.error('Failed to fetch beaches for map:', e);
    }
  };

  useEffect(() => {
    fetchBeaches();
    window.addEventListener('CleanupCompletedEvent', fetchBeaches);
    return () => {
      window.removeEventListener('CleanupCompletedEvent', fetchBeaches);
    };
  }, []);

  const selectedBeach = beaches.find(b => b.id === selectedBeachId);

  // Layer booleans
  const showDebris = activeLayers.includes('Debris');
  const showWind = activeLayers.includes('Wind');
  const showCurrent = activeLayers.includes('Current');
  const showTide = activeLayers.includes('Tide');

  return (
    <div className="w-full h-full relative z-0 bg-[#050505] overflow-hidden">
      <MapContainer 
        center={[19.04, 72.82]} 
        zoom={11} 
        style={{ height: '100%', width: '100%', background: '#050505' }}
        zoomControl={false}
        attributionControl={false}
      >
        <MapController selectedBeach={selectedBeach} markerRefs={markerRefs} />

        {/* Esri World Dark Gray Base Tiles */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
          minZoom={7}
          attribution="&copy; Esri &copy; DeLorme"
        />

        {/* Subtle Labels Layer */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
          minZoom={7}
          opacity={0.65}
        />

        {/* ======================================================== */}
        {/* LAYER: WIND - Onshore Atmospheric Vectors & Chevrons   */}
        {/* ======================================================== */}
        {showWind && (
          <>
            {WIND_FLOW_VECTORS.map((vector, idx) => (
              <Polyline
                key={`wind-vector-${idx}`}
                positions={vector}
                pathOptions={{
                  color: '#ff8c00',
                  weight: 2.5,
                  dashArray: '8, 8',
                  opacity: 0.85
                }}
              />
            ))}

            {/* Offshore Wind Reading Badges */}
            <Marker position={[19.20, 72.70]} icon={createWindMarkerIcon('WIND 18 KM/H // 310° NW')} />
            <Marker position={[19.11, 72.72]} icon={createWindMarkerIcon('SURGE FORCING 4.2 KT')} />
            <Marker position={[19.01, 72.72]} icon={createWindMarkerIcon('ONSHORE DRIFT 16 KM/H')} />
          </>
        )}

        {/* ======================================================== */}
        {/* LAYER: CURRENT - Nearshore Hydrodynamic Littoral Flow   */}
        {/* ======================================================== */}
        {showCurrent && (
          <>
            {CURRENT_STREAMLINES.map((stream, idx) => (
              <Polyline
                key={`curr-stream-${idx}`}
                positions={stream}
                pathOptions={{
                  color: '#00e5ff',
                  weight: idx === 0 ? 3.5 : 2,
                  dashArray: '5, 6',
                  opacity: 0.85
                }}
              />
            ))}

            <Marker position={[18.97, 72.80]} icon={createCurrentMarkerIcon('CURRENT 0.54 M/S [355° N]')} />
            <Marker position={[19.07, 72.81]} icon={createCurrentMarkerIcon('LITTORAL JET 0.61 M/S')} />
          </>
        )}

        {/* ======================================================== */}
        {/* LAYER: TIDE - Estuarine Surge Inflows & Isobars         */}
        {/* ======================================================== */}
        {showTide && (
          <>
            {TIDE_CONVERGENCE_INFLOWS.map((inflow, idx) => (
              <Polyline
                key={`tide-inflow-${idx}`}
                positions={inflow}
                pathOptions={{
                  color: '#10b981',
                  weight: 3.5,
                  dashArray: '6, 4',
                  opacity: 0.9
                }}
              />
            ))}

            <Marker position={[19.04, 72.845]} icon={createTideMarkerIcon('MAHIM SURGE +1.85M')} />
            <Marker position={[19.14, 72.825]} icon={createTideMarkerIcon('VERSOVA INFLOW +1.92M')} />
          </>
        )}

        {/* ======================================================== */}
        {/* LAYER: DEBRIS - Drift Paths, Beacons, and Base Vectors  */}
        {/* ======================================================== */}
        {showDebris && (
          <>
            {/* Colaba Base Fleet Patrol Lines */}
            {beaches
              .filter(b => b.baseline_risk >= 70 || b.status === 'High Risk')
              .slice(0, 3)
              .map((b, idx) => (
                <Polyline 
                  key={`patrol-line-${b.id || idx}`}
                  positions={[NAVAL_BASE_COORDS, [b.lat, b.lon]]}
                  pathOptions={{
                    color: '#ff4d00',
                    weight: 2,
                    opacity: 0.75,
                    dashArray: '5, 8',
                  }}
                />
              ))}

            {/* Predictive Drift Vector Paths */}
            {Object.entries(trajectories).map(([id, path]) => (
              <Polyline 
                key={`drift-${id}`}
                positions={path}
                pathOptions={{
                  color: '#00e5ff',
                  weight: 3,
                  opacity: 0.65,
                }}
              />
            ))}

            {/* Debris Accumulation Radii around critical hotspots */}
            {beaches
              .filter(b => b.baseline_risk >= 70)
              .map(b => (
                <Circle
                  key={`circle-${b.id}`}
                  center={[b.lat, b.lon]}
                  radius={750}
                  pathOptions={{
                    color: '#ff4d00',
                    fillColor: '#ff4d00',
                    fillOpacity: 0.12,
                    weight: 1,
                    dashArray: '3, 4'
                  }}
                />
              ))}
          </>
        )}

        {/* Base Port Marker (Always visible as reference) */}
        <Marker 
          position={NAVAL_BASE_COORDS} 
          icon={L.divIcon({
            className: 'custom-leaflet-marker',
            html: `
              <div class="relative flex items-center justify-center cursor-pointer group" style="width: 28px; height: 28px;">
                <div class="w-3.5 h-3.5 bg-white border border-black flex items-center justify-center transition-transform duration-150 group-hover:scale-125 shadow-md">
                  <span class="w-1.5 h-1.5 bg-[#ff4d00]"></span>
                </div>
                <div class="absolute left-full ml-2 px-2 py-0.5 bg-black/95 border border-white text-white font-mono text-[8px] font-bold uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-xl">
                  COLABA FLEET HQ
                </div>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          })}
        >
          <Tooltip direction="top" offset={[0, -10]} opacity={1}>
            <span className="font-mono text-xs uppercase font-bold">Colaba Fleet Deployment HQ</span>
          </Tooltip>
        </Marker>
        
        {/* Coastal Hotspot Beacons (Rendered when Debris layer is ON) */}
        {showDebris && beaches.map((b, idx) => {
          const isSelected = selectedBeachId === b.id;
          const icon = createTacticalMarkerIcon(b, isSelected);
          
          return (
            <Marker 
              key={b.id || idx} 
              ref={el => { markerRefs.current[b.id] = el; }}
              position={[b.lat, b.lon]} 
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onSelectBeach) {
                    onSelectBeach(b);
                  }
                }
              }}
            >
              <Popup>
                <div className="p-4 bg-[#050505] text-white font-mono text-xs uppercase min-w-[240px]">
                  <div className="flex items-center justify-between pb-2 border-b border-[#333333] mb-3">
                    <div className="font-headline font-black text-sm text-white tracking-tight flex items-center gap-1.5">
                      <span className={`w-2 h-2 ${b.baseline_risk >= 70 ? 'bg-[#ff4d00]' : b.status === 'Cleaned' ? 'bg-[#10b981]' : 'bg-[#00e5ff]'}`}></span>
                      {b.name}
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 bg-[#222222] text-[#a3a3a3] font-bold">
                      {b.sector}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3 text-[10px]">
                    <div className="bg-[#111111] p-2 border border-[#222222]">
                      <span className="text-[#737373] block mb-0.5">BEACHING RISK</span>
                      <span className={`font-bold text-sm ${b.baseline_risk >= 70 ? 'text-[#ff4d00]' : 'text-white'}`}>
                        {b.baseline_risk}%
                      </span>
                    </div>

                    <div className="bg-[#111111] p-2 border border-[#222222]">
                      <span className="text-[#737373] block mb-0.5">DEBRIS LOAD</span>
                      <span className="font-bold text-sm text-white">
                        {b.remaining_debris_kg || b.current_debris_kg || 0} KG
                      </span>
                    </div>
                  </div>

                  <div className="text-[9px] text-[#a3a3a3] mb-3 border-l-2 border-[#ff4d00] pl-2 leading-relaxed">
                    STATUS: <strong className="text-white">{b.status}</strong><br />
                    COORDS: {b.lat.toFixed(4)}°N, {b.lon.toFixed(4)}°E
                  </div>

                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        if (onSelectBeach) onSelectBeach(b);
                        setActiveMissionZone(b.id);
                      }}
                      className="w-full py-2 bg-[#ff4d00] hover:bg-white text-black font-headline font-black text-[10px] uppercase tracking-widest transition-none"
                    >
                      LOCK ON TARGET HUD
                    </button>
                    <Link
                      to="/simulate"
                      onClick={() => {
                        setActiveMissionZone(b.id);
                      }}
                      className="w-full py-2 bg-white hover:bg-[#ff4d00] text-black font-headline font-black text-[10px] uppercase tracking-widest text-center transition-none block"
                    >
                      LAUNCH 3D TWIN FORECAST →
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Dynamic Tactical Telemetry & Active Layers HUD Box */}
      <div className="absolute top-4 right-4 z-[500] bg-black/95 border-2 border-[#333333] p-3 text-white font-mono text-[9px] uppercase font-bold tracking-widest shadow-2xl flex flex-col gap-2 pointer-events-auto max-w-[260px]">
        <div className="flex items-center justify-between pb-1 border-b border-[#333333] text-[#a3a3a3]">
          <div className="flex items-center gap-2">
            <Radio className="w-3 h-3 text-[#ff4d00] animate-pulse" />
            <span>TACTICAL RADAR LAYERS</span>
          </div>
          <span className="text-[8px] bg-[#222222] text-[#ff4d00] px-1 py-0.2">
            {activeLayers.length}/4 ON
          </span>
        </div>

        {/* Dynamic layer statuses */}
        <div className="flex flex-col gap-1.5 text-[8px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 ${showDebris ? 'bg-[#ff4d00]' : 'bg-[#333333]'}`}></span>
              DEBRIS TARGETS
            </span>
            <span className={showDebris ? 'text-[#ff4d00]' : 'text-[#525252]'}>
              {showDebris ? 'ACTIVE (7 ZONES)' : 'MUTED'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 ${showWind ? 'bg-[#ff8c00]' : 'bg-[#333333]'}`}></span>
              WIND FORCING
            </span>
            <span className={showWind ? 'text-[#ff8c00]' : 'text-[#525252]'}>
              {showWind ? '18 KM/H (NW)' : 'MUTED'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 ${showCurrent ? 'bg-[#00e5ff]' : 'bg-[#333333]'}`}></span>
              HYDRO CURRENT
            </span>
            <span className={showCurrent ? 'text-[#00e5ff]' : 'text-[#525252]'}>
              {showCurrent ? '0.54 M/S (N-JET)' : 'MUTED'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 ${showTide ? 'bg-[#10b981]' : 'bg-[#333333]'}`}></span>
              TIDAL SURGE
            </span>
            <span className={showTide ? 'text-[#10b981]' : 'text-[#525252]'}>
              {showTide ? '+1.85M (RISING)' : 'MUTED'}
            </span>
          </div>
        </div>

        <div className="pt-1.5 border-t border-[#222222] text-[8px] text-[#737373] normal-case">
          *Toggle checkboxes below the radar to isolate hydrodynamic and atmospheric drivers.
        </div>
      </div>
    </div>
  );
};

export default IntelligenceMap;
