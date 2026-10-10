export type HomeSectionKey =
  | "hero-slider"
  | "brand-logos"
  | "featured-categories"
  | "promotional-video"
  | "new-arrival"
  | "customer-reviews"
  | "women-t-shirt"
  | "men-t-shirt"
  | "hoodie"
  | "others";

export type HomeSectionDefinition = {
  key: HomeSectionKey;
  label: string;
  title: string;
  defaultOrder: number;
  productSection?: boolean;
};

export const HOME_SECTIONS: HomeSectionDefinition[] = [
  { key: "hero-slider", label: "Hero Slider", title: "Hero Slider", defaultOrder: 10 },
  { key: "brand-logos", label: "Brand Logos", title: "Brand Logos", defaultOrder: 20 },
  { key: "featured-categories", label: "Featured Categories", title: "Featured categories", defaultOrder: 30 },
  { key: "promotional-video", label: "Promotional Video", title: "Promotional video", defaultOrder: 35 },
  { key: "new-arrival", label: "New Arrival", title: "New arrival", defaultOrder: 50, productSection: true },
  { key: "customer-reviews", label: "Our Honorable Customers", title: "Our honorable customers", defaultOrder: 70 },
  { key: "women-t-shirt", label: "Women T shirt", title: "Women T shirt", defaultOrder: 80, productSection: true },
  { key: "men-t-shirt", label: "Men T shirt", title: "Men T shirt", defaultOrder: 90, productSection: true },
  { key: "hoodie", label: "Hoodie", title: "Hoodie", defaultOrder: 100, productSection: true },
  { key: "others", label: "Others", title: "Others", defaultOrder: 130, productSection: true },
];

export const HOME_PRODUCT_SECTIONS = HOME_SECTIONS.filter((section) => section.productSection);

export function normalizeHomeSectionName(value: string | undefined) {
  return (value || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();
}

export function findHomeSectionDefinition(value: string | undefined) {
  const normalized = normalizeHomeSectionName(value);
  return HOME_SECTIONS.find((section) =>
    [section.key, section.label, section.title].some((candidate) => normalizeHomeSectionName(candidate) === normalized),
  );
}
