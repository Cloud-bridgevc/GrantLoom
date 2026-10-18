// Grant Assistant (demo mode): retrieval over uploaded agreement clauses and recorded project data.
// Production routes the same retrieved context to Bedrock with an instruction to answer only from it (server/src/lib/prompts.ts).
import { TODAY } from '../data/demo';
import type { Role } from '../data/types';
import { detectGaps, grantTxns, sum, variance } from './analysis';
import { fmtDate, pct, usd } from './format';
import type { DB } from './store';

export interface Answer { text: string; sources: string[]; refused?: boolean }

const FIN = /\b(spen[dt]|spending|cost|budget|remaining|expenditure|balance|money|paid|variance|over|under)\b/i;
const STOP = new Set('the a an of to for is are was were we our can do does what which when how much many on in at by with and or be it this that grant any us i my there have has'.split(' '));
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9§.\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

export function ask(db: DB, q: string, grantId: string, role: Role): Answer {
  const g = db.grants.find((x) => x.id === grantId)!;
  const lq = q.toLowerCase();

  if (/(household|beneficiar|people reached|lives|impact)/.test(lq) && !db.outcomes.some((o) => o.grantId === grantId && /household|beneficiar/i.test(o.metric))) {
    const r = db.requirements.find((x) => x.grantId === grantId && x.requiresMetric);
    return { text: `No beneficiary or household figure has been recorded for ${g.code}. I can't estimate or infer one.${r ? ` Note that ${r.source.clause} requires this figure in narrative reports, so it is currently flagged as missing.` : ''}`, sources: r ? [r.id, r.source.clause] : [], refused: true };
  }

  if (FIN.test(lq) && role === 'viewer') {
    return { text: 'Your role (read-only board observer) is not authorized to view transaction-level financial data. You can ask about requirements, deadlines and milestones.', sources: [], refused: true };
  }

  if (/(deadline|due|when|calendar|next report)/.test(lq)) {
    const upcoming = db.requirements.filter((r) => r.grantId === grantId && r.due).sort((a, b) => a.due!.localeCompare(b.due!));
    const lines = upcoming.map((r) => {
      const rep = db.reports.find((x) => x.requirementId === r.id);
      const state = rep?.status === 'Submitted' ? 'submitted' : r.due! < TODAY ? 'OVERDUE' : `${Math.round((+new Date(r.due!) - +new Date(TODAY)) / 864e5)} days away`;
      return `• ${r.title} — ${fmtDate(r.due!)} (${state}) [${r.source.clause}]`;
    });
    return { text: `Dated obligations for ${g.code}:\n${lines.join('\n')}`, sources: upcoming.map((r) => r.id) };
  }

  if (/(gap|missing|risk|problem|issue|ready)/.test(lq)) {
    const gaps = detectGaps(db, grantId);
    const by = (s: string) => gaps.filter((x) => x.severity === s).length;
    return {
      text: `${gaps.length} open gaps for ${g.code} (${by('critical')} critical, ${by('major')} major, ${by('minor')} minor). Most urgent:\n${gaps.slice(0, 5).map((x) => `• [${x.severity}] ${x.title} — ${x.fix}`).join('\n')}`,
      sources: [...new Set(gaps.slice(0, 5).flatMap((x) => x.refs))],
    };
  }

  const cat = g.budget.find((b) => words(b.category).some((w) => lq.includes(w)));
  if (FIN.test(lq)) {
    if (cat) {
      const v = variance(db, grantId).find((x) => x.category === cat.category)!;
      return {
        text: `${cat.category}: ${usd(v.actual)} spent of ${usd(v.budget)} approved (${pct(v.usedPct)}), ${usd(v.budget - v.actual)} remaining. Pro-rata variance ${v.variancePct > 0 ? '+' : ''}${pct(v.variancePct)}${v.material ? ' — material, explanation required' : ''}. Based on ${v.drivers.length} recorded transactions.`,
        sources: v.drivers.map((t) => t.id),
      };
    }
    const ts = grantTxns(db, grantId);
    return { text: `Total recorded expenditure for ${g.code} to ${fmtDate(TODAY)}: ${usd(sum(ts))} of the ${usd(g.award)} award (${pct(sum(ts) / g.award)}), from ${ts.length} transactions.`, sources: ts.map((t) => t.id) };
  }

  if (/milestone|progress|complete/.test(lq)) {
    const ms = db.milestones.filter((m) => m.grantId === grantId);
    return { text: ms.map((m) => `• ${m.title} — ${m.status} (due ${fmtDate(m.due)})${m.evidenceIds.length ? '' : ' — no evidence uploaded'}`).join('\n'), sources: ms.map((m) => m.id) };
  }

  // Clause retrieval: score clauses and extracted requirements by keyword overlap.
  const qw = words(q);
  const docs = db.documents.filter((d) => d.grantId === grantId);
  const scored = docs.flatMap((d) => d.clauses.map((c) => {
    const cw = words(`${c.heading} ${c.text}`);
    const score = qw.filter((w) => cw.some((x) => x.startsWith(w.slice(0, 5)))).length;
    return { d, c, score };
  })).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);

  if (!scored.length || scored[0].score < 1) {
    return { text: `I couldn't find anything about that in the uploaded agreement for ${g.code} or in recorded project data, so I won't guess. Try rephrasing, or check with the funder's program officer.`, sources: [], refused: true };
  }
  const top = scored.slice(0, 2);
  return {
    text: top.map(({ d, c }) => `${c.heading} (${c.ref}, ${d.filename} p.${c.page}): “${c.text}”`).join('\n\n') + (/alcohol|beer|wine|drink/.test(lq) ? `\n\nRecorded data check: ${detectGaps(db, grantId).filter((x) => x.kind === 'Ineligible cost').map((x) => x.title).join('; ') || 'no prohibited items detected in uploaded receipts.'}` : ''),
    sources: top.map(({ c }) => c.ref),
  };
}
