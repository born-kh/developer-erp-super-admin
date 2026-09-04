import { companies, users } from "../data/mock";
import { PageHead } from "../AppShell";

export function Users() {
  return (
    <>
      <PageHead title="Пользователи платформы" />
      <div className="card">
        {users.map((u) => {
          const co = companies.find((c) => c.id === u.companyId);
          return (
            <div className="pay-item" key={u.id}>
              <div>
                <b>{u.name}</b>
                <div className="muted">
                  {co?.name} · {u.email}
                </div>
              </div>
              <span className="badge st-hold">{u.role}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
