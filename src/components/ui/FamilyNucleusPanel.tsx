"use client";

import { useCallback, useState } from "react";
import { useTreeStore } from "@/store/useTreeStore";
import { useFamilyStore } from "@/store/useFamilyStore";
import AvatarUpload from "@/components/ui/AvatarUpload";
import PersonForm from "@/components/ui/PersonForm";
import type { FamilyNucleus, Person } from "@/types/family";
import panelStyles from "@/components/ui/panel.module.css";
import styles from "@/components/ui/FamilyNucleusPanel.module.css";
import FieldRow from "@/components/ui/primitives/FieldRow";
import IconButton from "@/components/ui/primitives/IconButton";
import PanelHeader from "@/components/ui/primitives/PanelHeader";
import { useTranslations } from "next-intl";

type PanelMode = "view" | "edit" | "create";

interface PersonRowProps {
  personId: string;
  role: "parent" | "child" | "partner" | "inlaw";
}

function fullName(p: Pick<Person, "firstName" | "middleName" | "lastName">): string {
  return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ");
}

function initials(p: Pick<Person, "firstName" | "lastName">): string {
  return p.firstName.charAt(0).toUpperCase() + p.lastName.charAt(0).toUpperCase();
}

function PersonRow({ personId, role }: PersonRowProps) {
  const t          = useTranslations("panel");
  const person       = useFamilyStore((s) => s.familyData.persons.find((p) => p.id === personId));
  const selectPerson = useFamilyStore((s) => s.selectPerson);
  const centerOnNode = useTreeStore((s) => s.centerOnNode);

  if (!person) return null;

  const name = fullName(person);
  const ini  = initials(person);

  const roleLabel: Record<PersonRowProps["role"], string> = {
    parent:  t("roleParent"),
    child:   t("roleChild"),
    partner: t("rolePartner"),
    inlaw:   t("roleInlaw"),
  };

  const photoSrc = person.photoUrl
    ? person.photoUrl.includes("?") ? person.photoUrl : `${person.photoUrl}?v=${person.id}`
    : null;

  return (
    <button
      className={styles.personRow}
      data-role={role}
      data-alive={person.isAlive}
      onClick={() => { selectPerson(person.id); centerOnNode(person.id); }}
      type="button"
    >
      <span className={styles.personRowAvatar}>
        {photoSrc ? (
          <img src={photoSrc} alt={name} className={styles.personRowPhoto} />
        ) : (
          <span className={styles.personRowInitials}>{ini}</span>
        )}
        {!person.isAlive && (
          <span className={styles.personRowDeceased} aria-label={t("deceased")}>†</span>
        )}
      </span>
      <span className={styles.personRowInfo}>
        <span className={styles.personRowName}>{name}</span>
        <span className={styles.personRowRole}>{roleLabel[role]}</span>
      </span>
      <span className={styles.personRowArrow}>→</span>
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.sectionContent}>{children}</div>
    </section>
  );
}

function DeleteConfirm({
  personName,
  onConfirm,
  onCancel,
}: {
  personName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useTranslations("panel");
  return (
    <div className={styles.deleteConfirm}>
      <p className={styles.deleteText}>
        {t("deleteConfirm", { name: personName })}
      </p>
      <div className={styles.deleteActions}>
        <button
          className={`${styles.btn} ${styles.btnGhost}`}
          onClick={onCancel}
          type="button"
        >
          {t("deleteCancel")}
        </button>
        <button
          className={`${styles.btn} ${styles.btnDanger}`}
          onClick={onConfirm}
          type="button"
        >
          {t("deleteAction")}
        </button>
      </div>
    </div>
  );
}

interface Props {
  nucleus?:     FamilyNucleus;
  initialMode?: PanelMode;
  onClose?:     () => void;
}

export default function FamilyNucleusPanel({ nucleus, initialMode = "view", onClose }: Props) {
  const t = useTranslations("panel");

  const { personId, coupleIds, parentIdsA, parentIdsB, childrenIds } = nucleus ?? {
    personId: "", coupleIds: null, parentIdsA: [], parentIdsB: [], childrenIds: [],
  };

  const [mode, setMode] = useState<PanelMode>(initialMode);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const persons        = useFamilyStore((s) => s.familyData.persons);
  const clearSelection = useFamilyStore((s) => s.clearSelection);
  const loadFamilyData = useFamilyStore((s) => s.loadFamilyData);
  const executeCommand = useFamilyStore((s) => s.executeCommand);
  const clearHighlight = useTreeStore((s) => s.clearHighlight);

  const person        = persons.find((p) => p.id === personId);
  const partnerId     = coupleIds?.find((id) => id !== personId) ?? null;
  const partnerPerson = partnerId ? persons.find((p) => p.id === partnerId) : null;

  const myParentIds    = !coupleIds ? parentIdsA
    : personId === coupleIds[0] ? parentIdsA : parentIdsB;
  const inlawParentIds = !coupleIds ? []
    : personId === coupleIds[0] ? parentIdsB : parentIdsA;

  const handleClose = useCallback(() => {
    clearSelection();
    clearHighlight();
    setMode("view");
    setShowDeleteConfirm(false);
  }, [clearSelection, clearHighlight]);

  async function handleDelete() {
    const { DeletePersonCommand } = await import("@/commands/DeletePersonCommand");
    await executeCommand(new DeletePersonCommand(personId, name));
    handleClose();
  }

  if (mode === "create") {
    return (
      <aside className={panelStyles.panel}>
        <PanelHeader label={t("labelCreate")} title={t("titleCreate")}>
          <IconButton onClick={() => onClose?.()} label={t("btnClose")} variant="close">✕</IconButton>
        </PanelHeader>
        <div className={panelStyles.divider} />
        <div className={panelStyles.formWrapper}>
          <PersonForm mode="create" onSuccess={() => onClose?.()} onCancel={() => onClose?.()} />
        </div>
      </aside>
    );
  }

  if (!person) return null;

  const name = fullName(person);

  if (mode === "edit") {
    return (
      <aside className={panelStyles.panel}>
        <PanelHeader label={t("labelEdit")} title={name}>
          <IconButton onClick={() => setMode("view")} label={t("btnCloseEdit")} variant="close">✕</IconButton>
        </PanelHeader>
        <div className={panelStyles.divider} />
        <div className={panelStyles.formWrapper}>
          <PersonForm
            mode="edit"
            personId={personId}
            onSuccess={() => { loadFamilyData(); setMode("view"); }}
            onCancel={() => setMode("view")}
          />
        </div>
      </aside>
    );
  }

  return (
    <aside className={panelStyles.panel}>
      <PanelHeader label={t("labelNucleus")} title={name}>
        <IconButton onClick={() => { setMode("edit"); setShowDeleteConfirm(false); }} label={t("btnEdit")} title={t("btnEdit")}>✎</IconButton>
        <IconButton onClick={() => setShowDeleteConfirm((v) => !v)} label={t("btnDelete")} title={t("btnDelete")} variant="danger">🗑</IconButton>
        <IconButton onClick={handleClose} label={t("btnClose")} variant="close">✕</IconButton>
      </PanelHeader>

      <div className={panelStyles.divider} />

      {showDeleteConfirm && (
        <DeleteConfirm
          personName={name}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      <div className={styles.avatarSection}>
        <AvatarUpload
          personId={person.id}
          firstName={person.firstName ?? ""}
          lastName={person.lastName ?? ""}
          currentPhotoUrl={person.photoUrl}
        />
      </div>

      <div className={panelStyles.body}>
        <Section title={t("sectionData")}>
          <FieldRow label={t("fieldBirthPlace")} value={person.birthPlace ?? ""} />
          <FieldRow label={t("fieldCity")}       value={person.city       ?? ""} />
          <FieldRow label={t("fieldBirthDate")}  value={person.birthDate  ?? ""} />
          {!person.isAlive && (
            <FieldRow label={t("fieldDeathDate")} value={person.deathDate ?? ""} />
          )}
          {(person.nationalities?.length ?? 0) > 0 && (
            <FieldRow label={t("fieldNationalities")} value={person.nationalities!.join(", ")} />
          )}
        </Section>

        {person.history && (
          <Section title={t("sectionHistory")}>
            <p className={styles.history}>{person.history}</p>
          </Section>
        )}

        {(person.customFields?.length ?? 0) > 0 && (
          <Section title={t("sectionOther")}>
            {person.customFields!.map((f) => (
              <FieldRow key={f.key} label={f.label} value={f.value} />
            ))}
          </Section>
        )}

        {partnerId && (
          <Section title={t("sectionPartner")}>
            <PersonRow personId={partnerId} role="partner" />
          </Section>
        )}

        {myParentIds.length > 0 && (
          <Section title={t("sectionParents")}>
            {myParentIds.map((id) => <PersonRow key={id} personId={id} role="parent" />)}
          </Section>
        )}

        {inlawParentIds.length > 0 && (
          <Section title={t("sectionParentsOf", { name: partnerPerson?.firstName ?? t("partnerFallback") })}>
            {inlawParentIds.map((id) => <PersonRow key={id} personId={id} role="inlaw" />)}
          </Section>
        )}

        {childrenIds.length > 0 && (
          <Section title={t("sectionChildren")}>
            {childrenIds.map((id) => <PersonRow key={id} personId={id} role="child" />)}
          </Section>
        )}

        {!partnerId && myParentIds.length === 0 && inlawParentIds.length === 0 && childrenIds.length === 0 && (
          <p className={styles.empty}>{t("emptyRelations")}</p>
        )}
      </div>
    </aside>
  );
}