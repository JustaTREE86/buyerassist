/* global React */
const { useState: useStatePrivacy } = React;

const LICENSEE = {
  name: 'Cullen Financial Services Pty Ltd T/As The Buyer Assist Group',
  abn: '63 680 292 399',
  acn: '680 292 399',
  address: 'Bundall, QLD 4217',
  phone: '0439 300 621',
  email: 'connect@thebuyerassist.com.au',
  creditRep: '564090',
  creditLicence: '414426',
  licensor: 'AFAS Group Pty Ltd (ABN 12 134 138 686)',
  afca: '111126',
};

const LENDER_FEES = [
  { name: 'Plenti',    app: '$499', monthly: '$9.90',  ppsr: '$6.80' },
  { name: 'Pepper',    app: '$449', monthly: '$8.90',  ppsr: '$8.00' },
  { name: 'RACV',      app: '$550', monthly: '$0.00',  ppsr: '$0.00' },
  { name: 'Firstmac',  app: '$400', monthly: '$8.00',  ppsr: '$0.00' },
  { name: 'AFS',       app: '$495', monthly: '$15.00', ppsr: '$17.60' },
  { name: 'Liberty',   app: '$495', monthly: '$7.70',  ppsr: '$8.00' },
];

const CREDIT_PROVIDERS = [
  ['Latitude Group', 'www.latitudefinancial.com.au'],
  ['MoneyMe Financial Group (autopay)', 'www.autopay.com.au'],
  ['WISR Finance', 'www.wisr.com.au'],
  ['Branded Financial Services', 'www.brandedfinancial.com.au'],
  ['Volkswagen Financial Services', 'www.vwfs.com.au'],
  ['Australian Motorcycle and Marine Finance', 'www.ammf.com.au'],
  ['Automotive Financial Services (AFS)', 'www.afs.com.au'],
  ['Westpac', 'www.westpac.com.au'],
  ['Commercial Equity Group', 'www.commercialequity.com.au'],
  ['Capital Finance Australia', 'www.capitalfinance.com.au'],
  ['RACV Finance', 'www.racv.com.au'],
  ['United Loan Solutions (Gedda Money)', 'www.gedda.com.au'],
  ['Secure Funding (Liberty)', 'www.liberty.com.au'],
  ['ANZ', 'www.anz.com.au'],
  ['Pepper Asset Finance', 'www.peppergroup.com.au'],
  ['Moula Money', 'www.moula.com.au'],
  ['Fin One', 'www.finone.com.au'],
  ['SocietyOne Australia', 'www.societyone.com.au'],
  ['Zwab Ventures (Biz Cap)', 'www.bizcap.com.au'],
  ['Business Fuel (Cash Advance)', 'www.businessfuel.com.au'],
  ['Money3 Loans', 'www.money3.com.au'],
  ['Metro Finance', 'www.metrofin.com.au'],
  ['Plenti RE', 'www.plenti.com.au'],
  ['Lumi Finance', 'www.lumi.com.au'],
  ['Azora Finance', 'www.azora.com.au'],
  ['Thornmoney', 'www.thorn.money'],
  ['Morris Finance', 'www.morrisfinance.com.au'],
  ['Scottish Pacific Business Finance', 'www.scotpac.com.au'],
  ['Firstmac', 'www.firstmac.com.au'],
  ['Flexicommercial', 'www.flexicommercial.com'],
  ['Ume Loans', 'www.umeloans.com.au'],
  ['Multipli', 'www.multipli.com.au'],
  ['Forward Finance', 'www.forwardfinance.com.au'],
  ['EarlyPay', 'www.earlypay.com.au'],
  ['Medfin Australia', 'www.medfin.com.au'],
  ['Judo Bank', 'www.judo.bank'],
  ['National Australia Bank (NAB)', 'www.nab.com.au'],
  ['CBA Asset Finance', 'www.commbank.com.au'],
  ['Affordable Car Loans', 'www.affordablecarloans.com.au'],
  ['Credit Corp Financial Services (Carstart)', 'www.carstart.com.au'],
  ['Now Finance', 'www.nowfinance.com.au'],
  ['Selfco (Auswide Bank)', 'www.selfco.com.au'],
  ['Group & General Finance', 'www.groupandgeneral.com'],
  ['Angle Finance', 'www.anglefinance.com.au'],
  ['Dynamoney', 'www.dynamoney.com'],
  ['Resimac Asset Finance', 'www.resimacassetfinance.com.au'],
  ['Bank of Queensland (BOQ Finance)', 'www.boqfinance.com.au'],
  ['Moneytech Group', 'www.moneytech.com.au'],
  ['Australian Premier Finance', 'www.australianpremierfinance.com.au'],
  ['Rapid Loans', 'www.rapidloans.com.au'],
  ['Gamma Duo Financial Services', 'www.gammaduo.com.au'],
  ['Allied Credit', 'www.alliedcredit.com.au'],
];

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h3 style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 400, color: 'var(--ink)', marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid var(--line)' }}>{title}</h3>
      {children}
    </div>
  );
}

function Para({ children }) {
  return <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--muted)', marginBottom: 12 }}>{children}</p>;
}

function Ul({ items }) {
  return (
    <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
      {items.map((it, i) => (
        <li key={i} style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--muted)', marginBottom: 4 }}>{it}</li>
      ))}
    </ul>
  );
}

function LicenseeBox() {
  return (
    <div style={{ background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 8, padding: '20px 24px', marginBottom: 40, fontSize: 14, lineHeight: 1.7, color: 'var(--muted)' }}>
      <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: 8 }}>{LICENSEE.name}</strong>
      <div>ABN {LICENSEE.abn} &nbsp;|&nbsp; ACN {LICENSEE.acn}</div>
      <div>{LICENSEE.address} &nbsp;|&nbsp; {LICENSEE.phone}</div>
      <div>Authorised Credit Representative #{LICENSEE.creditRep} of Australian Credit Licence #{LICENSEE.creditLicence} ({LICENSEE.licensor})</div>
    </div>
  );
}

function PrivacyCore() {
  return (
    <>
      <Section title="Overview">
        <Para>Cullen Financial Services Pty Ltd, ACN {LICENSEE.acn} ('we', 'us', 'our') collects information about you for the purpose you agree to in this Privacy Disclosure Statement and Consent. When you sign below, you agree we can, consistently with Australia's privacy and credit reporting laws, collect, use and exchange credit and personal information about you for those purposes.</Para>
        <Para>We are collecting credit and personal information about you to source consumer credit for personal, household, domestic or residential investment purposes; commercial credit for business purposes; or other services stated in this Privacy Disclosure Statement and Consent; or to support a guarantor application you will provide.</Para>
        <Para>If you do not provide the information sought we may be unable to process your application, or we may be limited in the other services we can offer you.</Para>
      </Section>

      <Section title="Your Information and Credit Reporting Body (CRB) Disclosures">
        <Para>When we collect information from you in the credit application process, we use that information to assess your credit application and to source a suitable credit provider. We may:</Para>
        <Ul items={[
          'Disclose your identification information to a CRB if you wish us to obtain a report on your behalf.',
          'Use any information the CRB provides to assist us to preliminary assess your consumer credit or guarantor application.',
          'Disclose your personal information to an insurer or insurers to source any insurances you wish to obtain.',
          'Disclose your credit information to a credit provider to apply for finance on your behalf.',
        ]} />
        <Para>The information we obtain from you is used, subject to compliance with Australia's privacy and credit reporting laws, only for the purposes listed in this Consent and is not disclosed to any other person except with your permission or as permitted, or required, by law.</Para>
      </Section>

      <Section title="Credit Providers">
        <Para>As part of providing our services to you, we may undertake tasks for a credit provider which is reasonably necessary to manage the application process. When doing so, we are acting as agent for the credit provider, with the same privacy law requirements applying to both of us.</Para>
        <Para>We may submit your application to one or more credit providers. Those credit providers and their website addresses are set out in the Schedule at the end of this document. A credit provider may disclose information about you to, and collect information about you from, one or more CRBs.</Para>
      </Section>

      <Section title="Your Rights">
        <Para>You have the right to ask:</Para>
        <Ul items={[
          'Us to provide you with all the information we hold about you.',
          'Us to correct the information we hold if it is incorrect.',
          'Us for copies of our privacy policy and this document.',
          'The CRB to not use your information for direct marketing assessment purposes, including pre-screening.',
          'The CRB to provide you with a copy of the information it holds about you.',
        ]} />
        <Para>You can gain access to the information we hold about you by contacting our Privacy Officer at {LICENSEE.address}, by telephone on {LICENSEE.phone}, or by email at {LICENSEE.email}.</Para>
      </Section>

      <Section title="Disclosure and Consent">
        <Para>By signing the consent form, you agree we may use your personal and credit information to assess your consumer or commercial credit application; to source any finance you require; to source any insurance you require; and as the law authorises or requires. You also authorise us to:</Para>
        <Ul items={[
          'Disclose to, and obtain from, any prospective credit provider or insurer, information about you reasonably necessary to obtain the finance and insurances required.',
          'Provide your information, including your credit report(s), to one or more of the credit providers in the Schedule below.',
          'Provide you with offers or information of other goods or services we may provide, unless you tell us not to.',
          'Disclose your personal and credit information to organisations that provide us with services, such as contractors, agents, lawyers, and computer systems providers.',
        ]} />
      </Section>

      <Section title="Authorisation">
        <Para>You authorise us to make a request on your behalf to obtain credit reporting information about your consumer and commercial credit worthiness from a CRB. That information will assist us in providing our services to you. This authorisation ceases when we undertake a task on behalf of a credit provider.</Para>
      </Section>

      <Section title="Complaints">
        <Para><strong style={{ color: 'var(--ink)' }}>Internal Dispute Resolution:</strong> If you have a complaint, please contact our office via email at {LICENSEE.email}. We will try to resolve all concerns quickly and fairly.</Para>
        <Para><strong style={{ color: 'var(--ink)' }}>External Dispute Resolution:</strong> In the unlikely event we cannot resolve your complaint satisfactorily, or you have not received a response after 45 days, you can escalate your complaint to the Australian Financial Complaints Authority (AFCA).</Para>
        <Ul items={[
          'Free call: 1800 931 678',
          'Website: www.afca.org.au',
          `The Buyer Assist Group AFCA membership number: ${LICENSEE.afca}`,
        ]} />
      </Section>
    </>
  );
}

function PersonalTab() {
  return (
    <div>
      <LicenseeBox />

      <Section title="Credit Guide Overview">
        <Para>The National Consumer Credit Protection Act 2009 states we must provide consumers with a Credit Guide and Quote as soon as practical after it becomes clear we are likely to provide credit assistance. The Credit Guide and Quote contains information on the service we provide, details of our obligations under the NCCP Act 2009, maximum fees and charges payable to us, a guide to the commissions we may receive from credit providers, and details of fees that may be payable by The Buyer Assist Group to third-party referrers.</Para>
      </Section>

      <Section title="Services We Provide">
        <Para>Our Credit Assistance services in sourcing and arranging a suitable loan include:</Para>
        <Ul items={[
          'Obtaining further information from employers, accountants, and credit reporting agencies.',
          'Investigating suitable loans and providing you with information about one or more loans that meet your objectives.',
          'Assessing, verifying and documenting information, ensuring the chosen loan is not unsuitable for you.',
          'Helping you complete the application, compiling the documents required by the credit provider and submitting the application.',
          'Liaising with the credit provider during the approval process and notifying you of the credit provider\'s decision.',
          'Assisting with the finalisation of the loan required.',
        ]} />
      </Section>

      <Section title="Our Obligations to Ensure Credit is Not Unsuitable">
        <Para>To help us ascertain a credit contract is not unsuitable, we are required by law to:</Para>
        <Ul items={[
          'Make reasonable enquiries about your requirements and objectives.',
          'Make reasonable enquiries about your current financial situation.',
          'Take reasonable steps to verify the information.',
        ]} />
        <Para>If at the time of assessment there is evidence suggesting you are unable to afford the repayments, or the credit will cause substantial hardship, or the credit will not meet your requirements, then the credit will be deemed unsuitable. We will complete a preliminary assessment of your requirements and financial position and must keep this assessment for 7 years. You may request a copy within 7 years of the assistance being provided.</Para>
      </Section>

      <Section title="Consent and Acknowledgement">
        <Para>By signing our consent form, acknowledging acceptance by submitting your enquiry, emailing your acceptance, e-signing, or responding by sending through your supporting documentation, you:</Para>
        <Ul items={[
          'Accept the quote provided for providing credit assistance.',
          'Confirm the appointment of the credit licensee to provide credit assistance and to arrange credit on your behalf.',
          'Authorise the Credit Licensee to perform the actions outlined in the Privacy Statement section of this document.',
          'Acknowledge that you have received a copy of the Credit Guide.',
        ]} />
      </Section>

      <Section title="Our Quote for Credit Assistance">
        <Para>We may charge you up to $2,500 (incl. GST) or up to 10% of Net Amount Financed as an Origination Fee for our services when providing credit assistance. This fee is only payable should the loan proceed. It is a one-off fee, payable at loan settlement. This fee may be paid directly to you, or as part of the loan disbursements. If via loan disbursement, this will increase your loan by the fee amount.</Para>
      </Section>

      <Section title="Indicative Lender Fees">
        <Para>The table below shows our most frequently used lenders, their estimated establishment fees and other fees that may be payable. Some lenders may charge a risk fee which can range between 1% and 10% of the car price.</Para>
        <div style={{ overflowX: 'auto', marginBottom: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--line)' }}>
                {['Lender', 'Application Fee', 'Monthly Fee', 'PPSR'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--ink)', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LENDER_FEES.map((l, i) => (
                <tr key={l.name} style={{ background: i % 2 === 0 ? 'transparent' : 'var(--cream)', borderBottom: '1px solid var(--line)' }}>
                  <td style={{ padding: '8px 12px', color: 'var(--ink)' }}>{l.name}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--muted)' }}>{l.app}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--muted)' }}>{l.monthly}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--muted)' }}>{l.ppsr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <PrivacyCore />

      <Section title="Schedule of Credit Providers">
        <Para>We may submit your application to any of the following credit providers:</Para>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
          {CREDIT_PROVIDERS.map(([name, url]) => (
            <div key={name} style={{ fontSize: 13, lineHeight: 1.5 }}>
              <span style={{ color: 'var(--ink)' }}>{name}</span>
              <span style={{ color: 'var(--muted)', display: 'block' }}>{url}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function BusinessTab() {
  return (
    <div>
      <LicenseeBox />
      <PrivacyCore />
      <Section title="Schedule of Credit Providers">
        <Para>We may submit your application to any of the following credit providers:</Para>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
          {CREDIT_PROVIDERS.map(([name, url]) => (
            <div key={name} style={{ fontSize: 13, lineHeight: 1.5 }}>
              <span style={{ color: 'var(--ink)' }}>{name}</span>
              <span style={{ color: 'var(--muted)', display: 'block' }}>{url}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function PrivacyPage() {
  const [tab, setTab] = useStatePrivacy('personal');

  return (
    <main data-screen-label="Privacy">
      <section className="page-head">
        <div className="container">
          <div className="head-grid">
            <div>
              <div className="eyebrow on-dark"><span className="dot"></span>Legal &amp; compliance</div>
              <h1 className="h1" style={{ color: 'var(--cream)' }}>Privacy &amp; Credit Guide</h1>
            </div>
            <p className="head-meta">Our obligations under the National Consumer Credit Protection Act 2009 (NCCP), and how we collect, use and protect your information.</p>
          </div>
        </div>
      </section>

      <section className="section paper">
        <div className="container" style={{ maxWidth: 860 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
            {[
              { id: 'personal', label: 'Personal Finance' },
              { id: 'business', label: 'Business Finance' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`ptab ${tab === t.id ? 'active' : ''}`}
              >{t.label}</button>
            ))}
          </div>

          {tab === 'personal' && <PersonalTab />}
          {tab === 'business' && <BusinessTab />}
        </div>
      </section>
    </main>
  );
}

Object.assign(window, { PrivacyPage });
