"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CircleCheck, CodeXml, Copy, FileDown, Info, LoaderCircle, Pencil, Plus, Power, Printer, RefreshCw, Search, Trash2, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { Pixel, PixelInput } from "@/lib/pixel-types";
import styles from "./admin-pixels.module.css";

type Modal = { kind: "add" } | { kind: "edit"; pixel: Pixel } | { kind: "delete"; pixel: Pixel };
const PAGE_SIZE = 10;
const emptyInput = (): PixelInput => ({ name: "", pixelId: "", isActive: true });
const errorText = (error: unknown) => error instanceof Error ? error.message : "Something went wrong. Please try again.";

function PixelDialog({ modal, onClose, onSaved }: { modal: Modal; onClose: () => void; onSaved: () => Promise<void> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [input, setInput] = useState<PixelInput>(() => modal.kind === "edit" ? { name: modal.pixel.name || "", pixelId: modal.pixel.pixelId, isActive: modal.pixel.isActive } : emptyInput());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const deleting = modal.kind === "delete";

  useEffect(() => {
    const node = dialog.current;
    if (node && !node.open) node.showModal();
    return () => { if (node?.open) node.close(); };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setError("");
    const pixelId = input.pixelId.trim();
    if (!deleting && (!/^\d{5,20}$/.test(pixelId) || /^0+$/.test(pixelId))) {
      setError("Enter a valid Pixel ID using 5–20 digits.");
      return;
    }
    setSaving(true);
    try {
      if (modal.kind === "delete") {
        await apiRequest(`/admin/pixels/${modal.pixel._id}`, { method: "DELETE" });
      } else {
        await apiRequest(modal.kind === "edit" ? `/admin/pixels/${modal.pixel._id}` : "/admin/pixels", {
          method: modal.kind === "edit" ? "PATCH" : "POST",
          body: JSON.stringify({ ...input, name: input.name.trim(), pixelId }),
        });
      }
      await onSaved();
      onClose();
    } catch (cause) { setError(errorText(cause)); }
    finally { setSaving(false); }
  }

  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="pixel-dialog-title" aria-describedby="pixel-dialog-description" onCancel={event => { event.preventDefault(); if (!saving) onClose(); }}>
    <form onSubmit={submit}>
      <header className={styles.dialogHeader}>
        <span className={`${styles.dialogIcon} ${deleting ? styles.dangerIcon : ""}`}>{deleting ? <Trash2 size={22} /> : <CodeXml size={22} />}</span>
        <div><h2 id="pixel-dialog-title">{deleting ? "Delete pixel?" : modal.kind === "edit" ? "Edit pixel" : "Add Facebook pixel"}</h2><p id="pixel-dialog-description">{deleting ? "Remove this pixel from your website tracking." : "Connect your website to Meta Events Manager."}</p></div>
        <button type="button" className={styles.close} onClick={onClose} disabled={saving} aria-label="Close pixel dialog"><X size={19} /></button>
      </header>
      {deleting && modal.kind === "delete" ? <div className={styles.deleteBody}><p>Delete <strong>{modal.pixel.name || "Facebook pixel"}</strong> with ID <code>{modal.pixel.pixelId}</code>?</p><p>It will stop receiving new website events. Your Meta account and existing events remain available.</p></div> : <div className={styles.fields}>
        <label className={styles.field} htmlFor="pixel-id"><span>Pixel ID <b aria-hidden="true">*</b></span><input autoFocus id="pixel-id" name="pixelId" type="text" inputMode="numeric" autoComplete="off" required maxLength={20} value={input.pixelId} onChange={event => setInput(current => ({ ...current, pixelId: event.target.value }))} placeholder="Enter your Facebook Pixel ID" disabled={saving} aria-describedby="pixel-id-help" /><small id="pixel-id-help">Copy the numeric Pixel ID from your own Meta Events Manager.</small></label>
        <label className={styles.field} htmlFor="pixel-name"><span>Pixel name <small>(optional)</small></span><input id="pixel-name" name="name" type="text" autoComplete="off" maxLength={80} value={input.name} onChange={event => setInput(current => ({ ...current, name: event.target.value }))} placeholder="e.g. Sarker Fabrics" disabled={saving} /></label>
        <label className={styles.switchRow} htmlFor="pixel-active"><div><strong>Active</strong><p>Send website events to this pixel.</p></div><input id="pixel-active" type="checkbox" checked={input.isActive} onChange={event => setInput(current => ({ ...current, isActive: event.target.checked }))} disabled={saving} /></label>
      </div>}
      {error && <p className={styles.dialogError} role="alert">{error}</p>}
      <footer className={styles.dialogFooter}><button className={styles.button} type="button" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className={`${styles.button} ${deleting ? styles.danger : styles.primary}`} disabled={saving}>{saving ? <LoaderCircle className={styles.spin} size={16} /> : deleting ? <Trash2 size={16} /> : <CircleCheck size={16} />}{saving ? "Saving…" : deleting ? "Delete pixel" : modal.kind === "edit" ? "Save changes" : "Add pixel"}</button></footer>
    </form>
  </dialog>;
}

export default function AdminPixels() {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState<Modal | null>(null);
  const [changingId, setChangingId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await apiRequest<{ data: Pixel[] }>("/admin/pixels");
      setPixels(response.data);
    } catch (cause) { setLoadError(errorText(cause)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return pixels.filter(pixel => `${pixel.pixelId} ${pixel.name || ""} ${pixel.isActive ? "active" : "inactive"}`.toLowerCase().includes(query));
  }, [pixels, search]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const activeCount = pixels.filter(pixel => pixel.isActive).length;

  async function toggle(pixel: Pixel) {
    if (changingId) return;
    setChangingId(pixel._id);
    setNotice("");
    try {
      const response = await apiRequest<{ data: Pixel }>(`/admin/pixels/${pixel._id}`, { method: "PATCH", body: JSON.stringify({ isActive: !pixel.isActive }) });
      setPixels(current => current.map(item => item._id === pixel._id ? response.data : item));
      setNotice(`Pixel ${pixel.pixelId} is now ${response.data.isActive ? "active" : "inactive"}.`);
    } catch (cause) { setNotice(errorText(cause)); }
    finally { setChangingId(""); }
  }

  async function copy() {
    try {
      const text = ["Pixel ID\tName\tStatus", ...filtered.map(pixel => `${pixel.pixelId}\t${(pixel.name || "").replace(/[\r\n\t]/g, " ")}\t${pixel.isActive ? "Active" : "Inactive"}`)].join("\n");
      await navigator.clipboard.writeText(text);
      setNotice(`Copied ${filtered.length} ${filtered.length === 1 ? "pixel" : "pixels"}.`);
    } catch { setNotice("Clipboard access is unavailable. Please allow clipboard access and try again."); }
  }

  function print(asPdf: boolean) {
    setNotice(asPdf ? "Choose Save as PDF in the print dialog to download this list." : "Printing the current filtered pixel list.");
    window.print();
  }

  return <section className={styles.page}>
    <header className={styles.heading}><div><p className={styles.eyebrow}>Facebook Pixel Setup</p><h1>Tracking Pixels</h1><p>Manage Facebook pixels and track your storefront activity.</p></div><button type="button" className={`${styles.button} ${styles.primary}`} onClick={() => { setNotice(""); setModal({ kind: "add" }); }}><Plus size={17} />Add Pixel</button></header>
    <div className={styles.summary}><span><b>{pixels.length}</b> Total pixels</span><span><i className={styles.activeDot} /><b>{activeCount}</b> Active</span><span><i className={styles.inactiveDot} /><b>{pixels.length - activeCount}</b> Inactive</span></div>
    <div className={styles.panel}>
      <div className={styles.toolbar}><div className={styles.exports}><button type="button" className={styles.button} onClick={() => void copy()} disabled={loading || !filtered.length}><Copy size={15} />Copy</button><button type="button" className={styles.button} onClick={() => print(false)} disabled={loading || !filtered.length}><Printer size={15} />Print</button><button type="button" className={styles.button} onClick={() => print(true)} title="Choose Save as PDF in the print dialog" disabled={loading || !filtered.length}><FileDown size={15} />Save PDF</button></div><label className={styles.search}><Search size={17} /><input type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search pixel ID or name…" aria-label="Search pixels" /></label></div>
      {notice && <p className={styles.notice} role="status">{notice}</p>}
      <div className={styles.tableWrap}><table className={styles.table}><thead><tr><th scope="col">SL</th><th scope="col">Pixel ID / Name</th><th scope="col">Status</th><th scope="col" className={styles.actionColumn}>Action</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={4}><div className={styles.empty}><LoaderCircle size={27} className={styles.spin} /><p>Loading pixels…</p></div></td></tr> : loadError ? <tr><td colSpan={4}><div className={styles.empty} role="alert"><Info size={27} /><h2>Could not load pixels</h2><p>{loadError}</p><button type="button" className={styles.button} onClick={() => void load()}><RefreshCw size={15} />Try again</button></div></td></tr> : !rows.length ? <tr><td colSpan={4}><div className={styles.empty}><span className={styles.emptyIcon}><CodeXml size={28} /></span><h2>{search ? "No matching pixels" : "Your pixels will appear here"}</h2><p>{search ? "Try another Pixel ID or name." : "Add your Facebook Pixel ID to start tracking website events."}</p>{!search && <button type="button" className={`${styles.button} ${styles.primary}`} onClick={() => setModal({ kind: "add" })}><Plus size={16} />Add your first pixel</button>}</div></td></tr> : rows.map((pixel, index) => <tr key={pixel._id}><td>{(currentPage - 1) * PAGE_SIZE + index + 1}</td><td><code className={styles.pixelId}>{pixel.pixelId}</code>{pixel.name && <small className={styles.pixelName}>{pixel.name}</small>}</td><td><span className={`${styles.badge} ${pixel.isActive ? styles.active : styles.inactive}`}><i />{pixel.isActive ? "Active" : "Inactive"}</span></td><td><div className={styles.rowActions}><button type="button" className={`${styles.iconButton} ${pixel.isActive ? styles.enabledPower : ""}`} aria-label={`${pixel.isActive ? "Deactivate" : "Activate"} pixel ${pixel.pixelId}`} title={pixel.isActive ? "Deactivate pixel" : "Activate pixel"} onClick={() => void toggle(pixel)} disabled={Boolean(changingId)}>{changingId === pixel._id ? <LoaderCircle size={16} className={styles.spin} /> : <Power size={16} />}</button><button type="button" className={styles.iconButton} aria-label={`Edit pixel ${pixel.pixelId}`} title="Edit pixel" onClick={() => setModal({ kind: "edit", pixel })} disabled={Boolean(changingId)}><Pencil size={16} /></button><button type="button" className={`${styles.iconButton} ${styles.deleteButton}`} aria-label={`Delete pixel ${pixel.pixelId}`} title="Delete pixel" onClick={() => setModal({ kind: "delete", pixel })} disabled={Boolean(changingId)}><Trash2 size={16} /></button></div></td></tr>)}
      </tbody></table></div>
      <footer className={styles.tableFooter}><p>{filtered.length ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1} to ${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length} ${filtered.length === 1 ? "entry" : "entries"}` : "Showing 0 entries"}{search && pixels.length !== filtered.length ? ` (filtered from ${pixels.length})` : ""}</p><nav className={styles.pagination} aria-label="Pixel list pages"><button type="button" className={styles.pageButton} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page"><ChevronLeft size={16} /></button><span aria-current="page">{currentPage}</span><button type="button" className={styles.pageButton} disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next page"><ChevronRight size={16} /></button></nav></footer>
    </div>
    <aside className={styles.guide}><span className={styles.guideIcon}><Info size={21} /></span><div><h2>Set up your Facebook pixel</h2><p>Find your Pixel ID in <a href="https://business.facebook.com/events_manager2/" target="_blank" rel="noopener noreferrer">Meta Events Manager</a>, add it here, and keep it active. Active pixels track page views, product views, cart additions, checkout and successful orders.</p></div></aside>
    <section className={styles.printReport} aria-hidden="true"><h1>Sarker Fabrics — Tracking Pixels</h1><p>{new Date().toLocaleDateString("en-GB")}</p><table><thead><tr><th>SL</th><th>Pixel ID</th><th>Name</th><th>Status</th></tr></thead><tbody>{filtered.map((pixel, index) => <tr key={pixel._id}><td>{index + 1}</td><td>{pixel.pixelId}</td><td>{pixel.name || "—"}</td><td>{pixel.isActive ? "Active" : "Inactive"}</td></tr>)}</tbody></table></section>
    {modal && <PixelDialog key={modal.kind === "add" ? "add" : `${modal.kind}-${modal.pixel._id}`} modal={modal} onClose={() => setModal(null)} onSaved={async () => { await load(); setNotice(modal.kind === "delete" ? "Pixel deleted." : modal.kind === "edit" ? "Pixel updated." : "Pixel added."); }} />}
  </section>;
}
