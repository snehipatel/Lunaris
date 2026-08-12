import React from 'react';
import {
  Compass,
  LayoutDashboard,
  Trophy,
  MapPin,
  Navigation,
  BarChart3,
  BookOpen,
  Settings,
  Satellite
} from 'lucide-react';

interface SidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
}

const navItems = [
  { id: 'overview', label: 'Overview', icon: Compass },
  { id: 'dashboard', label: 'Crater Dashboard', icon: LayoutDashboard },
  { id: 'top', label: 'Top Craters', icon: Trophy },
  { id: 'landing', label: 'Landing Site', icon: MapPin },
  { id: 'rover', label: 'Rover Traverse', icon: Navigation },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'methods', label: 'Data & Methods', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeNav, setActiveNav }) => {
  return (
    <aside className="w-[170px] bg-[#070b14] border-r border-[#14203a] flex flex-col shrink-0 select-none">
      {/* Logo */}
      <div className="px-3 pt-4 pb-3 border-b border-[#14203a]">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-900/30">
            <Satellite className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-[11px] font-extrabold tracking-widest text-cyan-300 font-mono leading-none">
              LunarIce Finder
            </div>
            <div className="text-[8px] text-slate-500 mt-0.5 leading-none">
              Chandrayaan-2 Ice Explorer
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-[11px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Branding */}
      <div className="px-3 py-3 border-t border-[#14203a]">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-[#0c1220] border border-[#1a2540] flex items-center justify-center">
            <Satellite className="w-3 h-3 text-cyan-500" />
          </div>
          <div>
            <div className="text-[8px] text-slate-500 leading-none">Powered by</div>
            <div className="text-[9px] text-slate-400 font-medium leading-tight">
              Chandrayaan-2<br />ISRO
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
