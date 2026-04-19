"use client";

import { useCallback, useState } from "react";
import { useTreeStore } from "@/store/useTreeStore";
import { useFamilyStore } from "@/store/useFamilyStore";
import AvatarUpload from "@/components/ui/AvatarUpload";
import PersonForm from "@/components/ui/PersonForm";
import { activeRepository } from "@/lib/familyRepository";
import type { FamilyNucleus, Person } from "@/types/family";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type PanelMode = "view" | "edit";

interface PersonRowProps {
  personId: string;
  role: "parent" | "child" | "partner" | "inlaw";
}

const roleLabel: Record<PersonRowProps["role"], string> = {
  parent:  "Padre / Madre",
  child:   "Hijo / Hija",
  partner: "Pareja",
  inlaw:   "Suegro / Suegra",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fullName(p: Pick<Person, "firstName" | "middleName" | "lastName">): string {
  return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ");
}

function initials(p: Pick<Person, "firstName" | "lastName">): string {
  return p.firstName.charAt(0).toUpperCase() + p.lastName.charAt(0).toUpperCase();
}

// ─── PersonRow ────────────────────────────────────────────────────────────────

function PersonRow({ personId, role }: PersonRowProps) {
  const person       = useFamilyStore((s) => s.familyData.persons.find((p) => p.id === personId));
  const selectPerson = useFamilyStore((s) => s.selectPerson);
  const centerOnNode = useTreeStore((s) => s.centerOnNode);

  if (!person) return null;

  const name = fullName(person);
  const ini  = initials(person);

  // Cache buster para evitar que el browser sirva la foto vieja
  // si la URL es la misma pero el archivo cambió
  const photoSrc = person.photoUrl
    ? person.photoUrl.includes("?")
      ? person.photoUrl
      : `${person.photoUrl}?v=${person.id}`
    : null;

  return (
    <button
      className="person-row"
      data-role={role}
      data-alive={person.isAlive}
      onClick={() => { selectPerson(person.id); centerOnNode(person.id); }}
      type="button"
    >
      {/* Avatar con foto o iniciales */}
      <span className="person-row__avatar">
        {photoSrc ? (
          <img
            src={photoSrc}
            alt={name}
            className="person-row__photo"
          />
        ) : (
          <span className="person-row__initials">{ini}</span>
        )}
        {!person.isAlive && (
          <span className="person-row__deceased" aria-label="Fallecido">†</span>
        )}
      </span>

      <span className="person-row__info">
        <span className="person-row__name">{name}</span>
        <span className="person-row__role">{roleLabel[role]}</span>
      </span>
      <span className="person-row__arrow">→</span>
    </button>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="nucleus-section">
      <h3 className="nucleus-section__title">{title}</h3>
      <div className="nucleus-section__content">{children}</div>
    </section>
  );
}

// ─── FieldRow — para mostrar campos estándar y custom ─────────────────────────

function FieldRow({ label, value }: { label: string; value: string }) {
  if (!value?.trim()) return null;
  return (
    <div className="field-row">
      <span className="field-row__label">{label}</span>
      <span className="field-row__value">{value}</span>
    </div>
  );
}

// ─── DeleteConfirm ────────────────────────────────────────────────────────────

function DeleteConfirm({
  personName,
  onConfirm,
  onCancel,
}: {
  personName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="delete-confirm">
      <p className="delete-confirm__text">
        ¿Eliminar a <strong>{personName}</strong>? Se borrarán todas sus relaciones.
      </p>
      <div className="delete-confirm__actions">
        <button className="pnl-btn pnl-btn--ghost" onClick={onCancel} type="button">
          Cancelar
        </button>
        <button className="pnl-btn pnl-btn--danger" onClick={onConfirm} type="button">
          Eliminar
        </button>
      </div>
    </div>
  );
}

// ─── Panel principal ──────────────────────────────────────────────────────────

interface Props {
  nucleus: FamilyNucleus;
}

export default function FamilyNucleusPanel({ nucleus }: Props) {
  const { personId, coupleIds, parentIdsA, parentIdsB, childrenIds } = nucleus;

  const [mode,           setMode]           = useState<PanelMode>("view");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

// ── Store ──────────────────────────────────────────────────────────────────
  const persons        = useFamilyStore((s) => s.familyData.persons);
  const clearSelection = useFamilyStore((s) => s.clearSelection);
  const loadFamilyData = useFamilyStore((s) => s.loadFamilyData);
  const clearHighlight = useTreeStore((s) => s.clearHighlight);

  // ── Derivaciones ───────────────────────────────────────────────────────────
  const person      = persons.find((p) => p.id === personId);
  const partnerId   = coupleIds?.find((id) => id !== personId) ?? null;
  const partnerPerson = partnerId ? persons.find((p) => p.id === partnerId) : null;

  const myParentIds    = !coupleIds ? parentIdsA
    : personId === coupleIds[0] ? parentIdsA : parentIdsB;
  const inlawParentIds = !coupleIds ? []
    : personId === coupleIds[0] ? parentIdsB : parentIdsA;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    clearSelection();
    clearHighlight();
    setMode("view");
    setShowDeleteConfirm(false);
  }, [clearSelection, clearHighlight]);

  async function handleDelete() {
      await activeRepository.deletePerson(personId);
      await loadFamilyData();
      handleClose();
    }

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!person) return null;

  const name = fullName(person);

  // ── Render: modo edición ───────────────────────────────────────────────────────
  if (mode === "edit") {
    return (
      <aside className="nucleus-panel">
        <div className="nucleus-panel__header">
          <div className="nucleus-panel__title-group">
            <span className="nucleus-panel__label">Editando</span>
            <h2 className="nucleus-panel__name">{name}</h2>
          </div>
          <button className="nucleus-panel__close" onClick={() => setMode("view")} type="button">✕</button>
        </div>
        <div className="nucleus-panel__divider" />

        {/* ↓ Este wrapper es el fix */}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <PersonForm
            mode="edit"
            personId={personId}
            onSuccess={() => { loadFamilyData(); setMode("view"); }}
            onCancel={() => setMode("view")}
          />
        </div>

        <style>{panelStyles}</style>
      </aside>
    );
  }

  // ── Render: modo vista ─────────────────────────────────────────────────────
  return (
    <aside className="nucleus-panel">

      {/* Header */}
      <div className="nucleus-panel__header">
        <div className="nucleus-panel__title-group">
          <span className="nucleus-panel__label">Núcleo familiar</span>
          <h2 className="nucleus-panel__name">{name}</h2>
        </div>
        <div className="nucleus-panel__header-actions">
          {/* Editar */}
          <button
            className="nucleus-panel__icon-btn"
            onClick={() => { setMode("edit"); setShowDeleteConfirm(false); }}
            type="button"
            aria-label="Editar persona"
            title="Editar"
          >✎</button>
          {/* Borrar */}
          <button
            className="nucleus-panel__icon-btn nucleus-panel__icon-btn--danger"
            onClick={() => setShowDeleteConfirm((v) => !v)}
            type="button"
            aria-label="Eliminar persona"
            title="Eliminar"
          >🗑</button>
          {/* Cerrar */}
          <button className="nucleus-panel__close" onClick={handleClose} type="button">✕</button>
        </div>
      </div>

      <div className="nucleus-panel__divider" />

      {/* Confirm borrado inline */}
      {showDeleteConfirm && (
        <DeleteConfirm
          personName={name}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Avatar */}
      <div className="nucleus-panel__avatar-section">
        <AvatarUpload
          personId={person.id}
          firstName={person.firstName ?? ""}
          lastName={person.lastName ?? ""}
          currentPhotoUrl={person.photoUrl}
        />
      </div>

      {/* Body */}
      <div className="nucleus-panel__body">

        {/* Campos estándar */}
        <Section title="Datos">
          <FieldRow label="Lugar nacimiento" value={person.birthPlace ?? ""} />
          <FieldRow label="Ciudad"           value={person.city       ?? ""} />
          <FieldRow label="Nacimiento"       value={person.birthDate  ?? ""} />
          {!person.isAlive && (
            <FieldRow label="Fallecimiento"  value={person.deathDate  ?? ""} />
          )}
          {(person.nationalities?.length ?? 0) > 0 && (
            <FieldRow label="Nacionalidades" value={person.nationalities!.join(", ")} />
          )}
        </Section>

        {/* Historia */}
        {person.history && (
          <Section title="Historia">
            <p className="nucleus-panel__history">{person.history}</p>
          </Section>
        )}

        {/* Campos personalizados */}
        {(person.customFields?.length ?? 0) > 0 && (
          <Section title="Otros datos">
            {person.customFields!.map((f) => (
              <FieldRow key={f.key} label={f.label} value={f.value} />
            ))}
          </Section>
        )}

        {/* Relaciones */}
        {partnerId && (
          <Section title="Pareja">
            <PersonRow personId={partnerId} role="partner" />
          </Section>
        )}

        {myParentIds.length > 0 && (
          <Section title="Padres">
            {myParentIds.map((id) => <PersonRow key={id} personId={id} role="parent" />)}
          </Section>
        )}

        {inlawParentIds.length > 0 && (
          <Section title={`Padres de ${partnerPerson?.firstName ?? "pareja"}`}>
            {inlawParentIds.map((id) => <PersonRow key={id} personId={id} role="inlaw" />)}
          </Section>
        )}

        {childrenIds.length > 0 && (
          <Section title="Hijos">
            {childrenIds.map((id) => <PersonRow key={id} personId={id} role="child" />)}
          </Section>
        )}

        {!partnerId && myParentIds.length === 0 && inlawParentIds.length === 0 && childrenIds.length === 0 && (
          <p className="nucleus-panel__empty">Sin relaciones registradas.</p>
        )}

      </div>

      <style>{panelStyles}</style>
    </aside>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const panelStyles = `
  .nucleus-panel {
    position: absolute;
    top: 0; right: 0; bottom: 0;
    width: 300px;
    background: #0d0d0d;
    border-left: 1px solid #1a1a1a;
    display: flex;
    flex-direction: column;
    z-index: 10;
    animation: panel-in 250ms cubic-bezier(0.4,0,0.2,1) both;
    font-family: Georgia, serif;
  }

  @keyframes panel-in {
    from { opacity: 0; transform: translateX(16px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  /* Header */
  .nucleus-panel__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 20px 16px 16px;
    gap: 8px;
    flex-shrink: 0;
  }

  .nucleus-panel__title-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    flex: 1;
  }

  .nucleus-panel__label {
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #c9a84c;
  }

  .nucleus-panel__name {
    font-size: 16px;
    font-weight: 400;
    color: #e8e8e8;
    line-height: 1.3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nucleus-panel__header-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .nucleus-panel__icon-btn {
    width: 28px;
    height: 28px;
    background: none;
    border: 1px solid #222;
    border-radius: 4px;
    color: #555;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 150ms, color 150ms;
  }

  .nucleus-panel__icon-btn:hover {
    border-color: #444;
    color: #c9a84c;
  }

  .nucleus-panel__icon-btn--danger:hover {
    border-color: #9a4a4a;
    color: #9a4a4a;
  }

  .nucleus-panel__close {
    width: 28px;
    height: 28px;
    background: none;
    border: 1px solid #222;
    border-radius: 4px;
    color: #555;
    font-size: 11px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 150ms, color 150ms;
  }

  .nucleus-panel__close:hover { border-color: #444; color: #e8e8e8; }

  /* Divider */
  .nucleus-panel__divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #c9a84c44 30%, #c9a84c44 70%, transparent);
    flex-shrink: 0;
    margin: 0 16px;
  }

  /* Delete confirm */
  .delete-confirm {
    padding: 14px 16px;
    background: #120808;
    border-bottom: 1px solid #2a1010;
    flex-shrink: 0;
  }

  .delete-confirm__text {
    font-size: 12px;
    color: #aaa;
    margin: 0 0 12px;
    line-height: 1.5;
  }

  .delete-confirm__text strong { color: #e8e8e8; }

  .delete-confirm__actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .pnl-btn {
    padding: 6px 14px;
    border-radius: 4px;
    font-family: Georgia, serif;
    font-size: 11px;
    cursor: pointer;
    letter-spacing: 0.03em;
    transition: all 150ms;
  }

  .pnl-btn--ghost {
    background: none;
    border: 1px solid #222;
    color: #555;
  }

  .pnl-btn--ghost:hover { border-color: #444; color: #888; }

  .pnl-btn--danger {
    background: #2a1010;
    border: 1px solid #9a4a4a44;
    color: #9a4a4a;
  }

  .pnl-btn--danger:hover { background: #3a1010; border-color: #9a4a4a; }

  /* Avatar */
  .nucleus-panel__avatar-section {
    display: flex;
    justify-content: center;
    padding: 16px 0 4px;
    flex-shrink: 0;
  }

  /* Body */
  .nucleus-panel__body {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    scrollbar-width: thin;
    scrollbar-color: #222 transparent;
  }

  .nucleus-panel__history {
    font-size: 12px;
    color: #888;
    line-height: 1.6;
    margin: 0;
    white-space: pre-wrap;
  }

  .nucleus-panel__empty {
    font-size: 12px;
    color: #444;
    text-align: center;
    padding: 24px 0;
  }

  /* Section */
  .nucleus-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .nucleus-section__title {
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #444;
    font-weight: 400;
    padding-bottom: 6px;
    border-bottom: 1px solid #161616;
  }

  .nucleus-section__content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* FieldRow */
  .field-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    padding: 4px 0;
    border-bottom: 1px solid #0f0f0f;
  }

  .field-row__label {
    font-size: 10px;
    color: #444;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    flex-shrink: 0;
  }

  .field-row__value {
    font-size: 12px;
    color: #aaa;
    text-align: right;
    word-break: break-word;
  }

  /* PersonRow */
  .person-row {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 10px;
    background: none;
    border: 1px solid transparent;
    border-radius: 5px;
    cursor: pointer;
    transition: background 150ms, border-color 150ms;
    text-align: left;
  }

  .person-row:hover { background: #111; border-color: #1e1e1e; }
  .person-row[data-role='partner']:hover { border-color: #c9a84c22; }

  .person-row__avatar {
    position: relative;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #141414;
    border: 1px solid #222;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .person-row[data-role='partner'] .person-row__avatar { border-color: #c9a84c33; }

  .person-row__initials {
    font-size: 11px;
    font-weight: 600;
    color: #c9a84c;
    letter-spacing: 0.04em;
  }
    
  .person-row__photo {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    object-position: center top;
  }

  .person-row[data-alive='false'] .person-row__initials { color: #444; }

  .person-row__deceased {
    position: absolute;
    bottom: -2px; right: -2px;
    font-size: 9px; color: #444;
    background: #0d0d0d;
    border-radius: 50%;
    width: 12px; height: 12px;
    display: flex; align-items: center; justify-content: center;
  }

  .person-row__info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .person-row__name {
    font-size: 12px;
    color: #d0d0d0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .person-row[data-alive='false'] .person-row__name { color: #555; }

  .person-row__role {
    font-size: 10px;
    color: #383838;
    letter-spacing: 0.04em;
  }

  .person-row__arrow {
    flex-shrink: 0;
    font-size: 11px;
    color: #2a2a2a;
    transition: color 150ms, transform 150ms;
  }

  .person-row:hover .person-row__arrow { color: #c9a84c88; transform: translateX(2px); }
`;