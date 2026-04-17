"use client";

import { useRef, useState } from "react";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useTreeStore } from "@/store/useTreeStore";

// ─────────────────────────────────────────────────────────────────────────────
// § 1. TIPOS
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  personId: string;
  nombre: string;
  apellidoPaterno: string;
  currentPhotoUrl?: string | null;
}

type UploadStatus = "idle" | "uploading" | "success" | "error";

// ─────────────────────────────────────────────────────────────────────────────
// § 2. COMPONENTE
// ─────────────────────────────────────────────────────────────────────────────

export default function AvatarUpload({
  personId,
  nombre,
  apellidoPaterno,
  currentPhotoUrl,
}: Props) {
  const inputRef              = useRef<HTMLInputElement>(null);
  const [status, setStatus]   = useState<UploadStatus>("idle");
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl ?? null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── § 2.1 Hooks — todos en el cuerpo del componente ──────────────────────

  const updatePerson   = useFamilyStore((s) => s.updatePerson);
  const updateNodeData = useTreeStore((s) => s.updateNodeData);

  // ── § 2.2 Preview local antes de subir ────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    handleUpload(file);
  }

  // ── § 2.3 Upload ──────────────────────────────────────────────────────────
  // handleUpload es una función async normal — no llama hooks adentro

  async function handleUpload(file: File) {
    setStatus("uploading");
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file",            file);
    formData.append("personId",        personId);
    formData.append("nombre",          nombre);
    formData.append("apellidoPaterno", apellidoPaterno);

    try {
      const res  = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error ?? "Error desconocido");

      const photoUrl: string = json.photoUrl;

      // Actualizar store en memoria — dispara re-render del panel
      updatePerson(personId, { photoUrl });

      // Actualizar el nodo de ReactFlow directamente — reflejo inmediato
      // en el canvas sin esperar a que ELK recalcule todo
      updateNodeData(personId, { photoUrl });

      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);

    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Error al subir");
      setPreview(currentPhotoUrl ?? null);
    }
  }

  // ── § 2.4 Render ──────────────────────────────────────────────────────────

  const isUploading = status === "uploading";

  return (
    <div className="avatar-upload">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/tiff,image/gif,image/avif,image/svg+xml"
        onChange={handleFileChange}
        disabled={isUploading}
        style={{ display: "none" }}
        aria-label="Subir foto de perfil"
      />

      <button
        className="avatar-upload__trigger"
        onClick={() => inputRef.current?.click()}
        disabled={isUploading}
        type="button"
        aria-label="Cambiar foto de perfil"
      >
        <div className="avatar-upload__avatar">
          {preview ? (
            <img
              src={preview}
              alt="Avatar"
              className="avatar-upload__img"
            />
          ) : (
            <span className="avatar-upload__placeholder">
              {nombre.charAt(0).toUpperCase()}
              {apellidoPaterno.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="avatar-upload__overlay" data-status={status}>
          {isUploading
            ? <span className="avatar-upload__spinner" />
            : <span className="avatar-upload__icon">↑</span>
          }
        </div>
      </button>

      <div className="avatar-upload__status" data-status={status}>
        {status === "idle"      && "Cambiar foto"}
        {status === "uploading" && "Subiendo…"}
        {status === "success"   && "✓ Guardado"}
        {status === "error"     && (errorMsg ?? "Error")}
      </div>

      <style>{avatarUploadStyles}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// § 3. ESTILOS
// ─────────────────────────────────────────────────────────────────────────────

const avatarUploadStyles = `
  .avatar-upload {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .avatar-upload__trigger {
    position: relative;
    width: 96px;
    height: 96px;
    border-radius: 50%;
    border: 1px solid #2a2a2a;
    background: #141414;
    cursor: pointer;
    padding: 0;
    overflow: hidden;
    transition: border-color 150ms ease;
  }

  .avatar-upload__trigger:hover  { border-color: #c9a84c66; }
  .avatar-upload__trigger:disabled { cursor: not-allowed; opacity: 0.6; }

  .avatar-upload__avatar {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar-upload__img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center top;
    border-radius: 50%;
  }

  .avatar-upload__placeholder {
    font-family: Georgia, serif;
    font-size: 26px;
    font-weight: 600;
    color: #c9a84c;
    letter-spacing: 0.05em;
  }

  .avatar-upload__overlay {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: #00000088;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 150ms ease;
  }

  .avatar-upload__trigger:hover .avatar-upload__overlay,
  .avatar-upload__overlay[data-status='uploading'] { opacity: 1; }

  .avatar-upload__icon    { font-size: 20px; color: #c9a84c; line-height: 1; }

  .avatar-upload__spinner {
    width: 24px;
    height: 24px;
    border: 2px solid #333;
    border-top-color: #c9a84c;
    border-radius: 50%;
    animation: spin 700ms linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .avatar-upload__status {
    font-family: Georgia, serif;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #444;
    transition: color 150ms ease;
  }

  .avatar-upload__status[data-status='success']   { color: #6a9a6a; }
  .avatar-upload__status[data-status='error']     { color: #9a4a4a; }
  .avatar-upload__status[data-status='uploading'] { color: #c9a84c88; }
`;