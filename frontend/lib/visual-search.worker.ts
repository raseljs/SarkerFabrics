import { AutoProcessor, CLIPVisionModelWithProjection, RawImage, env } from '@huggingface/transformers';
import { rankMatches } from './visual-search-ranking.mjs';

env.allowLocalModels = false;
// One thread works without cross-origin isolation and keeps inference off the UI thread.
env.backends.onnx.wasm!.numThreads = 1;
const MODEL = 'Xenova/clip-vit-base-patch32';
const CACHE = 'drone-visual-clip-v1';
type Candidate = { id: string; images: string[]; updatedAt?: string };

function progress(message: string) { self.postMessage({ type: 'progress', message }); }
const load = () => Promise.all([
  AutoProcessor.from_pretrained(MODEL),
  CLIPVisionModelWithProjection.from_pretrained(MODEL, { dtype: 'q8', device: 'wasm', progress_callback: event => {
    if (event.status === 'progress') progress(`Downloading image search model: ${Math.round(event.progress)}%`);
  } }),
]);
let model: ReturnType<typeof load> | undefined;

self.onmessage = async (event: MessageEvent<{ image: string; products: Candidate[] }>) => {
  try {
    progress('Loading image search. The first download may take a few minutes…');
    model ??= load();
    const [processor, vision] = await model;
    const embed = async (url: string) => {
      let response: Response;
      try {
        response = await fetch(url, { signal: AbortSignal.timeout(20000) });
        if (!response.ok) throw new Error('Optimized image unavailable');
      } catch (cause) {
        // Cloudinary permits CORS. Use the original catalog photo if Next's
        // thumbnail service is temporarily unavailable; never proxy arbitrary URLs.
        const original = new URL(url).searchParams.get('url');
        if (!original) throw cause;
        const asset = new URL(original, self.location.origin);
        const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL || self.location.origin).origin;
        const allowed = asset.origin === 'https://res.cloudinary.com' ||
          (asset.origin === apiOrigin && asset.pathname.startsWith('/uploads/'));
        if (!allowed) throw cause;
        response = await fetch(original, { credentials: 'omit', signal: AbortSignal.timeout(20000) });
      }
      if (!response.ok) throw new Error('Image could not be loaded');
      const image = await RawImage.fromBlob(await response.blob());
      const { image_embeds } = await vision(await processor(image));
      return Array.from(image_embeds.data as Float32Array);
    };
    const query = await embed(event.data.image);
    const cache = await caches.open(CACHE).catch(() => null);
    const vectors: { id: string; vector: number[] }[] = [];
    let skipped = 0;
    const failures: Record<string, number> = {};
    for (const [index, item] of event.data.products.entries()) {
      progress(`Comparing product ${index + 1} of ${event.data.products.length}…`);
      let best: number[] | undefined;
      let bestScore = -1;
      // Compare every catalog view, not just the first thumbnail.
      for (const url of item.images) {
        try {
          const key = new URL('/__visual_embedding__', self.location.origin);
          key.searchParams.set('image', url); key.searchParams.set('version', item.updatedAt || '');
          const stored = await cache?.match(key.href);
          const vector: number[] = stored ? await stored.json() : await embed(url);
          if (!stored) await cache?.put(key.href, new Response(JSON.stringify(vector))).catch(() => {});
          const matches = rankMatches(query, [{ id: item.id, vector }], 1);
          if (matches.length && matches[0].score > bestScore) { best = vector; bestScore = matches[0].score; }
        } catch (cause) {
          skipped++;
          const reason = cause instanceof Error ? cause.message : 'Unknown image error';
          failures[reason] = (failures[reason] || 0) + 1;
        }
      }
      if (best) vectors.push({ id: item.id, vector: best });
      self.postMessage({ type: 'partial', matches: rankMatches(query, vectors) });
    }
    self.postMessage({ type: 'results', matches: rankMatches(query, vectors), skipped, failures });
  } catch {
    model = undefined;
    self.postMessage({ type: 'error', message: 'Image search could not start. Check your internet connection and try again. Use a current Chrome, Edge or Firefox browser.' });
  }
};
