import { useMemo, useState } from "react";
import { type CityItem } from "../data/mock";
import { useCityCatalog } from "../data/cityCatalogStore";
import { useRegions } from "../data/regionsStore";
import { PageHead } from "../AppShell";

const PAGE_SIZE = 8;

type CityForm = {
  name: string;
  regionId: string;
  description: string;
};

type RegionForm = {
  name: string;
  description: string;
};

const emptyCityForm: CityForm = { name: "", regionId: "", description: "" };
const emptyRegionForm: RegionForm = { name: "", description: "" };

export function Cities() {
  const { cityCatalog, addCity, updateCity, deleteCity } = useCityCatalog();
  const { regions, addRegion } = useRegions();
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: string } | null>(null);
  const [form, setForm] = useState<CityForm>(emptyCityForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [regionForm, setRegionForm] = useState<RegionForm>(emptyRegionForm);

  const pageCount = Math.max(1, Math.ceil(cityCatalog.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => cityCatalog.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [cityCatalog, current],
  );

  const set = <K extends keyof CityForm>(key: K, value: CityForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setForm({ ...emptyCityForm, regionId: regions[0]?.id ?? "" });
    setModal({ mode: "create" });
  };

  const openEdit = (c: CityItem) => {
    setForm({ name: c.name, regionId: c.regionId, description: c.description ?? "" });
    setModal({ mode: "edit", id: c.id });
  };

  const submit = () => {
    if (!form.name.trim() || !form.regionId) return;
    const payload = {
      name: form.name.trim(),
      regionId: form.regionId,
      description: form.description,
    };
    if (modal?.mode === "edit" && modal.id) {
      updateCity(modal.id, payload);
    } else {
      addCity(payload);
    }
    setModal(null);
  };

  const remove = (id: string) => {
    deleteCity(id);
    setConfirmDeleteId(null);
  };

  const openRegionModal = () => {
    setRegionForm(emptyRegionForm);
    setRegionModalOpen(true);
  };

  const submitRegion = () => {
    if (!regionForm.name.trim()) return;
    const id = addRegion({ name: regionForm.name.trim(), description: regionForm.description });
    set("regionId", id);
    setRegionModalOpen(false);
  };

  return (
    <>
      <PageHead
        title="Города"
        actions={
          <button type="button" className="btn primary" onClick={openCreate}>
            + Добавить город
          </button>
        }
      />

      <div className="card">
        {pageItems.length === 0 && <p className="muted">Городов пока нет.</p>}
        {pageItems.map((c) => {
          const region = regions.find((r) => r.id === c.regionId);
          return (
            <div className="owner-row" key={c.id}>
              <div className="owner-row-main">
                <b>{c.name}</b>
                <div className="muted">{region?.name ?? "Без региона"}</div>
                {c.description && <p className="muted pkg-row-desc">{c.description}</p>}
              </div>
              {confirmDeleteId === c.id ? (
                <div className="owner-row-confirm">
                  <span>Удалить?</span>
                  <button type="button" className="btn btn-sm danger" onClick={() => remove(c.id)}>
                    Да
                  </button>
                  <button type="button" className="btn btn-sm" onClick={() => setConfirmDeleteId(null)}>
                    Отмена
                  </button>
                </div>
              ) : (
                <div className="owner-row-actions">
                  <button type="button" className="btn btn-sm" onClick={() => openEdit(c)}>
                    Изменить
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm danger"
                    onClick={() => setConfirmDeleteId(c.id)}
                  >
                    Удалить
                  </button>
                </div>
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
              <h2>{modal.mode === "edit" ? "Редактировать город" : "Новый город"}</h2>
              <button type="button" className="modal-close" onClick={() => setModal(null)} aria-label="Закрыть">
                ✕
              </button>
            </div>
            <div className="edit-form">
              <label className="field">
                <span className="field-label">Название</span>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
              </label>
              <label className="field">
                <span className="field-label">Регион</span>
                <div className="region-pick">
                  <select value={form.regionId} onChange={(e) => set("regionId", e.target.value)}>
                    {regions.length === 0 && <option value="">Нет регионов</option>}
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={openRegionModal}
                    aria-label="Добавить регион"
                    title="Добавить регион"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                </div>
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
            <div className="modal-actions">
              <button
                type="button"
                className="btn primary"
                disabled={!form.name.trim() || !form.regionId}
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

      {regionModalOpen && (
        <div className="modal-backdrop" onClick={() => setRegionModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Новый регион</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setRegionModalOpen(false)}
                aria-label="Закрыть"
              >
                ✕
              </button>
            </div>
            <div className="edit-form">
              <label className="field">
                <span className="field-label">Название</span>
                <input
                  value={regionForm.name}
                  onChange={(e) => setRegionForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </label>
              <label className="field">
                <span className="field-label">Описание</span>
                <textarea
                  rows={3}
                  value={regionForm.description}
                  onChange={(e) => setRegionForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn primary"
                disabled={!regionForm.name.trim()}
                onClick={submitRegion}
              >
                Создать
              </button>
              <button type="button" className="btn" onClick={() => setRegionModalOpen(false)}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
