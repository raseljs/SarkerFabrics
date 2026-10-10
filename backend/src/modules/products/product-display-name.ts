/** Preserve the selected colour in cart, order and pre-order snapshots. */
export function productDisplayName(product: { name?: unknown; color?: unknown }) {
  const name = typeof product.name === "string" ? product.name.trim() : "";
  const color = typeof product.color === "string" ? product.color.trim() : "";
  if (!color) return name;
  const normalizedName = name.replace(/\s+/g, " ").toLocaleLowerCase("en-US");
  const normalizedColor = color.replace(/\s+/g, " ").toLocaleLowerCase("en-US");
  if (normalizedName.endsWith(normalizedColor)) {
    const prefix = normalizedName.slice(0, -normalizedColor.length);
    if (!prefix || /[\s–—:-]$/.test(prefix)) return name;
  }
  return name ? `${name} — ${color}` : color;
}
