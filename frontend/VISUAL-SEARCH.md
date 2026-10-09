# Visual product search

The storefront desktop and mobile search bars include a camera button. Users
can select JPEG, PNG or WebP files up to 10 MB, use mobile camera capture,
reopen one of six recent searches, and follow matching product links.

Recognition uses Transformers.js 3.8.1 and the quantized
`Xenova/clip-vit-base-patch32` vision projection model in a Web Worker. The
model downloads from Hugging Face on first use and is browser-cached. No API
key is required. Uploaded search images are resized locally, are not sent to
the backend or a vision API, and recent thumbnails are stored in localStorage
until cleared through Search history. Catalog embeddings are cached separately
using the image URL and product updatedAt value. Catalog images are fetched via
the existing Next Image allowlist, with direct Cloudinary fallback.

All published products returned by the public paginated products API and all
their catalog photos are compared. Accessories stored only in the separate
accessory collection are not included. Cosine similarity ranks up to 12 results;
0.55 is a conservative starting cutoff, not a confidence percentage. Appearance
cannot guarantee an exact SKU/model. Tune against a labeled catalog evaluation
set before representing results as exact identification.

The initial scan may take several minutes for a gallery-heavy catalog on CPU.
Partial matches are displayed as they are found. Later searches reuse catalog
embeddings. Stop/close terminates the worker and aborts catalog requests.
For a large production catalog, move embeddings and ranking to a server index.

Requires a modern browser with WebAssembly, Web Workers, Canvas and native
dialog support. Use HTTPS in deployment (localhost works in development).
Mobile camera availability depends on device/browser capture support; desktop
uses its normal file picker. Image/model network failures show errors or an
incomplete-results notice rather than fabricating matches.

Validation: TypeScript check, ranking unit tests, real browser photo search,
desktop/mobile menu, invalid-file handling, history and result links.
Run: `node --test tests/visual-search.test.mjs` and `npm run typecheck`.
