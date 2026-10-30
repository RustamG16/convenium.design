import { Link } from 'react-router';

interface StubPageProps {
  title: string;
  route: string;
  task: string;
  note: string;
}

/** A route that exists but whose screen is built in a later task. Labelled so it cannot pass for finished. */
export function StubPage({ title, route, task, note }: StubPageProps) {
  return (
    <main id="main" className="page stub" data-testid="stub-page">
      <p className="label">Stub · {task}</p>
      <h1 className="page-title">{title}</h1>
      <p className="prose">{note}</p>
      <p className="stat">
        Route <code>{route}</code>
      </p>
      <p>
        <Link className="btn btn-quiet" to="/">
          Back to the Hangar
        </Link>
      </p>
    </main>
  );
}
