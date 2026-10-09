const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

/** Read the literal utilities owned by each component. This metadata only
 * controls output order; all selectors and declarations come from Tailwind. */
function componentPriorities(directory, onSource = () => {}) {
  const priorities = new Map();
  function scan(folder) {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) scan(file);
      else if (/\.tsx?$/.test(entry.name) && entry.name !== 'invoice-tailwind-css.ts') {
        onSource(file);
        const source = fs.readFileSync(file, 'utf8');
        if (!source.includes('utilities(')) continue;
        const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
        function visit(node) {
          if (ts.isArrayLiteralExpression(node) && ts.isCallExpression(node.parent)
            && ts.isIdentifier(node.parent.expression) && node.parent.expression.text === 'utilities'
            && node.elements.length === 2 && ts.isNumericLiteral(node.elements[0])
            && ts.isStringLiteral(node.elements[1])) {
            const priority = Number(node.elements[0].text);
            for (const candidate of node.elements[1].text.split(/\s+/).filter(Boolean)) {
              priorities.set(candidate, Math.max(priority, priorities.get(candidate) || 0));
            }
          }
          ts.forEachChild(node, visit);
        }
        visit(tree);
      }
    }
  }
  for (const folder of ['app', 'components', 'lib']) scan(path.join(directory, folder));
  return priorities;
}

function decodeCssClass(selector) {
  if (!selector.startsWith('.')) return '';
  return selector.slice(1).replace(/\\([0-9a-fA-F]{1,6}\s?|.)/g, (_, escape) => {
    if (/^[0-9a-fA-F]/.test(escape)) return String.fromCodePoint(parseInt(escape.trim(), 16));
    return escape;
  });
}

module.exports = () => ({
  postcssPlugin: 'component-cascade',
  OnceExit(root, { result }) {
    const priorities = componentPriorities(path.dirname(__dirname), file => {
      result.messages.push({ type: 'dependency', plugin: 'component-cascade', file });
    });
    root.walkAtRules('layer', layer => {
      if (layer.params !== 'utilities' || !layer.nodes) return;
      const ordered = [];
      for (const node of [...layer.nodes]) {
        if (node.type !== 'rule') continue;
        const candidate = decodeCssClass(node.selector);
        const priority = priorities.get(candidate);
        if (!priority) continue;
        node.remove();
        ordered.push({ node, priority });
      }
      ordered.sort((a,b) => a.priority - b.priority);
      let previous = layer;
      for (const {node} of ordered) {
        previous.parent.insertAfter(previous, node);
        previous = node;
      }
    });
  },
});
module.exports.postcss = true;
module.exports.componentPriorities = componentPriorities;
module.exports.decodeCssClass = decodeCssClass;
