import { roleCards } from "../data/mock";
import { PageHead } from "../AppShell";

export function Roles() {
  return (
    <>
      <PageHead title="Роли и права" sub="уровень платформы и компании" />
      <div className="grid g-2">
        {roleCards.map((r) => (
          <div className="card" key={r.title}>
            <h3>{r.title}</h3>
            <div className="muted">{r.text}</div>
          </div>
        ))}
      </div>
    </>
  );
}
