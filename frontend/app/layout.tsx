
import { utilities, resolveClasses } from "@/lib/tailwind";
import type { Metadata } from "next";
import "./globals.css";
import SiteShell from "@/components/site-shell";
import SeoJsonLd from "@/components/seo-jsonld";
import { DEFAULT_OG_IMAGE, FACEBOOK_URL, SITE_DESCRIPTION, SITE_NAME, YOUTUBE_URL, absoluteUrl, siteUrl } from "@/lib/seo";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "Sarker Fabrics | Women T shirt, Men T shirt & Hoodie", template: "%s | Sarker Fabrics" },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "E-commerce",
  creator: SITE_NAME,
  publisher: SITE_NAME,
  icons: {
    icon: "/sarker-fabrics-icon-transparent.png?v=20261009-3",
    shortcut: "/sarker-fabrics-icon-transparent.png?v=20261009-3",
    apple: "/sarker-fabrics-apple-touch-icon-transparent.png?v=20261009-3",
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: siteUrl(),
    siteName: SITE_NAME,
    type: "website",
    locale: "en_BD",
    images: [{ url: DEFAULT_OG_IMAGE, alt: "Sarker Fabrics clothing" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: { index: true, follow: true },
};

const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl()}/#organization`,
  name: SITE_NAME,
  url: siteUrl(),
  logo: absoluteUrl("/images/logo/sarker-fabrics.svg"),
  image: absoluteUrl(DEFAULT_OG_IMAGE),
  sameAs: [FACEBOOK_URL, YOUTUBE_URL],
  contactPoint: [{
    "@type": "ContactPoint",
    telephone: "+8801896123434",
    contactType: "customer support",
    areaServed: "BD",
    availableLanguage: ["English", "Bengali"],
  }],
};

const localBusiness = {
  "@context": "https://schema.org",
  "@type": "Store",
  "@id": `${siteUrl()}/#store`,
  name: SITE_NAME,
  url: siteUrl(),
  image: absoluteUrl(DEFAULT_OG_IMAGE),
  telephone: "+8801896123434",
  email: "dronebangladesh567@gmail.com",
  priceRange: "৳৳",
  currenciesAccepted: "BDT",
  paymentAccepted: "Cash on Delivery, Card, Mobile Financial Service",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Level-1, Block-B, Shop-45, Bashundhara City Shopping Complex",
    addressLocality: "Dhaka",
    postalCode: "1215",
    addressCountry: "BD",
  },
  areaServed: { "@type": "Country", name: "Bangladesh" },
  parentOrganization: { "@id": `${siteUrl()}/#organization` },
  sameAs: [FACEBOOK_URL, YOUTUBE_URL],
};

const webSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl()}/#website`,
  url: siteUrl(),
  name: SITE_NAME,
  publisher: { "@id": `${siteUrl()}/#organization` },
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl()}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

import { Inter } from "next/font/google";

// Component styling is compiled from these local Tailwind utilities.
const componentUtilities: Record<string, string> = {
  "body": utilities([3684, "[.invoice-admin_.card_:where(&).body]:[padding:10px_15px] [.invoice-admin_.card_:where(&).body]:[font-size:11px] [.invoice-admin_.card_:where(&).body]:[line-height:1.55]"]),
  "card": utilities([3619, "[.invoice-export_:where(&).card]:[border:1px_solid_#e3eaf3] [.invoice-export_:where(&).card]:[border-radius:10px] [.invoice-export_:where(&).card]:[padding:18px]"], [3620, "[.invoice-export_:where(&).card_h3]:[margin:0_0_10px] [.invoice-export_:where(&).card_h3]:[font-size:13px] [.invoice-export_:where(&).card_h3]:uppercase [.invoice-export_:where(&).card_h3]:[letter-spacing:.08em]"], [3621, "[.invoice-export_:where(&).card_p]:[margin:6px_0] [.invoice-export_:where(&).card_p]:[line-height:1.55] [.invoice-export_:where(&).card_p]:[color:#53657d]"], [3635, "[@media_(max-width:650px)]:[.invoice-export_.meta_:where(&).card]:[margin-bottom:12px]"], [3682, "[.invoice-admin_:where(&).card]:[border:1px_solid_#cfe0f7] [.invoice-admin_:where(&).card]:[border-radius:8px] [.invoice-admin_:where(&).card]:overflow-hidden [.invoice-admin_:where(&).card]:[min-height:106px]"], [3683, "[.invoice-admin_:where(&).card_h3]:[font-size:13px] [.invoice-admin_:where(&).card_h3]:[margin:0] [.invoice-admin_:where(&).card_h3]:[padding:10px_15px] [.invoice-admin_:where(&).card_h3]:[background:#edf5ff] [.invoice-admin_:where(&).card_h3]:[color:#123e90]"]),
  "logo": utilities([26, "[:where(&).logo]:[min-width:174px] [:where(&).logo]:flex [:where(&).logo]:items-center [:where(&).logo]:[gap:10px]"], [139, "[.footer-logo_:where(&).logo]:[color:#fff] [.footer-logo_:where(&).logo]:[min-width:0]"], [505, "[@media_(max-width:_720px)]:[:where(&).logo]:[min-width:145px] [@media_(max-width:_720px)]:[:where(&).logo]:[gap:7px]"]),
  "next": utilities([775, "[.article-pagination_button:where(&).next]:inline-flex [.article-pagination_button:where(&).next]:items-center [.article-pagination_button:where(&).next]:[gap:5px] [.article-pagination_button:where(&).next]:[padding-inline:11px]"]),
  "required": utilities([2778, "[.product-detail-sections_:where(&).required]:[color:#ed1c24]"]),
  "tailwind-root": utilities([1, "[:where(&),_:where(&)_*]:box-border"], [2, "[:where(&):is(html)]:[scroll-behavior:smooth] [:where(&):is(html)]:overflow-x-hidden"], [3, "[@media_(prefers-reduced-motion:_reduce)]:[:where(&):is(html)]:[scroll-behavior:auto]"], [4, "[@media_(prefers-reduced-motion:_reduce)]:[:where(&),_:where(&)_*,_:where(&)::before,_:where(&)_*::before,_:where(&)::after,_:where(&)_*::after]:[animation-duration:.01ms]! [@media_(prefers-reduced-motion:_reduce)]:[:where(&),_:where(&)_*,_:where(&)::before,_:where(&)_*::before,_:where(&)::after,_:where(&)_*::after]:[animation-iteration-count:1]! [@media_(prefers-reduced-motion:_reduce)]:[:where(&),_:where(&)_*,_:where(&)::before,_:where(&)_*::before,_:where(&)::after,_:where(&)_*::after]:[transition-duration:.01ms]!"], [5, "[:where(&)_body]:overflow-x-clip"], [6, "[:is(:where(&)_body)]:[margin:0] [:is(:where(&)_body)]:[background:#fff] [:is(:where(&)_body)]:[color:var(--ink)]"], [9, "[:where(&)_body:not(.main-header_*)]:[font-size:clamp(16px,_1vw_+_12px,_18px)] [:where(&)_body:not(.main-header_*)]:[line-height:1.6]"], [10, "[:where(&)_h1:not(.main-header_*)]:[font-size:clamp(28px,_4vw_+_1rem,_42px)] [:where(&)_h1:not(.main-header_*)]:font-bold [:where(&)_h1:not(.main-header_*)]:[line-height:1.2] [:where(&)_h1:not(.main-header_*)]:[letter-spacing:-0.02em]"], [11, "[:where(&)_h2:not(.main-header_*)]:[font-size:clamp(24px,_3vw_+_1rem,_32px)] [:where(&)_h2:not(.main-header_*)]:font-bold [:where(&)_h2:not(.main-header_*)]:[line-height:1.3] [:where(&)_h2:not(.main-header_*)]:[letter-spacing:-0.01em]"], [12, "[:where(&)_h3:not(.main-header_*)]:[font-size:clamp(20px,_2vw_+_1rem,_24px)] [:where(&)_h3:not(.main-header_*)]:font-semibold [:where(&)_h3:not(.main-header_*)]:[line-height:1.4]"], [13, "[:where(&)_a]:[color:inherit] [:where(&)_a]:[text-decoration:none]"], [14, "[:where(&)_button,_:where(&)_input,_:where(&)_select]:[font:inherit]"], [592, "[:is(:is(:where(&)_body))]:[font-size:15px]"], [677, "[@media_(max-width:_720px)]:[:where(&)_body]:[font-size:14px]"], [2632, "[@media_print]:[:where(&)_body]:[background:#fff]!"]),
};
const tw = (value: string | undefined | null | false) => resolveClasses(value, componentUtilities);


const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={utilities("tailwind-root [--navy:#071d39] [--navy-2:#0b294e] [--red:#e51e2a] [--ink:#0b1730] [--muted:#6d7890] [--line:#e6eaf0] [--soft:#f5f8fc] [--radius:14px]", [1, "[:where(&),_:where(&)_*]:box-border"], [2, "[:where(&):is(html)]:[scroll-behavior:smooth] [:where(&):is(html)]:overflow-x-hidden"], [3, "[@media_(prefers-reduced-motion:_reduce)]:[:where(&):is(html)]:[scroll-behavior:auto]"], [4, "[@media_(prefers-reduced-motion:_reduce)]:[:where(&),_:where(&)_*,_:where(&)::before,_:where(&)_*::before,_:where(&)::after,_:where(&)_*::after]:[animation-duration:.01ms]! [@media_(prefers-reduced-motion:_reduce)]:[:where(&),_:where(&)_*,_:where(&)::before,_:where(&)_*::before,_:where(&)::after,_:where(&)_*::after]:[animation-iteration-count:1]! [@media_(prefers-reduced-motion:_reduce)]:[:where(&),_:where(&)_*,_:where(&)::before,_:where(&)_*::before,_:where(&)::after,_:where(&)_*::after]:[transition-duration:.01ms]!"], [5, "[:where(&)_body]:overflow-x-clip"], [6, "[:is(:where(&)_body)]:[margin:0] [:is(:where(&)_body)]:[background:#fff] [:is(:where(&)_body)]:[color:var(--ink)]"], [9, "[:where(&)_body:not(.main-header_*)]:[font-size:clamp(16px,_1vw_+_12px,_18px)] [:where(&)_body:not(.main-header_*)]:[line-height:1.6]"], [10, "[:where(&)_h1:not(.main-header_*)]:[font-size:clamp(28px,_4vw_+_1rem,_42px)] [:where(&)_h1:not(.main-header_*)]:font-bold [:where(&)_h1:not(.main-header_*)]:[line-height:1.2] [:where(&)_h1:not(.main-header_*)]:[letter-spacing:-0.02em]"], [11, "[:where(&)_h2:not(.main-header_*)]:[font-size:clamp(24px,_3vw_+_1rem,_32px)] [:where(&)_h2:not(.main-header_*)]:font-bold [:where(&)_h2:not(.main-header_*)]:[line-height:1.3] [:where(&)_h2:not(.main-header_*)]:[letter-spacing:-0.01em]"], [12, "[:where(&)_h3:not(.main-header_*)]:[font-size:clamp(20px,_2vw_+_1rem,_24px)] [:where(&)_h3:not(.main-header_*)]:font-semibold [:where(&)_h3:not(.main-header_*)]:[line-height:1.4]"], [13, "[:where(&)_a]:[color:inherit] [:where(&)_a]:[text-decoration:none]"], [14, "[:where(&)_button,_:where(&)_input,_:where(&)_select]:[font:inherit]"], [592, "[:is(:is(:where(&)_body))]:[font-size:15px]"], [677, "[@media_(max-width:_720px)]:[:where(&)_body]:[font-size:14px]"], [2632, "[@media_print]:[:where(&)_body]:[background:#fff]!"])} lang="en-BD" suppressHydrationWarning>
      <body className={tw(`${inter.className} antialiased`)} suppressHydrationWarning>
        <SeoJsonLd id="drone-bangladesh-global-schema" data={[organization, localBusiness, webSite]} />
        <SiteShell>{children}</SiteShell>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: { fontFamily: "var(--font-inter, Inter, sans-serif)", fontSize: "13.5px" },
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
