import { income } from "../data/mock";
import { useCompanies } from "../data/companiesStore";
import { useUsers } from "../data/usersStore";
import { usePackages } from "../data/packagesStore";
import { useTariffs } from "../data/tariffsStore";
import { useCityCatalog } from "../data/cityCatalogStore";
import { usd } from "../lib/format";
import { PageHead } from "../AppShell";

export function Overview() {
  const { companies } = useCompanies();
  const { users } = useUsers();
  const { packages } = usePackages();
  const { tariffs } = useTariffs();
  const { cityCatalog } = useCityCatalog();

  const activeCompanies = companies.filter((c) => c.status === "active").length;
  const activePackages = packages.filter((p) => p.active).length;
  const activeTariffs = tariffs.filter((t) => t.active).length;

  return (
    <>
      <PageHead title="Обзор платформы" sub="сводка по тенантам" />
      <div className="grid g-3">
        <div className="card kpi hero">
          <div className="label">Компании</div>
          <div className="value">{companies.length}</div>
          <div className="hint">{activeCompanies} активных</div>
        </div>
        <div className="card kpi">
          <div className="label">Доход</div>
          <div className="value">{usd(income.thisMonth)}</div>
          <div className="hint">Прошлый месяц: {usd(income.lastMonth)}</div>
        </div>
        <div className="card kpi">
          <div className="label">Пользователи</div>
          <div className="value">{users.length}</div>
          <div className="hint">во всех тенантах</div>
        </div>
        <div className="card kpi">
          <div className="label">Пакеты</div>
          <div className="value">{packages.length}</div>
          <div className="hint">{activePackages} активных</div>
        </div>
        <div className="card kpi">
          <div className="label">Тарифы</div>
          <div className="value">{tariffs.length}</div>
          <div className="hint">{activeTariffs} активных</div>
        </div>
        <div className="card kpi">
          <div className="label">Города</div>
          <div className="value">{cityCatalog.length}</div>
          <div className="hint">во всех регионах</div>
        </div>
      </div>
    </>
  );
}
