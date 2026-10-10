"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, CheckCircle2, Loader2, LockKeyhole, Package, Save, Settings2, Truck } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { courierProviderNames, type CourierProvider, type CourierProviderId } from "@/lib/courier-types";
import { buildCourierSettingsPatch, courierSettingsDraft, courierSettingsFields, isCourierCredentialKey, type CourierCredentialKey, type CourierSettingKey, type CourierSettings, type CourierSettingsPatch, type CourierSettingScope } from "@/lib/courier-settings";
import styles from "./admin-courier-settings.module.css";

type SaveSettings = (scope: CourierSettingScope, changes: CourierSettingsPatch) => Promise<void>;
const providerIds: CourierProviderId[] = ["steadfast", "pathao", "redx"];
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "Unable to save courier settings. Try again.";

function ProviderSettingsForm({ id, settings, busy, saving, onSave }: { id: CourierProviderId; settings: CourierSettings; busy: boolean; saving: boolean; onSave: SaveSettings }) {
  const [draft, setDraft] = useState(() => courierSettingsDraft(settings, id));
  const [clearKeys, setClearKeys] = useState<CourierCredentialKey[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const provider = settings.providers.find(item => item.id === id);
  const name = courierProviderNames[id];

  function change(key: CourierSettingKey, value: string) {
    setDraft(current => ({ ...current, [key]: value }));
    setMessage(""); setError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setMessage(""); setError("");
    try {
      const changes = buildCourierSettingsPatch(id, draft, clearKeys);
      await onSave(id, changes);
      setDraft(current => Object.fromEntries(Object.entries(current).map(([key, value]) => [key, isCourierCredentialKey(key as CourierSettingKey) ? "" : value])));
      setClearKeys([]);
      setMessage(`${name} settings saved. Changes apply immediately.`);
    } catch (error) { setError(errorMessage(error)); }
  }

  return <form className={styles.card} onSubmit={event => void submit(event)} aria-label={`${name} courier settings`}>
    <header className={styles.cardHeader}>
      <div className={styles.providerTitle}><span className={`${styles.providerIcon} ${styles[id]}`}><Truck size={19} /></span><h3>{name}</h3></div>
      <span className={`${styles.badge} ${provider?.configured ? styles.configured : ""}`}>{provider?.configured ? "API configured" : "Setup needed"}</span>
    </header>
    <p className={styles.description}>{provider?.configured ? "Credentials are configured. The courier checks them when you send an order." : "Add your merchant credentials to enable courier booking."}</p>
    <div className={styles.fields}>{courierSettingsFields[id].map(field => {
      const credential = isCourierCredentialKey(field.key) ? settings.credentials[field.key] : undefined;
      const configured = credential?.configured === true;
      const removing = clearKeys.includes(field.key as CourierCredentialKey);
      const inputId = `courier-setting-${field.key.toLowerCase()}`;
      return <div key={field.key} className={styles.field}>
        <div className={styles.labelLine}><label htmlFor={inputId}>{field.label}{field.kind === "credential" && !configured && <span className={styles.required}>*</span>}</label>{configured && <span className={styles.status}><Check size={11} />{credential.source === "admin" ? "Saved" : "Server configured"}</span>}</div>
        {field.kind === "environment" ? <select id={inputId} className={styles.select} value={draft[field.key] || "production"} disabled={busy} onChange={event => change(field.key, event.target.value)}><option value="production">Production</option><option value="sandbox">Sandbox</option></select> : <input id={inputId} className={styles.input} type={field.kind === "credential" ? "password" : "number"} value={draft[field.key] || ""} disabled={busy || removing} required={field.kind === "credential" && !configured && !removing} min={field.kind === "store" ? "1" : undefined} step={field.kind === "store" ? "1" : undefined} autoComplete={field.kind === "credential" ? "new-password" : "off"} spellCheck={false} placeholder={field.kind === "credential" ? configured ? "Saved — leave blank to keep" : `Enter ${field.label.toLowerCase()}` : "Optional store ID"} onChange={event => change(field.key, event.target.value)} />}
        {field.helper && <p className={styles.helper}>{field.helper}</p>}
        {field.kind === "credential" && configured && <label className={`${styles.remove} ${removing ? styles.removeSelected : ""}`}><input type="checkbox" checked={removing} disabled={busy} onChange={event => { const key = field.key as CourierCredentialKey; if (event.target.checked) change(key, ""); setClearKeys(current => event.target.checked ? [...current, key] : current.filter(item => item !== key)); setMessage(""); setError(""); }} />Remove credential on save</label>}
        {removing && <p className={styles.helper}>Enter a new credential later to enable it again.</p>}
      </div>;
    })}</div>
    <div className={styles.footer}>
      <button className={styles.button} type="submit" disabled={busy}>{saving ? <Loader2 size={15} className={styles.spinner} /> : <Save size={15} />}{saving ? "Saving…" : `Save ${name} settings`}</button>
      {error && <p className={`${styles.message} ${styles.error}`} role="alert"><AlertCircle size={14} />{error}</p>}
      {message && <p className={styles.message} role="status"><CheckCircle2 size={14} />{message}</p>}
    </div>
  </form>;
}

function ParcelDefaultsForm({ settings, busy, saving, onSave }: { settings: CourierSettings; busy: boolean; saving: boolean; onSave: SaveSettings }) {
  const [weight, setWeight] = useState(settings.values.COURIER_DEFAULT_WEIGHT_KG || "0.5");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setMessage(""); setError("");
    try { await onSave("defaults", buildCourierSettingsPatch("defaults", { COURIER_DEFAULT_WEIGHT_KG: weight })); setMessage("Default parcel weight saved."); }
    catch (error) { setError(errorMessage(error)); }
  }
  return <form className={`${styles.card} ${styles.defaults}`} onSubmit={event => void submit(event)} aria-label="Courier parcel defaults">
    <div className={styles.defaultsIntro}><span className={styles.providerIcon}><Package size={19} /></span><div><h3>Parcel defaults</h3><p>{courierSettingsFields.defaults[0].helper}</p></div></div>
    <div className={styles.defaultFields}><div className={styles.field}><div className={styles.labelLine}><label htmlFor="courier-default-weight">Default weight (kg)</label></div><input id="courier-default-weight" className={styles.input} type="number" required min="0.5" max="10" step="0.1" value={weight} disabled={busy} onChange={event => { setWeight(event.target.value); setMessage(""); setError(""); }} /></div><button className={styles.button} type="submit" disabled={busy}>{saving ? <Loader2 size={15} className={styles.spinner} /> : <Save size={15} />}{saving ? "Saving…" : "Save defaults"}</button></div>
    {(error || message) && <p className={`${styles.message} ${styles.defaultsFeedback} ${error ? styles.error : ""}`} role={error ? "alert" : "status"}>{error ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}{error || message}</p>}
  </form>;
}

export function AdminCourierSettings({ onSaved }: { onSaved: (providers: CourierProvider[]) => void }) {
  const [settings, setSettings] = useState<CourierSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState<CourierSettingScope | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setLoadError("");
    void apiRequest<{ data: CourierSettings }>("/admin/couriers/settings").then(response => { if (active) { setSettings(response.data); onSaved(response.data.providers); } }).catch(error => { if (active) setLoadError(errorMessage(error)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadAttempt, onSaved]);

  async function save(scope: CourierSettingScope, changes: CourierSettingsPatch) {
    setSaving(scope);
    try {
      const response = await apiRequest<{ data: CourierSettings }>("/admin/couriers/settings", { method: "PATCH", body: JSON.stringify(changes) });
      setSettings(response.data); onSaved(response.data.providers);
    } finally { setSaving(null); }
  }

  return <section id="api-setup" className={styles.section} aria-labelledby="courier-api-setup-title">
    <div className={styles.heading}><span className={styles.headingIcon}><Settings2 size={23} /></span><div><h2 id="courier-api-setup-title">Courier API Setup</h2><p>Add or update your courier credentials here. Saved changes apply immediately.</p></div></div>
    {loading ? <div className={styles.notice} role="status"><Loader2 size={19} className={styles.spinner} />Loading courier settings…</div> : loadError ? <div className={`${styles.notice} ${styles.errorNotice}`} role="alert"><AlertCircle size={19} /><span>{loadError}</span><button type="button" className={styles.button} onClick={() => setLoadAttempt(current => current + 1)}>Try again</button></div> : settings && <><div className={styles.grid}>{providerIds.map(id => <ProviderSettingsForm key={id} id={id} settings={settings} busy={saving !== null} saving={saving === id} onSave={save} />)}</div><ParcelDefaultsForm settings={settings} busy={saving !== null} saving={saving === "defaults"} onSave={save} /><p className={styles.hint}><LockKeyhole size={14} /><span>Credentials are encrypted on the server and never shown after saving. Leave a saved field blank to keep it, or enter a new value to replace it. Existing server environment settings are also supported.</span></p></>}
  </section>;
}
