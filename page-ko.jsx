/* global React, BrandLogo */
// =============================================================
// Hidden KO Cars quick-quote page — /ko-apply
//
// The KO Cars twin of /autozone-apply. Charlie and the KO Cars floor send
// this link straight to their customers. Not part of the public site: no
// nav link, no footer link, no sitemap entry, blocked from indexing
// (robots.txt + vercel.json X-Robots-Tag + the noindex meta swap below).
// It just embeds Josh's personal AFOS referral widget full-bleed. Nothing
// is collected or processed on this site; AFOS owns the form.
//
// Same AFOS widget as /autozone-apply, so KO leads land in Josh's pipeline
// exactly like AutoZone's do. If a KO-specific referral widget is ever set
// up in AFOS (so the source is tagged automatically), swap KO_WIDGET_URL
// below and nothing else needs to change.
// =============================================================
const { useEffect: useEffectKo } = React;

const KO_WIDGET_URL = 'https://referral.afos.io/widget/v1/2e4d-josh-marien-form/quote';

// Swaps the sitewide <meta name="robots"> to noindex while this page is
// mounted, and restores it on unmount. Deliberately local rather than shared
// with page-autozone.jsx / page-dealer.jsx — see the note in page-dealer.jsx.
function useKoNoIndex() {
  useEffectKo(() => {
    const meta = document.querySelector('meta[name="robots"]');
    const prev = meta ? meta.getAttribute('content') : null;
    if (meta) meta.setAttribute('content', 'noindex, nofollow');
    return () => { if (meta && prev != null) meta.setAttribute('content', prev); };
  }, []);
}

function KoApplyPage() {
  useKoNoIndex();
  return (
    <main className="quote-embed-shell" data-screen-label="KO Cars — Quick Quote">
      <header className="quote-embed-header">
        <BrandLogo light={false} size="sm" />
        <div>
          <h1 className="h3" style={{ margin: 0 }}>Quick quote</h1>
          <p className="body" style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>KO Cars · with Josh, Senior Finance Broker</p>
        </div>
      </header>
      <iframe
        className="quote-embed-frame"
        src={KO_WIDGET_URL}
        title="Quick quote"
      />
    </main>
  );
}

Object.assign(window, { KoApplyPage });
