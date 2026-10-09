import { create } from 'zustand';

export interface Particle {
  lat: number;
  lon: number;
  beached: boolean;
}

export interface TrajectoryFrame {
  hour: number;
  lat: number;
  lon: number;
  beached_percent: number;
  particles?: Particle[];
}

export interface OutfallLocation {
  id: string;
  name: string;
  sector: 'South Mumbai' | 'Central Coast' | 'North-West Coast';
  lat: number;
  lon: number;
  defaultMass: number;
  description: string;
}

export const OUTFALL_LOCATIONS: OutfallLocation[] = [
  // North-Western Mumbai Zone
  { id: 'versova', name: 'Versova Creek Outfall Channel', sector: 'North-West Coast', lat: 19.135, lon: 72.814, defaultMass: 520, description: 'High-velocity urban stormwater drain outfall leading into Arabian Sea' },
  { id: 'juhu', name: 'Juhu Beach & Koliwada Shoreline', sector: 'North-West Coast', lat: 19.098, lon: 72.826, defaultMass: 380, description: 'Major tourist and tidal accumulation zone with dense plastic deposition' },
  { id: 'aksa', name: 'Aksa & Dana Pani Beach Outflow', sector: 'North-West Coast', lat: 19.175, lon: 72.792, defaultMass: 290, description: 'Strong undertow channel with seasonal monsoonal debris influx' },
  { id: 'marve', name: 'Marve Beach & Malad Creek Estuary', sector: 'North-West Coast', lat: 19.198, lon: 72.788, defaultMass: 340, description: 'Narrow tidal creek estuary capturing industrial runoff' },
  { id: 'manori', name: 'Manori Beach & Fishing Creek', sector: 'North-West Coast', lat: 19.215, lon: 72.775, defaultMass: 210, description: 'Coastal fishing harbor with nylon ghost net risks' },
  { id: 'gorai', name: 'Gorai Beach North Shoreline', sector: 'North-West Coast', lat: 19.245, lon: 72.770, defaultMass: 180, description: 'Northern boundary intertidal mudflats and recreational sands' },
  { id: 'vasai', name: 'Vasai Creek Ocean Convergence', sector: 'North-West Coast', lat: 19.310, lon: 72.780, defaultMass: 450, description: 'Major river basin discharge into Arabian Sea' },
  
  // Central Mumbai Zone
  { id: 'bandra', name: 'Bandra Estuary & Carter Road Channel', sector: 'Central Coast', lat: 19.055, lon: 72.818, defaultMass: 310, description: 'Rocky seawall and intertidal channel with high wave turbulence' },
  { id: 'mahim', name: 'Mahim Bay & Mithi River Outfall', sector: 'Central Coast', lat: 19.035, lon: 72.835, defaultMass: 650, description: 'Mithi River mouth discharging heavy mixed urban plastics' },
  { id: 'dadar', name: 'Dadar Chowpatty Shoreline', sector: 'Central Coast', lat: 19.025, lon: 72.832, defaultMass: 270, description: 'Central urban beach subject to strong tidal regurgitation' },

  // South Mumbai Zone
  { id: 'worli', name: 'Worli Sea Face & Cove Basin', sector: 'South Mumbai', lat: 19.012, lon: 72.815, defaultMass: 230, description: 'Deep water promenade facing high oceanic swell and barrier impact' },
  { id: 'girgaon', name: 'Girgaon Chowpatty & Marine Drive Bay', sector: 'South Mumbai', lat: 18.955, lon: 72.812, defaultMass: 190, description: 'Natural curved crescent bay trapping floating micro-polymers' },
  { id: 'colaba', name: 'Colaba Port HQ & Navy Basin', sector: 'South Mumbai', lat: 18.900, lon: 72.815, defaultMass: 140, description: 'Southernmost naval harbor and maritime fleet dispatch headquarters' },
];

export interface ActiveMission {
  zoneId: string;
  zoneName: string;
  sector: string;
  lat: number;
  lon: number;
  status: 'MONITORING' | 'CRITICAL' | 'INTERCEPT_SCHEDULED' | 'CLEANUP_LOGGED';
  riskScore: number;
  debrisKg: number;
}

export interface SimState {
  // Global Active Incident Mission
  activeMission: ActiveMission;
  
  // Scenario Inputs
  selectedLocation: OutfallLocation;
  debrisMassKg: number;
  materialType: string;
  windSpeed: number;
  precipitation: number;
  barrierEfficiency: number;
  cleanupTeams: number;
  isBarrierActive: boolean;
  
  // Camera & Visualizer View
  cameraView: 'perspective' | 'topDown' | 'shoreline';
  
  // Playback & Scrubber Controls
  playbackSpeed: number; // 0.5, 1, 2, 4
  
  // Trajectory Simulation Data
  trajectory: TrajectoryFrame[]; // Mitigated / Intervention
  trajectoryBaseline: TrajectoryFrame[]; // Unmitigated Baseline
  currentFrameIndex: number;
  isPlaying: boolean;
  
  // Actions
  setActiveMissionZone: (zoneId: string) => void;
  setSelectedLocation: (loc: OutfallLocation) => void;
  setScenario: (updates: Partial<SimState>) => void;
  setTrajectory: (trajectory: TrajectoryFrame[]) => void;
  setTrajectoryBaseline: (trajectoryBaseline: TrajectoryFrame[]) => void;
  setCurrentFrame: (index: number) => void;
  setCameraView: (view: 'perspective' | 'topDown' | 'shoreline') => void;
  setPlaybackSpeed: (speed: number) => void;
  togglePlay: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
}

export const useSim = create<SimState>((set) => ({
  activeMission: {
    zoneId: 'versova',
    zoneName: 'Versova Creek Outfall Channel',
    sector: 'North-West Coast',
    lat: 19.135,
    lon: 72.814,
    status: 'CRITICAL',
    riskScore: 94,
    debrisKg: 520
  },
  
  selectedLocation: OUTFALL_LOCATIONS[0],
  debrisMassKg: 520,
  materialType: 'Mixed Polymers (PET / HDPE / Ghost Nets)',
  windSpeed: 24,
  precipitation: 35,
  barrierEfficiency: 45,
  cleanupTeams: 12,
  isBarrierActive: true,
  cameraView: 'perspective',
  playbackSpeed: 1,
  
  trajectory: [],
  trajectoryBaseline: [],
  currentFrameIndex: 0,
  isPlaying: false,
  
  setActiveMissionZone: (zoneId) => {
    const loc = OUTFALL_LOCATIONS.find(l => l.id.toLowerCase() === zoneId.toLowerCase()) || OUTFALL_LOCATIONS[0];
    set({
      selectedLocation: loc,
      activeMission: {
        zoneId: loc.id,
        zoneName: loc.name,
        sector: loc.sector,
        lat: loc.lat,
        lon: loc.lon,
        status: loc.id === 'versova' ? 'CRITICAL' : 'MONITORING',
        riskScore: loc.id === 'versova' ? 94 : loc.id === 'mahim' ? 88 : loc.id === 'juhu' ? 82 : 65,
        debrisKg: loc.defaultMass
      },
      debrisMassKg: loc.defaultMass
    });
  },
  
  setSelectedLocation: (selectedLocation) => set({ 
    selectedLocation,
    activeMission: {
      zoneId: selectedLocation.id,
      zoneName: selectedLocation.name,
      sector: selectedLocation.sector,
      lat: selectedLocation.lat,
      lon: selectedLocation.lon,
      status: selectedLocation.id === 'versova' ? 'CRITICAL' : 'MONITORING',
      riskScore: selectedLocation.id === 'versova' ? 94 : 70,
      debrisKg: selectedLocation.defaultMass
    }
  }),
  setScenario: (updates) => set((state) => ({ ...state, ...updates })),
  setTrajectory: (trajectory) => set({ trajectory, currentFrameIndex: 0 }),
  setTrajectoryBaseline: (trajectoryBaseline) => set({ trajectoryBaseline }),
  setCurrentFrame: (index) => set({ currentFrameIndex: index }),
  setCameraView: (cameraView) => set({ cameraView }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
}));

export default useSim;
