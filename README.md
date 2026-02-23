# Sentinel — Banking Fraud Sandbox

**Live Demo:** [https://sentinelsim.vercel.app/](https://sentinelsim.vercel.app/)

**Author:** kurtesianplane

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Purpose and Motivation](#purpose-and-motivation)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Feature Breakdown by Phase](#feature-breakdown-by-phase)
   - [Phase 1: Core Banking Simulation](#phase-1-core-banking-simulation)
   - [Phase 2: Rule-Based Fraud Detection](#phase-2-rule-based-fraud-detection)
   - [Phase 3: Attack Simulation Layer](#phase-3-attack-simulation-layer)
   - [Phase 4: Defensive Controls and Hardening](#phase-4-defensive-controls-and-hardening)
   - [Phase 5: SOC Analyst Dashboard](#phase-5-soc-analyst-dashboard)
   - [Phase 6: Machine Learning Fraud Detection](#phase-6-machine-learning-fraud-detection)
   - [Phase 7: Threat Intelligence](#phase-7-threat-intelligence)
   - [Phase 8: Compliance and Reporting](#phase-8-compliance-and-reporting)
6. [Data Model](#data-model)
7. [Fraud Detection Engine](#fraud-detection-engine)
8. [Machine Learning Model](#machine-learning-model)
9. [Security Concepts Applied](#security-concepts-applied)
10. [MITRE ATT&CK Mapping](#mitre-attck-mapping)
11. [Getting Started](#getting-started)
12. [Project Structure](#project-structure)
13. [Usage Guide](#usage-guide)
14. [Design Philosophy](#design-philosophy)
15. [Limitations and Disclaimers](#limitations-and-disclaimers)
16. [Future Enhancements](#future-enhancements)
17. [License](#license)

---

## Project Overview

Sentinel is a self-contained, browser-based banking fraud simulation sandbox. It combines a minimal digital banking system, a red team attack laboratory, and a blue team security operations center (SOC) into a single interactive application. The platform is designed for cybersecurity students, researchers, and professionals who want to understand banking fraud detection, incident response, and defensive security controls in a risk-free environment.

Everything runs client-side. There is no backend, no database, and no external API calls. All data is generated, stored, and processed entirely within the browser using React state management. This makes the sandbox completely safe to use — no real financial systems are affected, no real credentials are processed, and no real network traffic is generated.

The system simulates the complete lifecycle of banking fraud: from legitimate user activity and transaction processing, through attack execution and fraud detection, to incident response, compliance reporting, and machine learning analysis.

---

## Purpose and Motivation

Banking fraud is one of the most prevalent forms of cybercrime globally. Understanding how fraud occurs, how it is detected, and how organizations respond requires hands-on experience that is difficult to obtain without access to production banking systems. Sentinel addresses this gap by providing a complete simulation environment where every aspect of the fraud lifecycle can be explored interactively.

The sandbox serves multiple purposes:

- **Educational tool** for cybersecurity students learning about financial fraud, MITRE ATT&CK framework application in financial services, and security operations center workflows.
- **Training environment** for SOC analysts practicing alert triage, incident investigation, and case management.
- **Detection engineering lab** for testing and tuning fraud detection rules and understanding the tradeoffs between detection sensitivity and false positive rates.
- **Demonstration platform** for presenting banking security concepts to non-technical stakeholders.
- **Research prototype** for exploring the intersection of rule-based and machine learning approaches to fraud detection.

---

## Architecture

Sentinel follows a single-page application architecture with a centralized state store pattern. The application is organized into eight modules (phases), each representing a distinct aspect of the banking fraud ecosystem.

```
+---------------------------+
|        Browser            |
|                           |
|  +---------------------+ |
|  |    React App (SPA)   | |
|  |                      | |
|  |  +----------------+  | |
|  |  | Centralized    |  | |
|  |  | State Store    |  | |
|  |  | (store.ts)     |  | |
|  |  +-------+--------+  | |
|  |          |            | |
|  |  +-------v--------+  | |
|  |  | 8 Phase Modules |  | |
|  |  | (Components)    |  | |
|  |  +----------------+  | |
|  +---------------------+ |
+---------------------------+
```

### State Management

All application state is managed through a single `StoreState` interface in `store.ts`. State is passed down to child components via props, and state mutations are performed through React's `setState` pattern. This approach was chosen over more complex state management libraries to keep the codebase transparent and easy to understand.

The state store includes:

- User accounts and authentication data
- Bank accounts and balances
- Transaction records with fraud metadata
- Login logs with device and geolocation data
- Fraud alerts with severity and status tracking
- Security control configurations
- Machine learning predictions and metrics
- Threat intelligence indicators
- Compliance reports
- Behavioral profiles for UEBA
- Event logs for audit trailing

### Module Communication

All eight phases operate on the same shared state. Actions in one module immediately affect others. For example:

- Running an attack simulation in Phase 3 generates transactions that appear in Phase 1's history, triggers fraud alerts visible in Phase 5's dashboard, and produces data for Phase 6's ML analysis.
- Enabling or disabling defensive controls in Phase 4 changes whether attack simulations in Phase 3 succeed or get blocked.
- Resolving alerts in Phase 5 updates detection metrics visible in Phase 6 and compliance status in Phase 8.

---

## Technology Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| UI Framework | React | 19.2.3 | Component rendering and state management |
| Build Tool | Vite | 7.2.4 | Development server and production bundling |
| CSS Framework | Tailwind CSS | 4.1.17 | Utility-first styling with custom design tokens |
| Language | TypeScript | 5.9.3 | Type safety across the entire codebase |
| Charts | Recharts | 3.7.0 | Data visualization (bar charts, pie charts, scatter plots) |
| Icons | Lucide React | 0.575.0 | Consistent iconography throughout the UI |
| CSS Utilities | clsx, tailwind-merge | 2.1.1, 3.4.0 | Conditional and merged class name handling |
| Bundling | vite-plugin-singlefile | 2.3.0 | Single HTML file output for deployment |
| Fonts | Inter, JetBrains Mono | - | UI typography and monospace code display |

### Design Token System

The application uses a custom design token system defined in `index.css`:

| Token | Value | Usage |
|-------|-------|-------|
| `surface-0` | `#09090b` | Primary background |
| `surface-1` | `#0f0f12` | Sidebar and secondary panels |
| `surface-2` | `#18181b` | Card backgrounds and input fields |
| `surface-3` | `#1e1e23` | Elevated elements and active states |
| `border-subtle` | `#27272a` | Default borders |
| `border-default` | `#3f3f46` | Hover and focus borders |
| `accent` | `#6366f1` | Primary accent (Indigo 500) |
| `accent-muted` | `#4f46e5` | Accent hover state |

---

## Feature Breakdown by Phase

### Phase 1: Core Banking Simulation

**Module:** `CoreBanking.tsx`

Phase 1 provides the foundational banking system that all other phases build upon. It implements a minimal but functional digital banking environment with four core operations.

#### User Registration

- Username, full name, email, and password input with validation
- Input sanitization against injection characters (`<`, `>`, `'`, `"`)
- Password minimum length enforcement (6 characters)
- Duplicate username detection
- Password hashing using a simulated bcrypt implementation (the hash function produces `$2b$10$` prefixed strings to demonstrate the concept, though it uses a simplified algorithm rather than actual bcrypt)
- Automatic account creation with a randomly generated 10-digit account number
- Initial balance of 50,000 Philippine Pesos
- Known IP and device assignment for baseline behavioral profiling

#### User Login

- Credential verification against stored password hashes
- Random IP, device, and geolocation assignment per login attempt to simulate varying network conditions
- Integration with Phase 4's security controls (rate limiting, account lockout, IP blacklisting)
- Fraud alert generation for logins from unknown IPs or devices
- Failed login attempt tracking with automatic account lockout after configurable threshold
- Session tracking via `currentUser` state
- Event logging for all login attempts (success, failure, blocked)

#### Money Transfer

- Account number-based transfers between any two accounts
- Balance validation (insufficient funds check)
- Frozen account detection
- Real-time fraud risk assessment via Phase 2's rule engine
- ML prediction scoring via Phase 6's model
- Security control enforcement via Phase 4 (daily limits, IP blacklist, step-up authentication)
- MFA simulation with static OTP code (123456) when risk threshold is exceeded
- Transaction status assignment (completed, flagged, blocked, pending_review)
- Automatic fraud alert generation for flagged transactions
- Daily transfer tracking for limit enforcement
- Balance updates on both source and destination accounts

#### Transaction History

- Chronological display of all transactions with most recent first
- Visual risk score indicators with color-coded progress bars
- Status badges (completed, flagged, blocked)
- Fraud reason tags showing which detection rules triggered
- From/to user identification
- Timestamp, IP, device, and geolocation metadata display

#### Pre-seeded Data

The system initializes with four users:

| Username | Full Name | Password | Account Number | Balance | Account Age | Notes |
|----------|-----------|----------|----------------|---------|-------------|-------|
| jdelacruz | Juan Dela Cruz | password123 | 9001234567 | 150,000 | 90 days | Primary test user |
| mreyes | Maria Reyes | securepass | 9009876543 | 320,000 | 180 days | MFA enabled |
| rsantos | Ricardo Santos | mypassword | 9005551234 | 75,000 | 30 days | Secondary user |
| mule_account | Mule Account (Suspicious) | mule123 | 9006660001 | 500 | 2 days | Designated mule |

---

### Phase 2: Rule-Based Fraud Detection

**Module:** `FraudDetection.tsx` | **Engine:** `evaluateTransactionRisk()` in `store.ts`

Phase 2 implements a deterministic rule engine that evaluates every transaction against seven configurable fraud detection rules. Each rule contributes a weighted score to the transaction's overall risk assessment. Transactions scoring 40 or above are automatically flagged.

#### Detection Rules

| Rule | Condition | Weight | Rationale |
|------|-----------|--------|-----------|
| Large Transaction | amount > 50,000 | +30 | High-value transfers are common fraud indicators |
| High Velocity | 3+ transactions within 60 seconds from same user | +25 | Rapid automated transfers suggest bot activity |
| Unknown IP | Sender IP not in user's `knownIPs` array | +20 | Geographic anomaly detection |
| New Device | Sender device not in user's `knownDevices` array | +15 | Device fingerprint change detection |
| New Account Destination | Recipient account age < 7 days | +20 | Mule accounts are typically newly created |
| Foreign Location | Geolocation outside Philippines (Manila, Cebu, Davao) | +15 | Cross-border transaction monitoring |
| Off-Hours | Transaction between 11 PM and 6 AM | +10 | Unusual activity timing |

The maximum risk score is capped at 100. Rules are cumulative — a transaction can trigger multiple rules simultaneously. For example, a large transfer from an unknown IP to a new account at 2 AM would score 30 + 20 + 20 + 10 = 80 (Critical).

#### Risk Score Interpretation

| Score Range | Classification | Action |
|-------------|---------------|--------|
| 0-19 | Safe | Transaction proceeds normally |
| 20-39 | Low Risk | Transaction proceeds, no flag |
| 40-59 | Medium Risk | Transaction flagged, alert generated |
| 60-79 | High Risk | Transaction flagged, step-up auth may trigger |
| 80-100 | Critical | Transaction flagged or blocked depending on controls |

#### Behavioral Profiling (UEBA)

Phase 2 also includes User Entity Behavior Analytics through the `calculateBehaviorDeviation()` function and the behavioral profiles display. Each user has a baseline profile containing:

- Average transaction amount
- Average transactions per day
- Typical active hours (start and end)
- Typical geolocations
- Typical devices
- Typical IP addresses
- Historical risk score trend

Deviation scoring evaluates how far a transaction departs from the user's established baseline:

| Deviation Type | Score Contribution | Condition |
|----------------|-------------------|-----------|
| Amount deviation | +20 | Transaction amount > 3x user's average |
| Time deviation | +15 | Outside user's typical hours |
| Geo deviation | +25 | Location not in user's typical geolocations |
| Device deviation | +15 | Device not in user's typical devices |
| IP deviation | +15 | IP not in user's typical IPs |

#### Visual Components

- Summary statistics (total transactions, flagged count, blocked count, average risk score)
- Detection rules table with hit counts per rule
- Risk score spectrum visualization (gradient bar from 0 to 100)
- Flagged transactions list with detailed metadata
- Behavioral profile cards for each user showing activity patterns and risk trends
- Applied cybersecurity concepts reference (Anomaly Detection, Risk Scoring, UEBA, Detection Engineering)

---

### Phase 3: Attack Simulation Layer

**Module:** `AttackSimulation.tsx`

Phase 3 provides a red team simulation environment with five pre-built attack scenarios. Each scenario follows a multi-phase attack chain, generates realistic transaction and login data, and maps to specific MITRE ATT&CK techniques.

#### Attack Scenario 1: Account Takeover (ATO)

**Kill Chain:** Credential Stuffing -> Valid Account Access -> Fund Exfiltration

**MITRE Mapping:** T1110 (Brute Force) -> T1078 (Valid Accounts) -> T1537 (Transfer to Cloud Account)

**Execution Flow:**

1. **Phase 1 — Credential Stuffing:** Five login attempts with common passwords (123456, password, admin123, qwerty, letmein) from foreign IPs and unknown devices. Each failed attempt increments the target user's failed login counter. If account lockout is enabled, the account may lock before the attacker succeeds. Each attempt generates a login log and a fraud alert with severity "high."

2. **Phase 2 — Valid Credential Use:** Simulates the attacker obtaining the correct password. A successful login is recorded from a foreign IP (203.0.113.42, Moscow, RU) using Tor Browser. This generates a critical fraud alert for account takeover detection.

3. **Phase 3 — Fund Transfer:** A 45,000 PHP transfer to the mule account is attempted. The transaction passes through the full fraud detection pipeline (rule-based scoring, ML prediction, security control checks). Depending on enabled defenses, the transfer may be flagged, blocked, or completed. The transaction is tagged with the "Account Takeover" attack scenario and MITRE technique T1537.

#### Attack Scenario 2: Phishing-Based Fraud

**Kill Chain:** Credential Theft -> Session Hijacking -> Balance Extraction

**MITRE Mapping:** T1566 (Phishing) -> T1539 (Steal Web Session Cookie) -> T1537 (Transfer to Cloud Account)

**Execution Flow:**

1. **Phase 1 — Stolen Credentials:** A successful login from Lagos, NG (45.33.32.156) using the victim's credentials, simulating a phishing attack that captured the user's login information.

2. **Phase 2 — Session Hijacking:** An immediate second login from Beijing, CN (91.132.147.5) with a different device, simulating session cookie theft. This triggers an "impossible travel" alert — the user appears to be in two geographically distant locations within seconds.

3. **Phase 3 — Balance Extraction:** An 80,000 PHP transfer attempt to the mule account with elevated risk scoring (+20 for phishing pattern). The transaction carries fraud reasons including "Phishing attack" and "Session hijacking."

#### Attack Scenario 3: Money Laundering (Smurfing)

**Kill Chain:** Structuring -> Layering -> Integration

**MITRE Mapping:** T1565 (Data Manipulation)

**Execution Flow:**

1. **Phase 1 — Structuring:** Eight small transactions (ranging from 3,200 to 4,900 PHP, all below the 5,000 reporting threshold) from the source account to an intermediate account. The first few transactions may pass undetected, but velocity-based detection kicks in after the third transaction, adding +25 to the risk score with a "Smurfing" fraud reason label.

2. **Phase 2 — Layering:** A single 25,000 PHP transfer from the intermediate account to the mule account. This transaction is automatically flagged with a risk score of 75 and labeled with "Layering pattern" and "Transfer to new account" fraud reasons.

The smurfing scenario demonstrates how individual transactions that appear innocent can be identified as fraudulent when analyzed as a pattern. It also shows the limitations of per-transaction rule-based detection versus pattern-based analysis.

#### Attack Scenario 4: SIM Swap Attack

**Kill Chain:** Social Engineering -> MFA Bypass -> Fund Extraction

**MITRE Mapping:** T1111 (MFA Interception) -> T1078 (Valid Accounts) -> T1537 (Transfer to Cloud Account)

**Execution Flow:**

1. **Phase 1 — SIM Port:** A fraud alert is generated indicating the target user's phone number has been ported via social engineering, compromising their MFA.

2. **Phase 2 — MFA Bypass Login:** A successful login from London, UK (198.51.100.7) using the victim's credentials with the intercepted OTP. Generates a critical alert for MFA bypass via SIM swap.

3. **Phase 3 — Rapid Extraction:** Three sequential transfers (25,000, 30,000, 15,000 PHP) to the mule account, each passing through the detection pipeline. Each transfer generates a critical alert tagged with "SIM swap" and "MFA bypass" fraud reasons.

#### Attack Scenario 5: Insider Threat

**Kill Chain:** Legitimate Access -> Data Reconnaissance -> Unauthorized Transfers -> Evidence Tampering

**MITRE Mapping:** T1078.004 (Cloud Accounts) -> T1530 (Data from Cloud Storage) -> T1070 (Indicator Removal on Host)

**Execution Flow:**

1. **Phase 1 — Legitimate Login:** A normal login from the insider's known IP and device. This login appears completely normal and does not trigger any alerts.

2. **Phase 2 — Abnormal Data Access:** The insider queries 15 accounts in 2 minutes, generating a medium-severity pattern alert for unusual data access behavior.

3. **Phase 3 — Unauthorized Transfers:** Four transfers (12,000, 8,500, 15,000, 9,800 PHP) from a victim's account to the mule account. The first two transfers may go undetected (using legitimate credentials from a known location), while the third and fourth trigger escalating alerts.

4. **Phase 4 — Log Tampering:** A critical alert is generated for audit integrity violation, simulating the insider's attempt to cover their tracks.

The insider threat scenario is particularly interesting because it demonstrates how legitimate access can be abused in ways that are difficult to detect with simple rule-based systems.

#### Execution Controls

- All attack scenarios run asynchronously with configurable delays between phases (200-500ms) to simulate real-time execution
- Only one attack can run at a time (the "running" state prevents concurrent execution)
- Each attack generates a detailed execution log with color-coded entries
- All attacks interact with the full detection pipeline — enabled defensive controls affect attack outcomes

---

### Phase 4: Defensive Controls and Hardening

**Module:** `DefensiveControls.tsx` | **Engine:** `checkSecurityControls()` in `store.ts`

Phase 4 provides six configurable security controls that directly affect transaction processing and login attempts across all other phases. Controls can be individually enabled or disabled with real-time configuration changes.

#### Security Controls

**1. Rate Limiting**

| Parameter | Default | Description |
|-----------|---------|-------------|
| Max Attempts Per Minute | 5 | Maximum login attempts allowed within a 60-second window per user |

When triggered, subsequent login attempts are blocked with the reason "Rate limit exceeded." The check counts recent login log entries within the time window.

**2. Account Lockout**

| Parameter | Default | Description |
|-----------|---------|-------------|
| Max Failed Attempts | 5 | Number of failed login attempts before lockout |
| Lockout Duration (minutes) | 15 | Duration of the lockout period |

After reaching the threshold, the user's `isLocked` flag is set to true and `lockoutUntil` is set to 15 minutes in the future. Locked accounts can be manually unlocked from the Defensive Controls panel.

**3. Multi-Factor Authentication (Simulated OTP)**

| Parameter | Default | Description |
|-----------|---------|-------------|
| Risk Threshold | 60 | Risk score above which MFA is required |

When a transaction's risk score exceeds the threshold, the transfer is paused and the user must enter a simulated OTP code (123456). The MFA challenge is presented in the Core Banking transfer interface.

**4. Transaction Limits**

| Parameter | Default | Description |
|-----------|---------|-------------|
| Daily Limit (PHP) | 100,000 | Maximum cumulative transfer amount per account per day |

The system tracks daily transferred amounts per account. When the daily limit would be exceeded, the transaction is blocked outright. Daily tracking resets at the start of each new day.

**5. IP Blacklisting**

| Parameter | Default | Description |
|-----------|---------|-------------|
| Blacklisted IPs | 185.220.101.1, 91.132.147.5 | Known malicious IP addresses |

Any login attempt or transaction originating from a blacklisted IP is immediately blocked. IPs can be added or removed from the blacklist through the UI. The blacklist is checked before all other security controls.

**6. Step-Up Authentication**

| Parameter | Default | Description |
|-----------|---------|-------------|
| Amount Threshold (PHP) | 50,000 | Transaction amount triggering step-up |
| Risk Threshold | 70 | Risk score triggering step-up |

Transactions exceeding either threshold require additional verification (same MFA flow as Control 3). This control operates independently of the MFA control and uses its own thresholds.

#### Defense Posture Score

The panel displays an overall defense posture score calculated as the percentage of enabled controls out of total controls. A progress bar visualizes the score with color coding:

- 80%+ (Green): Hardened
- 50-79% (Amber): Moderate
- Below 50% (Red): Vulnerable

#### Control Interaction Model

Security controls are evaluated in a specific order during transaction and login processing:

1. IP Blacklist (immediate block)
2. Rate Limiting (login only)
3. Account Lockout (login only)
4. Transaction Limits (transaction only)
5. Step-Up Authentication (transaction only)
6. MFA (transaction only)

If any control returns `allowed: false`, the action is blocked immediately. If a control returns `requiresMFA: true`, the action is paused pending MFA verification.

#### Additional Features

- Locked accounts panel showing all currently locked users with failed attempt counts and manual unlock buttons
- IP blacklist management with add/remove functionality
- Security concept tags on each control (Zero Trust, Defense in Depth, Adaptive Auth, etc.)

---

### Phase 5: SOC Analyst Dashboard

**Module:** `AnalystDashboard.tsx`

Phase 5 simulates a Security Operations Center workflow, providing tools for alert triage, investigation, and response. This is the primary blue team interface.

#### Dashboard Metrics

Six key performance indicators are displayed at the top:

| Metric | Description |
|--------|-------------|
| Total Alerts | Cumulative count of all fraud alerts generated |
| Open | Alerts awaiting triage |
| Resolved | Alerts that have been investigated and closed |
| False Positive | Alerts determined to be non-fraudulent |
| Flagged Txns | Total transactions with risk score >= 40 |
| Blocked | Transactions blocked by security controls |

#### Data Visualizations

Three charts provide analytical context:

1. **Severity Distribution (Pie Chart):** Breakdown of alerts by severity level (Critical, High, Medium, Low) with color-coded segments.

2. **Alert Types (Bar Chart):** Count of alerts by type (Transaction, Login, Pattern).

3. **Risk Distribution (Bar Chart):** Histogram of transaction risk scores in five buckets (0-20, 21-40, 41-60, 61-80, 81-100).

#### Detection Metrics

| Metric | Formula | Description |
|--------|---------|-------------|
| True Positives | Flagged transactions denied upon review | Correctly identified fraud |
| False Positives | Flagged transactions approved upon review | Incorrectly flagged legitimate activity |
| Detection Rate | TP / Total Flagged * 100 | Percentage of flags that were actual fraud |
| Alert Fatigue | FP / Total Reviewed * 100 | Proportion of analyst time spent on false alarms |

These metrics update in real-time as the analyst processes alerts.

#### Alert Queue

The alert queue provides a filterable, searchable list of all fraud alerts with the following features:

- **Filtering:** All, Open, Investigating, Resolved, False Positive
- **Search:** Free-text search across alert descriptions
- **Alert Detail:** Severity badge, type label, MITRE ATT&CK ID, status indicator, description, timestamp
- **Expandable Review Panel:** Click any open/investigating alert to reveal the action panel

#### Response Actions

For each alert, the analyst can take one of five actions:

| Action | Effect | Alert Status | Transaction Review |
|--------|--------|-------------|-------------------|
| Approve | Mark transaction as legitimate | Resolved | approved |
| Deny | Confirm as fraudulent | Resolved | denied |
| Escalate | Assign to Senior Analyst | Investigating | unchanged |
| False Positive (FP) | Mark as non-fraudulent | false_positive | approved |
| Freeze | Freeze the sender's account | Resolved | unchanged |

Each action generates an event log entry and updates the corresponding transaction's review metadata.

#### Audit Trail

A real-time log display showing the most recent 30 events, color-coded by event type:

- Purple: SOC actions
- Red: Security blocks
- Green: Transfers
- Blue: Authentication
- Gray: System events

---

### Phase 6: Machine Learning Fraud Detection

**Module:** `MLDetection.tsx` | **Engine:** `mlPredict()` in `store.ts`

Phase 6 implements a simulated logistic regression classifier that runs alongside the rule-based detection engine. Every transaction receives both a rule-based risk score and an ML prediction probability.

#### Feature Engineering

The ML model extracts seven features from each transaction:

| Feature | Extraction | Normalization |
|---------|-----------|---------------|
| Amount | Transaction amount | Divided by 100,000, capped at 1.0 |
| Velocity | Count of same-user transactions in last 60 seconds | Divided by 5 |
| New IP | Whether sender's IP is in their known IP list | Binary (0 or 1) |
| New Device | Whether sender's device is in their known device list | Binary (0 or 1) |
| Foreign Geo | Whether location is outside Philippines | Binary (0 or 1) |
| Source Account Age | How old the sender's account is | Age/365, capped at 1.0, inverted (newer = riskier) |
| Destination Account Age | How old the recipient's account is | Age/365, capped at 1.0, inverted (newer = riskier) |

#### Model Weights

The simulated model uses pre-defined weights representing a trained logistic regression:

| Feature | Weight | Interpretation |
|---------|--------|----------------|
| Amount | 2.5 | Higher amounts increase fraud probability |
| Velocity | 3.0 | Rapid transactions are strongest fraud signal |
| New IP | 2.0 | Unknown IPs contribute significantly |
| New Device | 1.5 | New devices are moderate risk signal |
| Foreign Geo | 2.2 | Foreign locations are strong risk signal |
| Account Age (source) | -1.5 | Older accounts are less risky (inverted) |
| Account Age (dest) | -1.8 | Newer destination accounts are more suspicious (inverted) |
| Bias | -3.0 | Base threshold favoring non-fraud classification |

The prediction is computed as: `P(fraud) = sigmoid(bias + sum(weight_i * feature_i))` with a small random noise factor (+/- 0.025) for realistic variation.

#### Classification Threshold

Transactions with ML prediction >= 0.5 (50%) are classified as ML-flagged. This threshold allows comparison with the rule-based system's flag threshold of 40 risk score points.

#### Performance Metrics

Four standard classification metrics are computed from actual predictions:

| Metric | Formula | Description |
|--------|---------|-------------|
| Accuracy | (TP + TN) / Total | Overall correct prediction rate |
| Precision | TP / (TP + FP) | Of predicted frauds, how many were actually fraud |
| Recall | TP / (TP + FN) | Of actual frauds, how many were detected |
| F1 Score | 2 * (P * R) / (P + R) | Harmonic mean of precision and recall |

Note: "Actual fraud" is determined by whether the transaction was flagged by the rule-based system, making this a comparison between two detection approaches rather than a comparison against ground truth labels.

#### Visualizations

1. **Confusion Matrix:** 2x2 grid showing TP, FP, TN, FN counts with color coding
2. **ML vs Rule-Based Comparison:** Side-by-side counts of flagged transactions by each method, including overlap analysis
3. **Feature Importance:** Horizontal bar chart showing relative importance of each feature (static, based on weight magnitudes)
4. **Prediction Distribution:** Histogram of ML prediction probabilities in six buckets (0-10%, 11-30%, 31-50%, 51-70%, 71-90%, 91-100%)
5. **Scatter Plot:** Each transaction plotted with rule-based score on X-axis and ML score on Y-axis, colored by flag status
6. **Transaction Detail List:** Per-transaction comparison showing both rule-based and ML scores side by side

---

### Phase 7: Threat Intelligence

**Module:** `ThreatIntel.tsx` | **Engine:** `correlateThreatIntel()` in `store.ts`

Phase 7 provides an Indicator of Compromise (IOC) management system with threat actor profiling and STIX/TAXII format simulation.

#### Pre-loaded Threat Intelligence

The system ships with eight IOCs covering various threat types:

| IOC | Type | Threat Actor | Severity | Source |
|-----|------|-------------|----------|--------|
| 185.220.101.1 | IP | APT-FIN7 | Critical | FS-ISAC |
| 91.132.147.5 | IP | Lazarus Group | High | MISP |
| 203.0.113.42 | IP | Carbanak | High | OTX |
| mule@temp.com | Email | Unknown | Medium | Internal |
| Tor Browser/Unknown | Device | Multiple | Medium | Device Fingerprint DB |
| smurfing_<5000_x8 | Pattern | AML Networks | High | FinCEN |
| 45.33.32.156 | IP | SilverTerrier | High | Unit 42 |
| 9006660001 | Account | Unknown | Medium | Internal SAR DB |

#### Features

**IOC Feed:** Filterable, searchable list of all indicators with severity badges, confidence scores, threat actor attribution, source tracking, and tag system. Each IOC can be expanded to show full details including STIX type, first/last seen dates, and description. IOCs can be toggled active/inactive.

**Correlation Engine:** Enter any IP, device identifier, email, or account number to search for matches across the threat intelligence database. Results show matching IOCs with threat actor attribution and severity.

**Threat Actor Profiles:** Aggregated view grouping IOCs by attributed threat actor. Each profile shows IOC count, maximum severity, associated indicators, and technique tags.

**STIX 2.1 Objects:** JSON representation of each IOC in STIX 2.1 format, including type, ID, pattern, confidence, and labels. This demonstrates how threat intelligence is shared between organizations using standardized formats.

**Manual IOC Submission:** Add new indicators with configurable type, value, threat actor, severity, tags, and description.

#### Enrichment Statistics

| Metric | Description |
|--------|-------------|
| Total IOCs | Count of all indicators in the database |
| Active | Currently active indicators |
| Critical | Critical severity indicators |
| Actors | Unique threat actor attributions |
| TX Hits | Transactions matching active IOCs |
| Login Hits | Login attempts matching active IOCs |

---

### Phase 8: Compliance and Reporting

**Module:** `Compliance.tsx`

Phase 8 implements regulatory compliance monitoring, report generation, and audit management aligned with Philippine banking regulations.

#### Compliance Score

An overall compliance score is calculated from eight compliance checks:

| Check | Condition for Pass |
|-------|-------------------|
| SAR Filing | SAR report generated OR no flagged transactions exist |
| CTR Filing | CTR report generated OR no transactions over 50,000 PHP |
| AML Controls | Transaction limit control is enabled |
| KYC Verification | At least one user exists in the system |
| Fraud Detection | 4 or more security controls are enabled |
| Incident Response | At least one alert has been resolved OR no alerts exist |
| Audit Trail | Event log has more than 5 entries |
| Account Security | Both account lockout and MFA controls are enabled |

#### Report Types

**Suspicious Activity Report (SAR):**
- Manually select flagged transactions to include
- Auto-generates summary with transaction count, total amount, and AML pattern detection
- Filed to AMLC (Anti-Money Laundering Council)
- 5 business day filing deadline

**Currency Transaction Report (CTR):**
- Automatically identifies transactions exceeding 50,000 PHP threshold
- References BSP Circular 706 and RA 9160
- Filed to BSP (Bangko Sentral ng Pilipinas)
- 10 business day filing deadline

**Audit Report:**
- System-wide security assessment
- Includes user count, transaction count, flag rate, block count, and control status
- Filed internally and to BSP
- 30 day deadline

#### Report Lifecycle

Reports progress through three statuses:
1. **Draft:** Initial generation
2. **Submitted:** Filed with regulatory body
3. **Acknowledged:** Confirmed received (not yet implemented in UI)

#### Regulatory Framework Reference

The panel references four Philippine regulations:

| Regulation | Description |
|-----------|-------------|
| RA 9160 (AMLA) | Anti-Money Laundering Act — core AML mandate |
| BSP Circular 706 | Enhanced AML/CFT guidelines for BSFIs |
| BSP Circular 1108 | IT Risk Management framework |
| RA 10175 | Cybercrime Prevention Act |

#### Compliance Obligations Tracker

Four ongoing obligations with deadline tracking and completion status:
- SAR filing for suspicious activity (5 days)
- CTR filing for large transactions (5 days)
- Quarterly audit report (30 days)
- Frozen account review (Ongoing)

---

## Data Model

### Entity Relationship Overview

```
Users (1) ----< Accounts (1) ----< Transactions
  |                                     |
  |                                     |
  +----< LoginLogs                      +----< FraudAlerts
  |                                     |
  +----< UserBehaviorProfiles           +----< ComplianceReports
                                        |
                                   MLPredictions (embedded)
```

### Core Entities

**User:** `id`, `username`, `fullName`, `email`, `passwordHash`, `createdAt`, `isLocked`, `lockoutUntil`, `failedLoginAttempts`, `mfaEnabled`, `knownIPs[]`, `knownDevices[]`, `accountAge`

**Account:** `id`, `userId`, `accountNumber`, `balance`, `dailyTransferred`, `dailyTransferDate`, `isFrozen`, `type` (checking/savings)

**Transaction:** `id`, `fromAccountId`, `toAccountId`, `fromUserId`, `toUserId`, `amount`, `timestamp`, `type`, `status`, `riskScore`, `isFlagged`, `fraudReasons[]`, `ip`, `device`, `geoLocation`, `reviewStatus`, `reviewedBy`, `reviewNote`, `mitreAttackTechnique`, `attackScenario`, `mlPrediction`, `mlFlagged`

**LoginLog:** `id`, `userId`, `username`, `timestamp`, `ip`, `device`, `success`, `geoLocation`, `blocked`, `reason`

**FraudAlert:** `id`, `transactionId`, `loginLogId`, `type`, `severity`, `description`, `timestamp`, `status`, `assignedTo`, `mitreId`, `mitreTactic`

**SecurityControl:** `id`, `name`, `enabled`, `description`, `category`, `config{}`

**ThreatIntelIndicator:** `id`, `type`, `value`, `threatActor`, `confidence`, `severity`, `source`, `firstSeen`, `lastSeen`, `tags[]`, `stixType`, `description`, `active`

**ComplianceReport:** `id`, `type`, `title`, `generatedAt`, `status`, `relatedTransactions[]`, `relatedAlerts[]`, `summary`, `regulatoryBody`, `dueDate`, `filedBy`

**UserBehaviorProfile:** `userId`, `avgTransactionAmount`, `avgTransactionsPerDay`, `typicalHours`, `typicalGeos[]`, `typicalDevices[]`, `typicalIPs[]`, `riskTrend[]`, `lastActivityTimestamp`, `deviationScore`

---

## Fraud Detection Engine

The detection engine in `store.ts` exports four core functions:

### evaluateTransactionRisk()

Accepts a partial transaction and the current state. Evaluates all seven detection rules. Returns `{ riskScore: number, reasons: string[], isFlagged: boolean }`.

### mlPredict()

Accepts a partial transaction and the current state. Extracts seven features, applies weighted logistic regression, and returns a probability between 0 and 1.

### checkSecurityControls()

Accepts an action type ('login' or 'transaction'), the current state, and parameters. Evaluates all enabled security controls in priority order. Returns `{ allowed: boolean, reason: string | null, requiresMFA: boolean }`.

### calculateBehaviorDeviation()

Accepts a user ID, partial transaction, and state. Compares transaction characteristics against the user's behavioral baseline. Returns `{ deviationScore: number, deviations: string[] }`.

### correlateThreatIntel()

Accepts the current state and search parameters (IP, device, email, account number). Returns matching threat intelligence indicators.

---

## Security Concepts Applied

The following cybersecurity concepts are demonstrated across the eight phases:

| Concept | Phase(s) | Implementation |
|---------|----------|---------------|
| Password Hashing | 1 | Simulated bcrypt with $2b$10$ prefix |
| Input Validation | 1 | Injection character filtering |
| Authentication | 1, 4 | Username/password verification |
| Session Management | 1 | Current user tracking |
| Anomaly Detection | 2 | Rule-based deviation from expected patterns |
| Risk Scoring | 2 | Cumulative weighted score per transaction |
| UEBA | 2, 6 | User behavioral baseline comparison |
| Detection Engineering | 2 | Tunable detection rules with hit tracking |
| Threat Modeling | 3 | Structured attack scenarios |
| MITRE ATT&CK | 3 | Technique and tactic mapping for each attack |
| Kill Chain | 3 | Multi-phase attack progression |
| Credential Stuffing | 3 | Brute-force login simulation |
| Zero Trust | 4 | Never trust, always verify approach |
| Defense in Depth | 4 | Multiple layered security controls |
| Adaptive Authentication | 4 | Risk-based MFA triggering |
| Rate Limiting | 4 | Login attempt throttling |
| Account Lockout | 4 | Automatic lockout after failed attempts |
| IP Reputation | 4, 7 | Blacklist-based IP blocking |
| Incident Response | 5 | Alert triage and response workflow |
| Case Management | 5 | Alert status tracking and assignment |
| Security Monitoring | 5 | Real-time alert queue and metrics |
| SIEM Logic | 5 | Log aggregation and analysis |
| Behavioral Analytics | 6 | ML-based transaction scoring |
| Model Evaluation | 6 | Confusion matrix, F1, precision, recall |
| Imbalanced Classification | 6 | Fraud vs legitimate transaction ratio |
| Threat Intelligence | 7 | IOC management and correlation |
| STIX/TAXII | 7 | Standardized threat data format |
| IOC Management | 7 | Indicator lifecycle tracking |
| Regulatory Compliance | 8 | BSP/AMLC reporting requirements |
| SAR/CTR Filing | 8 | Suspicious activity and currency transaction reports |
| Audit Trail | 1-8 | Comprehensive event logging |

---

## MITRE ATT&CK Mapping

All attack simulations map to specific MITRE ATT&CK techniques:

| Technique ID | Name | Tactic | Used In |
|-------------|------|--------|---------|
| T1110 | Brute Force | Credential Access | Account Takeover |
| T1078 | Valid Accounts | Initial Access | ATO, SIM Swap |
| T1078.004 | Cloud Accounts | Privilege Escalation | Insider Threat |
| T1537 | Transfer to Cloud Account | Exfiltration | ATO, Phishing, SIM Swap |
| T1566 | Phishing | Initial Access | Phishing Fraud |
| T1539 | Steal Web Session Cookie | Credential Access | Phishing Fraud |
| T1565 | Data Manipulation | Impact | Money Laundering |
| T1111 | MFA Interception | Credential Access | SIM Swap |
| T1530 | Data from Cloud Storage | Collection | Insider Threat |
| T1070 | Indicator Removal on Host | Defense Evasion | Insider Threat |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Installation

```bash
git clone <repository-url>
cd sentinel-fraud-sandbox
npm install
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Production Build

```bash
npm run build
```

The build outputs a single `dist/index.html` file (via vite-plugin-singlefile) that can be deployed to any static hosting service.

### Preview Production Build

```bash
npm run preview
```

---

## Project Structure

```
sentinel-fraud-sandbox/
|-- index.html                          # Entry HTML with font imports
|-- package.json                        # Dependencies and scripts
|-- tsconfig.json                       # TypeScript configuration
|-- vite.config.ts                      # Vite build configuration
|-- src/
|   |-- main.tsx                        # React DOM entry point
|   |-- App.tsx                         # Root component, routing, layout
|   |-- index.css                       # Global styles, animations, design tokens
|   |-- types.ts                        # TypeScript interfaces for all data models
|   |-- store.ts                        # State management, seed data, detection engines
|   |-- utils/
|   |   |-- cn.ts                       # Tailwind class name merge utility
|   |-- components/
|       |-- Sidebar.tsx                 # Navigation sidebar with phase modules
|       |-- CoreBanking.tsx             # Phase 1: Banking simulation
|       |-- FraudDetection.tsx          # Phase 2: Rule-based detection display
|       |-- AttackSimulation.tsx        # Phase 3: Red team attack scenarios
|       |-- DefensiveControls.tsx       # Phase 4: Security control configuration
|       |-- AnalystDashboard.tsx        # Phase 5: SOC analyst workflow
|       |-- MLDetection.tsx             # Phase 6: ML model analysis
|       |-- ThreatIntel.tsx             # Phase 7: Threat intelligence management
|       |-- Compliance.tsx              # Phase 8: Regulatory compliance
```

---

## Usage Guide

### Recommended Exploration Order

1. **Start with Phase 1.** Register a new user or use the pre-seeded credentials (jdelacruz / password123). Make a few legitimate transfers between accounts to establish baseline activity.

2. **Move to Phase 2.** Observe how your transactions were scored by the detection rules. Note which rules triggered and how scores accumulated.

3. **Run attacks in Phase 3.** Start with Account Takeover to see the full attack chain. Watch the execution log and note which phases of the attack succeed or fail based on current defensive controls.

4. **Check Phase 5.** After running attacks, the SOC Dashboard will have alerts to triage. Practice the analyst workflow by reviewing, approving, denying, or escalating alerts.

5. **Toggle defenses in Phase 4.** Disable all controls and re-run an attack. Then enable all controls and run the same attack again. Compare the outcomes.

6. **Analyze ML in Phase 6.** After generating enough transaction data, review the ML model's performance metrics and compare its predictions with the rule-based system.

7. **Explore Threat Intel in Phase 7.** Use the correlation engine to look up IPs used in attacks. Review threat actor profiles.

8. **Generate reports in Phase 8.** Create SAR and CTR reports from flagged transactions. Review the compliance score and identify any failing checks.

### Key Interactions

- **Reset Button (top bar):** Clears all state and returns to initial seed data
- **Event Log (top bar):** Toggle the global event log panel to see all system activity
- **Phase 3 vs Phase 4:** These phases are designed to be used together. Defensive controls directly affect attack outcomes.
- **Phase 5 actions affect Phase 6 metrics:** Approving or denying flagged transactions updates the ML comparison metrics.

---

## Design Philosophy

The visual design follows several principles:

- **Information Density:** Compact layouts with small font sizes (10-13px) to maximize data visibility without scrolling
- **Dark Theme:** Reduces eye strain during extended analysis sessions and creates a professional SOC environment aesthetic
- **Layered Surfaces:** Four surface levels (surface-0 through surface-3) create visual hierarchy through subtle depth changes
- **Muted Colors:** All accent colors use opacity modifiers (e.g., text-red-400/70, bg-emerald-500/5) to avoid visual noise and reduce eye fatigue
- **Monospace Numbers:** All numerical data uses JetBrains Mono with tabular-nums for aligned, scannable number columns
- **Subtle Animations:** Fade-in, scale-in, and slide-up animations with staggered delays provide visual flow without distraction
- **Glass Card Effect:** Semi-transparent gradient backgrounds with subtle borders and backdrop blur create a modern, layered appearance
- **Consistent Iconography:** Lucide icons throughout at consistent sizes (11-16px) with muted colors

---

## Limitations and Disclaimers

1. **No real backend.** All data exists in browser memory and is lost on page refresh. There is no persistence layer, no database, and no server-side processing.

2. **Simulated cryptography.** The password hashing function produces bcrypt-formatted strings but does not perform actual bcrypt computation. It uses a simple character code hash for demonstration purposes only. Do not use this implementation for any real authentication system.

3. **Simulated ML model.** The logistic regression model uses pre-defined static weights rather than weights learned from training data. The model demonstrates the concept of feature extraction, weighted scoring, and sigmoid activation, but does not involve actual model training, cross-validation, or hyperparameter tuning.

4. **No real network traffic.** IP addresses, device strings, and geolocations are randomly selected from predefined lists. No actual network requests, geolocation lookups, or device fingerprinting occurs.

5. **Simplified attack scenarios.** Real banking fraud involves significantly more complexity, including multi-month campaigns, sophisticated social engineering, malware deployment, and coordination between multiple threat actors. The simulations here are condensed representations for educational purposes.

6. **Regulatory simplification.** The compliance module references real Philippine banking regulations but simplifies their requirements significantly. Actual SAR/CTR filing involves extensive documentation, investigation, and coordination with regulatory bodies.

7. **Single-user application.** There is no multi-user support, role-based access control, or concurrent session management. The "analyst" and "attacker" roles are conceptual rather than enforced.

8. **Not a security tool.** Sentinel is an educational sandbox. It should not be used as a basis for production fraud detection systems, security assessments, or compliance programs.

---

## Future Enhancements

Potential additions for further development:

- Network graph visualization showing transaction flows between accounts
- Geolocation heatmap for login and transaction activity
- SOAR playbook automation with configurable response workflows
- Real-time WebSocket-based event streaming simulation
- Persistence layer using IndexedDB or localStorage
- Export functionality for transaction data, alerts, and reports (CSV/JSON)
- Customizable attack scenario builder
- Additional ML models (Random Forest, Neural Network simulation)
- API endpoint simulation for integration testing
- Multi-analyst role-based access simulation
- Time-series analysis for trend detection
- Graph-based fraud detection for identifying connected fraud rings
- Configurable transaction fee and interest rate simulation
- Currency conversion and cross-border transaction simulation

---

## License

This project is provided for educational and research purposes. No warranty is provided. The author assumes no liability for misuse. All simulated attack techniques are documented for defensive understanding only.

---

**Created by kurtesianplane**
