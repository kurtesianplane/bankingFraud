import { useState } from 'react';
import { StoreState, generateId, generateAccountNumber, simpleHash, verifyHash, randomIP, randomDevice, randomGeo, evaluateTransactionRisk, checkSecurityControls, mlPredict } from '../store';
import { User, Account, Transaction, FraudAlert } from '../types';
import { UserPlus, LogIn, Send, History, Lock, Unlock, Eye, EyeOff, ArrowRight, Wallet } from 'lucide-react';

interface CoreBankingProps {
  state: StoreState;
  setState: React.Dispatch<React.SetStateAction<StoreState>>;
}

export function CoreBanking({ state, setState }: CoreBankingProps) {
  const [activeSection, setActiveSection] = useState<'register' | 'login' | 'transfer' | 'history'>('register');
  const [registerForm, setRegisterForm] = useState({ username: '', fullName: '', email: '', password: '' });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [transferForm, setTransferForm] = useState({ fromAccount: '', toAccount: '', amount: '' });
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [pendingTransfer, setPendingTransfer] = useState<{from: string; to: string; amount: number} | null>(null);

  const showMsg = (text: string, type: 'success' | 'error' | 'warning') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const addLog = (msg: string) => {
    setState(prev => ({ ...prev, eventLog: [...prev.eventLog, `[${new Date().toLocaleTimeString()}] ${msg}`] }));
  };

  const validateInput = (value: string, fieldName: string): boolean => {
    if (!value.trim()) { showMsg(`${fieldName} is required`, 'error'); return false; }
    if (value.includes('<') || value.includes('>') || value.includes("'") || value.includes('"')) {
      showMsg(`Invalid characters in ${fieldName} (potential injection)`, 'error'); return false;
    }
    return true;
  };

  const handleRegister = () => {
    const { username, fullName, email, password } = registerForm;
    if (!validateInput(username, 'Username') || !validateInput(fullName, 'Full Name') || !validateInput(email, 'Email') || !validateInput(password, 'Password')) return;
    if (password.length < 6) { showMsg('Password must be at least 6 characters', 'error'); return; }
    if (state.users.find(u => u.username === username)) { showMsg('Username already exists', 'error'); return; }

    const userId = generateId();
    const newUser: User = {
      id: userId, username, fullName, email,
      passwordHash: simpleHash(password),
      createdAt: Date.now(), isLocked: false, lockoutUntil: null,
      failedLoginAttempts: 0, mfaEnabled: false,
      knownIPs: [randomIP(true)], knownDevices: [randomDevice(true)],
      accountAge: 0
    };
    const newAccount: Account = {
      id: generateId(), userId, accountNumber: generateAccountNumber(),
      balance: 50000, dailyTransferred: 0, dailyTransferDate: '', isFrozen: false, type: 'checking'
    };

    setState(prev => ({ ...prev, users: [...prev.users, newUser], accounts: [...prev.accounts, newAccount] }));
    addLog(`[BANKING] New user registered: ${username} (Account: ${newAccount.accountNumber})`);
    showMsg(`Account created — #${newAccount.accountNumber} with ₱50,000 balance`, 'success');
    setRegisterForm({ username: '', fullName: '', email: '', password: '' });
  };

  const handleLogin = () => {
    const { username, password } = loginForm;
    if (!validateInput(username, 'Username') || !validateInput(password, 'Password')) return;

    const user = state.users.find(u => u.username === username);
    const ip = randomIP(Math.random() > 0.3);
    const device = randomDevice(Math.random() > 0.3);
    const geo = randomGeo(Math.random() > 0.3);

    if (!user) { showMsg('User not found', 'error'); return; }

    const secCheck = checkSecurityControls('login', state, { userId: user.id, ip });
    if (!secCheck.allowed) {
      const log = { id: generateId(), userId: user.id, username, timestamp: Date.now(), ip, device, success: false, geoLocation: geo, blocked: true, reason: secCheck.reason };
      setState(prev => ({ ...prev, loginLogs: [...prev.loginLogs, log] }));
      addLog(`[SECURITY] Login BLOCKED for ${username}: ${secCheck.reason}`);
      showMsg(`Login blocked: ${secCheck.reason}`, 'error');
      return;
    }

    const success = verifyHash(password, user.passwordHash);
    const log = { id: generateId(), userId: user.id, username, timestamp: Date.now(), ip, device, success, geoLocation: geo, blocked: false, reason: null };

    if (success) {
      const isNewIP = !user.knownIPs.includes(ip);
      const isNewDevice = !user.knownDevices.includes(device);
      setState(prev => {
        const updatedUsers = prev.users.map(u => u.id === user.id ? { ...u, failedLoginAttempts: 0, isLocked: false, lockoutUntil: null } : u);
        const newState = { ...prev, currentUser: user, users: updatedUsers, loginLogs: [...prev.loginLogs, log] };
        if (isNewIP || isNewDevice) {
          const alert: FraudAlert = {
            id: generateId(), transactionId: null, loginLogId: log.id,
            type: 'login', severity: isNewIP && isNewDevice ? 'high' : 'medium',
            description: `Suspicious login: ${isNewIP ? 'New IP ' + ip : ''} ${isNewDevice ? 'New device ' + device : ''} from ${geo}`,
            timestamp: Date.now(), status: 'open', assignedTo: null,
            mitreId: 'T1078', mitreTactic: 'Initial Access'
          };
          newState.fraudAlerts = [...prev.fraudAlerts, alert];
        }
        return newState;
      });
      addLog(`[AUTH] Login SUCCESS: ${username} from ${ip} (${device}) @ ${geo}`);
      showMsg(`Welcome, ${user.fullName} — ${ip} · ${device} · ${geo}`, 'success');
    } else {
      setState(prev => {
        const updatedUsers = prev.users.map(u => {
          if (u.id === user.id) {
            const attempts = u.failedLoginAttempts + 1;
            const lockCtrl = prev.securityControls.find(c => c.category === 'lockout');
            const maxAttempts = lockCtrl?.enabled ? (lockCtrl.config.maxFailedAttempts as number) : 999;
            return { ...u, failedLoginAttempts: attempts, isLocked: attempts >= maxAttempts, lockoutUntil: attempts >= maxAttempts ? Date.now() + 900000 : null };
          }
          return u;
        });
        return { ...prev, users: updatedUsers, loginLogs: [...prev.loginLogs, log] };
      });
      addLog(`[AUTH] Login FAILED: ${username} - Invalid password (attempt #${user.failedLoginAttempts + 1})`);
      showMsg(`Invalid credentials — attempt #${user.failedLoginAttempts + 1}`, 'error');
    }
    setLoginForm({ username: '', password: '' });
  };

  const executeTransfer = (fromAccId: string, toAccId: string, amount: number) => {
    const fromAcc = state.accounts.find(a => a.accountNumber === fromAccId);
    const toAcc = state.accounts.find(a => a.accountNumber === toAccId);
    if (!fromAcc || !toAcc) { showMsg('Invalid account number(s)', 'error'); return; }
    if (fromAcc.isFrozen) { showMsg('Source account is frozen', 'error'); return; }
    if (fromAcc.balance < amount) { showMsg('Insufficient balance', 'error'); return; }

    const ip = randomIP(Math.random() > 0.2);
    const device = randomDevice(Math.random() > 0.2);
    const geo = randomGeo(Math.random() > 0.2);

    const txPartial: Partial<Transaction> = {
      fromAccountId: fromAcc.id, toAccountId: toAcc.id,
      fromUserId: fromAcc.userId, toUserId: toAcc.userId,
      amount, timestamp: Date.now(), ip, device, geoLocation: geo
    };

    const risk = evaluateTransactionRisk(txPartial, state);
    const mlScore = mlPredict(txPartial, state);

    const secCheck = checkSecurityControls('transaction', state, {
      userId: fromAcc.userId, ip, amount, riskScore: risk.riskScore
    });

    if (!secCheck.allowed) {
      const tx: Transaction = {
        ...txPartial as Transaction, id: generateId(),
        type: 'transfer', status: 'blocked',
        riskScore: risk.riskScore, isFlagged: true, fraudReasons: [...risk.reasons, secCheck.reason || ''],
        reviewStatus: null, reviewedBy: null, reviewNote: null,
        mitreAttackTechnique: null, attackScenario: null,
        mlPrediction: mlScore, mlFlagged: mlScore > 0.5
      };
      setState(prev => ({ ...prev, transactions: [...prev.transactions, tx] }));
      addLog(`[BLOCKED] Transfer ₱${amount.toLocaleString()} blocked: ${secCheck.reason}`);
      showMsg(`Transaction blocked: ${secCheck.reason}`, 'error');
      return;
    }

    if (secCheck.requiresMFA && !mfaRequired) {
      setMfaRequired(true);
      setPendingTransfer({ from: fromAccId, to: toAccId, amount });
      showMsg(`MFA required — Simulated OTP: 123456`, 'warning');
      addLog(`[SECURITY] Step-up auth triggered for ₱${amount.toLocaleString()} transfer (risk: ${risk.riskScore})`);
      return;
    }

    const status = risk.isFlagged ? 'flagged' : 'completed';
    const tx: Transaction = {
      id: generateId(), fromAccountId: fromAcc.id, toAccountId: toAcc.id,
      fromUserId: fromAcc.userId, toUserId: toAcc.userId,
      amount, timestamp: Date.now(), type: 'transfer', status,
      riskScore: risk.riskScore, isFlagged: risk.isFlagged,
      fraudReasons: risk.reasons, ip, device, geoLocation: geo,
      reviewStatus: risk.isFlagged ? 'pending' : null,
      reviewedBy: null, reviewNote: null,
      mitreAttackTechnique: null, attackScenario: null,
      mlPrediction: mlScore, mlFlagged: mlScore > 0.5
    };

    setState(prev => {
      const today = new Date().toDateString();
      const updatedAccounts = prev.accounts.map(a => {
        if (a.id === fromAcc.id) return { ...a, balance: a.balance - amount, dailyTransferred: (a.dailyTransferDate === today ? a.dailyTransferred : 0) + amount, dailyTransferDate: today };
        if (a.id === toAcc.id) return { ...a, balance: a.balance + amount };
        return a;
      });
      let newAlerts = prev.fraudAlerts;
      if (risk.isFlagged) {
        newAlerts = [...prev.fraudAlerts, {
          id: generateId(), transactionId: tx.id, loginLogId: null,
          type: 'transaction' as const,
          severity: (risk.riskScore >= 80 ? 'critical' : risk.riskScore >= 60 ? 'high' : risk.riskScore >= 40 ? 'medium' : 'low') as 'critical' | 'high' | 'medium' | 'low',
          description: `Suspicious transfer: ₱${amount.toLocaleString()} | ${risk.reasons.join(', ')}`,
          timestamp: Date.now(), status: 'open', assignedTo: null, mitreId: null, mitreTactic: null
        }];
      }
      return { ...prev, accounts: updatedAccounts, transactions: [...prev.transactions, tx], fraudAlerts: newAlerts };
    });

    addLog(`[TRANSFER] ₱${amount.toLocaleString()} from ${fromAccId} → ${toAccId} | Risk: ${risk.riskScore} | Status: ${status}`);
    showMsg(
      risk.isFlagged
        ? `Transfer flagged — ₱${amount.toLocaleString()}, Risk: ${risk.riskScore}`
        : `Transfer complete — ₱${amount.toLocaleString()}`,
      risk.isFlagged ? 'warning' : 'success'
    );
    setTransferForm({ fromAccount: '', toAccount: '', amount: '' });
    setMfaRequired(false); setPendingTransfer(null); setMfaCode('');
  };

  const handleTransfer = () => {
    const { fromAccount, toAccount, amount } = transferForm;
    if (!validateInput(fromAccount, 'From Account') || !validateInput(toAccount, 'To Account')) return;
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { showMsg('Invalid amount', 'error'); return; }
    if (fromAccount === toAccount) { showMsg('Cannot transfer to same account', 'error'); return; }
    executeTransfer(fromAccount, toAccount, amt);
  };

  const handleMFAVerify = () => {
    if (mfaCode === '123456' && pendingTransfer) {
      showMsg('MFA verified', 'success');
      addLog('[AUTH] MFA verification successful');
      setMfaRequired(false);
      executeTransfer(pendingTransfer.from, pendingTransfer.to, pendingTransfer.amount);
    } else {
      showMsg('Invalid OTP code', 'error');
    }
  };

  const sections = [
    { id: 'register' as const, label: 'Register', icon: <UserPlus size={13} /> },
    { id: 'login' as const, label: 'Login', icon: <LogIn size={13} /> },
    { id: 'transfer' as const, label: 'Transfer', icon: <Send size={13} /> },
    { id: 'history' as const, label: 'History', icon: <History size={13} /> },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Core Banking System</h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">Simulated digital banking with user management and transaction processing</p>
        </div>
        {state.currentUser && (
          <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/15 px-3 py-1.5 rounded-lg animate-fade-in-fast">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-dot-pulse" />
            <span className="text-[11px] text-emerald-400/80 font-medium">{state.currentUser.fullName}</span>
          </div>
        )}
      </div>

      {/* Alert message */}
      {message && (
        <div className={`px-4 py-2.5 rounded-lg text-[12px] font-medium border animate-scale-in ${
          message.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400/90' :
          message.type === 'error' ? 'bg-red-500/5 border-red-500/15 text-red-400/90' :
          'bg-amber-500/5 border-amber-500/15 text-amber-400/90'
        }`}>{message.text}</div>
      )}

      {/* Section tabs */}
      <div className="flex gap-1 bg-surface-2/50 p-1 rounded-lg border border-border-subtle w-fit">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
              activeSection === s.id
                ? 'bg-surface-3 text-zinc-200 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-400'
            }`}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Registration */}
      {activeSection === 'register' && (
        <div className="glass-card rounded-xl p-5 space-y-4 animate-fade-in">
          <h3 className="text-[13px] font-semibold text-zinc-200 flex items-center gap-2"><UserPlus size={14} className="text-accent" /> User Registration</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-zinc-500 font-medium block mb-1.5">Username</label>
              <input className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-[12px] text-zinc-200 placeholder:text-zinc-600" placeholder="jdelacruz" value={registerForm.username} onChange={e => setRegisterForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 font-medium block mb-1.5">Full Name</label>
              <input className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-[12px] text-zinc-200 placeholder:text-zinc-600" placeholder="Juan Dela Cruz" value={registerForm.fullName} onChange={e => setRegisterForm(f => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 font-medium block mb-1.5">Email</label>
              <input className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-[12px] text-zinc-200 placeholder:text-zinc-600" placeholder="juan@email.com" value={registerForm.email} onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 font-medium block mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-[12px] text-zinc-200 placeholder:text-zinc-600 pr-9" placeholder="Min 6 characters" value={registerForm.password} onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))} />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-2 text-zinc-600 hover:text-zinc-400">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
          <div className="bg-surface-2/60 rounded-lg px-3 py-2 text-[11px] text-zinc-500 border border-border-subtle">
            <span className="text-zinc-400 font-medium">Security note:</span> Password hashed with simulated bcrypt. Input validated against injection.
          </div>
          <button onClick={handleRegister} className="w-full bg-accent hover:bg-accent-muted text-white font-medium py-2 rounded-lg text-[12px] transition-all hover:shadow-lg hover:shadow-accent/10">Create Account</button>
        </div>
      )}

      {/* Login */}
      {activeSection === 'login' && (
        <div className="glass-card rounded-xl p-5 space-y-4 animate-fade-in">
          <h3 className="text-[13px] font-semibold text-zinc-200 flex items-center gap-2"><LogIn size={14} className="text-accent" /> User Login</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-zinc-500 font-medium block mb-1.5">Username</label>
              <input className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-[12px] text-zinc-200 placeholder:text-zinc-600" placeholder="Username" value={loginForm.username} onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div>
              <label className="text-[11px] text-zinc-500 font-medium block mb-1.5">Password</label>
              <input type="password" className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-[12px] text-zinc-200 placeholder:text-zinc-600" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>
          <div className="bg-surface-2/60 rounded-lg px-3 py-2 text-[11px] text-zinc-500 border border-border-subtle">
            <span className="text-zinc-400 font-medium">Test credentials:</span> jdelacruz / password123 — mreyes / securepass — rsantos / mypassword
          </div>
          <button onClick={handleLogin} className="w-full bg-accent hover:bg-accent-muted text-white font-medium py-2 rounded-lg text-[12px] transition-all hover:shadow-lg hover:shadow-accent/10">Sign In</button>
        </div>
      )}

      {/* Transfer */}
      {activeSection === 'transfer' && (
        <div className="glass-card rounded-xl p-5 space-y-4 animate-fade-in">
          <h3 className="text-[13px] font-semibold text-zinc-200 flex items-center gap-2"><Send size={14} className="text-accent" /> Transfer Money</h3>
          {mfaRequired ? (
            <div className="space-y-3">
              <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg px-4 py-2.5 text-[12px] text-amber-400/90 flex items-center gap-2">
                <Lock size={13} /> Step-up authentication required
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 font-medium block mb-1.5">OTP Code <span className="text-zinc-600">(simulated: 123456)</span></label>
                <input className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-[12px] text-zinc-200 placeholder:text-zinc-600" placeholder="6-digit OTP" value={mfaCode} onChange={e => setMfaCode(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleMFAVerify} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 rounded-lg text-[12px] flex items-center justify-center gap-2"><Unlock size={13} /> Verify</button>
                <button onClick={() => { setMfaRequired(false); setPendingTransfer(null); }} className="flex-1 bg-surface-3 text-zinc-400 font-medium py-2 rounded-lg text-[12px] border border-border-subtle hover:border-border-default">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-500 font-medium block mb-1.5">From Account</label>
                  <input className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-[12px] text-zinc-200 placeholder:text-zinc-600 font-mono" placeholder="9001234567" value={transferForm.fromAccount} onChange={e => setTransferForm(f => ({ ...f, fromAccount: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 font-medium block mb-1.5">To Account</label>
                  <input className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-[12px] text-zinc-200 placeholder:text-zinc-600 font-mono" placeholder="9009876543" value={transferForm.toAccount} onChange={e => setTransferForm(f => ({ ...f, toAccount: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 font-medium block mb-1.5">Amount (₱)</label>
                  <input type="number" className="w-full bg-surface-2 border border-border-subtle rounded-lg px-3 py-2 text-[12px] text-zinc-200 placeholder:text-zinc-600 font-mono" placeholder="0.00" value={transferForm.amount} onChange={e => setTransferForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
              </div>
              <button onClick={handleTransfer} className="w-full bg-accent hover:bg-accent-muted text-white font-medium py-2 rounded-lg text-[12px] flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-accent/10"><ArrowRight size={13} /> Send Transfer</button>
            </>
          )}
        </div>
      )}

      {/* Accounts & Login Logs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-4 animate-fade-in stagger-1">
          <h3 className="text-[12px] font-semibold text-zinc-300 mb-3 flex items-center gap-2"><Wallet size={13} className="text-zinc-500" /> Accounts</h3>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {state.accounts.map(acc => {
              const user = state.users.find(u => u.id === acc.userId);
              return (
                <div key={acc.id} className={`px-3 py-2.5 rounded-lg border text-[11px] transition-all hover:border-border-default ${acc.isFrozen ? 'bg-blue-500/3 border-blue-500/15' : 'bg-surface-2/40 border-border-subtle'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-300 font-medium">{user?.fullName}</span>
                    <span className={`font-semibold font-mono tabular-nums ${acc.isFrozen ? 'text-blue-400/80' : 'text-emerald-400/80'}`}>₱{acc.balance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mt-1 text-zinc-600">
                    <span className="font-mono">{acc.accountNumber}</span>
                    <span>{acc.type}{acc.isFrozen ? ' · Frozen' : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 animate-fade-in stagger-2">
          <h3 className="text-[12px] font-semibold text-zinc-300 mb-3 flex items-center gap-2"><LogIn size={13} className="text-zinc-500" /> Login Activity</h3>
          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {state.loginLogs.length === 0 ? (
              <p className="text-[11px] text-zinc-700 text-center py-6">No login activity</p>
            ) : (
              state.loginLogs.slice(-10).reverse().map(log => (
                <div key={log.id} className={`px-3 py-2.5 rounded-lg border text-[11px] ${log.success ? 'bg-surface-2/40 border-border-subtle' : log.blocked ? 'bg-red-500/3 border-red-500/10' : 'bg-amber-500/3 border-amber-500/10'}`}>
                  <div className="flex justify-between">
                    <span className="text-zinc-300 font-medium">{log.username}</span>
                    <span className={`font-medium ${log.success ? 'text-emerald-400/70' : log.blocked ? 'text-red-400/70' : 'text-amber-400/70'}`}>
                      {log.success ? 'Success' : log.blocked ? 'Blocked' : 'Failed'}
                    </span>
                  </div>
                  <div className="text-zinc-600 mt-0.5 font-mono">{log.ip} · {log.device}</div>
                  {log.reason && <div className="text-red-400/60 mt-0.5">{log.reason}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Transaction History */}
      {activeSection === 'history' && (
        <div className="glass-card rounded-xl p-4 animate-fade-in">
          <h3 className="text-[12px] font-semibold text-zinc-300 mb-3 flex items-center gap-2"><History size={13} className="text-zinc-500" /> Transaction History</h3>
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {state.transactions.length === 0 ? (
              <p className="text-[11px] text-zinc-700 text-center py-6">No transactions yet</p>
            ) : (
              state.transactions.slice().reverse().map(tx => {
                const fromUser = state.users.find(u => u.id === tx.fromUserId);
                const toUser = state.users.find(u => u.id === tx.toUserId);
                return (
                  <div key={tx.id} className={`px-3 py-3 rounded-lg border text-[11px] ${
                    tx.status === 'blocked' ? 'bg-red-500/3 border-red-500/10' :
                    tx.status === 'flagged' ? 'bg-amber-500/3 border-amber-500/10' :
                    'bg-surface-2/40 border-border-subtle'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300">{fromUser?.fullName} <ArrowRight size={10} className="inline mx-1 text-zinc-600" /> {toUser?.fullName}</span>
                      <span className="font-semibold text-zinc-200 font-mono tabular-nums">₱{tx.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-zinc-600">{new Date(tx.timestamp).toLocaleString()}</span>
                      <div className="flex items-center gap-2">
                        {tx.riskScore > 0 && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-16 bg-surface-2 rounded-full h-1">
                              <div className={`h-1 rounded-full risk-bar ${tx.riskScore >= 70 ? 'bg-red-500/80' : tx.riskScore >= 40 ? 'bg-amber-500/80' : 'bg-emerald-500/80'}`} style={{ width: `${tx.riskScore}%` }} />
                            </div>
                            <span className={`text-[10px] font-mono tabular-nums ${tx.riskScore >= 70 ? 'text-red-400/60' : tx.riskScore >= 40 ? 'text-amber-400/60' : 'text-emerald-400/60'}`}>{tx.riskScore}</span>
                          </div>
                        )}
                        <span className={`text-[10px] font-medium uppercase tracking-wider ${
                          tx.status === 'blocked' ? 'text-red-400/70' : tx.status === 'flagged' ? 'text-amber-400/70' : 'text-emerald-400/70'
                        }`}>{tx.status}</span>
                      </div>
                    </div>
                    {tx.fraudReasons.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {tx.fraudReasons.map((r, i) => (
                          <span key={i} className="bg-amber-500/5 text-amber-400/60 px-1.5 py-0.5 rounded text-[10px] border border-amber-500/10">{r}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
