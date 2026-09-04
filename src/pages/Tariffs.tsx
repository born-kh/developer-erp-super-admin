import { useMemo, useState } from "react";
import { type TariffPlan } from "../data/mock";
import { useTariffs } from "../data/tariffsStore";
import { usePackages } from "../data/packagesStore";
import { usd } from "../lib/format";
import { PageHead } from "../AppShell";

const PAGE_SIZE = 8;

type TariffForm = {
  name: string;
  price: string;
  description: string;
  active: boolean;
  packageIds: string[];
};

const emptyForm: TariffForm = {
  name: "",
  price: "",
  description: "",
  active: true,
  packageIds: [],
};

export function Tariffs() {
  const { tariffs, addTariff, updateTariff, deleteTariff } = useTariffs();
  const { packages } = usePackages();
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: string } | null>(null);
  const [form, setForm] = useState<TariffForm>(emptyForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState(false);

  const pageCount = Math.max(1, Math.ceil(tariffs.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => tariffs.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE),
    [tariffs, current],
  );

  const set = <K extends keyof TariffForm>(key: K, value: TariffForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setForm(emptyForm);
    setConfirmDeleteId(false);
    setModal({ mode: "create" });
  };

  const openEdit = (t: TariffPlan) => {
    setForm({
      name: t.name,
      price: String(t.price),
      description: t.description ?? "",
      active: t.active,
      packageIds: t.packageIds,
    });
    setConfirmDeleteId(false);
    setModal({ mode: "edit", id: t.id });
  };

  const addPackageToForm = (pkgId: string) => {
    if (!pkgId || form.packageIds.includes(pkgId)) return;
    set("packageIds", [...form.packageIds, pkgId]);
  };

  const removePackageFromForm = (pkgId: string) => {
    set(
      "packageIds",
      form.packageIds.filter((id) => id !== pkgId),
    );
  };

  const submit = () => {
    if (!form.name.trim()) return;
    const payload = {
      name: form.name.trim(),
      price: Number(form.price) || 0,
      description: form.description,
      active: form.active,
      packageIds: form.packageIds,
    };
    if (modal?.mode === "edit" && modal.id) {
      updateTariff(modal.id, payload);
    } else {
      addTariff(payload);
    }
    setModal(null);
  };

  const remove = () => {
    if (modal?.mode === "edit" && modal.id) {
      deleteTariff(modal.id);
    }
    setModal(null);
    setConfirmDeleteId(false);
  };

  const selectedPackages = form.packageIds
    .map((id) => packages.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const availablePackages = packages.filter((p) => !form.packageIds.includes(p.id));

  return (
    <>
      <PageHead
        title="Тарифы"
        actions={
          <button type="button" className="btn primary" onClick={openCreate}>
            + Добавить тариф
          </button>
        }
      />

      {pageItems.length === 0 && (
        <div className="card">
          <p className="muted">Тарифные планы пока не настроены.</p>
        </div>
      )}

      <div className="tariff-grid">
        {pageItems.map((t) => (
          <div
            className="tariff-card"
            key={t.id}
            role="button"
            tabIndex={0}
            onClick={() => openEdit(t)}
            onKeyDown={(e) => e.key === "Enter" && openEdit(t)}
          >
            <div className="tariff-card-head">
              <b>{t.name}</b>
              <span className={`badge ${t.active ? "st-available" : "st-sold"}`}>
                {t.active ? "Активен" : "Отключен"}
              </span>
            </div>
            <div className="tariff-card-price">{usd(t.price)} / мес</div>
            {t.description && <p className="muted pkg-row-desc">{t.description}</p>}
            {t.packageIds.length > 0 && (
              <div className="pkg-row-tags">
                {t.packageIds.map((id) => {
                  const pkg = packages.find((p) => p.id === id);
                  return (
                    <span className="tag-chip static" key={id}>
                      {pkg?.name ?? id}
                    </span>
                  );
                })}
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
              <h2>{modal.mode === "edit" ? "Редактировать тариф" : "Новый тариф"}</h2>
              <button type="button" className="modal-close" onClick={() => setModal(null)} aria-label="Закрыть">
                ✕
              </button>
            </div>
            <div className="edit-form">
              <div className="field-row">
                <label className="field">
                  <span className="field-label">Название</span>
                  <input value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
                </label>
                <label className="field">
                  <span className="field-label">Цена, $/мес</span>
                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                  />
                </label>
              </div>
              <label className="field">
                <span className="field-label">Пакеты</span>
                <div className="tag-input">
                  {selectedPackages.length > 0 && (
                    <div className="tag-list">
                      {selectedPackages.map((p) => (
                        <span className="tag-chip" key={p.id}>
                          {p.name}
                          <button type="button" onClick={() => removePackageFromForm(p.id)} aria-label="Удалить">
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  {availablePackages.length > 0 && (
                    <select value="" onChange={(e) => addPackageToForm(e.target.value)}>
                      <option value="" disabled>
                        Выберите пакет…
                      </option>
                      {availablePackages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
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
                <span>Тариф активен</span>
              </label>
            </div>
            {confirmDeleteId ? (
              <div className="confirm-box">
                <p>Удалить тариф «{form.name}»? Это действие необратимо.</p>
                <div className="confirm-box-actions">
                  <button type="button" className="btn danger" onClick={remove}>
                    Да, удалить
                  </button>
                  <button type="button" className="btn" onClick={() => setConfirmDeleteId(false)}>
                    Отмена
                  </button>
                </div>
              </div>
            ) : (
              <div className="modal-actions">
                <button type="button" className="btn primary" disabled={!form.name.trim()} onClick={submit}>
                  {modal.mode === "edit" ? "Сохранить" : "Создать"}
                </button>
                <button type="button" className="btn" onClick={() => setModal(null)}>
                  Отмена
                </button>
                {modal.mode === "edit" && (
                  <button type="button" className="btn danger" onClick={() => setConfirmDeleteId(true)}>
                    Удалить
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
