import { NavigationTab } from '../types';
import { 
  Building2, ShieldAlert, Swords, Shield, BarChart3, Brain, Radar, FileText, ChevronRight 
} from 'lucide-react';

const tabs: { id: NavigationTab; label: string; phase: string; icon: React.ReactNode }[] = [
  { id: 'banking', label: 'Core Banking', phase: '01', icon: <Building2 size={16} /> },
  { id: 'fraud-detection', label: 'Fraud Detection', phase: '02', icon: <ShieldAlert size={16} /> },
  { id: 'attack-sim', label: 'Attack Simulation', phase: '03', icon: <Swords size={16} /> },
  { id: 'defenses', label: 'Defensive Controls', phase: '04', icon: <Shield size={16} /> },
  { id: 'dashboard', label: 'Analyst Dashboard', phase: '05', icon: <BarChart3 size={16} /> },
  { id: 'ml-detection', label: 'ML Detection', phase: '06', icon: <Brain size={16} /> },
  { id: 'threat-intel', label: 'Threat Intel', phase: '07', icon: <Radar size={16} /> },
  { id: 'compliance', label: 'Compliance', phase: '08', icon: <FileText size={16} /> },
];

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  alertCount: number;
}

export function Sidebar({ activeTab, onTabChange, alertCount }: SidebarProps) {
  return (
    <div className="w-60 bg-surface-1 border-r border-border-subtle flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center animate-pulse-glow">
            <Shield size={15} className="text-accent" />
          </div>
          <div>
            <h1 className="text-[13px] font-semibold text-zinc-100 tracking-tight leading-none">Sentinel</h1>
            <p className="text-[10px] text-zinc-500 font-medium tracking-widest uppercase mt-0.5">Fraud Sandbox</p>
          </div>
        </div>
      </div>

      {/* Navigation (scrollable) */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-2.5 mb-3">Modules</p>
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left group transition-all duration-200 animate-fade-in stagger-${Math.min(i + 1, 6)} ${
              activeTab === tab.id
                ? 'bg-accent/8 text-zinc-100'
                : 'text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-300'
            }`}
          >
            <span className={`flex-shrink-0 transition-colors duration-200 ${
              activeTab === tab.id ? 'text-accent' : 'text-zinc-600 group-hover:text-zinc-400'
            }`}>{tab.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium truncate leading-tight">{tab.label}</div>
            </div>
            <span className={`text-[10px] font-mono tabular-nums transition-colors duration-200 ${
              activeTab === tab.id ? 'text-accent/60' : 'text-zinc-700'
            }`}>{tab.phase}</span>
            {tab.id === 'dashboard' && alertCount > 0 && (
              <span className="absolute right-3 bg-red-500/90 text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
            <ChevronRight size={12} className={`flex-shrink-0 transition-all duration-200 ${
              activeTab === tab.id ? 'opacity-60 text-accent' : 'opacity-0 group-hover:opacity-30'
            }`} />
          </button>
        ))}
      </nav>

      {/* Sticky bottom section */}
      <div className="sticky bottom-0 z-10 bg-surface-1">
        {/* Status */}
        <div className="px-4 py-4 border-t border-border-subtle">
          <div className="px-2.5 py-2 rounded-lg bg-surface-2/60 border border-border-subtle">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-dot-pulse" />
              <span className="text-[11px] text-zinc-500 font-medium">Sandbox Active</span>
            </div>
          </div>
        </div>
        {/* Creator Info */}
        <div className="px-4 pb-4">
          <div className="text-[11px] text-zinc-500 font-medium text-center">
            created by <a href="https://kurtesianplane.github.io/" target="_blank" rel="noopener noreferrer" className="underline text-accent">kurtesianplane</a>
          </div>
        </div>
      </div>
    </div>
  );
}
