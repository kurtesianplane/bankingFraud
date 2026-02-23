import { StoreState } from '../store';
import { Shield, Settings, Lock, Clock, Fingerprint, Banknote, Globe, ShieldCheck } from 'lucide-react';

interface DefensiveControlsProps {
  state: StoreState;
  setState: React.Dispatch<React.SetStateAction<StoreState>>;
}

const iconMap: Record<string, React.ReactNode> = {
  rate_limiting: <Clock size={16} />, lockout: <Lock size={16} />, mfa: <Fingerprint size={16} />,
  transaction_limit: <Banknote size={16} />, ip_blacklist: <Globe size={16} />, step_up_auth: <ShieldCheck size={16} />,
};

const conceptMap: Record<string, string[]> = {
  rate_limiting: ['Zero Trust', 'Defense in Depth'],
  lockout: ['Access Control', 'Adaptive Auth'],
  mfa: ['Multi-Factor Auth', 'Risk-Based Auth'],
  transaction_limit: ['Transaction Monitoring', 'Fraud Prevention'],
  ip_blacklist: ['Threat Intelligence', 'IP Reputation'],
  step_up_auth: ['Adaptive Auth', 'Zero Trust'],
};

export function DefensiveControls({ state, setState }: DefensiveControlsProps) {
  const toggleControl = (controlId: string) => {
    setState(prev => ({
      ...prev,
      securityControls: prev.securityControls.map(c => c.id === controlId ? { ...c, enabled: !c.enabled } : c),
      eventLog: [...prev.eventLog, `[${new Date().toLocaleTimeString()}] [DEFENSE] ${prev.securityControls.find(c => c.id === controlId)?.enabled ? 'Disabled' : 'Enabled'}: ${prev.securityControls.find(c => c.id === controlId)?.name}`]
    }));
  };

  const updateConfig = (controlId: string, key: string, value: number | string) => {
    setState(prev => ({
      ...prev, securityControls: prev.securityControls.map(c => c.id === controlId ? { ...c, config: { ...c.config, [key]: value } } : c)
    }));
  };

  const addBlacklistIP = (ip: string) => {
    if (ip && !state.blacklistedIPs.includes(ip)) {
      setState(prev => ({ ...prev, blacklistedIPs: [...prev.blacklistedIPs, ip], eventLog: [...prev.eventLog, `[${new Date().toLocaleTimeString()}] [DEFENSE] IP blacklisted: ${ip}`] }));
    }
  };

  const removeBlacklistIP = (ip: string) => {
    setState(prev => ({ ...prev, blacklistedIPs: prev.blacklistedIPs.filter(i => i !== ip), eventLog: [...prev.eventLog, `[${new Date().toLocaleTimeString()}] [DEFENSE] IP unblocked: ${ip}`] }));
  };

  const unlockUser = (userId: string) => {
    setState(prev => ({ ...prev, users: prev.users.map(u => u.id === userId ? { ...u, isLocked: false, lockoutUntil: null, failedLoginAttempts: 0 } : u), eventLog: [...prev.eventLog, `[${new Date().toLocaleTimeString()}] [DEFENSE] User unlocked: ${prev.users.find(u => u.id === userId)?.username}`] }));
  };

  const enabledCount = state.securityControls.filter(c => c.enabled).length;
  const totalControls = state.securityControls.length;
  const posture = Math.round((enabledCount / totalControls) * 100);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Defensive Controls</h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">Security hardening and adaptive authentication controls</p>
        </div>
        <div className="flex items-center gap-2 bg-accent/5 border border-accent/12 px-3 py-1.5 rounded-lg">
          <Shield size={13} className="text-accent/70" />
          <span className="text-[11px] text-accent/70 font-medium tabular-nums">{enabledCount}/{totalControls} Active</span>
        </div>
      </div>

      {/* Defense Posture */}
      <div className="glass-card rounded-xl p-5 animate-fade-in">
        <div className="flex items-center gap-5">
          <div className="text-center min-w-[64px]">
            <div className={`text-3xl font-bold tracking-tight ${posture >= 80 ? 'text-emerald-400/80' : posture >= 50 ? 'text-amber-400/80' : 'text-red-400/80'}`}>{posture}%</div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1 font-medium">Posture</div>
          </div>
          <div className="flex-1">
            <div className="bg-surface-2 rounded-full h-2 overflow-hidden">
              <div className={`h-2 rounded-full transition-all duration-700 ease-out ${posture >= 80 ? 'bg-emerald-500/60' : posture >= 50 ? 'bg-amber-500/60' : 'bg-red-500/60'}`} style={{ width: `${posture}%` }} />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-zinc-700 font-medium">
              <span>Vulnerable</span><span>Hardened</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-2 gap-3">
        {state.securityControls.map((control, idx) => (
          <div key={control.id} className={`glass-card rounded-xl p-4 transition-all duration-300 animate-fade-in stagger-${Math.min(idx + 1, 6)} ${control.enabled ? 'border-accent/10' : 'opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${control.enabled ? 'bg-accent/8 border border-accent/15 text-accent/70' : 'bg-surface-2 border border-border-subtle text-zinc-700'}`}>
                  {iconMap[control.category]}
                </div>
                <div>
                  <h3 className="text-[12px] font-semibold text-zinc-200">{control.name}</h3>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{control.description}</p>
                </div>
              </div>
              <button onClick={() => toggleControl(control.id)} className={`relative w-9 h-5 rounded-full transition-all duration-300 ${control.enabled ? 'bg-accent/50' : 'bg-surface-3 border border-border-subtle'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${control.enabled ? 'left-[18px] bg-white' : 'left-0.5 bg-zinc-600'}`} />
              </button>
            </div>

            {control.enabled && (
              <div className="space-y-2 animate-fade-in-fast">
                <div className="flex items-center gap-1 text-[10px] text-zinc-600"><Settings size={10} /> Configuration</div>
                {control.category === 'rate_limiting' && (
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-zinc-500 min-w-fit">Max attempts/min:</label>
                    <input type="number" className="flex-1 bg-surface-2 border border-border-subtle rounded-md px-2 py-1 text-[11px] text-zinc-200 font-mono" value={control.config.maxAttemptsPerMinute as number} onChange={e => updateConfig(control.id, 'maxAttemptsPerMinute', parseInt(e.target.value) || 5)} />
                  </div>
                )}
                {control.category === 'lockout' && (<>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-zinc-500 min-w-fit">Max failed:</label>
                    <input type="number" className="flex-1 bg-surface-2 border border-border-subtle rounded-md px-2 py-1 text-[11px] text-zinc-200 font-mono" value={control.config.maxFailedAttempts as number} onChange={e => updateConfig(control.id, 'maxFailedAttempts', parseInt(e.target.value) || 5)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-zinc-500 min-w-fit">Lockout (min):</label>
                    <input type="number" className="flex-1 bg-surface-2 border border-border-subtle rounded-md px-2 py-1 text-[11px] text-zinc-200 font-mono" value={control.config.lockoutDurationMinutes as number} onChange={e => updateConfig(control.id, 'lockoutDurationMinutes', parseInt(e.target.value) || 15)} />
                  </div>
                </>)}
                {control.category === 'mfa' && (
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-zinc-500 min-w-fit">Risk threshold:</label>
                    <input type="number" className="flex-1 bg-surface-2 border border-border-subtle rounded-md px-2 py-1 text-[11px] text-zinc-200 font-mono" value={control.config.riskThreshold as number} onChange={e => updateConfig(control.id, 'riskThreshold', parseInt(e.target.value) || 60)} />
                  </div>
                )}
                {control.category === 'transaction_limit' && (
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-zinc-500 min-w-fit">Daily limit (₱):</label>
                    <input type="number" className="flex-1 bg-surface-2 border border-border-subtle rounded-md px-2 py-1 text-[11px] text-zinc-200 font-mono" value={control.config.dailyLimit as number} onChange={e => updateConfig(control.id, 'dailyLimit', parseInt(e.target.value) || 100000)} />
                  </div>
                )}
                {control.category === 'step_up_auth' && (<>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-zinc-500 min-w-fit">Amount (₱):</label>
                    <input type="number" className="flex-1 bg-surface-2 border border-border-subtle rounded-md px-2 py-1 text-[11px] text-zinc-200 font-mono" value={control.config.amountThreshold as number} onChange={e => updateConfig(control.id, 'amountThreshold', parseInt(e.target.value) || 50000)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-zinc-500 min-w-fit">Risk threshold:</label>
                    <input type="number" className="flex-1 bg-surface-2 border border-border-subtle rounded-md px-2 py-1 text-[11px] text-zinc-200 font-mono" value={control.config.riskThreshold as number} onChange={e => updateConfig(control.id, 'riskThreshold', parseInt(e.target.value) || 70)} />
                  </div>
                </>)}
              </div>
            )}

            <div className="flex flex-wrap gap-1 mt-3">
              {conceptMap[control.category]?.map(concept => (
                <span key={concept} className="bg-accent/5 text-accent/50 px-1.5 py-0.5 rounded text-[10px] font-medium">{concept}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* IP Blacklist */}
      <div className="glass-card rounded-xl p-5 animate-fade-in">
        <h3 className="text-[13px] font-semibold text-zinc-200 mb-3 flex items-center gap-2"><Globe size={13} className="text-zinc-500" /> IP Blacklist</h3>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {state.blacklistedIPs.map(ip => (
            <div key={ip} className="flex items-center gap-1.5 bg-red-500/5 border border-red-500/10 px-2 py-1 rounded-md">
              <span className="text-[11px] text-red-400/70 font-mono">{ip}</span>
              <button onClick={() => removeBlacklistIP(ip)} className="text-red-400/30 hover:text-red-400/60 text-[11px]">×</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input id="newIP" className="flex-1 bg-surface-2 border border-border-subtle rounded-lg px-3 py-1.5 text-[11px] text-zinc-200 font-mono placeholder:text-zinc-700" placeholder="Enter IP address" />
          <button onClick={() => { const input = document.getElementById('newIP') as HTMLInputElement; addBlacklistIP(input.value); input.value = ''; }} className="bg-red-500/8 text-red-400/70 border border-red-500/15 px-3 py-1.5 rounded-lg text-[11px] font-medium hover:bg-red-500/12">Block</button>
        </div>
      </div>

      {/* Locked Users */}
      <div className="glass-card rounded-xl p-5 animate-fade-in">
        <h3 className="text-[13px] font-semibold text-zinc-200 mb-3 flex items-center gap-2"><Lock size={13} className="text-zinc-500" /> Locked Accounts</h3>
        {state.users.filter(u => u.isLocked).length === 0 ? (
          <p className="text-[11px] text-zinc-700 text-center py-4">No locked accounts</p>
        ) : (
          <div className="space-y-1.5">
            {state.users.filter(u => u.isLocked).map(user => (
              <div key={user.id} className="flex items-center justify-between bg-red-500/3 border border-red-500/10 rounded-lg px-3 py-2.5">
                <div>
                  <span className="text-[11px] text-zinc-200 font-medium">{user.fullName}</span>
                  <span className="text-[10px] text-zinc-600 ml-2">@{user.username}</span>
                  <div className="text-[10px] text-red-400/50 mt-0.5">{user.failedLoginAttempts} failed attempts</div>
                </div>
                <button onClick={() => unlockUser(user.id)} className="bg-emerald-500/8 text-emerald-400/70 border border-emerald-500/15 px-2.5 py-1 rounded-md text-[10px] font-medium hover:bg-emerald-500/12">Unlock</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
