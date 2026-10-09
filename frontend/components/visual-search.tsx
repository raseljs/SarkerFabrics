"use client";

import { Camera, ImagePlus, History, X, ShieldCheck, Search, LoaderCircle, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { apiRequest } from '@/lib/api';
import styles from './visual-search.module.css';

type Product = { id: string; slug: string; name: string; price: number; image?: string; images?: string[]; updatedAt?: string };
type Entry = { image: string; at: number };
const HISTORY = 'drone-visual-search-history-v1';
const ACCEPT = 'image/jpeg,image/png,image/webp';

async function thumbnail(file: File): Promise<string> {
  if (!ACCEPT.split(',').includes(file.type)) throw new Error('Choose a JPG, PNG or WebP image.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Please choose an image smaller than 10 MB.');
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40_000_000) throw new Error('This image is too large. Please resize it first.');
    const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable in this browser.');
    context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally { bitmap.close(); }
}

export default function VisualSearch() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'choose'|'history'|'results'>('choose');
  const [history, setHistory] = useState<Entry[]>([]);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [notice, setNotice] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const album = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const worker = useRef<Worker | null>(null);
  const abort = useRef<AbortController | null>(null);
  const run = useRef(0);

  function stop() { run.current++; abort.current?.abort(); worker.current?.terminate(); worker.current = null; setBusy(false); }
  function close() { stop(); setOpen(false); trigger.current?.focus(); }
  useEffect(() => () => { abort.current?.abort(); worker.current?.terminate(); }, []);
  useEffect(() => {
    if (!open) return;
    dialog.current?.showModal();
    const old = document.body.style.overflow; document.body.style.overflow = 'hidden';
    try {
      const value: unknown = JSON.parse(localStorage.getItem(HISTORY) || '[]');
      if (Array.isArray(value)) setHistory(value.filter((entry): entry is Entry => typeof entry?.image === 'string' && entry.image.startsWith('data:image/jpeg;base64,') && Number.isFinite(entry.at)).slice(0, 6));
    } catch { setHistory([]); }
    return () => { document.body.style.overflow = old; };
  }, [open]);

  async function search(image: string) {
    stop(); const current = run.current;
    const controller = new AbortController(); abort.current = controller;
    setPreview(image); setView('results'); setBusy(true); setError(''); setNotice(''); setResults([]); setMessage('Loading product catalog…');
    try {
      const catalog: Product[] = [];
      for (let page = 1, pages = 1; page <= pages; page++) {
        const data = await apiRequest<{ data: Product[]; meta: { pages: number } }>(`/products?limit=100&page=${page}`, { signal: controller.signal });
        catalog.push(...data.data); pages = data.meta.pages;
      }
      if (current !== run.current) return;
      const products = [...new Map(catalog.map(item => [item.id, item])).values()].filter(item => item.slug && (item.image || item.images?.length));
      if (!products.length) { setBusy(false); setNotice('No catalog products with photos are available yet.'); return; }
      const nextHistory = [{ image, at: Date.now() }, ...history.filter(item => item.image !== image)].slice(0, 6);
      setHistory(nextHistory);
      try { localStorage.setItem(HISTORY, JSON.stringify(nextHistory)); } catch { setNotice('Search history could not be saved on this device.'); }
      const instance = new Worker(new URL('../lib/visual-search.worker.ts', import.meta.url), { type: 'module' });
      worker.current = instance;
      instance.onmessage = event => {
        if (current !== run.current) return;
        const data = event.data;
        if (data.type === 'progress') setMessage(data.message);
        if (data.type === 'error') { setError(data.message); setBusy(false); instance.terminate(); }
        if (data.type === 'results' || data.type === 'partial') {
          setResults(data.matches.map((match: { id: string }) => products.find(item => item.id === match.id)).filter(Boolean));
          if (data.type === 'results') {
            if (data.skipped) console.warn('Visual search: unavailable catalog photos', JSON.stringify(data.failures));
            if (data.skipped) setNotice(`${data.skipped} catalog photo(s) could not be compared. Results may be incomplete.`);
            setBusy(false); instance.terminate();
          }
        }
      };
      instance.onerror = () => { if (current === run.current) { setError('Image search could not load. Please retry or use text search.'); setBusy(false); instance.terminate(); } };
      instance.postMessage({ image, products: products.map(item => ({ id: item.id, updatedAt: item.updatedAt, images: [...new Set([...(item.images || []), item.image].filter((url): url is string => Boolean(url)))].map(url => new URL(`/_next/image?url=${encodeURIComponent(url)}&w=256&q=75`, window.location.origin).href) })) });
    } catch (cause) {
      if (current !== run.current) return;
      setBusy(false); setError(cause instanceof Error ? cause.message : 'Unable to load the product catalog.');
    }
  }

  async function select(file?: File) {
    if (!file) return;
    setError('');
    try { await search(await thumbnail(file)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'This image cannot be opened. Try JPG or PNG.'); }
  }

  return <>
    <button ref={trigger} type="button" className={styles.trigger} aria-label="Search by image" title="Search by image" onClick={() => { setView('choose'); setError(''); setOpen(true); }}><Camera size={23}/></button>
    {open && createPortal(<dialog ref={dialog} className={styles.dialog} aria-labelledby="visual-search-heading" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className={styles.content}>
        <header className={styles.header}><div><h2 id="visual-search-heading">Search by image</h2><p>Find similar products in our store</p></div><button type="button" className={styles.icon} onClick={close} aria-label="Close image search"><X/></button></header>
        <p className={styles.privacy}><ShieldCheck size={18}/> Your photo is processed on this device.</p>
        <input ref={album} hidden type="file" accept={ACCEPT} onChange={event => { void select(event.target.files?.[0]); event.target.value = ''; }}/>
        <input ref={camera} hidden type="file" accept={ACCEPT} capture="environment" onChange={event => { void select(event.target.files?.[0]); event.target.value = ''; }}/>
        {view === 'choose' && <div className={styles.choices}>
          <button type="button" onClick={() => camera.current?.click()}><Camera/><span>Take photo<small>Use your phone camera</small></span></button>
          <button type="button" onClick={() => album.current?.click()}><ImagePlus/><span>Select from album<small>JPG, PNG or WebP · up to 10 MB</small></span></button>
          <button type="button" onClick={() => setView('history')}><History/><span>Search history<small>Recent photos saved on this device</small></span></button>
          <p className={styles.hint}>Use a clear photo of one product. On desktop, Take photo opens the image picker. First search downloads the recognition model.</p>
        </div>}
        {view === 'history' && <section><div className={styles.sectionHead}><h3>Recent searches</h3><button type="button" className={styles.secondary} onClick={() => { setHistory([]); try { localStorage.removeItem(HISTORY); } catch { setError('Unable to clear saved history in this browser.'); } }}><Trash2 size={16}/> Clear history</button></div>{history.length ? <div className={styles.history}>{history.map(item => <button type="button" key={item.at} onClick={() => void search(item.image)}><img src={item.image} alt="Search this photo again"/><small>{new Date(item.at).toLocaleDateString()}</small></button>)}</div> : <p className={styles.hint}>No recent image searches.</p>}<button type="button" className={styles.secondary} onClick={() => setView('choose')}>Back</button></section>}
        {view === 'results' && <section>
          <div className={styles.query}><img src={preview} alt="Your search photo"/><div><h3>{busy ? 'Finding similar products…' : 'Visual matches'}</h3><p>Matches are based on appearance, not an exact model guarantee.</p><button type="button" className={styles.secondary} disabled={busy} onClick={() => album.current?.click()}>Choose another photo</button></div></div>
          {busy && <div className={styles.progress} role="status"><LoaderCircle className={styles.spin}/><p>{message}</p><button type="button" className={styles.secondary} onClick={() => { stop(); setNotice('Search stopped early. These are the matches found so far.'); }}>Stop search</button></div>}
          <>
            {results.length > 0 ? <div className={styles.results}>{results.map(product => <Link key={product.id} href={`/products/${encodeURIComponent(product.slug)}`} onClick={close}><img src={product.image || product.images?.[0]} alt={product.name}/><h4>{product.name}</h4><strong>৳{Number(product.price).toLocaleString('en-BD')}</strong><span>View product →</span></Link>)}</div> : !busy && !error && <p className={styles.hint}>No close visual matches found. Try another angle or search by product name.</p>}
            {error && <button type="button" className={styles.secondary} onClick={() => void search(preview)}><Search size={16}/> Retry search</button>}
          </>
        </section>}
        {error && <p className={styles.error} role="alert">{error}</p>}{notice && <p className={styles.hint}>{notice}</p>}
        <footer className={styles.footer}><button type="button" className={styles.secondary} onClick={close}>Close</button></footer>
      </div>
    </dialog>, document.body)}
  </>;
}
