import { StoreState } from '../store';
import { AlertTriangle, TrendingUp, Activity, Clock, Globe, Smartphone, DollarSign, ArrowRight, BarChart2 } from 'lucide-react';

interface FraudDetectionProps {
  state: StoreState;
}

export function FraudDetection({ state }: FraudDetectionProps) {
  const flaggedTxs = state.transactions.filter(t => t.isFlagged);
  const avgRisk = state.transactions.length > 0
    ? Math.round(state.transactions.reduce((sum, t) => sum + t.riskScore, 0) / state.transactions.length)
    : 0;

  const rules = [
    { icon: <DollarSign size={14} />, name: 'Large Transaction', condition: 'amount > ₱50,000', weight: '+30', triggered: state.transactions.filter(t => t.fraudReasons.some(r => r.includes('Large'))).length },
    { icon: <Clock size={14} />, name: 'High Velocity', condition: '3+ txns in 1 minute', weight: '+25', triggered: state.transactions.filter(t => t.fraudReasons.some(r => r.includes('Velocity'))).length },
    { icon: <Globe size={14} />, name: 'Unknown IP', condition: 'IP not in known list', weight: '+20', triggered: state.transactions.filter(t => t.fraudReasons.some(r => r.includes('Unknown IP'))).length },
    { icon: <Smartphone size={14} />, name: 'New Device', condition: 'device not recognized', weight: '+15', triggered: state.transactions.filter(t => t.fraudReasons.some(r => r.includes('Unknown device'))).length },
    { icon: <AlertTriangle size={14} />, name: 'New Account Dest', condition: 'dest age < 7 days', weight: '+20', triggered: state.transactions.filter(t => t.fraudReasons.some(r => r.includes('new account'))).length },
    { icon: <Globe size={14} />, name: 'Foreign Location', condition: 'geo not PH', weight: '+15', triggered: state.transactions.filter(t => t.fraudReasons.some(r => r.includes('Foreign'))).length },
    { icon: <Clock size={14} />, name: 'Off-Hours', condition: 'before 6 AM or after 11 PM', weight: '+10', triggered: state.transactions.filter(t => t.fraudReasons.some(r => r.includes('Off-hours'))).length },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Rule-Based Fraud Detection</h2>
        <p className="text-[12px] text-zinc-500 mt-0.5">Deterministic rules engine for identifying suspicious transaction patterns</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: <Activity size={15} />, label: 'Total Transactions', value: state.transactions.length, color: 'text-zinc-200' },
          { icon: <AlertTriangle size={15} />, label: 'Flagged', value: flaggedTxs.length, color: 'text-amber-400/80' },
          { icon: <TrendingUp size={15} />, label: 'Blocked', value: state.transactions.filter(t => t.status === 'blocked').length, color: 'text-red-400/80' },
          { icon: <BarChart2 size={15} />, label: 'Avg Risk Score', value: avgRisk, color: 'text-accent' },
        ].map((m, i) => (
          <div key={i} className={`glass-card rounded-xl p-4 stat-card animate-fade-in stagger-${i + 1}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-zinc-600">{m.icon}</span>
            </div>
            <div className={`text-2xl font-bold tracking-tight ${m.color}`}>{m.value}</div>
            <div className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Detection Rules */}
      <div className="glass-card rounded-xl p-5 animate-fade-in">
        <h3 className="text-[13px] font-semibold text-zinc-200 mb-1">Active Detection Rules</h3>
        <p className="text-[11px] text-zinc-600 mb-4">Transactions scoring ≥ 40 are flagged for review. Rules are cumulative.</p>
        <div className="space-y-1">
          {rules.map((rule, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-2/40 transition-colors group">
              <span className="text-zinc-600 group-hover:text-zinc-500 transition-colors">{rule.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-zinc-300">{rule.name}</span>
                  <span className="text-[10px] font-mono text-accent/60 bg-accent/5 px-1.5 py-0.5 rounded">{rule.weight}</span>
                </div>
                <div className="text-[11px] text-zinc-600 font-mono mt-0.5">if ({rule.condition})</div>
              </div>
              <div className="text-right min-w-[48px]">
                <div className={`text-[13px] font-semibold tabular-nums ${rule.triggered > 0 ? 'text-amber-400/80' : 'text-zinc-700'}`}>{rule.triggered}</div>
                <div className="text-[9px] text-zinc-700 uppercase tracking-wider">hits</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk Score Scale */}
      <div className="glass-card rounded-xl p-5 animate-fade-in">
        <h3 className="text-[13px] font-semibold text-zinc-200 mb-3">Risk Score Spectrum</h3>
        <div className="flex gap-px items-end h-8 rounded-lg overflow-hidden">
          {Array.from({ length: 100 }, (_, i) => (
            <div key={i} className="flex-1" style={{
              height: `${12 + i * 0.2}px`,
              backgroundColor: i < 20 ? `rgba(52,211,153,${0.2 + (i/100)*0.6})` :
                i < 40 ? `rgba(52,211,153,${0.3 + (i/100)*0.5})` :
                i < 60 ? `rgba(245,158,11,${0.3 + (i/100)*0.5})` :
                i < 80 ? `rgba(239,68,68,${0.3 + (i/100)*0.4})` :
                `rgba(239,68,68,${0.4 + (i/100)*0.5})`
            }} />
          ))}
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-medium">
          <span className="text-emerald-500/60">0 — Safe</span>
          <span className="text-amber-500/60">40 — Flag threshold</span>
          <span className="text-red-400/60">80+ — Critical</span>
        </div>
      </div>

      {/* Flagged Transactions */}
      <div className="glass-card rounded-xl p-5 animate-fade-in">
        <h3 className="text-[13px] font-semibold text-zinc-200 mb-3">Flagged Transactions</h3>
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {flaggedTxs.length === 0 ? (
            <p className="text-[11px] text-zinc-700 text-center py-8">No flagged transactions. Run transfers or attacks to generate alerts.</p>
          ) : (
            flaggedTxs.slice().reverse().map(tx => {
              const fromUser = state.users.find(u => u.id === tx.fromUserId);
              const toUser = state.users.find(u => u.id === tx.toUserId);
              return (
                <div key={tx.id} className={`px-3 py-3 rounded-lg border text-[11px] ${
                  tx.riskScore >= 80 ? 'bg-red-500/3 border-red-500/10' :
                  tx.riskScore >= 60 ? 'bg-orange-500/3 border-orange-500/10' :
                  'bg-amber-500/3 border-amber-500/10'
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-zinc-300">{fromUser?.fullName} <ArrowRight size={10} className="inline mx-1 text-zinc-600" /> {toUser?.fullName}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-200 font-mono tabular-nums">₱{tx.amount.toLocaleString()}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold font-mono tabular-nums ${
                        tx.riskScore >= 80 ? 'bg-red-500/10 text-red-400/80' :
                        tx.riskScore >= 60 ? 'bg-orange-500/10 text-orange-400/80' :
                        'bg-amber-500/10 text-amber-400/80'
                      }`}>{tx.riskScore}</span>
                    </div>
                  </div>
                  <div className="text-zinc-600 font-mono">{tx.ip} · {tx.device} · {tx.geoLocation}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {tx.fraudReasons.map((r, j) => (
                      <span key={j} className="bg-surface-2 text-zinc-500 px-1.5 py-0.5 rounded text-[10px] border border-border-subtle">{r}</span>
                    ))}
                  </div>
                  {tx.attackScenario && (
                    <div className="mt-1.5 text-[10px] text-red-400/60 font-medium">
                      {tx.attackScenario} — MITRE {tx.mitreAttackTechnique}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Behavioral Profiles */}
      <div className="glass-card rounded-xl p-5 animate-fade-in">
        <h3 className="text-[13px] font-semibold text-zinc-200 mb-1">Behavioral Profiles (UEBA)</h3>
        <p className="text-[11px] text-zinc-600 mb-4">User baselines for anomaly detection via deviation scoring</p>
        <div className="grid grid-cols-2 gap-3">
          {state.behaviorProfiles.map(profile => {
            const user = state.users.find(u => u.id === profile.userId);
            const userTxs = state.transactions.filter(t => t.fromUserId === profile.userId);
            const flaggedCount = userTxs.filter(t => t.isFlagged).length;
            const userAvgRisk = userTxs.length > 0 ? Math.round(userTxs.reduce((s, t) => s + t.riskScore, 0) / userTxs.length) : 0;
            return (
              <div key={profile.userId} className="bg-surface-2/30 border border-border-subtle rounded-lg p-3 text-[11px] hover:border-border-default transition-all">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-accent/8 border border-accent/15 flex items-center justify-center text-[10px] text-accent font-semibold">
                      {user?.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-zinc-200 font-medium text-[12px]">{user?.fullName}</div>
                      <div className="text-zinc-600 text-[10px]">{user?.accountAge}d old</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[13px] font-bold tabular-nums ${userAvgRisk >= 50 ? 'text-red-400/80' : userAvgRisk >= 25 ? 'text-amber-400/80' : 'text-emerald-400/80'}`}>{userAvgRisk}</div>
                    <div className="text-[9px] text-zinc-700 uppercase tracking-wider">avg risk</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[
                    { v: `₱${profile.avgTransactionAmount.toLocaleString()}`, l: 'Avg Amt' },
                    { v: userTxs.length, l: 'Txns' },
                    { v: flaggedCount, l: 'Flagged' },
                  ].map((d, i) => (
                    <div key={i} className="bg-surface-0/50 rounded px-2 py-1.5 text-center">
                      <div className="text-zinc-300 font-medium font-mono tabular-nums text-[11px]">{d.v}</div>
                      <div className="text-[9px] text-zinc-700">{d.l}</div>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-zinc-600">
                  Hours: {profile.typicalHours[0]}:00–{profile.typicalHours[1]}:00 · {profile.typicalGeos.join(', ') || 'N/A'}
                </div>
                {userTxs.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="text-[9px] text-zinc-700">Risk</span>
                    <div className="flex-1 flex gap-0.5 items-end h-4">
                      {userTxs.slice(-12).map((t, i) => (
                        <div key={i} className="flex-1 rounded-sm transition-all" style={{
                          height: `${Math.max(2, (t.riskScore / 100) * 16)}px`,
                          backgroundColor: t.riskScore >= 60 ? 'rgba(239,68,68,0.5)' : t.riskScore >= 40 ? 'rgba(245,158,11,0.5)' : 'rgba(52,211,153,0.4)'
                        }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Concepts */}
      <div className="glass-card rounded-xl p-5 animate-fade-in">
        <h3 className="text-[13px] font-semibold text-zinc-200 mb-3">Applied Concepts</h3>
        <div className="grid grid-cols-4 gap-2">
          {[
            { name: 'Anomaly Detection', desc: 'Patterns deviating from expected behavior' },
            { name: 'Risk Scoring', desc: 'Quantifying threat level numerically' },
            { name: 'UEBA', desc: 'User Entity Behavior Analytics' },
            { name: 'Detection Engineering', desc: 'Building and tuning detection rules' },
          ].map(c => (
            <div key={c.name} className="bg-surface-2/40 rounded-lg p-3 border border-border-subtle">
              <div className="text-[11px] font-medium text-accent/70">{c.name}</div>
              <div className="text-[10px] text-zinc-600 mt-1 leading-relaxed">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
