/* global React, BrandLogo */
// =============================================================
// Hidden commission tracker — /eve
//
// Private to Josh: not linked from nav, footer or sitemap, blocked from
// indexing (robots.txt + vercel.json X-Robots-Tag + the noindex meta swap
// below). One password (EVE_PASSWORD) gates it; the numbers live in Supabase
// and are reached only through /api/eve.
//
// That endpoint is one serverless function taking ?action=login|logout|
// commissions, not three routes — Vercel's Hobby plan caps a deployment at 12
// functions and this project hit it. The three handlers are unchanged in
// api/_eve-routes/; see the header of api/portal.js.
//
// Each row is one deal: what Buyer Assist earned (commission), what it cost
// (outgoings), and Eve's agreed share of the net:
//   net     = commission - outgoings
//   eve cut = round(net * cut_percent / 100)
// cut_percent is stored per row, so changing the split later never rewrites
// what Eve was already owed. This file is NOT a security boundary — /api/eve
// enforces the login; hiding controls here is only cosmetic.
// =============================================================
const {
  useState: useStateEve,
  useEffect: useEffectEve,
  useMemo: useMemoEve,
  useCallback: useCallbackEve,
} = React;

function useEveNoIndex() {
  useEffectEve(() => {
    const meta = document.querySelector('meta[name="robots"]');
    const prev = meta ? meta.getAttribute('content') : null;
    if (meta) meta.setAttribute('content', 'noindex, nofollow');
    return () => { if (meta && prev != null) meta.setAttribute('content', prev); };
  }, []);
}

function eveMoney(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}

function eveNet(row) {
  return (Number(row.commission) || 0) - (Number(row.outgoings) || 0);
}
function eveCut(row) {
  return Math.round(eveNet(row) * (Number(row.cut_percent) || 0)) / 100;
}

const EVE_EMPTY_FORM = {
  category: 'deal',
  deal_name: '',
  deal_date: '',
  entry_time: '',
  commission: '',
  outgoings: '',
  cut_percent: '',
  note: '',
};

// The two lists. 'extra' is the off-book "extra curricular" split — kept on its
// own tab so the spicy ones read apart from normal Buyer Assist commission.
const EVE_CATEGORIES = [
  { id: 'deal', label: 'Deals' },
  { id: 'extra', label: 'Extra curricular' },
];

// One <style> block, injected once while the page is mounted. Keeps the tracker
// visually self-contained rather than leaning on the marketing site's classes.
const EVE_STYLES = `
.eve-wrap{min-height:100vh;background:#0A1F3D;color:#eaf0fb;font-family:Manrope,system-ui,sans-serif;padding:28px 20px 80px}
.eve-inner{max-width:1080px;margin:0 auto}
.eve-top{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:8px}
.eve-title{font-family:Newsreader,Georgia,serif;font-size:30px;font-weight:500;margin:0}
.eve-sub{color:#9db2d6;font-size:14px;margin:2px 0 0}
.eve-btn{border:0;border-radius:10px;padding:11px 16px;font:inherit;font-weight:600;font-size:14px;cursor:pointer}
.eve-btn.primary{background:#C9A24B;color:#0A1F3D}
.eve-btn.ghost{background:transparent;color:#cdd9ef;border:1px solid #2c4368}
.eve-btn.danger{background:transparent;color:#f0a3a3;border:1px solid #5a2f38;padding:7px 11px;font-size:13px}
.eve-btn:disabled{opacity:.55;cursor:default}
.eve-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:20px 0 26px}
.eve-card{background:#0f2b52;border:1px solid #21406f;border-radius:14px;padding:14px 16px}
.eve-card .lbl{color:#9db2d6;font-size:12px;text-transform:uppercase;letter-spacing:.05em;margin:0 0 6px}
.eve-card .val{font-size:22px;font-weight:700;margin:0}
.eve-card.accent .val{color:#e7c877}
.eve-card.good .val{color:#7fd6a2}
.eve-card.warn .val{color:#f0b86a}
.eve-panel{background:#0f2b52;border:1px solid #21406f;border-radius:14px;padding:18px;margin-bottom:24px}
.eve-panel h2{font-size:16px;margin:0 0 14px;font-weight:600}
.eve-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr .8fr;gap:12px}
.eve-grid.note{grid-template-columns:1fr;margin-top:12px}
.eve-field label{display:block;font-size:12px;color:#9db2d6;margin:0 0 5px}
.eve-field input,.eve-field textarea{width:100%;box-sizing:border-box;background:#0a2140;border:1px solid #2c4368;border-radius:9px;color:#eaf0fb;padding:10px 11px;font:inherit;font-size:14px}
.eve-field input:focus,.eve-field textarea:focus{outline:2px solid #C9A24B;border-color:#C9A24B}
.eve-formactions{display:flex;gap:10px;margin-top:14px;align-items:center}
.eve-err{color:#f0a3a3;font-size:13px;margin:0}
.eve-tablewrap{overflow-x:auto;border:1px solid #21406f;border-radius:14px}
.eve-table{width:100%;border-collapse:collapse;font-size:14px;min-width:760px}
.eve-table th{text-align:left;color:#9db2d6;font-size:12px;text-transform:uppercase;letter-spacing:.04em;padding:12px 12px;border-bottom:1px solid #21406f;white-space:nowrap}
.eve-table td{padding:12px 12px;border-bottom:1px solid #17335c;vertical-align:top}
.eve-table tr:last-child td{border-bottom:0}
.eve-table .num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
.eve-name{font-weight:600}
.eve-date{color:#9db2d6;font-size:12px}
.eve-note{color:#b9c8e4;font-size:12px;margin-top:4px;max-width:240px;white-space:pre-wrap}
.eve-paid{display:inline-flex;align-items:center;gap:7px;cursor:pointer;font-size:13px;color:#cdd9ef}
.eve-pill{font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px}
.eve-pill.yes{background:#123c2a;color:#7fd6a2}
.eve-pill.no{background:#3a2a10;color:#f0b86a}
.eve-rowact{display:flex;gap:8px;flex-wrap:wrap}
.eve-linkbtn{background:none;border:0;color:#9db8ea;cursor:pointer;font:inherit;font-size:13px;padding:0;text-decoration:underline}
.eve-empty{padding:34px;text-align:center;color:#9db2d6}
.eve-seg{display:inline-flex;background:#0a2140;border:1px solid #2c4368;border-radius:10px;padding:3px;gap:3px}
.eve-seg button{border:0;background:transparent;color:#cdd9ef;font:inherit;font-size:13px;font-weight:600;padding:8px 14px;border-radius:8px;cursor:pointer}
.eve-seg button.on{background:#C9A24B;color:#0A1F3D}
.eve-seg button.on.spicy{background:#c85a6a;color:#fff}
.eve-tabs{display:flex;gap:8px;margin:2px 0 18px;flex-wrap:wrap}
.eve-tabs button{border:1px solid #2c4368;background:transparent;color:#cdd9ef;font:inherit;font-size:13px;font-weight:600;padding:8px 15px;border-radius:999px;cursor:pointer}
.eve-tabs button.on{background:#0f2b52;border-color:#C9A24B;color:#e7c877}
.eve-catpill{font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;text-transform:uppercase;letter-spacing:.04em}
.eve-catpill.deal{background:#132f56;color:#9db8ea}
.eve-catpill.extra{background:#3d1f28;color:#f0a3b4}
.eve-gate{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A1F3D;padding:20px}
.eve-gatebox{background:#0f2b52;border:1px solid #21406f;border-radius:16px;padding:34px;max-width:380px;width:100%;color:#eaf0fb}
@media(max-width:720px){.eve-grid{grid-template-columns:1fr 1fr}}
`;

function EveStyleTag() {
  useEffectEve(() => {
    const el = document.createElement('style');
    el.textContent = EVE_STYLES;
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, []);
  return null;
}

// ------------------------------------------------------------------ gate ----
function EveAuthGate({ onAuthed }) {
  const [password, setPassword] = useStateEve('');
  const [error, setError] = useStateEve('');
  const [checking, setChecking] = useStateEve(false);

  const submit = async (e) => {
    e.preventDefault();
    if (checking) return;
    setError('');
    setChecking(true);
    try {
      const res = await fetch('/api/eve?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json && json.ok === true) {
        onAuthed();
      } else if (res.status === 401) {
        setError('Incorrect password.');
      } else {
        setError((json && json.error) || 'Could not verify the password. Try again.');
      }
    } catch (err) {
      setError('Network error. Check your connection and try again.');
    }
    setChecking(false);
  };

  return (
    <div className="eve-gate">
      <div className="eve-gatebox">
        <BrandLogo light={true} size="sm" />
        <h1 className="eve-title" style={{ marginTop: 22, fontSize: 24 }}>Eve Split</h1>
        <p className="eve-sub" style={{ marginBottom: 20 }}>Enter the password to continue.</p>
        <form onSubmit={submit}>
          <div className="eve-field" style={{ marginBottom: 14 }}>
            <label htmlFor="eve-pw">Password</label>
            <input id="eve-pw" type="password" required autoFocus autoComplete="off"
                   value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          {error && <p className="eve-err" role="alert" style={{ marginBottom: 12 }}>{error}</p>}
          <button type="submit" className="eve-btn primary" disabled={checking}
                  style={{ width: '100%' }}>
            {checking ? 'Checking…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ------------------------------------------------------------- add / edit ---
function EveDealForm({ defaultPercent, defaultCategory, editing, onSaved, onCancel }) {
  const seed = editing
    ? {
        category: editing.category === 'extra' ? 'extra' : 'deal',
        deal_name: editing.deal_name || '',
        deal_date: editing.deal_date || '',
        entry_time: editing.entry_time || '',
        commission: editing.commission != null ? String(editing.commission) : '',
        outgoings: editing.outgoings != null ? String(editing.outgoings) : '',
        cut_percent: editing.cut_percent != null ? String(editing.cut_percent) : '',
        note: editing.note || '',
      }
    : { ...EVE_EMPTY_FORM, category: defaultCategory === 'extra' ? 'extra' : 'deal' };

  const [form, setForm] = useStateEve(seed);
  const [error, setError] = useStateEve('');
  const [saving, setSaving] = useStateEve(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const isExtra = form.category === 'extra';

  const preview = useMemoEve(() => {
    const commission = Number(form.commission) || 0;
    if (isExtra) {
      // Extra curricular: the amount entered is the full amount owed. No
      // outgoings, no split — she's owed 100% of it.
      return { net: commission, cut: commission, pct: 100 };
    }
    const outgoings = Number(form.outgoings) || 0;
    const pct = form.cut_percent === '' ? defaultPercent : (Number(form.cut_percent) || 0);
    const net = commission - outgoings;
    return { net, cut: Math.round(net * pct) / 100, pct };
  }, [isExtra, form.commission, form.outgoings, form.cut_percent, defaultPercent]);

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setError('');
    if (!form.deal_name.trim()) { setError('Enter a client or deal name.'); return; }
    setSaving(true);
    const payload = {
      category: form.category,
      deal_name: form.deal_name,
      deal_date: form.deal_date,
      entry_time: isExtra ? form.entry_time : '',
      commission: form.commission === '' ? 0 : form.commission,
      // Extra curricular is a flat "amount owed": no outgoings, owed in full.
      outgoings: isExtra ? 0 : (form.outgoings === '' ? 0 : form.outgoings),
      cut_percent: isExtra ? 100 : form.cut_percent,
      note: form.note,
    };
    try {
      const res = await fetch('/api/eve?action=commissions', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json && json.ok) {
        if (!editing) setForm({ ...EVE_EMPTY_FORM });
        onSaved();
      } else {
        setError((json && json.error) || 'Could not save. Try again.');
      }
    } catch (err) {
      setError('Network error. Try again.');
    }
    setSaving(false);
  };

  return (
    <div className="eve-panel">
      <h2>{editing ? 'Edit entry' : 'Add an entry'}</h2>
      <form onSubmit={submit}>
        <div className="eve-field" style={{ marginBottom: 14 }}>
          <label>Type</label>
          <div className="eve-seg">
            {EVE_CATEGORIES.map(c => (
              <button key={c.id} type="button"
                      className={(form.category === c.id ? 'on' : '') + (c.id === 'extra' ? ' spicy' : '')}
                      onClick={() => setForm(f => ({ ...f, category: c.id }))}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        {isExtra ? (
          <div className="eve-grid">
            <div className="eve-field">
              <label>What for</label>
              <input value={form.deal_name} onChange={set('deal_name')} autoFocus placeholder="e.g. sexting, naughty time" />
            </div>
            <div className="eve-field">
              <label>Date</label>
              <input type="date" value={form.deal_date} onChange={set('deal_date')} />
            </div>
            <div className="eve-field">
              <label>Time</label>
              <input value={form.entry_time} onChange={set('entry_time')} placeholder="e.g. 2:30pm" />
            </div>
            <div className="eve-field">
              <label>Amount owed ($)</label>
              <input type="number" min="0" step="0.01" inputMode="decimal"
                     value={form.commission} onChange={set('commission')} />
            </div>
          </div>
        ) : (
          <div className="eve-grid">
            <div className="eve-field">
              <label>Client / deal name</label>
              <input value={form.deal_name} onChange={set('deal_name')} autoFocus />
            </div>
            <div className="eve-field">
              <label>Date</label>
              <input type="date" value={form.deal_date} onChange={set('deal_date')} />
            </div>
            <div className="eve-field">
              <label>Commission ($)</label>
              <input type="number" min="0" step="0.01" inputMode="decimal"
                     value={form.commission} onChange={set('commission')} />
            </div>
            <div className="eve-field">
              <label>Outgoings ($)</label>
              <input type="number" min="0" step="0.01" inputMode="decimal"
                     value={form.outgoings} onChange={set('outgoings')} />
            </div>
            <div className="eve-field">
              <label>Eve cut (%)</label>
              <input type="number" min="0" max="100" step="0.5" inputMode="decimal"
                     placeholder={String(defaultPercent)}
                     value={form.cut_percent} onChange={set('cut_percent')} />
            </div>
          </div>
        )}
        <div className="eve-grid note">
          <div className="eve-field">
            <label>Note (optional)</label>
            <textarea rows="2" value={form.note} onChange={set('note')} />
          </div>
        </div>
        <p className="eve-sub" style={{ marginTop: 12 }}>
          {isExtra ? (
            <>Owed to Eve = <strong style={{ color: '#e7c877' }}>{eveMoney(preview.cut)}</strong></>
          ) : (
            <>Net {eveMoney(preview.net)} · Eve's cut at {preview.pct}% = <strong style={{ color: '#e7c877' }}>{eveMoney(preview.cut)}</strong></>
          )}
        </p>
        {error && <p className="eve-err" role="alert" style={{ marginTop: 8 }}>{error}</p>}
        <div className="eve-formactions">
          <button type="submit" className="eve-btn primary" disabled={saving}>
            {saving ? 'Saving…' : (editing ? 'Save changes' : 'Add entry')}
          </button>
          {editing && (
            <button type="button" className="eve-btn ghost" onClick={onCancel} disabled={saving}>Cancel</button>
          )}
        </div>
      </form>
    </div>
  );
}

// -------------------------------------------------------------- dashboard ---
function EveDashboard() {
  const [rows, setRows] = useStateEve([]);
  const [cutPercent, setCutPercent] = useStateEve(50);
  const [loading, setLoading] = useStateEve(true);
  const [error, setError] = useStateEve('');
  const [editing, setEditing] = useStateEve(null);
  const [busyId, setBusyId] = useStateEve(null);
  const [filter, setFilter] = useStateEve('all'); // all | deal | extra

  const load = useCallbackEve(async () => {
    try {
      const res = await fetch('/api/eve?action=commissions', { headers: { Accept: 'application/json' } });
      const json = await res.json().catch(() => null);
      if (res.ok && json && json.ok && json.authenticated) {
        setRows(Array.isArray(json.rows) ? json.rows : []);
        if (typeof json.cutPercent === 'number') setCutPercent(json.cutPercent);
        setError('');
      } else if (json && json.authenticated === false) {
        window.location.reload(); // session expired — drop back to the gate
      } else {
        setError((json && json.error) || 'Could not load. Refresh to try again.');
      }
    } catch (err) {
      setError('Network error. Refresh to try again.');
    }
    setLoading(false);
  }, []);

  useEffectEve(() => { load(); }, [load]);

  const visibleRows = useMemoEve(
    () => (filter === 'all' ? rows : rows.filter(r => (r.category || 'deal') === filter)),
    [rows, filter]
  );

  const counts = useMemoEve(() => {
    let deal = 0, extra = 0;
    for (const r of rows) { if ((r.category || 'deal') === 'extra') extra++; else deal++; }
    return { all: rows.length, deal, extra };
  }, [rows]);

  const totals = useMemoEve(() => {
    let commission = 0, outgoings = 0, cut = 0, paid = 0;
    for (const r of visibleRows) {
      commission += Number(r.commission) || 0;
      outgoings += Number(r.outgoings) || 0;
      const c = eveCut(r);
      cut += c;
      if (r.paid) paid += c;
    }
    return {
      commission,
      outgoings,
      net: commission - outgoings,
      cut,
      paid,
      outstanding: cut - paid,
    };
  }, [visibleRows]);

  const togglePaid = async (row) => {
    setBusyId(row.id);
    try {
      await fetch('/api/eve?action=commissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, paid: !row.paid }),
      });
      await load();
    } catch (err) { /* load() surfaces persistent errors */ }
    setBusyId(null);
  };

  const remove = async (row) => {
    if (!window.confirm(`Delete "${row.deal_name}"? This can't be undone.`)) return;
    setBusyId(row.id);
    try {
      await fetch('/api/eve?action=commissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id }),
      });
      await load();
    } catch (err) { /* load() surfaces persistent errors */ }
    setBusyId(null);
  };

  const logout = async () => {
    try { await fetch('/api/eve?action=logout', { method: 'POST' }); } catch (err) { /* ignore */ }
    window.location.reload();
  };

  const onSaved = () => { setEditing(null); load(); };

  return (
    <div className="eve-wrap">
      <div className="eve-inner">
        <div className="eve-top">
          <div>
            <h1 className="eve-title">Eve Split</h1>
            <p className="eve-sub">Eve's share of the deals · default split {cutPercent}%</p>
          </div>
          <button className="eve-btn ghost" onClick={logout}>Sign out</button>
        </div>

        <div className="eve-tabs">
          <button className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>
            All · {counts.all}
          </button>
          <button className={filter === 'deal' ? 'on' : ''} onClick={() => setFilter('deal')}>
            Deals · {counts.deal}
          </button>
          <button className={filter === 'extra' ? 'on' : ''} onClick={() => setFilter('extra')}>
            Extra curricular · {counts.extra}
          </button>
        </div>

        <div className="eve-cards">
          {filter !== 'extra' && (
            <>
              <div className="eve-card"><p className="lbl">Commission</p><p className="val">{eveMoney(totals.commission)}</p></div>
              <div className="eve-card"><p className="lbl">Outgoings</p><p className="val">{eveMoney(totals.outgoings)}</p></div>
              <div className="eve-card"><p className="lbl">Net</p><p className="val">{eveMoney(totals.net)}</p></div>
            </>
          )}
          <div className="eve-card accent"><p className="lbl">{filter === 'extra' ? 'Owed' : "Eve's cut"}</p><p className="val">{eveMoney(totals.cut)}</p></div>
          <div className="eve-card good"><p className="lbl">Paid to Eve</p><p className="val">{eveMoney(totals.paid)}</p></div>
          <div className="eve-card warn"><p className="lbl">Outstanding</p><p className="val">{eveMoney(totals.outstanding)}</p></div>
        </div>

        {!editing && (
          <EveDealForm defaultPercent={cutPercent} defaultCategory={filter === 'extra' ? 'extra' : 'deal'}
                       editing={null} onSaved={onSaved} onCancel={() => {}} />
        )}
        {editing && (
          <EveDealForm defaultPercent={cutPercent} defaultCategory={null}
                       editing={editing} onSaved={onSaved} onCancel={() => setEditing(null)} />
        )}

        {error && <p className="eve-err" style={{ marginBottom: 14 }}>{error}</p>}

        <div className="eve-tablewrap">
          {loading ? (
            <div className="eve-empty">Loading…</div>
          ) : visibleRows.length === 0 ? (
            <div className="eve-empty">
              {rows.length === 0
                ? 'Nothing here yet. Add your first entry above.'
                : (filter === 'extra' ? 'No extra curricular entries yet.' : 'No entries in this tab.')}
            </div>
          ) : (
            <table className="eve-table">
              <thead>
                <tr>
                  <th>Deal</th>
                  <th className="num">Commission</th>
                  <th className="num">Outgoings</th>
                  <th className="num">Net</th>
                  <th className="num">Cut %</th>
                  <th className="num">Eve's cut</th>
                  <th>Paid</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map(row => (
                  <tr key={row.id}>
                    <td>
                      <div className="eve-name">
                        {row.deal_name}
                        {(row.category || 'deal') === 'extra' && (
                          <span className="eve-catpill extra" style={{ marginLeft: 8 }}>Extra</span>
                        )}
                      </div>
                      {(row.deal_date || row.entry_time) && (
                        <div className="eve-date">{[row.deal_date, row.entry_time].filter(Boolean).join(' · ')}</div>
                      )}
                      {row.note && <div className="eve-note">{row.note}</div>}
                    </td>
                    <td className="num">{eveMoney(row.commission)}</td>
                    <td className="num">{eveMoney(row.outgoings)}</td>
                    <td className="num">{eveMoney(eveNet(row))}</td>
                    <td className="num">{Number(row.cut_percent)}%</td>
                    <td className="num" style={{ color: '#e7c877', fontWeight: 700 }}>{eveMoney(eveCut(row))}</td>
                    <td>
                      <button className="eve-paid" onClick={() => togglePaid(row)} disabled={busyId === row.id}
                              title="Toggle paid">
                        <span className={`eve-pill ${row.paid ? 'yes' : 'no'}`}>{row.paid ? 'Paid' : 'Unpaid'}</span>
                      </button>
                    </td>
                    <td>
                      <div className="eve-rowact">
                        <button className="eve-linkbtn" onClick={() => setEditing(row)} disabled={busyId === row.id}>Edit</button>
                        <button className="eve-btn danger" onClick={() => remove(row)} disabled={busyId === row.id}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ page ----
function EveTrackerPage() {
  useEveNoIndex();
  const [authed, setAuthed] = useStateEve(null); // null = checking, false = gate, true = in

  useEffectEve(() => {
    let live = true;
    fetch('/api/eve?action=commissions', { headers: { Accept: 'application/json' } })
      .then(r => r.json())
      .then(json => { if (live) setAuthed(Boolean(json && json.authenticated)); })
      .catch(() => { if (live) setAuthed(false); });
    return () => { live = false; };
  }, []);

  return (
    <>
      <EveStyleTag />
      {authed === null && <div className="eve-gate"><p className="eve-sub">Loading…</p></div>}
      {authed === false && <EveAuthGate onAuthed={() => setAuthed(true)} />}
      {authed === true && <EveDashboard />}
    </>
  );
}
