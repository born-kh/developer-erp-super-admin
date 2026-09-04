import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cities, users, type Company } from "../data/mock";
import { useCompanies } from "../data/companiesStore";
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

const PAGE_SIZE = 8;

const emptyForm: Omit<Company, "id"> = {
  name: "",
  city: cities[0],
  package: "basic",
  status: "trial",
  image: "",
  phone: "",
  email: "",
  address: "",
  createdAt: new Date().toISOString().slice(0, 10),
  description: "",
};

export function Companies() {
  const nav = useNavigate();
  const { companies, addCompany } = useCompanies();
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Omit<Company, "id">>(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pageCount = Math.max(1, Math.ceil(companies.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => companies.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [companies, current],
  );

  const set = <K extends keyof Omit<Company, "id">>(key: K, value: Company[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setForm(emptyForm);
    setShowCreate(true);
  };

  const pickImage = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => set("image", String(reader.result));
    reader.readAsDataURL(file);
  };

  const submitCreate = () => {
    if (!form.name.trim()) return;
    const id = addCompany({
      ...form,
      image: form.image.trim() || `https://picsum.photos/seed/${encodeURIComponent(form.name)}/480/320`,
    });
    setShowCreate(false);
    nav(`/companies/${id}`);
  };

  return (
    <>
      <PageHead
        title="Компании"
        sub="создание и управление тенантами"
        actions={
          <button type="button" className="btn primary" onClick={openCreate}>
            + Новая компания
          </button>
        }
      />
      <div className="company-grid">
        {pageItems.map((c) => (
          <div
            className="company-card"
            key={c.id}
            role="button"
            tabIndex={0}
            onClick={() => nav(`/companies/${c.id}`)}
            onKeyDown={(e) => e.key === "Enter" && nav(`/companies/${c.id}`)}
          >
            <div className="company-card-img">
              <img src={c.image} alt={c.name} loading="lazy" />
            </div>
            <div className="company-card-body">
              <b>{c.name}</b>
              <div className="muted">{c.city}</div>
              <div className="company-card-tags">
                <span className="badge st-available">{c.package}</span>
                <span className={`badge ${statusClass[c.status]}`}>{statusLabel[c.status]}</span>
              </div>
              <div className="muted company-card-users">
                {users.filter((u) => u.companyId === c.id).length} пользователей
              </div>
            </div>
          </div>
        ))}
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

      <p className="muted" style={{ marginTop: 16 }}>
        Данные компаний изолированы. Каждая компания работает только внутри своего пакета.
      </p>

      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Новая компания</h2>
              <button type="button" className="modal-close" onClick={() => setShowCreate(false)} aria-label="Закрыть">
                ✕
              </button>
            </div>
            <div className="edit-form">
              <label className="field">
                <span className="field-label">Название</span>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
              </label>
              <label className="field">
                <span className="field-label">Город</span>
                <select value={form.city} onChange={(e) => set("city", e.target.value)}>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </label>
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
                  <span className="field-label">Пакет</span>
                  <select value={form.package} onChange={(e) => set("package", e.target.value as Company["package"])}>
                    <option value="basic">basic</option>
                    <option value="pro">pro</option>
                  </select>
                </label>
                <label className="field">
                  <span className="field-label">Статус</span>
                  <select value={form.status} onChange={(e) => set("status", e.target.value as Company["status"])}>
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
                <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn primary" disabled={!form.name.trim()} onClick={submitCreate}>
                Создать
              </button>
              <button type="button" className="btn" onClick={() => setShowCreate(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
