"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check, CheckCircle2, CreditCard, Loader2, LockKeyhole, Power, RefreshCw, Save } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { buildPaymentGatewayPatch, paymentGatewayDescriptions, paymentGatewayDraft, paymentGatewayFields, paymentGatewayNames, paymentProviderIds, type PaymentGatewayPatch, type PaymentGatewaySettings, type PaymentProviderId, type PaymentSettingsResponse } from "@/lib/payment-gateways";
import styles from "./admin-payment-gateways.module.css";

type SaveGateway = (id: PaymentProviderId, patch: PaymentGatewayPatch) => Promise<PaymentGatewaySettings>;
const errorText = (error: unknown) => error instanceof Error ? error.message : "Unable to save payment settings. Try again.";
const gatewayMarks: Record<PaymentProviderId, string> = { bkash: "bKash", shurjopay: "shurjo", uddoktapay: "Uddokta", aamarpay: "aamar", sslcommerz: "SSL" };

function GatewayForm({ settings, busy, saving, onSave }: { settings: PaymentGatewaySettings; busy: boolean; saving: boolean; onSave: SaveGateway }) {
  const id = settings.id;
  const name = paymentGatewayNames[id];
  const [draft, setDraft] = useState(() => paymentGatewayDraft(settings));
  const [clearKeys, setClearKeys] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const available = settings.available === true;

  function change(key: string, value: string) {
    setDraft(current => ({ ...current, fields: { ...current.fields, [key]: value } }));
    setMessage(""); setError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(""); setMessage("");
    try {
      const patch = buildPaymentGatewayPatch(id, draft, clearKeys, settings);
      const saved = await onSave(id, patch);
      setDraft(paymentGatewayDraft(saved));
      setClearKeys([]);
      setMessage(saved.available ? `${name} saved and available at checkout.` : saved.environment === "sandbox" && saved.enabled ? `${name} saved in Sandbox. Customers continue to use Cash on Delivery.` : `${name} saved. This gateway is hidden from checkout.`);
    } catch (error) { setError(errorText(error)); }
  }

  return <form className={`${styles.card} ${styles[id]}`} onSubmit={event => void submit(event)} aria-label={`${name} payment settings`}>
    <header className={styles.cardHeader}>
      <div><h2>{name}</h2><p>{paymentGatewayDescriptions[id]}</p></div>
      <span className={styles.brandMark} aria-hidden="true">{gatewayMarks[id]}</span>
    </header>
    <div className={styles.cardBody}>
      <div className={styles.cardIntro}>
        <span className={`${styles.badge} ${available ? styles.liveBadge : ""}`}>{available ? "Available at checkout" : settings.enabled && settings.environment === "sandbox" ? "Sandbox only" : settings.configured ? "Hidden from checkout" : "Setup needed"}</span>
        <span className={styles.savedState}>{settings.configured ? <><CheckCircle2 size={13} />Credentials saved</> : <><AlertCircle size={13} />Add merchant credentials</>}</span>
      </div>
      <div className={styles.fields}>
        {paymentGatewayFields[id].map(field => {
          const configured = field.kind === "credential" && settings.credentials[field.key]?.configured === true;
          const removing = clearKeys.includes(field.key);
          const inputId = `payment-${id}-${field.key}`;
          return <div key={field.key} className={`${styles.field} ${field.fullWidth ? styles.fullWidth : ""}`}>
            <div className={styles.labelRow}><label htmlFor={inputId}>{field.label}</label>{configured && <span className={styles.credentialSaved}><Check size={11} />Saved</span>}</div>
            <input id={inputId} type={field.kind === "credential" ? "password" : field.kind === "url" ? "url" : "text"} className={styles.input} autoComplete={field.kind === "credential" ? "new-password" : "off"} spellCheck={false} maxLength={2048} value={draft.fields[field.key] || ""} disabled={busy || removing} placeholder={configured ? "Saved — leave blank to keep" : `Enter ${field.label.toLowerCase()}`} onChange={event => change(field.key, event.target.value)} />
            {field.helper && <p className={styles.helper}>{field.helper}</p>}
            {configured && <label className={`${styles.remove} ${removing ? styles.removeSelected : ""}`}><input type="checkbox" checked={removing} disabled={busy} onChange={event => { const checked = event.target.checked; if (checked) change(field.key, ""); setClearKeys(current => checked ? [...current, field.key] : current.filter(key => key !== field.key)); setMessage(""); setError(""); }} />Remove saved credential on save</label>}
          </div>;
        })}
        <div className={`${styles.field} ${styles.fullWidth}`}>
          <div className={styles.labelRow}><label htmlFor={`payment-${id}-environment`}>Environment</label></div>
          <select id={`payment-${id}-environment`} className={styles.input} value={draft.environment} disabled={busy} onChange={event => { setDraft(current => ({ ...current, environment: event.target.value === "sandbox" ? "sandbox" : "production" })); setError(""); setMessage(""); }}><option value="production">Production — customer payments</option><option value="sandbox">Sandbox — testing only</option></select>
        </div>
      </div>
      <p className={styles.environmentHint}>{draft.environment === "sandbox" ? "Sandbox payments stay hidden from customers." : "Add your production merchant credentials, then turn Gateway Status on and save."}</p>
      <div className={styles.statusRow}>
        <span className={styles.statusLabel}><Power size={16} />Gateway Status</span>
        <div className={styles.switchGroup}><span>{draft.enabled ? "On" : "Off"}</span><button type="button" role="switch" aria-checked={draft.enabled} aria-label={`${name} Gateway Status`} className={`${styles.switch} ${draft.enabled ? styles.switchOn : ""}`} disabled={busy} onClick={() => { setDraft(current => ({ ...current, enabled: !current.enabled })); setError(""); setMessage(""); }}><span /></button></div>
      </div>
      <button type="submit" className={styles.saveButton} disabled={busy}>{saving ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}{saving ? "Saving…" : `Update ${name} config`}</button>
      {error && <p className={`${styles.feedback} ${styles.error}`} role="alert"><AlertCircle size={15} />{error}</p>}
      {message && <p className={styles.feedback} role="status"><CheckCircle2 size={15} />{message}</p>}
    </div>
  </form>;
}

export default function AdminPaymentGateways() {
  const [settings, setSettings] = useState<PaymentGatewaySettings[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [saving, setSaving] = useState<PaymentProviderId | null>(null);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setLoading(true); setLoadError("");
    void apiRequest<PaymentSettingsResponse>("/admin/payments/settings", { signal: controller.signal, cache: "no-store" }).then(response => {
      if (!active) return;
      const gateways = response?.data?.gateways;
      if (response.success === false || !Array.isArray(gateways) || paymentProviderIds.some(id => !gateways.some(gateway => gateway.id === id))) throw new Error("Payment settings could not be loaded. Try again.");
      setSettings(gateways.filter(gateway => paymentProviderIds.includes(gateway.id)));
    }).catch(error => { if (active) setLoadError(errorText(error)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; controller.abort(); };
  }, [loadAttempt]);

  async function save(id: PaymentProviderId, patch: PaymentGatewayPatch) {
    setSaving(id);
    try {
      const response = await apiRequest<PaymentSettingsResponse>(`/admin/payments/settings/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      const gateways = response?.data?.gateways;
      const saved = Array.isArray(gateways) ? gateways.find(gateway => gateway.id === id) : undefined;
      if (response.success === false || !saved) throw new Error("The server did not confirm this update. Refresh payment settings and check the gateway before trying again.");
      setSettings(gateways);
      return saved;
    } finally { setSaving(null); }
  }

  return <section className={styles.page} aria-labelledby="payment-gateways-title">
    <div className={styles.heading}><span className={styles.headingIcon}><CreditCard size={25} /></span><div><h1 id="payment-gateways-title">Payment Gateways</h1><p>Manage merchant API credentials and gateway status.</p></div><span className={styles.codBadge}><CheckCircle2 size={15} />Cash on Delivery is always available</span></div>
    <p className={styles.notice}><LockKeyhole size={17} /><span>Only configured gateways with Gateway Status on in Production appear at checkout. Credentials are encrypted on the server. Leave a saved field blank to keep it.</span></p>
    {loading ? <div className={styles.loading} role="status"><Loader2 size={21} className={styles.spinner} />Loading payment settings…</div> : loadError ? <div className={`${styles.loading} ${styles.loadError}`} role="alert"><AlertCircle size={21} /><span>{loadError}</span><button type="button" className={styles.retryButton} onClick={() => setLoadAttempt(current => current + 1)}><RefreshCw size={15} />Try again</button></div> : settings && <div className={styles.grid}>{paymentProviderIds.map(id => {
      const gateway = settings.find(item => item.id === id);
      return gateway ? <GatewayForm key={id} settings={gateway} busy={saving !== null} saving={saving === id} onSave={save} /> : null;
    })}</div>}
  </section>;
}
