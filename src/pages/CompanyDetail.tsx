import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { type Company, type PlatformUser } from "../data/mock";
import { useCompanies } from "../data/companiesStore";
import { useUsers } from "../data/usersStore";
import { randomPassword, slugify } from "../lib/format";
import { PageHead } from "../AppShell";

type OwnerForm = { name: string; email: string; phone: string; login: string; password: string };

const emptyOwnerForm: OwnerForm = { name: "", email: "", phone: "", login: "", password: "" };

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

export function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { getCompany, updateCompany, deleteCompany } = useCompanies();
  const { users, addUser, updateUser, deleteUser } = useUsers();
  const company = id ? getCompany(id) : undefined;
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [form, setForm] = useState<Company | null>(company ?? null);

  const [ownerModal, setOwnerModal] = useState<{ mode: "create" | "edit"; id?: string } | null>(null);
  const [ownerForm, setOwnerForm] = useState<OwnerForm>(emptyOwnerForm);
  const [loginTouched, setLoginTouched] = useState(false);
  const [confirmDeleteOwnerId, setConfirmDeleteOwnerId] = useState<string | null>(null);
  const [copiedOwnerId, setCopiedOwnerId] = useState<string | null>(null);
  const [passwordCopied, setPasswordCopied] = useState(false);

  if (!company) {
    return (
      <>
        <PageHead title="Компания не найдена" onBack={() => nav("/companies")} />
        <div className="card">
          <p className="muted">Такой компании больше нет в списке.</p>
          <button type="button" className="btn" onClick={() => nav("/companies")}>
            К списку компаний
          </button>
        </div>
      </>
    );
  }

  const owners = users.filter((u) => u.companyId === company.id && u.role === "owner");

  const openCreateOwner = () => {
    setOwnerForm({ ...emptyOwnerForm, password: randomPassword() });
    setLoginTouched(false);
    setPasswordCopied(false);
    setOwnerModal({ mode: "create" });
  };

  const openEditOwner = (o: PlatformUser) => {
    setOwnerForm({ name: o.name, email: o.email, phone: o.phone ?? "", login: o.login ?? "", password: o.password ?? "" });
    setLoginTouched(true);
    setPasswordCopied(false);
    setOwnerModal({ mode: "edit", id: o.id });
  };

  const setOwnerField = <K extends keyof OwnerForm>(key: K, value: OwnerForm[K]) => {
    setOwnerForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "name" && !loginTouched) next.login = slugify(value as string);
      return next;
    });
    if (key === "login") setLoginTouched(true);
  };

  const submitOwner = () => {
    if (!ownerForm.name.trim()) return;
    if (ownerModal?.mode === "edit" && ownerModal.id) {
      updateUser(ownerModal.id, { ...ownerForm, role: "owner", companyId: company.id });
    } else {
      addUser({ ...ownerForm, role: "owner", companyId: company.id });
    }
    setOwnerModal(null);
  };

  const removeOwner = (ownerId: string) => {
    deleteUser(ownerId);
    setConfirmDeleteOwnerId(null);
  };

  const copyPassword = (o: PlatformUser) => {
    if (!o.password) return;
    navigator.clipboard?.writeText(o.password).catch(() => {});
    setCopiedOwnerId(o.id);
    window.setTimeout(() => setCopiedOwnerId((cur) => (cur === o.id ? null : cur)), 1500);
  };

  const copyModalPassword = () => {
    if (!ownerForm.password) return;
    navigator.clipboard?.writeText(ownerForm.password).catch(() => {});
    setPasswordCopied(true);
    window.setTimeout(() => setPasswordCopied(false), 1500);
  };

  const startEdit = () => {
    setForm(company);
    setEditing(true);
  };

  const cancelEdit = () => {
    setForm(company);
    setEditing(false);
  };

  const save = () => {
    if (!form) return;
    updateCompany(company.id, form);
    setEditing(false);
  };

  const remove = () => {
    deleteCompany(company.id);
    nav("/companies");
  };

  const set = <K extends keyof Company>(key: K, value: Company[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  return (
    <>
      <PageHead title={company.name} sub="карточка компании" onBack={() => nav("/companies")} />

      <div className="detail-layout">
        <div className="card detail-media">
          <img src={company.image} alt={company.name} />
          <div className="detail-actions">
            {editing ? (
              <>
                <button type="button" className="btn primary" onClick={save}>
                  Сохранить
                </button>
                <button type="button" className="btn" onClick={cancelEdit}>
                  Отмена
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn" onClick={startEdit}>
                  Редактировать
                </button>
                <button type="button" className="btn danger" onClick={() => setConfirmingDelete(true)}>
                  Удалить
                </button>
              </>
            )}
          </div>
          {confirmingDelete && (
            <div className="confirm-box">
              <p>
                Удалить компанию «{company.name}»? Это действие необратимо.
              </p>
              <div className="confirm-box-actions">
                <button type="button" className="btn danger" onClick={remove}>
                  Да, удалить
                </button>
                <button type="button" className="btn" onClick={() => setConfirmingDelete(false)}>
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card detail-info">
          {editing && form ? (
            <div className="edit-form">
              <label className="field">
                <span className="field-label">Название</span>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} />
              </label>
              <label className="field">
                <span className="field-label">Город</span>
                <input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </label>
              <div className="field-row">
                <label className="field">
                  <span className="field-label">Пакет</span>
                  <select
                    value={form.package}
                    onChange={(e) => set("package", e.target.value as Company["package"])}
                  >
                    <option value="basic">basic</option>
                    <option value="pro">pro</option>
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">Статус</span>
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value as Company["status"])}
                  >
                    <option value="active">Активна</option>
                    <option value="trial">Триал</option>
                    <option value="suspended">Приостановлена</option>
                  </select>
                </label>
              </div>
              <label className="field">
                <span className="field-label">Телефон</span>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </label>
              <label className="field">
                <span className="field-label">Email</span>
                <input value={form.email} onChange={(e) => set("email", e.target.value)} />
              </label>
              <label className="field">
                <span className="field-label">Адрес</span>
                <input value={form.address} onChange={(e) => set("address", e.target.value)} />
              </label>
              <label className="field">
                <span className="field-label">Описание</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </label>
            </div>
          ) : (
            <>
              <div className="detail-tags">
                <span className="badge st-available">{company.package}</span>
                <span className={`badge ${statusClass[company.status]}`}>
                  {statusLabel[company.status]}
                </span>
              </div>
              <p className="detail-desc">{company.description}</p>
              <dl className="detail-dl">
                <div>
                  <dt>Город</dt>
                  <dd>{company.city}</dd>
                </div>
                <div>
                  <dt>Адрес</dt>
                  <dd>{company.address}</dd>
                </div>
                <div>
                  <dt>Телефон</dt>
                  <dd>{company.phone}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{company.email}</dd>
                </div>
                <div>
                  <dt>Создана</dt>
                  <dd>{company.createdAt}</dd>
                </div>
                <div>
                  <dt>Владельцев</dt>
                  <dd>{owners.length}</dd>
                </div>
              </dl>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="list-head">
          <h3>Владельцы</h3>
          <button type="button" className="btn primary btn-sm" onClick={openCreateOwner}>
            + Добавить владельца
          </button>
        </div>
        {owners.length === 0 && <p className="muted">Пока нет владельцев.</p>}
        {owners.map((o) => (
          <div className="owner-row" key={o.id}>
            <div className="owner-row-main">
              <b>{o.name}</b>
              <div className="muted">
                {o.email}
                {o.phone ? ` · ${o.phone}` : ""}
              </div>
              {o.login && <div className="muted">Логин: {o.login}</div>}
            </div>
            {confirmDeleteOwnerId === o.id ? (
              <div className="owner-row-confirm">
                <span>Удалить?</span>
                <button type="button" className="btn btn-sm danger" onClick={() => removeOwner(o.id)}>
                  Да
                </button>
                <button type="button" className="btn btn-sm" onClick={() => setConfirmDeleteOwnerId(null)}>
                  Отмена
                </button>
              </div>
            ) : (
              <div className="owner-row-actions">
                {o.password && (
                  <button type="button" className="btn btn-sm" onClick={() => copyPassword(o)}>
                    {copiedOwnerId === o.id ? "Скопировано" : "Копировать пароль"}
                  </button>
                )}
                <button type="button" className="btn btn-sm" onClick={() => openEditOwner(o)}>
                  Изменить
                </button>
                <button
                  type="button"
                  className="btn btn-sm danger"
                  onClick={() => setConfirmDeleteOwnerId(o.id)}
                >
                  Удалить
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {ownerModal && (
        <div className="modal-backdrop" onClick={() => setOwnerModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{ownerModal.mode === "edit" ? "Редактировать владельца" : "Новый владелец"}</h2>
              <button type="button" className="modal-close" onClick={() => setOwnerModal(null)} aria-label="Закрыть">
                ✕
              </button>
            </div>
            <div className="edit-form">
              <label className="field">
                <span className="field-label">ФИО</span>
                <input value={ownerForm.name} onChange={(e) => setOwnerField("name", e.target.value)} autoFocus />
              </label>
              <label className="field">
                <span className="field-label">Email</span>
                <input value={ownerForm.email} onChange={(e) => setOwnerField("email", e.target.value)} />
              </label>
              <label className="field">
                <span className="field-label">Телефон</span>
                <input value={ownerForm.phone} onChange={(e) => setOwnerField("phone", e.target.value)} />
              </label>
              <label className="field">
                <span className="field-label">Логин</span>
                <input value={ownerForm.login} onChange={(e) => setOwnerField("login", e.target.value)} />
              </label>
              <label className="field">
                <span className="field-label">Пароль</span>
                <div className="password-gen">
                  <input value={ownerForm.password} onChange={(e) => setOwnerField("password", e.target.value)} />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={copyModalPassword}
                    aria-label="Копировать пароль"
                    title={passwordCopied ? "Скопировано" : "Копировать пароль"}
                  >
                    {passwordCopied ? (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="12" height="12" rx="2" />
                        <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setOwnerField("password", randomPassword())}
                  >
                    Сгенерировать
                  </button>
                </div>
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn primary" disabled={!ownerForm.name.trim()} onClick={submitOwner}>
                {ownerModal.mode === "edit" ? "Сохранить" : "Создать"}
              </button>
              <button type="button" className="btn" onClick={() => setOwnerModal(null)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
