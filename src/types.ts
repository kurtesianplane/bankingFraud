export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  passwordHash: string;
  createdAt: number;
  isLocked: boolean;
  lockoutUntil: number | null;
  failedLoginAttempts: number;
  mfaEnabled: boolean;
  knownIPs: string[];
  knownDevices: string[];
  accountAge: number; // days
}

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  balance: number;
  dailyTransferred: number;
  dailyTransferDate: string;
  isFrozen: boolean;
  type: 'checking' | 'savings';
}

export interface Transaction {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  timestamp: number;
  type: 'transfer' | 'deposit' | 'withdrawal';
  status: 'completed' | 'flagged' | 'blocked' | 'pending_review';
  riskScore: number;
  isFlagged: boolean;
  fraudReasons: string[];
  ip: string;
  device: string;
  geoLocation: string;
  reviewStatus: 'pending' | 'approved' | 'denied' | 'escalated' | null;
  reviewedBy: string | null;
  reviewNote: string | null;
  mitreAttackTechnique: string | null;
  attackScenario: string | null;
  mlPrediction: number | null; // 0-1 probability
  mlFlagged: boolean | null;
}

export interface LoginLog {
  id: string;
  userId: string;
  username: string;
  timestamp: number;
  ip: string;
  device: string;
  success: boolean;
  geoLocation: string;
  blocked: boolean;
  reason: string | null;
}

export interface FraudAlert {
  id: string;
  transactionId: string | null;
  loginLogId: string | null;
  type: 'transaction' | 'login' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: number;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo: string | null;
  mitreId: string | null;
  mitreTactic: string | null;
}

export interface SecurityControl {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  category: 'rate_limiting' | 'lockout' | 'mfa' | 'transaction_limit' | 'ip_blacklist' | 'step_up_auth';
  config: Record<string, number | string | boolean>;
}

export interface AttackScenario {
  id: string;
  name: string;
  description: string;
  type: 'ato' | 'phishing' | 'money_laundering';
  mitreAttackId: string;
  mitreTactic: string;
  steps: string[];
  killChainPhase: string;
}

export interface MLMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
}

export interface DashboardMetrics {
  totalTransactions: number;
  flaggedTransactions: number;
  blockedTransactions: number;
  truePositives: number;
  falsePositives: number;
  detectionRate: number;
  avgRiskScore: number;
  totalAlerts: number;
  openAlerts: number;
  resolvedAlerts: number;
}

export interface ThreatIntelIndicator {
  id: string;
  type: 'ip' | 'email' | 'device' | 'account' | 'pattern';
  value: string;
  threatActor: string;
  confidence: number; // 0-100
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  firstSeen: number;
  lastSeen: number;
  tags: string[];
  stixType: string;
  description: string;
  active: boolean;
}

export interface ComplianceReport {
  id: string;
  type: 'SAR' | 'CTR' | 'STR' | 'audit';
  title: string;
  generatedAt: number;
  status: 'draft' | 'submitted' | 'acknowledged';
  relatedTransactions: string[];
  relatedAlerts: string[];
  summary: string;
  regulatoryBody: string;
  dueDate: number;
  filedBy: string;
}

export interface IncidentCase {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'triaging' | 'investigating' | 'containing' | 'eradicating' | 'recovered' | 'closed';
  createdAt: number;
  updatedAt: number;
  assignedTo: string;
  relatedAlerts: string[];
  relatedTransactions: string[];
  playbookSteps: PlaybookStep[];
  timeline: CaseTimelineEntry[];
  ttd: number | null; // time to detect (ms)
  ttr: number | null; // time to respond (ms)
}

export interface PlaybookStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  automated: boolean;
  completedAt: number | null;
}

export interface CaseTimelineEntry {
  timestamp: number;
  action: string;
  actor: string;
  detail: string;
}

export interface UserBehaviorProfile {
  userId: string;
  avgTransactionAmount: number;
  avgTransactionsPerDay: number;
  typicalHours: [number, number]; // start, end
  typicalGeos: string[];
  typicalDevices: string[];
  typicalIPs: string[];
  riskTrend: number[]; // last 10 risk scores
  lastActivityTimestamp: number;
  deviationScore: number; // how far from baseline
}

export interface NetworkNode {
  id: string;
  label: string;
  type: 'user' | 'account' | 'ip' | 'device';
  flagged: boolean;
}

export interface NetworkEdge {
  source: string;
  target: string;
  label: string;
  suspicious: boolean;
}

export type NavigationTab = 
  | 'banking' 
  | 'fraud-detection' 
  | 'attack-sim' 
  | 'defenses' 
  | 'dashboard' 
  | 'ml-detection'
  | 'threat-intel'
  | 'compliance';
