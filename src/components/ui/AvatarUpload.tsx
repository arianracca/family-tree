"use client";

import { useEffect, useRef, useState } from "react";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useTreeStore } from "@/store/useTreeStore";
import styles from "./AvatarUpload.module.css";
import { error } from "console";

interface Props {
  personId:        string;
  firstName:       string;
  lastName:        string;
  currentPhotoUrl?: string | null;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

// ─── Labels de UI — preparados para i18n ─────────────────────────────────────

const UI = {
  avatar:    "Avatar",
  idle:      "Cambiar foto",
  uploading: "Subiendo…",
  success:   "✓ Guardado",
  ariaUpload:  "Subir foto de perfil",
  ariaChange:  "Cambiar foto de perfil",
  ariaRemove:  "Eliminar foto de perfil",
  titleRemove: "Eliminar foto",
  unknownError: "Error desconocido",
  uploadError:  "Error al subir la foto",
  deleteError:  "Error al eliminar la foto",
  error:        "Error",
} as const;

export default function AvatarUpload({
  personId,
  firstName,
  lastName,
  currentPhotoUrl,
}: Props) {
  const inputRef                = useRef<HTMLInputElement>(null);
  const [status, setStatus]     = useState<UploadStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [preview, setPreview]   = useState<string | null>(currentPhotoUrl ?? null);

  useEffect(() => {
    setPreview(currentPhotoUrl ?? null);
  }, [personId, currentPhotoUrl]);

  const updatePerson   = useFamilyStore((s) => s.updatePerson);
  const updateNodeData = useTreeStore((s) => s.updateNodeData);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    handleUpload(file);
  }

  async function handleUpload(file: File) {
    setStatus("uploading");
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file",      file);
    formData.append("personId",  personId);
    formData.append("firstName", firstName);
    formData.append("lastName",  lastName);

    try {
      const res  = await fetch("/api/upload-avatar", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? UI.unknownError);

      updatePerson(personId, { photoUrl: json.photoUrl });
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : UI.uploadError);
      setPreview(currentPhotoUrl ?? null);
    }
  }

  async function handleRemoveAvatar() {
    setStatus("uploading");
    setErrorMsg(null);
    try {
      const res  = await fetch("/api/upload-avatar", {
        method:  "DELETE",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ personId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? UI.unknownError);

      updatePerson(personId, { photoUrl: null });
      setPreview(null);
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : UI.deleteError);
    }
  }

  const isUploading = status === "uploading";

  return (
    <div className={styles.upload}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/tiff,image/gif,image/avif,image/svg+xml"
        onChange={handleFileChange}
        disabled={isUploading}
        style={{ display: "none" }}
        aria-label={UI.ariaUpload}
      />

      <button
        className={styles.trigger}
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        type="button"
        aria-label={UI.ariaChange}
      >
        <div className={styles.avatar}>
          {preview ? (
            <img src={preview} alt={UI.avatar} className={styles.img} />
          ) : (
            <span className={styles.placeholder}>
              {(firstName ?? "?").charAt(0).toUpperCase()}
              {(lastName  ?? "?").charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className={styles.overlay} data-status={status}>
          {isUploading
            ? <span className={styles.spinner} />
            : <span className={styles.icon}>↑</span>
          }
        </div>
      </button>

      {preview && !isUploading && (
        <button
          className={styles.removeBtn}
          onClick={handleRemoveAvatar}
          type="button"
          aria-label={UI.ariaRemove}
          title={UI.titleRemove}
        >×</button>
      )}

      <div className={styles.status} data-status={status}>
        {status === "idle"      && UI.idle}
        {status === "uploading" && UI.uploading}
        {status === "success"   && UI.success}
        {status === "error"     && (errorMsg ?? UI.error)}
      </div>
    </div>
  );
}