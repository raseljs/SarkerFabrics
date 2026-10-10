import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('frontend uses native Next.js scripts for Windows-friendly development', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.scripts.dev, /^next dev/);
  assert.match(pkg.scripts.build, /^next build/);
  assert.equal(JSON.stringify(pkg).includes('vinext'), false);
});

test('search and product pages are data-driven', () => {
  assert.match(read('app/search/page.tsx'), /ProductListing/);
  assert.match(read('lib/catalog.ts'), /encodeURIComponent\(slug\)/);
  assert.match(read('app/products/\[slug\]/page.tsx'), /notFound\(\)/);
});

test('admin login cannot bypass a missing backend and customer auth does not attach admin tokens', () => {
  const login = read('app/admin/login/page.tsx');
  const api = read('lib/api.ts');
  assert.equal(login.includes('router.replace("/admin"); return;'), false);
  assert.match(login, /Backend API is not configured/);
  assert.match(api, /path\.startsWith\("\/admin"\)/);
});

test('checkout offers nationwide free delivery and sends normalized address fields', () => {
  const source = read('components/content-pages.tsx');
  assert.match(source, /Shipping Information/);
  assert.match(source, /Free Delivery/);
  assert.match(source, /All Bangladesh/);
  assert.match(source, /Have a Coupon/);
  assert.match(source, /shippingAddress:\s*\{\s*line1:/);
  assert.match(source, /Order Note \(Optional\)/);
});

test('customer account includes requested dashboard features and forgot password without email verification', () => {
  const source = read('components/customer-surfaces.tsx');
  for (const text of ['Orders','Quote','Edit Profile','Change Password','Addresses','Wish List','Star Points','Store Credit','Your Transactions','Forgot password']) assert.ok(source.includes(text), text);
  assert.equal(source.toLowerCase().includes('email verification'), false);
});

test('tracking, invoice and returns are connected to backend APIs', () => {
  const customer = read('components/customer-surfaces.tsx');
  const support = read('components/order-support-surfaces.tsx');
  assert.match(customer, /\/orders\/track\//);
  for (const status of ['confirmed','processing','packed','shipped','out_for_delivery','delivered']) assert.ok(customer.includes(status), status);
  assert.match(support, /Print \/ Save PDF/);
  assert.match(support, /\/returns/);
});

test('featured categories are backend-driven and have no small arrow button', () => {
  const home = read('app/page.tsx');
  const catalog = read('lib/catalog.ts');
  assert.match(home, /getHomepageContentBundle/);
  assert.match(catalog, /content\/homepage-bundle/);
  const featuredLine = home.split('\n').find(line => line.includes('id="featured-categories"')) || '';
  assert.equal(featuredLine.includes('ChevronRight'), false);
});

test('homepage product rails are real backend data with admin-controlled professional and beginner sections', () => {
  const source = read('app/page.tsx');
  const catalog = read('lib/catalog.ts');
  const adminProducts = read('components/admin-products.tsx');
  assert.match(source, /getHomepageProductRails/);
  assert.match(source, /professionalDrone/);
  assert.match(source, /beginnerDrone/);
  assert.match(source, /djiDrone/);
  assert.match(catalog, /\/products\/homepage/);
  assert.match(adminProducts, /Product display options/);
  assert.match(adminProducts, /isProfessionalDrone/);
  assert.match(adminProducts, /isDjiDrone/);
});

test('admin products provide CRUD, import/export, filters and rich HTML/CSS editing', () => {
  const products = read('components/admin-products.tsx');
  const editor = read('components/rich-description-editor.tsx');
  for (const text of ['Export','Import','Create product','All categories','All brands','All status']) assert.ok(products.includes(text), text);
  assert.match(editor, />HTML</);
  assert.match(editor, />CSS</);
  assert.match(editor, />Preview</);
});

test('admin inventory, queries and media are functional surfaces', () => {
  const advanced = read('components/admin-advanced.tsx');
  const media = read('components/admin-media.tsx');
  for (const text of ['Inventory Management','Add Stock','Stock Transfer','Recent Stock Activity','Warehouse Stock Summary','Total Queries','Send Reply']) assert.ok(advanced.includes(text), text);
  assert.match(media, /Media Library/);
  assert.match(media, /\/admin\/media/);
});

test('admin topbar actions route to real destinations', () => {
  const source = read('components/admin-shell.tsx');
  assert.match(source, /router\.push\("\/admin\/inventory"\)/);
  assert.match(source, /router\.push\("\/admin\/queries"\)/);
  assert.match(source, /\/admin\/products\?new=1/);
});

test('WhatsApp uses the requested number, message and faster pulse', () => {
  const store = read('components/storefront.tsx');
  const css = read('components/storefront.tsx');
  const env = read('.env.example');
  assert.match(store, /8801317768213/);
  assert.match(store, /আপনাদের তৈরি Drone Bangladesh ওয়েবসাইটটি দেখলাম/);
  assert.match(env, /NEXT_PUBLIC_WHATSAPP_NUMBER=01896123434/);
  assert.match(css, /1\.35s/);
});

test('footer policies and article routes exist', () => {
  for (const route of ['about-us','terms','privacy','shipping','returns','refund','warranty','faqs','articles']) assert.ok(fs.existsSync(new URL(`../app/${route}/page.tsx`, import.meta.url)), route);
});

test('media and customer/report admin operations have working actions', () => {
  const ops = read('components/admin-operations.tsx');
  assert.match(ops, /Enable/);
  assert.match(ops, /Disable/);
  assert.match(ops, /Export CSV/);
  assert.match(ops, /out_for_delivery/);
});

test('final hero is an accessible multi-banner slider with admin-driven CTA metadata', () => {
  const hero = read('components/hero-banner-slider.tsx');
  const admin = read('components/admin-content.tsx');
  assert.match(hero, /aria-roledescription="carousel"/);
  assert.match(hero, /Previous banner/);
  assert.match(hero, /primaryLabel/);
  assert.match(hero, /secondaryUrl/);
  assert.match(admin, /Banner slider controls/);
  assert.match(admin, /warrantyText/);
});

test('Drones, Handhelds and Enterprise mega menus use the shared admin-driven visual menu system', () => {
  const store = read('components/storefront.tsx');
  const admin = read('components/admin-content.tsx');
  const products = read('components/admin-products.tsx');
  assert.match(store, /VisualMegaMenu/);
  assert.match(store, /enterprise-top-grid/);
  assert.match(store, /enterprise-promo-grid/);
  assert.match(store, /entriesToVisualMenu/);
  assert.match(store, /productsToMenuGroups/);
  assert.match(store, /dronePromos/);
  assert.match(store, /handheldPromos/);
  assert.match(store, /fallbackEnterpriseGroups/);
  assert.match(store, /\/content\/enterprise-menu/);
  assert.match(store, /products\?limit=100&view=card/);
  assert.match(admin, /Products can also be assigned to these menu groups/);
  assert.match(admin, /menuKind/);
  assert.match(products, /Navigation mega-menu placement/);
  assert.match(products, /enterpriseMenuGroup/);
});

test('homepage section manager persists visibility/order and performance optimizations are enabled', () => {
  const admin = read('app/admin/page.tsx');
  const home = read('app/page.tsx');
  const store = read('components/storefront.tsx');
  const css = read('app/page.tsx');
  assert.match(admin, /persistSection/);
  assert.match(admin, /moveHomeSection/);
  assert.match(admin, /professional-drone/);
  assert.match(home, /home-lazy-section/);
  assert.match(store, /wishlistSlugsPromise/);
  assert.match(store, /next\/image/);
  assert.match(css, /content-visibility:auto/);
});

test('customer account reference has breadcrumb, avatar upload and exactly requested primary dashboard labels', () => {
  const source = read('components/customer-surfaces.tsx');
  assert.match(source, /account-breadcrumb/);
  assert.match(source, /\/account\/avatar/);
  for (const label of ['Orders','Quote','Edit Profile','Change Password','Addresses','Wish List','Star Points','Your Transactions']) assert.ok(source.includes(label), label);
  assert.match(source, /Store Credit/);
});

test('professional SEO covers canonical, social, schema, sitemap and noindex rules', () => {
  const seo = read('lib/seo.ts');
  const layout = read('app/layout.tsx');
  const sitemap = read('app/sitemap.ts');
  const robots = read('app/robots.ts');
  const product = read('app/products/[slug]/page.tsx');
  const article = read('app/articles/[slug]/page.tsx');
  const faq = read('app/faqs/page.tsx');
  const footer = read('components/storefront.tsx');
  assert.match(seo, /alternates: \{ canonical \}/);
  assert.match(layout, /LocalBusiness|"@type": "Store"/);
  assert.match(layout, /WebSite/);
  assert.match(layout, /Organization/);
  assert.match(product, /"@type": "Product"/);
  assert.match(product, /priceCurrency: "BDT"/);
  assert.match(article, /"@type":"Article"/);
  assert.match(faq, /"@type":"FAQPage"/);
  assert.match(product, /breadcrumbJsonLd/);
  assert.match(sitemap, /\/products\//);
  assert.match(sitemap, /\/articles\//);
  assert.match(robots, /\/checkout/);
  assert.match(robots, /\/admin\//);
  assert.match(footer, /https:\/\/www\.youtube\.com\/@dronebangladesh9726/);
  assert.match(footer, /https:\/\/web\.facebook\.com\/dronebangladesh\?/);
});

test('hero slider retains its desktop, tablet and mobile dimensions', () => {
  const css = read('components/hero-banner-slider.tsx');
  assert.match(css, /min-height:540px/);
  assert.match(css, /min-height:510px/);
  assert.match(css, /padding-top:235px/);
});

test('About Us navigation, reference body and standalone favicon are included', () => {
  const store = read('components/storefront.tsx');
  const about = read('app/about-us/page.tsx');
  const layout = read('app/layout.tsx');
  assert.match(store, /href="\/articles">Article<\/Link>\s*<Link[^>]+href="\/about-us">About Us<\/Link>/);
  for (const text of ['Your Trusted Drone','Mission','Vision','Values','Advanced Drone Portfolio','Proven Track Record','OUR STORY','Our community']) assert.ok(about.includes(text), text);
  assert.match(layout, /\/favicon\.png/);
  assert.ok(fs.existsSync(new URL('../public/favicon.png', import.meta.url)));
  assert.ok(fs.existsSync(new URL('../app/icon.png', import.meta.url)));
});

test('out-of-stock products use Pre-Order and expose customer verification surfaces', () => {
  const purchase = read('components/product-purchase-actions.tsx');
  const card = read('components/storefront.tsx');
  const checker = read('components/authenticity-checker.tsx');
  const admin = read('components/admin-preorders.tsx');
  for (const text of ['Pre-Order', '/preorders', 'paymentPlan', 'partial']) assert.ok(purchase.includes(text), text);
  assert.match(card, /preorder-card-action/);
  assert.match(checker, /Authenticity &amp; Warranty Checker/);
  assert.match(admin, /Pre-Order Management/);
  assert.ok(fs.existsSync(new URL('../app/authenticity-checker/page.tsx', import.meta.url)));
  assert.ok(fs.existsSync(new URL('../app/admin/preorders/page.tsx', import.meta.url)));
  assert.ok(fs.existsSync(new URL('../app/admin/warranty-records/page.tsx', import.meta.url)));
});

test('Next Image accepts local backend uploads and product-card quality', () => {
  const config = read('next.config.ts');
  assert.match(config, /hostname:\s*["']localhost["']/);
  assert.match(config, /port:\s*["']5000["']/);
  assert.ok(config.includes('pathname: "/uploads/**"'));
  assert.match(config, /qualities:\s*\[72,\s*75\]/);
});

test('checkout confirmation popup exposes guest invoice download and hands off to auto order tracking', () => {
  const checkout = read('components/content-pages.tsx');
  const modal = read('components/order-confirmation-modal.tsx');
  const tracking = read('components/customer-surfaces.tsx');
  const invoice = read('components/order-support-surfaces.tsx');
  const download = read('lib/invoice-download.ts');
  assert.match(checkout, /OrderConfirmationModal/);
  assert.match(checkout, /drone-last-order/);
  assert.match(checkout, /router\.push\(`\/track-order\?order=/);
  assert.match(modal, /View Invoice/);
  assert.match(modal, /Download Invoice/);
  assert.match(modal, /Minimize &amp; Track Order/);
  assert.match(tracking, /initialOrder&&initialPhone/);
  assert.match(tracking, /View \/ Download Invoice/);
  assert.match(invoice, /GuestInvoiceSurface/);
  assert.match(invoice, /\/orders\/track\//);
  assert.match(download, /Blob/);
  assert.ok(fs.existsSync(new URL('../app/order-invoice/[orderNumber]/page.tsx', import.meta.url)));
});

test('product share row is removed and homepage critical path is performance optimized', () => {
  const product = read('app/products/[slug]/page.tsx');
  const home = read('app/page.tsx');
  const store = read('components/storefront.tsx');
  const hero = read('components/hero-banner-slider.tsx');
  const catalog = read('lib/catalog.ts');
  assert.doesNotMatch(product, /product-share-bar|Share:/);
  assert.match(home, /getHomepageContentBundle/);
  assert.match(store, /requestIdleCallback/);
  assert.match(store, /SupportAssistantPanel = dynamic/);
  assert.match(hero, /const current = items\[active\]/);
  assert.match(catalog, /content\/homepage-bundle/);
});

test('admin order actions menu and editable customer details match the order management workflow', () => {
  const source = read('components/admin-operations.tsx');
  for (const text of ['View Order Details','Update Status','Add Tracking Number','Download Invoice','Cancel Order','Save Customer Info']) assert.ok(source.includes(text), text);
  assert.match(source, /downloadInvoiceHtml/);
  assert.match(source, /shippingAddress/);
  assert.match(source, /customerDraft/);
});

test('product display options expose apparel categories and keep legacy data compatibility', () => {
  const source = read('components/admin-products.tsx');
  for (const text of ['Product display options','New Arrival','Hot and popular','Active','Women T shirt','Men T shirt','Hoodie']) assert.ok(source.includes(text), text);
  assert.doesNotMatch(source, /\/> DJI Drone<\/label>/);
  assert.doesNotMatch(source, /\/> Professional Drone<\/label>/);
  assert.doesNotMatch(source, /\/> Enterprise &amp; Agriculture/);
  assert.doesNotMatch(source, /\/> Is it Enterprise product\?/);
  assert.doesNotMatch(source, /Homepage product sections/);
  assert.doesNotMatch(source, /<option value="auto">Auto<\/option>/);
  assert.doesNotMatch(source, /AUTO_HOME_SECTION_RULES/);
  assert.match(source, /isDjiDrone/);
  assert.match(source, /isProfessionalDrone/);
  assert.match(source, /isEnterpriseAgriculture/);
});
