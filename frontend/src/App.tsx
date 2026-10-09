import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import TacticalMissionRibbon from './components/layout/TacticalMissionRibbon';
import Overview from './pages/Overview';
import Simulate from './pages/Simulate';
import Hotspots from './pages/Hotspots';
import FieldOps from './pages/FieldOps';
import CircularRecovery from './pages/CircularRecovery';
import ModelLab from './pages/ModelLab';
import OceanGPTWidget from './components/chat/OceanGPTWidget';

function App() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('tidal_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebar = () => {
    setSidebarCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('tidal_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <Router>
      <div className="bg-background text-on-surface flex min-h-screen font-sans selection:bg-primary/20 selection:text-primary">
        <Sidebar 
          mobileOpen={mobileNavOpen} 
          onCloseMobile={() => setMobileNavOpen(false)} 
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
        
        <div className={`flex-1 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'} flex flex-col min-h-screen w-full overflow-x-hidden transition-all duration-300`}>
          <Header 
            onToggleMobile={() => setMobileNavOpen(prev => !prev)} 
            isCollapsed={sidebarCollapsed}
          />
          
          <TacticalMissionRibbon isCollapsed={sidebarCollapsed} />
          
          <main className="relative pt-28 flex-1 flex flex-col">
            <Routes>
              <Route path="/" element={<Navigate to="/overview" replace />} />
              <Route path="/overview" element={<Overview />} />
              <Route path="/simulate" element={<Simulate />} />
              <Route path="/hotspots" element={<Hotspots />} />
              <Route path="/field-ops" element={<FieldOps />} />
              <Route path="/circular-recovery" element={<CircularRecovery />} />
              <Route path="/model-lab" element={<ModelLab />} />
            </Routes>
          </main>
        </div>

        <OceanGPTWidget />
      </div>
    </Router>
  );
}

export default App;
