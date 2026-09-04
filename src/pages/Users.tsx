import { useMemo, useRef, useState } from "react";
import { type PlatformUser } from "../data/mock";
import { useUsers } from "../data/usersStore";
import { randomPassword, slugify } from "../lib/format";
import { PageHead } from "../AppShell";

const PAGE_SIZE = 12;

type UserForm = {
  firstName: string;
  lastName: string;
  email: string;
  login: string;
  password: string;
  image: string;
};

const emptyUserForm: UserForm = {
  firstName: "",
  lastName: "",
  email: "",
  login: "",
  password: "",
  image: "",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function Users() {
  const { users, addUser, updateUser, deleteUser } = useUsers();
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: string } | null>(null);
  const [form, setForm] = useState<UserForm>(emptyUserForm);
  const [loginTouched, setLoginTouched] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pageCount = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => users.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [users, current],
  );

  const setField = <K extends keyof UserForm>(key: K, value: UserForm[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if ((key === "firstName" || key === "lastName") && !loginTouched) {
        next.login = slugify(`${next.firstName} ${next.lastName}`.trim());
      }
      return next;
    });
    if (key === "login") setLoginTouched(true);
  };

  const openCreate = () => {
    setForm({ ...emptyUserForm, password: randomPassword() });
    setLoginTouched(false);
    setPasswordCopied(false);
    setModal({ mode: "create" });
  };

  const openEdit = (u: PlatformUser) => {
    const [firstName, ...rest] = u.name.split(" ");
    setForm({
      firstName: firstName ?? "",
      lastName: rest.join(" "),
      email: u.email,
      login: u.login ?? "",
      password: u.password ?? "",
      image: u.image ?? "",
    });
    setLoginTouched(true);
    setPasswordCopied(false);
    setModal({ mode: "edit", id: u.id });
  };

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setField("image", String(reader.result));
    reader.readAsDataURL(file);
  };

  const copyPassword = () => {
    if (!form.password) return;
    navigator.clipboard?.writeText(form.password).catch(() => {});
    setPasswordCopied(true);
    window.setTimeout(() => setPasswordCopied(false), 1500);
  };

  const submit = () => {
    const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
    if (!name) return;
    const payload = {
      name,
      email: form.email,
      login: form.login,
      password: form.password,
      image: form.image,
    };
    if (modal?.mode === "edit" && modal.id) {
      updateUser(modal.id, payload);
    } else {
      addUser({ ...payload, role: "user", companyId: "" });
    }
    setModal(null);
  };

  const remove = (id: string) => {
    deleteUser(id);
    setConfirmDeleteId(null);
  };

  return (
    <>
      <PageHead
        title="Пользователи платформы"
        actions={
          <button type="button" className="btn primary" onClick={openCreate}>
            + Новый пользователь
          </button>
        }
      />

      <div className="user-grid">
        {pageItems.map((u) => {
          const isConfirming = confirmDeleteId === u.id;
          return (
            <div className="user-card" key={u.id}>
              <div className="user-avatar-wrap">
                {u.image ? (
                  <img src={u.image} alt={u.name} />
                ) : (
                  <div className="user-avatar-fallback">{initials(u.name)}</div>
                )}
                <div className="user-avatar-overlay">
                  <button
                    type="button"
                    className="avatar-icon-btn"
                    onClick={() => openEdit(u)}
                    aria-label="Редактировать"
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="avatar-icon-btn danger"
                    onClick={() => setConfirmDeleteId(u.id)}
                    aria-label="Удалить"
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6" />
                    </svg>
                  </button>
                </div>
              </div>

              {isConfirming ? (
                <div className="user-card-confirm">
                  <span>Удалить?</span>
                  <div className="user-card-confirm-actions">
                    <button type="button" className="btn btn-sm danger" onClick={() => remove(u.id)}>
                      Да
                    </button>
                    <button type="button" className="btn btn-sm" onClick={() => setConfirmDeleteId(null)}>
                      Нет
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <b>{u.name}</b>
                  <div className="muted user-card-sub">{u.email}</div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {pageCount > 1 && (
        <div className="pagination">
          <button type="button" disabled={current === 1} onClick={() => setPage((p) => p - 1)}>
            Назад
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={n === current ? "active" : ""}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}
          <button type="button" disabled={current === pageCount} onClick={() => setPage((p) => p + 1)}>
            Вперёд
          </button>
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{modal.mode === "edit" ? "Редактировать пользователя" : "Новый пользователь"}</h2>
              <button type="button" className="modal-close" onClick={() => setModal(null)} aria-label="Закрыть">
                ✕
              </button>
            </div>
            <div className="edit-form">
              <label className="field">
                <span className="field-label">Изображение</span>
                <div className="image-pick">
                  <div className="image-pick-preview">
                    {form.image ? <img src={form.image} alt="" /> : <span>Нет фото</span>}
                  </div>
                  <button type="button" className="btn" onClick={() => fileInputRef.current?.click()}>
                    Выбрать изображение
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => pickImage(e.target.files?.[0])}
                  />
                </div>
              </label>
              <div className="field-row">
                <label className="field">
                  <span className="field-label">Имя</span>
                  <input value={form.firstName} onChange={(e) => setField("firstName", e.target.value)} autoFocus />
                </label>
                <label className="field">
                  <span className="field-label">Фамилия</span>
                  <input value={form.lastName} onChange={(e) => setField("lastName", e.target.value)} />
                </label>
              </div>
              <label className="field">
                <span className="field-label">Email</span>
                <input value={form.email} onChange={(e) => setField("email", e.target.value)} />
              </label>
              <label className="field">
                <span className="field-label">Логин</span>
                <input value={form.login} onChange={(e) => setField("login", e.target.value)} />
              </label>
              <label className="field">
                <span className="field-label">Пароль</span>
                <div className="password-gen">
                  <input value={form.password} onChange={(e) => setField("password", e.target.value)} />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={copyPassword}
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
                  <button type="button" className="btn btn-sm" onClick={() => setField("password", randomPassword())}>
                    Сгенерировать
                  </button>
                </div>
              </label>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn primary"
                disabled={!form.firstName.trim()}
                onClick={submit}
              >
                {modal.mode === "edit" ? "Сохранить" : "Создать"}
              </button>
              <button type="button" className="btn" onClick={() => setModal(null)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
