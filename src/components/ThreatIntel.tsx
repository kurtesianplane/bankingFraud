import { useState } from 'react';
import { StoreState, generateId, correlateThreatIntel } from '../store';
import { ThreatIntelIndicator } from '../types';
import { Radar, Globe, AlertTriangle, Search, Eye, EyeOff, Plus, Zap, Database, Network, Tag, Clock, FileCode2 } from 'lucide-react';

interface ThreatIntelProps {
  state: StoreState;
  setState: React.Dispatch<React.SetStateAction<StoreState>>;
}

export function ThreatIntel({ state, setState }: ThreatIntelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const [correlateIP, setCorrelateIP] = useState('');
  const [correlationResults, setCorrelationResults] = useState<ThreatIntelIndicator[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIndicator, setNewIndicator] = useState({ type: 'ip' as ThreatIntelIndicator['type'], value: '', threatActor: '', description: '', severity: 'medium' as ThreatIntelIndicator['severity'], tags: '' });
  const [activeView, setActiveView] = useState<'indicators' | 'actors' | 'stix'>('indicators');

  const filtered = state.threatIntel.filter(i => {
    if (searchTerm && !i.value.toLowerCase().includes(searchTerm.toLowerCase()) && !i.threatActor.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const threatActors = [...new Set(state.threatIntel.map(i => i.threatActor))];

  const handleCorrelate = () => {
    const results = correlateThreatIntel(state, { ip: correlateIP, device: correlateIP, email: correlateIP, accountNumber: correlateIP });
    setCorrelationResults(results);
    setState(prev => ({ ...prev, eventLog: [...prev.eventLog, `[${new Date().toLocaleTimeString()}] [THREAT-INTEL] Correlation: "${correlateIP}" → ${results.length} matches`] }));
  };

  const addIndicator = () => {
    const indicator: ThreatIntelIndicator = { id: generateId(), type: newIndicator.type, value: newIndicator.value, threatActor: newIndicator.threatActor || 'Unknown', confidence: 50, severity: newIndicator.severity, source: 'Manual Entry', firstSeen: Date.now(), lastSeen: Date.now(), tags: newIndicator.tags.split(',').map(t => t.trim()).filter(Boolean), stixType: `indicator--${newIndicator.type}`, description: newIndicator.description || `Manual ${newIndicator.type} indicator`, active: true };
    setState(prev => ({ ...prev, threatIntel: [...prev.threatIntel, indicator], eventLog: [...prev.eventLog, `[${new Date().toLocaleTimeString()}] [THREAT-INTEL] IOC added: ${indicator.value}`] }));
    setNewIndicator({ type: 'ip', value: '', threatActor: '', description: '', severity: 'medium', tags: '' }); setShowAddForm(false);
  };

  const toggleIndicator = (id: string) => {
    setState(prev => ({ ...prev, threatIntel: prev.threatIntel.map(i => i.id === id ? { ...i, active: !i.active } : i) }));
  };

  const sevBadge = (s: string) => { switch (s) { case 'critical': return 'bg-red-500/8 text-red-400/70 border-red-500/15'; case 'high': return 'bg-orange-500/8 text-orange-400/70 border-orange-500/15'; case 'medium': return 'bg-amber-500/8 text-amber-400/70 border-amber-500/15'; default: return 'bg-emerald-500/8 text-emerald-400/70 border-emerald-500/15'; } };
  const typeIcon = (t: string) => { switch (t) { case 'ip': return <Globe size={11} />; case 'email': return <Tag size={11} />; case 'device': return <Zap size={11} />; case 'account': return <Database size={11} />; default: return <Network size={11} />; } };

  const enrichedStats = {
    totalIOCs: state.threatIntel.length,
    activeIOCs: state.threatIntel.filter(i => i.active).length,
    hitInTx: state.transactions.filter(t => state.threatIntel.some(i => i.active && ((i.type === 'ip' && i.value === t.ip) || (i.type === 'device' && i.value === t.device)))).length,
    hitInLogins: state.loginLogs.filter(l => state.threatIntel.some(i => i.active && ((i.type === 'ip' && i.value === l.ip) || (i.type === 'device' && i.value === l.device)))).length,
    actors: threatActors.length,
    critical: state.threatIntel.filter(i => i.severity === 'critical').length
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Threat Intelligence</h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">IOC management, threat actor profiles, and STIX/TAXII simulation</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="flex items-center gap-1.5 bg-accent/8 text-accent/70 border border-accent/15 px-3 py-1.5 rounded-lg text-[11px] font-medium hover:bg-accent/12">
          <Plus size={12} /> Add IOC
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-2.5">
        {[
          { label: 'Total IOCs', value: enrichedStats.totalIOCs, color: 'text-zinc-200' },
          { label: 'Active', value: enrichedStats.activeIOCs, color: 'text-emerald-400/80' },
          { label: 'Critical', value: enrichedStats.critical, color: 'text-red-400/80' },
          { label: 'Actors', value: enrichedStats.actors, color: 'text-purple-400/80' },
          { label: 'TX Hits', value: enrichedStats.hitInTx, color: 'text-orange-400/80' },
          { label: 'Login Hits', value: enrichedStats.hitInLogins, color: 'text-amber-400/80' },
        ].map((s, i) => (
          <div key={i} className={`glass-card rounded-xl p-3 text-center stat-card animate-fade-in stagger-${Math.min(i + 1, 6)}`}>
            <div className={`text-xl font-bold tracking-tight ${s.color}`}>{s.value}</div>
            <div className="text-[9px] text-zinc-600 font-medium uppercase tracking-widest mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add IOC Form */}
      {showAddForm && (
        <div className="glass-card rounded-xl p-5 space-y-3 animate-scale-in border-accent/15">
          <h3 className="text-[13px] font-semibold text-zinc-200">Add Indicator of Compromise</h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-zinc-500 font-medium block mb-1.5">Type</label>
              <select className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-[12px] text-zinc-200" value={newIndicator.type} onChange={e => setNewIndicator(f => ({ ...f, type: e.target.value as ThreatIntelIndicator['type'] }))}>
                <option value="ip">IP Address</option><option value="email">Email</option><option value="device">Device</option><option value="account">Account</option><option value="pattern">Pattern</option>
              </select>
            </div>
            <div><label className="text-[11px] text-zinc-500 font-medium block mb-1.5">Value</label><input className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-[12px] text-zinc-200 font-mono placeholder:text-zinc-700" value={newIndicator.value} onChange={e => setNewIndicator(f => ({ ...f, value: e.target.value }))} placeholder="192.168.1.1" /></div>
            <div><label className="text-[11px] text-zinc-500 font-medium block mb-1.5">Threat Actor</label><input className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-[12px] text-zinc-200 placeholder:text-zinc-700" value={newIndicator.threatActor} onChange={e => setNewIndicator(f => ({ ...f, threatActor: e.target.value }))} placeholder="APT-FIN7" /></div>
            <div>
              <label className="text-[11px] text-zinc-500 font-medium block mb-1.5">Severity</label>
              <select className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-[12px] text-zinc-200" value={newIndicator.severity} onChange={e => setNewIndicator(f => ({ ...f, severity: e.target.value as ThreatIntelIndicator['severity'] }))}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
              </select>
            </div>
            <div><label className="text-[11px] text-zinc-500 font-medium block mb-1.5">Tags</label><input className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-[12px] text-zinc-200 placeholder:text-zinc-700" value={newIndicator.tags} onChange={e => setNewIndicator(f => ({ ...f, tags: e.target.value }))} placeholder="apt, banking" /></div>
            <div><label className="text-[11px] text-zinc-500 font-medium block mb-1.5">Description</label><input className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-[12px] text-zinc-200 placeholder:text-zinc-700" value={newIndicator.description} onChange={e => setNewIndicator(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" /></div>
          </div>
          <button onClick={addIndicator} className="w-full bg-accent hover:bg-accent-muted text-white font-medium py-2 rounded-lg text-[12px]">Add Indicator</button>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex gap-1 bg-surface-2/50 p-1 rounded-lg border border-border-subtle w-fit">
        {([
          { id: 'indicators' as const, label: 'IOC Feed', icon: <Radar size={12} /> },
          { id: 'actors' as const, label: 'Threat Actors', icon: <AlertTriangle size={12} /> },
          { id: 'stix' as const, label: 'STIX Objects', icon: <FileCode2 size={12} /> },
        ]).map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${activeView === v.id ? 'bg-surface-3 text-zinc-200 shadow-sm' : 'text-zinc-500 hover:text-zinc-400'}`}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* Correlation */}
      <div className="glass-card rounded-xl p-5 animate-fade-in">
        <h3 className="text-[13px] font-semibold text-zinc-200 mb-3 flex items-center gap-2"><Search size={13} className="text-zinc-500" /> Correlation Engine</h3>
        <div className="flex gap-2 mb-3">
          <input className="flex-1 bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-[12px] text-zinc-200 font-mono placeholder:text-zinc-700" placeholder="Search IP, device, email, or account..." value={correlateIP} onChange={e => setCorrelateIP(e.target.value)} />
          <button onClick={handleCorrelate} className="bg-accent/8 text-accent/70 border border-accent/15 px-4 py-2 rounded-lg text-[12px] font-medium hover:bg-accent/12">Correlate</button>
        </div>
        {correlationResults.length > 0 && (
          <div className="bg-red-500/3 border border-red-500/10 rounded-lg p-3 space-y-1.5 animate-scale-in">
            <div className="text-[11px] text-red-400/70 font-medium">{correlationResults.length} match(es) found</div>
            {correlationResults.map(r => (
              <div key={r.id} className="bg-surface-2/40 rounded-lg p-2 text-[11px] border border-border-subtle">
                <div className="flex items-center justify-between"><span className="text-zinc-200 font-medium">{r.threatActor}</span><span className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold ${sevBadge(r.severity)}`}>{r.severity}</span></div>
                <div className="text-zinc-500 mt-0.5">{r.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* IOC Feed */}
      {activeView === 'indicators' && (
        <div className="glass-card rounded-xl p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-semibold text-zinc-200">IOC Feed ({filtered.length})</h3>
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-[7px] text-zinc-600" />
              <input className="bg-surface-2 border border-border-subtle rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-zinc-200 w-44 placeholder:text-zinc-700" placeholder="Filter..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {filtered.map(ind => (
              <div key={ind.id} className={`rounded-lg border px-3 py-2.5 text-[11px] cursor-pointer transition-all ${selectedIndicator === ind.id ? 'border-accent/30 bg-accent/3' : 'border-border-subtle bg-surface-2/20 hover:border-border-default'} ${!ind.active ? 'opacity-40' : ''}`}
                onClick={() => setSelectedIndicator(selectedIndicator === ind.id ? null : ind.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-accent/50">{typeIcon(ind.type)}</span>
                    <span className="font-mono text-zinc-200 font-medium">{ind.value}</span>
                    <span className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold ${sevBadge(ind.severity)}`}>{ind.severity}</span>
                    <span className="text-zinc-700 text-[10px] uppercase">{ind.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600 font-mono">{ind.confidence}%</span>
                    <button onClick={e => { e.stopPropagation(); toggleIndicator(ind.id); }} className="text-zinc-700 hover:text-zinc-400 transition-colors">
                      {ind.active ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-purple-400/50 text-[10px]">{ind.threatActor}</span>
                  <span className="text-zinc-800">·</span>
                  <span className="text-zinc-700 text-[10px]">{ind.source}</span>
                </div>
                {selectedIndicator === ind.id && (
                  <div className="mt-2 pt-2 border-t border-border-subtle space-y-1.5 animate-fade-in-fast">
                    <div className="text-zinc-400 leading-relaxed">{ind.description}</div>
                    <div className="flex flex-wrap gap-1">
                      {ind.tags.map(tag => <span key={tag} className="bg-accent/5 text-accent/50 px-1.5 py-0.5 rounded text-[10px]">#{tag}</span>)}
                    </div>
                    <div className="flex gap-4 text-[10px] text-zinc-600 font-mono">
                      <span><Clock size={9} className="inline mr-1" />{new Date(ind.firstSeen).toLocaleDateString()}</span>
                      <span>{ind.stixType}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Threat Actors */}
      {activeView === 'actors' && (
        <div className="glass-card rounded-xl p-5 animate-fade-in">
          <h3 className="text-[13px] font-semibold text-zinc-200 mb-3">Threat Actor Profiles</h3>
          <div className="grid grid-cols-2 gap-3">
            {threatActors.map(actor => {
              const indicators = state.threatIntel.filter(i => i.threatActor === actor);
              const maxSev = indicators.reduce((max, i) => { const o: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }; return (o[i.severity] || 0) > (o[max] || 0) ? i.severity : max; }, 'low' as string);
              const techniques = [...new Set(indicators.flatMap(i => i.tags))];
              return (
                <div key={actor} className="bg-surface-2/30 border border-border-subtle rounded-xl p-4 hover:border-border-default transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[12px] font-semibold text-zinc-200">{actor}</h4>
                    <span className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold ${sevBadge(maxSev)}`}>{maxSev}</span>
                  </div>
                  <div className="text-[10px] text-zinc-600 mb-2">{indicators.length} IOCs</div>
                  <div className="space-y-1 mb-2">
                    {indicators.slice(0, 3).map(i => (
                      <div key={i.id} className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-accent/40">{typeIcon(i.type)}</span>
                        <span className="text-zinc-400 font-mono">{i.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {techniques.slice(0, 4).map(t => <span key={t} className="bg-purple-500/5 text-purple-400/50 px-1.5 py-0.5 rounded text-[10px]">{t}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STIX */}
      {activeView === 'stix' && (
        <div className="glass-card rounded-xl p-5 animate-fade-in">
          <h3 className="text-[13px] font-semibold text-zinc-200 mb-3">STIX 2.1 Objects</h3>
          <div className="bg-surface-0 rounded-lg p-4 font-mono text-[11px] max-h-80 overflow-y-auto space-y-3 border border-border-subtle">
            {state.threatIntel.map(i => (
              <div key={i.id} className="border-b border-border-subtle pb-2.5 last:border-0">
                <div className="text-emerald-400/60">{'{'}</div>
                <div className="pl-4 text-blue-400/60">"type": <span className="text-amber-400/60">"{i.stixType}"</span>,</div>
                <div className="pl-4 text-blue-400/60">"id": <span className="text-amber-400/60">"{i.stixType}--{i.id}"</span>,</div>
                <div className="pl-4 text-blue-400/60">"pattern": <span className="text-amber-400/60">"[{i.type}:value = '{i.value}']"</span>,</div>
                <div className="pl-4 text-blue-400/60">"confidence": <span className="text-purple-400/60">{i.confidence}</span>,</div>
                <div className="pl-4 text-blue-400/60">"labels": <span className="text-amber-400/60">[{i.tags.map(t => `"${t}"`).join(', ')}]</span></div>
                <div className="text-emerald-400/60">{'}'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
