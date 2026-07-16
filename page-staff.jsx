/* global React, BrandLogo, isValidAUPhone, isValidEmail */
// =============================================================
// Hidden staff page — /staff/debt-busters
//
// Not part of the public site: no nav link, no footer link, blocked from
// indexing (see robots.txt + vercel.json X-Robots-Tag + the noindex meta
// swap below). Lets a Buyer Assist staff member log the outcome of a Debt
// Busters referral The Buyer Assist Group couldn't help with, and emails
// that outcome to Debt Busters (with an internal copy) via /api/debt-
// busters-outcome. Password-gated via /api/staff-auth — the password
// itself lives only in DEBT_BUSTERS_STAFF_PASSWORD on the server, never in
// this bundle.
// =============================================================
const { useState: useStateStaff, useEffect: useEffectStaff } = React;

const OUTCOME_OPTIONS = [
  'Unable to assist',
  'Unable to contact',
  'Client no longer wishes to proceed',
  'Client did not provide requested information',
  'Credit profile unsuitable',
  'Serviceability not met',
  'Insufficient income',
  'Employment does not meet lender requirements',
  'Existing debts too high',
  'Requested amount not suitable',
  'Client requires further Debt Busters assistance',
  'Other',
];

const EMPTY_OUTCOME_FORM = {
  staffName: '',
  clientFirstName: '',
  clientSurname: '',
  clientPhone: '',
  clientEmail: '',
  dateContacted: '',
  contactAttempts: '',
  requestedAmount: '',
  reasonForReferral: '',
  outcome: '',
  reasonUnableToAssist: '',
  otherExplanation: '',
  additionalNotes: '',
  company: '', // honeypot
};

// Swaps the sitewide <meta name="robots"> to noindex while this page is
// mounted, and restores it on unmount — the site is otherwise index/follow.
function useNoIndex() {
  useEffectStaff(() => {
    const meta = document.querySelector('meta[name="robots"]');
    const prev = meta ? meta.getAttribute('content') : null;
    if (meta) meta.setAttribute('content', 'noindex, nofollow');
    return () => { if (meta && prev != null) meta.setAttribute('content', prev); };
  }, []);
}

function validateOutcomeForm(f) {
  if (!f.staffName.trim()) return 'Please enter the Buyer Assist staff member name.';
  if (!f.clientFirstName.trim()) return 'Please enter the client’s first name.';
  if (!f.clientSurname.trim()) return 'Please enter the client’s surname.';
  if (!isValidAUPhone(f.clientPhone)) return 'Please enter a valid Australian client phone number.';
  if (!isValidEmail(f.clientEmail)) return 'Please enter a valid client email address.';
  if (!f.dateContacted) return 'Please enter the date the client was contacted.';
  if (new Date(f.dateContacted) > new Date()) return 'Date contacted can’t be in the future.';
  if (f.contactAttempts === '' || Number(f.contactAttempts) < 0 || !Number.isInteger(Number(f.contactAttempts))) return 'Please enter a valid number of contact attempts.';
  if (f.requestedAmount === '' || Number(f.requestedAmount) <= 0) return 'Please enter a valid requested loan amount.';
  if (!f.reasonForReferral.trim()) return 'Please enter the reason for referral.';
  if (!f.outcome) return 'Please select an outcome.';
  if (f.outcome === 'Unable to assist' && !f.reasonUnableToAssist.trim()) return 'Please enter the reason unable to assist.';
  if (f.outcome === 'Other' && !f.otherExplanation.trim()) return 'Please explain the outcome, since you selected "Other".';
  return '';
}

function StaffAuthGate({ onAuthed }) {
  const [password, setPassword] = useStateStaff('');
  const [error, setError] = useStateStaff('');
  const [checking, setChecking] = useStateStaff(false);

  const submit = async (e) => {
    e.preventDefault();
    if (checking) return;
    setError('');
    setChecking(true);
    try {
      const res = await fetch('/api/staff-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json && json.ok === true) {
        onAuthed(password);
      } else if (res.status === 401) {
        setError('Incorrect password.');
      } else {
        setError((json && json.error) || 'Couldn’t verify the password right now. Please try again.');
      }
    } catch (e) {
      setError('Network error — check your connection and try again.');
    }
    setChecking(false);
  };

  return (
    <div className="staff-gate-box">
      <BrandLogo light={false} size="sm" />
      <h1 className="h2" style={{ marginTop: 24 }}>Buyer Assist staff</h1>
      <p className="body" style={{ color: 'var(--muted)', marginTop: 8, marginBottom: 24 }}>
        Enter the staff password to log a Debt Busters referral outcome.
      </p>
      <form onSubmit={submit} className="bp-form" noValidate>
        <div className="bp-field">
          <label htmlFor="staff-pw">Password</label>
          <input id="staff-pw" type="password" required autoFocus autoComplete="off"
                 value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <p role="alert" style={{ color: '#b3261e', fontSize: 14 }}>{error}</p>}
        <button type="submit" className="btn primary" disabled={checking} style={{ opacity: checking ? 0.6 : 1 }}>
          {checking ? 'Checking…' : 'Enter'}
        </button>
      </form>
    </div>
  );
}

function DebtBustersOutcomeForm({ password }) {
  const [f, setF] = useStateStaff(EMPTY_OUTCOME_FORM);
  const [status, setStatus] = useStateStaff('idle'); // idle | sending | success | error
  const [error, setError] = useStateStaff('');
  const set = k => e => setF(s => ({ ...s, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (status === 'sending') return;
    const validationError = validateOutcomeForm(f);
    if (validationError) { setError(validationError); return; }
    if (f.company) { setStatus('success'); return; } // honeypot: pretend success, drop silently
    setError('');
    setStatus('sending');
    try {
      const res = await fetch('/api/debt-busters-outcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, ...f }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setError(json.error || 'Something went wrong sending this outcome. Your details below are unchanged — please try again.');
      }
    } catch (e) {
      setStatus('error');
      setError('Network error — check your connection and try again. Your details below are unchanged.');
    }
  };

  if (status === 'success') {
    return (
      <div className="staff-gate-box">
        <h1 className="h2">Outcome sent.</h1>
        <p className="body" style={{ color: 'var(--muted)', marginTop: 8, marginBottom: 24 }}>
          The referral outcome for {f.clientFirstName} {f.clientSurname} has been emailed to Debt Busters, with a copy kept internally.
        </p>
        <button type="button" className="btn primary" onClick={() => { setF(EMPTY_OUTCOME_FORM); setStatus('idle'); setError(''); }}>
          Log another referral
        </button>
      </div>
    );
  }

  const sending = status === 'sending';

  return (
    <div className="staff-gate-box staff-form-box">
      <h1 className="h2">Debt Busters referral outcome</h1>
      <p className="body" style={{ color: 'var(--muted)', marginTop: 8, marginBottom: 24 }}>
        Log the outcome of a Debt Busters referral The Buyer Assist Group is unable to help with. This is emailed straight to Debt Busters — it is not stored anywhere else.
      </p>
      <form onSubmit={submit} className="bp-form" noValidate>
        <div className="bp-row">
          <div className="bp-field">
            <label htmlFor="db-staff">Buyer Assist staff member <span aria-hidden="true">*</span></label>
            <input id="db-staff" type="text" required value={f.staffName} onChange={set('staffName')} />
          </div>
        </div>

        <div className="bp-row">
          <div className="bp-field">
            <label htmlFor="db-fname">Client first name <span aria-hidden="true">*</span></label>
            <input id="db-fname" type="text" required value={f.clientFirstName} onChange={set('clientFirstName')} />
          </div>
          <div className="bp-field">
            <label htmlFor="db-sname">Client surname <span aria-hidden="true">*</span></label>
            <input id="db-sname" type="text" required value={f.clientSurname} onChange={set('clientSurname')} />
          </div>
        </div>

        <div className="bp-row">
          <div className="bp-field">
            <label htmlFor="db-phone">Client phone <span aria-hidden="true">*</span></label>
            <input id="db-phone" type="tel" required value={f.clientPhone} onChange={set('clientPhone')} placeholder="04XX XXX XXX" />
          </div>
          <div className="bp-field">
            <label htmlFor="db-email">Client email <span aria-hidden="true">*</span></label>
            <input id="db-email" type="email" required value={f.clientEmail} onChange={set('clientEmail')} placeholder="client@email.com" />
          </div>
        </div>

        <div className="bp-row">
          <div className="bp-field">
            <label htmlFor="db-date">Date contacted <span aria-hidden="true">*</span></label>
            <input id="db-date" type="date" required value={f.dateContacted} onChange={set('dateContacted')} max={new Date().toISOString().slice(0, 10)} />
          </div>
          <div className="bp-field">
            <label htmlFor="db-attempts">Number of contact attempts <span aria-hidden="true">*</span></label>
            <input id="db-attempts" type="number" min="0" step="1" required value={f.contactAttempts} onChange={set('contactAttempts')} />
          </div>
        </div>

        <div className="bp-field">
          <label htmlFor="db-amount">Requested loan amount <span aria-hidden="true">*</span></label>
          <input id="db-amount" type="number" min="0" step="1" required value={f.requestedAmount} onChange={set('requestedAmount')} placeholder="$" />
        </div>

        <div className="bp-field">
          <label htmlFor="db-reason">Reason for referral <span aria-hidden="true">*</span></label>
          <textarea id="db-reason" rows={3} required value={f.reasonForReferral} onChange={set('reasonForReferral')} />
        </div>

        <div className="bp-field">
          <label htmlFor="db-outcome">Outcome <span aria-hidden="true">*</span></label>
          <select id="db-outcome" className="cr-select" required value={f.outcome} onChange={set('outcome')}>
            <option value="">Select…</option>
            {OUTCOME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {f.outcome === 'Unable to assist' && (
          <div className="bp-field">
            <label htmlFor="db-unable">Reason unable to assist <span aria-hidden="true">*</span></label>
            <textarea id="db-unable" rows={2} required value={f.reasonUnableToAssist} onChange={set('reasonUnableToAssist')} />
          </div>
        )}

        {f.outcome === 'Other' && (
          <div className="bp-field">
            <label htmlFor="db-other">Please explain <span aria-hidden="true">*</span></label>
            <textarea id="db-other" rows={2} required value={f.otherExplanation} onChange={set('otherExplanation')} />
          </div>
        )}

        <div className="bp-field">
          <label htmlFor="db-notes">Additional notes</label>
          <textarea id="db-notes" rows={3} value={f.additionalNotes} onChange={set('additionalNotes')} />
        </div>

        {/* Honeypot */}
        <input type="text" name="company" value={f.company} onChange={set('company')} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} />

        {error && <p role="alert" style={{ color: '#b3261e', fontSize: 14 }}>{error}</p>}

        <button type="submit" className="btn primary" disabled={sending} style={{ opacity: sending ? 0.6 : 1 }}>
          {sending ? 'Sending…' : 'Send outcome to Debt Busters'}
        </button>
      </form>
    </div>
  );
}

function StaffDebtBustersPage() {
  useNoIndex();
  const [authedPassword, setAuthedPassword] = useStateStaff(null);

  return (
    <main className="staff-shell" data-screen-label="Staff — Debt Busters">
      {authedPassword === null
        ? <StaffAuthGate onAuthed={setAuthedPassword} />
        : <DebtBustersOutcomeForm password={authedPassword} />
      }
    </main>
  );
}

Object.assign(window, { StaffDebtBustersPage });
