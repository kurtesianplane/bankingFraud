import { useState } from 'react';
import { NavigationTab } from './types';
import { createInitialState, StoreState } from './store';
import { Sidebar } from './components/Sidebar';
import { CoreBanking } from './components/CoreBanking';
import { FraudDetection } from './components/FraudDetection';
import { AttackSimulation } from './components/AttackSimulation';
import { DefensiveControls } from './components/DefensiveControls';
import { AnalystDashboard } from './components/AnalystDashboard';
import { MLDetection } from './components/MLDetection';
import { ThreatIntel } from './components/ThreatIntel';
import { Compliance } from './components/Compliance';
import { Terminal, X, RotateCcw } from 'lucide-react';

const tabLabels: Record<NavigationTab, string> = {
  banking: 'Core Banking Simulation',
  'fraud-detection': 'Rule-Based Fraud Detection',
  'attack-sim': 'Attack Simulation — Red Team',
  defenses: 'Defensive Controls — Blue Team',
  dashboard: 'SOC Analyst Dashboard',
  'ml-detection': 'Machine Learning Detection',
  'threat-intel': 'Threat Intelligence',
  compliance: 'Compliance & Reporting',
};

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('banking');
  const [state, setState] = useState<StoreState>(createInitialState);
  const [showEventLog, setShowEventLog] = useState(false);

  const openAlerts = state.fraudAlerts.filter(a => a.status === 'open').length;

  const renderContent = () => {
    switch (activeTab) {
      case 'banking': return <CoreBanking state={state} setState={setState} />;
      case 'fraud-detection': return <FraudDetection state={state} />;
      case 'attack-sim': return <AttackSimulation state={state} setState={setState} />;
      case 'defenses': return <DefensiveControls state={state} setState={setState} />;
      case 'dashboard': return <AnalystDashboard state={state} setState={setState} />;
      case 'ml-detection': return <MLDetection state={state} />;
      case 'threat-intel': return <ThreatIntel state={state} setState={setState} />;
      case 'compliance': return <Compliance state={state} setState={setState} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-surface-0 text-zinc-200 font-sans">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} alertCount={openAlerts} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-11 border-b border-border-subtle flex items-center justify-between px-5 bg-surface-0/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-[12px] font-medium text-zinc-400 tracking-tight">
              {tabLabels[activeTab]}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 text-[11px] text-zinc-600 font-mono tabular-nums mr-2">
              <span>{state.users.length} users</span>
              <span className="text-zinc-800">·</span>
              <span>{state.transactions.length} txns</span>
              <span className="text-zinc-800">·</span>
              <span className={openAlerts > 0 ? 'text-red-400/80' : ''}>{openAlerts} alerts</span>
            </div>
            <button
              onClick={() => setShowEventLog(!showEventLog)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                showEventLog
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'bg-surface-2 text-zinc-500 border border-border-subtle hover:text-zinc-400 hover:border-border-default'
              }`}
            >
              <Terminal size={11} /> Log
            </button>
            <button
              onClick={() => setState(createInitialState())}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-surface-2 text-zinc-500 border border-border-subtle hover:text-zinc-400 hover:border-border-default"
            >
              <RotateCcw size={11} /> Reset
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-[1120px] mx-auto px-6 py-6 animate-fade-in" key={activeTab}>
            {renderContent()}
          </div>
        </main>

        {/* Event Log Panel */}
        {showEventLog && (
          <div className="border-t border-border-subtle bg-surface-1 animate-slide-up">
            <div className="flex items-center justify-between px-5 py-2 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <Terminal size={11} className="text-accent" />
                <span className="text-[11px] font-medium text-zinc-400">Event Log</span>
                <span className="text-[10px] text-zinc-600 font-mono">{state.eventLog.length}</span>
              </div>
              <button onClick={() => setShowEventLog(false)} className="text-zinc-600 hover:text-zinc-400 transition-colors"><X size={13} /></button>
            </div>
            <div className="px-5 py-3 font-mono text-[11px] max-h-44 overflow-y-auto space-y-px">
              {state.eventLog.slice(-50).reverse().map((log, i) => (
                <div key={i} className={`leading-relaxed ${
                  log.includes('[BLOCKED]') || log.includes('[SECURITY]') ? 'text-red-400/70' :
                  log.includes('[AUTH]') ? 'text-blue-400/70' :
                  log.includes('[TRANSFER]') ? 'text-emerald-400/70' :
                  log.includes('[SOC]') ? 'text-purple-400/70' :
                  log.includes('[DEFENSE]') ? 'text-cyan-400/70' :
                  log.includes('ATO') || log.includes('PHISHING') || log.includes('AML') ? 'text-orange-400/70' :
                  'text-zinc-600'
                }`}>{log}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
