"use client";

import { useEffect, useRef, useState } from "react";
import { useFamilyStore } from "@/store/useFamilyStore";
import styles from "./AvatarUpload.module.css";

interface Props {
  personId:         string;
  firstName:        string;
  lastName:         string;
  currentPhotoUrl?: string | null;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

const UI = {
  avatar:       "Avatar",
  idle:         "Cambiar foto",
  uploading:    "Subiendo…",
  success:      "✓ Guardado",
  ariaUpload:   "Subir foto de perfil",
  ariaChange:   "Cambiar foto de perfil",
  ariaRemove:   "Eliminar foto de perfil",
  titleRemove:  "Eliminar foto",
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

  const executeCommand = useFamilyStore((s) => s.executeCommand);

  function resetInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Preview local inmediato — se revierte si el comando falla
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    handleUpload(file);
  }

  async function handleUpload(file: File) {
    setStatus("uploading");
    setErrorMsg(null);
    try {
      const { UploadAvatarCommand } = await import("@/commands/UploadAvatarCommand");
      await executeCommand(
        new UploadAvatarCommand("upload", personId, firstName, lastName, file)
      );
      setStatus("success");
      resetInput();
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : UI.uploadError);
      setPreview(currentPhotoUrl ?? null);
      resetInput();
    }
  }

  async function handleRemoveAvatar() {
    setStatus("uploading");
    setErrorMsg(null);
    try {
      const { UploadAvatarCommand } = await import("@/commands/UploadAvatarCommand");
      await executeCommand(
        new UploadAvatarCommand("delete", personId, firstName, lastName)
      );
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