export type HomeSectionKey =
  | "hero-slider"
  | "brand-logos"
  | "featured-categories"
  | "promotional-video"
  | "visit-stores"
  | "new-arrival"
  | "hot-products"
  | "customer-reviews"
  | "dji-drone"
  | "professional-drone"
  | "beginner-drone"
  | "personal-drone"
  | "dji-enterprise"
  | "others"
  | "enterprise-agriculture";

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
  { key: "visit-stores", label: "Visit Our Stores", title: "Visit our stores", defaultOrder: 40 },
  { key: "new-arrival", label: "New Arrival", title: "New arrival", defaultOrder: 50, productSection: true },
  { key: "hot-products", label: "Hot Products", title: "Hot & popular products", defaultOrder: 60, productSection: true },
  { key: "customer-reviews", label: "Our Honorable Customers", title: "Our honorable customers", defaultOrder: 70 },
  { key: "dji-drone", label: "DJI Drone", title: "DJI drone", defaultOrder: 80, productSection: true },
  { key: "professional-drone", label: "Professional Drone", title: "Professional drone", defaultOrder: 90, productSection: true },
  { key: "beginner-drone", label: "Beginner Drone", title: "Beginner drone", defaultOrder: 100, productSection: true },
  { key: "personal-drone", label: "Personal Drone", title: "Personal drone", defaultOrder: 110, productSection: true },
  { key: "dji-enterprise", label: "DJI Enterprise", title: "DJI Enterprise", defaultOrder: 120, productSection: true },
  { key: "others", label: "Others", title: "Others", defaultOrder: 130, productSection: true },
  { key: "enterprise-agriculture", label: "Enterprise & Agriculture", title: "Enterprise & Agriculture", defaultOrder: 140, productSection: true },
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
