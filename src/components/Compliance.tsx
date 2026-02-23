import { useState } from 'react';
import { StoreState, generateId } from '../store';
import { ComplianceReport } from '../types';
import { FileText, ShieldCheck, AlertTriangle, Clock, CheckCircle, Send, Download, BarChart2, Scale, FileWarning, FilePlus } from 'lucide-react';

interface ComplianceProps {
  state: StoreState;
  setState: React.Dispatch<React.SetStateAction<StoreState>>;
}

export function Compliance({ state, setState }: ComplianceProps) {
  const [activeView, setActiveView] = useState<'overview' | 'sar' | 'reports' | 'audit'>('overview');
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);

  const flaggedTxs = state.transactions.filter(t => t.isFlagged);
  const blockedTxs = state.transactions.filter(t => t.status === 'blocked');
  const amlPatterns = state.transactions.filter(t => t.attackScenario?.includes('Money Laundering'));
  const unreportedAlerts = state.fraudAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').filter(a => !state.complianceReports.some(r => r.relatedAlerts.includes(a.id)));

  const generateSAR = () => {
    const relatedTxs = selectedTxIds.length > 0 ? selectedTxIds : flaggedTxs.slice(0, 5).map(t => t.id);
    const relatedAlertIds = state.fraudAlerts.filter(a => relatedTxs.some(txId => a.transactionId === txId)).map(a => a.id);
    const totalAmount = state.transactions.filter(t => relatedTxs.includes(t.id)).reduce((sum, t) => sum + t.amount, 0);
    const report: ComplianceReport = { id: generateId(), type: 'SAR', title: `SAR #${state.complianceReports.filter(r => r.type === 'SAR').length + 1}`, generatedAt: Date.now(), status: 'draft', relatedTransactions: relatedTxs, relatedAlerts: relatedAlertIds, summary: `${relatedTxs.length} suspicious transaction(s) totaling ₱${totalAmount.toLocaleString()}.${amlPatterns.length > 0 ? ' Potential money laundering detected.' : ''} ${relatedAlertIds.length} alert(s). Filing recommended within 5 business days.`, regulatoryBody: 'AMLC', dueDate: Date.now() + 5 * 86400000, filedBy: 'Compliance Officer' };
    setState(prev => ({ ...prev, complianceReports: [...prev.complianceReports, report], eventLog: [...prev.eventLog, `[${new Date().toLocaleTimeString()}] [COMPLIANCE] SAR generated (${relatedTxs.length} txs, ₱${totalAmount.toLocaleString()})`] }));
    setSelectedTxIds([]);
  };

  const generateCTR = () => {
    const largeTxs = state.transactions.filter(t => t.amount > 50000);
    const report: ComplianceReport = { id: generateId(), type: 'CTR', title: `CTR #${state.complianceReports.filter(r => r.type === 'CTR').length + 1}`, generatedAt: Date.now(), status: 'draft', relatedTransactions: largeTxs.map(t => t.id), relatedAlerts: [], summary: `${largeTxs.length} transaction(s) exceeding ₱50,000. Mandatory BSP Circular 706 / RA 9160 filing.`, regulatoryBody: 'BSP', dueDate: Date.now() + 10 * 86400000, filedBy: 'Compliance Officer' };
    setState(prev => ({ ...prev, complianceReports: [...prev.complianceReports, report], eventLog: [...prev.eventLog, `[${new Date().toLocaleTimeString()}] [COMPLIANCE] CTR generated (${largeTxs.length} txs)`] }));
  };

  const generateAuditReport = () => {
    const report: ComplianceReport = { id: generateId(), type: 'audit', title: `Audit #${state.complianceReports.filter(r => r.type === 'audit').length + 1}`, generatedAt: Date.now(), status: 'draft', relatedTransactions: [], relatedAlerts: state.fraudAlerts.map(a => a.id), summary: `${state.users.length} users, ${state.transactions.length} txns, ${flaggedTxs.length} flagged (${((flaggedTxs.length / Math.max(state.transactions.length, 1)) * 100).toFixed(1)}%), ${blockedTxs.length} blocked. ${state.securityControls.filter(c => c.enabled).length}/${state.securityControls.length} controls active.`, regulatoryBody: 'Internal / BSP', dueDate: Date.now() + 30 * 86400000, filedBy: 'Internal Auditor' };
    setState(prev => ({ ...prev, complianceReports: [...prev.complianceReports, report], eventLog: [...prev.eventLog, `[${new Date().toLocaleTimeString()}] [COMPLIANCE] Audit report generated`] }));
  };

  const submitReport = (reportId: string) => {
    setState(prev => ({ ...prev, complianceReports: prev.complianceReports.map(r => r.id === reportId ? { ...r, status: 'submitted' as const } : r), eventLog: [...prev.eventLog, `[${new Date().toLocaleTimeString()}] [COMPLIANCE] Report submitted`] }));
  };

  const complianceChecks = [
    { name: 'SAR Filing', met: state.complianceReports.filter(r => r.type === 'SAR').length > 0 || flaggedTxs.length === 0, desc: 'SARs filed for suspicious activity' },
    { name: 'CTR Filing', met: state.complianceReports.filter(r => r.type === 'CTR').length > 0 || state.transactions.filter(t => t.amount > 50000).length === 0, desc: 'CTRs for large transactions' },
    { name: 'AML Controls', met: state.securityControls.filter(c => c.category === 'transaction_limit').some(c => c.enabled), desc: 'Transaction limits enabled' },
    { name: 'KYC Verification', met: state.users.length > 0, desc: 'Identity verification active' },
    { name: 'Fraud Detection', met: state.securityControls.filter(c => c.enabled).length >= 4, desc: '4+ security controls' },
    { name: 'Incident Response', met: state.fraudAlerts.filter(a => a.status === 'resolved').length > 0 || state.fraudAlerts.length === 0, desc: 'Alerts reviewed' },
    { name: 'Audit Trail', met: state.eventLog.length > 5, desc: 'Activity logging' },
    { name: 'Account Security', met: state.securityControls.filter(c => c.category === 'lockout' || c.category === 'mfa').every(c => c.enabled), desc: 'Lockout + MFA active' },
  ];

  const complianceScore = Math.round((complianceChecks.filter(c => c.met).length / complianceChecks.length) * 100);

  const reportBadge = (type: string) => { switch (type) { case 'SAR': return 'bg-red-500/8 text-red-400/70 border-red-500/15'; case 'CTR': return 'bg-amber-500/8 text-amber-400/70 border-amber-500/15'; default: return 'bg-blue-500/8 text-blue-400/70 border-blue-500/15'; } };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Compliance & Reporting</h2>
        <p className="text-[12px] text-zinc-500 mt-0.5">Regulatory compliance, SAR/CTR filing, and audit management</p>
      </div>

      {/* Score */}
      <div className="glass-card rounded-xl p-5 animate-fade-in">
        <div className="flex items-center gap-5">
          <div className="text-center min-w-[64px]">
            <div className={`text-3xl font-bold tracking-tight ${complianceScore >= 80 ? 'text-emerald-400/80' : complianceScore >= 50 ? 'text-amber-400/80' : 'text-red-400/80'}`}>{complianceScore}%</div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1 font-medium">Score</div>
          </div>
          <div className="flex-1">
            <div className="bg-surface-2 rounded-full h-2 overflow-hidden">
              <div className={`h-2 rounded-full transition-all duration-700 ${complianceScore >= 80 ? 'bg-emerald-500/60' : complianceScore >= 50 ? 'bg-amber-500/60' : 'bg-red-500/60'}`} style={{ width: `${complianceScore}%` }} />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2.5">
              {complianceChecks.map((check, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px]">
                  {check.met ? <CheckCircle size={10} className="text-emerald-400/60 flex-shrink-0" /> : <AlertTriangle size={10} className="text-red-400/60 flex-shrink-0" />}
                  <span className={check.met ? 'text-zinc-500' : 'text-red-400/70'}>{check.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-2/50 p-1 rounded-lg border border-border-subtle w-fit">
        {([
          { id: 'overview' as const, label: 'Overview', icon: <BarChart2 size={12} /> },
          { id: 'sar' as const, label: 'SAR/CTR Filing', icon: <FileWarning size={12} /> },
          { id: 'reports' as const, label: 'Reports', icon: <FileText size={12} /> },
          { id: 'audit' as const, label: 'Regulatory', icon: <Scale size={12} /> },
        ]).map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${activeView === v.id ? 'bg-surface-3 text-zinc-200 shadow-sm' : 'text-zinc-500 hover:text-zinc-400'}`}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2.5">
        {[
          { label: 'Reports', value: state.complianceReports.length, icon: <FileText size={14} />, color: 'text-zinc-200' },
          { label: 'SARs', value: state.complianceReports.filter(r => r.type === 'SAR').length, icon: <FileWarning size={14} />, color: 'text-red-400/80' },
          { label: 'CTRs', value: state.complianceReports.filter(r => r.type === 'CTR').length, icon: <FilePlus size={14} />, color: 'text-amber-400/80' },
          { label: 'Unreported', value: unreportedAlerts.length, icon: <AlertTriangle size={14} />, color: unreportedAlerts.length > 0 ? 'text-red-400/80' : 'text-emerald-400/80' },
          { label: 'Submitted', value: state.complianceReports.filter(r => r.status === 'submitted').length, icon: <Send size={14} />, color: 'text-emerald-400/80' },
        ].map((s, i) => (
          <div key={i} className="glass-card rounded-xl p-3 text-center stat-card animate-fade-in">
            <div className={`flex items-center justify-center gap-1.5 ${s.color} mb-1`}>{s.icon}<span className="text-lg font-bold">{s.value}</span></div>
            <div className="text-[9px] text-zinc-600 font-medium uppercase tracking-widest">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Overview */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-2 gap-3 animate-fade-in">
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-[13px] font-semibold text-zinc-200 mb-3 flex items-center gap-2"><Scale size={13} className="text-zinc-500" /> Regulatory Framework</h3>
            <div className="space-y-1.5">
              {[
                { reg: 'RA 9160 (AMLA)', desc: 'Anti-Money Laundering mandate' },
                { reg: 'BSP Circular 706', desc: 'Enhanced AML guidelines' },
                { reg: 'BSP Circular 1108', desc: 'IT Risk Management framework' },
                { reg: 'RA 10175', desc: 'Cybercrime Prevention Act' },
              ].map((r, i) => (
                <div key={i} className="bg-surface-2/30 border border-border-subtle rounded-lg px-3 py-2 text-[11px]">
                  <span className="text-teal-400/60 font-medium">{r.reg}</span>
                  <span className="text-zinc-600 ml-2">{r.desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-[13px] font-semibold text-zinc-200 mb-3 flex items-center gap-2"><Clock size={13} className="text-zinc-500" /> Obligations</h3>
            <div className="space-y-1.5">
              {[
                { task: 'File SAR for suspicious activity', deadline: '5 days', done: state.complianceReports.some(r => r.type === 'SAR') || flaggedTxs.length === 0 },
                { task: 'File CTR for txns >₱500K', deadline: '5 days', done: state.complianceReports.some(r => r.type === 'CTR') },
                { task: 'Quarterly audit report', deadline: '30 days', done: state.complianceReports.some(r => r.type === 'audit') },
                { task: 'Review frozen accounts', deadline: 'Ongoing', done: !state.accounts.some(a => a.isFrozen) },
              ].map((t, i) => (
                <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-[11px] ${t.done ? 'bg-emerald-500/2 border-emerald-500/10' : 'bg-surface-2/30 border-border-subtle'}`}>
                  {t.done ? <CheckCircle size={12} className="text-emerald-400/60 flex-shrink-0" /> : <Clock size={12} className="text-amber-400/60 flex-shrink-0" />}
                  <div className="flex-1"><span className={t.done ? 'text-zinc-500' : 'text-zinc-300'}>{t.task}</span></div>
                  <span className="text-[10px] text-zinc-600 font-mono">{t.deadline}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SAR/CTR Filing */}
      {activeView === 'sar' && (
        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h3 className="text-[12px] font-semibold text-zinc-200 flex items-center gap-2"><FileWarning size={13} className="text-red-400/60" /> Generate SAR</h3>
            <p className="text-[10px] text-zinc-600">Suspicious Activity Report</p>
            {flaggedTxs.length > 0 && (
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {flaggedTxs.slice(0, 8).map(tx => (
                  <label key={tx.id} className="flex items-center gap-2 text-[11px] text-zinc-400 cursor-pointer">
                    <input type="checkbox" className="accent-red-500 rounded" checked={selectedTxIds.includes(tx.id)} onChange={e => { if (e.target.checked) setSelectedTxIds(prev => [...prev, tx.id]); else setSelectedTxIds(prev => prev.filter(id => id !== tx.id)); }} />
                    ₱{tx.amount.toLocaleString()} · Risk {tx.riskScore}
                  </label>
                ))}
              </div>
            )}
            <button onClick={generateSAR} disabled={flaggedTxs.length === 0} className="w-full bg-red-500/8 text-red-400/70 border border-red-500/15 py-2 rounded-lg text-[11px] font-medium hover:bg-red-500/12 disabled:opacity-20 disabled:cursor-not-allowed">Generate SAR</button>
          </div>
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h3 className="text-[12px] font-semibold text-zinc-200 flex items-center gap-2"><FilePlus size={13} className="text-amber-400/60" /> Generate CTR</h3>
            <p className="text-[10px] text-zinc-600">Currency Transaction Report</p>
            <div className="bg-surface-2/40 rounded-lg p-2 text-[11px] text-zinc-500 border border-border-subtle">
              <span className="text-amber-400/70 font-semibold">{state.transactions.filter(t => t.amount > 50000).length}</span> txns exceed threshold
            </div>
            <button onClick={generateCTR} disabled={state.transactions.filter(t => t.amount > 50000).length === 0} className="w-full bg-amber-500/8 text-amber-400/70 border border-amber-500/15 py-2 rounded-lg text-[11px] font-medium hover:bg-amber-500/12 disabled:opacity-20 disabled:cursor-not-allowed">Generate CTR</button>
          </div>
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h3 className="text-[12px] font-semibold text-zinc-200 flex items-center gap-2"><ShieldCheck size={13} className="text-blue-400/60" /> Audit Report</h3>
            <p className="text-[10px] text-zinc-600">System security assessment</p>
            <div className="bg-surface-2/40 rounded-lg p-2 text-[11px] text-zinc-500 border border-border-subtle">
              <span className="text-blue-400/70 font-semibold">{state.securityControls.filter(c => c.enabled).length}/{state.securityControls.length}</span> controls active
            </div>
            <button onClick={generateAuditReport} className="w-full bg-blue-500/8 text-blue-400/70 border border-blue-500/15 py-2 rounded-lg text-[11px] font-medium hover:bg-blue-500/12">Generate Audit</button>
          </div>
        </div>
      )}

      {/* Reports */}
      {activeView === 'reports' && (
        <div className="glass-card rounded-xl p-5 animate-fade-in">
          <h3 className="text-[13px] font-semibold text-zinc-200 mb-3">Filed Reports ({state.complianceReports.length})</h3>
          {state.complianceReports.length === 0 ? (
            <p className="text-[11px] text-zinc-700 text-center py-8">No reports. Use SAR/CTR Filing to create.</p>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {state.complianceReports.slice().reverse().map(report => (
                <div key={report.id} className="bg-surface-2/20 border border-border-subtle rounded-lg px-3 py-3 text-[11px]">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded border text-[9px] font-semibold ${reportBadge(report.type)}`}>{report.type}</span>
                      <span className="text-zinc-200 font-medium">{report.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-medium ${report.status === 'submitted' ? 'text-emerald-400/60' : 'text-amber-400/60'}`}>{report.status}</span>
                      {report.status === 'draft' && (
                        <button onClick={() => submitReport(report.id)} className="flex items-center gap-1 bg-emerald-500/8 text-emerald-400/70 border border-emerald-500/15 px-2 py-0.5 rounded-md text-[10px] font-medium hover:bg-emerald-500/12">
                          <Send size={9} /> Submit
                        </button>
                      )}
                      <button className="flex items-center gap-1 bg-surface-2 text-zinc-500 border border-border-subtle px-2 py-0.5 rounded-md text-[10px] hover:text-zinc-400">
                        <Download size={9} /> Export
                      </button>
                    </div>
                  </div>
                  <p className="text-zinc-500 mt-1 leading-relaxed">{report.summary}</p>
                  <div className="flex gap-4 mt-1.5 text-[10px] text-zinc-700 font-mono">
                    <span>{report.filedBy}</span>
                    <span>To: {report.regulatoryBody}</span>
                    <span>Due: {new Date(report.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit */}
      {activeView === 'audit' && (
        <div className="space-y-3 animate-fade-in">
          <div className="glass-card rounded-xl p-5">
            <h3 className="text-[13px] font-semibold text-zinc-200 mb-3">BSP / AMLC Compliance Checklist</h3>
            <div className="space-y-1.5">
              {complianceChecks.map((check, i) => (
                <div key={i} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${check.met ? 'bg-emerald-500/2 border-emerald-500/10' : 'bg-red-500/2 border-red-500/10'}`}>
                  {check.met ? <CheckCircle size={14} className="text-emerald-400/60 flex-shrink-0" /> : <AlertTriangle size={14} className="text-red-400/60 flex-shrink-0" />}
                  <div className="flex-1">
                    <div className={`text-[11px] font-medium ${check.met ? 'text-emerald-400/70' : 'text-red-400/70'}`}>{check.name}</div>
                    <div className="text-[10px] text-zinc-600">{check.desc}</div>
                  </div>
                  <span className={`text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${check.met ? 'bg-emerald-500/8 text-emerald-400/50' : 'bg-red-500/8 text-red-400/50'}`}>
                    {check.met ? 'Pass' : 'Fail'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
