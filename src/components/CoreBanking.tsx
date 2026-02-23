import { useState } from 'react';
import { StoreState, generateId, generateAccountNumber, simpleHash, verifyHash, randomIP, randomDevice, randomGeo, evaluateTransactionRisk, checkSecurityControls, mlPredict } from '../store';
import { User, Account, Transaction, LoginLog, FraudAlert } from '../types';
import { UserPlus, LogIn, Send, History, DollarSign, Lock, Unlock, Eye, EyeOff } from 'lucide-react';

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

    setState(prev => ({
      ...prev,
      users: [...prev.users, newUser],
      accounts: [...prev.accounts, newAccount]
    }));
    addLog(`[BANKING] New user registered: ${username} (Account: ${newAccount.accountNumber})`);
    showMsg(`User ${username} registered! Account #${newAccount.accountNumber} created with ₱50,000 balance. Password hash: ${simpleHash(password).substring(0, 25)}...`, 'success');
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

    // Check security controls
    const secCheck = checkSecurityControls('login', state, { userId: user.id, ip });
    if (!secCheck.allowed) {
      const log: LoginLog = {
        id: generateId(), userId: user.id, username, timestamp: Date.now(),
        ip, device, success: false, geoLocation: geo, blocked: true, reason: secCheck.reason
      };
      setState(prev => ({ ...prev, loginLogs: [...prev.loginLogs, log] }));
      addLog(`[SECURITY] Login BLOCKED for ${username}: ${secCheck.reason}`);
      showMsg(`Login blocked: ${secCheck.reason}`, 'error');
      return;
    }

    const success = verifyHash(password, user.passwordHash);
    const log: LoginLog = {
      id: generateId(), userId: user.id, username, timestamp: Date.now(),
      ip, device, success, geoLocation: geo, blocked: false, reason: null
    };

    if (success) {
      // Check for suspicious login
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
      showMsg(`Welcome back, ${user.fullName}! IP: ${ip}, Device: ${device}, Location: ${geo}`, 'success');
    } else {
      setState(prev => {
        const updatedUsers = prev.users.map(u => {
          if (u.id === user.id) {
            const attempts = u.failedLoginAttempts + 1;
            const lockCtrl = prev.securityControls.find(c => c.category === 'lockout');
            const maxAttempts = lockCtrl?.enabled ? (lockCtrl.config.maxFailedAttempts as number) : 999;
            const shouldLock = attempts >= maxAttempts;
            return {
              ...u,
              failedLoginAttempts: attempts,
              isLocked: shouldLock,
              lockoutUntil: shouldLock ? Date.now() + 15 * 60000 : null
            };
          }
          return u;
        });
        return { ...prev, users: updatedUsers, loginLogs: [...prev.loginLogs, log] };
      });
      addLog(`[AUTH] Login FAILED: ${username} - Invalid password (attempt #${user.failedLoginAttempts + 1})`);
      showMsg(`Invalid password! Failed attempt #${user.failedLoginAttempts + 1}`, 'error');
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

    // Check security controls
    const secCheck = checkSecurityControls('transaction', state, {
      userId: fromAcc.userId, ip, amount, riskScore: risk.riskScore
    });

    if (!secCheck.allowed) {
      const blockedId = generateId();
      const tx: Transaction = {
        ...txPartial as Transaction,
        id: blockedId,
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
      showMsg(`MFA required! Simulated OTP: 123456. Risk score: ${risk.riskScore}`, 'warning');
      addLog(`[SECURITY] Step-up auth triggered for ₱${amount.toLocaleString()} transfer (risk: ${risk.riskScore})`);
      return;
    }

    const status = risk.isFlagged ? 'flagged' : 'completed';
    const tx: Transaction = {
      id: generateId(),
      fromAccountId: fromAcc.id, toAccountId: toAcc.id,
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
        const alert: FraudAlert = {
          id: generateId(), transactionId: tx.id, loginLogId: null,
          type: 'transaction',
          severity: risk.riskScore >= 80 ? 'critical' : risk.riskScore >= 60 ? 'high' : risk.riskScore >= 40 ? 'medium' : 'low',
          description: `Suspicious transfer: ₱${amount.toLocaleString()} | ${risk.reasons.join(', ')}`,
          timestamp: Date.now(), status: 'open', assignedTo: null,
          mitreId: null, mitreTactic: null
        };
        newAlerts = [...prev.fraudAlerts, alert];
      }

      return { ...prev, accounts: updatedAccounts, transactions: [...prev.transactions, tx], fraudAlerts: newAlerts };
    });

    addLog(`[TRANSFER] ₱${amount.toLocaleString()} from ${fromAccId} → ${toAccId} | Risk: ${risk.riskScore} | Status: ${status} | ML: ${(mlScore * 100).toFixed(1)}%`);
    showMsg(
      risk.isFlagged
        ? `Transfer flagged! Amount: ₱${amount.toLocaleString()}, Risk Score: ${risk.riskScore}. Reasons: ${risk.reasons.join('; ')}`
        : `Transfer successful! ₱${amount.toLocaleString()} sent. Risk Score: ${risk.riskScore}`,
      risk.isFlagged ? 'warning' : 'success'
    );
    setTransferForm({ fromAccount: '', toAccount: '', amount: '' });
    setMfaRequired(false);
    setPendingTransfer(null);
    setMfaCode('');
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
      showMsg('MFA verified! Processing transfer...', 'success');
      addLog('[AUTH] MFA verification successful');
      setMfaRequired(false);
      executeTransfer(pendingTransfer.from, pendingTransfer.to, pendingTransfer.amount);
    } else {
      showMsg('Invalid OTP code', 'error');
    }
  };

  const sections = [
    { id: 'register' as const, label: 'Register', icon: <UserPlus size={14} /> },
    { id: 'login' as const, label: 'Login', icon: <LogIn size={14} /> },
    { id: 'transfer' as const, label: 'Transfer', icon: <Send size={14} /> },
    { id: 'history' as const, label: 'History', icon: <History size={14} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">🟢 Phase 1 — Core Banking Simulation</h2>
          <p className="text-sm text-gray-400 mt-1">Simulated digital banking environment with user management and transactions</p>
        </div>
        {state.currentUser && (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-green-400">Logged in: {state.currentUser.fullName}</span>
          </div>
        )}
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm border ${
          message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
          message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
          'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
        }`}>{message.text}</div>
      )}

      <div className="flex gap-2">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeSection === s.id ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
            }`}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'register' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><UserPlus size={16} /> User Registration</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Username</label>
              <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none" placeholder="e.g. jdelacruz" value={registerForm.username} onChange={e => setRegisterForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Full Name</label>
              <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none" placeholder="e.g. Juan Dela Cruz" value={registerForm.fullName} onChange={e => setRegisterForm(f => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Email</label>
              <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none" placeholder="e.g. juan@email.com" value={registerForm.email} onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none pr-10" placeholder="Min 6 characters" value={registerForm.password} onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))} />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-500">
            <strong className="text-gray-400">🔐 Security:</strong> Password will be hashed using simulated bcrypt. Input is validated against injection characters.
          </div>
          <button onClick={handleRegister} className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg text-sm transition-colors">Create Account</button>
        </div>
      )}

      {activeSection === 'login' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><LogIn size={16} /> User Login</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Username</label>
              <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none" placeholder="Username" value={loginForm.username} onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Password</label>
              <input type="password" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-xs text-gray-500">
            <strong className="text-gray-400">💡 Test accounts:</strong> jdelacruz/password123 • mreyes/securepass • rsantos/mypassword
          </div>
          <button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition-colors">Login</button>
        </div>
      )}

      {activeSection === 'transfer' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Send size={16} /> Transfer Money</h3>
          {mfaRequired ? (
            <div className="space-y-3">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-sm text-yellow-400">
                <Lock size={14} className="inline mr-1" /> Step-up authentication required! Enter OTP to proceed.
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">OTP Code (simulated: 123456)</label>
                <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-yellow-500 focus:outline-none" placeholder="Enter 6-digit OTP" value={mfaCode} onChange={e => setMfaCode(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleMFAVerify} className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"><Unlock size={14} /> Verify OTP</button>
                <button onClick={() => { setMfaRequired(false); setPendingTransfer(null); }} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded-lg text-sm transition-colors">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">From Account #</label>
                  <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none" placeholder="Account #" value={transferForm.fromAccount} onChange={e => setTransferForm(f => ({ ...f, fromAccount: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">To Account #</label>
                  <input className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none" placeholder="Account #" value={transferForm.toAccount} onChange={e => setTransferForm(f => ({ ...f, toAccount: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Amount (₱)</label>
                  <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 focus:outline-none" placeholder="0.00" value={transferForm.amount} onChange={e => setTransferForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
              </div>
              <button onClick={handleTransfer} className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg text-sm transition-colors">Send Transfer</button>
            </>
          )}
        </div>
      )}

      {/* Users & Accounts Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><DollarSign size={14} /> Accounts</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {state.accounts.map(acc => {
              const user = state.users.find(u => u.id === acc.userId);
              return (
                <div key={acc.id} className={`p-2.5 rounded-lg border text-xs ${acc.isFrozen ? 'bg-blue-500/5 border-blue-500/20' : 'bg-gray-800/50 border-gray-700/50'}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 font-medium">{user?.fullName}</span>
                    <span className={`font-bold ${acc.isFrozen ? 'text-blue-400' : 'text-green-400'}`}>₱{acc.balance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-gray-500">#{acc.accountNumber}</span>
                    <span className="text-gray-500">{acc.type} {acc.isFrozen ? '🧊 FROZEN' : ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><LogIn size={14} /> Recent Login Logs</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {state.loginLogs.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-4">No login activity yet</p>
            ) : (
              state.loginLogs.slice(-10).reverse().map(log => (
                <div key={log.id} className={`p-2.5 rounded-lg border text-xs ${log.success ? 'bg-gray-800/50 border-gray-700/50' : log.blocked ? 'bg-red-500/5 border-red-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
                  <div className="flex justify-between">
                    <span className="text-gray-300">{log.username}</span>
                    <span className={log.success ? 'text-green-400' : log.blocked ? 'text-red-400' : 'text-yellow-400'}>
                      {log.success ? '✓ Success' : log.blocked ? '✕ Blocked' : '✕ Failed'}
                    </span>
                  </div>
                  <div className="text-gray-500 mt-1">{log.ip} • {log.device} • {log.geoLocation}</div>
                  {log.reason && <div className="text-red-400 mt-1">⚠ {log.reason}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {activeSection === 'history' && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><History size={14} /> Transaction History</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {state.transactions.length === 0 ? (
              <p className="text-xs text-gray-600 text-center py-4">No transactions yet</p>
            ) : (
              state.transactions.slice().reverse().map(tx => {
                const fromUser = state.users.find(u => u.id === tx.fromUserId);
                const toUser = state.users.find(u => u.id === tx.toUserId);
                return (
                  <div key={tx.id} className={`p-3 rounded-lg border text-xs ${
                    tx.status === 'blocked' ? 'bg-red-500/5 border-red-500/20' :
                    tx.status === 'flagged' ? 'bg-yellow-500/5 border-yellow-500/20' :
                    'bg-gray-800/50 border-gray-700/50'
                  }`}>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">{fromUser?.fullName} → {toUser?.fullName}</span>
                      <span className="font-bold text-white">₱{tx.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-500">{new Date(tx.timestamp).toLocaleString()}</span>
                      <span className={
                        tx.status === 'blocked' ? 'text-red-400' :
                        tx.status === 'flagged' ? 'text-yellow-400' :
                        'text-green-400'
                      }>{tx.status.toUpperCase()}</span>
                    </div>
                    {tx.riskScore > 0 && (
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-gray-500">Risk: </span>
                        <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${tx.riskScore >= 70 ? 'bg-red-500' : tx.riskScore >= 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${tx.riskScore}%` }} />
                        </div>
                        <span className={`${tx.riskScore >= 70 ? 'text-red-400' : tx.riskScore >= 40 ? 'text-yellow-400' : 'text-green-400'}`}>{tx.riskScore}</span>
                      </div>
                    )}
                    {tx.fraudReasons.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {tx.fraudReasons.map((r, i) => (
                          <span key={i} className="bg-yellow-500/10 text-yellow-400 px-1.5 py-0.5 rounded text-[10px]">{r}</span>
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
