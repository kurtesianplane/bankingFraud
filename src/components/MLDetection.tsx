import { StoreState } from '../store';
import { Brain, TrendingUp, Target, Layers, Zap, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, CartesianGrid, Cell } from 'recharts';

interface MLDetectionProps {
  state: StoreState;
}

export function MLDetection({ state }: MLDetectionProps) {
  const txsWithML = state.transactions.filter(t => t.mlPrediction !== null);
  const mlThreshold = 0.5;
  const truePositives = txsWithML.filter(t => (t.mlPrediction || 0) > mlThreshold && t.isFlagged).length;
  const falsePositives = txsWithML.filter(t => (t.mlPrediction || 0) > mlThreshold && !t.isFlagged).length;
  const trueNegatives = txsWithML.filter(t => (t.mlPrediction || 0) <= mlThreshold && !t.isFlagged).length;
  const falseNegatives = txsWithML.filter(t => (t.mlPrediction || 0) <= mlThreshold && t.isFlagged).length;

  const totalPredicted = truePositives + falsePositives + trueNegatives + falseNegatives;
  const accuracy = totalPredicted > 0 ? ((truePositives + trueNegatives) / totalPredicted) * 100 : 0;
  const precision = (truePositives + falsePositives) > 0 ? (truePositives / (truePositives + falsePositives)) * 100 : 0;
  const recall = (truePositives + falseNegatives) > 0 ? (truePositives / (truePositives + falseNegatives)) * 100 : 0;
  const f1Score = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  const rbFlagged = state.transactions.filter(t => t.isFlagged).length;
  const mlFlagged = txsWithML.filter(t => (t.mlPrediction || 0) > mlThreshold).length;
  const bothFlagged = txsWithML.filter(t => t.isFlagged && (t.mlPrediction || 0) > mlThreshold).length;
  const onlyRuleFlagged = txsWithML.filter(t => t.isFlagged && (t.mlPrediction || 0) <= mlThreshold).length;
  const onlyMLFlagged = txsWithML.filter(t => !t.isFlagged && (t.mlPrediction || 0) > mlThreshold).length;
  const rbNotFlagged = state.transactions.filter(t => !t.isFlagged).length;

  const scatterData = txsWithML.map(t => ({ ruleScore: t.riskScore, mlScore: Math.round((t.mlPrediction || 0) * 100), flagged: t.isFlagged }));

  const featureImportance = [
    { feature: 'Velocity', importance: 85 },
    { feature: 'Amount', importance: 72 },
    { feature: 'Foreign Geo', importance: 68 },
    { feature: 'New IP', importance: 62 },
    { feature: 'Dest Acct Age', importance: 55 },
    { feature: 'New Device', importance: 48 },
    { feature: 'Src Acct Age', importance: 35 },
  ];

  const predictionBuckets = [
    { range: '0-10%', count: txsWithML.filter(t => (t.mlPrediction || 0) <= 0.1).length },
    { range: '11-30%', count: txsWithML.filter(t => (t.mlPrediction || 0) > 0.1 && (t.mlPrediction || 0) <= 0.3).length },
    { range: '31-50%', count: txsWithML.filter(t => (t.mlPrediction || 0) > 0.3 && (t.mlPrediction || 0) <= 0.5).length },
    { range: '51-70%', count: txsWithML.filter(t => (t.mlPrediction || 0) > 0.5 && (t.mlPrediction || 0) <= 0.7).length },
    { range: '71-90%', count: txsWithML.filter(t => (t.mlPrediction || 0) > 0.7 && (t.mlPrediction || 0) <= 0.9).length },
    { range: '91-100%', count: txsWithML.filter(t => (t.mlPrediction || 0) > 0.9).length },
  ];

  const tooltipStyle = { background: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '11px', color: '#a1a1aa' };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Machine Learning Detection</h2>
        <p className="text-[12px] text-zinc-500 mt-0.5">Simulated logistic regression model with behavioral analytics & UEBA</p>
      </div>

      {txsWithML.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center animate-fade-in">
          <Brain size={40} className="mx-auto text-zinc-800 mb-4" />
          <h3 className="text-[15px] font-semibold text-zinc-400">No ML Data Available</h3>
          <p className="text-[12px] text-zinc-600 mt-1.5">Run transactions or attack simulations to generate predictions.</p>
        </div>
      ) : (
        <>
          {/* Model Performance */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Accuracy', value: accuracy, icon: <Target size={14} />, desc: '(TP+TN)/Total' },
              { label: 'Precision', value: precision, icon: <Zap size={14} />, desc: 'TP/(TP+FP)' },
              { label: 'Recall', value: recall, icon: <TrendingUp size={14} />, desc: 'TP/(TP+FN)' },
              { label: 'F1 Score', value: f1Score, icon: <Layers size={14} />, desc: '2(P×R)/(P+R)' },
            ].map((m, i) => (
              <div key={i} className={`glass-card rounded-xl p-4 text-center stat-card animate-fade-in stagger-${i + 1}`}>
                <div className="flex items-center justify-center gap-1.5 text-accent/60 mb-1">{m.icon}</div>
                <div className="text-2xl font-bold tracking-tight text-zinc-100">{m.value.toFixed(1)}%</div>
                <div className="text-[10px] text-zinc-400 font-medium mt-0.5">{m.label}</div>
                <div className="text-[9px] text-zinc-700 font-mono">{m.desc}</div>
              </div>
            ))}
          </div>

          {/* Confusion Matrix + Comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-xl p-5 animate-fade-in">
              <h3 className="text-[13px] font-semibold text-zinc-200 mb-3">Confusion Matrix</h3>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[11px]">
                <div /> <div className="text-zinc-600 py-1 text-[10px] font-medium">Pred: Fraud</div> <div className="text-zinc-600 py-1 text-[10px] font-medium">Pred: Legit</div>
                <div className="text-zinc-600 py-2 text-right pr-2 text-[10px] font-medium">Actual: Fraud</div>
                <div className="bg-emerald-500/5 border border-emerald-500/12 rounded-lg p-3">
                  <div className="text-xl font-bold text-emerald-400/80">{truePositives}</div>
                  <div className="text-[9px] text-emerald-400/40">TP</div>
                </div>
                <div className="bg-red-500/5 border border-red-500/12 rounded-lg p-3">
                  <div className="text-xl font-bold text-red-400/80">{falseNegatives}</div>
                  <div className="text-[9px] text-red-400/40">FN</div>
                </div>
                <div className="text-zinc-600 py-2 text-right pr-2 text-[10px] font-medium">Actual: Legit</div>
                <div className="bg-orange-500/5 border border-orange-500/12 rounded-lg p-3">
                  <div className="text-xl font-bold text-orange-400/80">{falsePositives}</div>
                  <div className="text-[9px] text-orange-400/40">FP</div>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/12 rounded-lg p-3">
                  <div className="text-xl font-bold text-blue-400/80">{trueNegatives}</div>
                  <div className="text-[9px] text-blue-400/40">TN</div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 animate-fade-in">
              <h3 className="text-[13px] font-semibold text-zinc-200 mb-3">ML vs Rule-Based</h3>
              <div className="space-y-2">
                {[
                  { label: 'Rule-Based Flagged', value: rbFlagged, color: 'text-amber-400/70' },
                  { label: 'ML Flagged (≥50%)', value: mlFlagged, color: 'text-purple-400/70' },
                  { label: 'Both Flagged', value: bothFlagged, color: 'text-emerald-400/70' },
                  { label: 'Only Rule Flagged', value: onlyRuleFlagged, color: 'text-orange-400/70' },
                  { label: 'Only ML Flagged', value: onlyMLFlagged, color: 'text-red-400/70' },
                  { label: 'Neither Flagged', value: rbNotFlagged - onlyMLFlagged, color: 'text-zinc-400' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500">{r.label}</span>
                    <span className={`font-semibold font-mono tabular-nums ${r.color}`}>{r.value}</span>
                  </div>
                ))}
                <div className="bg-surface-2/40 rounded-lg p-2 text-[10px] text-zinc-600 mt-1 border border-border-subtle">
                  {bothFlagged > 0 ? `${((bothFlagged / Math.max(rbFlagged, mlFlagged, 1)) * 100).toFixed(0)}% agreement` : 'Run simulations for comparison data'}
                </div>
              </div>
            </div>
          </div>

          {/* Feature Importance + Distribution */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card rounded-xl p-5 animate-fade-in">
              <h3 className="text-[13px] font-semibold text-zinc-200 mb-3">Feature Importance</h3>
              <div className="space-y-2">
                {featureImportance.map(f => (
                  <div key={f.feature} className="flex items-center gap-2">
                    <span className="text-[11px] text-zinc-500 w-20 text-right font-medium">{f.feature}</span>
                    <div className="flex-1 bg-surface-2 rounded-full h-1.5 overflow-hidden">
                      <div className="h-1.5 rounded-full bg-accent/40 risk-bar" style={{ width: `${f.importance}%` }} />
                    </div>
                    <span className="text-[10px] text-zinc-600 w-8 font-mono tabular-nums">{f.importance}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-xl p-5 animate-fade-in">
              <h3 className="text-[13px] font-semibold text-zinc-200 mb-3">Prediction Distribution</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={predictionBuckets}>
                  <XAxis dataKey="range" tick={{ fill: '#52525b', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {predictionBuckets.map((_, i) => <Cell key={i} fill={i < 3 ? '#34d399' : i < 4 ? '#fbbf24' : '#ef4444'} opacity={0.5} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between text-[10px] text-zinc-700 mt-1 px-2 font-medium">
                <span className="text-emerald-500/50">Legitimate</span>
                <span className="text-red-500/50">Fraud</span>
              </div>
            </div>
          </div>

          {/* Scatter */}
          <div className="glass-card rounded-xl p-5 animate-fade-in">
            <h3 className="text-[13px] font-semibold text-zinc-200 mb-3">Rule Score vs ML Score</h3>
            <ResponsiveContainer width="100%" height={180}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="ruleScore" name="Rule Score" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} label={{ value: 'Rule-Based', position: 'insideBottom', offset: -5, fill: '#52525b', fontSize: 10 }} />
                <YAxis dataKey="mlScore" name="ML Score" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} label={{ value: 'ML (%)', angle: -90, position: 'insideLeft', fill: '#52525b', fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [String(value), '']} />
                <Scatter data={scatterData.filter(d => d.flagged)} fill="#ef4444" opacity={0.5} />
                <Scatter data={scatterData.filter(d => !d.flagged)} fill="#34d399" opacity={0.5} />
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-[10px] text-red-400/60"><div className="w-2 h-2 rounded-full bg-red-500/50" /> Flagged</span>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-400/60"><div className="w-2 h-2 rounded-full bg-emerald-500/50" /> Clean</span>
            </div>
          </div>

          {/* Transaction Detail */}
          <div className="glass-card rounded-xl p-5 animate-fade-in">
            <h3 className="text-[13px] font-semibold text-zinc-200 mb-3">Transaction ML Analysis</h3>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {txsWithML.slice().reverse().map(tx => {
                const fromUser = state.users.find(u => u.id === tx.fromUserId);
                const toUser = state.users.find(u => u.id === tx.toUserId);
                const mlPct = Math.round((tx.mlPrediction || 0) * 100);
                return (
                  <div key={tx.id} className="bg-surface-2/30 border border-border-subtle rounded-lg px-3 py-2.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">{fromUser?.fullName} <ArrowRight size={9} className="inline mx-1 text-zinc-700" /> {toUser?.fullName}</span>
                      <span className="text-zinc-200 font-semibold font-mono tabular-nums">₱{tx.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-zinc-700 text-[10px] w-7">Rule</span>
                        <div className="flex-1 bg-surface-0 rounded-full h-1"><div className={`h-1 rounded-full risk-bar ${tx.riskScore >= 70 ? 'bg-red-500/60' : tx.riskScore >= 40 ? 'bg-amber-500/60' : 'bg-emerald-500/60'}`} style={{ width: `${tx.riskScore}%` }} /></div>
                        <span className="text-zinc-600 text-[10px] w-5 font-mono tabular-nums">{tx.riskScore}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-1">
                        <span className="text-zinc-700 text-[10px] w-5">ML</span>
                        <div className="flex-1 bg-surface-0 rounded-full h-1"><div className={`h-1 rounded-full risk-bar ${mlPct >= 70 ? 'bg-red-500/60' : mlPct >= 50 ? 'bg-amber-500/60' : 'bg-emerald-500/60'}`} style={{ width: `${mlPct}%` }} /></div>
                        <span className="text-zinc-600 text-[10px] w-7 font-mono tabular-nums">{mlPct}%</span>
                      </div>
                      <span className={`text-[9px] font-semibold uppercase tracking-wider ${tx.status === 'blocked' ? 'text-red-400/50' : tx.isFlagged ? 'text-amber-400/50' : 'text-emerald-400/50'}`}>{tx.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
