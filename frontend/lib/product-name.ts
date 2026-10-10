/** Include the selected product colour in cart and order labels. */
export function productDisplayName(product: { name: string; color?: string }) {
  const name = product.name.trim();
  const color = product.color?.trim() || "";
  if (!color) return name;
  const normalizedName = name.replace(/\s+/g, " ").toLocaleLowerCase("en-US");
  const normalizedColor = color.replace(/\s+/g, " ").toLocaleLowerCase("en-US");
  if (normalizedName.endsWith(normalizedColor)) {
    const prefix = normalizedName.slice(0, -normalizedColor.length);
    if (!prefix || /[\s–—:-]$/.test(prefix)) return name;
  }
  return `${name} — ${color}`;
}
