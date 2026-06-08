const stages = [
  {
    label: "Stage 1",
    title: "Foundation",
    description: "Fastify API, React dashboard, TypeScript, and Render-ready scripts.",
    status: "Done"
  },
  {
    label: "Stage 2",
    title: "Storage + Queue",
    description: "Postgres, pgvector, Redis, and background job plumbing.",
    status: "Done"
  },
  {
    label: "Stage 3",
    title: "GitHub App",
    description: "Webhook verification, installations, repositories, and Octokit auth.",
    status: "Next"
  },
  {
    label: "Stage 4",
    title: "Repository Indexing",
    description: "Fetch files, chunk code, create embeddings, and store searchable context.",
    status: "Planned"
  },
  {
    label: "Stage 5",
    title: "PR Review",
    description: "Review pull requests with RAG and post a summary comment on GitHub.",
    status: "Planned"
  }
];

export function App() {
  return (
    <main className="shell">
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">PatchWise MVP</p>
        <h1 id="page-title">AI pull request reviews with repo-aware context.</h1>
        <p className="lede">
          PatchWise is being built as a lightweight GitHub App for Render. The
          MVP now has its app foundation, database schema, vector storage plan,
          and Redis-backed background job plumbing.
        </p>
      </section>

      <section className="status-panel" aria-labelledby="status-title">
        <div>
          <p className="eyebrow">Current Stage</p>
          <h2 id="status-title">Stage 2: Storage + Queue</h2>
        </div>
        <span className="status-pill">Ready for PR</span>
      </section>

      <section className="stage-grid" aria-label="MVP stages">
        {stages.map((stage, index) => (
          <article className="stage-card" key={stage.label}>
            <div className="stage-number">{index + 1}</div>
            <p>
              {stage.label} <strong>{stage.status}</strong>
            </p>
            <h3>{stage.title}</h3>
            <span>{stage.description}</span>
          </article>
        ))}
      </section>
    </main>
  );
}
