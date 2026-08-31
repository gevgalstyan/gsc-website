"use client";

/**
 * Member profile editor and private avatar upload UI.
 * Profile rows live in Supabase; prepared photos live in profile-avatars Storage.
 */

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { AvatarImageError, prepareAvatarImage } from "@/lib/avatar-image";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const AVATAR_BUCKET = "profile-avatars";

type Profile = {
  display_name: string | null;
  avatar_path: string | null;
  avatar_url: string | null;
  telegram_username: string | null;
  english_level: string | null;
};

type Notice = { kind: "error" | "success"; text: string } | null;
const debugProfile = process.env.NODE_ENV === "development";

// ======================================================
// MEMBER PROFILE
// ======================================================
export function ProfileForm({
  userId,
  initialProfile,
  initialAvatarUrl,
  onboarding = false,
}: {
  userId: string;
  initialProfile: Profile;
  initialAvatarUrl: string | null;
  onboarding?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [avatarPath, setAvatarPath] = useState(initialProfile.avatar_path);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [displayName, setDisplayName] = useState(initialProfile.display_name ?? "");
  const [englishLevel, setEnglishLevel] = useState(initialProfile.english_level ?? "");
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropUrl, setCropUrl] = useState<string | null>(null);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const [cropZoom, setCropZoom] = useState(1);
  const busy = saving || uploading;

  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  useEffect(() => () => {
    if (cropUrl) URL.revokeObjectURL(cropUrl);
  }, [cropUrl]);

  function replacePreview(url: string | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = url?.startsWith("blob:") ? url : null;
    setAvatarUrl(url);
  }

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setNotice(null);
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
      setNotice({ kind: "error", text: "Please choose a JPEG, PNG, or WebP image." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setNotice({ kind: "error", text: "That photo is larger than 5 MB. Please choose a smaller image." });
      return;
    }
    if (cropUrl) URL.revokeObjectURL(cropUrl);
    setCropFile(file);
    setCropUrl(URL.createObjectURL(file));
    setCropX(0);
    setCropY(0);
    setCropZoom(1);
  }

  // ======================================================
  // AVATAR UPLOAD
  // ======================================================
  async function saveCroppedPhoto() {
    if (!cropFile) return;
    setUploading(true);
    setNotice(null);
    try {
      const blob = await prepareAvatarImage(cropFile, { x: cropX, y: cropY, zoom: cropZoom });
      replacePreview(URL.createObjectURL(blob));
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error("Profile photos are temporarily unavailable.");
      const path = `${userId}/avatar.webp`;
      const { error: uploadError } = await client.storage.from(AVATAR_BUCKET).upload(path, blob, {
        cacheControl: "0",
        contentType: "image/webp",
        upsert: true,
      });
      if (uploadError) throw uploadError;

      if (avatarPath !== path) {
        const { error: profileError } = await client.from("profiles").update({ avatar_path: path }).eq("id", userId);
        if (profileError) {
          await client.storage.from(AVATAR_BUCKET).remove([path]);
          throw profileError;
        }
      }

      const { data, error: signedError } = await client.storage.from(AVATAR_BUCKET).createSignedUrl(path, 3600);
      if (signedError) throw signedError;
      replacePreview(`${data.signedUrl}&v=${Date.now()}`);
      setAvatarPath(path);
      setNotice({ kind: "success", text: "Your profile photo has been updated." });
    } catch (error) {
      replacePreview(initialAvatarUrl);
      setNotice({
        kind: "error",
        text: error instanceof AvatarImageError ? error.message : "We couldn’t upload your photo. Please try again.",
      });
      if (debugProfile && error instanceof Error) console.debug("[gsc:profile] avatar upload failed", { message: error.message });
    } finally {
      setUploading(false);
      if (cropUrl) URL.revokeObjectURL(cropUrl);
      setCropFile(null);
      setCropUrl(null);
    }
  }

  function cancelCrop() {
    if (cropUrl) URL.revokeObjectURL(cropUrl);
    setCropFile(null);
    setCropUrl(null);
  }

  async function removePhoto() {
    if (!avatarPath) return;
    setUploading(true);
    setNotice(null);
    const client = getSupabaseBrowserClient();
    if (!client) {
      setUploading(false);
      setNotice({ kind: "error", text: "Profile photos are temporarily unavailable." });
      return;
    }

    const { error: deleteError } = await client.storage.from(AVATAR_BUCKET).remove([avatarPath]);
    if (deleteError) {
      setUploading(false);
      setNotice({ kind: "error", text: "We couldn’t remove your photo. Please try again." });
      return;
    }
    const { error: profileError } = await client.from("profiles").update({ avatar_path: null }).eq("id", userId);
    setUploading(false);
    if (profileError) {
      setNotice({ kind: "error", text: "The photo was removed, but your profile could not be refreshed. Please reload the page." });
      return;
    }
    setAvatarPath(null);
    replacePreview(initialProfile.avatar_url);
    setNotice({ kind: "success", text: "Your uploaded photo has been removed." });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    const data = new FormData(event.currentTarget);
    const clean = (key: string) => String(data.get(key) ?? "").trim() || null;
    const telegram = clean("telegram_username")?.replace(/^@/, "") ?? null;
    if (onboarding && !clean("display_name")) {
      setSaving(false);
      setNotice({ kind: "error", text: "Please add the name you’d like the community to use." });
      return;
    }
    const client = getSupabaseBrowserClient();
    const { error } = client
      ? await client.from("profiles").update({ display_name: clean("display_name"), telegram_username: telegram, english_level: clean("english_level"), ...(onboarding ? { onboarding_completed: true } : {}) }).eq("id", userId)
      : { error: new Error("Profile updates are temporarily unavailable.") };
    setSaving(false);
    if (error) { setNotice({ kind: "error", text: "We couldn’t save your profile. Please check the fields and try again." }); if (debugProfile) console.debug("[gsc:profile] save failed", { message: error.message }); return; }
    if (onboarding) {
      setNotice({ kind: "success", text: "Profile complete. Opening the club…" });
      window.setTimeout(() => window.location.replace("/"), 450);
      return;
    }
    setNotice({ kind: "success", text: "Profile saved." });
  }

  const initials = displayName.trim().charAt(0).toUpperCase() || "G";

  return <>
    <div className="avatar-editor" aria-busy={uploading}>
      <button className="avatar-picker" type="button" onClick={() => inputRef.current?.click()} disabled={busy} aria-label={avatarUrl ? "Change profile photo" : "Upload profile photo"}>
        {avatarUrl
          ? <Image className="profile-avatar" src={avatarUrl} alt="Your profile photo" width={112} height={112} unoptimized />
          : <span className="profile-avatar profile-placeholder" aria-hidden="true">{initials}</span>}
        <span className="avatar-camera" aria-hidden="true"><Camera size={18} /></span>
      </button>
      <div className="avatar-editor-copy">
        <strong>Profile photo</strong>
        <span>JPEG, PNG or WebP. Maximum 5 MB.</span>
        <div className="avatar-actions">
          <button className="button button-outline-dark button-compact" type="button" onClick={() => inputRef.current?.click()} disabled={busy}>
            <Camera size={16} />{uploading ? "Uploading…" : avatarPath || avatarUrl ? "Change photo" : "Upload photo"}
          </button>
          {avatarPath && <button className="avatar-remove" type="button" onClick={removePhoto} disabled={busy}><Trash2 size={16} />Remove photo</button>}
        </div>
      </div>
      <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={choosePhoto} disabled={busy} aria-label="Choose a profile photo" />
    </div>
    {cropFile && cropUrl && <div className="modal-backdrop" role="presentation"><section className="avatar-crop-dialog" role="dialog" aria-modal="true" aria-labelledby="avatar-crop-title"><span className="eyebrow">Profile photo</span><h2 id="avatar-crop-title">Frame your photo</h2><p>Move, zoom, and preview the square image before it is saved.</p><div className="avatar-crop-preview"><Image src={cropUrl} alt="Photo crop preview" width={280} height={280} unoptimized style={{ transform: `translate(${cropX * 12}%, ${cropY * 12}%) scale(${cropZoom})` }} /></div><label>Zoom<input type="range" min="1" max="2.5" step="0.05" value={cropZoom} onChange={(event) => setCropZoom(Number(event.target.value))} /></label><label>Horizontal position<input type="range" min="-1" max="1" step="0.05" value={cropX} onChange={(event) => setCropX(Number(event.target.value))} /></label><label>Vertical position<input type="range" min="-1" max="1" step="0.05" value={cropY} onChange={(event) => setCropY(Number(event.target.value))} /></label><div className="public-actions"><button className="button button-outline-dark" type="button" onClick={cancelCrop} disabled={uploading}>Cancel</button><button className="button button-primary" type="button" onClick={saveCroppedPhoto} disabled={uploading}>{uploading ? "Saving…" : "Save photo"}</button></div></section></div>}
    <form className="account-form" onSubmit={submit} aria-busy={saving}>
      <label>Display name<input name="display_name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={80} autoComplete="name" required={onboarding} disabled={busy} /></label>
      <label>Telegram username<input name="telegram_username" defaultValue={initialProfile.telegram_username ?? ""} pattern="@?[A-Za-z0-9_]{5,32}" placeholder="@username" disabled={busy} /></label>
      <label>English level<select name="english_level" value={englishLevel} onChange={(event) => setEnglishLevel(event.target.value)} disabled={busy}><option value="">Choose your level</option><option value="beginner">Beginner</option><option value="elementary">Elementary</option><option value="pre-intermediate">Pre-intermediate</option><option value="intermediate">Intermediate</option><option value="upper-intermediate">Upper-intermediate</option><option value="advanced">Advanced</option></select></label>
      <button className="button button-primary" disabled={busy}>{saving ? "Saving…" : onboarding ? "Complete profile" : "Save profile"}</button>
      {notice && <p className={`form-status ${notice.kind}`} role="status" aria-live="polite">{notice.text}</p>}
    </form>
  </>;
}
