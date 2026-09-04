import { useMemo, useState } from "react";
import { type PackagePlan } from "../data/mock";
import { usePackages } from "../data/packagesStore";
import { PageHead } from "../AppShell";

const PAGE_SIZE = 6;

type PackageForm = {
  name: string;
  description: string;
  active: boolean;
  modules: string[];
};

const emptyForm: PackageForm = {
  name: "",
  description: "",
  active: true,
  modules: [],
};

export function Packages() {
  const { packages, addPackage, updatePackage, deletePackage } = usePackages();
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: string } | null>(null);
  const [form, setForm] = useState<PackageForm>(emptyForm);
  const [moduleDraft, setModuleDraft] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const pageCount = Math.max(1, Math.ceil(packages.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => packages.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [packages, current],
  );

  const set = <K extends keyof PackageForm>(key: K, value: PackageForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setForm(emptyForm);
    setModuleDraft("");
    setModal({ mode: "create" });
  };

  const openEdit = (p: PackagePlan) => {
    setForm({
      name: p.name,
      description: p.description ?? "",
      active: p.active,
      modules: p.modules,
    });
    setModuleDraft("");
    setModal({ mode: "edit", id: p.id });
  };

  const addModule = () => {
    const value = moduleDraft.trim();
    if (!value) return;
    set("modules", [...form.modules, value]);
    setModuleDraft("");
  };

  const removeModule = (index: number) => {
    set(
      "modules",
      form.modules.filter((_, i) => i !== index),
    );
  };

  const submit = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      description: form.description,
      active: form.active,
      modules: form.modules,
    };
    if (modal?.mode === "edit" && modal.id) {
      updatePackage(modal.id, payload);
    } else {
      addPackage(payload);
    }
    setModal(null);
  };

  const remove = (id: string) => {
    deletePackage(id);
    setConfirmDeleteId(null);
  };

  return (
    <>
      <PageHead
        title="Пакеты"
        actions={
          <button type="button" className="btn primary" onClick={openCreate}>
            + Добавить пакет
          </button>
        }
      />

      <div className="card">
        {pageItems.length === 0 && <p className="muted">Пакетов пока нет.</p>}
        {pageItems.map((p) => (
          <div className="pkg-row" key={p.id}>
            <div className="pkg-row-main">
              <div className="pkg-row-title">
                <b>{p.name}</b>
                <span className={`badge ${p.active ? "st-available" : "st-sold"}`}>
                  {p.active ? "Активен" : "Отключен"}
                </span>
              </div>
              {p.description && <p className="muted pkg-row-desc">{p.description}</p>}
              {p.modules.length > 0 && (
                <div className="pkg-row-tags">
                  {p.modules.map((m) => (
                    <span className="tag-chip static" key={m}>
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {confirmDeleteId === p.id ? (
              <div className="owner-row-confirm">
                <span>Удалить?</span>
                <button type="button" className="btn btn-sm danger" onClick={() => remove(p.id)}>
                  Да
                </button>
                <button type="button" className="btn btn-sm" onClick={() => setConfirmDeleteId(null)}>
                  Отмена
                </button>
              </div>
            ) : (
              <div className="owner-row-actions">
                <button type="button" className="btn btn-sm" onClick={() => openEdit(p)}>
                  Изменить
                </button>
                <button
                  type="button"
                  className="btn btn-sm danger"
                  onClick={() => setConfirmDeleteId(p.id)}
                >
                  Удалить
                </button>
              </div>
            )}
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

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{modal.mode === "edit" ? "Редактировать пакет" : "Новый пакет"}</h2>
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
                <span className="field-label">Возможности</span>
                <div className="tag-input">
                  {form.modules.length > 0 && (
                    <div className="tag-list">
                      {form.modules.map((m, i) => (
                        <span className="tag-chip" key={`${m}-${i}`}>
                          {m}
                          <button type="button" onClick={() => removeModule(i)} aria-label="Удалить">
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="tag-add">
                    <input
                      value={moduleDraft}
                      onChange={(e) => setModuleDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addModule();
                        }
                      }}
                      placeholder="Введите и нажмите Enter"
                    />
                    <button type="button" className="btn btn-sm" onClick={addModule}>
                      Добавить
                    </button>
                  </div>
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
              <label className="field toggle-field">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => set("active", e.target.checked)}
                />
                <span>Пакет активен</span>
              </label>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn primary" disabled={!form.name.trim()} onClick={submit}>
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
