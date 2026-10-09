import { useState, useEffect } from 'react';
import { 
  Globe2, 
  Bell, 
  Menu, 
  Clock, 
  SlidersHorizontal,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { useSim } from '../../store';

interface HeaderProps {
  onToggleMobile?: () => void;
  isCollapsed?: boolean;
}

export const Header = ({ onToggleMobile, isCollapsed = false }: HeaderProps) => {
  const [time, setTime] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState(false);
  const activeMission = useSim(state => state.activeMission);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const notifications = [
    { id: 1, title: 'Debris Spike at Versova', time: '2m ago', type: 'critical', desc: 'Monte Carlo drift indicates +420kg accumulation over next 6 hours.' },
    { id: 2, title: 'Autonomous Skimmer SKM-01 Active', time: '14m ago', type: 'info', desc: 'Arrived at Bandra channel coordinates. Commencing interception.' },
    { id: 3, title: 'High Onshore Wind Alert', time: '1h ago', type: 'warning', desc: 'Wind speed increased to 24 knots (SW). Beaching risk elevated.' },
  ];

  return (
    <header className={`fixed top-0 ${isCollapsed ? 'lg:left-20' : 'lg:left-72'} left-0 right-0 h-16 bg-[#000000] z-40 flex items-center justify-between px-4 sm:px-6 border-b-2 border-[#333333] font-mono transition-all duration-300`}>
      
      {/* Left: Hamburger (Mobile) + Breadcrumb/Sector */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onToggleMobile}
          className="lg:hidden p-2 border border-[#333333] text-white hover:bg-[#ff4d00] hover:text-black hover:border-[#ff4d00] transition-none"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 text-xs uppercase font-bold tracking-widest">
          <div className="flex items-center gap-2 px-3 py-1.5 border border-[#333333] bg-[#111111] text-white">
            <Globe2 className="w-3.5 h-3.5 text-[#ff4d00]" />
            <span>MUMBAI COAST</span>
            <ChevronRight className="w-3 h-3 text-[#525252]" />
            <span className="text-[#a3a3a3]">{activeMission.zoneName.split(' ')[0]}</span>
          </div>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 border border-[#333333] bg-[#111111] text-white">
            <span className="w-2 h-2 bg-white animate-pulse"></span>
            TELEMETRY SYNCED
          </div>
        </div>
      </div>

      {/* Right: Time, Notifications, Settings, User avatar */}
      <div className="flex items-center gap-2">
        {/* Real-time Marine Chronometer */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-[#333333] bg-[#111111] text-white text-xs font-bold tracking-widest">
          <Clock className="w-3.5 h-3.5 text-[#ff4d00]" />
          <span>{time || '00:00:00 UTC'}</span>
        </div>

        {/* Notifications Toggle */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2 border transition-none flex items-center justify-center ${
              showNotifications 
                ? 'bg-[#ff4d00] border-[#ff4d00] text-black' 
                : 'bg-[#111111] border-[#333333] text-white hover:border-white'
            }`}
            aria-label="View Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-white border border-black animate-pulse"></span>
          </button>

          {/* Notifications Dropdown Drawer */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#000000] border-2 border-[#333333] p-0 flex flex-col z-50">
              <div className="flex items-center justify-between p-3 border-b-2 border-[#333333] bg-[#111111]">
                <span className="font-headline font-bold text-sm text-white uppercase flex items-center gap-2 tracking-widest">
                  <AlertTriangle className="w-4 h-4 text-[#ff4d00]" />
                  Tactical Alerts (3)
                </span>
                <span className="text-[10px] text-[#a3a3a3] uppercase cursor-pointer hover:text-white">CLEAR</span>
              </div>
              
              <div className="flex flex-col max-h-72 overflow-y-auto">
                {notifications.map(n => (
                  <div key={n.id} className="p-4 border-b border-[#222222] hover:bg-[#111111] transition-none flex flex-col gap-2">
                    <div className="flex items-center justify-between font-bold uppercase text-xs">
                      <span className={n.type === 'critical' ? 'text-[#ff4d00]' : n.type === 'warning' ? 'text-white' : 'text-[#a3a3a3]'}>
                        {n.title}
                      </span>
                      <span className="text-[9px] text-[#525252] tracking-widest">{n.time}</span>
                    </div>
                    <p className="text-[10px] text-[#a3a3a3] leading-relaxed uppercase">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Tools */}
        <button 
          className="p-2 border border-[#333333] bg-[#111111] text-white hover:border-white transition-none"
          title="Sector Config"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

      </div>
    </header>
  );
};

export default Header;
