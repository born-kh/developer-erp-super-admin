import { companies, packages, users } from "../data/mock";
import { usd } from "../lib/format";
import { PageHead } from "../AppShell";

export function Overview() {
  const active = companies.filter((c) => c.status === "active").length;
  const livePackage = packages.find((p) => p.active);

  return (
    <>
      <PageHead title="Обзор платформы" sub="сводка по тенантам" />
      <div className="grid g-3">
        <div className="card kpi hero">
          <div className="label">Компании</div>
          <div className="value">{companies.length}</div>
          <div className="hint">{active} активных</div>
        </div>
        <div className="card kpi">
          <div className="label">Пользователи</div>
          <div className="value">{users.length}</div>
          <div className="hint">во всех тенантах</div>
        </div>
        <div className="card kpi">
          <div className="label">Текущий пакет</div>
          <div className="value">{livePackage?.name ?? "—"}</div>
          <div className="hint">{livePackage ? `${usd(livePackage.price)} / мес` : ""}</div>
        </div>
      </div>
    </>
  );
}
