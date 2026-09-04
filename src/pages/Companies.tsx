import { companies, users } from "../data/mock";
import { PageHead } from "../AppShell";

const statusLabel: Record<string, string> = {
  active: "Активна",
  trial: "Триал",
  suspended: "Приостановлена",
};

const statusClass: Record<string, string> = {
  active: "st-available",
  trial: "st-reserved",
  suspended: "st-sold",
};

export function Companies() {
  return (
    <>
      <PageHead title="Компании" sub="создание и управление тенантами" />
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Компания</th>
              <th>Город</th>
              <th>Пакет</th>
              <th>Статус</th>
              <th>Пользователей</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td>
                  <b>{c.name}</b>
                </td>
                <td>{c.city}</td>
                <td>
                  <span className="badge st-available">{c.package}</span>
                </td>
                <td>
                  <span className={`badge ${statusClass[c.status]}`}>{statusLabel[c.status]}</span>
                </td>
                <td>{users.filter((u) => u.companyId === c.id).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted" style={{ marginTop: 12 }}>
          Данные компаний изолированы. Каждая компания работает только внутри своего пакета.
        </p>
      </div>
    </>
  );
}
