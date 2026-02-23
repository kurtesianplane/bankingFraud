import { useState } from 'react';
import { StoreState } from '../store';
import { CheckCircle, XCircle, Eye, Snowflake, ArrowUpCircle, Search, Filter, Terminal } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalystDashboardProps {
  state: StoreState;
  setState: React.Dispatch<React.SetStateAction<StoreState>>;
}

export function AnalystDashboard({ state, setState }: AnalystDashboardProps) {
  const [filter, setFilter] = useState<'all' | 'open' | 'investigating' | 'resolved' | 'false_positive'>('all');
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const alerts = state.fraudAlerts.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false;
    if (searchTerm && !a.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const flaggedTxs = state.transactions.filter(t => t.isFlagged);
  const blockedTxs = state.transactions.filter(t => t.status === 'blocked');
  const openAlerts = state.fraudAlerts.filter(a => a.status === 'open').length;
  const resolvedAlerts = state.fraudAlerts.filter(a => a.status === 'resolved').length;
  const fpAlerts = state.fraudAlerts.filter(a => a.status === 'false_positive').length;

  const truePositives = state.transactions.filter(t => t.isFlagged && t.reviewStatus === 'denied').length;
  const falsePositives = state.transactions.filter(t => t.isFlagged && t.reviewStatus === 'approved').length;
  const totalReviewed = truePositives + falsePositives;
  const detectionRate = flaggedTxs.length > 0 ? ((truePositives / Math.max(flaggedTxs.length, 1)) * 100) : 0;

  const severityData = [
    { name: 'Critical', value: state.fraudAlerts.filter(a => a.severity === 'critical').length, color: '#ef4444' },
    { name: 'High', value: state.fraudAlerts.filter(a => a.severity === 'high').length, color: '#f97316' },
    { name: 'Medium', value: state.fraudAlerts.filter(a => a.severity === 'medium').length, color: '#eab308' },
    { name: 'Low', value: state.fraudAlerts.filter(a => a.severity === 'low').length, color: '#22c55e' },
  ];

  const typeData = [
    { name: 'Transaction', count: state.fraudAlerts.filter(a => a.type === 'transaction').length },
    { name: 'Login', count: state.fraudAlerts.filter(a => a.type === 'login').length },
    { name: 'Pattern', count: state.fraudAlerts.filter(a => a.type === 'pattern').length },
  ];

  const riskDistribution = [
    { range: '0-20', count: state.transactions.filter(t => t.riskScore <= 20).length },
    { range: '21-40', count: state.transactions.filter(t => t.riskScore > 20 && t.riskScore <= 40).length },
    { range: '41-60', count: state.transactions.filter(t => t.riskScore > 40 && t.riskScore <= 60).length },
    { range: '61-80', count: state.transactions.filter(t => t.riskScore > 60 && t.riskScore <= 80).length },
    { range: '81-100', count: state.transactions.filter(t => t.riskScore > 80).length },
  ];

  const handleAction = (alertId: string, action: 'approve' | 'deny' | 'escalate' | 'false_positive' | 'freeze') => {
    setState(prev => {
      const alert = prev.fraudAlerts.find(a => a.id === alertId);
      if (!alert) return prev;
      const updatedAlerts = prev.fraudAlerts.map(a => {
        if (a.id === alertId) return { ...a, status: (action === 'escalate' ? 'investigating' : action === 'false_positive' ? 'false_positive' : 'resolved') as 'investigating' | 'false_positive' | 'resolved', assignedTo: action === 'escalate' ? 'Senior Analyst' : 'Analyst' };
        return a;
      });
      let updatedTxs = prev.transactions;
      if (alert.transactionId) {
        updatedTxs = prev.transactions.map(t => {
          if (t.id === alert.transactionId) return { ...t, reviewStatus: (action === 'approve' ? 'approved' : action === 'deny' ? 'denied' : action === 'false_positive' ? 'approved' : t.reviewStatus) as 'approved' | 'denied' | 'pending' | 'escalated' | null, reviewedBy: 'Analyst', reviewNote: reviewNote || action };
          return t;
        });
      }
      let updatedAccounts = prev.accounts;
      if (action === 'freeze' && alert.transactionId) {
        const tx = prev.transactions.find(t => t.id === alert.transactionId);
        if (tx) updatedAccounts = prev.accounts.map(a => a.userId === tx.fromUserId ? { ...a, isFrozen: true } : a);
      }
      return { ...prev, fraudAlerts: updatedAlerts, transactions: updatedTxs, accounts: updatedAccounts, eventLog: [...prev.eventLog, `[${new Date().toLocaleTimeString()}] [SOC] Alert ${alertId.substring(0, 10)}: ${action.toUpperCase()}`] };
    });
    setReviewNote(''); setSelectedAlert(null);
  };

  const sevBadge = (s: string) => {
    switch (s) {
      case 'critical': return 'bg-red-500/8 text-red-400/70 border-red-500/15';
      case 'high': return 'bg-orange-500/8 text-orange-400/70 border-orange-500/15';
      case 'medium': return 'bg-amber-500/8 text-amber-400/70 border-amber-500/15';
      default: return 'bg-emerald-500/8 text-emerald-400/70 border-emerald-500/15';
    }
  };

  const tooltipStyle = { background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '11px', color: '#a1a1aa' };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">SOC Analyst Dashboard</h2>
        <p className="text-[12px] text-zinc-500 mt-0.5">Security operations — triage, investigate, and respond to fraud alerts</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-6 gap-2.5">
        {[
          { label: 'Total Alerts', value: state.fraudAlerts.length, color: 'text-zinc-200' },
          { label: 'Open', value: openAlerts, color: 'text-red-400/80' },
          { label: 'Resolved', value: resolvedAlerts, color: 'text-emerald-400/80' },
          { label: 'False Positive', value: fpAlerts, color: 'text-amber-400/80' },
          { label: 'Flagged Txns', value: flaggedTxs.length, color: 'text-orange-400/80' },
          { label: 'Blocked', value: blockedTxs.length, color: 'text-purple-400/80' },
        ].map((m, i) => (
          <div key={i} className={`glass-card rounded-xl p-3 text-center stat-card animate-fade-in stagger-${Math.min(i + 1, 6)}`}>
            <div className={`text-xl font-bold tracking-tight ${m.color}`}>{m.value}</div>
            <div className="text-[9px] text-zinc-600 font-medium uppercase tracking-widest mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 animate-fade-in stagger-1">
          <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Severity</h3>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={severityData.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={28} outerRadius={50} dataKey="value" strokeWidth={0}>
                {severityData.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.6} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-3 mt-1">
            {severityData.map(d => (
              <div key={d.name} className="flex items-center gap-1 text-[10px] text-zinc-500">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color, opacity: 0.6 }} />{d.name}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 animate-fade-in stagger-2">
          <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Alert Types</h3>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={typeData}>
              <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#6366f1" opacity={0.5} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-xl p-4 animate-fade-in stagger-3">
          <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-3">Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={riskDistribution}>
              <XAxis dataKey="range" tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#f59e0b" opacity={0.5} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detection Metrics */}
      <div className="glass-card rounded-xl p-5 animate-fade-in">
        <h3 className="text-[13px] font-semibold text-zinc-200 mb-3">Detection Metrics</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'True Positives', value: truePositives, color: 'text-emerald-400/80', desc: 'Correctly flagged' },
            { label: 'False Positives', value: falsePositives, color: 'text-red-400/80', desc: 'Incorrectly flagged' },
            { label: 'Detection Rate', value: `${detectionRate.toFixed(1)}%`, color: 'text-accent/80', desc: 'TP / Flagged' },
            { label: 'Alert Fatigue', value: `${totalReviewed > 0 ? ((falsePositives / totalReviewed) * 100).toFixed(1) : 0}%`, color: 'text-amber-400/80', desc: 'FP / Reviewed' },
          ].map((m, i) => (
            <div key={i} className="text-center">
              <div className={`text-xl font-bold tracking-tight ${m.color}`}>{m.value}</div>
              <div className="text-[10px] text-zinc-400 font-medium mt-0.5">{m.label}</div>
              <div className="text-[9px] text-zinc-700">{m.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alert Queue */}
      <div className="glass-card rounded-xl p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-zinc-200">Alert Queue</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={11} className="absolute left-2.5 top-[7px] text-zinc-600" />
              <input className="bg-surface-2 border border-border-subtle rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-zinc-200 w-44 placeholder:text-zinc-700" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-0.5 bg-surface-2/50 p-0.5 rounded-md border border-border-subtle">
              {(['all', 'open', 'investigating', 'resolved', 'false_positive'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 rounded-[4px] text-[10px] font-medium transition-all ${filter === f ? 'bg-surface-3 text-zinc-300 shadow-sm' : 'text-zinc-600 hover:text-zinc-400'}`}>
                  {f === 'false_positive' ? 'FP' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {alerts.length === 0 ? (
            <p className="text-[11px] text-zinc-700 text-center py-8">No alerts match filter</p>
          ) : (
            alerts.slice().reverse().map(alert => (
              <div key={alert.id} className={`rounded-lg border px-3 py-2.5 text-[11px] transition-all ${selectedAlert === alert.id ? 'border-accent/30 bg-accent/3' : 'border-border-subtle bg-surface-2/20 hover:border-border-default'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold uppercase ${sevBadge(alert.severity)}`}>{alert.severity}</span>
                      <span className="text-zinc-600 text-[10px]">{alert.type}</span>
                      {alert.mitreId && <span className="text-red-400/40 text-[10px] font-mono">{alert.mitreId}</span>}
                      <span className={`text-[10px] ${alert.status === 'open' ? 'text-red-400/60' : alert.status === 'investigating' ? 'text-amber-400/60' : alert.status === 'resolved' ? 'text-emerald-400/60' : 'text-zinc-600'}`}>· {alert.status}</span>
                    </div>
                    <p className="text-zinc-400 leading-relaxed">{alert.description}</p>
                    <div className="text-zinc-700 mt-1 text-[10px]">{new Date(alert.timestamp).toLocaleString()}</div>
                  </div>
                  {(alert.status === 'open' || alert.status === 'investigating') && (
                    <button onClick={() => setSelectedAlert(selectedAlert === alert.id ? null : alert.id)} className="p-1 rounded hover:bg-surface-3 text-zinc-600 hover:text-zinc-400 transition-colors"><Eye size={13} /></button>
                  )}
                </div>

                {selectedAlert === alert.id && (
                  <div className="mt-2.5 pt-2.5 border-t border-border-subtle space-y-2 animate-fade-in-fast">
                    <input className="w-full bg-surface-2 border border-border-subtle rounded-md px-2.5 py-1.5 text-[11px] text-zinc-200 placeholder:text-zinc-700" placeholder="Review notes..." value={reviewNote} onChange={e => setReviewNote(e.target.value)} />
                    <div className="flex gap-1.5">
                      {[
                        { action: 'approve' as const, label: 'Approve', icon: <CheckCircle size={10} />, style: 'text-emerald-400/70 bg-emerald-500/5 border-emerald-500/12 hover:bg-emerald-500/10' },
                        { action: 'deny' as const, label: 'Deny', icon: <XCircle size={10} />, style: 'text-red-400/70 bg-red-500/5 border-red-500/12 hover:bg-red-500/10' },
                        { action: 'escalate' as const, label: 'Escalate', icon: <ArrowUpCircle size={10} />, style: 'text-amber-400/70 bg-amber-500/5 border-amber-500/12 hover:bg-amber-500/10' },
                        { action: 'false_positive' as const, label: 'FP', icon: <Filter size={10} />, style: 'text-zinc-400 bg-surface-2 border-border-subtle hover:bg-surface-3' },
                        { action: 'freeze' as const, label: 'Freeze', icon: <Snowflake size={10} />, style: 'text-blue-400/70 bg-blue-500/5 border-blue-500/12 hover:bg-blue-500/10' },
                      ].map(btn => (
                        <button key={btn.action} onClick={() => handleAction(alert.id, btn.action)} className={`flex items-center gap-1 px-2 py-1 border rounded-md text-[10px] font-medium transition-all ${btn.style}`}>
                          {btn.icon} {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Audit Trail */}
      <div className="glass-card rounded-xl p-5 animate-fade-in">
        <h3 className="text-[13px] font-semibold text-zinc-200 mb-3 flex items-center gap-2"><Terminal size={13} className="text-zinc-500" /> Audit Trail</h3>
        <div className="bg-surface-0 rounded-lg p-3 font-mono text-[11px] max-h-44 overflow-y-auto space-y-px border border-border-subtle">
          {state.eventLog.slice(-30).reverse().map((log, i) => (
            <div key={i} className={`leading-relaxed ${
              log.includes('[SOC]') ? 'text-purple-400/60' :
              log.includes('[SECURITY]') || log.includes('[BLOCKED]') ? 'text-red-400/60' :
              log.includes('[TRANSFER]') ? 'text-emerald-400/60' :
              log.includes('[AUTH]') ? 'text-blue-400/60' :
              'text-zinc-700'
            }`}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
