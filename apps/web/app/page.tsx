import { apiIsLive } from './api-health';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const live = await apiIsLive();

  return (
    <main className="shell">
      <header className="header">
        <span className="brand">Construct<span>AI</span></span>
        <span className="environment">Local development</span>
      </header>
      <section className="hero" aria-labelledby="title">
        <p className="eyebrow">PRODUCT FOUNDATION / M00</p>
        <h1 id="title">An intelligent operating system for construction.</h1>
        <p className="intro">Projects, documents and finance will share one secure workspace. This initial screen verifies the connection between the web application and the local API.</p>
      </section>
      <section className="panel" aria-labelledby="health-heading">
        <h2 id="health-heading">Service status</h2>
        <div className="service">
          <div><strong>ConstructAI API</strong><p>Liveness only — not database or worker readiness.</p></div>
          <span className={live ? 'live' : 'offline'} role="status">{live ? 'Responding' : 'Unavailable'}</span>
        </div>
        <p className="note">Organization access, financial records, document processing and Atlas AI are not implemented yet.</p>
      </section>
    </main>
  );
}
