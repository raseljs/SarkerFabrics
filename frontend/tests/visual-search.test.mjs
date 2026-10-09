import test from 'node:test';
import assert from 'node:assert/strict';
import { cosine, rankMatches } from '../lib/visual-search-ranking.mjs';
test('cosine is independent of vector magnitude', () => {
  assert.equal(cosine([1,0], [7,0]), 1);
  assert.equal(cosine([1,0], [0,1]), 0);
});
test('invalid, zero and mismatched embeddings cannot match', () => {
  for (const value of [[], [0,0], [NaN,1], [1]]) assert.equal(cosine([1,0], value), -1);
});
test('ranks closest catalog products and excludes unrelated images', () => {
  const matches = rankMatches([1,0], [{id:'other',vector:[0,1]}, {id:'similar',vector:[0.8,0.6]}, {id:'same',vector:[2,0]}]);
  assert.deepEqual(matches.map(x=>x.id), ['same','similar']);
  assert.equal(rankMatches([1,0], [{id:'a',vector:[1,0]},{id:'b',vector:[1,0]}], 1).length, 1);
});
