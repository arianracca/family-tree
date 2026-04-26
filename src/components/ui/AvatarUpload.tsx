"use client";

import { useEffect, useRef, useState } from "react";
import { useFamilyStore } from "@/store/useFamilyStore";
import styles from "./AvatarUpload.module.css";
import { useTranslations } from "next-intl";

interface Props {
  personId:         string;
  firstName:        string;
  lastName:         string;
  currentPhotoUrl?: string | null;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

export default function AvatarUpload({
  personId,
  firstName,
  lastName,
  currentPhotoUrl,
}: Props) {
  const t = useTranslations("avatar");

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
      setErrorMsg(err instanceof Error ? err.message : "ERR_UPLOAD_AVATAR");
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
      setErrorMsg(err instanceof Error ? err.message : "ERR_DELETE_AVATAR");
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
        aria-label={t("ariaUpload")}
      />

      <button
        className={styles.trigger}
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        type="button"
        aria-label={t("ariaChange")}
      >
        <div className={styles.avatar}>
          {preview ? (
            <img src={preview} alt={t("label")} className={styles.img} />
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
          aria-label={t("ariaRemove")}
          title={t("titleRemove")}
        >×</button>
      )}

      <div className={styles.status} data-status={status}>
        {status === "idle"      && t("idle")}
        {status === "uploading" && t("uploading")}
        {status === "success"   && t("success")}
        {status === "error"     && (errorMsg ?? t("error"))}
      </div>
    </div>
  );
}