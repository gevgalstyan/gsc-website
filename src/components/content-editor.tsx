"use client";

/**
 * Administrator content workspace for drafts, publishing, revisions, FAQs, and media.
 * Public pages read published values only; draft state remains private to administrators.
 * Risk: HIGH. Publishing changes production copy and metadata immediately.
 */

import Image from "next/image";
import { ChangeEvent, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Eye, History, ImagePlus, Monitor, Plus, RotateCcw, Save, Send, Smartphone, Trash2, Upload } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type EditableContent = {
  key: string;
  value: string;
  page_slug: string;
  section_slug: string;
  label: string | null;
  content_type: "text" | "textarea" | "url" | "image" | "toggle" | "seo";
  draft_value: string | null;
  published_value: string | null;
  sort_order: number;
  is_enabled: boolean;
  published_is_enabled: boolean;
  updated_at: string;
  published_at: string | null;
};

export type EditableFaq = {
  id: string;
  draft_question: string;
  draft_answer: string;
  published_question: string;
  published_answer: string;
  sort_order: number;
  draft_sort_order: number;
  published_sort_order: number;
  is_enabled: boolean;
  published_is_enabled: boolean;
  updated_at: string;
};

export type ContentRevision = {
  id: string;
  page_slug: string;
  action: string;
  changed_by: string | null;
  created_at: string;
};

export type MediaAsset = {
  id: string;
  storage_path: string;
  public_url: string;
  alt_text: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
};

const pages = [
  ["home", "Home"], ["about", "About"], ["meetups", "Meetups"], ["questions", "Questions"],
  ["how-it-works", "How it works"], ["community", "Community"], ["faq", "FAQ"],
  ["contact", "Contact"], ["membership", "Membership"],
] as const;

function validLink(value: string) {
  if (!value) return true;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function validImage(value: string) {
  return !value || (value.startsWith("/") && !value.startsWith("//")) || value.startsWith("https://vmvsxxtaqtvaotrooafq.supabase.co/storage/v1/object/public/site-media/");
}

function friendlyBytes(value: number) {
  return value < 1024 * 1024 ? `${Math.round(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
}

// ======================================================
// CONTENT EDITOR — DRAFT / PUBLISH WORKFLOW
// ======================================================
export function ContentEditor({
  initialContent,
  initialFaq,
  initialRevisions,
  initialMedia,
  currentUserId,
  mode = "content",
}: {
  initialContent: EditableContent[];
  initialFaq: EditableFaq[];
  initialRevisions: ContentRevision[];
  initialMedia: MediaAsset[];
  currentUserId: string;
  mode?: "content" | "media" | "settings";
}) {
  const [content, setContent] = useState(initialContent);
  const [faq, setFaq] = useState(initialFaq);
  const [revisions, setRevisions] = useState(initialRevisions);
  const [media, setMedia] = useState(initialMedia);
  const [page, setPage] = useState(mode === "settings" ? "settings" : "home");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [uploadAlt, setUploadAlt] = useState("");

  const pageContent = useMemo(
    () => content.filter((item) => item.page_slug === page).sort((a, b) => a.sort_order - b.sort_order),
    [content, page],
  );
  const grouped = useMemo(() => pageContent.reduce<Record<string, EditableContent[]>>((sections, item) => {
    (sections[item.section_slug] ??= []).push(item);
    return sections;
  }, {}), [pageContent]);
  const hasDraftChanges = pageContent.some((item) => (item.draft_value ?? "") !== (item.published_value ?? item.value) || item.is_enabled !== item.published_is_enabled)
    || (page === "faq" && faq.some((item, index) => item.draft_question !== item.published_question || item.draft_answer !== item.published_answer || item.is_enabled !== item.published_is_enabled || index * 10 !== item.published_sort_order));

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 4500);
  }

  function updateContent(key: string, patch: Partial<EditableContent>) {
    setContent((rows) => rows.map((row) => row.key === key ? { ...row, ...patch } : row));
  }

  // Saves editable fields without changing the published public snapshot.
  async function saveDraft(quiet = false) {
    setError("");
    setBusy(true);
    const invalid = pageContent.find((item) => item.content_type === "url" ? !validLink(item.draft_value ?? "") : item.content_type === "image" ? !validImage(item.draft_value ?? "") : false);
    if (invalid) {
      setBusy(false);
      setError(invalid.content_type === "image" ? `${invalid.label ?? invalid.key} must use a project image or one uploaded in Media.` : `${invalid.label ?? invalid.key} must be an http(s) URL or a site path beginning with /.`);
      return false;
    }
    const client = getSupabaseBrowserClient();
    if (!client) {
      setBusy(false);
      setError("Supabase is not configured in this browser.");
      return false;
    }
    const now = new Date().toISOString();
    const contentResult = pageContent.length ? await client.from("site_content").upsert(pageContent.map((item) => ({
      key: item.key,
      value: item.value,
      page_slug: item.page_slug,
      section_slug: item.section_slug,
      label: item.label,
      content_type: item.content_type,
      draft_value: item.draft_value ?? "",
      sort_order: item.sort_order,
      is_enabled: item.is_enabled,
      is_public: true,
      updated_by: currentUserId,
      updated_at: now,
    }))).select() : { error: null };
    const faqResult = page === "faq" && faq.length ? await client.from("site_faq_items").upsert(faq.map((item, index) => ({
      id: item.id,
      draft_question: item.draft_question.trim(),
      draft_answer: item.draft_answer.trim(),
      published_question: item.published_question,
      published_answer: item.published_answer,
      sort_order: item.sort_order,
      draft_sort_order: index * 10,
      published_sort_order: item.published_sort_order,
      is_enabled: item.is_enabled,
      published_is_enabled: item.published_is_enabled,
      updated_by: currentUserId,
      updated_at: now,
    }))).select() : { error: null };
    setBusy(false);
    if (contentResult.error || faqResult.error) {
      setError(contentResult.error?.message ?? faqResult.error?.message ?? "Draft could not be saved.");
      return false;
    }
    if (!quiet) flash("Draft saved. Public content has not changed.");
    return true;
  }

  // Publishes one page atomically through the database RPC and records a revision.
  async function publish() {
    if (!window.confirm(`Publish the current ${page === "settings" ? "site settings" : `${page} page`} draft?`)) return;
    const saved = await saveDraft(true);
    if (!saved) return;
    setBusy(true);
    const client = getSupabaseBrowserClient();
    const { error: publishError } = await client!.rpc("publish_site_page", { p_page_slug: page });
    // Static hosting has no revalidation endpoint. Local editor state is the
    // immediate source of truth; public clients refetch published rows.
    setBusy(false);
    if (publishError) return setError(publishError.message);
    const publishedAt = new Date().toISOString();
    setContent((rows) => rows.map((item) => item.page_slug === page ? {
      ...item,
      value: item.draft_value ?? "",
      published_value: item.draft_value ?? "",
      published_is_enabled: item.is_enabled,
      published_at: publishedAt,
    } : item));
    if (page === "faq") setFaq((rows) => rows.map((item, index) => ({ ...item, sort_order: index * 10, draft_sort_order: index * 10, published_sort_order: index * 10, published_question: item.draft_question, published_answer: item.draft_answer, published_is_enabled: item.is_enabled })));
    const revisionResult = await client!.from("site_content_revisions").select("id,page_slug,action,changed_by,created_at").eq("page_slug", page).order("created_at", { ascending: false }).limit(20);
    if (revisionResult.data) setRevisions((rows) => [...revisionResult.data, ...rows.filter((row) => row.page_slug !== page)]);
    flash("Published. Visitors now receive this version.");
  }

  async function discard() {
    if (!hasDraftChanges || !window.confirm("Discard the unpublished changes for this page?")) return;
    setBusy(true);
    const client = getSupabaseBrowserClient();
    const { error: discardError } = await client!.rpc("discard_site_page_drafts", { p_page_slug: page });
    setBusy(false);
    if (discardError) return setError(discardError.message);
    setContent((rows) => rows.map((item) => item.page_slug === page ? { ...item, draft_value: item.published_value ?? item.value, is_enabled: item.published_is_enabled } : item));
    if (page === "faq") setFaq((rows) => rows.map((item) => ({ ...item, draft_question: item.published_question, draft_answer: item.published_answer, draft_sort_order: item.published_sort_order, is_enabled: item.published_is_enabled })).sort((a, b) => a.published_sort_order - b.published_sort_order));
    flash("Unpublished changes discarded.");
  }

  // Restores a historical snapshot into draft state so it can be reviewed first.
  async function restoreRevision(id: string) {
    if (!window.confirm("Restore this published version into the draft? You can preview it before publishing.")) return;
    setBusy(true);
    const client = getSupabaseBrowserClient();
    const { error: restoreError } = await client!.rpc("restore_site_revision", { p_revision_id: id });
    const [contentResult, faqResult] = await Promise.all([
      client!.from("site_content").select("*").eq("page_slug", page).order("sort_order"),
      page === "faq" ? client!.from("site_faq_items").select("*").order("draft_sort_order") : Promise.resolve({ data: null, error: null }),
    ]);
    setBusy(false);
    if (restoreError) return setError(restoreError.message);
    if (contentResult.data) setContent((rows) => [...rows.filter((item) => item.page_slug !== page), ...(contentResult.data as EditableContent[])]);
    if (faqResult.data) setFaq(faqResult.data as EditableFaq[]);
    flash("Previous version restored to draft. Review and publish when ready.");
  }

  // ======================================================
  // FAQ CONTENT
  // ======================================================
  function addFaq() {
    setFaq((items) => [...items, {
      id: crypto.randomUUID(), draft_question: "", draft_answer: "", published_question: "", published_answer: "",
      sort_order: items.length * 10, draft_sort_order: items.length * 10, published_sort_order: items.length * 10, is_enabled: true, published_is_enabled: false, updated_at: new Date().toISOString(),
    }]);
  }

  function updateFaq(id: string, patch: Partial<EditableFaq>) {
    setFaq((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function moveFaq(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= faq.length) return;
    setFaq((items) => {
      const copy = [...items];
      [copy[index], copy[next]] = [copy[next], copy[index]];
      return copy;
    });
  }

  // ======================================================
  // STORAGE / MEDIA
  // ======================================================
  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!allowed.includes(file.type) || file.size > 5 * 1024 * 1024) return setError("Use a JPG, PNG, WebP, or AVIF image no larger than 5 MB.");
    setBusy(true);
    setError("");
    const client = getSupabaseBrowserClient();
    const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
    const upload = await client!.storage.from("site-media").upload(path, file, { cacheControl: "31536000", contentType: file.type, upsert: false });
    if (upload.error) { setBusy(false); return setError(upload.error.message); }
    const { data: publicData } = client!.storage.from("site-media").getPublicUrl(path);
    const row = await client!.from("media_assets").insert({ storage_path: path, public_url: publicData.publicUrl, alt_text: uploadAlt.trim(), mime_type: file.type, size_bytes: file.size, uploaded_by: currentUserId }).select().single();
    setBusy(false);
    if (row.error) return setError(row.error.message);
    setMedia((items) => [row.data as MediaAsset, ...items]);
    setUploadAlt("");
    flash("Image uploaded and ready to use.");
  }

  async function deleteMedia(asset: MediaAsset) {
    const used = content.some((item) => item.draft_value === asset.public_url || item.published_value === asset.public_url);
    if (used) return setError("This image is in use. Replace it in the content editor before deleting it.");
    if (!window.confirm("Delete this unused image? This cannot be undone.")) return;
    setBusy(true);
    const client = getSupabaseBrowserClient();
    const storageResult = await client!.storage.from("site-media").remove([asset.storage_path]);
    const metadataResult = storageResult.error ? null : await client!.from("media_assets").delete().eq("id", asset.id);
    setBusy(false);
    if (storageResult.error || metadataResult?.error) return setError(storageResult.error?.message ?? metadataResult?.error?.message ?? "Image could not be deleted.");
    setMedia((items) => items.filter((item) => item.id !== asset.id));
    flash("Unused image deleted.");
  }

  if (mode === "media") return <MediaManager media={media} uploadAlt={uploadAlt} setUploadAlt={setUploadAlt} uploadImage={uploadImage} deleteMedia={deleteMedia} busy={busy} notice={notice} error={error} />;

  return <section className="content-editor-shell">
    {mode === "content" && <nav className="content-page-nav" aria-label="Website pages">
      <p>Website pages</p>
      {pages.map(([slug, label]) => <button key={slug} className={page === slug ? "active" : ""} onClick={() => { setPage(slug); setShowPreview(false); }}>{label}</button>)}
    </nav>}

    <div className="content-editor-workspace">
      <header className="content-editor-header">
        <div><p className="dashboard-kicker">{mode === "settings" ? "Global configuration" : "Structured page editor"}</p><h2>{mode === "settings" ? "Site settings" : pages.find(([slug]) => slug === page)?.[1]}</h2><span className={hasDraftChanges ? "draft-state changed" : "draft-state"}>{hasDraftChanges ? "Unpublished changes" : "Published version"}</span></div>
        <div className="content-editor-actions">
          <button onClick={() => void saveDraft()} disabled={busy}><Save />Save draft</button>
          <button onClick={() => setShowPreview((value) => !value)} aria-pressed={showPreview}><Eye />Preview</button>
          <button className="publish" onClick={() => void publish()} disabled={busy}><Send />Publish</button>
          <button onClick={() => void discard()} disabled={busy || !hasDraftChanges}><RotateCcw />Discard changes</button>
        </div>
      </header>
      {notice && <div className="editor-message success" role="status"><Check />{notice}</div>}
      {error && <div className="editor-message error" role="alert">{error}</div>}

      <div className={showPreview ? "content-editor-columns with-preview" : "content-editor-columns"}>
        <div className="content-fields">
          {Object.entries(grouped).map(([section, fields]) => <fieldset key={section} className="content-field-group"><legend>{section}</legend>{fields?.map((item) => <label key={item.key} className="content-field">
            <span>{item.label ?? item.key}<small>{item.key}</small></span>
            {item.content_type === "textarea" || item.content_type === "seo" ? <textarea value={item.draft_value ?? ""} maxLength={20000} onChange={(event) => updateContent(item.key, { draft_value: event.target.value })} /> : item.content_type === "image" ? <div className="content-image-picker"><input value={item.draft_value ?? ""} maxLength={2048} onChange={(event) => updateContent(item.key, { draft_value: event.target.value })} /><select aria-label={`Choose uploaded image for ${item.label ?? item.key}`} value="" onChange={(event) => event.target.value && updateContent(item.key, { draft_value: event.target.value })}><option value="">Choose from Media…</option>{media.map((asset) => <option key={asset.id} value={asset.public_url}>{asset.alt_text || asset.storage_path}</option>)}</select></div> : <input type={item.content_type === "url" ? "url" : "text"} value={item.draft_value ?? ""} maxLength={20000} onChange={(event) => updateContent(item.key, { draft_value: event.target.value })} />}
            <span className="content-field-toggle"><input type="checkbox" checked={item.is_enabled} onChange={(event) => updateContent(item.key, { is_enabled: event.target.checked })} /> Enabled</span>
          </label>)}</fieldset>)}
          {page === "faq" && <FaqEditor items={faq} update={updateFaq} add={addFaq} move={moveFaq} />}
        </div>
        {showPreview && <DraftPreview page={page} fields={pageContent} faq={faq} previewMode={previewMode} setPreviewMode={setPreviewMode} />}
      </div>

      <section className="revision-panel"><div><History /><h3>Revision history</h3></div>{revisions.filter((item) => item.page_slug === page).slice(0, 8).map((item) => <article key={item.id}><span>{item.action}</span><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()} · {item.changed_by === currentUserId ? "You" : "Administrator"}</time><button onClick={() => void restoreRevision(item.id)} disabled={busy}>Restore to draft</button></article>)}{!revisions.some((item) => item.page_slug === page) && <p>No published revisions yet.</p>}</section>
    </div>
  </section>;
}

function FaqEditor({ items, update, add, move }: { items: EditableFaq[]; update: (id: string, patch: Partial<EditableFaq>) => void; add: () => void; move: (index: number, direction: -1 | 1) => void }) {
  return <fieldset className="content-field-group faq-editor"><legend>FAQ items</legend>{items.map((item, index) => <article key={item.id}>
    <div className="faq-editor-order"><button aria-label="Move question up" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp /></button><button aria-label="Move question down" disabled={index === items.length - 1} onClick={() => move(index, 1)}><ArrowDown /></button><span>{index + 1}</span></div>
    <label>Question<input value={item.draft_question} maxLength={500} onChange={(event) => update(item.id, { draft_question: event.target.value })} /></label>
    <label>Answer<textarea value={item.draft_answer} maxLength={5000} onChange={(event) => update(item.id, { draft_answer: event.target.value })} /></label>
    <label className="content-field-toggle"><input type="checkbox" checked={item.is_enabled} onChange={(event) => update(item.id, { is_enabled: event.target.checked })} /> Enabled</label>
    <button className="faq-remove" onClick={() => update(item.id, { is_enabled: false, draft_question: item.draft_question })}><Trash2 />Remove from site</button>
  </article>)}<button className="add-content-item" onClick={add}><Plus />Add FAQ item</button></fieldset>;
}

function DraftPreview({ page, fields, faq, previewMode, setPreviewMode }: { page: string; fields: EditableContent[]; faq: EditableFaq[]; previewMode: "desktop" | "mobile"; setPreviewMode: (mode: "desktop" | "mobile") => void }) {
  const value = (suffix: string) => fields.find((item) => item.key.endsWith(suffix))?.draft_value ?? "";
  const title = value("hero.title") || value("local_heading") || value("host.name") || "Page preview";
  const intro = value("intro") || value("hero.subtitle") || value("host.bio") || "Your draft content will appear here.";
  const photo = fields.find((item) => item.content_type === "image" && item.is_enabled)?.draft_value;
  const cta = fields.find((item) => item.key.endsWith(".cta"))?.draft_value;
  return <aside className="draft-preview-panel"><header><span>Draft preview</span><div><button className={previewMode === "desktop" ? "active" : ""} onClick={() => setPreviewMode("desktop")} aria-label="Desktop preview"><Monitor /></button><button className={previewMode === "mobile" ? "active" : ""} onClick={() => setPreviewMode("mobile")} aria-label="Mobile preview"><Smartphone /></button></div></header><div className={`draft-preview-frame ${previewMode}`}><div className="draft-preview-page"><small>{page.replaceAll("-", " ")}</small>{photo && validImage(photo) && <div className="draft-preview-image"><Image src={photo} alt="Draft preview" fill sizes="420px" unoptimized /></div>}<h3>{title}</h3>{intro.split(/\n\n+/).slice(0, 4).map((paragraph, index) => <p key={`${index}:${paragraph}`}>{paragraph}</p>)}{cta && <span className="draft-preview-cta">{cta}</span>}{page === "faq" && faq.filter((item) => item.is_enabled).slice(0, 3).map((item) => <details key={item.id}><summary>{item.draft_question || "Untitled question"}</summary><p>{item.draft_answer}</p></details>)}</div></div></aside>;
}

function MediaManager({ media, uploadAlt, setUploadAlt, uploadImage, deleteMedia, busy, notice, error }: { media: MediaAsset[]; uploadAlt: string; setUploadAlt: (value: string) => void; uploadImage: (event: ChangeEvent<HTMLInputElement>) => void; deleteMedia: (asset: MediaAsset) => void; busy: boolean; notice: string; error: string }) {
  return <section className="media-manager"><header><div><p className="dashboard-kicker">Public asset library</p><h2>Media</h2><p>Upload optimized source images, then select their URL in the Content Editor. Files are limited to 5 MB.</p></div><label className="media-upload"><ImagePlus /><span>Upload image</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={uploadImage} disabled={busy} /></label></header><label className="media-alt-input">Alt text for the next upload<input value={uploadAlt} maxLength={500} onChange={(event) => setUploadAlt(event.target.value)} placeholder="Describe the image for people using screen readers" /></label>{notice && <div className="editor-message success"><Check />{notice}</div>}{error && <div className="editor-message error">{error}</div>}<div className="media-grid">{media.map((asset) => <article key={asset.id}><div><Image src={asset.public_url} alt={asset.alt_text || "Uploaded site image"} fill sizes="(max-width: 700px) 90vw, 260px" unoptimized /></div><strong>{asset.alt_text || "No alt text yet"}</strong><small>{asset.mime_type.replace("image/", "").toUpperCase()} · {friendlyBytes(asset.size_bytes)}</small><button onClick={() => navigator.clipboard.writeText(asset.public_url)}><Upload />Copy URL</button><button className="media-delete" onClick={() => void deleteMedia(asset)} disabled={busy}><Trash2 />Delete unused</button></article>)}</div>{!media.length && <p className="admin-empty">No uploaded site media yet. The host photo and logo remain available from the project’s public assets.</p>}</section>;
}
