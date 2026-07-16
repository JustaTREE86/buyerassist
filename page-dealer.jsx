/* global React, BrandLogo, formatMoney */
// =============================================================
// Hidden dealer deal tracker — /dealer/ko-cars
//
// Not part of the public site: no nav link, no footer link, no sitemap entry,
// blocked from indexing (robots.txt + vercel.json X-Robots-Tag + the noindex
// meta swap below).
//
// Two roles, decided server-side by which password was used at login:
//   staff  — Buyer Assist. Add/edit deals, change stage, add notes, archive.
//   dealer — KO Cars. Read-only view of KO Cars deals.
// The read-only rule is enforced in /api/dealer/*; hiding controls here is
// only cosmetic. Never treat this file as a security boundary.
//
// The vehicle is the headline on every card, because KO Cars remember
// customers by the car, not the name.
// =============================================================
const {
  useState: useStateDealer,
  useEffect: useEffectDealer,
  useMemo: useMemoDealer,
  useCallback: useCallbackDealer,
  useRef: useRefDealer,
} = React;

const DEALER_SLUG = 'ko-cars';
const DEALER_REFRESH_MS = 45000; // Auto-refresh cadence for the dealer's view.

// Times are pinned to Brisbane so a deal reads the same for Buyer Assist and
// KO Cars regardless of the device's timezone.
const DEALER_TZ = 'Australia/Brisbane';

// Tone drives the badge colour, but the written status is always rendered too,
// so colour is never the only signal.
const DEALER_STATUS_TONE = {
  'New Referral': 'new',
  'Contacting Customer': 'progress',
  'Application Sent': 'progress',
  'Waiting on Customer': 'attention',
  'Documents Required': 'attention',
  'Assessing': 'progress',
  'Submitted to Lender': 'progress',
  'Lender Reviewing': 'progress',
  'Conditional Approval': 'good',
  'Approved': 'good',
  'Settlement Booked': 'good',
  'Settled': 'done',
  'Declined': 'bad',
  'On Hold': 'attention',
  'Unable to Contact': 'attention',
  'Cancelled': 'bad',
};

const DEALER_SORTS = [
  { id: 'recent', label: 'Most recently updated' },
  { id: 'oldest', label: 'Oldest update' },
  { id: 'vehicle', label: 'Vehicle make and model' },
  { id: 'customer', label: 'Customer name' },
  { id: 'stage', label: 'Deal stage' },
];

// Swaps the sitewide <meta name="robots"> to noindex while this page is
// mounted and restores it on unmount. Deliberately local rather than shared
// with page-staff.jsx: these scripts don't export it, and a hidden page should
// not depend on another file's load order for its noindex.
function useDealerNoIndex() {
  useEffectDealer(() => {
    const meta = document.querySelector('meta[name="robots"]');
    const prev = meta ? meta.getAttribute('content') : null;
    if (meta) meta.setAttribute('content', 'noindex, nofollow');
    return () => { if (meta && prev != null) meta.setAttribute('content', prev); };
  }, []);
}

// ---- formatting helpers -------------------------------------------------

function dealerDateTime(iso, joiner) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: DEALER_TZ,
  });
  const time = d.toLocaleTimeString('en-AU', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: DEALER_TZ,
  }).replace(/\s*(am|pm)$/i, (m) => m.toUpperCase());
  return `${date}${joiner}${time}`;
}

function dealerClock(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-AU', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: DEALER_TZ,
  }).replace(/\s*(am|pm)$/i, (m) => m.toUpperCase());
}

// "2022 Ford Ranger Wildtrak" — the card's headline.
function dealerVehicleTitle(deal) {
  return [deal.vehicle_year, deal.vehicle_make, deal.vehicle_model, deal.vehicle_variant]
    .filter(Boolean).join(' ');
}

function dealerTelHref(mobile) {
  const cleaned = String(mobile || '').replace(/[^\d+]/g, '');
  return cleaned ? `tel:${cleaned}` : null;
}

async function dealerFetch(url, options) {
  const res = await fetch(url, {
    credentials: 'same-origin', // send the HttpOnly session cookie
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json = await res.json().catch(() => null);
  return { res, json };
}

// ---- small presentational pieces ---------------------------------------

function DealerStatusBadge({ status, large }) {
  const tone = DEALER_STATUS_TONE[status] || 'new';
  return (
    <span className={`deal-badge tone-${tone}${large ? ' is-large' : ''}`}>{status}</span>
  );
}

function DealerPrivacyNotice() {
  return (
    <p className="deal-privacy">
      This dashboard contains confidential customer information and is provided solely for
      authorised Buyer Assist and KO Cars staff.
    </p>
  );
}

// ---- login --------------------------------------------------------------

function DealerLoginGate({ onSignedIn }) {
  const [name, setName] = useStateDealer('');
  const [password, setPassword] = useStateDealer('');
  const [error, setError] = useStateDealer('');
  const [busy, setBusy] = useStateDealer(false);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      const { res, json } = await dealerFetch('/api/dealer/login', {
        method: 'POST',
        body: JSON.stringify({ name, password, dealer: DEALER_SLUG }),
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

  return (
    <div className="deal-login-box">
      <BrandLogo light={false} size="sm" />
      <h1 className="h2" style={{ marginTop: 24 }}>KO Cars Deal Tracker</h1>
      <p className="body deal-login-sub">Sign in to view finance deal progress.</p>
      <form onSubmit={submit} className="bp-form" noValidate>
        <div className="bp-field">
          <label htmlFor="deal-name">Your name</label>
          <input id="deal-name" type="text" required autoFocus autoComplete="name"
                 value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="bp-field">
          <label htmlFor="deal-pw">Password</label>
          <input id="deal-pw" type="password" required autoComplete="current-password"
                 value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" className="deal-error">{error}</p>}
        <button type="submit" className="btn primary" disabled={busy} style={{ opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <DealerPrivacyNotice />
    </div>
  );
}

// ---- add / edit form ----------------------------------------------------

const DEALER_EMPTY_FORM = {
  customer_name: '', customer_mobile: '', customer_email: '',
  vehicle_year: '', vehicle_make: '', vehicle_model: '', vehicle_variant: '',
  vehicle_registration: '', vehicle_stock_number: '', vehicle_price: '',
  status: 'New Referral', initial_note: '',
};

function DealerDealForm({ deal, statuses, onClose, onSaved }) {
  const editing = Boolean(deal);
  const [f, setF] = useStateDealer(() => {
    if (!deal) return DEALER_EMPTY_FORM;
    return {
      ...DEALER_EMPTY_FORM,
      ...Object.keys(DEALER_EMPTY_FORM).reduce((acc, k) => {
        acc[k] = deal[k] === null || deal[k] === undefined ? '' : String(deal[k]);
        return acc;
      }, {}),
      status: deal.status,
    };
  });
  const [error, setError] = useStateDealer('');
  const [busy, setBusy] = useStateDealer(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  // The server validates all of this again; this pass is only so the user gets
  // an answer without waiting for a round trip.
  const validate = () => {
    if (!f.customer_name.trim()) return 'Please enter the customer’s full name.';
    if (!f.customer_mobile.trim() && !f.customer_email.trim()) {
      return 'Please enter a customer mobile or email address.';
    }
    if (!f.vehicle_make.trim()) return 'Please enter the vehicle make.';
    if (!f.vehicle_model.trim()) return 'Please enter the vehicle model.';
    if (!f.status) return 'Please choose the current stage.';
    return '';
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const invalid = validate();
    if (invalid) { setError(invalid); return; }
    setError('');
    setBusy(true);
    try {
      // On edit the server ignores initial_note — the opening note already
      // exists and history is append-only.
      const payload = editing ? { ...f, id: deal.id } : f;
      const { res, json } = await dealerFetch('/api/dealer/deals', {
        method: editing ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      if (res.ok && json && json.ok) {
        onSaved();
      } else {
        setError((json && json.error) || 'The deal could not be saved.');
      }
    } catch (err) {
      setError('Network error. Your details below are unchanged, please try again.');
    }
    setBusy(false);
  };

  return (
    <div className="deal-modal-backdrop" role="dialog" aria-modal="true" aria-label={editing ? 'Edit deal' : 'Add deal'}>
      <div className="deal-modal">
        <div className="deal-modal-head">
          <h2 className="h3">{editing ? 'Edit deal' : 'Add a deal'}</h2>
          <button type="button" className="deal-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={submit} className="bp-form" noValidate>
          <p className="deal-form-legend">Vehicle</p>
          <div className="bp-row">
            <div className="bp-field">
              <label htmlFor="d-year">Year</label>
              <input id="d-year" type="number" min="1900" max="2100" step="1" value={f.vehicle_year} onChange={set('vehicle_year')} placeholder="2022" />
            </div>
            <div className="bp-field">
              <label htmlFor="d-make">Make <span aria-hidden="true">*</span></label>
              <input id="d-make" type="text" required value={f.vehicle_make} onChange={set('vehicle_make')} placeholder="Ford" />
            </div>
          </div>
          <div className="bp-row">
            <div className="bp-field">
              <label htmlFor="d-model">Model <span aria-hidden="true">*</span></label>
              <input id="d-model" type="text" required value={f.vehicle_model} onChange={set('vehicle_model')} placeholder="Ranger" />
            </div>
            <div className="bp-field">
              <label htmlFor="d-variant">Variant</label>
              <input id="d-variant" type="text" value={f.vehicle_variant} onChange={set('vehicle_variant')} placeholder="Wildtrak" />
            </div>
          </div>
          <div className="bp-row">
            <div className="bp-field">
              <label htmlFor="d-rego">Registration</label>
              <input id="d-rego" type="text" value={f.vehicle_registration} onChange={set('vehicle_registration')} placeholder="ABC123" />
            </div>
            <div className="bp-field">
              <label htmlFor="d-stock">Stock number</label>
              <input id="d-stock" type="text" value={f.vehicle_stock_number} onChange={set('vehicle_stock_number')} />
            </div>
          </div>
          <div className="bp-field">
            <label htmlFor="d-price">Vehicle price</label>
            <input id="d-price" type="number" min="0" step="1" value={f.vehicle_price} onChange={set('vehicle_price')} placeholder="$" />
          </div>

          <p className="deal-form-legend">Customer</p>
          <div className="bp-field">
            <label htmlFor="d-name">Full name <span aria-hidden="true">*</span></label>
            <input id="d-name" type="text" required value={f.customer_name} onChange={set('customer_name')} />
          </div>
          <div className="bp-row">
            <div className="bp-field">
              <label htmlFor="d-mobile">Mobile</label>
              <input id="d-mobile" type="tel" value={f.customer_mobile} onChange={set('customer_mobile')} placeholder="0400 000 000" />
            </div>
            <div className="bp-field">
              <label htmlFor="d-email">Email</label>
              <input id="d-email" type="email" value={f.customer_email} onChange={set('customer_email')} placeholder="customer@email.com" />
            </div>
          </div>
          <p className="deal-hint">Enter at least one of mobile or email.</p>

          <p className="deal-form-legend">Progress</p>
          <div className="bp-field">
            <label htmlFor="d-status">Current stage <span aria-hidden="true">*</span></label>
            <select id="d-status" className="cr-select" required value={f.status} onChange={set('status')}>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {!editing && (
            <div className="bp-field">
              <label htmlFor="d-note">Initial note</label>
              <textarea id="d-note" rows={3} value={f.initial_note} onChange={set('initial_note')}
                        placeholder="Referral received from KO Cars. Calling the customer today." />
            </div>
          )}

          <div className="bp-field">
            <label htmlFor="d-dealer">Dealer</label>
            <input id="d-dealer" type="text" value="KO Cars" readOnly disabled />
          </div>

          {error && <p role="alert" className="deal-error">{error}</p>}

          <div className="deal-form-actions">
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={busy} style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Add deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- one deal card ------------------------------------------------------

function DealerDealCard({ deal, canEdit, statuses, onChanged, onEdit }) {
  const [open, setOpen] = useStateDealer(false);
  const [noteText, setNoteText] = useStateDealer('');
  const [busy, setBusy] = useStateDealer(false);
  const [error, setError] = useStateDealer('');

  const notes = deal.deal_notes || [];
  const latest = notes[0];
  const title = dealerVehicleTitle(deal);

  const addNote = async (e) => {
    e.preventDefault();
    if (busy || !noteText.trim()) return;
    setBusy(true);
    setError('');
    try {
      const { res, json } = await dealerFetch('/api/dealer/notes', {
        method: 'POST',
        body: JSON.stringify({ deal_id: deal.id, note: noteText }),
      });
      if (res.ok && json && json.ok) {
        setNoteText('');
        onChanged();
      } else {
        setError((json && json.error) || 'The note could not be saved.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setBusy(false);
  };

  const patchDeal = async (patch) => {
    setBusy(true);
    setError('');
    try {
      const { res, json } = await dealerFetch('/api/dealer/deals', {
        method: 'PATCH',
        body: JSON.stringify({ id: deal.id, ...patch }),
      });
      if (res.ok && json && json.ok) onChanged();
      else setError((json && json.error) || 'That change could not be saved.');
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setBusy(false);
  };

  return (
    <article className="deal-card">
      {/* Vehicle first and largest — KO Cars identify deals by the car. */}
      <h2 className="deal-vehicle">{title || 'Vehicle details to be confirmed'}</h2>

      <p className="deal-vehicle-meta">
        {deal.vehicle_registration && <span>Rego {deal.vehicle_registration}</span>}
        {deal.vehicle_stock_number && <span>Stock {deal.vehicle_stock_number}</span>}
        {deal.vehicle_price !== null && deal.vehicle_price !== undefined && (
          <span>${formatMoney(deal.vehicle_price)}</span>
        )}
      </p>

      <div className="deal-customer">
        <p className="deal-customer-name">{deal.customer_name}</p>
        {deal.customer_mobile && (
          <p><a href={dealerTelHref(deal.customer_mobile)}>{deal.customer_mobile}</a></p>
        )}
        {deal.customer_email && (
          <p><a href={`mailto:${deal.customer_email}`}>{deal.customer_email}</a></p>
        )}
      </div>

      <div className="deal-status-row">
        <span className="deal-label">Status:</span>
        <DealerStatusBadge status={deal.status} large />
        {deal.archived && <span className="deal-badge tone-archived">Archived</span>}
      </div>

      <p className="deal-updated">Last updated: {dealerDateTime(deal.updated_at, ' at ')}</p>

      {latest ? (
        <div className="deal-latest-note">
          <p className="deal-note-when">{dealerDateTime(latest.created_at, ', ')}</p>
          <p className="deal-note-text">{latest.note}</p>
          {latest.created_by && <p className="deal-note-who">by {latest.created_by}</p>}
        </div>
      ) : (
        <p className="deal-latest-note deal-note-empty">No notes yet.</p>
      )}

      {notes.length > 1 && (
        <button type="button" className="btn link deal-history-toggle"
                aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide history' : `View full history (${notes.length} updates)`}
        </button>
      )}

      {open && (
        <ol className="deal-history">
          {notes.map((n) => (
            <li key={n.id}>
              <p className="deal-note-when">{dealerDateTime(n.created_at, ', ')}</p>
              <p className="deal-note-text">{n.note}</p>
              {n.created_by && <p className="deal-note-who">by {n.created_by}</p>}
            </li>
          ))}
        </ol>
      )}

      {error && <p role="alert" className="deal-error">{error}</p>}

      {/* Staff-only controls. The server enforces this too — a dealer session
          is rejected by /api/dealer/* even if these were forced into the DOM. */}
      {canEdit && (
        <div className="deal-staff-tools">
          <form onSubmit={addNote} className="deal-note-form">
            <label htmlFor={`note-${deal.id}`} className="deal-label">Add an update</label>
            <textarea id={`note-${deal.id}`} rows={2} value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Customer has supplied bank statements…" />
            <button type="submit" className="btn primary deal-btn-sm"
                    disabled={busy || !noteText.trim()}>
              {busy ? 'Saving…' : 'Add note'}
            </button>
          </form>

          <div className="deal-staff-row">
            <label htmlFor={`stage-${deal.id}`} className="deal-label">Stage</label>
            <select id={`stage-${deal.id}`} className="cr-select deal-stage-select"
                    value={deal.status} disabled={busy}
                    onChange={(e) => patchDeal({ status: e.target.value })}>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button type="button" className="btn ghost deal-btn-sm" onClick={() => onEdit(deal)}>Edit</button>
            <button type="button" className="btn ghost deal-btn-sm" disabled={busy}
                    onClick={() => patchDeal({ archived: !deal.archived })}>
              {deal.archived ? 'Restore' : 'Archive'}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

// ---- page ---------------------------------------------------------------

function DealerKoCarsPage() {
  useDealerNoIndex();

  const [booting, setBooting] = useStateDealer(true);
  const [session, setSession] = useStateDealer(null);
  const [statuses, setStatuses] = useStateDealer([]);
  const [deals, setDeals] = useStateDealer([]);
  const [fetchedAt, setFetchedAt] = useStateDealer(null);
  const [loadError, setLoadError] = useStateDealer('');
  const [query, setQuery] = useStateDealer('');
  const [statusFilter, setStatusFilter] = useStateDealer('all');
  const [sort, setSort] = useStateDealer('recent');
  const [showArchived, setShowArchived] = useStateDealer(false);
  const [formFor, setFormFor] = useStateDealer(null); // null | 'new' | deal

  // Auto-refresh must not yank data out from under an open form.
  const formOpen = formFor !== null;
  const formOpenRef = useRefDealer(formOpen);
  formOpenRef.current = formOpen;

  const loadSession = useCallbackDealer(async () => {
    const { res, json } = await dealerFetch('/api/dealer/session');
    if (res.ok && json && json.ok) {
      setStatuses(json.statuses || []);
      setSession(json.authenticated ? json.session : null);
      return json.authenticated;
    }
    setSession(null);
    return false;
  }, []);

  const loadDeals = useCallbackDealer(async (archived) => {
    const { res, json } = await dealerFetch(`/api/dealer/deals?archived=${archived ? 'true' : 'false'}`);
    if (res.status === 401) { setSession(null); return; }
    if (res.ok && json && json.ok) {
      setDeals(json.deals || []);
      setFetchedAt(json.fetchedAt);
      setLoadError('');
    } else {
      setLoadError((json && json.error) || 'Could not load deals.');
    }
  }, []);

  useEffectDealer(() => {
    (async () => {
      const authed = await loadSession().catch(() => false);
      if (authed) await loadDeals(false).catch(() => {});
      setBooting(false);
    })();
  }, [loadSession, loadDeals]);

  // Refetch when the archived toggle flips.
  useEffectDealer(() => {
    if (session) loadDeals(showArchived).catch(() => {});
  }, [showArchived, session, loadDeals]);

  // Keeps KO Cars current without a manual refresh. Skipped while a form is
  // open, and while the tab is hidden.
  useEffectDealer(() => {
    if (!session) return undefined;
    const id = setInterval(() => {
      if (formOpenRef.current || document.hidden) return;
      loadDeals(showArchived).catch(() => {});
    }, DEALER_REFRESH_MS);
    return () => clearInterval(id);
  }, [session, showArchived, loadDeals]);

  const signOut = async () => {
    await dealerFetch('/api/dealer/logout', { method: 'POST' }).catch(() => {});
    setSession(null);
    setDeals([]);
  };

  const visible = useMemoDealer(() => {
    const q = query.trim().toLowerCase();
    let list = deals;

    if (q) {
      list = list.filter((d) => [
        d.vehicle_make, d.vehicle_model, d.vehicle_variant, d.vehicle_registration,
        d.vehicle_stock_number, d.customer_name, d.customer_mobile, d.customer_email,
      ].some((v) => String(v || '').toLowerCase().includes(q)));
    }
    if (statusFilter !== 'all') list = list.filter((d) => d.status === statusFilter);

    const by = {
      recent: (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
      oldest: (a, b) => new Date(a.updated_at) - new Date(b.updated_at),
      vehicle: (a, b) => dealerVehicleTitle(a).localeCompare(dealerVehicleTitle(b)),
      customer: (a, b) => String(a.customer_name).localeCompare(String(b.customer_name)),
      stage: (a, b) => String(a.status).localeCompare(String(b.status)),
    };
    return [...list].sort(by[sort] || by.recent);
  }, [deals, query, statusFilter, sort]);

  if (booting) {
    return <main className="deal-shell"><p className="deal-booting">Loading…</p></main>;
  }

  if (!session) {
    return (
      <main className="deal-shell" data-screen-label="Dealer — KO Cars">
        <DealerLoginGate onSignedIn={async () => {
          setBooting(true);
          const authed = await loadSession().catch(() => false);
          if (authed) await loadDeals(false).catch(() => {});
          setBooting(false);
        }} />
      </main>
    );
  }

  const canEdit = session.role === 'staff';
  const refresh = () => loadDeals(showArchived).catch(() => {});

  return (
    <main className="deal-page" data-screen-label="Dealer — KO Cars">
      <header className="deal-header">
        <div className="deal-header-top">
          <div>
            <BrandLogo light={false} size="sm" />
            <h1 className="deal-title">KO Cars Deal Tracker</h1>
          </div>
          <div className="deal-header-right">
            <p className="deal-signed-in">
              {session.name}
              <span className="deal-role">{canEdit ? 'Buyer Assist staff' : 'KO Cars, view only'}</span>
            </p>
            <button type="button" className="btn ghost deal-btn-sm" onClick={signOut}>Sign out</button>
          </div>
        </div>

        <div className="deal-controls">
          <div className="deal-search">
            <label htmlFor="deal-search" className="deal-label">Search</label>
            <input id="deal-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                   placeholder="Vehicle, rego, stock number or customer" />
          </div>

          <div className="deal-filter">
            <label htmlFor="deal-status-filter" className="deal-label">Stage</label>
            <select id="deal-status-filter" className="cr-select" value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All stages</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="deal-filter">
            <label htmlFor="deal-sort" className="deal-label">Sort by</label>
            <select id="deal-sort" className="cr-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              {DEALER_SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          {canEdit && (
            <button type="button" className="btn primary deal-add-btn" onClick={() => setFormFor('new')}>
              Add deal
            </button>
          )}
        </div>

        <div className="deal-subbar">
          <p className="deal-freshness">
            {fetchedAt ? `Last updated ${dealerClock(fetchedAt)} · refreshes automatically` : ''}
            {' '}
            <button type="button" className="btn link deal-refresh-now" onClick={refresh}>Refresh now</button>
          </p>
          <button type="button" className="btn link" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? 'Back to active deals' : 'View archived deals'}
          </button>
        </div>
      </header>

      {loadError && <p role="alert" className="deal-error deal-error-block">{loadError}</p>}

      <p className="deal-count">
        {showArchived ? 'Archived deals' : 'Active deals'}: {visible.length}
        {visible.length !== deals.length ? ` of ${deals.length}` : ''}
      </p>

      {visible.length === 0 ? (
        <p className="deal-empty">
          {deals.length === 0
            ? (showArchived ? 'No archived deals.' : 'No active deals yet.')
            : 'No deals match your search.'}
        </p>
      ) : (
        <div className="deal-grid">
          {visible.map((d) => (
            <DealerDealCard key={d.id} deal={d} canEdit={canEdit} statuses={statuses}
                            onChanged={refresh} onEdit={(deal) => setFormFor(deal)} />
          ))}
        </div>
      )}

      <DealerPrivacyNotice />

      {formOpen && canEdit && (
        <DealerDealForm
          deal={formFor === 'new' ? null : formFor}
          statuses={statuses}
          onClose={() => setFormFor(null)}
          onSaved={() => { setFormFor(null); refresh(); }}
        />
      )}
    </main>
  );
}

Object.assign(window, { DealerKoCarsPage });
