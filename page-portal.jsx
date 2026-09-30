/* global React */
// =============================================================
// Referral Partner Portal — the real one, at /portal/:slug
//
// This is the product. The pages at /portal-demo and
// /portal-demo/ready-finance are the sales prototypes: invented data, no
// API, no login. Everything here is live — Supabase behind /api/portal/*,
// a signed HttpOnly session cookie, and real client information on screen.
//
// Three roles, decided by the password (see api/_portal-config.js):
//
//   owner    Buyer Assist. Read/write on any portal. The support login.
//   staff    The brokerage running the portal. Read/write on their board.
//   partner  A referral firm. READ ONLY, and they only ever receive the
//            deals they referred — the server runs a different query for
//            them, it does not send the whole board and hide rows here.
//
// Nothing in this file decides what a partner can see. If a row is not in
// the response it is because Postgres did not return it.
//
// Branding, stage list and field labels all come from the portal_orgs row,
// so a second brokerage is a database row and a set of env vars, not a
// second copy of this page.
//
// Reuses the .deal-* / .board-* / .bp-* / .pd-* / .rf-* styles that the
// dealer board and the demos already ship. Only the genuinely new pieces
// get .pt-* rules, at the end of styles.css.
// =============================================================
const {
  useState: useStatePortal,
  useEffect: useEffectPortal,
  useMemo: useMemoPortal,
  useCallback: useCallbackPortal,
  useRef: useRefPortal,
} = React;

// Poll interval. The whole promise of the portal is that a referrer stops
// ringing to ask where their buyer is up to, which only holds if the board
// moves on its own.
const PORTAL_REFRESH_MS = 60 * 1000;

// ---- helpers ------------------------------------------------------------

function portalWhen(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
    .replace(/\s*(am|pm)$/i, (m) => m.toUpperCase());
  return `${date}, ${time}`;
}

// Colour is never the only signal: the written stage is always rendered next
// to it. Tone is derived from the words so a firm can add a stage without
// anyone editing a lookup table.
function portalTone(stage) {
  const s = String(stage || '').toLowerCase();
  if (/declin|fell through|withdrawn|cancel|unable/.test(s)) return 'bad';
  if (/settled|unconditional/.test(s)) return 'done';
  if (/approved|formal approval|property found/.test(s)) return 'good';
  if (/required|waiting|hold|verif|requested|chasing/.test(s)) return 'attention';
  if (/^new /.test(s)) return 'new';
  return 'progress';
}

function portalTel(mobile) {
  const cleaned = String(mobile || '').replace(/[^\d+]/g, '');
  return cleaned ? `tel:${cleaned}` : null;
}

// The whole API is one serverless function taking ?action=… rather than five
// routes: Vercel's Hobby plan caps a deployment at 12 Serverless Functions and
// this project was already at exactly 12. The handlers are unchanged, in
// api/_portal-routes/ — see the header of api/portal.js.
//
// Every URL is built here so that stays in one place. If the portal ever moves
// back to real paths, this function is the only thing that changes.
function portalUrl(action, params) {
  const q = new URLSearchParams({ action });
  for (const [k, v] of Object.entries(params || {})) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
  }
  return `/api/portal?${q.toString()}`;
}

async function portalFetch(url, options) {
  const res = await fetch(url, {
    credentials: 'same-origin', // send the HttpOnly session cookie
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json().catch(() => null);
  return { res, json };
}

// Swaps the sitewide <meta name="robots"> to noindex while this page is
// mounted, and restores it on unmount. A portal full of client information
// must never be indexed, and vercel.json sends the header as well — this is
// the belt to that pair of braces.
function usePortalNoIndex() {
  useEffectPortal(() => {
    const meta = document.querySelector('meta[name="robots"]');
    const prev = meta ? meta.getAttribute('content') : null;
    if (meta) meta.setAttribute('content', 'noindex, nofollow');
    return () => { if (meta && prev != null) meta.setAttribute('content', prev); };
  }, []);
}

// The tile beside a partner's name. Drawn from the firm's own accent colour
// with its initials, so a new partner needs no asset and nothing to 404.
function PortalPartnerMark({ partner, size = 30 }) {
  if (!partner) return null;
  const initials = String(partner.name || '')
    .split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  return (
    <span
      className="rf-agency-tile pt-mark"
      style={{ background: partner.accent || '#2C4A6E', width: size, height: size, flexBasis: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

// ---- login --------------------------------------------------------------
//
// One field, no email box. There is nothing behind an email address yet: the
// account model is a password per person for the brokerage and an access code
// per referral partner. An email box that ignores what is typed into it is
// worse than not having one.
//
// The screen never names a referral partner. Who a broker's referrers are is
// commercially sensitive, and a picker would publish that list to anyone who
// opened the page. What is typed decides which board loads.

function PortalLogin({ org, slug, onSignedIn }) {
  const [password, setPassword] = useStatePortal('');
  const [error, setError] = useStatePortal('');
  const [busy, setBusy] = useStatePortal(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const { res, json } = await portalFetch(portalUrl('login'), {
        method: 'POST',
        body: JSON.stringify({ org: slug, password }),
      });
      if (res.ok && json && json.ok) {
        onSignedIn();
      } else {
        setError((json && json.error) || 'Could not sign you in. Please try again.');
      }
    } catch (err) {
      setError('Network error. Check your connection and try again.');
    }
    setBusy(false);
  };

  const name = (org && org.name) || 'Referral Partner Portal';

  return (
    <div className="rf-login-wrap">
      <div className="rf-login-card">
        {org && org.logo
          ? <img src={org.logo} alt={name} className="rf-login-logo" />
          : <h2 className="rf-login-brandname">{name}</h2>}

        <h1 className="rf-login-title">Partner login</h1>
        <p className="rf-login-sub">
          Track the deals you have referred to {(org && org.shortName) || name}.
        </p>

        <form className="rf-login-form" onSubmit={submit} noValidate>
          {/* One field for two kinds of credential: the brokerage's own staff
              have a password, a referral partner has an access code. Naming both
              is friendlier than a picker, and the server works out which it
              is without the browser having to say. */}
          <label className="deal-label" htmlFor="pt-login-pw">Password or access code</label>
          <input
            id="pt-login-pw"
            className="rf-login-input"
            type="password"
            required
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p role="alert" className="deal-error">{error}</p>}

          <button type="submit" className="rf-login-btn" disabled={busy} style={{ opacity: busy ? 0.6 : 1 }}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="rf-login-foot">
          This portal contains confidential customer information. Your password is
          personal to you: do not share it, and tell us straight away if you think
          someone else has it.
        </p>
      </div>
      {org && org.domainLabel && <p className="rf-login-url">{org.domainLabel}</p>}
    </div>
  );
}

// ---- add / edit a deal --------------------------------------------------

const PORTAL_EMPTY_FORM = {
  subject: '',
  subject_details: '',
  customer_name: '',
  customer_mobile: '',
  customer_email: '',
  partner: '',
  status: '',
  initial_note: '',
};

function portalFormFromDeal(deal, partners) {
  if (!deal) return PORTAL_EMPTY_FORM;
  const partner = partners.find((p) => p.id === deal.partner_id);
  return {
    subject: deal.subject || '',
    subject_details: (deal.subject_details || []).join('\n'),
    customer_name: deal.customer_name || '',
    customer_mobile: deal.customer_mobile || '',
    customer_email: deal.customer_email || '',
    partner: partner ? partner.slug : '',
    status: deal.status || '',
    initial_note: '',
  };
}

function PortalDealForm({ deal, org, partners, onClose, onSaved }) {
  const isEdit = Boolean(deal);
  const [form, setForm] = useStatePortal(() => portalFormFromDeal(deal, partners));
  const [error, setError] = useStatePortal('');
  const [busy, setBusy] = useStatePortal(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const body = {
        subject: form.subject,
        subject_details: form.subject_details,
        customer_name: form.customer_name,
        customer_mobile: form.customer_mobile,
        customer_email: form.customer_email,
        partner: form.partner,
        status: form.status || (org.stages || [])[0] || '',
      };
      if (isEdit) body.id = deal.id;
      else if (form.initial_note.trim()) body.initial_note = form.initial_note.trim();

      const { res, json } = await portalFetch(portalUrl('deals'), {
        method: isEdit ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      if (res.ok && json && json.ok) {
        onSaved();
      } else {
        setError((json && json.error) || 'That could not be saved.');
      }
    } catch (err) {
      setError('Network error. Check your connection and try again.');
    }
    setBusy(false);
  };

  return (
    <div className="deal-modal-backdrop" role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit deal' : 'Add a referral'}>
      <div className="deal-modal">
        <div className="deal-modal-head">
          <h2 className="h3">{isEdit ? 'Edit deal' : 'Add a referral'}</h2>
          <button type="button" className="deal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form className="bp-form" onSubmit={submit} noValidate>
          <div className="bp-field">
            <label htmlFor="pt-subject">{org.itemLabel || 'Deal'}</label>
            <input id="pt-subject" type="text" required autoFocus value={form.subject}
                   onChange={set('subject')} placeholder="First home buyer · Wynnum West" />
          </div>

          <div className="bp-field">
            <label htmlFor="pt-details">Details</label>
            <textarea id="pt-details" rows={3} value={form.subject_details}
                      onChange={set('subject_details')}
                      placeholder={'$720,000 budget\n5% deposit, FHG'} />
            <p className="deal-hint">
              One per line, up to four. Shown as the small print under the headline.
            </p>
          </div>

          <div className="bp-row">
            <div className="bp-field">
              <label htmlFor="pt-customer">{org.customerLabel || 'Customer'}</label>
              <input id="pt-customer" type="text" required value={form.customer_name}
                     onChange={set('customer_name')} />
            </div>
            <div className="bp-field">
              <label htmlFor="pt-mobile">Mobile</label>
              <input id="pt-mobile" type="tel" inputMode="tel" autoComplete="tel"
                     value={form.customer_mobile} onChange={set('customer_mobile')} />
            </div>
          </div>

          <div className="bp-row">
            <div className="bp-field">
              <label htmlFor="pt-email">Email</label>
              <input id="pt-email" type="email" value={form.customer_email} onChange={set('customer_email')} />
            </div>
            <div className="bp-field">
              <label htmlFor="pt-stage">Stage</label>
              <select id="pt-stage" className="cr-select" value={form.status || (org.stages || [])[0] || ''}
                      onChange={set('status')}>
                {(org.stages || []).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <p className="deal-hint">A mobile or an email is required, either one will do.</p>

          <div className="bp-field">
            <label htmlFor="pt-partner">Referred by</label>
            <select id="pt-partner" className="cr-select" value={form.partner} onChange={set('partner')}>
              <option value="">Not attributed yet</option>
              {partners.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
            </select>
            <p className="deal-hint">
              This decides who can see the deal. Leave it unattributed and it stays on
              your board only.
            </p>
          </div>

          {!isEdit && (
            <div className="bp-field">
              <label htmlFor="pt-first-note">Opening note</label>
              <textarea id="pt-first-note" rows={2} value={form.initial_note}
                        onChange={set('initial_note')}
                        placeholder="Referral received. Calling this morning." />
              <p className="deal-hint">Optional, and visible to the referring partner.</p>
            </div>
          )}

          {error && <p role="alert" className="deal-error">{error}</p>}

          <div className="deal-form-actions">
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={busy} style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Saving…' : (isEdit ? 'Save changes' : 'Add to the board')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- one row ------------------------------------------------------------

// Who wrote a note, from the point of view of whoever is reading it. Staff
// need to know a message came from the referral partner; the partner needs to
// recognise their own.
function portalAuthorTag(note, canWrite) {
  if (!note || note.author_role !== 'partner') return null;
  return canWrite ? 'From referrer' : 'Your team';
}

function PortalRow({ deal, org, partners, canWrite, canMessage, open, onToggle, onStage, onNote, onEdit, onArchive }) {
  const [noteText, setNoteText] = useStatePortal('');
  const [internal, setInternal] = useStatePortal(false);
  const [busy, setBusy] = useStatePortal(false);
  const [rowError, setRowError] = useStatePortal('');

  const tone = portalTone(deal.status);
  const notes = deal.portal_deal_notes || [];
  const latest = notes[0];
  const partner = partners.find((p) => p.id === deal.partner_id) || null;
  const details = deal.subject_details || [];
  const latestTag = portalAuthorTag(latest, canWrite);

  // Staff get the internal toggle; a referring firm posts a message that is,
  // by definition, one they can see. The server forces that regardless.
  const canPost = canWrite || canMessage;

  const submitNote = async (e) => {
    e.preventDefault();
    const text = noteText.trim();
    if (!text || busy) return;
    setBusy(true);
    setRowError('');
    const ok = await onNote(deal.id, text, (canWrite && internal) ? 'internal' : 'all');
    if (ok) { setNoteText(''); setInternal(false); }
    else setRowError(canWrite ? 'That note could not be saved.' : 'That message could not be sent.');
    setBusy(false);
  };

  return (
    <React.Fragment>
      <tr className={`board-row${open ? ' is-open' : ''}`}>
        <td className="board-cell board-cell-vehicle" data-label={org.itemLabel}>
          <button type="button" className="board-vehicle-btn" aria-expanded={open} onClick={onToggle}>
            <span className="board-caret" aria-hidden="true">{open ? '▾' : '▸'}</span>
            <span className="board-vehicle">{deal.subject}</span>
          </button>
          {details.length > 0 && (
            <span className="board-vehicle-sub">
              {details.map((s, i) => <span key={i}>{s}</span>)}
            </span>
          )}
          {deal.archived && <span className="deal-badge tone-archived">Archived</span>}
        </td>

        <td className="board-cell board-cell-name" data-label={org.customerLabel}>{deal.customer_name}</td>

        <td className="board-cell board-cell-phone" data-label="Phone">
          {deal.customer_mobile
            ? <a href={portalTel(deal.customer_mobile)}>{deal.customer_mobile}</a>
            : <span className="board-blank">—</span>}
        </td>

        <td className="board-cell board-cell-note" data-label="Latest note">
          {latest ? (
            <React.Fragment>
              {latestTag && <span className="pt-note-tag pt-note-tag-partner">{latestTag}</span>}
              <span className="board-note-text">{latest.note}</span>
              <span className="board-note-when">
                {portalWhen(latest.created_at)}{latest.created_by ? ` · ${latest.created_by}` : ''}
                {latest.visibility === 'internal' ? ' · internal' : ''}
              </span>
            </React.Fragment>
          ) : <span className="board-blank">No notes yet</span>}
        </td>

        {/* Staff drive the board from here; a partner reads it. The server
            rejects a write from a partner session regardless of what this
            renders — see requirePortalWriter. */}
        <td className="board-cell board-cell-status" data-label="Status">
          {canWrite ? (
            <select className={`board-status-select tone-${tone}`} value={deal.status}
                    aria-label={`Stage for ${deal.subject}`}
                    onChange={(e) => onStage(deal.id, e.target.value)}>
              {(org.stages || []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <span className={`deal-badge tone-${tone}`}>{deal.status}</span>
          )}
        </td>
      </tr>

      {open && (
        <tr className="board-detail-row">
          <td className="board-detail-cell" colSpan={5}>
            <div className="board-detail">
              <div className="board-detail-facts">
                <p className="deal-updated">Last updated: {portalWhen(deal.updated_at)}</p>
                {deal.customer_email && <p className="deal-updated">Email: {deal.customer_email}</p>}
                {canWrite && (
                  <p className="deal-updated rf-referred">
                    Referred by:
                    {partner
                      ? <React.Fragment>
                          <PortalPartnerMark partner={partner} size={22} />
                          <span className="rf-referred-name">{partner.name}</span>
                        </React.Fragment>
                      : <span className="rf-referred-name">Not attributed</span>}
                  </p>
                )}
              </div>

              {notes.length ? (
                <ol className="deal-history">
                  {notes.map((n) => {
                    const tag = portalAuthorTag(n, canWrite);
                    return (
                      <li key={n.id} className={[
                        n.visibility === 'internal' ? 'pt-note-internal' : '',
                        n.author_role === 'partner' ? 'pt-note-frompartner' : '',
                      ].filter(Boolean).join(' ') || undefined}>
                        <p className="deal-note-when">
                          {portalWhen(n.created_at)}
                          {n.visibility === 'internal' && <span className="pt-note-tag">Internal</span>}
                          {tag && <span className="pt-note-tag pt-note-tag-partner">{tag}</span>}
                        </p>
                        <p className="deal-note-text">{n.note}</p>
                        {n.created_by && <p className="deal-note-who">by {n.created_by}</p>}
                      </li>
                    );
                  })}
                </ol>
              ) : <p className="deal-note-empty">Nothing logged on this one yet.</p>}

              {rowError && <p role="alert" className="deal-error">{rowError}</p>}

              {/* A referral partner gets the message box and nothing else. The
                  stage dropdown, the edit button and archiving are all staff
                  only, and the server refuses each of them from a partner
                  session regardless of what renders here. */}
              {canPost && (
                <div className="deal-staff-tools">
                  <form onSubmit={submitNote} className="deal-note-form">
                    <label htmlFor={`pt-note-${deal.id}`} className="deal-label">
                      {canWrite ? 'Add an update' : `Message ${org.shortName || org.name}`}
                    </label>
                    <textarea id={`pt-note-${deal.id}`} rows={2} value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder={canWrite
                                ? 'Valuation came back at contract…'
                                : 'Any news on the valuation? Settlement is booked for the 29th.'} />

                    {canWrite ? (
                      <label className="pt-internal-toggle">
                        <input type="checkbox" checked={internal}
                               onChange={(e) => setInternal(e.target.checked)} />
                        Keep this one internal — the referring partner will not see it
                      </label>
                    ) : (
                      <p className="deal-hint">
                        Goes straight onto this deal for the {org.shortName || org.name} team,
                        and stays on your board so you can see what you asked.
                      </p>
                    )}

                    <button type="submit" className="btn primary deal-btn-sm" disabled={busy || !noteText.trim()}>
                      {busy ? 'Sending…' : (canWrite ? 'Add note' : 'Send message')}
                    </button>
                  </form>

                  {canWrite && (
                    <div className="deal-staff-row">
                      <button type="button" className="btn ghost deal-btn-sm" onClick={() => onEdit(deal)}>
                        Edit details
                      </button>
                      <button type="button" className="btn ghost deal-btn-sm" onClick={() => onArchive(deal)}>
                        {deal.archived ? 'Restore to the board' : 'Remove from the board'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

// ---- one stage group ----------------------------------------------------

function PortalGroup({ stage, deals, org, collapsed, onToggleGroup, openIds, onToggleRow, ...rowProps }) {
  const tone = portalTone(stage);
  const headingId = `pt-group-${stage.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <section className="board-group" aria-labelledby={headingId}>
      <h2 className={`board-group-head tone-${tone}`}>
        <button type="button" className="board-group-btn" id={headingId}
                aria-expanded={!collapsed} onClick={() => onToggleGroup(stage)}>
          <span className="board-caret" aria-hidden="true">{collapsed ? '▸' : '▾'}</span>
          <span className="board-group-name">{stage}</span>
          <span className="board-group-count">{deals.length}</span>
        </button>
      </h2>

      {!collapsed && (
        <div className="board-table-wrap">
          <table className="board-table">
            <thead>
              <tr>
                <th scope="col" className="board-cell-vehicle">{org.itemLabel}</th>
                <th scope="col" className="board-cell-name">{org.customerLabel}</th>
                <th scope="col" className="board-cell-phone">Phone</th>
                <th scope="col" className="board-cell-note">Latest note</th>
                <th scope="col" className="board-cell-status">Status</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((d) => (
                <PortalRow key={d.id} deal={d} org={org} {...rowProps}
                           open={openIds.has(d.id)} onToggle={() => onToggleRow(d.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ---- referral partners: the brokerage runs its own list -----------------
//
// Staff only. The panel never renders for a partner session, and the
// endpoint behind it refuses one outright — a referral firm learning who
// else refers to this broker is the most commercially damaging thing this
// product could leak.
//
// The access code is generated by the server and readable exactly once, in
// PortalCodeReveal below. There is no "show me it again": a lost code is
// replaced, which is the same action as revoking one.

// Matches PARTNER_ACCENTS in api/_portal-db.js, which is what a new firm
// gets when nothing is chosen here.
const PORTAL_ACCENT_CHOICES = ['#0e6e6e', '#2f6b4f', '#6b3a5b', '#2c4a6e', '#8a5a2b', '#3f4c8c'];

function PortalCodeReveal({ org, partner, code, onClose }) {
  const [copied, setCopied] = useStatePortal('');

  const origin = (typeof window !== 'undefined' && window.location && window.location.origin) || '';
  const url = `${origin}/portal/${org.slug}`;
  const who = partner.contactName || 'there';

  // Ready to paste into an email. Plain wording on purpose: it is going to
  // someone's conveyancer, not into a marketing channel.
  const message = [
    `Hi ${who},`,
    '',
    `You now have access to the ${org.name} referral portal. You can see where every`,
    'buyer you send us is up to, and message us on any of them without picking up',
    'the phone.',
    '',
    `Portal:      ${url}`,
    `Access code: ${code}`,
    '',
    `The code is for ${partner.name} only. Please keep it inside your office, and tell`,
    'us straight away if you think someone else has it.',
  ].join('\n');

  const copy = async (what, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
    } catch (err) {
      setCopied('failed');
    }
  };

  return (
    <div className="deal-modal-backdrop" role="dialog" aria-modal="true" aria-label="Access code">
      <div className="deal-modal">
        <div className="deal-modal-head">
          <h2 className="h3">{partner.name}</h2>
          <button type="button" className="deal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="pt-code-body">
          <p className="pt-code-label">Access code</p>
          <p className="pt-code">{code}</p>

          <p className="deal-hint pt-code-warn">
            This is the only time this code is shown. It is stored as a one-way hash,
            so nobody can look it up later, not even us. If it goes missing, issue a
            new one — that also switches the old one off.
          </p>

          <div className="deal-staff-row">
            <button type="button" className="btn primary deal-btn-sm" onClick={() => copy('code', code)}>
              {copied === 'code' ? 'Copied' : 'Copy code'}
            </button>
            <button type="button" className="btn ghost deal-btn-sm" onClick={() => copy('message', message)}>
              {copied === 'message' ? 'Copied' : 'Copy the whole message'}
            </button>
          </div>

          {copied === 'failed' && (
            <p role="alert" className="deal-error">
              Your browser blocked the copy. Select the text below and copy it by hand.
            </p>
          )}

          <label className="deal-label pt-code-msg-label" htmlFor="pt-code-msg">Send them this</label>
          <textarea id="pt-code-msg" className="pt-code-msg" rows={12} readOnly value={message} />
        </div>

        <div className="deal-form-actions">
          <button type="button" className="btn primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

const PORTAL_EMPTY_PARTNER = { name: '', kind: '', contact_name: '', contact_email: '', accent: '' };

function PortalPartnerForm({ partner, onClose, onSaved }) {
  const isEdit = Boolean(partner);
  const [form, setForm] = useStatePortal(() => (partner ? {
    name: partner.name || '',
    kind: partner.kind || '',
    contact_name: partner.contactName || '',
    contact_email: partner.contactEmail || '',
    accent: partner.accent || '',
  } : PORTAL_EMPTY_PARTNER));
  const [error, setError] = useStatePortal('');
  const [busy, setBusy] = useStatePortal(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const body = { ...form };
      if (isEdit) body.id = partner.id;
      const { res, json } = await portalFetch(portalUrl('partners'), {
        method: isEdit ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      });
      if (res.ok && json && json.ok) {
        // A create hands back the one and only readable copy of the code.
        onSaved(json.partner, json.code || null);
      } else {
        setError((json && json.error) || 'That could not be saved.');
      }
    } catch (err) {
      setError('Network error. Check your connection and try again.');
    }
    setBusy(false);
  };

  return (
    <div className="deal-modal-backdrop" role="dialog" aria-modal="true"
         aria-label={isEdit ? 'Edit referral partner' : 'Add a referral partner'}>
      <div className="deal-modal">
        <div className="deal-modal-head">
          <h2 className="h3">{isEdit ? 'Edit referral partner' : 'Add a referral partner'}</h2>
          <button type="button" className="deal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form className="bp-form" onSubmit={submit} noValidate>
          <div className="bp-field">
            <label htmlFor="pt-p-name">Referral partner</label>
            <input id="pt-p-name" type="text" required autoFocus value={form.name}
                   onChange={set('name')} placeholder="Coastline Property Group" />
          </div>

          <div className="bp-row">
            <div className="bp-field">
              <label htmlFor="pt-p-kind">What they do</label>
              <input id="pt-p-kind" type="text" value={form.kind} onChange={set('kind')}
                     placeholder="Real estate agency" />
            </div>
            <div className="bp-field">
              <label htmlFor="pt-p-contact">Main contact</label>
              <input id="pt-p-contact" type="text" value={form.contact_name}
                     onChange={set('contact_name')} placeholder="Elise" />
            </div>
          </div>

          <div className="bp-field">
            <label htmlFor="pt-p-email">Their email</label>
            <input id="pt-p-email" type="email" value={form.contact_email}
                   onChange={set('contact_email')} placeholder="elise@example.com.au" />
            <p className="deal-hint">
              For your own records only. Nothing is emailed from here yet, so you send
              them the access code yourself.
            </p>
          </div>

          <div className="bp-field">
            <label htmlFor="pt-p-accent">Colour</label>
            <div className="pt-swatches" id="pt-p-accent" role="radiogroup" aria-label="Colour">
              {PORTAL_ACCENT_CHOICES.map((c) => (
                <button key={c} type="button" role="radio" aria-checked={form.accent === c}
                        aria-label={`Colour ${c}`}
                        className={`pt-swatch${form.accent === c ? ' is-on' : ''}`}
                        style={{ background: c }}
                        onClick={() => setForm((f) => ({ ...f, accent: c }))} />
              ))}
            </div>
            <p className="deal-hint">Used for their initials tile on the board. Optional.</p>
          </div>

          {error && <p role="alert" className="deal-error">{error}</p>}

          <div className="deal-form-actions">
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={busy} style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Saving…' : (isEdit ? 'Save changes' : 'Add and issue a code')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PortalPartnersPanel({ org, onClose, onChanged }) {
  const [rows, setRows] = useStatePortal([]);
  const [loading, setLoading] = useStatePortal(true);
  const [error, setError] = useStatePortal('');
  const [formFor, setFormFor] = useStatePortal(null); // null | 'new' | partner
  const [reveal, setReveal] = useStatePortal(null);   // { partner, code }
  const [busyId, setBusyId] = useStatePortal('');

  const load = useCallbackPortal(async () => {
    const { res, json } = await portalFetch(portalUrl('partners'));
    if (res.ok && json && json.ok) {
      setRows(json.partners || []);
      setError('');
    } else {
      setError((json && json.error) || 'Could not load your referral partners.');
    }
    setLoading(false);
  }, []);

  useEffectPortal(() => { load().catch(() => setLoading(false)); }, [load]);

  // Any change here alters the "Referred by" dropdown on the deal form, so
  // the board's own copy of the partner list has to be refreshed too.
  const afterChange = async () => {
    await load().catch(() => {});
    if (onChanged) await onChanged();
  };

  const patch = async (partner, body, label) => {
    setBusyId(partner.id);
    setError('');
    const { res, json } = await portalFetch(portalUrl('partners'), {
      method: 'PATCH',
      body: JSON.stringify({ id: partner.id, ...body }),
    });
    if (res.ok && json && json.ok) {
      if (json.code) setReveal({ partner: json.partner, code: json.code });
      await afterChange();
    } else {
      setError((json && json.error) || `${label} did not work.`);
    }
    setBusyId('');
  };

  const remove = async (partner) => {
    const warning = `Remove ${partner.name} from this portal?\n\n`
      + 'Their access code stops working straight away. This cannot be undone.';
    if (!window.confirm(warning)) return;

    setBusyId(partner.id);
    setError('');
    const { res, json } = await portalFetch(portalUrl('partners', { id: partner.id }), { method: 'DELETE' });
    if (res.ok && json && json.ok) await afterChange();
    else setError((json && json.error) || 'That referral partner could not be removed.');
    setBusyId('');
  };

  return (
    <React.Fragment>
      <div className="deal-modal-backdrop" role="dialog" aria-modal="true" aria-label="Referral partners">
        <div className="deal-modal pt-panel">
          <div className="deal-modal-head">
            <h2 className="h3">Referral partners</h2>
            <button type="button" className="deal-close" onClick={onClose} aria-label="Close">×</button>
          </div>

          <div className="pt-panel-body">
            <p className="pt-panel-intro">
              Every referral partner here gets their own sign-in and sees only the buyers
              they referred. Add one and you get a code to send them.
            </p>

            {error && <p role="alert" className="deal-error deal-error-block">{error}</p>}

            {loading ? (
              <p className="deal-booting">Loading…</p>
            ) : rows.length === 0 ? (
              <p className="deal-empty">No referral partners yet. Add the first one below.</p>
            ) : (
              <ul className="pt-partner-list">
                {rows.map((p) => (
                  <li key={p.id} className={`pt-partner${p.active ? '' : ' is-off'}`}>
                    <div className="pt-partner-head">
                      <PortalPartnerMark partner={p} size={34} />
                      <div className="pt-partner-id">
                        <span className="pt-partner-name">{p.name}</span>
                        <span className="pt-partner-meta">
                          {[
                            p.kind,
                            p.contactName,
                            `${p.dealCount} ${p.dealCount === 1 ? 'referral' : 'referrals'}`,
                            p.active ? null : 'switched off',
                            p.hasCode ? null : 'no code issued',
                          ].filter(Boolean).join(' · ')}
                        </span>
                      </div>
                    </div>

                    <div className="pt-partner-actions">
                      <button type="button" className="btn ghost deal-btn-sm"
                              disabled={busyId === p.id} onClick={() => setFormFor(p)}>
                        Edit
                      </button>
                      <button type="button" className="btn ghost deal-btn-sm"
                              disabled={busyId === p.id}
                              onClick={() => patch(p, { regenerate: true }, 'Issuing a new code')}>
                        {p.hasCode ? 'New code' : 'Issue a code'}
                      </button>
                      <button type="button" className="btn ghost deal-btn-sm"
                              disabled={busyId === p.id}
                              onClick={() => patch(p, { active: !p.active }, 'That change')}>
                        {p.active ? 'Switch off' : 'Switch on'}
                      </button>
                      {/* Deleting a referral partner with deals would unattribute every
                          one of them, so the endpoint refuses it. Offering the
                          button anyway would just be a trap. */}
                      {p.dealCount === 0 && (
                        <button type="button" className="btn ghost deal-btn-sm pt-danger"
                                disabled={busyId === p.id} onClick={() => remove(p)}>
                          Remove
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="deal-form-actions">
            <button type="button" className="btn ghost" onClick={onClose}>Close</button>
            <button type="button" className="btn primary" onClick={() => setFormFor('new')}>
              Add a referral partner
            </button>
          </div>
        </div>
      </div>

      {formFor !== null && (
        <PortalPartnerForm
          partner={formFor === 'new' ? null : formFor}
          onClose={() => setFormFor(null)}
          onSaved={async (partner, code) => {
            setFormFor(null);
            if (code) setReveal({ partner, code });
            await afterChange();
          }}
        />
      )}

      {reveal && (
        <PortalCodeReveal
          org={org}
          partner={reveal.partner}
          code={reveal.code}
          onClose={() => setReveal(null)}
        />
      )}
    </React.Fragment>
  );
}

// ---- page ---------------------------------------------------------------

function PortalPage({ slug }) {
  usePortalNoIndex();

  const [booting, setBooting] = useStatePortal(true);
  const [session, setSession] = useStatePortal(null);
  const [org, setOrg] = useStatePortal(null);
  const [partners, setPartners] = useStatePortal([]);
  const [deals, setDeals] = useStatePortal([]);
  const [loadError, setLoadError] = useStatePortal('');
  const [query, setQuery] = useStatePortal('');
  const [partnerFilter, setPartnerFilter] = useStatePortal('all');
  const [showArchived, setShowArchived] = useStatePortal(false);
  const [openIds, setOpenIds] = useStatePortal(() => new Set());
  const [collapsed, setCollapsed] = useStatePortal(() => new Set());
  const [formFor, setFormFor] = useStatePortal(null); // null | 'new' | deal
  const [showPartners, setShowPartners] = useStatePortal(false);

  // What this session may do is decided by the server and sent back on the
  // session response. The role fallback keeps a cached page working through
  // the deploy that introduces the flags.
  const canWrite = Boolean(session && (
    typeof session.canWrite === 'boolean' ? session.canWrite : session.role !== 'partner'
  ));
  const canMessage = Boolean(session && (
    typeof session.canMessage === 'boolean' ? session.canMessage : true
  ));

  // Auto-refresh must not yank data out from under an open form.
  const formOpen = formFor !== null || showPartners;
  const formOpenRef = useRefPortal(formOpen);
  formOpenRef.current = formOpen;

  const loadSession = useCallbackPortal(async () => {
    if (!slug) { setSession(null); return false; }
    const { res, json } = await portalFetch(portalUrl('session', { org: slug }));
    if (res.ok && json && json.ok) {
      setOrg(json.org || null);
      setPartners(json.partners || []);
      setSession(json.authenticated ? json.session : null);
      return Boolean(json.authenticated);
    }
    setSession(null);
    setLoadError((json && json.error) || '');
    return false;
  }, [slug]);

  const loadDeals = useCallbackPortal(async (archived) => {
    const { res, json } = await portalFetch(portalUrl('deals', { archived: archived ? 'true' : 'false' }));
    if (res.status === 401) { setSession(null); return; }
    if (res.ok && json && json.ok) {
      setDeals(json.deals || []);
      setLoadError('');
    } else {
      setLoadError((json && json.error) || 'Could not load the board.');
    }
  }, []);

  const refresh = useCallbackPortal(async () => {
    await loadDeals(showArchived).catch(() => {});
  }, [loadDeals, showArchived]);

  useEffectPortal(() => {
    (async () => {
      const authed = await loadSession().catch(() => false);
      if (authed) await loadDeals(false).catch(() => {});
      setBooting(false);
    })();
  }, [loadSession, loadDeals]);

  useEffectPortal(() => {
    if (org) document.title = `${org.name} · Referral Partner Portal`;
  }, [org]);

  // Refetch when the archived toggle flips.
  useEffectPortal(() => {
    if (session) loadDeals(showArchived).catch(() => {});
  }, [showArchived, session, loadDeals]);

  // Keeps the board current without a manual refresh. Skipped while a form is
  // open, and while the tab is hidden.
  useEffectPortal(() => {
    if (!session) return undefined;
    const id = setInterval(() => {
      if (formOpenRef.current || document.hidden) return;
      loadDeals(showArchived).catch(() => {});
    }, PORTAL_REFRESH_MS);
    return () => clearInterval(id);
  }, [session, showArchived, loadDeals]);

  const signOut = async () => {
    await portalFetch(portalUrl('logout'), { method: 'POST' }).catch(() => {});
    setSession(null);
    setDeals([]);
  };

  const changeStage = async (id, status) => {
    const { res, json } = await portalFetch(portalUrl('deals'), {
      method: 'PATCH',
      body: JSON.stringify({ id, status }),
    });
    if (res.ok && json && json.ok) await refresh();
    else setLoadError((json && json.error) || 'That stage change did not save.');
  };

  const addNote = async (dealId, note, visibility) => {
    const { res, json } = await portalFetch(portalUrl('notes'), {
      method: 'POST',
      body: JSON.stringify({ deal_id: dealId, note, visibility }),
    });
    if (res.ok && json && json.ok) { await refresh(); return true; }
    return false;
  };

  const toggleArchive = async (deal) => {
    const { res, json } = await portalFetch(portalUrl('deals'), {
      method: 'PATCH',
      body: JSON.stringify({ id: deal.id, archived: !deal.archived }),
    });
    if (res.ok && json && json.ok) await refresh();
    else setLoadError((json && json.error) || 'That did not save.');
  };

  const toggleRow = (id) => setOpenIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const toggleGroup = (stage) => setCollapsed((prev) => {
    const next = new Set(prev);
    if (next.has(stage)) next.delete(stage); else next.add(stage);
    return next;
  });

  const visible = useMemoPortal(() => {
    const q = query.trim().toLowerCase();
    let list = deals;
    if (q) {
      list = list.filter((d) => [d.subject, d.customer_name, d.customer_mobile, d.customer_email]
        .concat(d.subject_details || [])
        .some((v) => String(v || '').toLowerCase().includes(q)));
    }
    // Staff-side filter only. A partner's list is already scoped by the
    // server, so there is nothing here for them to narrow.
    if (partnerFilter !== 'all') {
      list = partnerFilter === 'none'
        ? list.filter((d) => !d.partner_id)
        : list.filter((d) => {
            const p = partners.find((x) => x.slug === partnerFilter);
            return p && d.partner_id === p.id;
          });
    }
    return list;
  }, [deals, query, partnerFilter, partners]);

  // Board groups, in pipeline order. Empty stages are dropped so the board is
  // only as long as the work actually in it.
  const groups = useMemoPortal(() => {
    const bucket = new Map();
    for (const d of visible) {
      if (!bucket.has(d.status)) bucket.set(d.status, []);
      bucket.get(d.status).push(d);
    }
    const order = (org && org.stages && org.stages.length) ? org.stages : Array.from(bucket.keys());
    const known = order.filter((s) => bucket.has(s));
    // Anything on a stage the server didn't list still has to appear.
    const extra = Array.from(bucket.keys()).filter((s) => !order.includes(s));
    return [...known, ...extra].map((stage) => ({ stage, rows: bucket.get(stage) }));
  }, [visible, org]);

  if (booting) {
    return <main className="deal-shell"><p className="deal-booting">Loading…</p></main>;
  }

  // /portal with nothing after it. There is no index of portals on purpose —
  // listing them would name every brokerage using the product.
  if (!slug) {
    return <main className="deal-shell"><p className="deal-booting">This portal is not available.</p></main>;
  }

  if (!session) {
    return (
      <main className="deal-shell pd-shell" style={org ? { '--pd-accent': org.accent } : undefined}>
        <PortalLogin
          org={org}
          slug={slug}
          onSignedIn={async () => {
            setBooting(true);
            const authed = await loadSession().catch(() => false);
            if (authed) await loadDeals(false).catch(() => {});
            setBooting(false);
          }}
        />
      </main>
    );
  }

  // Signed in but the org row vanished. Never render a board without knowing
  // whose it is.
  if (!org) {
    return <main className="deal-shell"><p className="deal-booting">This portal is not available.</p></main>;
  }

  const partner = session.partner;

  return (
    <main className="deal-shell pd-shell rf-shell" style={{ '--pd-accent': org.accent }}>
      <div className="deal-page">
        <header className="pd-brandbar rf-brandbar">
          <div className="pd-brand">
            {org.logo
              ? <img src={org.logo} alt={org.name} className="rf-brand-logo" />
              : <span className="rf-brand-name">{org.name}</span>}
            {org.domainLabel && <span className="rf-brand-domain">{org.domainLabel}</span>}
          </div>

          <div className="pd-whoami">
            {partner ? (
              <div className="rf-whoami-partner">
                <PortalPartnerMark partner={partner} />
                <span className="rf-whoami-text">
                  <span className="deal-role">{partner.name}</span>
                  <span className="pd-whoami-sub">
                    Signed in as {session.name}{partner.kind ? ` · ${partner.kind}` : ''} · view only
                  </span>
                </span>
              </div>
            ) : (
              <React.Fragment>
                <span className="deal-role">{session.role === 'owner' ? 'Buyer Assist' : org.shortName || org.name}</span>
                <span className="pd-whoami-sub">
                  Signed in as {session.name} · full access
                </span>
              </React.Fragment>
            )}
            <button type="button" className="btn ghost deal-btn-sm pt-signout" onClick={signOut}>Sign out</button>
          </div>
        </header>

        <div className="pd-scope">
          {partner ? (
            <React.Fragment>
              Showing the <strong>{deals.length} {deals.length === 1 ? 'deal' : 'deals'}</strong> {partner.name} referred.
              Deals from other partners are never sent to this board. Open one to see
              its history and message the team about it.
            </React.Fragment>
          ) : (
            <React.Fragment>
              Showing <strong>{deals.length} {deals.length === 1 ? 'deal' : 'deals'}</strong> across{' '}
              <strong>{partners.length} referral {partners.length === 1 ? 'partner' : 'partners'}</strong>.
              Change a stage or add a note and the partner sees it immediately.
            </React.Fragment>
          )}
        </div>

        <div className="deal-controls">
          <div className="deal-search">
            <label className="deal-label" htmlFor="pt-search">Search</label>
            <input id="pt-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                   placeholder="Name, phone, address…" />
          </div>

          {canWrite && partners.length > 0 && (
            <div className="deal-filter">
              <label className="deal-label" htmlFor="pt-partner-filter">Referral partner</label>
              <select id="pt-partner-filter" className="cr-select" value={partnerFilter}
                      onChange={(e) => setPartnerFilter(e.target.value)}>
                <option value="all">All partners</option>
                {partners.map((p) => <option key={p.slug} value={p.slug}>{p.name}</option>)}
                <option value="none">Not attributed</option>
              </select>
            </div>
          )}

          <div className="deal-filter">
            <label className="deal-label" htmlFor="pt-view">View</label>
            <select id="pt-view" className="cr-select" value={showArchived ? 'archived' : 'active'}
                    onChange={(e) => setShowArchived(e.target.value === 'archived')}>
              <option value="active">Active board</option>
              <option value="archived">Removed</option>
            </select>
          </div>

          {canWrite && (
            <React.Fragment>
              <button type="button" className="btn ghost deal-add-btn" onClick={() => setShowPartners(true)}>
                Referral partners
              </button>
              <button type="button" className="btn primary deal-add-btn" onClick={() => setFormFor('new')}>
                Add a referral
              </button>
            </React.Fragment>
          )}
        </div>

        {loadError && <p role="alert" className="deal-error deal-error-block">{loadError}</p>}

        {groups.length === 0 ? (
          <p className="deal-empty">
            {showArchived
              ? 'Nothing has been removed from this board.'
              : (canWrite
                  ? 'Nothing on the board yet. Add the first referral to get started.'
                  : 'Nothing on your board yet. Anything you refer will appear here.')}
          </p>
        ) : (
          groups.map(({ stage, rows }) => (
            <PortalGroup
              key={stage}
              stage={stage}
              deals={rows}
              org={org}
              partners={partners}
              collapsed={collapsed.has(stage)}
              onToggleGroup={toggleGroup}
              openIds={openIds}
              onToggleRow={toggleRow}
              canWrite={canWrite}
              canMessage={canMessage}
              onStage={changeStage}
              onNote={addNote}
              onEdit={(d) => setFormFor(d)}
              onArchive={toggleArchive}
            />
          ))
        )}

        <footer className="pd-foot">
          <p>
            This portal contains confidential customer information and is provided
            solely for authorised {org.shortName || org.name} staff and their referral
            partners. Data is held in Australia.
          </p>
          <p className="pd-foot-credit">
            Referral Partner Portal · built by{' '}
            <a href="https://brokenmind.com.au" target="_blank" rel="noopener noreferrer">BrokenMind Software</a>
          </p>
        </footer>
      </div>

      {formFor !== null && canWrite && (
        <PortalDealForm
          deal={formFor === 'new' ? null : formFor}
          org={org}
          partners={partners}
          onClose={() => setFormFor(null)}
          onSaved={async () => { setFormFor(null); await refresh(); }}
        />
      )}

      {showPartners && canWrite && (
        <PortalPartnersPanel
          org={org}
          onClose={() => setShowPartners(false)}
          // Adding, renaming or switching off a firm changes the "Referred by"
          // dropdown and the board's filter, both of which read from the
          // session response.
          onChanged={async () => { await loadSession().catch(() => {}); await refresh(); }}
        />
      )}
    </main>
  );
}

Object.assign(window, { PortalPage });
