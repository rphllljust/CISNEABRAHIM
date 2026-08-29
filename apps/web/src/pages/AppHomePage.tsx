export function AppHomePage() {
  return (
    <main id="main-content" className="shell-page">
      <h1>Technical home</h1>
      <p>
        Authenticated application shell. No business modules, dashboards, or simulated metrics are
        available in this phase.
      </p>
      <section aria-labelledby="shell-capabilities-heading">
        <h2 id="shell-capabilities-heading">Navigation</h2>
        <p>
          Structural menu items may reflect candidate capabilities. The backend remains the
          authority for access decisions.
        </p>
      </section>
    </main>
  );
}
