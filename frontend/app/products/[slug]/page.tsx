
import { utilities } from "@/lib/tailwind";
import type { Metadata } from "next";
import { Check, ChevronRight, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductPurchaseActions from "@/components/product-purchase-actions";
import ProductAccessories, { ProductDetailsTabs } from "@/components/product-accessories";
import ProductGallery from "@/components/product-gallery";
import ProductGalleryActions from "@/components/product-gallery-actions";
import ProductContentTabs from "@/components/product-content-tabs";
import SeoJsonLd from "@/components/seo-jsonld";
import { fallbackAccessoriesFor } from "@/lib/accessories";
import { getProduct, getProducts } from "@/lib/catalog";
import { normalizeDescriptionInput } from "@/lib/rich-description";
import { getColourFamilyGallery, getColourProductOptions, hasProductColourOptions } from "@/lib/product-colour-gallery";
import { absoluteUrl, breadcrumbJsonLd, buildMetadata, cleanText } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found", robots: { index: false, follow: false } };
  const description = cleanText(product.shortDescription || product.description || `${product.name} from Sarker Fabrics.`).slice(0, 260);
  return buildMetadata({
    title: product.name,
    description,
    path: `/products/${product.slug}`,
    image: product.image,
    keywords: [product.name, product.brand || "Sarker Fabrics", product.category || "clothing", "Sarker Fabrics", `${product.name} price in Bangladesh`],
  });
}

function specs(value: unknown): Array<[string,string]> {
  if (!value) return [];
  if (value instanceof Map) return [...value.entries()].map(([k,v])=>[String(k),String(v)]);
  if (typeof value === "object" && !Array.isArray(value)) return Object.entries(value as Record<string,unknown>).map(([k,v])=>[k,String(v)]);
  return [];
}

export default async function ProductDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const selectedProduct = await getProduct(slug);
  if (!selectedProduct) notFound();
  const allProducts = await getProducts({ limit: 100 });
  // Use admin-configured similar products; fallback to category match
  const adminSimilarSlugs: string[] = Array.isArray(selectedProduct.similarProducts) ? selectedProduct.similarProducts : [];
  const similar = adminSimilarSlugs.length > 0
    ? adminSimilarSlugs.map(slug => allProducts.find(p => p.slug === slug)).filter(Boolean).slice(0, 8) as typeof allProducts
    : allProducts.filter(item => item.slug !== selectedProduct.slug && (!selectedProduct.category || item.category === selectedProduct.category)).slice(0, 8);
  const comboProductSlugs = [...new Set(Array.isArray(selectedProduct.comboProducts) ? selectedProduct.comboProducts : [])]
    .filter(comboSlug => comboSlug !== selectedProduct.slug);
  const comboProducts = (await Promise.all(comboProductSlugs.map(comboSlug =>
    allProducts.find(item => item.slug === comboSlug) || getProduct(comboSlug)
  ))).filter((item): item is typeof allProducts[number] => Boolean(item));
  const adminAccessories = (selectedProduct.accessories || []).map((acc, index) => ({
    id: `admin-acc-${index}`,
    productSlug: selectedProduct.slug,
    kind: "accessory" as const,
    title: acc.name,
    price: acc.price,
    image: acc.image || (acc.images && acc.images[0]) || "",
    linkedSlug: acc.linkedSlug,
    status: "published" as const,
    sortOrder: acc.sortOrder ?? index,
  }));

  // Also fetch from accessories database by linkedProductSlug
  let linkedAccessories: typeof adminAccessories = [];
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000/api/v1";
    const res = await fetch(`${apiBase}/accessories?linkedProductSlug=${encodeURIComponent(selectedProduct.slug)}&limit=10`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      linkedAccessories = (data.data || []).map((acc: any, index: number) => ({
        id: acc._id || acc.id || `linked-acc-${index}`,
        productSlug: selectedProduct.slug,
        kind: "accessory" as const,
        title: acc.name,
        price: Number(acc.price || 0),
        image: acc.image || (acc.images?.[0]) || "",
        linkedSlug: acc.slug,
        status: "published" as const,
        sortOrder: acc.sortOrder ?? index,
      }));
    }
  } catch { /* accessories API unavailable, skip */ }

  const allAccessoryMappings =
    adminAccessories.length > 0 ? adminAccessories :
    linkedAccessories.length > 0 ? linkedAccessories :
    fallbackAccessoriesFor(selectedProduct.slug);
  const familyGallery = getColourFamilyGallery(selectedProduct, comboProducts);
  const gallery = familyGallery.images;
  const colourProducts = getColourProductOptions(selectedProduct, comboProducts);
  const colourThumbnails = hasProductColourOptions(colourProducts.map(option => option.product))
    ? colourProducts.map(option => ({ slug: option.product.slug, image: option.image, name: option.product.name }))
    : undefined;
  const features = selectedProduct.keyFeatures?.length ? selectedProduct.keyFeatures : [selectedProduct.meta || "Official product", selectedProduct.stock && selectedProduct.stock > 0 ? "Available in stock" : "Contact us for availability"];
  const specificationRows = specs(selectedProduct.specifications);
  const descriptionHtml = normalizeDescriptionInput(selectedProduct.descriptionHtml || selectedProduct.description || selectedProduct.shortDescription || `${selectedProduct.name} is available from Sarker Fabrics.`);
  const description = cleanText(selectedProduct.shortDescription || selectedProduct.description || descriptionHtml || `${selectedProduct.name} from Sarker Fabrics.`).slice(0, 500);
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${absoluteUrl(`/products/${selectedProduct.slug}`)}#product`,
    name: selectedProduct.name,
    url: absoluteUrl(`/products/${selectedProduct.slug}`),
    image: gallery.filter(Boolean).map((image) => absoluteUrl(image)),
    description,
    sku: selectedProduct.sku || undefined,
    brand: selectedProduct.brand ? { "@type": "Brand", name: selectedProduct.brand } : undefined,
    category: selectedProduct.category || undefined,
    itemCondition: "https://schema.org/NewCondition",
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/products/${selectedProduct.slug}`),
      priceCurrency: "BDT",
      price: selectedProduct.price,
      availability: Number(selectedProduct.stock || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Sarker Fabrics", url: absoluteUrl("/") },
    },
  };
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
    { name: selectedProduct.name, path: `/products/${selectedProduct.slug}` },
  ]);

  return <>
    <SeoJsonLd id="product-schema" data={[productSchema, breadcrumbs]} />
    <main>
      <div className={utilities("page-container breadcrumb", [15, "[:where(&).page-container]:[width:min(1240px,_calc(100%_-_24px))] [:where(&).page-container]:[margin-inline:auto]"], [16, "[@media_(min-width:_768px)]:[:where(&).page-container]:[width:min(1240px,_calc(100%_-_48px))]"], [333, "[.catalog-hero_:where(&).page-container]:relative [.catalog-hero_:where(&).page-container]:[z-index:1]"], [396, "[:where(&).breadcrumb]:flex [:where(&).breadcrumb]:items-center [:where(&).breadcrumb]:[gap:6px] [:where(&).breadcrumb]:[color:#7b879a] [:where(&).breadcrumb]:[padding-top:5px]! [:where(&).breadcrumb]:[padding-bottom:5px]! [:where(&).breadcrumb]:overflow-x-auto [:where(&).breadcrumb]:overflow-y-hidden [:where(&).breadcrumb]:whitespace-nowrap [:where(&).breadcrumb]:[scrollbar-width:none] [:where(&).breadcrumb]:[-webkit-overflow-scrolling:touch] [:where(&).breadcrumb]:relative [:where(&).breadcrumb]:[z-index:10] [:where(&).breadcrumb]:[max-width:100vw]"], [397, "[:where(&).breadcrumb::-webkit-scrollbar]:hidden"], [398, "[:where(&).breadcrumb_span,_:where(&).breadcrumb_a,_:where(&).breadcrumb_svg]:[flex-shrink:0] [:where(&).breadcrumb_span,_:where(&).breadcrumb_a,_:where(&).breadcrumb_svg]:whitespace-nowrap"], [399, "[:where(&).breadcrumb_a]:[color:var(--ink)]"], [400, "[:where(&).breadcrumb_a:hover]:[color:var(--red)]"], [501, "[@media_(max-width:_720px)]:[:where(&).page-container]:[width:min(100%_-_28px,_620px)]"], [636, "[:is(:where(&).breadcrumb)]:[font-size:12px]"])}><Link href="/">Home</Link><ChevronRight size={13}/><Link href="/products">Products</Link><ChevronRight size={13}/><span>{selectedProduct.name}</span></div>
      <div className={utilities("page-container product-detail-layout", [15, "[:where(&).page-container]:[width:min(1240px,_calc(100%_-_24px))] [:where(&).page-container]:[margin-inline:auto]"], [16, "[@media_(min-width:_768px)]:[:where(&).page-container]:[width:min(1240px,_calc(100%_-_48px))]"], [333, "[.catalog-hero_:where(&).page-container]:relative [.catalog-hero_:where(&).page-container]:[z-index:1]"], [401, "[:where(&).product-detail-layout]:grid [:where(&).product-detail-layout]:[padding-top:0] [:where(&).product-detail-layout]:[margin-bottom:150px] [:where(&).product-detail-layout]:[grid-template-rows:auto_auto]"], [501, "[@media_(max-width:_720px)]:[:where(&).page-container]:[width:min(100%_-_28px,_620px)]"], [546, "[@media_(max-width:_720px)]:[:where(&).product-detail-layout]:[grid-template-columns:1fr] [@media_(max-width:_720px)]:[:where(&).product-detail-layout]:flex [@media_(max-width:_720px)]:[:where(&).product-detail-layout]:flex-col [@media_(max-width:_720px)]:[:where(&).product-detail-layout]:[gap:12px] [@media_(max-width:_720px)]:[:where(&).product-detail-layout]:[margin-bottom:80px]"], [2138, "[:is(:where(&).product-detail-layout)]:[grid-template-columns:minmax(0,_1fr)_minmax(0,_1.05fr)] [:is(:where(&).product-detail-layout)]:[gap:22px] [:is(:where(&).product-detail-layout)]:[align-items:start]"], [2198, "[@media_(max-width:1050px)]:[:where(&).product-detail-layout]:[grid-template-columns:minmax(320px,_42%)_1fr] [@media_(max-width:1050px)]:[:where(&).product-detail-layout]:[gap:25px]"], [2203, "[@media_(max-width:850px)]:[:where(&).product-detail-layout]:[grid-template-columns:1fr] [@media_(max-width:850px)]:[:where(&).product-detail-layout]:flex [@media_(max-width:850px)]:[:where(&).product-detail-layout]:flex-col [@media_(max-width:850px)]:[:where(&).product-detail-layout]:[gap:12px]"], [2206, "[@media_(max-width:850px)]:[:where(&).product-detail-layout>div:first-child]:[width:100%] [@media_(max-width:850px)]:[:where(&).product-detail-layout>div:first-child]:[min-width:0]"], [2240, "[@media_(max-width:640px)]:[:where(&).product-detail-layout]:flex [@media_(max-width:640px)]:[:where(&).product-detail-layout]:flex-col [@media_(max-width:640px)]:[:where(&).product-detail-layout]:[margin-bottom:35px]"])}>
        <div>
          <ProductGallery images={gallery} name={selectedProduct.name} galleryVideos={familyGallery.galleryVideos} selectedImage={selectedProduct.images?.[0] || selectedProduct.image} colourThumbnails={colourThumbnails} selectedProductSlug={selectedProduct.slug} />
          <ProductGalleryActions product={selectedProduct} />
        </div>

        <section className={utilities("purchase-panel", [423, "[:where(&).purchase-panel]:[padding:3px_5px]"], [427, "[:where(&).purchase-panel_h1]:[line-height:1.15] [:where(&).purchase-panel_h1]:[letter-spacing:-.04em] [:where(&).purchase-panel_h1]:[margin:16px_0_13px]"], [549, "[@media_(max-width:_720px)]:[:where(&).purchase-panel]:[order:2] [@media_(max-width:_720px)]:[:where(&).purchase-panel]:[width:100%] [@media_(max-width:_720px)]:[:where(&).purchase-panel]:[min-width:0]"], [552, "[@media_(max-width:_720px)]:[:where(&).purchase-panel>*:last-child,_.purchase-panel_:where(&).product-variant-selector:last-child,_.purchase-panel_:where(&).people-also-bought-section:last-child]:[margin-bottom:0]"], [640, "[:is(:where(&).purchase-panel_h1)]:[font-size:28px]"], [694, "[@media_(max-width:_720px)]:[:where(&).purchase-panel_h1]:[font-size:23px]"], [2207, "[@media_(max-width:850px)]:[:where(&).purchase-panel_h1]:[font-size:22px]"], [2211, "[@media_(max-width:850px)]:[:where(&).purchase-panel]:[min-width:0] [@media_(max-width:850px)]:[:where(&).purchase-panel]:overflow-hidden"], [2826, "[@media_(max-width:_720px)]:[:is(:where(&).purchase-panel)]:[padding-bottom:0]"])}>
          <ProductPurchaseActions product={selectedProduct} comboProducts={comboProducts} allAccessories={allAccessoryMappings}/>
        </section>
      </div>
      <ProductDetailsTabs productSlug={selectedProduct.slug} hasCombo={allAccessoryMappings.some(item=>item.kind==="combo")}/>
      <ProductContentTabs slug={selectedProduct.slug} specs={specificationRows.length?specificationRows:[["Brand",selectedProduct.brand||"—"],["Category",selectedProduct.category||"—"],["SKU",selectedProduct.sku||"—"],["Stock",String(selectedProduct.stock??"—")]]} html={descriptionHtml} css={selectedProduct.descriptionCss} fallback={selectedProduct.description || selectedProduct.shortDescription || selectedProduct.name} initialFaqs={selectedProduct.faqs} specificationTabs={selectedProduct.specificationTabs} sizeMeasurementHtml={selectedProduct.sizeMeasurementHtml}/>
      {/* Similar products — full-width bottom section */}
      {similar.length > 0 && <section className={utilities("page-container similar-bottom-section", [15, "[:where(&).page-container]:[width:min(1240px,_calc(100%_-_24px))] [:where(&).page-container]:[margin-inline:auto]"], [16, "[@media_(min-width:_768px)]:[:where(&).page-container]:[width:min(1240px,_calc(100%_-_48px))]"], [333, "[.catalog-hero_:where(&).page-container]:relative [.catalog-hero_:where(&).page-container]:[z-index:1]"], [501, "[@media_(max-width:_720px)]:[:where(&).page-container]:[width:min(100%_-_28px,_620px)]"], [2793, "[:where(&).similar-bottom-section]:[padding-top:48px] [:where(&).similar-bottom-section]:[padding-bottom:56px]"])}>
        <div className={utilities("similar-bottom-header", [2794, "[:where(&).similar-bottom-header]:flex [:where(&).similar-bottom-header]:items-center [:where(&).similar-bottom-header]:justify-between [:where(&).similar-bottom-header]:[margin-bottom:24px] [:where(&).similar-bottom-header]:flex-wrap [:where(&).similar-bottom-header]:[gap:10px]"], [2795, "[:where(&).similar-bottom-header_h2]:[font-size:clamp(20px,_2.5vw,_28px)] [:where(&).similar-bottom-header_h2]:font-extrabold [:where(&).similar-bottom-header_h2]:[color:#081e3a] [:where(&).similar-bottom-header_h2]:[margin:0] [:where(&).similar-bottom-header_h2]:[letter-spacing:-.02em]"])}>
          <h2>People also like</h2>
          <Link href="/products" className={utilities("similar-more-link", [2796, "[:where(&).similar-more-link]:[font-size:13px] [:where(&).similar-more-link]:font-bold [:where(&).similar-more-link]:[color:#ed1c24] [:where(&).similar-more-link]:[text-decoration:none] [:where(&).similar-more-link]:flex [:where(&).similar-more-link]:items-center [:where(&).similar-more-link]:[gap:4px] [:where(&).similar-more-link]:[transition:gap_.15s]"], [2797, "[:where(&).similar-more-link:hover]:[gap:8px]"])}>View all products →</Link>
        </div>
        <div className={utilities("similar-bottom-grid", [2798, "[:where(&).similar-bottom-grid]:grid [:where(&).similar-bottom-grid]:[grid-template-columns:repeat(4,_minmax(0,_1fr))] [:where(&).similar-bottom-grid]:[gap:24px]"], [2808, "[@media_(max-width:900px)]:[:where(&).similar-bottom-grid]:[grid-template-columns:repeat(2,_1fr)] [@media_(max-width:900px)]:[:where(&).similar-bottom-grid]:[gap:12px]"])}>
          {similar.map(item=><Link href={`/products/${item.slug}`} className={utilities("similar-bottom-card", [2799, "[:where(&).similar-bottom-card]:flex [:where(&).similar-bottom-card]:flex-col [:where(&).similar-bottom-card]:[text-decoration:none] [:where(&).similar-bottom-card]:[background:transparent] [:where(&).similar-bottom-card]:[border:0] [:where(&).similar-bottom-card]:[border-radius:0]"], [2800, "[:is(:where(&).similar-bottom-card)]:overflow-hidden [:is(:where(&).similar-bottom-card)]:[transition:transform_.2s]"], [2801, "[:where(&).similar-bottom-card:hover]:[box-shadow:none] [:where(&).similar-bottom-card:hover]:[transform:translateY(-3px)]"])} key={item.slug}>
            <div className={utilities("similar-bottom-img", [2802, "[:where(&).similar-bottom-img]:[background:transparent] [:where(&).similar-bottom-img]:flex [:where(&).similar-bottom-img]:items-center [:where(&).similar-bottom-img]:justify-center [:where(&).similar-bottom-img]:[padding:0] [:where(&).similar-bottom-img]:[height:auto] [:where(&).similar-bottom-img]:[aspect-ratio:3/4]"], [2803, "[:where(&).similar-bottom-img_img]:[width:100%] [:where(&).similar-bottom-img_img]:[height:100%] [:where(&).similar-bottom-img_img]:object-cover [:where(&).similar-bottom-img_img]:block"], [2809, "[@media_(max-width:900px)]:[:where(&).similar-bottom-img]:[height:auto]"], [2811, "[@media_(max-width:640px)]:[:where(&).similar-bottom-img]:[height:auto] [@media_(max-width:640px)]:[:where(&).similar-bottom-img]:[padding:0]"])}><img src={item.image} alt={`${item.name} at Sarker Fabrics`} loading="lazy"/></div>
            <div className={utilities("similar-bottom-info", [2804, "[:where(&).similar-bottom-info]:[padding:18px_0_0] [:where(&).similar-bottom-info]:flex [:where(&).similar-bottom-info]:flex-col [:where(&).similar-bottom-info]:[gap:8px] [:where(&).similar-bottom-info]:[flex:1]"], [2805, "[:where(&).similar-bottom-info_strong]:[font-size:16px] [:where(&).similar-bottom-info_strong]:font-bold [:where(&).similar-bottom-info_strong]:[color:#0c1e36] [:where(&).similar-bottom-info_strong]:[line-height:1.35] [:where(&).similar-bottom-info_strong]:[display:-webkit-box] [:where(&).similar-bottom-info_strong]:[-webkit-line-clamp:3] [:where(&).similar-bottom-info_strong]:[-webkit-box-orient:vertical] [:where(&).similar-bottom-info_strong]:overflow-hidden"], [2806, "[:where(&).similar-bottom-info_span]:block [:where(&).similar-bottom-info_span]:[font-size:20px] [:where(&).similar-bottom-info_span]:font-extrabold [:where(&).similar-bottom-info_span]:[color:#ed1c24] [:where(&).similar-bottom-info_span]:[margin-top:4px]"], [2807, "[:where(&).similar-bottom-info_small]:flex [:where(&).similar-bottom-info_small]:items-center [:where(&).similar-bottom-info_small]:[gap:4px] [:where(&).similar-bottom-info_small]:[font-size:13px] [:where(&).similar-bottom-info_small]:[color:#7a8fa6] [:where(&).similar-bottom-info_small]:[margin-top:auto] [:where(&).similar-bottom-info_small]:[padding-top:6px]"], [2810, "[@media_(max-width:640px)]:[:where(&).similar-bottom-info]:[padding:12px_0_0] [@media_(max-width:640px)]:[:where(&).similar-bottom-info_strong]:[font-size:14px] [@media_(max-width:640px)]:[:where(&).similar-bottom-info_span]:[font-size:18px] [@media_(max-width:640px)]:[:where(&).similar-bottom-info_small]:[font-size:12px]"])}>
              <strong>{item.name}</strong>
              <span>{item.price.toLocaleString("en-BD")} BDT</span>
              <small><ShoppingCart size={16}/> View product</small>
            </div>
          </Link>)}
        </div>
      </section>}

    </main>
  </>;
}
