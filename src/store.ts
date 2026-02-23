import { User, Account, Transaction, LoginLog, FraudAlert, SecurityControl, MLMetrics, ThreatIntelIndicator, ComplianceReport, IncidentCase, UserBehaviorProfile } from './types';

// Simple hash simulation (not real bcrypt, but demonstrates the concept)
export function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return '$2b$10$' + Math.abs(hash).toString(36).padStart(20, '0') + '.simulated';
}

export function verifyHash(password: string, hash: string): boolean {
  return simpleHash(password) === hash;
}

let idCounter = 1000;
export function generateId(): string {
  return 'id_' + (++idCounter) + '_' + Date.now().toString(36);
}

export function generateAccountNumber(): string {
  return '9' + Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
}

const IPS = ['192.168.1.100', '10.0.0.55', '172.16.0.1', '203.0.113.42', '198.51.100.7', '45.33.32.156', '185.220.101.1', '91.132.147.5'];
const DEVICES = ['Chrome/Windows', 'Firefox/MacOS', 'Safari/iOS', 'Chrome/Android', 'Edge/Windows', 'Unknown/Linux', 'Tor Browser/Unknown'];
const GEOS = ['Manila, PH', 'Cebu, PH', 'Davao, PH', 'Lagos, NG', 'Moscow, RU', 'Beijing, CN', 'New York, US', 'London, UK'];

export function randomIP(familiar = true): string {
  if (familiar) return IPS[Math.floor(Math.random() * 3)];
  return IPS[3 + Math.floor(Math.random() * (IPS.length - 3))];
}

export function randomDevice(familiar = true): string {
  if (familiar) return DEVICES[Math.floor(Math.random() * 3)];
  return DEVICES[3 + Math.floor(Math.random() * (DEVICES.length - 3))];
}

export function randomGeo(familiar = true): string {
  if (familiar) return GEOS[Math.floor(Math.random() * 3)];
  return GEOS[3 + Math.floor(Math.random() * (GEOS.length - 3))];
}

// Seed data
const seedUsers: User[] = [
  {
    id: 'user_001', username: 'jdelacruz', fullName: 'Juan Dela Cruz', email: 'juan@email.com',
    passwordHash: simpleHash('password123'), createdAt: Date.now() - 90 * 86400000,
    isLocked: false, lockoutUntil: null, failedLoginAttempts: 0, mfaEnabled: false,
    knownIPs: ['192.168.1.100', '10.0.0.55'], knownDevices: ['Chrome/Windows', 'Safari/iOS'],
    accountAge: 90
  },
  {
    id: 'user_002', username: 'mreyes', fullName: 'Maria Reyes', email: 'maria@email.com',
    passwordHash: simpleHash('securepass'), createdAt: Date.now() - 180 * 86400000,
    isLocked: false, lockoutUntil: null, failedLoginAttempts: 0, mfaEnabled: true,
    knownIPs: ['192.168.1.100', '172.16.0.1'], knownDevices: ['Firefox/MacOS', 'Chrome/Android'],
    accountAge: 180
  },
  {
    id: 'user_003', username: 'rsantos', fullName: 'Ricardo Santos', email: 'rico@email.com',
    passwordHash: simpleHash('mypassword'), createdAt: Date.now() - 30 * 86400000,
    isLocked: false, lockoutUntil: null, failedLoginAttempts: 0, mfaEnabled: false,
    knownIPs: ['10.0.0.55'], knownDevices: ['Chrome/Windows'],
    accountAge: 30
  },
  {
    id: 'user_mule', username: 'mule_account', fullName: 'Mule Account (Suspicious)', email: 'mule@temp.com',
    passwordHash: simpleHash('mule123'), createdAt: Date.now() - 2 * 86400000,
    isLocked: false, lockoutUntil: null, failedLoginAttempts: 0, mfaEnabled: false,
    knownIPs: ['203.0.113.42'], knownDevices: ['Tor Browser/Unknown'],
    accountAge: 2
  }
];

const seedAccounts: Account[] = [
  { id: 'acc_001', userId: 'user_001', accountNumber: '9001234567', balance: 150000, dailyTransferred: 0, dailyTransferDate: '', isFrozen: false, type: 'checking' },
  { id: 'acc_002', userId: 'user_002', accountNumber: '9009876543', balance: 320000, dailyTransferred: 0, dailyTransferDate: '', isFrozen: false, type: 'savings' },
  { id: 'acc_003', userId: 'user_003', accountNumber: '9005551234', balance: 75000, dailyTransferred: 0, dailyTransferDate: '', isFrozen: false, type: 'checking' },
  { id: 'acc_mule', userId: 'user_mule', accountNumber: '9006660001', balance: 500, dailyTransferred: 0, dailyTransferDate: '', isFrozen: false, type: 'checking' },
];

const defaultControls: SecurityControl[] = [
  { id: 'ctrl_1', name: 'Rate Limiting', enabled: true, description: 'Limit login attempts per minute', category: 'rate_limiting', config: { maxAttemptsPerMinute: 5 } },
  { id: 'ctrl_2', name: 'Account Lockout', enabled: true, description: 'Lock account after X failed attempts', category: 'lockout', config: { maxFailedAttempts: 5, lockoutDurationMinutes: 15 } },
  { id: 'ctrl_3', name: 'MFA (Simulated OTP)', enabled: true, description: 'Require OTP when risk_score > threshold', category: 'mfa', config: { riskThreshold: 60 } },
  { id: 'ctrl_4', name: 'Transaction Limits', enabled: true, description: 'Daily transfer cap per account', category: 'transaction_limit', config: { dailyLimit: 100000 } },
  { id: 'ctrl_5', name: 'IP Blacklisting', enabled: true, description: 'Block known malicious IPs', category: 'ip_blacklist', config: { blacklistedIPs: '185.220.101.1,91.132.147.5' } },
  { id: 'ctrl_6', name: 'Step-Up Authentication', enabled: true, description: 'Extra verification for high-risk transactions', category: 'step_up_auth', config: { amountThreshold: 50000, riskThreshold: 70 } },
];

export interface StoreState {
  users: User[];
  accounts: Account[];
  transactions: Transaction[];
  loginLogs: LoginLog[];
  fraudAlerts: FraudAlert[];
  securityControls: SecurityControl[];
  currentUser: User | null;
  mlMetrics: MLMetrics;
  blacklistedIPs: string[];
  eventLog: string[];
  threatIntel: ThreatIntelIndicator[];
  complianceReports: ComplianceReport[];
  incidentCases: IncidentCase[];
  behaviorProfiles: UserBehaviorProfile[];
  geoFenceEnabled: boolean;
  geoFenceAllowedCountries: string[];
  deviceFingerprinting: boolean;
}

const seedThreatIntel: ThreatIntelIndicator[] = [
  {
    id: 'ti_001', type: 'ip', value: '185.220.101.1', threatActor: 'APT-FIN7',
    confidence: 95, severity: 'critical', source: 'STIX/TAXII Feed - FS-ISAC',
    firstSeen: Date.now() - 30 * 86400000, lastSeen: Date.now() - 2 * 86400000,
    tags: ['tor-exit', 'banking-trojan', 'credential-harvesting'],
    stixType: 'indicator--ipv4-addr', description: 'Known Tor exit node used in banking fraud campaigns',
    active: true
  },
  {
    id: 'ti_002', type: 'ip', value: '91.132.147.5', threatActor: 'Lazarus Group',
    confidence: 88, severity: 'high', source: 'STIX/TAXII Feed - MISP',
    firstSeen: Date.now() - 60 * 86400000, lastSeen: Date.now() - 5 * 86400000,
    tags: ['apt', 'nation-state', 'swift-attack'],
    stixType: 'indicator--ipv4-addr', description: 'C2 infrastructure associated with SWIFT banking attacks',
    active: true
  },
  {
    id: 'ti_003', type: 'ip', value: '203.0.113.42', threatActor: 'Carbanak',
    confidence: 72, severity: 'high', source: 'Open Threat Exchange (OTX)',
    firstSeen: Date.now() - 15 * 86400000, lastSeen: Date.now() - 1 * 86400000,
    tags: ['carbanak', 'ato', 'mule-network'],
    stixType: 'indicator--ipv4-addr', description: 'Proxy node in Carbanak mule account network',
    active: true
  },
  {
    id: 'ti_004', type: 'email', value: 'mule@temp.com', threatActor: 'Unknown',
    confidence: 65, severity: 'medium', source: 'Internal Intelligence',
    firstSeen: Date.now() - 7 * 86400000, lastSeen: Date.now(),
    tags: ['mule', 'money-laundering', 'disposable'],
    stixType: 'indicator--email-addr', description: 'Disposable email associated with mule account recruitment',
    active: true
  },
  {
    id: 'ti_005', type: 'device', value: 'Tor Browser/Unknown', threatActor: 'Multiple',
    confidence: 80, severity: 'medium', source: 'Device Fingerprint DB',
    firstSeen: Date.now() - 90 * 86400000, lastSeen: Date.now(),
    tags: ['anonymization', 'fraud-tool', 'tor'],
    stixType: 'indicator--software', description: 'Tor browser usage pattern in financial fraud',
    active: true
  },
  {
    id: 'ti_006', type: 'pattern', value: 'smurfing_<5000_x8', threatActor: 'AML Networks',
    confidence: 90, severity: 'high', source: 'FinCEN Advisory',
    firstSeen: Date.now() - 45 * 86400000, lastSeen: Date.now(),
    tags: ['structuring', 'smurfing', 'aml'],
    stixType: 'indicator--pattern', description: 'Structuring pattern: 8+ transactions under ₱5,000 reporting threshold',
    active: true
  },
  {
    id: 'ti_007', type: 'ip', value: '45.33.32.156', threatActor: 'SilverTerrier',
    confidence: 78, severity: 'high', source: 'Palo Alto Unit 42',
    firstSeen: Date.now() - 20 * 86400000, lastSeen: Date.now() - 3 * 86400000,
    tags: ['bec', 'phishing', 'nigeria'],
    stixType: 'indicator--ipv4-addr', description: 'Infrastructure used in BEC/phishing campaigns targeting banks',
    active: true
  },
  {
    id: 'ti_008', type: 'account', value: '9006660001', threatActor: 'Unknown',
    confidence: 55, severity: 'medium', source: 'Internal SAR Database',
    firstSeen: Date.now() - 3 * 86400000, lastSeen: Date.now(),
    tags: ['mule-account', 'rapid-movement', 'new-account'],
    stixType: 'indicator--account', description: 'Newly created account with suspicious inflow patterns',
    active: true
  }
];

const seedBehaviorProfiles: UserBehaviorProfile[] = [
  {
    userId: 'user_001', avgTransactionAmount: 12000, avgTransactionsPerDay: 2,
    typicalHours: [8, 20], typicalGeos: ['Manila, PH', 'Cebu, PH'],
    typicalDevices: ['Chrome/Windows', 'Safari/iOS'], typicalIPs: ['192.168.1.100', '10.0.0.55'],
    riskTrend: [], lastActivityTimestamp: Date.now(), deviationScore: 0
  },
  {
    userId: 'user_002', avgTransactionAmount: 25000, avgTransactionsPerDay: 1,
    typicalHours: [9, 18], typicalGeos: ['Manila, PH'],
    typicalDevices: ['Firefox/MacOS', 'Chrome/Android'], typicalIPs: ['192.168.1.100', '172.16.0.1'],
    riskTrend: [], lastActivityTimestamp: Date.now(), deviationScore: 0
  },
  {
    userId: 'user_003', avgTransactionAmount: 8000, avgTransactionsPerDay: 3,
    typicalHours: [7, 22], typicalGeos: ['Manila, PH', 'Davao, PH'],
    typicalDevices: ['Chrome/Windows'], typicalIPs: ['10.0.0.55'],
    riskTrend: [], lastActivityTimestamp: Date.now(), deviationScore: 0
  },
  {
    userId: 'user_mule', avgTransactionAmount: 0, avgTransactionsPerDay: 0,
    typicalHours: [0, 23], typicalGeos: [],
    typicalDevices: ['Tor Browser/Unknown'], typicalIPs: ['203.0.113.42'],
    riskTrend: [], lastActivityTimestamp: Date.now(), deviationScore: 0
  }
];

export function createInitialState(): StoreState {
  return {
    users: [...seedUsers],
    accounts: [...seedAccounts],
    transactions: [],
    loginLogs: [],
    fraudAlerts: [],
    securityControls: [...defaultControls],
    currentUser: null,
    mlMetrics: {
      accuracy: 0, precision: 0, recall: 0, f1Score: 0,
      truePositives: 0, falsePositives: 0, trueNegatives: 0, falseNegatives: 0
    },
    blacklistedIPs: ['185.220.101.1', '91.132.147.5'],
    eventLog: ['[SYSTEM] Banking Fraud Sandbox initialized.'],
    threatIntel: [...seedThreatIntel],
    complianceReports: [],
    incidentCases: [],
    behaviorProfiles: [...seedBehaviorProfiles],
    geoFenceEnabled: true,
    geoFenceAllowedCountries: ['PH'],
    deviceFingerprinting: true
  };
}

// Threat Intel Correlation (Phase 7)
export function correlateThreatIntel(
  state: StoreState,
  params: { ip?: string; device?: string; email?: string; accountNumber?: string }
): ThreatIntelIndicator[] {
  const matches: ThreatIntelIndicator[] = [];
  for (const indicator of state.threatIntel) {
    if (!indicator.active) continue;
    if (params.ip && indicator.type === 'ip' && indicator.value === params.ip) matches.push(indicator);
    if (params.device && indicator.type === 'device' && indicator.value === params.device) matches.push(indicator);
    if (params.email && indicator.type === 'email' && indicator.value === params.email) matches.push(indicator);
    if (params.accountNumber && indicator.type === 'account' && indicator.value === params.accountNumber) matches.push(indicator);
  }
  return matches;
}

// Behavior deviation scoring (Phase 2 enhancement)
export function calculateBehaviorDeviation(
  userId: string,
  tx: Partial<Transaction>,
  state: StoreState
): { deviationScore: number; deviations: string[] } {
  const profile = state.behaviorProfiles.find(p => p.userId === userId);
  if (!profile) return { deviationScore: 0, deviations: [] };

  let score = 0;
  const deviations: string[] = [];

  // Amount deviation
  if (profile.avgTransactionAmount > 0 && (tx.amount || 0) > profile.avgTransactionAmount * 3) {
    score += 20;
    deviations.push(`Amount ${((tx.amount || 0) / profile.avgTransactionAmount).toFixed(1)}x above average`);
  }

  // Time deviation
  const hour = new Date(tx.timestamp || Date.now()).getHours();
  if (hour < profile.typicalHours[0] || hour > profile.typicalHours[1]) {
    score += 15;
    deviations.push(`Outside typical hours (${profile.typicalHours[0]}:00-${profile.typicalHours[1]}:00)`);
  }

  // Geo deviation
  if (tx.geoLocation && !profile.typicalGeos.includes(tx.geoLocation)) {
    score += 25;
    deviations.push(`Unusual location: ${tx.geoLocation}`);
  }

  // Device deviation
  if (tx.device && !profile.typicalDevices.includes(tx.device)) {
    score += 15;
    deviations.push(`Unusual device: ${tx.device}`);
  }

  // IP deviation
  if (tx.ip && !profile.typicalIPs.includes(tx.ip)) {
    score += 15;
    deviations.push(`Unusual IP: ${tx.ip}`);
  }

  return { deviationScore: Math.min(score, 100), deviations };
}

// Fraud detection rules (Phase 2)
export function evaluateTransactionRisk(
  tx: Partial<Transaction>,
  state: StoreState
): { riskScore: number; reasons: string[]; isFlagged: boolean } {
  let score = 0;
  const reasons: string[] = [];

  // Rule 1: Large transaction
  if ((tx.amount || 0) > 50000) {
    score += 30;
    reasons.push('Large transaction (>₱50,000)');
  }

  // Rule 2: 3+ transactions in 1 minute
  const recentTxs = state.transactions.filter(
    t => t.fromUserId === tx.fromUserId && (tx.timestamp || Date.now()) - t.timestamp < 60000
  );
  if (recentTxs.length >= 2) {
    score += 25;
    reasons.push(`Velocity: ${recentTxs.length + 1} transactions in 1 minute`);
  }

  // Rule 3: New IP
  const user = state.users.find(u => u.id === tx.fromUserId);
  if (user && tx.ip && !user.knownIPs.includes(tx.ip)) {
    score += 20;
    reasons.push(`Unknown IP: ${tx.ip}`);
  }

  // Rule 4: New device
  if (user && tx.device && !user.knownDevices.includes(tx.device)) {
    score += 15;
    reasons.push(`Unknown device: ${tx.device}`);
  }

  // Rule 5: Transfer to mule account (new account <7 days)
  const toUser = state.users.find(u => u.id === tx.toUserId);
  if (toUser && toUser.accountAge < 7) {
    score += 20;
    reasons.push('Transfer to new account (<7 days old)');
  }

  // Rule 6: Foreign geo
  if (tx.geoLocation && !['Manila, PH', 'Cebu, PH', 'Davao, PH'].includes(tx.geoLocation)) {
    score += 15;
    reasons.push(`Foreign location: ${tx.geoLocation}`);
  }

  // Rule 7: Off-hours transaction (before 6am or after 11pm)
  const hour = new Date(tx.timestamp || Date.now()).getHours();
  if (hour < 6 || hour >= 23) {
    score += 10;
    reasons.push('Off-hours transaction');
  }

  score = Math.min(score, 100);
  return { riskScore: score, reasons, isFlagged: score >= 40 };
}

// ML Fraud Detection (Phase 6) - Simulated logistic regression
export function mlPredict(tx: Partial<Transaction>, state: StoreState): number {
  const user = state.users.find(u => u.id === tx.fromUserId);
  const toUser = state.users.find(u => u.id === tx.toUserId);
  
  // Feature extraction
  const amount = Math.min((tx.amount || 0) / 100000, 1); // normalized
  const recentTxs = state.transactions.filter(
    t => t.fromUserId === tx.fromUserId && (tx.timestamp || Date.now()) - t.timestamp < 60000
  ).length / 5;
  const newIP = user && tx.ip ? (user.knownIPs.includes(tx.ip) ? 0 : 1) : 0;
  const newDevice = user && tx.device ? (user.knownDevices.includes(tx.device) ? 0 : 1) : 0;
  const foreignGeo = tx.geoLocation && !['Manila, PH', 'Cebu, PH', 'Davao, PH'].includes(tx.geoLocation) ? 1 : 0;
  const accountAge = user ? Math.min(user.accountAge / 365, 1) : 0.5;
  const toAccountAge = toUser ? Math.min(toUser.accountAge / 365, 1) : 0.5;
  
  // Simulated weights (trained model)
  const weights = {
    amount: 2.5,
    velocity: 3.0,
    newIP: 2.0,
    newDevice: 1.5,
    foreignGeo: 2.2,
    accountAge: -1.5, // older = less risky
    toAccountAge: -1.8,
    bias: -3.0
  };

  const z = weights.bias +
    weights.amount * amount +
    weights.velocity * recentTxs +
    weights.newIP * newIP +
    weights.newDevice * newDevice +
    weights.foreignGeo * foreignGeo +
    weights.accountAge * (1 - accountAge) +
    weights.toAccountAge * (1 - toAccountAge);

  // Sigmoid
  const prob = 1 / (1 + Math.exp(-z));
  // Add small random noise for realism
  return Math.max(0, Math.min(1, prob + (Math.random() - 0.5) * 0.05));
}

// Check security controls (Phase 4)
export function checkSecurityControls(
  action: 'login' | 'transaction',
  state: StoreState,
  params: {
    userId?: string;
    ip?: string;
    amount?: number;
    riskScore?: number;
  }
): { allowed: boolean; reason: string | null; requiresMFA: boolean } {
  const controls = state.securityControls;
  
  // IP Blacklist check
  const ipCtrl = controls.find(c => c.category === 'ip_blacklist');
  if (ipCtrl?.enabled && params.ip && state.blacklistedIPs.includes(params.ip)) {
    return { allowed: false, reason: `IP ${params.ip} is blacklisted`, requiresMFA: false };
  }

  if (action === 'login') {
    // Rate limiting
    const rateCtrl = controls.find(c => c.category === 'rate_limiting');
    if (rateCtrl?.enabled && params.userId) {
      const recentLogins = state.loginLogs.filter(
        l => l.userId === params.userId && Date.now() - l.timestamp < 60000
      );
      if (recentLogins.length >= (rateCtrl.config.maxAttemptsPerMinute as number)) {
        return { allowed: false, reason: 'Rate limit exceeded', requiresMFA: false };
      }
    }

    // Account lockout
    const lockCtrl = controls.find(c => c.category === 'lockout');
    if (lockCtrl?.enabled && params.userId) {
      const user = state.users.find(u => u.id === params.userId);
      if (user?.isLocked) {
        if (user.lockoutUntil && Date.now() < user.lockoutUntil) {
          return { allowed: false, reason: 'Account locked due to too many failed attempts', requiresMFA: false };
        }
      }
    }
  }

  if (action === 'transaction') {
    // Transaction limits
    const txLimitCtrl = controls.find(c => c.category === 'transaction_limit');
    if (txLimitCtrl?.enabled && params.amount && params.userId) {
      const account = state.accounts.find(a => a.userId === params.userId);
      const today = new Date().toDateString();
      const dailyTotal = account?.dailyTransferDate === today ? (account.dailyTransferred || 0) : 0;
      if (dailyTotal + params.amount > (txLimitCtrl.config.dailyLimit as number)) {
        return { allowed: false, reason: `Daily transfer limit (₱${txLimitCtrl.config.dailyLimit}) exceeded`, requiresMFA: false };
      }
    }

    // Step-up auth
    const stepUpCtrl = controls.find(c => c.category === 'step_up_auth');
    if (stepUpCtrl?.enabled) {
      if ((params.amount || 0) > (stepUpCtrl.config.amountThreshold as number) ||
          (params.riskScore || 0) > (stepUpCtrl.config.riskThreshold as number)) {
        return { allowed: true, reason: 'Step-up authentication required', requiresMFA: true };
      }
    }

    // MFA check
    const mfaCtrl = controls.find(c => c.category === 'mfa');
    if (mfaCtrl?.enabled && (params.riskScore || 0) > (mfaCtrl.config.riskThreshold as number)) {
      return { allowed: true, reason: 'MFA required - risk threshold exceeded', requiresMFA: true };
    }
  }

  return { allowed: true, reason: null, requiresMFA: false };
}
