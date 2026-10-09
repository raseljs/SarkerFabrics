// CLIP cosine similarity is a ranking signal, not a confidence percentage.
export function cosine(a, b) {
  if (!a.length || a.length !== b.length) return -1;
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) {
    if (!Number.isFinite(a[i]) || !Number.isFinite(b[i])) return -1;
    dot += a[i] * b[i]; aa += a[i] ** 2; bb += b[i] ** 2;
  }
  return aa && bb ? dot / Math.sqrt(aa * bb) : -1;
}

export function rankMatches(query, candidates, limit = 12) {
  return candidates.map(item => ({ id: item.id, score: cosine(query, item.vector) }))
    .filter(item => item.score >= 0.55)
    .sort((a, b) => b.score - a.score).slice(0, limit);
}
