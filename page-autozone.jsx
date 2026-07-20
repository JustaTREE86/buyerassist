/* global React, BrandLogo */
// =============================================================
// Hidden personal quick-quote page — /autozone-apply
//
// Not part of the public site: no nav link, no footer link, no sitemap
// entry, blocked from indexing (robots.txt + vercel.json X-Robots-Tag +
// the noindex meta swap below). A link Josh sends straight to clients —
// it just embeds his personal AFOS referral widget full-bleed. Nothing is
// collected or processed on this site; AFOS owns the form.
// =============================================================
const { useEffect: useEffectAutozone } = React;

const AUTOZONE_WIDGET_URL = 'https://referral.afos.io/widget/v1/2e4d-josh-marien-form/quote';

// Swaps the sitewide <meta name="robots"> to noindex while this page is
// mounted, and restores it on unmount. Deliberately local rather than shared
// with page-staff.jsx / page-dealer.jsx — see the note in page-dealer.jsx.
function useAutozoneNoIndex() {
  useEffectAutozone(() => {
    const meta = document.querySelector('meta[name="robots"]');
    const prev = meta ? meta.getAttribute('content') : null;
    if (meta) meta.setAttribute('content', 'noindex, nofollow');
    return () => { if (meta && prev != null) meta.setAttribute('content', prev); };
  }, []);
}

function AutozoneApplyPage() {
  useAutozoneNoIndex();
  return (
    <main className="quote-embed-shell" data-screen-label="Josh — Quick Quote">
      <header className="quote-embed-header">
        <BrandLogo light={false} size="sm" />
        <div>
          <h1 className="h3" style={{ margin: 0 }}>Quick quote</h1>
          <p className="body" style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>with Josh · Senior Finance Broker</p>
        </div>
      </header>
      <iframe
        className="quote-embed-frame"
        src={AUTOZONE_WIDGET_URL}
        title="Quick quote"
      />
    </main>
  );
}

Object.assign(window, { AutozoneApplyPage });
