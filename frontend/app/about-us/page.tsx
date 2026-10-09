
import { utilities } from "@/lib/tailwind";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeftRight,
  CircleHelp,
  Eye,
  Handshake,
  Headphones,
  MapPinned,
  PackageSearch,
  RotateCcw,
  Sprout,
  Target,
  Factory,
  Plane,
  ShieldCheck,
} from "lucide-react";
import { cmsStaticMetadata } from "@/lib/cms-static-metadata";
import { getContentEntry } from "@/lib/content";
import SeoJsonLd from "@/components/seo-jsonld";
import { breadcrumbJsonLd } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return cmsStaticMetadata(
    "about-us",
    "About Sarker Fabrics",
    "Learn about Sarker Fabrics, our clothing collection, quality commitment and nationwide delivery for customers across Bangladesh."
  );
}

const quickActions = [
  { href: "/track-order", label: "ORDER OR RETURN\nSTATUS", Icon: ArrowLeftRight },
  { href: "/returns", label: "RETURN FOR\nREFUND REQUEST", Icon: RotateCcw },
  { href: "/contact?topic=map", label: "REPORT A MAP\nERROR", Icon: MapPinned },
  { href: "/contact?topic=missing-map", label: "REPORT A MISSING\nMAP ERROR", Icon: PackageSearch },
  { href: "/contact", label: "GET HELP WITH\nOTHER TOPICS", Icon: Headphones },
];

const values = [
  {
    title: "Mission",
    Icon: Target,
    text: "To become Bangladesh's leading drone solutions provider by delivering authentic products, advanced technology, and exceptional service.",
  },
  {
    title: "Vision",
    Icon: Eye,
    text: "We will be the trusted partner for every drone user in Bangladesh — from agriculture to enterprise, education to inspections.",
  },
  {
    title: "Values",
    Icon: Handshake,
    text: "Commitment, Quality, Innovation, and Customer Focus guide every product, service and support experience we deliver.",
  },
];

const portfolio = [
  {
    title: "Agriculture Drones",
    Icon: Sprout,
    models: ["DJI Agras T30", "DJI Agras T25"],
    usedFor: ["Crop spraying", "Seed scattering", "Large-scale agricultural operations"],
  },
  {
    title: "Enterprise & Industrial Drones",
    Icon: Factory,
    models: ["DJI Matrice 350 RTK", "DJI Matrice 400"],
    usedFor: ["Surveying & mapping", "Inspection", "Security & monitoring", "Government operations"],
  },
  {
    title: "Fixed-Wing Drone Solutions",
    Icon: Plane,
    models: ["JOUAV", "Tericahn"],
    usedFor: ["Long-range mapping", "Large-area surveying", "Industrial and research applications"],
  },
];

const stats = [
  ["50+", "Countries Served"],
  ["100+", "Non-Drone Projects"],
  ["10+", "Years of Industry Excellence"],
  ["150+", "Happy Clients & Partners"],
];

export default async function AboutUsPage() {
  const entry = await getContentEntry("pages", "about-us");
  const intro = entry?.body || "Founded with a commitment to authentic products, expert guidance and dependable after-sales service, Drone Bangladesh has grown into a trusted drone solutions partner for customers across the country.";
  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "About Us", path: "/about-us" },
  ]);

  return (
    <main className={utilities("about-reference-page", [2022, "[:where(&).about-reference-page]:[background:#fff] [:where(&).about-reference-page]:[color:#111827] [:where(&).about-reference-page]:[padding-bottom:46px]"])}>
      <SeoJsonLd id="about-us-breadcrumb-schema" data={breadcrumbs} />

      <section className={utilities("about-ref-hero", [2023, "[:where(&).about-ref-hero]:[background:linear-gradient(115deg,_#fff_0%,_#fbf7ff_44%,_#eee8ff_100%)] [:where(&).about-ref-hero]:overflow-hidden"], [2027, "[:where(&).about-ref-hero_h1]:[font-size:clamp(40px,_4.4vw,_70px)] [:where(&).about-ref-hero_h1]:[line-height:.98] [:where(&).about-ref-hero_h1]:[letter-spacing:-.045em] [:where(&).about-ref-hero_h1]:[margin:24px_0_20px] [:where(&).about-ref-hero_h1]:[max-width:760px]"], [2028, "[:where(&).about-ref-hero_h1_em]:not-italic [:where(&).about-ref-hero_h1_em]:[color:#ff651b]"], [2086, "[@media_(max-width:560px)]:[:where(&).about-ref-hero_h1]:[font-size:40px]"])}>
        <div className={utilities("page-container about-ref-hero-inner", [15, "[:where(&).page-container]:[width:min(1240px,_calc(100%_-_24px))] [:where(&).page-container]:[margin-inline:auto]"], [16, "[@media_(min-width:_768px)]:[:where(&).page-container]:[width:min(1240px,_calc(100%_-_48px))]"], [333, "[.catalog-hero_:where(&).page-container]:relative [.catalog-hero_:where(&).page-container]:[z-index:1]"], [501, "[@media_(max-width:_720px)]:[:where(&).page-container]:[width:min(100%_-_28px,_620px)]"], [2024, "[:where(&).about-ref-hero-inner]:[min-height:430px] [:where(&).about-ref-hero-inner]:grid [:where(&).about-ref-hero-inner]:[grid-template-columns:.9fr_1.1fr] [:where(&).about-ref-hero-inner]:items-center [:where(&).about-ref-hero-inner]:[gap:34px] [:where(&).about-ref-hero-inner]:[padding-top:42px] [:where(&).about-ref-hero-inner]:[padding-bottom:34px]"], [2076, "[@media_(max-width:900px)]:[:where(&).about-ref-hero-inner]:[grid-template-columns:1fr] [@media_(max-width:900px)]:[:where(&).about-ref-hero-inner]:[min-height:auto]"], [2085, "[@media_(max-width:560px)]:[:where(&).about-ref-hero-inner]:[padding-top:25px]"])}>
          <div className={utilities("about-ref-hero-copy", [2025, "[:where(&).about-ref-hero-copy]:relative [:where(&).about-ref-hero-copy]:[z-index:2]"], [2029, "[:where(&).about-ref-hero-copy_p]:[max-width:510px] [:where(&).about-ref-hero-copy_p]:[color:#586071] [:where(&).about-ref-hero-copy_p]:[line-height:1.7] [:where(&).about-ref-hero-copy_p]:[font-size:15px]"])}>
            <span className={utilities("about-ref-kicker", [2026, "[:where(&).about-ref-kicker]:inline-flex [:where(&).about-ref-kicker]:items-center [:where(&).about-ref-kicker]:[color:#ff6b20] [:where(&).about-ref-kicker]:[font-size:12px] [:where(&).about-ref-kicker]:font-extrabold [:where(&).about-ref-kicker]:[letter-spacing:.02em] [:where(&).about-ref-kicker]:[background:#fff] [:where(&).about-ref-kicker]:[border-radius:999px] [:where(&).about-ref-kicker]:[padding:8px_12px] [:where(&).about-ref-kicker]:[box-shadow:0_4px_18px_rgba(15,_23,_42,_.05)]"])}>◆ &nbsp; DRONE BANGLADESH</span>
            <h1>Your Trusted Drone<br />Solutions Partner in<br /><em>Bangladesh</em></h1>
            <p>Drone Bangladesh has a team of experts ready to help you choose, operate and support the right drone solution.</p>
          </div>
          <div className={utilities("about-ref-hero-visual", [2030, "[:where(&).about-ref-hero-visual]:[align-self:stretch] [:where(&).about-ref-hero-visual]:grid [:where(&).about-ref-hero-visual]:[place-items:center] [:where(&).about-ref-hero-visual]:[min-height:390px]"], [2031, "[:where(&).about-ref-hero-visual_img]:[width:100%] [:where(&).about-ref-hero-visual_img]:[height:100%] [:where(&).about-ref-hero-visual_img]:[max-height:440px] [:where(&).about-ref-hero-visual_img]:object-cover [:where(&).about-ref-hero-visual_img]:[object-position:center] [:where(&).about-ref-hero-visual_img]:[border-radius:0] [:where(&).about-ref-hero-visual_img]:[mix-blend-mode:multiply]"], [2077, "[@media_(max-width:900px)]:[:where(&).about-ref-hero-visual]:[min-height:300px]"])}>
            <img src="/images/about/about-hero.jpg" alt="Drone Bangladesh professional drone solution" />
          </div>
        </div>
      </section>

      <section className={utilities("page-container about-ref-actions", [15, "[:where(&).page-container]:[width:min(1240px,_calc(100%_-_24px))] [:where(&).page-container]:[margin-inline:auto]"], [16, "[@media_(min-width:_768px)]:[:where(&).page-container]:[width:min(1240px,_calc(100%_-_48px))]"], [333, "[.catalog-hero_:where(&).page-container]:relative [.catalog-hero_:where(&).page-container]:[z-index:1]"], [501, "[@media_(max-width:_720px)]:[:where(&).page-container]:[width:min(100%_-_28px,_620px)]"], [2032, "[:where(&).about-ref-actions]:relative [:where(&).about-ref-actions]:[z-index:3] [:where(&).about-ref-actions]:[margin-top:-35px] [:where(&).about-ref-actions]:[background:#fff] [:where(&).about-ref-actions]:[border:1px_solid_#edf0f4] [:where(&).about-ref-actions]:[border-radius:14px] [:where(&).about-ref-actions]:[box-shadow:0_16px_45px_rgba(16,_24,_40,_.10)] [:where(&).about-ref-actions]:grid [:where(&).about-ref-actions]:[grid-template-columns:repeat(5,_1fr)] [:where(&).about-ref-actions]:[padding:20px_24px]"], [2033, "[:where(&).about-ref-actions_a]:[min-height:86px] [:where(&).about-ref-actions_a]:grid [:where(&).about-ref-actions_a]:[place-items:center] [:where(&).about-ref-actions_a]:text-center [:where(&).about-ref-actions_a]:[gap:8px] [:where(&).about-ref-actions_a]:[padding:4px_15px] [:where(&).about-ref-actions_a]:[border-right:1px_solid_#eceff3] [:where(&).about-ref-actions_a]:[color:#111827] [:where(&).about-ref-actions_a]:[font-size:10px] [:where(&).about-ref-actions_a]:font-extrabold [:where(&).about-ref-actions_a]:[line-height:1.25]"], [2034, "[:where(&).about-ref-actions_a:last-child]:[border-right:0]"], [2035, "[:where(&).about-ref-actions_svg]:[color:#ff651b] [:where(&).about-ref-actions_svg]:[width:29px] [:where(&).about-ref-actions_svg]:[height:29px]"], [2036, "[:where(&).about-ref-actions_a>span]:grid"], [2078, "[@media_(max-width:900px)]:[:where(&).about-ref-actions]:[grid-template-columns:repeat(2,_1fr)] [@media_(max-width:900px)]:[:where(&).about-ref-actions]:[margin-top:18px]"], [2079, "[@media_(max-width:900px)]:[:where(&).about-ref-actions_a]:[border-bottom:1px_solid_#eceff3]"], [2087, "[@media_(max-width:560px)]:[:where(&).about-ref-actions]:[grid-template-columns:1fr] [@media_(max-width:560px)]:[:where(&).about-ref-actions]:[padding:12px]"], [2088, "[@media_(max-width:560px)]:[:where(&).about-ref-actions_a]:[grid-template-columns:42px_1fr] [@media_(max-width:560px)]:[:where(&).about-ref-actions_a]:[justify-items:start] [@media_(max-width:560px)]:[:where(&).about-ref-actions_a]:text-left [@media_(max-width:560px)]:[:where(&).about-ref-actions_a]:[border-right:0]"])} aria-label="Customer support shortcuts">
        {quickActions.map(({ href, label, Icon }) => (
          <Link href={href} key={label}>
            <Icon aria-hidden="true" />
            <span>{label.split("\n").map((line) => <span key={line}>{line}</span>)}</span>
          </Link>
        ))}
      </section>

      <section className={utilities("page-container about-ref-section about-ref-intro", [15, "[:where(&).page-container]:[width:min(1240px,_calc(100%_-_24px))] [:where(&).page-container]:[margin-inline:auto]"], [16, "[@media_(min-width:_768px)]:[:where(&).page-container]:[width:min(1240px,_calc(100%_-_48px))]"], [333, "[.catalog-hero_:where(&).page-container]:relative [.catalog-hero_:where(&).page-container]:[z-index:1]"], [501, "[@media_(max-width:_720px)]:[:where(&).page-container]:[width:min(100%_-_28px,_620px)]"], [2037, "[:where(&).about-ref-section]:[padding-top:54px]"], [2041, "[:where(&).about-ref-intro>p]:[max-width:880px] [:where(&).about-ref-intro>p]:[margin:18px_auto_0] [:where(&).about-ref-intro>p]:text-center [:where(&).about-ref-intro>p]:[color:#5d6675] [:where(&).about-ref-intro>p]:[line-height:1.75] [:where(&).about-ref-intro>p]:[font-size:14px]"])}>
        <div className={utilities("about-ref-heading", [2038, "[:where(&).about-ref-heading]:text-center [:where(&).about-ref-heading]:grid [:where(&).about-ref-heading]:[justify-items:center]"], [2039, "[:where(&).about-ref-heading_h2]:[font-size:31px] [:where(&).about-ref-heading_h2]:[margin:0] [:where(&).about-ref-heading_h2]:[color:#10141c] [:where(&).about-ref-heading_h2]:[letter-spacing:-.03em]"], [2040, "[:where(&).about-ref-heading_i]:[width:34px] [:where(&).about-ref-heading_i]:[height:3px] [:where(&).about-ref-heading_i]:[background:#ff651b] [:where(&).about-ref-heading_i]:[border-radius:99px] [:where(&).about-ref-heading_i]:[margin-top:9px]"])}>
          <h2>About Us</h2>
          <i />
        </div>
        <p>{intro}</p>
        <p>We serve consumer, enterprise and agriculture customers with original drones, accessories, practical consultation and nationwide support. Our goal is to make advanced aerial technology easier to access, understand and use with confidence.</p>
      </section>

      <section className={utilities("page-container about-values-grid", [15, "[:where(&).page-container]:[width:min(1240px,_calc(100%_-_24px))] [:where(&).page-container]:[margin-inline:auto]"], [16, "[@media_(min-width:_768px)]:[:where(&).page-container]:[width:min(1240px,_calc(100%_-_48px))]"], [333, "[.catalog-hero_:where(&).page-container]:relative [.catalog-hero_:where(&).page-container]:[z-index:1]"], [501, "[@media_(max-width:_720px)]:[:where(&).page-container]:[width:min(100%_-_28px,_620px)]"], [2042, "[:where(&).about-values-grid]:grid [:where(&).about-values-grid]:[grid-template-columns:repeat(3,_1fr)] [:where(&).about-values-grid]:[gap:22px] [:where(&).about-values-grid]:[padding-top:36px]"], [2043, "[:where(&).about-values-grid_article,_:where(&).about-portfolio-grid_article]:[border:1px_solid_#e8ebef] [:where(&).about-values-grid_article,_:where(&).about-portfolio-grid_article]:[border-radius:12px] [:where(&).about-values-grid_article,_:where(&).about-portfolio-grid_article]:[background:#fff] [:where(&).about-values-grid_article,_:where(&).about-portfolio-grid_article]:[padding:28px] [:where(&).about-values-grid_article,_:where(&).about-portfolio-grid_article]:[box-shadow:0_8px_28px_rgba(15,_23,_42,_.045)]"], [2044, "[:where(&).about-values-grid_article]:text-center"], [2047, "[:where(&).about-values-grid_h3,_:where(&).about-portfolio-grid_h3]:[font-size:19px] [:where(&).about-values-grid_h3,_:where(&).about-portfolio-grid_h3]:[margin:9px_0_10px]"], [2048, "[:where(&).about-values-grid_p]:[color:#646d79] [:where(&).about-values-grid_p]:[line-height:1.65] [:where(&).about-values-grid_p]:[font-size:12px]"], [2080, "[@media_(max-width:900px)]:[:where(&).about-values-grid,_:where(&).about-portfolio-grid]:[grid-template-columns:1fr]"], [2089, "[@media_(max-width:560px)]:[:where(&).about-values-grid,_:where(&).about-portfolio-grid]:[gap:12px]"])}>
        {values.map(({ title, Icon, text }) => (
          <article key={title}>
            <span className={utilities("about-hex-icon", [2045, "[:where(&).about-hex-icon]:[width:68px] [:where(&).about-hex-icon]:[height:68px] [:where(&).about-hex-icon]:[margin:0_auto_14px] [:where(&).about-hex-icon]:grid [:where(&).about-hex-icon]:[place-items:center] [:where(&).about-hex-icon]:[color:#ff651b] [:where(&).about-hex-icon]:[clip-path:polygon(25%_6%,_75%_6%,_100%_50%,_75%_94%,_25%_94%,_0_50%)] [:where(&).about-hex-icon]:[background:#fff4ed] [:where(&).about-hex-icon]:[border:1px_solid_#ffb586]"], [2046, "[:where(&).about-hex-icon_svg]:[width:29px]"])}><Icon /></span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className={utilities("page-container about-ref-section", [15, "[:where(&).page-container]:[width:min(1240px,_calc(100%_-_24px))] [:where(&).page-container]:[margin-inline:auto]"], [16, "[@media_(min-width:_768px)]:[:where(&).page-container]:[width:min(1240px,_calc(100%_-_48px))]"], [333, "[.catalog-hero_:where(&).page-container]:relative [.catalog-hero_:where(&).page-container]:[z-index:1]"], [501, "[@media_(max-width:_720px)]:[:where(&).page-container]:[width:min(100%_-_28px,_620px)]"], [2037, "[:where(&).about-ref-section]:[padding-top:54px]"])}>
        <div className={utilities("about-ref-heading", [2038, "[:where(&).about-ref-heading]:text-center [:where(&).about-ref-heading]:grid [:where(&).about-ref-heading]:[justify-items:center]"], [2039, "[:where(&).about-ref-heading_h2]:[font-size:31px] [:where(&).about-ref-heading_h2]:[margin:0] [:where(&).about-ref-heading_h2]:[color:#10141c] [:where(&).about-ref-heading_h2]:[letter-spacing:-.03em]"], [2040, "[:where(&).about-ref-heading_i]:[width:34px] [:where(&).about-ref-heading_i]:[height:3px] [:where(&).about-ref-heading_i]:[background:#ff651b] [:where(&).about-ref-heading_i]:[border-radius:99px] [:where(&).about-ref-heading_i]:[margin-top:9px]"])}>
          <h2>Advanced Drone Portfolio</h2>
          <i />
        </div>
        <p className={utilities("about-ref-subtitle", [2049, "[:where(&).about-ref-subtitle]:text-center [:where(&).about-ref-subtitle]:[color:#6a7280] [:where(&).about-ref-subtitle]:[margin:10px_0_26px]"])}>We specialize in both consumer and high-performance industrial drone solutions.</p>
        <div className={utilities("about-portfolio-grid", [2043, "[:where(&).about-values-grid_article,_:where(&).about-portfolio-grid_article]:[border:1px_solid_#e8ebef] [:where(&).about-values-grid_article,_:where(&).about-portfolio-grid_article]:[border-radius:12px] [:where(&).about-values-grid_article,_:where(&).about-portfolio-grid_article]:[background:#fff] [:where(&).about-values-grid_article,_:where(&).about-portfolio-grid_article]:[padding:28px] [:where(&).about-values-grid_article,_:where(&).about-portfolio-grid_article]:[box-shadow:0_8px_28px_rgba(15,_23,_42,_.045)]"], [2047, "[:where(&).about-values-grid_h3,_:where(&).about-portfolio-grid_h3]:[font-size:19px] [:where(&).about-values-grid_h3,_:where(&).about-portfolio-grid_h3]:[margin:9px_0_10px]"], [2050, "[:where(&).about-portfolio-grid]:grid [:where(&).about-portfolio-grid]:[grid-template-columns:repeat(3,_1fr)] [:where(&).about-portfolio-grid]:[gap:22px]"], [2053, "[:where(&).about-portfolio-grid_article_strong]:[font-size:11px] [:where(&).about-portfolio-grid_article_strong]:block [:where(&).about-portfolio-grid_article_strong]:[margin:14px_0_5px]"], [2054, "[:where(&).about-portfolio-grid_ul]:[margin:0] [:where(&).about-portfolio-grid_ul]:[padding-left:18px] [:where(&).about-portfolio-grid_ul]:[color:#626a76] [:where(&).about-portfolio-grid_ul]:[font-size:11px] [:where(&).about-portfolio-grid_ul]:[line-height:1.7]"], [2080, "[@media_(max-width:900px)]:[:where(&).about-values-grid,_:where(&).about-portfolio-grid]:[grid-template-columns:1fr]"], [2089, "[@media_(max-width:560px)]:[:where(&).about-values-grid,_:where(&).about-portfolio-grid]:[gap:12px]"])}>
          {portfolio.map(({ title, Icon, models, usedFor }) => (
            <article key={title}>
              <span className={utilities("about-round-icon", [2051, "[:where(&).about-round-icon]:[width:48px] [:where(&).about-round-icon]:[height:48px] [:where(&).about-round-icon]:[border:2px_solid_#ff7a33] [:where(&).about-round-icon]:[border-radius:50%] [:where(&).about-round-icon]:grid [:where(&).about-round-icon]:[place-items:center] [:where(&).about-round-icon]:[color:#ff651b]"], [2052, "[:where(&).about-round-icon_svg]:[width:22px]"])}><Icon /></span>
              <h3>{title}</h3>
              <strong>Models</strong>
              <ul>{models.map((item) => <li key={item}>{item}</li>)}</ul>
              <strong>Used for</strong>
              <ul>{usedFor.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section className={utilities("page-container about-track-record", [15, "[:where(&).page-container]:[width:min(1240px,_calc(100%_-_24px))] [:where(&).page-container]:[margin-inline:auto]"], [16, "[@media_(min-width:_768px)]:[:where(&).page-container]:[width:min(1240px,_calc(100%_-_48px))]"], [333, "[.catalog-hero_:where(&).page-container]:relative [.catalog-hero_:where(&).page-container]:[z-index:1]"], [501, "[@media_(max-width:_720px)]:[:where(&).page-container]:[width:min(100%_-_28px,_620px)]"], [2055, "[:where(&).about-track-record]:[margin-top:48px] [:where(&).about-track-record]:[border-radius:16px] [:where(&).about-track-record]:[background:linear-gradient(90deg,_#fcfdff,_#f7f9fc)] [:where(&).about-track-record]:[padding:35px_34px]"], [2061, "[:where(&).about-track-record>p]:text-center [:where(&).about-track-record>p]:[color:#646d79] [:where(&).about-track-record>p]:[font-size:11px] [:where(&).about-track-record>p]:[margin-top:28px]"], [2090, "[@media_(max-width:560px)]:[:where(&).about-track-record]:[padding:26px_18px]"])}>
        <div className={utilities("about-ref-heading", [2038, "[:where(&).about-ref-heading]:text-center [:where(&).about-ref-heading]:grid [:where(&).about-ref-heading]:[justify-items:center]"], [2039, "[:where(&).about-ref-heading_h2]:[font-size:31px] [:where(&).about-ref-heading_h2]:[margin:0] [:where(&).about-ref-heading_h2]:[color:#10141c] [:where(&).about-ref-heading_h2]:[letter-spacing:-.03em]"], [2040, "[:where(&).about-ref-heading_i]:[width:34px] [:where(&).about-ref-heading_i]:[height:3px] [:where(&).about-ref-heading_i]:[background:#ff651b] [:where(&).about-ref-heading_i]:[border-radius:99px] [:where(&).about-ref-heading_i]:[margin-top:9px]"])}>
          <h2>Proven Track Record</h2>
          <i />
        </div>
        <div className={utilities("about-stats-grid", [2056, "[:where(&).about-stats-grid]:grid [:where(&).about-stats-grid]:[grid-template-columns:repeat(4,_1fr)] [:where(&).about-stats-grid]:[margin-top:28px]"], [2057, "[:where(&).about-stats-grid>div]:grid [:where(&).about-stats-grid>div]:[justify-items:center] [:where(&).about-stats-grid>div]:text-center [:where(&).about-stats-grid>div]:[padding:10px_20px] [:where(&).about-stats-grid>div]:[border-right:1px_solid_#dfe4ea]"], [2058, "[:where(&).about-stats-grid>div:last-child]:[border-right:0]"], [2059, "[:where(&).about-stats-grid_strong]:[font-size:31px] [:where(&).about-stats-grid_strong]:[color:#ff651b]"], [2060, "[:where(&).about-stats-grid_span]:[font-size:11px] [:where(&).about-stats-grid_span]:[max-width:150px]"], [2081, "[@media_(max-width:900px)]:[:where(&).about-stats-grid]:[grid-template-columns:repeat(2,_1fr)]"], [2082, "[@media_(max-width:900px)]:[:where(&).about-stats-grid>div:nth-child(2)]:[border-right:0]"], [2091, "[@media_(max-width:560px)]:[:where(&).about-stats-grid]:[grid-template-columns:1fr]"], [2092, "[@media_(max-width:560px)]:[:where(&).about-stats-grid>div]:[border-right:0] [@media_(max-width:560px)]:[:where(&).about-stats-grid>div]:[border-bottom:1px_solid_#dfe4ea]"])}>
          {stats.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
        <p>Industries we've successfully served:</p>
        <div className={utilities("about-industries", [2062, "[:where(&).about-industries]:flex [:where(&).about-industries]:justify-center [:where(&).about-industries]:[gap:24px] [:where(&).about-industries]:flex-wrap"], [2063, "[:where(&).about-industries_span]:flex [:where(&).about-industries_span]:items-center [:where(&).about-industries_span]:[gap:6px] [:where(&).about-industries_span]:[font-size:11px] [:where(&).about-industries_span]:font-semibold"], [2064, "[:where(&).about-industries_svg]:[width:15px] [:where(&).about-industries_svg]:[color:#ff651b]"])}>
          {[
            "Agriculture",
            "Surveying & Mapping",
            "Media & Production",
            "Infrastructure & Inspection",
          ].map((item) => <span key={item}><ShieldCheck /> {item}</span>)}
        </div>
      </section>

      <section className={utilities("page-container about-story-card", [15, "[:where(&).page-container]:[width:min(1240px,_calc(100%_-_24px))] [:where(&).page-container]:[margin-inline:auto]"], [16, "[@media_(min-width:_768px)]:[:where(&).page-container]:[width:min(1240px,_calc(100%_-_48px))]"], [333, "[.catalog-hero_:where(&).page-container]:relative [.catalog-hero_:where(&).page-container]:[z-index:1]"], [501, "[@media_(max-width:_720px)]:[:where(&).page-container]:[width:min(100%_-_28px,_620px)]"], [2065, "[:where(&).about-story-card]:[margin-top:28px] [:where(&).about-story-card]:[background:linear-gradient(135deg,_#111821,_#20242b)] [:where(&).about-story-card]:[color:#fff] [:where(&).about-story-card]:[border-radius:16px] [:where(&).about-story-card]:[padding:34px] [:where(&).about-story-card]:grid [:where(&).about-story-card]:[grid-template-columns:.8fr_1.2fr] [:where(&).about-story-card]:[gap:34px] [:where(&).about-story-card]:items-center"], [2066, "[:where(&).about-story-card>div>span]:[color:#ff651b] [:where(&).about-story-card>div>span]:[font-size:10px] [:where(&).about-story-card>div>span]:font-extrabold"], [2067, "[:where(&).about-story-card_h2]:[font-size:32px] [:where(&).about-story-card_h2]:[line-height:1.15] [:where(&).about-story-card_h2]:[margin:15px_0_22px]"], [2068, "[:where(&).about-story-card_p]:[color:#c8cdd5] [:where(&).about-story-card_p]:[line-height:1.8] [:where(&).about-story-card_p]:[max-width:460px]"], [2069, "[:where(&).about-story-card_strong]:block [:where(&).about-story-card_strong]:[margin-top:24px]"], [2070, "[:where(&).about-story-card_img]:[width:100%] [:where(&).about-story-card_img]:[height:360px] [:where(&).about-story-card_img]:object-cover [:where(&).about-story-card_img]:[border-radius:12px]"], [2083, "[@media_(max-width:900px)]:[:where(&).about-story-card]:[grid-template-columns:1fr]"], [2093, "[@media_(max-width:560px)]:[:where(&).about-story-card]:[padding:23px]"], [2094, "[@media_(max-width:560px)]:[:where(&).about-story-card_img]:[height:260px]"])}>
        <div>
          <span>OUR STORY</span>
          <h2>Leading the drone<br />revolution since 2015.</h2>
          <p>Our approach to drone solutions is simple: we focus on authentic products and expert support. Through constant innovation, Drone Bangladesh offers a more reliable and long-lasting approach to aerial technology.</p>
          <strong>— Drone Bangladesh Team</strong>
        </div>
        <img src="/images/about/about-story.jpg" alt="Agriculture drone operation in Bangladesh" loading="lazy" />
      </section>

      <section className={utilities("page-container about-community", [15, "[:where(&).page-container]:[width:min(1240px,_calc(100%_-_24px))] [:where(&).page-container]:[margin-inline:auto]"], [16, "[@media_(min-width:_768px)]:[:where(&).page-container]:[width:min(1240px,_calc(100%_-_48px))]"], [333, "[.catalog-hero_:where(&).page-container]:relative [.catalog-hero_:where(&).page-container]:[z-index:1]"], [501, "[@media_(max-width:_720px)]:[:where(&).page-container]:[width:min(100%_-_28px,_620px)]"], [2071, "[:where(&).about-community]:[padding-top:34px]"], [2072, "[:where(&).about-community>p]:text-center [:where(&).about-community>p]:[color:#6a7280] [:where(&).about-community>p]:[margin:9px_0_20px]"])}>
        <div className={utilities("about-ref-heading", [2038, "[:where(&).about-ref-heading]:text-center [:where(&).about-ref-heading]:grid [:where(&).about-ref-heading]:[justify-items:center]"], [2039, "[:where(&).about-ref-heading_h2]:[font-size:31px] [:where(&).about-ref-heading_h2]:[margin:0] [:where(&).about-ref-heading_h2]:[color:#10141c] [:where(&).about-ref-heading_h2]:[letter-spacing:-.03em]"], [2040, "[:where(&).about-ref-heading_i]:[width:34px] [:where(&).about-ref-heading_i]:[height:3px] [:where(&).about-ref-heading_i]:[background:#ff651b] [:where(&).about-ref-heading_i]:[border-radius:99px] [:where(&).about-ref-heading_i]:[margin-top:9px]"])}>
          <h2>Our community</h2>
          <i />
        </div>
        <p>Loved & trusted by an ever-expanding community.</p>
        <div className={utilities("about-community-grid", [2073, "[:where(&).about-community-grid]:grid [:where(&).about-community-grid]:[grid-template-columns:repeat(4,_1fr)] [:where(&).about-community-grid]:[gap:10px]"], [2074, "[:where(&).about-community-grid_img]:[width:100%] [:where(&).about-community-grid_img]:[aspect-ratio:.75] [:where(&).about-community-grid_img]:object-cover [:where(&).about-community-grid_img]:[border-radius:12px]"], [2084, "[@media_(max-width:900px)]:[:where(&).about-community-grid]:[grid-template-columns:repeat(2,_1fr)]"], [2095, "[@media_(max-width:560px)]:[:where(&).about-community-grid]:[grid-template-columns:1fr_1fr]"])}>
          {[1,2,3,4].map((item) => <img key={item} src={`/images/about/community-${item}.jpg`} alt={`Drone Bangladesh community member ${item}`} loading="lazy" />)}
        </div>
      </section>
    </main>
  );
}
