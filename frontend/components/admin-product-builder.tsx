"use client";
import { utilities } from "@/lib/tailwind";


import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import RichDescriptionEditor from "@/components/rich-description-editor";

const DRAFT_KEY = "drone-product-draft";

export default function AdminProductBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fieldRaw = searchParams.get("field");
  const field = fieldRaw === "accessories" ? "accessories" : (fieldRaw === "accessory" ? "accessory" : "description");
  const accIndex = searchParams.has("index") ? parseInt(searchParams.get("index") || "0", 10) : 0;
  const [loaded, setLoaded] = useState(false);
  const [productName, setProductName] = useState("");
  const [descHtml, setDescHtml] = useState("");
  const [descCss, setDescCss] = useState("");
  const autoSaveRef = useRef(false);

  /* ── Restore from localStorage on mount ── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.form) {
          setProductName(draft.form.name || "New product");
          if (field === "accessories") {
            setDescHtml(draft.form.accessoriesHtml || "");
            setDescCss(draft.form.accessoriesCss || "");
          } else if (field === "accessory") {
            const acc = draft.form.accessories?.[accIndex];
            setProductName(`Accessory: ${acc?.name || "Unnamed"}`);
            setDescHtml(acc?.descriptionHtml || "");
            setDescCss(acc?.descriptionCss || "");
          } else {
            setDescHtml(draft.form.descriptionHtml || "");
            setDescCss(draft.form.descriptionCss || "");
          }
        }
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  /* ── Auto-save description to localStorage on every change ── */
  useEffect(() => {
    if (!autoSaveRef.current) { autoSaveRef.current = true; return; }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (field === "accessories") {
          draft.form.accessoriesHtml = descHtml;
          draft.form.accessoriesCss = descCss;
        } else if (field === "accessory") {
          if (!draft.form.accessories) draft.form.accessories = [];
          if (draft.form.accessories[accIndex]) {
            draft.form.accessories[accIndex].descriptionHtml = descHtml;
            draft.form.accessories[accIndex].descriptionCss = descCss;
          }
        } else {
          draft.form.descriptionHtml = descHtml;
          draft.form.descriptionCss = descCss;
        }
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      }
    } catch { /* ignore */ }
  }, [descHtml, descCss]);

  function saveAndReturn() {
    /* Final save */
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (field === "accessories") {
          draft.form.accessoriesHtml = descHtml;
          draft.form.accessoriesCss = descCss;
        } else if (field === "accessory") {
          if (!draft.form.accessories) draft.form.accessories = [];
          if (draft.form.accessories[accIndex]) {
            draft.form.accessories[accIndex].descriptionHtml = descHtml;
            draft.form.accessories[accIndex].descriptionCss = descCss;
          }
        } else {
          draft.form.descriptionHtml = descHtml;
          draft.form.descriptionCss = descCss;
        }
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      }
    } catch { /* ignore */ }
    router.push("/admin/products");
  }

  if (!loaded) {
    return <div className={utilities("admin-auth-loading", [1401, "[:where(&).admin-auth-loading]:fixed [:where(&).admin-auth-loading]:[inset:0] [:where(&).admin-auth-loading]:[z-index:99999] [:where(&).admin-auth-loading]:[background:#0d1421] [:where(&).admin-auth-loading]:flex [:where(&).admin-auth-loading]:flex-col [:where(&).admin-auth-loading]:items-center [:where(&).admin-auth-loading]:justify-center [:where(&).admin-auth-loading]:[gap:18px] [:where(&).admin-auth-loading]:[color:#7a8fa8] [:where(&).admin-auth-loading]:[font-size:13.5px] [:where(&).admin-auth-loading]:font-medium"], [1402, "[:where(&).admin-auth-loading_p]:[margin:0] [:where(&).admin-auth-loading_p]:[color:#7a8fa8] [:where(&).admin-auth-loading_p]:[font-size:13.5px]"])}>Loading builder…</div>;
  }

  return (
    <div className={utilities("admin-builder-page", [1050, "[:where(&).admin-builder-page]:flex [:where(&).admin-builder-page]:flex-col [:where(&).admin-builder-page]:[min-height:calc(100vh_-_60px)]"])}>
      {/* ── Fixed header bar ── */}
      <header className={utilities("admin-builder-header", [1051, "[:where(&).admin-builder-header]:flex [:where(&).admin-builder-header]:items-center [:where(&).admin-builder-header]:[gap:12px] [:where(&).admin-builder-header]:[padding:10px_20px] [:where(&).admin-builder-header]:[background:linear-gradient(135deg,_#f8fafc,_#f0f4fa)] [:where(&).admin-builder-header]:[border-bottom:1px_solid_#dce5f0] [:where(&).admin-builder-header]:sticky [:where(&).admin-builder-header]:[top:0] [:where(&).admin-builder-header]:[z-index:20]"])}>
        <Link href="/admin/products" className={utilities("admin-builder-back", [1052, "[:where(&).admin-builder-back]:inline-flex [:where(&).admin-builder-back]:items-center [:where(&).admin-builder-back]:[gap:5px] [:where(&).admin-builder-back]:[font-size:12px] [:where(&).admin-builder-back]:font-semibold [:where(&).admin-builder-back]:[color:#49627e] [:where(&).admin-builder-back]:[text-decoration:none] [:where(&).admin-builder-back]:[padding:6px_12px] [:where(&).admin-builder-back]:[border:1px_solid_#dce5f0] [:where(&).admin-builder-back]:[border-radius:6px] [:where(&).admin-builder-back]:[background:#fff] [:where(&).admin-builder-back]:[transition:all_0.15s] [:where(&).admin-builder-back]:[flex-shrink:0]"], [1053, "[:where(&).admin-builder-back:hover]:[border-color:#8eafe0] [:where(&).admin-builder-back:hover]:[color:#155fc5] [:where(&).admin-builder-back:hover]:[background:#f5f8ff]"])}>
          <ArrowLeft size={16} /> Products
        </Link>
        <div className={utilities("admin-builder-title", [1054, "[:where(&).admin-builder-title]:[flex:1] [:where(&).admin-builder-title]:[min-width:0]"], [1055, "[:where(&).admin-builder-title_strong]:block [:where(&).admin-builder-title_strong]:[font-size:14px] [:where(&).admin-builder-title_strong]:[color:#102952]"], [1056, "[:where(&).admin-builder-title_span]:block [:where(&).admin-builder-title_span]:[font-size:11px] [:where(&).admin-builder-title_span]:[color:#64748b] [:where(&).admin-builder-title_span]:whitespace-nowrap [:where(&).admin-builder-title_span]:overflow-hidden [:where(&).admin-builder-title_span]:text-ellipsis"])}>
          <strong>{field === "accessories" ? "Accessories Page Builder" : (field === "accessory" ? "Individual Accessory Builder" : "Page Builder")}</strong>
          <span>{productName}</span>
        </div>
        <button type="button" className={utilities("button button-red admin-builder-save", [62, "[:where(&).button]:[min-height:39px] [:where(&).button]:inline-flex [:where(&).button]:items-center [:where(&).button]:justify-center [:where(&).button]:[gap:7px] [:where(&).button]:[border-radius:4px] [:where(&).button]:[padding:0_17px] [:where(&).button]:font-bold [:where(&).button]:cursor-pointer [:where(&).button]:[border:1px_solid_transparent]"], [65, "[:where(&).button-red]:[background:var(--red)] [:where(&).button-red]:[color:#fff]"], [280, "[.cart-summary_:where(&).button]:[width:100%] [.cart-summary_:where(&).button]:[margin-top:12px]"], [286, "[.checkout-form>:where(&).button]:[width:max-content] [.checkout-form>:where(&).button]:[margin-top:6px]"], [446, "[.purchase-actions>:where(&).button-red]:[min-height:35px] [.purchase-actions>:where(&).button-red]:[flex:1]"], [447, "[.purchase-actions_:where(&).cart-action,_.purchase-actions_:where(&).button-red]:[font-size:16px]"], [492, "[.accessory-card_:where(&).button]:[width:100%] [.accessory-card_:where(&).button]:[margin-top:12px] [.accessory-card_:where(&).button]:[border-radius:6px] [.accessory-card_:where(&).button]:text-ellipsis [.accessory-card_:where(&).button]:overflow-hidden [.accessory-card_:where(&).button]:whitespace-nowrap"], [603, "[:is(:where(&).button)]:[font-size:14px]"], [654, "[:is(.accessory-card_:where(&).button)]:[font-size:10px] [:is(.accessory-card_:where(&).button)]:[padding:0_4px] [:is(.accessory-card_:where(&).button)]:[min-height:30px]"], [683, "[@media_(max-width:_720px)]:[:where(&).button,_:where(&).text-link]:[font-size:12px]"], [809, "[.package-card_footer_:where(&).button]:[font-size:11px] [.package-card_footer_:where(&).button]:[min-height:32px] [.package-card_footer_:where(&).button]:[padding:0_13px]"], [818, "[.maintenance-cta_:where(&).button]:[margin-right:15px]"], [837, "[@media_(max-width:_720px)]:[.maintenance-cta_:where(&).button]:[margin:0_0_12px]"], [1057, "[:where(&).admin-builder-save]:[flex-shrink:0]"], [1225, "[.combo-modal>footer_:where(&).button]:[min-height:36px]"], [1289, "[@media_(max-width:_720px)]:[.combo-modal>footer_:where(&).button]:[width:100%]"], [2189, "[.purchase-actions_:where(&).button-red]:[background:var(--red)]"], [2383, "[@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:inline-block [@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:[margin-top:15px]"], [2479, "[.reference-toolbar_:where(&).button]:[height:34px] [.reference-toolbar_:where(&).button]:[padding:0_10px] [.reference-toolbar_:where(&).button]:[font-size:10px]"], [2491, "[.order-actions_:where(&).button]:[font-size:9px] [.order-actions_:where(&).button]:[padding:6px_14px]"], [2542, "[.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[height:34px] [.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[font-size:9px]"], [2579, "[.order-confirmation-actions_:where(&).button]:flex [.order-confirmation-actions_:where(&).button]:items-center [.order-confirmation-actions_:where(&).button]:justify-center [.order-confirmation-actions_:where(&).button]:[gap:7px] [.order-confirmation-actions_:where(&).button]:[min-height:43px] [.order-confirmation-actions_:where(&).button]:[text-decoration:none]"], [2587, "[.invoice-actions_:where(&).button]:flex [.invoice-actions_:where(&).button]:items-center [.invoice-actions_:where(&).button]:justify-center [.invoice-actions_:where(&).button]:[gap:6px]"], [2627, "[@media_(max-width:680px)]:[.invoice-actions_:where(&).button]:[flex:1_1_100%]"], [2653, "[.drawer-edit-actions_:where(&).button]:[height:31px] [.drawer-edit-actions_:where(&).button]:[padding:0_11px] [.drawer-edit-actions_:where(&).button]:[font-size:9px]"], [2830, "[@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[flex:1] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[min-height:38px] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[font-size:14px] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:font-bold [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[padding:0_4px]"])} onClick={saveAndReturn}>
          <Save size={15} /> Save &amp; Return
        </button>
      </header>

      {/* ── Full-width editor ── */}
      <main className={utilities("admin-builder-content", [1058, "[:where(&).admin-builder-content]:[flex:1] [:where(&).admin-builder-content]:[padding:16px_20px]"])}>
        <RichDescriptionEditor
          value={{ html: descHtml, css: descCss }}
          onChange={v => { setDescHtml(v.html); setDescCss(v.css); }}
        />
      </main>
    </div>
  );
}
