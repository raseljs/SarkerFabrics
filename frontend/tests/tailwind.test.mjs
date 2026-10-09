import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

function loadModule(name) {
  const source = fs.readFileSync(new URL(`../lib/${name}.ts`, import.meta.url), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const loadedModule = { exports: {} };
  new Function('module', 'exports', 'require', code)(loadedModule, loadedModule.exports, target => loadModule(target.replace('./', '')));
  return loadedModule.exports;
}
const { resolveClasses, utilities, withTailwindStyle, tailwindHtml } = loadModule('tailwind');

test('state styling preserves the DOM hooks used by navigation and project interactions', () => {
  const localStyles = {
    'main-header': utilities([21, '[:where(&).main-header]:sticky']),
    'header-hidden': utilities([22, '[:where(&).main-header.header-hidden]:[transform:translateY(-100%)]']),
  };
  const classes = resolveClasses('main-header header-hidden', localStyles);
  assert.ok(classes.split(' ').includes('main-header'));
  assert.ok(classes.split(' ').includes('header-hidden'));
  assert.ok(classes.includes('[:where(&).main-header]:sticky'));
  assert.ok(classes.includes('[:where(&).main-header.header-hidden]:[transform:translateY(-100%)]'));
  assert.equal(resolveClasses(classes, localStyles), classes);
  assert.equal(resolveClasses('main-header'), 'main-header');
});

test('admin-selected dimensions and ordering retain React unit semantics', () => {
  const result = withTailwindStyle('home-section-shell', { width: 320, order: 8, lineHeight: 1.5, opacity: 0.75, marginTop: 0 });
  assert.equal(result.style['--style-width'], '320px');
  assert.equal(result.style['--style-order'], '8');
  assert.equal(result.style['--style-line-height'], '1.5');
  assert.equal(result.style['--style-opacity'], '0.75');
  assert.equal(result.style['--style-margin-top'], '0');
});

test('absent dynamic values leave the normal responsive width in control', () => {
  const className = utilities('page-container', [15, '[:where(&).page-container]:[width:100%]']);
  const result = withTailwindStyle(className, { width: undefined, color: null });
  assert.equal(Object.keys(result.style).length, 0);
  assert.equal(result.className, className);
  assert.ok(!result.className.includes('width:var(--style-width)'));
});

test('CMS markup keeps text, escaped attributes and important inline styling', () => {
  const input = '<div class="pd-showcase" title="A &amp; B" style="color:red!important;background-image:url(\'data:image/png;test\');width:99px">A &amp; B</div>';
  const output = tailwindHtml(input);
  assert.ok(output.includes('title="A &amp; B"'));
  assert.ok(output.includes('>A &amp; B</div>'));
  assert.ok(output.includes('--style-color:red'));
  assert.ok(output.includes('[&amp;:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[color:var(--style-color)]!'));
  assert.ok(output.includes("--style-background-image:url('data:image/png;test')"));
  assert.ok(output.includes('--style-width:99px'));
});

test('shorthand overrides retain their order after many independent CMS properties', () => {
  const result = withTailwindStyle(undefined, { color: 'red', backgroundColor: 'white', fontSize: 14, width: 200, height: 80, opacity: 0.8, paddingLeft: 30, padding: 10 });
  assert.ok(result.className.includes('[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[padding-left:'));
  assert.ok(result.className.includes('[:is(&:not(#tailwind-inline#tailwind-inline#tailwind-inline))]:[padding:'));
});

test('a later normal CMS declaration cannot overwrite an earlier important value', () => {
  const result = tailwindHtml('<div style="color:red!important;color:blue">Example</div>');
  assert.ok(result.includes('--style-color:red'));
  assert.ok(!result.includes('--style-color:blue'));
});

test('global CSS contains only Tailwind setup and no component design selectors', () => {
  const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  const statements = css.split('\n').map(line => line.trim()).filter(Boolean);
  assert.ok(statements.every(line => /^@(import|config|source)\b.*;$/.test(line)));
  assert.ok(!fs.existsSync(new URL('../lib/tailwind-styles.ts', import.meta.url)));
});
