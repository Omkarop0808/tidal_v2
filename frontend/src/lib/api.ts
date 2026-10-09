import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://127.0.0.1:8000/ws';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Telemetry & Hotspots
  getTelemetrySummary: () => apiClient.get('/telemetry/summary').then(res => res.data),
  getHotspots: () => apiClient.get('/hotspots/spatial').then(res => res.data),
  
  // Beaches Master
  getBeaches: () => apiClient.get('/beaches').then(res => res.data),
  getBeach: (id: string) => apiClient.get(`/beaches/${id}`).then(res => res.data),

  // Cleanup Operations & Synchronization
  getCleanupTasks: () => apiClient.get('/cleanup/tasks').then(res => res.data),
  createCleanupTask: (data: { beach_id: string; team_name: string; vessel_id?: string; predicted_kg?: number }) => 
    apiClient.post('/cleanup/create', data).then(res => res.data),
  submitCleanup: (data: { 
    task_id: string; 
    beach_id: string; 
    collected_kg: number; 
    remaining_kg: number; 
    before_img?: string; 
    after_img?: string; 
    effectiveness_pct?: number; 
    notes?: string; 
  }) => apiClient.post('/cleanup/submit', data).then(res => res.data),
  verifyCleanupImages: (formData: FormData) => apiClient.post('/cleanup/verify-images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data),

  // Accuracy Analytics & Retraining
  getAccuracyAnalytics: () => apiClient.get('/analytics/accuracy').then(res => res.data),
  retrainModel: () => apiClient.post('/ml/retrain').then(res => res.data),
  getRetrainHistory: () => apiClient.get('/ml/retrain-history').then(res => res.data),

  // Fleet & Dispatch
  optimizeDispatch: (hotspots: any[]) => apiClient.post('/dispatch/optimize', { hotspots }).then(res => res.data),
  
  // Simulation & Trajectory
  runSimulation: (scenario: any) => apiClient.post('/simulate/scenario', scenario).then(res => res.data),
  getDriftTrajectory: (lat: number, lon: number) => apiClient.get(`/simulate/predictive?lat=${lat}&lon=${lon}`).then(res => res.data),
  
  // Optical Vision & Circular Upcycling Ledger
  reportObservation: (formData: FormData) => apiClient.post('/recovery/observation', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data),
  getCircularManifests: () => apiClient.get('/recovery/manifests').then(res => res.data),
  signCircularManifest: (data: { manifest_id: string; upcycler_facility?: string }) => 
    apiClient.post('/recovery/sign-manifest', data).then(res => res.data),
  
  // Chat
  chat: (message: string) => apiClient.post('/chat', { message }).then(res => res.data),
  
  // Specific Analysis
  getTelemetryAnalysis: (id: string) => apiClient.get(`/telemetry/analysis/${id}`).then(res => res.data),
};
