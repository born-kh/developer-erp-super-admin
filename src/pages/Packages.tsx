import { packages } from "../data/mock";
import { usd } from "../lib/format";
import { PageHead } from "../AppShell";

export function Packages() {
  return (
    <>
      <PageHead title="Пакеты и тарифы" />
      <div className="grid g-2">
        {packages.map((p) => (
          <div className="card kpi" key={p.id}>
            <div className="label">{p.active ? "Активен" : "Скоро"}</div>
            <div className="value">{p.name}</div>
            <div className="hint">{usd(p.price)} / мес</div>
            <ul className="muted" style={{ paddingLeft: 18 }}>
              {p.modules.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}
