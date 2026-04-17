"use client";

import { useCallback } from "react";
import { useTreeStore } from "@/store/useTreeStore";
import { useFamilyStore } from "@/store/useFamilyStore";
import type { FamilyNucleus } from "@/types/family";

// ─────────────────────────────────────────────────────────────────────────────
// § 1. TIPOS AUXILIARES
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// § 2. SUBCOMPONENTE — PersonRow
// ─────────────────────────────────────────────────────────────────────────────

function PersonRow({ personId, role }: PersonRowProps) {
  const person       = useFamilyStore((s) => s.familyData.persons.find((p) => p.id === personId));
  const selectPerson = useFamilyStore((s) => s.selectPerson);
  const centerOnNode = useTreeStore((s) => s.centerOnNode);

  if (!person) return null;

  const fullName =
    [person.nombre, person.apellidoPaterno, person.apellidoMaterno]
      .filter(Boolean)
      .join(" ");

  const initials =
    person.nombre.charAt(0).toUpperCase() +
    person.apellidoPaterno.charAt(0).toUpperCase();

  function handleClick() {
    selectPerson(person!.id);
    centerOnNode(person!.id);
  }

  return (
    <button
      className="person-row"
      data-role={role}
      data-alive={person.vivo}
      onClick={handleClick}
      type="button"
    >
      <span className="person-row__avatar">
        <span className="person-row__initials">{initials}</span>
        {!person.vivo && (
          <span className="person-row__deceased" aria-label="Fallecido">†</span>
        )}
      </span>
      <span className="person-row__info">
        <span className="person-row__name">{fullName}</span>
        <span className="person-row__role">{roleLabel[role]}</span>
      </span>
      <span className="person-row__arrow" aria-hidden="true">→</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3. SUBCOMPONENTE — Section
// ─────────────────────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="nucleus-section">
      <h3 className="nucleus-section__title">{title}</h3>
      <div className="nucleus-section__content">{children}</div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// § 4. COMPONENTE PRINCIPAL — FamilyNucleusPanel
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  nucleus: FamilyNucleus;
}

export default function FamilyNucleusPanel({ nucleus }: Props) {
  const { personId, coupleIds, parentIdsA, parentIdsB, childrenIds } = nucleus;

  // ── § 4.1 Store hooks ──────────────────────────────────────────────────────

  const clearSelection = useFamilyStore((s) => s.clearSelection);
  const clearHighlight = useTreeStore((s) => s.clearHighlight);
  const persons        = useFamilyStore((s) => s.familyData.persons);

  // ── § 4.2 Derivaciones de datos ────────────────────────────────────────────

  const person = persons.find((p) => p.id === personId);

  // partnerId: el otro miembro de la pareja
  const partnerId = coupleIds?.find((id) => id !== personId) ?? null;
  const partnerPerson = partnerId ? persons.find((p) => p.id === partnerId) : null;

  // Determinar qué parentIds corresponden a esta persona y cuáles a su pareja.
  // coupleIds[0] = personA, coupleIds[1] = personB.
  // Si personId es coupleIds[0] → sus padres son parentIdsA, suegros parentIdsB.
  // Si personId es coupleIds[1] → sus padres son parentIdsB, suegros parentIdsA.
  const myParentIds    = !coupleIds
    ? parentIdsA                                              // persona sola
    : personId === coupleIds[0]
      ? parentIdsA
      : parentIdsB;

  const inlawParentIds = !coupleIds
    ? []
    : personId === coupleIds[0]
      ? parentIdsB
      : parentIdsA;

  const hasParents = myParentIds.length > 0;
  const hasInlaws  = inlawParentIds.length > 0;

  // ── § 4.3 Handlers ─────────────────────────────────────────────────────────

  const handleClose = useCallback(() => {
    clearSelection();
    clearHighlight();
  }, [clearSelection, clearHighlight]);

  // ── § 4.4 Guard ────────────────────────────────────────────────────────────

  if (!person) return null;

  const fullName =
    [person.nombre, person.apellidoPaterno, person.apellidoMaterno]
      .filter(Boolean)
      .join(" ");

  // ── § 4.5 Render ───────────────────────────────────────────────────────────

  return (
    <aside className="nucleus-panel">

      {/* ── Header ── */}
      <div className="nucleus-panel__header">
        <div className="nucleus-panel__title-group">
          <span className="nucleus-panel__label">Núcleo familiar</span>
          <h2 className="nucleus-panel__name">{fullName}</h2>
        </div>
        <button
          className="nucleus-panel__close"
          onClick={handleClose}
          type="button"
          aria-label="Cerrar panel"
        >
          ✕
        </button>
      </div>

      <div className="nucleus-panel__divider" />

      {/* ── Body ── */}
      <div className="nucleus-panel__body">

        {/* § 4.5.1 — Pareja */}
        {partnerId && (
          <Section title="Pareja">
            <PersonRow personId={partnerId} role="partner" />
          </Section>
        )}

        {/* § 4.5.2 — Padres (solo los de esta persona) */}
        {hasParents && (
          <Section title="Padres">
            {myParentIds.map((id) => (
              <PersonRow key={id} personId={id} role="parent" />
            ))}
          </Section>
        )}

        {/* § 4.5.3 — Suegros (padres de la pareja) */}
        {hasInlaws && (
          <Section title={`Padres de ${partnerPerson?.nombre ?? "pareja"}`}>
            {inlawParentIds.map((id) => (
              <PersonRow key={id} personId={id} role="inlaw" />
            ))}
          </Section>
        )}

        {/* § 4.5.4 — Hijos */}
        {childrenIds.length > 0 && (
          <Section title="Hijos">
            {childrenIds.map((id) => (
              <PersonRow key={id} personId={id} role="child" />
            ))}
          </Section>
        )}

        {/* § 4.5.5 — Estado vacío */}
        {!partnerId && !hasParents && !hasInlaws && childrenIds.length === 0 && (
          <p className="nucleus-panel__empty">
            Sin relaciones registradas.
          </p>
        )}

      </div>

      <style>{panelStyles}</style>
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// § 5. ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const panelStyles = `
  .nucleus-panel {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 300px;
    background: #0d0d0d;
    border-left: 1px solid #1a1a1a;
    display: flex;
    flex-direction: column;
    z-index: 10;
    animation: panel-in 250ms cubic-bezier(0.4, 0, 0.2, 1) both;
    font-family: 'Georgia', serif;
  }

  @keyframes panel-in {
    from { opacity: 0; transform: translateX(16px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  /* ── Header ── */
  .nucleus-panel__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 24px 20px 20px;
    gap: 12px;
    flex-shrink: 0;
  }

  .nucleus-panel__title-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  .nucleus-panel__label {
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #c9a84c;
  }

  .nucleus-panel__name {
    font-size: 18px;
    font-weight: 400;
    color: #e8e8e8;
    line-height: 1.3;
    letter-spacing: 0.01em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .nucleus-panel__close {
    flex-shrink: 0;
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
    transition: border-color 150ms ease, color 150ms ease;
    margin-top: 2px;
  }

  .nucleus-panel__close:hover {
    border-color: #444;
    color: #e8e8e8;
  }

  /* ── Divisor ── */
  .nucleus-panel__divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #c9a84c44 30%, #c9a84c44 70%, transparent);
    flex-shrink: 0;
    margin: 0 20px;
  }

  /* ── Body ── */
  .nucleus-panel__body {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    scrollbar-width: thin;
    scrollbar-color: #222 transparent;
  }

  .nucleus-panel__empty {
    font-size: 12px;
    color: #444;
    letter-spacing: 0.03em;
    text-align: center;
    padding: 24px 0;
  }

  /* ── Section ── */
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

  /* ── PersonRow ── */
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
    transition: background 150ms ease, border-color 150ms ease;
    text-align: left;
  }

  .person-row:hover {
    background: #111;
    border-color: #1e1e1e;
  }

  .person-row[data-role='partner']:hover {
    border-color: #c9a84c22;
  }

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

  .person-row[data-role='partner'] .person-row__avatar {
    border-color: #c9a84c33;
  }

  .person-row__initials {
    font-size: 11px;
    font-weight: 600;
    color: #c9a84c;
    letter-spacing: 0.04em;
  }

  .person-row[data-alive='false'] .person-row__initials {
    color: #444;
  }

  .person-row__deceased {
    position: absolute;
    bottom: -2px;
    right: -2px;
    font-size: 9px;
    color: #444;
    background: #0d0d0d;
    border-radius: 50%;
    width: 12px;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
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
    letter-spacing: 0.01em;
  }

  .person-row[data-alive='false'] .person-row__name {
    color: #555;
  }

  .person-row__role {
    font-size: 10px;
    color: #383838;
    letter-spacing: 0.04em;
  }

  .person-row__arrow {
    flex-shrink: 0;
    font-size: 11px;
    color: #2a2a2a;
    transition: color 150ms ease, transform 150ms ease;
  }

  .person-row:hover .person-row__arrow {
    color: #c9a84c88;
    transform: translateX(2px);
  }
`;