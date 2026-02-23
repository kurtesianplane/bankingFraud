import { useState } from 'react';
import { StoreState, generateId, randomIP, randomDevice, randomGeo, evaluateTransactionRisk, checkSecurityControls, mlPredict } from '../store';
import { Transaction, LoginLog, FraudAlert } from '../types';
import { Play, Skull, Banknote, UserX, Target, Smartphone, UserCog, Terminal } from 'lucide-react';

interface AttackSimulationProps {
  state: StoreState;
  setState: React.Dispatch<React.SetStateAction<StoreState>>;
}

export function AttackSimulation({ state, setState }: AttackSimulationProps) {
  const [attackLog, setAttackLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const log = (msg: string) => {
    setAttackLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    setState(prev => ({ ...prev, eventLog: [...prev.eventLog, `[${new Date().toLocaleTimeString()}] ${msg}`] }));
  };

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  const runAccountTakeover = async () => {
    setRunning(true); setAttackLog([]);
    log('[ATO] Starting Account Takeover simulation');
    log('[ATO] MITRE: T1110 → T1078 → T1537');
    const targetUser = state.users.find(u => u.id === 'user_001');
    if (!targetUser) { log('[ATO] Target not found'); setRunning(false); return; }

    log('[ATO] Phase 1 — Credential stuffing');
    const wrongPasswords = ['123456', 'password', 'admin123', 'qwerty', 'letmein'];
    for (const wp of wrongPasswords) {
      await delay(300);
      const attackIP = randomIP(false); const attackDevice = randomDevice(false); const geo = randomGeo(false);
      const secCheck = checkSecurityControls('login', state, { userId: targetUser.id, ip: attackIP });
      const loginLog: LoginLog = { id: generateId(), userId: targetUser.id, username: targetUser.username, timestamp: Date.now(), ip: attackIP, device: attackDevice, success: false, geoLocation: geo, blocked: !secCheck.allowed, reason: secCheck.reason };
      setState(prev => {
        const updatedUsers = prev.users.map(u => {
          if (u.id === targetUser.id) {
            const attempts = u.failedLoginAttempts + 1;
            const lockCtrl = prev.securityControls.find(c => c.category === 'lockout');
            const maxAttempts = lockCtrl?.enabled ? (lockCtrl.config.maxFailedAttempts as number) : 999;
            return { ...u, failedLoginAttempts: attempts, isLocked: attempts >= maxAttempts, lockoutUntil: attempts >= maxAttempts ? Date.now() + 900000 : null };
          }
          return u;
        });
        const alert: FraudAlert = { id: generateId(), transactionId: null, loginLogId: loginLog.id, type: 'login', severity: 'high', description: `Brute force: ${targetUser.username} from ${attackIP} (${geo})`, timestamp: Date.now(), status: 'open', assignedTo: null, mitreId: 'T1110', mitreTactic: 'Credential Access' };
        return { ...prev, users: updatedUsers, loginLogs: [...prev.loginLogs, loginLog], fraudAlerts: [...prev.fraudAlerts, alert] };
      });
      log(`[ATO] Failed: ${wp} from ${attackIP} ${!secCheck.allowed ? '→ BLOCKED' : ''}`);
    }

    await delay(500);
    log('[ATO] Phase 2 — Valid credentials obtained');
    const attackIP = '203.0.113.42';
    const successLogin: LoginLog = { id: generateId(), userId: targetUser.id, username: targetUser.username, timestamp: Date.now(), ip: attackIP, device: 'Tor Browser/Unknown', success: true, geoLocation: 'Moscow, RU', blocked: false, reason: null };
    setState(prev => {
      const alert: FraudAlert = { id: generateId(), transactionId: null, loginLogId: successLogin.id, type: 'login', severity: 'critical', description: `Account takeover: Login from Moscow, RU via Tor after brute force`, timestamp: Date.now(), status: 'open', assignedTo: null, mitreId: 'T1078', mitreTactic: 'Initial Access' };
      return { ...prev, loginLogs: [...prev.loginLogs, successLogin], fraudAlerts: [...prev.fraudAlerts, alert] };
    });
    log('[ATO] Successful login from Moscow, RU via Tor');

    await delay(500);
    log('[ATO] Phase 3 — Fund transfer to mule');
    const fromAcc = state.accounts.find(a => a.userId === 'user_001');
    const muleAcc = state.accounts.find(a => a.userId === 'user_mule');
    if (fromAcc && muleAcc) {
      const amount = 45000;
      const txPartial: Partial<Transaction> = { fromAccountId: fromAcc.id, toAccountId: muleAcc.id, fromUserId: fromAcc.userId, toUserId: muleAcc.userId, amount, timestamp: Date.now(), ip: attackIP, device: 'Tor Browser/Unknown', geoLocation: 'Moscow, RU' };
      const risk = evaluateTransactionRisk(txPartial, state);
      const mlScore = mlPredict(txPartial, state);
      const secCheck = checkSecurityControls('transaction', state, { userId: fromAcc.userId, ip: attackIP, amount, riskScore: risk.riskScore });
      const txStatus = !secCheck.allowed ? 'blocked' : risk.isFlagged ? 'flagged' : 'completed';
      const tx: Transaction = { ...txPartial as Transaction, id: generateId(), type: 'transfer', status: txStatus, riskScore: risk.riskScore, isFlagged: true, fraudReasons: [...risk.reasons, 'ATO attack pattern'], reviewStatus: 'pending', reviewedBy: null, reviewNote: null, mitreAttackTechnique: 'T1537', attackScenario: 'Account Takeover', mlPrediction: mlScore, mlFlagged: mlScore > 0.5 };
      setState(prev => {
        let accounts = prev.accounts;
        if (txStatus !== 'blocked') {
          accounts = prev.accounts.map(a => { if (a.id === fromAcc.id) return { ...a, balance: a.balance - amount }; if (a.id === muleAcc.id) return { ...a, balance: a.balance + amount }; return a; });
        }
        const alert: FraudAlert = { id: generateId(), transactionId: tx.id, loginLogId: null, type: 'transaction', severity: 'critical', description: `ATO: ₱${amount.toLocaleString()} to mule. Status: ${txStatus}`, timestamp: Date.now(), status: 'open', assignedTo: null, mitreId: 'T1537', mitreTactic: 'Exfiltration' };
        return { ...prev, accounts, transactions: [...prev.transactions, tx], fraudAlerts: [...prev.fraudAlerts, alert] };
      });
      log(`[ATO] Transfer ₱${amount.toLocaleString()} → ${txStatus.toUpperCase()} (Risk: ${risk.riskScore})`);
    }
    log('[ATO] Simulation complete');
    setRunning(false);
  };

  const runPhishing = async () => {
    setRunning(true); setAttackLog([]);
    log('[PHISHING] Starting Phishing-Based Fraud simulation');
    log('[PHISHING] MITRE: T1566 → T1539 → T1537');
    const targetUser = state.users.find(u => u.id === 'user_002');
    if (!targetUser) { log('[PHISHING] Target not found'); setRunning(false); return; }

    await delay(400);
    log('[PHISHING] Phase 1 — Stolen credentials used');
    const loginLog: LoginLog = { id: generateId(), userId: targetUser.id, username: targetUser.username, timestamp: Date.now(), ip: '45.33.32.156', device: 'Chrome/Android', success: true, geoLocation: 'Lagos, NG', blocked: false, reason: null };
    setState(prev => {
      const alert: FraudAlert = { id: generateId(), transactionId: null, loginLogId: loginLog.id, type: 'login', severity: 'critical', description: `Phishing login: ${targetUser.username} from Lagos, NG`, timestamp: Date.now(), status: 'open', assignedTo: null, mitreId: 'T1566', mitreTactic: 'Initial Access' };
      return { ...prev, loginLogs: [...prev.loginLogs, loginLog], fraudAlerts: [...prev.fraudAlerts, alert] };
    });

    await delay(400);
    log('[PHISHING] Phase 2 — Session hijack: Lagos → Beijing');
    const hijackLog: LoginLog = { id: generateId(), userId: targetUser.id, username: targetUser.username, timestamp: Date.now(), ip: '91.132.147.5', device: 'Unknown/Linux', success: true, geoLocation: 'Beijing, CN', blocked: false, reason: null };
    setState(prev => {
      const alert: FraudAlert = { id: generateId(), transactionId: null, loginLogId: hijackLog.id, type: 'login', severity: 'critical', description: `Impossible travel: Lagos, NG → Beijing, CN in seconds`, timestamp: Date.now(), status: 'open', assignedTo: null, mitreId: 'T1539', mitreTactic: 'Credential Access' };
      return { ...prev, loginLogs: [...prev.loginLogs, hijackLog], fraudAlerts: [...prev.fraudAlerts, alert] };
    });

    await delay(400);
    log('[PHISHING] Phase 3 — Balance extraction');
    const fromAcc = state.accounts.find(a => a.userId === 'user_002');
    const muleAcc = state.accounts.find(a => a.userId === 'user_mule');
    if (fromAcc && muleAcc) {
      const amount = 80000;
      const txPartial: Partial<Transaction> = { fromAccountId: fromAcc.id, toAccountId: muleAcc.id, fromUserId: fromAcc.userId, toUserId: muleAcc.userId, amount, timestamp: Date.now(), ip: '91.132.147.5', device: 'Unknown/Linux', geoLocation: 'Beijing, CN' };
      const risk = evaluateTransactionRisk(txPartial, state);
      const mlScore = mlPredict(txPartial, state);
      const secCheck = checkSecurityControls('transaction', state, { userId: fromAcc.userId, ip: '91.132.147.5', amount, riskScore: risk.riskScore });
      const txStatus = !secCheck.allowed ? 'blocked' : 'flagged';
      const tx: Transaction = { ...txPartial as Transaction, id: generateId(), type: 'transfer', status: txStatus, riskScore: Math.min(risk.riskScore + 20, 100), isFlagged: true, fraudReasons: [...risk.reasons, 'Phishing attack', 'Session hijacking'], reviewStatus: 'pending', reviewedBy: null, reviewNote: null, mitreAttackTechnique: 'T1566', attackScenario: 'Phishing Fraud', mlPrediction: mlScore, mlFlagged: true };
      setState(prev => {
        const alert: FraudAlert = { id: generateId(), transactionId: tx.id, loginLogId: null, type: 'transaction', severity: 'critical', description: `Phishing fraud: ₱${amount.toLocaleString()} via hijacked session. ${txStatus.toUpperCase()}`, timestamp: Date.now(), status: 'open', assignedTo: null, mitreId: 'T1537', mitreTactic: 'Exfiltration' };
        return { ...prev, transactions: [...prev.transactions, tx], fraudAlerts: [...prev.fraudAlerts, alert] };
      });
      log(`[PHISHING] Transfer ₱${amount.toLocaleString()} → ${txStatus.toUpperCase()}`);
    }
    log('[PHISHING] Simulation complete');
    setRunning(false);
  };

  const runMoneyLaundering = async () => {
    setRunning(true); setAttackLog([]);
    log('[AML] Starting Money Laundering simulation (Smurfing)');
    const sourceAcc = state.accounts.find(a => a.userId === 'user_001');
    const midAcc = state.accounts.find(a => a.userId === 'user_003');
    const muleAcc = state.accounts.find(a => a.userId === 'user_mule');
    if (!sourceAcc || !midAcc || !muleAcc) { log('[AML] Accounts not found'); setRunning(false); return; }

    log('[AML] Phase 1 — Structuring small transactions');
    const smallAmounts = [4800, 4500, 4900, 3200, 4700, 3800, 4100, 4600];
    for (let i = 0; i < smallAmounts.length; i++) {
      await delay(200);
      const amount = smallAmounts[i];
      const ip = randomIP(true); const device = randomDevice(true); const geo = randomGeo(true);
      const txPartial: Partial<Transaction> = { fromAccountId: sourceAcc.id, toAccountId: midAcc.id, fromUserId: sourceAcc.userId, toUserId: midAcc.userId, amount, timestamp: Date.now(), ip, device, geoLocation: geo };
      const risk = evaluateTransactionRisk(txPartial, state);
      const mlScore = mlPredict(txPartial, state);
      const adjustedRisk = Math.min(risk.riskScore + (i >= 3 ? 25 : 0), 100);
      const reasons = [...risk.reasons]; if (i >= 3) reasons.push(`Smurfing: ${i + 1} rapid transfers`);
      const tx: Transaction = { ...txPartial as Transaction, id: generateId(), type: 'transfer', status: adjustedRisk >= 40 ? 'flagged' : 'completed', riskScore: adjustedRisk, isFlagged: adjustedRisk >= 40, fraudReasons: reasons, reviewStatus: adjustedRisk >= 40 ? 'pending' : null, reviewedBy: null, reviewNote: null, mitreAttackTechnique: 'T1565', attackScenario: 'Money Laundering - Smurfing', mlPrediction: mlScore, mlFlagged: mlScore > 0.5 };
      setState(prev => {
        const updatedAccounts = prev.accounts.map(a => { if (a.id === sourceAcc.id) return { ...a, balance: a.balance - amount }; if (a.id === midAcc.id) return { ...a, balance: a.balance + amount }; return a; });
        let alerts = prev.fraudAlerts;
        if (adjustedRisk >= 40) {
          alerts = [...prev.fraudAlerts, { id: generateId(), transactionId: tx.id, loginLogId: null, type: 'pattern' as const, severity: 'high' as const, description: `Smurfing: ₱${amount} (tx ${i + 1}/${smallAmounts.length})`, timestamp: Date.now(), status: 'open' as const, assignedTo: null, mitreId: 'T1565', mitreTactic: 'Impact' }];
        }
        return { ...prev, accounts: updatedAccounts, transactions: [...prev.transactions, tx], fraudAlerts: alerts };
      });
      log(`[AML] Smurf ${i + 1}: ₱${amount} → ${adjustedRisk >= 40 ? 'FLAGGED' : 'OK'}`);
    }

    await delay(500);
    log('[AML] Phase 2 — Layering through intermediate');
    const layerAmount = 25000;
    const layerTx: Transaction = { id: generateId(), fromAccountId: midAcc.id, toAccountId: muleAcc.id, fromUserId: midAcc.userId, toUserId: muleAcc.userId, amount: layerAmount, timestamp: Date.now(), type: 'transfer', status: 'flagged', riskScore: 75, isFlagged: true, fraudReasons: ['Layering pattern', 'Transfer to new account'], ip: randomIP(false), device: randomDevice(false), geoLocation: randomGeo(false), reviewStatus: 'pending', reviewedBy: null, reviewNote: null, mitreAttackTechnique: 'T1565', attackScenario: 'Money Laundering - Layering', mlPrediction: 0.82, mlFlagged: true };
    setState(prev => {
      const updatedAccounts = prev.accounts.map(a => { if (a.id === midAcc.id) return { ...a, balance: a.balance - layerAmount }; if (a.id === muleAcc.id) return { ...a, balance: a.balance + layerAmount }; return a; });
      const alert: FraudAlert = { id: generateId(), transactionId: layerTx.id, loginLogId: null, type: 'pattern', severity: 'critical', description: `Layering: ₱${layerAmount.toLocaleString()} to mule`, timestamp: Date.now(), status: 'open', assignedTo: null, mitreId: 'T1565', mitreTactic: 'Impact' };
      return { ...prev, accounts: updatedAccounts, transactions: [...prev.transactions, layerTx], fraudAlerts: [...prev.fraudAlerts, alert] };
    });
    log(`[AML] Layering: ₱${layerAmount.toLocaleString()} → FLAGGED`);
    log('[AML] Simulation complete');
    setRunning(false);
  };

  const runSIMSwap = async () => {
    setRunning(true); setAttackLog([]);
    log('[SIM-SWAP] Starting SIM Swap Attack simulation');
    log('[SIM-SWAP] MITRE: T1111 → T1078 → T1537');
    const targetUser = state.users.find(u => u.id === 'user_002');
    if (!targetUser) { log('[SIM-SWAP] Target not found'); setRunning(false); return; }

    await delay(500);
    log('[SIM-SWAP] Phase 1 — SIM ported via social engineering');
    setState(prev => ({ ...prev, fraudAlerts: [...prev.fraudAlerts, { id: generateId(), transactionId: null, loginLogId: null, type: 'login' as const, severity: 'high' as const, description: `SIM Swap: ${targetUser.username}'s number ported. MFA compromised.`, timestamp: Date.now(), status: 'open' as const, assignedTo: null, mitreId: 'T1111', mitreTactic: 'Credential Access' }] }));

    await delay(500);
    log('[SIM-SWAP] Phase 2 — Login with intercepted OTP');
    const attackIP = '198.51.100.7';
    const loginLog: LoginLog = { id: generateId(), userId: targetUser.id, username: targetUser.username, timestamp: Date.now(), ip: attackIP, device: 'Chrome/Android', success: true, geoLocation: 'London, UK', blocked: false, reason: null };
    setState(prev => ({ ...prev, loginLogs: [...prev.loginLogs, loginLog], fraudAlerts: [...prev.fraudAlerts, { id: generateId(), transactionId: null, loginLogId: loginLog.id, type: 'login' as const, severity: 'critical' as const, description: `MFA bypass via SIM swap: ${targetUser.username} from London, UK`, timestamp: Date.now(), status: 'open' as const, assignedTo: null, mitreId: 'T1078', mitreTactic: 'Initial Access' }] }));

    await delay(400);
    log('[SIM-SWAP] Phase 3 — Rapid fund extraction');
    const fromAcc = state.accounts.find(a => a.userId === 'user_002');
    const muleAcc = state.accounts.find(a => a.userId === 'user_mule');
    if (fromAcc && muleAcc) {
      const amounts = [25000, 30000, 15000];
      for (let i = 0; i < amounts.length; i++) {
        await delay(300);
        const amount = amounts[i];
        const txPartial: Partial<Transaction> = { fromAccountId: fromAcc.id, toAccountId: muleAcc.id, fromUserId: fromAcc.userId, toUserId: muleAcc.userId, amount, timestamp: Date.now(), ip: attackIP, device: 'Chrome/Android', geoLocation: 'London, UK' };
        const risk = evaluateTransactionRisk(txPartial, state);
        const mlScore = mlPredict(txPartial, state);
        const secCheck = checkSecurityControls('transaction', state, { userId: fromAcc.userId, ip: attackIP, amount, riskScore: risk.riskScore });
        const txStatus = !secCheck.allowed ? 'blocked' : 'flagged';
        const tx: Transaction = { ...txPartial as Transaction, id: generateId(), type: 'transfer', status: txStatus, riskScore: Math.min(risk.riskScore + 15, 100), isFlagged: true, fraudReasons: [...risk.reasons, 'SIM swap', 'MFA bypass'], reviewStatus: 'pending', reviewedBy: null, reviewNote: null, mitreAttackTechnique: 'T1111', attackScenario: 'SIM Swap Attack', mlPrediction: mlScore, mlFlagged: true };
        setState(prev => ({ ...prev, transactions: [...prev.transactions, tx], fraudAlerts: [...prev.fraudAlerts, { id: generateId(), transactionId: tx.id, loginLogId: null, type: 'transaction' as const, severity: 'critical' as const, description: `SIM Swap extraction ${i + 1}/3: ₱${amount.toLocaleString()}. ${txStatus.toUpperCase()}`, timestamp: Date.now(), status: 'open' as const, assignedTo: null, mitreId: 'T1537', mitreTactic: 'Exfiltration' }] }));
        log(`[SIM-SWAP] Transfer ${i + 1}/3: ₱${amount.toLocaleString()} → ${txStatus.toUpperCase()}`);
      }
    }
    log('[SIM-SWAP] Simulation complete');
    setRunning(false);
  };

  const runInsiderThreat = async () => {
    setRunning(true); setAttackLog([]);
    log('[INSIDER] Starting Insider Threat simulation');
    log('[INSIDER] MITRE: T1078.004 → T1530 → T1070');
    const insiderUser = state.users.find(u => u.id === 'user_003');
    if (!insiderUser) { log('[INSIDER] Not found'); setRunning(false); return; }

    await delay(400);
    log('[INSIDER] Phase 1 — Legitimate login');
    const loginLog: LoginLog = { id: generateId(), userId: insiderUser.id, username: insiderUser.username, timestamp: Date.now(), ip: '10.0.0.55', device: 'Chrome/Windows', success: true, geoLocation: 'Manila, PH', blocked: false, reason: null };
    setState(prev => ({ ...prev, loginLogs: [...prev.loginLogs, loginLog] }));

    await delay(500);
    log('[INSIDER] Phase 2 — Abnormal data access (15 accounts in 2 min)');
    setState(prev => ({ ...prev, fraudAlerts: [...prev.fraudAlerts, { id: generateId(), transactionId: null, loginLogId: loginLog.id, type: 'pattern' as const, severity: 'medium' as const, description: `Unusual data access: ${insiderUser.username} queried 15 accounts in 2 minutes`, timestamp: Date.now(), status: 'open' as const, assignedTo: null, mitreId: 'T1530', mitreTactic: 'Collection' }] }));

    await delay(400);
    log('[INSIDER] Phase 3 — Unauthorized transfers');
    const victimAcc = state.accounts.find(a => a.userId === 'user_001');
    const muleAcc = state.accounts.find(a => a.userId === 'user_mule');
    if (victimAcc && muleAcc) {
      const amounts = [12000, 8500, 15000, 9800];
      for (let i = 0; i < amounts.length; i++) {
        await delay(250);
        const amount = amounts[i];
        const txPartial: Partial<Transaction> = { fromAccountId: victimAcc.id, toAccountId: muleAcc.id, fromUserId: victimAcc.userId, toUserId: muleAcc.userId, amount, timestamp: Date.now(), ip: '10.0.0.55', device: 'Chrome/Windows', geoLocation: 'Manila, PH' };
        const risk = evaluateTransactionRisk(txPartial, state);
        const mlScore = mlPredict(txPartial, state);
        const tx: Transaction = { ...txPartial as Transaction, id: generateId(), type: 'transfer', status: risk.riskScore >= 40 ? 'flagged' : 'completed', riskScore: risk.riskScore, isFlagged: risk.riskScore >= 40 || i >= 2, fraudReasons: [...risk.reasons, ...(i >= 2 ? ['Insider threat', 'Unauthorized transfers'] : [])], reviewStatus: risk.riskScore >= 40 ? 'pending' : null, reviewedBy: null, reviewNote: null, mitreAttackTechnique: 'T1078.004', attackScenario: 'Insider Threat', mlPrediction: mlScore, mlFlagged: mlScore > 0.5 };
        setState(prev => {
          let alerts = prev.fraudAlerts;
          if (i >= 2) { alerts = [...prev.fraudAlerts, { id: generateId(), transactionId: tx.id, loginLogId: null, type: 'pattern' as const, severity: (i >= 3 ? 'critical' : 'high') as 'critical' | 'high', description: `Insider: ₱${amount.toLocaleString()} unauthorized transfer ${i + 1}/4`, timestamp: Date.now(), status: 'open' as const, assignedTo: null, mitreId: 'T1078.004', mitreTactic: 'Privilege Escalation' }]; }
          return { ...prev, transactions: [...prev.transactions, tx], fraudAlerts: alerts };
        });
        log(`[INSIDER] Transfer ${i + 1}/4: ₱${amount.toLocaleString()} — ${i >= 2 ? 'FLAGGED' : 'Undetected'}`);
      }

      await delay(400);
      log('[INSIDER] Phase 4 — Log tampering attempt detected');
      setState(prev => ({ ...prev, fraudAlerts: [...prev.fraudAlerts, { id: generateId(), transactionId: null, loginLogId: null, type: 'pattern' as const, severity: 'critical' as const, description: `Log tampering by ${insiderUser.username}. Audit integrity violation.`, timestamp: Date.now(), status: 'open' as const, assignedTo: null, mitreId: 'T1070', mitreTactic: 'Defense Evasion' }] }));
    }
    log('[INSIDER] Simulation complete');
    setRunning(false);
  };

  const attacks = [
    { id: 'ato', name: 'Account Takeover', icon: <UserX size={18} />, desc: 'Brute-force → credential stuffing → mule transfer', mitre: 'T1110, T1078, T1537', run: runAccountTakeover },
    { id: 'phishing', name: 'Phishing Fraud', icon: <Target size={18} />, desc: 'Stolen creds → session hijack → extraction', mitre: 'T1566, T1539, T1537', run: runPhishing },
    { id: 'aml', name: 'Money Laundering', icon: <Banknote size={18} />, desc: 'Smurfing → layering → mule account', mitre: 'T1565', run: runMoneyLaundering },
    { id: 'simswap', name: 'SIM Swap', icon: <Smartphone size={18} />, desc: 'Social engineering → MFA bypass → extraction', mitre: 'T1111, T1078, T1537', run: runSIMSwap },
    { id: 'insider', name: 'Insider Threat', icon: <UserCog size={18} />, desc: 'Legit access → data recon → unauthorized transfers', mitre: 'T1078.004, T1530, T1070', run: runInsiderThreat },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Attack Simulation — Red Team</h2>
        <p className="text-[12px] text-zinc-500 mt-0.5">Simulate real-world banking fraud with MITRE ATT&CK mapping</p>
      </div>

      {/* Attack Cards */}
      <div className="grid grid-cols-3 gap-3">
        {attacks.map((attack, i) => (
          <div key={attack.id} className={`glass-card rounded-xl p-4 flex flex-col animate-fade-in stagger-${Math.min(i + 1, 6)}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-red-500/6 border border-red-500/12 flex items-center justify-center text-red-400/70">
                {attack.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[12px] font-semibold text-zinc-200">{attack.name}</h3>
                <div className="text-[10px] text-red-400/50 font-mono mt-0.5">{attack.mitre}</div>
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed flex-1">{attack.desc}</p>
            <button
              onClick={attack.run} disabled={running}
              className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium transition-all ${
                running ? 'bg-surface-2 text-zinc-600 cursor-not-allowed' : 'bg-red-500/8 text-red-400/80 border border-red-500/15 hover:bg-red-500/12 hover:border-red-500/25'
              }`}
            >
              {running ? <Skull size={13} className="animate-pulse" /> : <Play size={13} />}
              {running ? 'Running...' : 'Launch'}
            </button>
          </div>
        ))}
      </div>

      {/* MITRE ATT&CK Reference */}
      <div className="glass-card rounded-xl p-5 animate-fade-in">
        <h3 className="text-[13px] font-semibold text-zinc-200 mb-3">MITRE ATT&CK Mapping</h3>
        <div className="grid grid-cols-5 gap-2">
          {[
            { id: 'T1110', name: 'Brute Force', tactic: 'Credential Access' },
            { id: 'T1078', name: 'Valid Accounts', tactic: 'Initial Access' },
            { id: 'T1566', name: 'Phishing', tactic: 'Initial Access' },
            { id: 'T1539', name: 'Session Cookie Steal', tactic: 'Credential Access' },
            { id: 'T1537', name: 'Transfer to Account', tactic: 'Exfiltration' },
            { id: 'T1565', name: 'Data Manipulation', tactic: 'Impact' },
            { id: 'T1111', name: 'MFA Interception', tactic: 'Credential Access' },
            { id: 'T1530', name: 'Data from Storage', tactic: 'Collection' },
            { id: 'T1070', name: 'Indicator Removal', tactic: 'Defense Evasion' },
            { id: 'T1078.004', name: 'Cloud Accounts', tactic: 'Privilege Escalation' },
          ].map(tech => (
            <div key={tech.id} className="bg-surface-2/40 rounded-lg p-2.5 border border-border-subtle">
              <div className="font-mono text-[11px] font-semibold text-red-400/60">{tech.id}</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">{tech.name}</div>
              <div className="text-[9px] text-zinc-700 mt-0.5">{tech.tactic}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Attack Log */}
      <div className="glass-card rounded-xl p-5 animate-fade-in">
        <h3 className="text-[13px] font-semibold text-zinc-200 mb-3 flex items-center gap-2"><Terminal size={13} className="text-zinc-500" /> Execution Log</h3>
        <div className="bg-surface-0 rounded-lg p-4 font-mono text-[11px] max-h-60 overflow-y-auto space-y-px border border-border-subtle">
          {attackLog.length === 0 ? (
            <div className="text-zinc-700">Select an attack scenario to begin.</div>
          ) : (
            attackLog.map((line, i) => (
              <div key={i} className={`leading-relaxed ${
                line.includes('BLOCKED') || line.includes('FLAGGED') ? 'text-red-400/70' :
                line.includes('complete') ? 'text-emerald-400/70' :
                line.includes('MITRE') ? 'text-purple-400/60' :
                line.includes('Phase') ? 'text-accent/60' :
                'text-zinc-500'
              }`}>{line}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
