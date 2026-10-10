export type ColourUpload = { color: string; images: string[]; stock: number };

/** Prepare uploaded colours, keeping photos of the main colour in its gallery. */
export function prepareColourSave(base: ColourUpload, drafts: ColourUpload[]) {
  if (drafts.length > 20) throw new Error("Add up to 20 colours at a time.");
  const normalize = (colour: ColourUpload, required: boolean): ColourUpload => {
    const color = String(colour.color || "").trim().replace(/\s+/g, " ");
    if (required && !color) throw new Error("Enter a name for every colour.");
    if (color.length > 100) throw new Error("Colour names must be 100 characters or fewer.");
    const images = [...new Set(colour.images.filter(Boolean))];
    if (required && !images.length) throw new Error(`Upload at least one photo for ${color || "each colour"}.`);
    if (required && images.length > 20) throw new Error("Upload up to 20 photos per colour.");
    const stock = Number(colour.stock);
    if (!Number.isSafeInteger(stock) || stock < 0) throw new Error("Colour stock must be a whole number of zero or more.");
    return { color, images, stock };
  };
  let primary = normalize(base, Boolean(drafts.length && base.images.length));
  const keyOf = (color: string) => color.toLocaleLowerCase("en-US");
  const uploaded = drafts.map((draft, index) => ({ colour: normalize(draft, true), index }));
  const consumedDraftIndices = new Set<number>();
  const promoted = !primary.images.length && uploaded.length > 0;
  if (promoted) {
    const selected = uploaded.find(({ colour }) => primary.color && keyOf(colour.color) === keyOf(primary.color)) || uploaded[0];
    primary = selected.colour;
    consumedDraftIndices.add(selected.index);
  }
  const variants: ColourUpload[] = [];
  const remainingDraftIndices: number[] = [];
  for (const { colour, index } of uploaded) {
    if (consumedDraftIndices.has(index)) continue;
    if (primary.color && keyOf(colour.color) === keyOf(primary.color)) {
      primary = { ...primary, images: [...new Set([...primary.images, ...colour.images])] };
    } else {
      variants.push(colour);
      remainingDraftIndices.push(index);
    }
  }
  if (uploaded.length && primary.images.length > 20) {
    throw new Error(`Upload up to 20 photos for ${primary.color}.`);
  }
  const names = new Set<string>();
  for (const colour of [primary, ...variants]) {
    if (!colour.color) continue;
    const key = keyOf(colour.color);
    if (names.has(key)) throw new Error(`The colour "${colour.color}" is added more than once.`);
    names.add(key);
  }
  return { primary, variants, promoted, remainingDraftIndices };
}
