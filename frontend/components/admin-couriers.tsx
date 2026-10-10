"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, ClipboardList, ExternalLink, Eye, Loader2, MapPin, PackageCheck, RefreshCw, Search, Settings2, Truck, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "react-toastify";
import { courierBookingBlockReason, courierBookingIds, courierCodAmount, courierOrderAddress, courierProviderNames, filterCourierOrders, type AdminCourierOrder, type CourierBookingOptions, type CourierBookingResponse, type CourierBookingResult, type CourierLocation, type CourierProvider, type CourierProviderId } from "@/lib/courier-types";
import { AdminCourierSettings } from "./admin-courier-settings";
import styles from "./admin-couriers.module.css";

const providerIds: CourierProviderId[] = ["steadfast", "pathao", "redx"];
const money = (value: number) => `৳${Number(value || 0).toLocaleString("en-BD")}`;
const errorText = (error: unknown) => error instanceof Error ? error.message : "Unable to complete the courier request.";
const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

function ShipmentBadge({ order }: { order: AdminCourierOrder }) {
  const shipment = order.courierShipment;
  const state = shipment?.state;
  return <span className={`${styles.badge} ${state ? styles[state] : ""}`}>{state === "booked" ? "In courier" : state === "uncertain" ? "Needs verification" : state === "pending" ? "Booking pending" : state === "failed" ? "Booking failed" : order.trackingId ? "Manually booked" : order.deliveryStatus === "delivered" ? "Delivered" : order.deliveryStatus === "cancelled" ? "Cancelled" : courierBookingBlockReason(order) ? "Not ready" : "Ready to send"}</span>;
}

function BookingResults({ results, onClose }: { results: CourierBookingResult[]; onClose?: () => void }) {
  if (!results.length) return null;
  return <div className={styles.results} aria-live="polite"><div className={styles.resultsHeader}><h3>{results.filter(result => result.success).length} sent · {results.filter(result => !result.success).length} need attention</h3>{onClose && <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Dismiss courier results"><X size={16} /></button>}</div>{results.map(result => <div key={result.orderId} className={`${styles.resultRow} ${result.success ? "" : styles.resultError}`}>{result.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}<span><strong>{result.order?.orderNumber || result.orderId}</strong>{result.message}</span></div>)}</div>;
}

function LocationSelect({ label, value, locations, onChange, disabled = false, optional = false, placeholder = "Select location" }: { label: string; value?: number; locations: CourierLocation[]; onChange: (value?: number) => void; disabled?: boolean; optional?: boolean; placeholder?: string }) {
  return <label className={styles.field}>{label}{!optional && " *"}<select value={value || ""} disabled={disabled} required={!optional} onChange={event => onChange(event.target.value ? Number(event.target.value) : undefined)}><option value="">{placeholder}</option>{locations.map(location => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>;
}

function DestinationFields({ order, provider, cities, commonAreas, options, onChange }: { order: AdminCourierOrder; provider: CourierProviderId; cities: CourierLocation[]; commonAreas: CourierLocation[]; options: CourierBookingOptions; onChange: (value: CourierBookingOptions) => void }) {
  const [zones, setZones] = useState<CourierLocation[]>([]);
  const [areas, setAreas] = useState<CourierLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (provider !== "pathao" || !options.cityId) { setZones([]); return; }
    let active = true;
    setLoading(true); setError("");
    void apiRequest<{ data: CourierLocation[] }>(`/admin/couriers/locations?provider=pathao&type=zones&parentId=${options.cityId}`).then(response => { if (active) setZones(response.data || []); }).catch(error => { if (active) setError(errorText(error)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [provider, options.cityId]);
  useEffect(() => {
    if (provider !== "pathao" || !options.zoneId) { setAreas([]); return; }
    let active = true;
    setLoading(true); setError("");
    void apiRequest<{ data: CourierLocation[] }>(`/admin/couriers/locations?provider=pathao&type=areas&parentId=${options.zoneId}`).then(response => { if (active) setAreas(response.data || []); }).catch(error => { if (active) setError(errorText(error)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [provider, options.zoneId]);
  return <div className={styles.destinationCard}><strong>{order.orderNumber} · {order.customer?.name || "Customer"}</strong><p className={styles.address}>{courierOrderAddress(order) || "No delivery address provided"}</p><div className={styles.fields}>{provider === "pathao" && <><LocationSelect label="Delivery city" value={options.cityId} locations={cities} onChange={cityId => onChange({ cityId, zoneId: undefined, areaId: undefined })} /><LocationSelect label="Delivery zone" value={options.zoneId} locations={zones} disabled={!options.cityId} onChange={zoneId => onChange({ ...options, zoneId, areaId: undefined })} /></>}<LocationSelect label="Delivery area" optional={provider === "pathao"} value={options.areaId} locations={provider === "redx" ? commonAreas : areas} disabled={provider === "pathao" && !options.zoneId} onChange={areaId => onChange({ ...options, areaId })} />{loading && <span className={styles.locationLoading}><Loader2 size={13} className={styles.spinner} /> Loading locations</span>}</div>{error && <p className={`${styles.notice} ${styles.error}`} role="alert">{error}</p>}</div>;
}

function BookingDialog({ provider, defaults, orders, busy, onClose, onSubmit }: { provider: CourierProviderId; defaults?: CourierProvider; orders: AdminCourierOrder[]; busy: boolean; onClose: () => void; onSubmit: (options: CourierBookingOptions, optionsByOrderId: Record<string, CourierBookingOptions>) => void }) {
  const [stores, setStores] = useState<CourierLocation[]>([]);
  const [cities, setCities] = useState<CourierLocation[]>([]);
  const [areas, setAreas] = useState<CourierLocation[]>([]);
  const [storeId, setStoreId] = useState<number>();
  const [weight, setWeight] = useState(String(defaults?.defaultWeightKg || 0.5));
  const [destinations, setDestinations] = useState<Record<string, CourierBookingOptions>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    const locationType = provider === "pathao" ? "cities" : "areas";
    void Promise.allSettled([
      apiRequest<{ data: CourierLocation[] }>(`/admin/couriers/locations?provider=${provider}&type=stores`),
      apiRequest<{ data: CourierLocation[] }>(`/admin/couriers/locations?provider=${provider}&type=${locationType}`),
    ]).then(([pickup, destination]) => {
      if (!active) return;
      if (pickup.status === "fulfilled") setStores(pickup.value.data || []); else setError(errorText(pickup.reason));
      if (destination.status === "fulfilled") { if (provider === "pathao") setCities(destination.value.data || []); else setAreas(destination.value.data || []); }
      else setError(errorText(destination.reason));
      setLoading(false);
    });
    return () => { active = false; };
  }, [provider]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [busy, onClose]);
  const locationsComplete = !!(storeId || defaults?.defaultStoreId) && orders.every(order => provider === "pathao" ? destinations[order._id]?.cityId && destinations[order._id]?.zoneId : destinations[order._id]?.areaId);
  return <div className={styles.overlay} onClick={event => { if (event.target === event.currentTarget && !busy) onClose(); }}><form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="courier-booking-title" onSubmit={event => { event.preventDefault(); if (locationsComplete) onSubmit({ ...(storeId ? { storeId } : {}), weight: Number(weight) }, destinations); }}><div className={styles.modalHeader}><div><h2 id="courier-booking-title">Send to {courierProviderNames[provider]}</h2><p>{orders.length} order{orders.length === 1 ? "" : "s"} · Choose each delivery location</p></div><button type="button" className={styles.iconButton} disabled={busy} onClick={onClose} aria-label="Close courier booking"><X size={17} /></button></div><div className={styles.fields}><LocationSelect label="Pickup store" optional={!!defaults?.defaultStoreId} placeholder={defaults?.defaultStoreId ? `Use default store #${defaults.defaultStoreId}` : "Select pickup store"} value={storeId} locations={stores} disabled={loading} onChange={setStoreId} /><label className={styles.field}>Parcel weight (kg) *<input type="number" min="0.5" max="10" step="0.1" required value={weight} onChange={event => setWeight(event.target.value)} /></label></div><p className={styles.modalHelp}>Pickup store and weight apply to all selected orders. Match each delivery area to the customer's address.</p>{loading ? <div className={styles.loading}><Loader2 size={22} className={styles.spinner} />Loading courier locations…</div> : orders.map(order => <DestinationFields key={order._id} order={order} provider={provider} cities={cities} commonAreas={areas} options={destinations[order._id] || {}} onChange={options => setDestinations(current => ({ ...current, [order._id]: options }))} />)}{error && <div className={`${styles.notice} ${styles.error}`} role="alert">{error}</div>}<div className={styles.modalFooter}><button type="button" className={styles.button} disabled={busy} onClick={onClose}>Cancel</button><button type="submit" className={`${styles.button} ${styles.primary}`} disabled={busy || loading || !locationsComplete || (!Number.isFinite(Number(weight)) || Number(weight) < 0.5 || Number(weight) > 10)}>{busy ? <Loader2 size={15} className={styles.spinner} /> : <Truck size={15} />}Send {orders.length} order{orders.length === 1 ? "" : "s"}</button></div></form></div>;
}

export function CourierSendControls({ orders, providers, onUpdated, onResults }: { orders: AdminCourierOrder[]; providers: CourierProvider[]; onUpdated: (order: AdminCourierOrder) => void; onResults?: (results: CourierBookingResult[]) => void }) {
  const [busy, setBusy] = useState(false);
  const [dialogProvider, setDialogProvider] = useState<CourierProviderId | null>(null);
  const [results, setResults] = useState<CourierBookingResult[]>([]);
  const [error, setError] = useState("");
  const eligible = orders.filter(order => !courierBookingBlockReason(order));
  async function book(provider: CourierProviderId, options?: CourierBookingOptions, optionsByOrderId?: Record<string, CourierBookingOptions>) {
    if (busy || !eligible.length || eligible.length > 25 || !providers.find(item => item.id === provider)?.configured) return;
    setBusy(true); setError("");
    try {
      const response = await apiRequest<{ data: CourierBookingResponse }>("/admin/couriers/book", { method: "POST", body: JSON.stringify({ orderIds: eligible.map(order => order._id), provider, ...(options ? { options } : {}), ...(optionsByOrderId ? { optionsByOrderId } : {}) }) });
      response.data.results.forEach(result => { if (result.order) onUpdated(result.order); });
      if (onResults) onResults(response.data.results); else setResults(response.data.results);
      setDialogProvider(null);
      if (response.data.failed) toast.warning(`${response.data.successful} sent. ${response.data.failed} need attention.`); else toast.success(`${response.data.successful} order${response.data.successful === 1 ? "" : "s"} sent to ${courierProviderNames[provider]}.`);
    } catch (error) { const message = errorText(error); setError(message); toast.error(message); }
    finally { setBusy(false); }
  }
  return <><div className={styles.providerButtons}>{providerIds.map(id => { const provider = providers.find(item => item.id === id); const configured = provider?.configured === true; return <button key={id} type="button" className={`${styles.providerButton} ${styles[id]}`} disabled={busy || !configured || !eligible.length || eligible.length > 25} title={!configured ? `${courierProviderNames[id]} API not configured` : `Send ${eligible.length} selected order${eligible.length === 1 ? "" : "s"}`} onClick={() => { if (id === "steadfast") void book(id); else setDialogProvider(id); }}>{busy ? <Loader2 size={15} className={styles.spinner} /> : <Truck size={15} />}{courierProviderNames[id]}</button>; })}</div>{eligible.length > 25 && <p className={`${styles.notice} ${styles.error}`}>Select a maximum of 25 orders per booking.</p>}{error && <p className={`${styles.notice} ${styles.error}`} role="alert">{error}</p>}{!onResults && <BookingResults results={results} onClose={() => setResults([])} />}{dialogProvider && <BookingDialog provider={dialogProvider} defaults={providers.find(item => item.id === dialogProvider)} orders={eligible} busy={busy} onClose={() => setDialogProvider(null)} onSubmit={(options, destinations) => void book(dialogProvider, options, destinations)} />}</>;
}

function ReconcileDialog({ order, busy, onClose, onSubmit }: { order: AdminCourierOrder; busy: boolean; onClose: () => void; onSubmit: (consignmentId: string, trackingCode?: string) => void }) {
  const [consignmentId, setConsignmentId] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  return <div className={styles.overlay}><form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="courier-reconcile-title" onSubmit={event => { event.preventDefault(); if (consignmentId.trim()) onSubmit(consignmentId.trim(), trackingCode.trim() || undefined); }}><div className={styles.modalHeader}><div><h2 id="courier-reconcile-title">Verify existing booking</h2><p>{order.orderNumber}</p></div><button type="button" className={styles.iconButton} disabled={busy} onClick={onClose} aria-label="Close booking verification"><X size={17} /></button></div><p className={styles.notice}>The courier may have received this order. Find its consignment ID in the {order.courierShipment ? courierProviderNames[order.courierShipment.provider] : "courier"} panel. Verification links the existing shipment and prevents duplicate bookings.</p><div className={styles.fields}><label className={`${styles.field} ${styles.wide}`}>Consignment ID *<input required value={consignmentId} onChange={event => setConsignmentId(event.target.value)} /></label><label className={`${styles.field} ${styles.wide}`}>Tracking code (optional)<input value={trackingCode} onChange={event => setTrackingCode(event.target.value)} /></label></div><div className={styles.modalFooter}><button type="button" className={styles.button} disabled={busy} onClick={onClose}>Cancel</button><button type="submit" className={`${styles.button} ${styles.primary}`} disabled={busy || !consignmentId.trim()}>{busy ? <Loader2 size={15} className={styles.spinner} /> : <CheckCircle2 size={15} />}Verify with courier</button></div></form></div>;
}

export function CourierShipmentActions({ order, onUpdated }: { order: AdminCourierOrder; onUpdated: (order: AdminCourierOrder) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reconciling, setReconciling] = useState(false);
  const shipment = order.courierShipment;
  async function request(action: "sync" | "reconcile", changes?: { consignmentId: string; trackingCode?: string }) {
    setBusy(true); setError("");
    try { const response = await apiRequest<{ data: AdminCourierOrder }>(`/admin/couriers/orders/${order._id}/${action}`, { method: "POST", ...(changes ? { body: JSON.stringify(changes) } : {}) }); onUpdated(response.data); setReconciling(false); toast.success(action === "sync" ? "Courier status updated." : "Existing courier booking verified."); }
    catch (error) { const message = errorText(error); setError(message); toast.error(message); }
    finally { setBusy(false); }
  }
  const safeTrackingUrl = shipment?.trackingUrl && /^https?:\/\//i.test(shipment.trackingUrl) ? shipment.trackingUrl : undefined;
  return <><div className={styles.rowActions}>{safeTrackingUrl && <a className={`${styles.button} ${styles.primary}`} href={safeTrackingUrl} target="_blank" rel="noopener noreferrer"><MapPin size={13} />Track <ExternalLink size={10} /></a>}{shipment?.state === "booked" && <button type="button" className={styles.button} disabled={busy} onClick={() => void request("sync")}>{busy ? <Loader2 size={13} className={styles.spinner} /> : <RefreshCw size={13} />}{safeTrackingUrl ? "Sync" : "Track / Sync"}</button>}{(shipment?.state === "uncertain" || shipment?.state === "pending") && <button type="button" className={styles.button} disabled={busy} onClick={() => setReconciling(true)}><CheckCircle2 size={13} />Verify booking</button>}</div>{error && <p className={styles.address} role="alert">{error}</p>}{reconciling && <ReconcileDialog order={order} busy={busy} onClose={() => setReconciling(false)} onSubmit={(consignmentId, trackingCode) => void request("reconcile", { consignmentId, trackingCode })} />}</>;
}

export function CourierOrderActions({ order, onUpdated }: { order: AdminCourierOrder; onUpdated: (order: AdminCourierOrder) => void }) {
  const [providers, setProviders] = useState<CourierProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; void apiRequest<{ data: CourierProvider[] }>("/admin/couriers/providers").then(response => { if (active) setProviders(response.data || []); }).catch(error => { if (active) setError(errorText(error)); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const blocked = courierBookingBlockReason(order);
  return <div className={styles.orderActions}><h4>Send to courier</h4>{order.courierShipment && <><ShipmentBadge order={order} /><p>{courierProviderNames[order.courierShipment.provider]} · {order.courierShipment.consignmentId || order.courierShipment.providerStatus || "Awaiting booking result"}</p><CourierShipmentActions order={order} onUpdated={onUpdated} /></>}{blocked ? <p className={styles.notice}>{blocked}</p> : loading ? <p><Loader2 size={13} className={styles.spinner} /> Checking courier setup…</p> : <><CourierSendControls orders={[order]} providers={providers} onUpdated={onUpdated} /><p>COD to collect: <strong>{money(courierCodAmount(order))}</strong></p>{!providers.some(provider => provider.configured) && <p>API not configured. Complete Courier API Setup in Courier Integration to enable booking.</p>}</>}{order.courierShipment?.errorMessage && <p className={`${styles.notice} ${styles.error}`}>{order.courierShipment.errorMessage}</p>}{error && <p className={styles.notice}>{error}</p>}<Link className={styles.button} href="/admin/couriers#api-setup"><Settings2 size={14} />Courier setup</Link></div>;
}

export default function AdminCouriers() {
  const [orders, setOrders] = useState<AdminCourierOrder[]>([]);
  const [providers, setProviders] = useState<CourierProvider[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [results, setResults] = useState<CourierBookingResult[]>([]);
  const [total, setTotal] = useState(0);
  const loadSequence = useRef(0);
  async function load(search = query, selectedProvider = providerFilter, selectedState = stateFilter) {
    const sequence = ++loadSequence.current;
    setLoading(true); setError("");
    const responses = await Promise.allSettled([apiRequest<{ data: { items: AdminCourierOrder[]; total: number } }>(`/admin/couriers/orders?limit=200&q=${encodeURIComponent(search)}&provider=${selectedProvider}&status=${selectedState}`), apiRequest<{ data: CourierProvider[] }>("/admin/couriers/providers")]);
    if (sequence !== loadSequence.current) return;
    const [orderResponse, providerResponse] = responses;
    if (orderResponse.status === "fulfilled") { setOrders(orderResponse.value.data.items || []); setTotal(orderResponse.value.data.total || 0); }
    if (providerResponse.status === "fulfilled") setProviders(providerResponse.value.data || []);
    const failure = responses.find(response => response.status === "rejected");
    if (failure?.status === "rejected") setError(errorText(failure.reason));
    setLoading(false);
  }
  useEffect(() => { const timer = window.setTimeout(() => { setSelectedIds([]); void load(query, providerFilter, stateFilter); }, 250); return () => window.clearTimeout(timer); }, [query, providerFilter, stateFilter]);
  const visible = useMemo(() => filterCourierOrders(orders, query, providerFilter, stateFilter), [orders, query, providerFilter, stateFilter]);
  const ready = orders.filter(order => !courierBookingBlockReason(order));
  const attention = orders.filter(order => ["failed", "uncertain"].includes(order.courierShipment?.state || ""));
  const inCourier = orders.filter(order => ["pending", "booked", "uncertain"].includes(order.courierShipment?.state || "") && !["cancelled", "delivered"].includes(order.deliveryStatus || ""));
  const selectedOrders = orders.filter(order => selectedIds.includes(order._id) && !courierBookingBlockReason(order));
  const selectableVisible = visible.filter(order => !courierBookingBlockReason(order));
  const allVisibleSelected = !!selectableVisible.length && selectableVisible.slice(0, 25).every(order => selectedIds.includes(order._id));
  function updateOrder(order: AdminCourierOrder) { setOrders(current => current.map(item => item._id === order._id ? order : item)); setSelectedIds(current => current.filter(id => id !== order._id)); }
  function toggleOrder(id: string) { setSelectedIds(current => current.includes(id) ? current.filter(value => value !== id) : current.length < 25 ? [...current, id] : current); }
  const selectedBookingIds = courierBookingIds(orders, selectedIds);
  return <section className={styles.page}><div className={styles.heading}><div><p className={styles.eyebrow}>Orders & delivery</p><h1>Courier Integration</h1><p>Send orders to your courier, track shipments and keep delivery updates in one place.</p></div><div className={styles.headerActions}><Link className={styles.button} href="/admin/orders"><ClipboardList size={15} />All Orders</Link><a className={styles.button} href="#api-setup"><Settings2 size={15} />API Setup</a><button type="button" className={styles.button} disabled={loading} onClick={() => void load()}><RefreshCw size={15} className={loading ? styles.spinner : ""} />Refresh</button></div></div><div className={styles.stats}>{[{ title: "All orders", value: total || orders.length, icon: ClipboardList }, { title: "In courier", value: inCourier.length, icon: Truck }, { title: "Ready to send", value: ready.length, icon: PackageCheck }, { title: "Need attention", value: attention.length, icon: AlertCircle }].map(({ title, value, icon: Icon }) => <div key={title} className={styles.stat}><div className={styles.statIcon}><Icon size={22} /></div><div><span>{title}</span><strong>{value}</strong></div></div>)}</div>{error && <div className={`${styles.notice} ${styles.error}`} role="alert">{error}<button type="button" className={styles.button} onClick={() => void load()}>Try again</button></div>}<BookingResults results={results} onClose={() => setResults([])} /><div className={styles.panel}><div className={styles.tabs}>{[{ id: "all", label: "All orders", count: orders.length }, { id: "ready", label: "Ready to send", count: ready.length }, { id: "in_courier", label: "In courier", count: inCourier.length }, { id: "attention", label: "Need attention", count: attention.length }].map(tab => <button type="button" key={tab.id} className={`${styles.tab} ${stateFilter === tab.id ? styles.activeTab : ""}`} aria-pressed={stateFilter === tab.id} onClick={() => { setStateFilter(tab.id); setSelectedIds([]); }}>{tab.label} ({tab.count})</button>)}</div><div className={styles.toolbar}><CourierSendControls orders={selectedOrders} providers={providers} onUpdated={updateOrder} onResults={setResults} /><div className={styles.filters}><label className={styles.search}><Search size={16} /><input aria-label="Search courier orders" placeholder="Order, customer or tracking…" value={query} onChange={event => setQuery(event.target.value)} /></label><select aria-label="Filter courier provider" value={providerFilter} onChange={event => setProviderFilter(event.target.value)}><option value="all">All couriers</option>{providerIds.map(id => <option key={id} value={id}>{courierProviderNames[id]}</option>)}</select></div></div><p className={styles.selectionNote}>{selectedBookingIds.length ? `${selectedBookingIds.length} order${selectedBookingIds.length === 1 ? "" : "s"} selected. Choose a courier above to send.` : "Select orders using the checkboxes, then choose a courier. Maximum 25 per batch."}{!loading && !providers.some(provider => provider.configured) && <> <a href="#api-setup">API not configured — complete setup below.</a></>}</p><div className={styles.tableWrap}><table className={styles.table}><thead><tr><th><input type="checkbox" aria-label="Select visible orders" checked={allVisibleSelected} disabled={!selectableVisible.length} onChange={() => setSelectedIds(allVisibleSelected ? [] : selectableVisible.slice(0, 25).map(order => order._id))} /></th><th>Invoice / Date</th><th>Customer & Address</th><th>Amount / COD</th><th>Status</th><th>Courier / Tracking</th><th>Action</th></tr></thead><tbody>{visible.map(order => { const blocked = courierBookingBlockReason(order); return <tr key={order._id}><td><input type="checkbox" aria-label={`Select order ${order.orderNumber}`} title={blocked} disabled={!!blocked || (!selectedIds.includes(order._id) && selectedIds.length >= 25)} checked={selectedIds.includes(order._id)} onChange={() => toggleOrder(order._id)} /></td><td><Link href={`/admin/orders?order=${encodeURIComponent(order._id)}`} className={styles.orderLink}>#{order.orderNumber}</Link><small>{formatDate(order.createdAt)}</small></td><td className={styles.customer}><strong>{order.customer?.name || "—"}</strong>{order.customer?.phone && <a className={styles.phone} href={`tel:${order.customer.phone}`}>{order.customer.phone}</a>}<p className={styles.address}>{courierOrderAddress(order) || "No address provided"}</p></td><td><strong>{money(order.total)}</strong><small>COD {money(courierCodAmount(order))}</small></td><td><ShipmentBadge order={order} /><small>{order.courierShipment?.providerStatus || (order.deliveryStatus || "confirmed").replaceAll("_", " ")}</small>{order.courierShipment?.errorMessage && <p className={styles.address}>{order.courierShipment.errorMessage}</p>}</td><td>{order.courierShipment ? <><span className={styles.providerName}>{courierProviderNames[order.courierShipment.provider]}</span><span className={styles.tracking}>{order.courierShipment.trackingCode || order.courierShipment.consignmentId || "—"}</span><CourierShipmentActions order={order} onUpdated={updateOrder} /></> : <span className={styles.address}>{order.courierPartner || "Not assigned"}{order.trackingId && <span className={styles.tracking}>{order.trackingId}</span>}</span>}</td><td><Link className={styles.button} href={`/admin/orders?order=${encodeURIComponent(order._id)}`}><Eye size={14} />View</Link></td></tr>; })}</tbody></table>{loading ? <div className={styles.loading}><Loader2 size={24} className={styles.spinner} />Loading orders…</div> : !visible.length && <div className={styles.empty}><Truck size={38} /><h3>No orders found</h3><p>{orders.length ? "Try another search or courier filter." : "New orders will appear here. Select an order and send it once your courier API is configured."}</p></div>}</div><div className={styles.footer}><span>Showing {visible.length} of {orders.length} loaded orders{total > orders.length ? ` · ${total} total` : ""}</span><span>Tracking updates use the courier's latest response.</span></div></div><AdminCourierSettings onSaved={setProviders} /></section>;
}
