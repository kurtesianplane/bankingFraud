import { useState } from 'react';
import { StoreState, generateId } from '../store';
import { ComplianceReport } from '../types';
import { FileText, ShieldCheck, AlertTriangle, Clock, CheckCircle, Send, Download, BarChart2, Scale, FileWarning, FilePlus, Briefcase } from 'lucide-react';

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
  const unreportedAlerts = state.fraudAlerts.filter(a => a.severity === 'critical' || a.severity === 'high')
    .filter(a => !state.complianceReports.some(r => r.relatedAlerts.includes(a.id)));

  const generateSAR = () => {
    const relatedTxs = selectedTxIds.length > 0 ? selectedTxIds : flaggedTxs.slice(0, 5).map(t => t.id);
    const relatedAlertIds = state.fraudAlerts
      .filter(a => relatedTxs.some(txId => a.transactionId === txId))
      .map(a => a.id);

    const totalAmount = state.transactions
      .filter(t => relatedTxs.includes(t.id))
      .reduce((sum, t) => sum + t.amount, 0);

    const report: ComplianceReport = {
      id: generateId(),
      type: 'SAR',
      title: `SAR - Suspicious Activity Report #${state.complianceReports.filter(r => r.type === 'SAR').length + 1}`,
      generatedAt: Date.now(),
      status: 'draft',
      relatedTransactions: relatedTxs,
      relatedAlerts: relatedAlertIds,
      summary: `Suspicious activity detected involving ${relatedTxs.length} transaction(s) totaling ₱${totalAmount.toLocaleString()}. ` +
        `${amlPatterns.length > 0 ? `Potential money laundering patterns identified (smurfing/layering). ` : ''}` +
        `${relatedAlertIds.length} fraud alert(s) generated. Recommend investigation and filing with AMLC within 5 business days.`,
      regulatoryBody: 'AMLC (Anti-Money Laundering Council)',
      dueDate: Date.now() + 5 * 86400000,
      filedBy: 'Compliance Officer'
    };

    setState(prev => ({
      ...prev,
      complianceReports: [...prev.complianceReports, report],
      eventLog: [...prev.eventLog, `[${new Date().toLocaleTimeString()}] [COMPLIANCE] SAR generated: ${report.title} (${relatedTxs.length} txs, ₱${totalAmount.toLocaleString()})`]
    }));
    setSelectedTxIds([]);
  };

  const generateCTR = () => {
    const largeTxs = state.transactions.filter(t => t.amount > 50000);
    const report: ComplianceReport = {
      id: generateId(),
      type: 'CTR',
      title: `CTR - Currency Transaction Report #${state.complianceReports.filter(r => r.type === 'CTR').length + 1}`,
      generatedAt: Date.now(),
      status: 'draft',
      relatedTransactions: largeTxs.map(t => t.id),
      relatedAlerts: [],
      summary: `${largeTxs.length} transaction(s) exceeding ₱50,000 threshold. Mandatory reporting to BSP per Circular 706 and RA 9160 (AMLA).`,
      regulatoryBody: 'BSP (Bangko Sentral ng Pilipinas)',
      dueDate: Date.now() + 10 * 86400000,
      filedBy: 'Compliance Officer'
    };

    setState(prev => ({
      ...prev,
      complianceReports: [...prev.complianceReports, report],
      eventLog: [...prev.eventLog, `[${new Date().toLocaleTimeString()}] [COMPLIANCE] CTR generated: ${report.title} (${largeTxs.length} large transactions)`]
    }));
  };

  const generateAuditReport = () => {
    const report: ComplianceReport = {
      id: generateId(),
      type: 'audit',
      title: `Audit Report - System Security Assessment #${state.complianceReports.filter(r => r.type === 'audit').length + 1}`,
      generatedAt: Date.now(),
      status: 'draft',
      relatedTransactions: [],
      relatedAlerts: state.fraudAlerts.map(a => a.id),
      summary: `Security audit summary: ${state.users.length} users, ${state.transactions.length} transactions processed, ` +
        `${flaggedTxs.length} flagged (${((flaggedTxs.length / Math.max(state.transactions.length, 1)) * 100).toFixed(1)}% flag rate), ` +
        `${blockedTxs.length} blocked. ${state.securityControls.filter(c => c.enabled).length}/${state.securityControls.length} security controls active. ` +
        `${state.fraudAlerts.filter(a => a.status === 'resolved').length} alerts resolved. ` +
        `${state.users.filter(u => u.isLocked).length} accounts currently locked.`,
      regulatoryBody: 'Internal Audit / BSP',
      dueDate: Date.now() + 30 * 86400000,
      filedBy: 'Internal Auditor'
    };

    setState(prev => ({
      ...prev,
      complianceReports: [...prev.complianceReports, report],
      eventLog: [...prev.eventLog, `[${new Date().toLocaleTimeString()}] [COMPLIANCE] Audit report generated`]
    }));
  };

  const submitReport = (reportId: string) => {
    setState(prev => ({
      ...prev,
      complianceReports: prev.complianceReports.map(r => r.id === reportId ? { ...r, status: 'submitted' as const } : r),
      eventLog: [...prev.eventLog, `[${new Date().toLocaleTimeString()}] [COMPLIANCE] Report submitted: ${prev.complianceReports.find(r => r.id === reportId)?.title}`]
    }));
  };

  // Compliance score calculation
  const complianceChecks = [
    { name: 'SAR Filing', met: state.complianceReports.filter(r => r.type === 'SAR').length > 0 || flaggedTxs.length === 0, desc: 'SARs filed for suspicious activity' },
    { name: 'CTR Filing', met: state.complianceReports.filter(r => r.type === 'CTR').length > 0 || state.transactions.filter(t => t.amount > 50000).length === 0, desc: 'CTRs filed for large transactions' },
    { name: 'AML Controls', met: state.securityControls.filter(c => c.category === 'transaction_limit').some(c => c.enabled), desc: 'Transaction limits enabled' },
    { name: 'KYC Verification', met: state.users.length > 0, desc: 'User identity verification process' },
    { name: 'Fraud Detection', met: state.securityControls.filter(c => c.enabled).length >= 4, desc: '4+ security controls active' },
    { name: 'Incident Response', met: state.fraudAlerts.filter(a => a.status === 'resolved').length > 0 || state.fraudAlerts.length === 0, desc: 'Alerts being reviewed/resolved' },
    { name: 'Audit Trail', met: state.eventLog.length > 5, desc: 'Comprehensive activity logging' },
    { name: 'Account Security', met: state.securityControls.filter(c => c.category === 'lockout' || c.category === 'mfa').every(c => c.enabled), desc: 'Lockout and MFA controls active' },
  ];

  const complianceScore = Math.round((complianceChecks.filter(c => c.met).length / complianceChecks.length) * 100);

  const reportTypeColor = (type: string) => {
    switch (type) { case 'SAR': return 'bg-red-500/10 text-red-400 border-red-500/20'; case 'CTR': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'; case 'STR': return 'bg-orange-500/10 text-orange-400 border-orange-500/20'; default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20'; }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">⚪ Phase 8 — Compliance & Regulatory Reporting</h2>
        <p className="text-sm text-gray-400 mt-1">BSP/AMLC regulatory compliance, SAR/CTR generation, and audit management</p>
      </div>

      {/* Compliance Score */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className={`text-4xl font-bold ${complianceScore >= 80 ? 'text-green-400' : complianceScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {complianceScore}%
            </div>
            <div className="text-[10px] text-gray-500 uppercase mt-1">Compliance Score</div>
          </div>
          <div className="flex-1">
            <div className="bg-gray-800 rounded-full h-4">
              <div className={`h-4 rounded-full transition-all ${complianceScore >= 80 ? 'bg-green-500' : complianceScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${complianceScore}%` }} />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {complianceChecks.map((check, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px]">
                  {check.met ? <CheckCircle size={10} className="text-green-400" /> : <AlertTriangle size={10} className="text-red-400" />}
                  <span className={check.met ? 'text-gray-400' : 'text-red-400'}>{check.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2">
        {([
          { id: 'overview' as const, label: 'Overview', icon: <BarChart2 size={13} /> },
          { id: 'sar' as const, label: 'SAR/CTR Filing', icon: <FileWarning size={13} /> },
          { id: 'reports' as const, label: 'Reports', icon: <FileText size={13} /> },
          { id: 'audit' as const, label: 'Regulatory', icon: <Scale size={13} /> },
        ]).map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeView === v.id ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'}`}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Reports Filed', value: state.complianceReports.length, color: 'text-white', icon: <FileText size={16} /> },
          { label: 'SARs', value: state.complianceReports.filter(r => r.type === 'SAR').length, color: 'text-red-400', icon: <FileWarning size={16} /> },
          { label: 'CTRs', value: state.complianceReports.filter(r => r.type === 'CTR').length, color: 'text-yellow-400', icon: <FilePlus size={16} /> },
          { label: 'Unreported Alerts', value: unreportedAlerts.length, color: unreportedAlerts.length > 0 ? 'text-red-400' : 'text-green-400', icon: <AlertTriangle size={16} /> },
          { label: 'Submitted', value: state.complianceReports.filter(r => r.status === 'submitted').length, color: 'text-green-400', icon: <Send size={16} /> },
        ].map((s, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
            <div className={`flex items-center justify-center gap-2 ${s.color} mb-1`}>{s.icon}<span className="text-xl font-bold">{s.value}</span></div>
            <div className="text-[10px] text-gray-500 uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Overview */}
      {activeView === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Scale size={14} /> Regulatory Framework</h3>
              <div className="space-y-2">
                {[
                  { reg: 'RA 9160 (AMLA)', desc: 'Anti-Money Laundering Act — mandate to report suspicious transactions', status: 'Active' },
                  { reg: 'BSP Circular 706', desc: 'Enhanced AML guidelines for banks — CTR threshold at ₱500,000', status: 'Active' },
                  { reg: 'BSP Circular 1108', desc: 'IT Risk Management framework for supervised institutions', status: 'Active' },
                  { reg: 'RA 10175 (Cybercrime)', desc: 'Cybercrime Prevention Act — computer fraud and identity theft', status: 'Active' },
                  { reg: 'AMLC Resolution', desc: 'Freeze order and civil forfeiture proceedings for laundered assets', status: 'Applicable' },
                ].map((r, i) => (
                  <div key={i} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-teal-400 font-medium">{r.reg}</span>
                      <span className="text-green-400 text-[10px]">{r.status}</span>
                    </div>
                    <div className="text-gray-500 mt-0.5">{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Briefcase size={14} /> Compliance Obligations</h3>
              <div className="space-y-2">
                {[
                  { task: 'File SAR for suspicious activity', deadline: '5 business days', priority: 'critical', done: state.complianceReports.some(r => r.type === 'SAR') || flaggedTxs.length === 0 },
                  { task: 'File CTR for transactions >₱500K', deadline: '5 business days', priority: 'high', done: state.complianceReports.some(r => r.type === 'CTR') },
                  { task: 'Quarterly audit report', deadline: '30 days', priority: 'medium', done: state.complianceReports.some(r => r.type === 'audit') },
                  { task: 'Review frozen accounts', deadline: 'Ongoing', priority: 'high', done: !state.accounts.some(a => a.isFrozen) },
                  { task: 'Update threat intelligence', deadline: 'Weekly', priority: 'medium', done: state.threatIntel.length > 0 },
                ].map((t, i) => (
                  <div key={i} className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs ${t.done ? 'bg-green-500/5 border-green-500/20' : 'bg-gray-800/50 border-gray-700/50'}`}>
                    {t.done ? <CheckCircle size={14} className="text-green-400" /> : <Clock size={14} className="text-yellow-400" />}
                    <div className="flex-1">
                      <div className={t.done ? 'text-gray-400' : 'text-white'}>{t.task}</div>
                      <div className="text-gray-500 text-[10px]">Deadline: {t.deadline}</div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] border ${t.priority === 'critical' ? 'bg-red-500/10 text-red-400 border-red-500/20' : t.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>{t.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SAR/CTR Filing */}
      {activeView === 'sar' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 border border-red-500/20 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><FileWarning size={14} className="text-red-400" /> Generate SAR</h3>
              <p className="text-xs text-gray-500">Suspicious Activity Report — filed when fraud or money laundering is detected</p>
              {flaggedTxs.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {flaggedTxs.slice(0, 8).map(tx => (
                    <label key={tx.id} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input type="checkbox" className="accent-red-500" checked={selectedTxIds.includes(tx.id)} onChange={e => {
                        if (e.target.checked) setSelectedTxIds(prev => [...prev, tx.id]);
                        else setSelectedTxIds(prev => prev.filter(id => id !== tx.id));
                      }} />
                      ₱{tx.amount.toLocaleString()} • Risk: {tx.riskScore}
                      <span className="text-gray-500 text-[10px]">{tx.id.substring(0, 10)}</span>
                    </label>
                  ))}
                </div>
              )}
              <button onClick={generateSAR} disabled={flaggedTxs.length === 0} className="w-full bg-red-600/20 text-red-400 border border-red-500/30 py-2 rounded-lg text-xs hover:bg-red-600/30 disabled:opacity-30 disabled:cursor-not-allowed">
                Generate SAR
              </button>
            </div>

            <div className="bg-gray-900 border border-yellow-500/20 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><FilePlus size={14} className="text-yellow-400" /> Generate CTR</h3>
              <p className="text-xs text-gray-500">Currency Transaction Report — mandatory for transactions exceeding ₱50,000 threshold</p>
              <div className="bg-gray-800/50 rounded-lg p-2 text-xs text-gray-400">
                <span className="text-yellow-400">{state.transactions.filter(t => t.amount > 50000).length}</span> transaction(s) exceed threshold
              </div>
              <button onClick={generateCTR} disabled={state.transactions.filter(t => t.amount > 50000).length === 0} className="w-full bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 py-2 rounded-lg text-xs hover:bg-yellow-600/30 disabled:opacity-30 disabled:cursor-not-allowed">
                Generate CTR
              </button>
            </div>

            <div className="bg-gray-900 border border-blue-500/20 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2"><ShieldCheck size={14} className="text-blue-400" /> Generate Audit Report</h3>
              <p className="text-xs text-gray-500">Comprehensive system security and compliance audit report</p>
              <div className="bg-gray-800/50 rounded-lg p-2 text-xs text-gray-400">
                <span className="text-blue-400">{state.securityControls.filter(c => c.enabled).length}/{state.securityControls.length}</span> controls active
              </div>
              <button onClick={generateAuditReport} className="w-full bg-blue-600/20 text-blue-400 border border-blue-500/30 py-2 rounded-lg text-xs hover:bg-blue-600/30">
                Generate Audit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports View */}
      {activeView === 'reports' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><FileText size={14} /> Filed Reports ({state.complianceReports.length})</h3>
          {state.complianceReports.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-8">No compliance reports generated yet. Use the SAR/CTR Filing tab to create reports.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {state.complianceReports.slice().reverse().map(report => (
                <div key={report.id} className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${reportTypeColor(report.type)}`}>{report.type}</span>
                      <span className="text-white font-medium">{report.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] ${report.status === 'submitted' ? 'text-green-400' : report.status === 'acknowledged' ? 'text-blue-400' : 'text-yellow-400'}`}>
                        ● {report.status}
                      </span>
                      {report.status === 'draft' && (
                        <button onClick={() => submitReport(report.id)} className="flex items-center gap-1 bg-green-600/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded text-[10px] hover:bg-green-600/30">
                          <Send size={10} /> Submit
                        </button>
                      )}
                      <button className="flex items-center gap-1 bg-gray-600/20 text-gray-400 border border-gray-500/30 px-2 py-0.5 rounded text-[10px] hover:bg-gray-600/30">
                        <Download size={10} /> Export
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-400 mt-1">{report.summary}</p>
                  <div className="flex gap-4 mt-2 text-[10px] text-gray-500">
                    <span>Filed by: {report.filedBy}</span>
                    <span>To: {report.regulatoryBody}</span>
                    <span>Due: {new Date(report.dueDate).toLocaleDateString()}</span>
                    <span>Txs: {report.relatedTransactions.length}</span>
                    <span>Alerts: {report.relatedAlerts.length}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit/Regulatory View */}
      {activeView === 'audit' && (
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Scale size={14} /> Compliance Checklist — BSP / AMLC Requirements</h3>
            <div className="space-y-2">
              {complianceChecks.map((check, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${check.met ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                  {check.met ? <CheckCircle size={16} className="text-green-400" /> : <AlertTriangle size={16} className="text-red-400" />}
                  <div className="flex-1">
                    <div className={`text-xs font-medium ${check.met ? 'text-green-400' : 'text-red-400'}`}>{check.name}</div>
                    <div className="text-[10px] text-gray-500">{check.desc}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${check.met ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {check.met ? 'COMPLIANT' : 'NON-COMPLIANT'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">📋 Audit Trail Summary</h3>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {[
                { label: 'Total Events', value: state.eventLog.length },
                { label: 'Security Events', value: state.eventLog.filter(e => e.includes('[SECURITY]') || e.includes('[BLOCKED]')).length },
                { label: 'Auth Events', value: state.eventLog.filter(e => e.includes('[AUTH]')).length },
                { label: 'SOC Actions', value: state.eventLog.filter(e => e.includes('[SOC]')).length },
              ].map((s, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-white">{s.value}</div>
                  <div className="text-[10px] text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-black rounded-lg p-3 font-mono text-[10px] max-h-48 overflow-y-auto space-y-0.5">
              {state.eventLog.slice(-40).reverse().map((log, i) => (
                <div key={i} className={
                  log.includes('[COMPLIANCE]') ? 'text-teal-400' :
                  log.includes('[SECURITY]') || log.includes('[BLOCKED]') ? 'text-red-400' :
                  log.includes('[THREAT-INTEL]') ? 'text-indigo-400' :
                  'text-gray-500'
                }>{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Concepts */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3">🎓 Applied Concepts</h3>
        <div className="grid grid-cols-4 gap-2">
          {[
            { name: 'SAR/CTR Filing', desc: 'Mandatory reporting of suspicious activity and large currency transactions' },
            { name: 'AML Compliance', desc: 'Anti-Money Laundering program with CDD, EDD, and transaction monitoring' },
            { name: 'Regulatory Framework', desc: 'BSP circulars, RA 9160, and AMLC requirements for financial institutions' },
            { name: 'Audit Trail', desc: 'Non-repudiation through comprehensive logging of all system actions' },
          ].map(c => (
            <div key={c.name} className="bg-gray-800 rounded-lg p-2.5">
              <div className="text-xs font-medium text-teal-400">{c.name}</div>
              <div className="text-[10px] text-gray-500 mt-1">{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
