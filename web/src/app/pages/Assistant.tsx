import { useState, type FormEvent } from 'react';
import { Cite, PageHead } from '../../components/ui';
import { ask, type Answer } from '../../engine/assistant';
import { useStore } from '../../engine/store';
import { GrantPicker, useSingleGrant } from '../AppShell';

const SUGGESTED = ['What reports are due and when?', 'Can we charge alcohol at a community event?', 'How much have we spent on travel?', 'What gaps should we fix before the next report?', 'How many households have improved water access?', 'What evidence is needed for training?'];

export function AssistantPage() {
  const { db, user } = useStore();
  const { grantId, setGrantId, pick } = useSingleGrant();
  const [q, setQ] = useState('');
  const [log, setLog] = useState<{ q: string; a: Answer; grantId: string }[]>([]);

  const send = (text: string) => {
    if (!text.trim()) return;
    setLog((l) => [...l, { q: text, a: ask(db, text, grantId, user.role), grantId }]);
    setQ('');
  };
  const submit = (e: FormEvent) => { e.preventDefault(); send(q); };

  return (
    <>
      <PageHead title="Grant assistant" sub={`Answers only from the uploaded agreement and recorded project data, within your permissions (${user.title}).`} actions={pick && <GrantPicker grantId={grantId} setGrantId={setGrantId} />} />
      <div className="card" style={{ minHeight: 360 }}>
        <div className="chat">
          {!log.length && <div className="muted small">Try a question:</div>}
          {!log.length && <div className="row">{SUGGESTED.map((s) => <button key={s} className="btn btn-ghost btn-sm" onClick={() => send(s)}>{s}</button>)}</div>}
          {log.map((m, i) => (
            <div key={i} className="chat">
              <div className="msg q">{m.q}</div>
              <div className={`msg a ${m.a.refused ? 'refused' : ''}`}>
                {m.a.text}
                {m.a.sources.length > 0 && <div style={{ marginTop: 8, whiteSpace: 'normal' }}><span className="small muted">Sources: </span>{m.a.sources.slice(0, 12).map((s) => <Cite key={s} id={s} grantId={m.grantId} />)}{m.a.sources.length > 12 && <span className="small muted"> +{m.a.sources.length - 12}</span>}</div>}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={submit} className="row" style={{ marginTop: 18, flexWrap: 'nowrap' }}>
          <input className="input" style={{ minWidth: 0 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about requirements, deadlines, spending or evidence…" />
          <button className="btn btn-primary" type="submit">Ask</button>
        </form>
      </div>
      <p className="small muted" style={{ marginTop: 10 }}>Demo mode uses keyword retrieval in the browser. In production, retrieved clauses and records are sent to Amazon Bedrock with instructions to answer only from that context and cite it.</p>
    </>
  );
}
