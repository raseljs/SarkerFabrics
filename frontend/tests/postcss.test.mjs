import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import config from '../postcss.config.mjs';

const require = createRequire(import.meta.url);
const postcss = require('postcss');
const tailwind = require('@tailwindcss/postcss');
const componentCascade = require('../scripts/component-cascade.cjs');
const directory = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

test('production CSS preserves heading overrides and responsive component priority', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const css = await fs.readFile(path.join(directory, 'app/globals.css'), 'utf8');
    const result = await postcss([
      tailwind({ ...config.plugins['@tailwindcss/postcss'], base: directory }),
      componentCascade(),
    ]).process(css, { from: path.join(directory, 'app/globals.css') });
    const roots = result.root.nodes;
    const rootHeading = roots.findIndex(node => node.type === 'rule'
      && node.toString().includes('h3:not(.main-header *)')
      && node.toString().includes('font-size: clamp('));
    const footerHeading = roots.findIndex(node => node.type === 'rule'
      && node.toString().includes('.footer-col h3')
      && node.toString().includes('font-size: 12px'));
    assert.ok(rootHeading >= 0, 'Root typography must be compiled');
    assert.ok(footerHeading > rootHeading, 'Footer headings must override the shared h3 size');
    const baseHeader = roots.findIndex(node => node.type === 'rule'
      && node.toString().includes('.header-main')
      && node.toString().includes('gap: 28px')
      && !node.toString().includes('@media'));
    const mobileHeader = roots.findIndex(node => node.type === 'rule'
      && node.toString().includes('.header-main')
      && node.toString().includes('@media (max-width: 1050px)'));
    assert.ok(baseHeader >= 0);
    assert.ok(mobileHeader > baseHeader, 'Responsive styling must keep its source priority');
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});
