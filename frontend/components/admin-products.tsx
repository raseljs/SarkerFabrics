"use client";


import { withTailwindStyle, utilities, resolveClasses } from "@/lib/tailwind";
import { Download, ImagePlus, LayoutGrid, Link2, Loader2, Pencil, Plus, Save, Search, Trash2, Upload, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { starterCss, starterHtml } from "@/components/rich-description-editor";
import { apiFormRequest, apiRequest, getApiBase } from "@/lib/api";
import { ImageCropperModal } from "./image-cropper-modal";
import { useAdminDialog } from "./admin-dialog";
import ProductColoursEditor, { type ColourDraft } from "./product-colours-editor";
import { prepareColourSave } from "@/lib/product-colours";

// Component styling is compiled from these local Tailwind utilities.
const componentUtilities: Record<string, string> = {
  "admin-autocomplete-dropdown": utilities([2008, "[:where(&).admin-autocomplete-dropdown]:absolute [:where(&).admin-autocomplete-dropdown]:[top:calc(100%_+_4px)] [:where(&).admin-autocomplete-dropdown]:[left:0] [:where(&).admin-autocomplete-dropdown]:[right:0] [:where(&).admin-autocomplete-dropdown]:[z-index:200] [:where(&).admin-autocomplete-dropdown]:[background:#fff] [:where(&).admin-autocomplete-dropdown]:[border:1.5px_solid_#c5d4ef] [:where(&).admin-autocomplete-dropdown]:[border-radius:10px] [:where(&).admin-autocomplete-dropdown]:[box-shadow:0_8px_24px_rgba(0,_0,_0,_0.12)] [:where(&).admin-autocomplete-dropdown]:[list-style:none] [:where(&).admin-autocomplete-dropdown]:[margin:0] [:where(&).admin-autocomplete-dropdown]:[padding:4px] [:where(&).admin-autocomplete-dropdown]:[max-height:260px] [:where(&).admin-autocomplete-dropdown]:overflow-y-auto"], [2009, "[:where(&).admin-autocomplete-dropdown_li]:[border-radius:7px] [:where(&).admin-autocomplete-dropdown_li]:overflow-hidden"], [2010, "[:where(&).admin-autocomplete-dropdown_li_button]:flex [:where(&).admin-autocomplete-dropdown_li_button]:items-center [:where(&).admin-autocomplete-dropdown_li_button]:[gap:10px] [:where(&).admin-autocomplete-dropdown_li_button]:[width:100%] [:where(&).admin-autocomplete-dropdown_li_button]:[background:none] [:where(&).admin-autocomplete-dropdown_li_button]:[border:none] [:where(&).admin-autocomplete-dropdown_li_button]:cursor-pointer [:where(&).admin-autocomplete-dropdown_li_button]:[padding:8px_10px] [:where(&).admin-autocomplete-dropdown_li_button]:text-left [:where(&).admin-autocomplete-dropdown_li_button]:[border-radius:7px] [:where(&).admin-autocomplete-dropdown_li_button]:[transition:background_0.15s]"], [2011, "[:where(&).admin-autocomplete-dropdown_li_button:hover]:[background:#f0f4ff]"], [2012, "[:where(&).admin-autocomplete-dropdown_li_button_img]:[width:38px] [:where(&).admin-autocomplete-dropdown_li_button_img]:[height:32px] [:where(&).admin-autocomplete-dropdown_li_button_img]:object-cover [:where(&).admin-autocomplete-dropdown_li_button_img]:[border-radius:5px] [:where(&).admin-autocomplete-dropdown_li_button_img]:[flex-shrink:0]"], [2013, "[:where(&).admin-autocomplete-dropdown_li_button_span]:flex [:where(&).admin-autocomplete-dropdown_li_button_span]:flex-col [:where(&).admin-autocomplete-dropdown_li_button_span]:[gap:1px]"], [2014, "[:where(&).admin-autocomplete-dropdown_li_button_strong]:[font-size:13px] [:where(&).admin-autocomplete-dropdown_li_button_strong]:[color:#1a2a4a]"], [2015, "[:where(&).admin-autocomplete-dropdown_li_button_small]:[font-size:11px] [:where(&).admin-autocomplete-dropdown_li_button_small]:[color:#7a8797]"]),
  "admin-autocomplete-wrap": utilities([2006, "[:where(&).admin-autocomplete-wrap]:relative"], [2007, "[:where(&).admin-autocomplete-wrap_input]:[width:100%]"]),
  "admin-checkbox-grid": utilities([1607, "[:where(&).admin-checkbox-grid]:grid [:where(&).admin-checkbox-grid]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] [:where(&).admin-checkbox-grid]:[gap:8px_12px]"], [1608, "[:where(&).admin-checkbox-grid_label]:flex [:where(&).admin-checkbox-grid_label]:items-center [:where(&).admin-checkbox-grid_label]:[gap:7px]"]),
  "admin-crud": utilities([161, "[:where(&).admin-crud]:[padding-top:4px]"]),
  "admin-crud-heading": utilities([162, "[:where(&).admin-crud-heading]:flex [:where(&).admin-crud-heading]:[align-items:end] [:where(&).admin-crud-heading]:justify-between"], [163, "[:where(&).admin-crud-heading_h1]:[letter-spacing:-.04em] [:where(&).admin-crud-heading_h1]:[margin:6px_0]"], [580, "[@media_(max-width:_720px)]:[:where(&).admin-crud-heading]:[align-items:start] [@media_(max-width:_720px)]:[:where(&).admin-crud-heading]:flex-col [@media_(max-width:_720px)]:[:where(&).admin-crud-heading]:[gap:15px]"], [655, "[:where(&).admin-header_h1,_:where(&).admin-crud-heading_h1]:[font-size:34px]"], [656, "[:where(&).admin-header_span,_:where(&).admin-crud-heading_span]:[font-size:13px]"], [703, "[@media_(max-width:_720px)]:[:where(&).admin-header_h1,_:where(&).admin-crud-heading_h1]:[font-size:29px]"], [1530, "[@media_(max-width:_720px)]:[.admin-route-content_:where(&).admin-crud-heading]:[margin-bottom:15px]"], [3325, "[:is(:where(&).admin-crud-heading)]:[padding:4px_2px_0] [:is(:where(&).admin-crud-heading)]:[margin-bottom:20px]"], [3326, "[:is(:where(&).admin-crud-heading_h1)]:[color:#122b4d] [:is(:where(&).admin-crud-heading_h1)]:[font-size:clamp(25px,_2.2vw,_34px)] [:is(:where(&).admin-crud-heading_h1)]:[line-height:1.15]"], [3327, "[:where(&).admin-crud-heading_span]:block [:where(&).admin-crud-heading_span]:[max-width:720px] [:where(&).admin-crud-heading_span]:[color:#71829b] [:where(&).admin-crud-heading_span]:[font-size:12px] [:where(&).admin-crud-heading_span]:[line-height:1.55]"], [3356, "[@media_(max-width:_720px)]:[:is(:where(&).admin-crud-heading)]:[margin-bottom:15px]"], [3357, "[@media_(max-width:_720px)]:[:where(&).admin-crud-heading_h1]:[font-size:25px]"], [3358, "[@media_(max-width:_720px)]:[:where(&).admin-crud-heading_span]:[font-size:11px]"], [3373, "[.admin-route-content_:where(&).admin-crud-heading_h1]:[font-size:clamp(28px,_2.4vw,_38px)]"], [3374, "[.admin-route-content_:where(&).admin-crud-heading_span]:[font-size:14px]"], [3416, "[@media_(max-width:_720px)]:[.admin-route-content_:where(&).admin-crud-heading_h1]:[font-size:27px]"], [3422, "[.admin-route-content_:where(&).admin-crud-heading_span,_.admin-route-content_:where(&).crud-form_input,_.admin-route-content_:where(&).crud-form_select,_.admin-route-content_:where(&).crud-form_textarea,_.admin-route-content_:where(&).crud-product-name_strong,_.admin-route-content_:where(&).crud-row-copy_strong]:[font-size:1rem]"], [3426, "[.inventory-admin_:where(&).admin-crud-heading_span,_.preorders-admin_:where(&).admin-crud-heading_span]:[font-size:1rem]"]),
  "admin-faq-fields": utilities([1972, "[:where(&).admin-faq-fields]:[flex:1] [:where(&).admin-faq-fields]:flex [:where(&).admin-faq-fields]:flex-col [:where(&).admin-faq-fields]:[gap:6px]"], [1973, "[:where(&).admin-faq-fields_input,_:where(&).admin-faq-fields_textarea]:[width:100%] [:where(&).admin-faq-fields_input,_:where(&).admin-faq-fields_textarea]:[font-size:13px]"]),
  "admin-faq-index": utilities([1971, "[:where(&).admin-faq-index]:[flex-shrink:0] [:where(&).admin-faq-index]:[width:24px] [:where(&).admin-faq-index]:[height:24px] [:where(&).admin-faq-index]:[background:#e8effa] [:where(&).admin-faq-index]:[color:#3b6fcf] [:where(&).admin-faq-index]:[font-size:11px] [:where(&).admin-faq-index]:font-bold [:where(&).admin-faq-index]:[border-radius:50%] [:where(&).admin-faq-index]:flex [:where(&).admin-faq-index]:items-center [:where(&).admin-faq-index]:justify-center [:where(&).admin-faq-index]:[margin-top:4px]"]),
  "admin-faq-row": utilities([1970, "[:where(&).admin-faq-row]:flex [:where(&).admin-faq-row]:items-start [:where(&).admin-faq-row]:[gap:10px] [:where(&).admin-faq-row]:[background:#f7f9fc] [:where(&).admin-faq-row]:[border:1px_solid_#e4e9f0] [:where(&).admin-faq-row]:[border-radius:8px] [:where(&).admin-faq-row]:[padding:12px] [:where(&).admin-faq-row]:[margin-bottom:8px]"]),
  "admin-field-help": utilities([1969, "[:where(&).admin-field-help]:[margin:10px_0_0] [:where(&).admin-field-help]:[color:#748095] [:where(&).admin-field-help]:[font-size:10px] [:where(&).admin-field-help]:[line-height:1.5]"]),
  "admin-gallery-preview": utilities([1605, "[:where(&).admin-gallery-preview]:flex [:where(&).admin-gallery-preview]:[gap:8px] [:where(&).admin-gallery-preview]:flex-wrap"], [1606, "[:where(&).admin-gallery-preview_img]:[width:72px] [:where(&).admin-gallery-preview_img]:[height:56px] [:where(&).admin-gallery-preview_img]:object-contain [:where(&).admin-gallery-preview_img]:[border:1px_solid_#e3e8ef] [:where(&).admin-gallery-preview_img]:[border-radius:7px] [:where(&).admin-gallery-preview_img]:[background:#f8fafc]"]),
  "admin-heading-actions": utilities([899, "[:where(&).admin-heading-actions]:flex [:where(&).admin-heading-actions]:items-center [:where(&).admin-heading-actions]:[gap:12px]"], [1532, "[@media_(max-width:_720px)]:[:where(&).admin-heading-actions]:[width:100%] [@media_(max-width:_720px)]:[:where(&).admin-heading-actions]:justify-between [@media_(max-width:_720px)]:[:where(&).admin-heading-actions]:items-stretch"]),
  "admin-inline-link": utilities([900, "[:where(&).admin-inline-link]:inline-flex [:where(&).admin-inline-link]:items-center [:where(&).admin-inline-link]:justify-center [:where(&).admin-inline-link]:[gap:7px] [:where(&).admin-inline-link]:[border:1px_solid_#cddcf1] [:where(&).admin-inline-link]:[border-radius:7px] [:where(&).admin-inline-link]:[padding:10px_12px] [:where(&).admin-inline-link]:[color:#145fc2] [:where(&).admin-inline-link]:[background:#fff] [:where(&).admin-inline-link]:[font-size:11px] [:where(&).admin-inline-link]:font-extrabold"], [901, "[:where(&).admin-inline-link:hover]:[border-color:#80a9df] [:where(&).admin-inline-link:hover]:[background:#f6f9ff]"], [1533, "[@media_(max-width:_720px)]:[.admin-heading-actions_:where(&).admin-inline-link]:[flex:1]"]),
  "admin-page-spinner": utilities([2904, "[:where(&).admin-page-spinner]:flex [:where(&).admin-page-spinner]:items-center [:where(&).admin-page-spinner]:justify-center [:where(&).admin-page-spinner]:[min-height:400px] [:where(&).admin-page-spinner]:[color:#6d7890]"]),
  "admin-panel-heading": utilities([310, "[:where(&).admin-panel-heading]:flex [:where(&).admin-panel-heading]:items-center [:where(&).admin-panel-heading]:justify-between"], [311, "[:where(&).admin-panel-heading_h2]:[margin:0]"], [312, "[:where(&).admin-panel-heading_select]:[border:1px_solid_var(--line)] [:where(&).admin-panel-heading_select]:[border-radius:6px] [:where(&).admin-panel-heading_select]:[padding:8px_12px] [:where(&).admin-panel-heading_select]:[font-size:14px] [:where(&).admin-panel-heading_select]:[color:#647189] [:where(&).admin-panel-heading_select]:[outline:0]"], [322, "[:where(&).admin-panel-heading>a]:[color:#1e61c6] [:where(&).admin-panel-heading>a]:[font-size:14px] [:where(&).admin-panel-heading>a]:font-semibold"], [3338, "[:is(:where(&).admin-panel-heading)]:[min-height:38px] [:is(:where(&).admin-panel-heading)]:[padding-bottom:12px] [:is(:where(&).admin-panel-heading)]:[border-bottom:1px_solid_#edf1f7]"], [3339, "[:is(:where(&).admin-panel-heading_h2)]:[color:#183354] [:is(:where(&).admin-panel-heading_h2)]:[font-size:14px]"], [3375, "[.admin-route-content_:where(&).admin-panel-heading_h2]:[font-size:17px]"]),
  "admin-product-stat-grid": utilities([902, "[:where(&).admin-product-stat-grid]:grid [:where(&).admin-product-stat-grid]:[grid-template-columns:repeat(4,_minmax(0,_1fr))] [:where(&).admin-product-stat-grid]:[gap:11px] [:where(&).admin-product-stat-grid]:[margin-bottom:17px]"], [903, "[:where(&).admin-product-stat-grid>div]:grid [:where(&).admin-product-stat-grid>div]:[gap:4px] [:where(&).admin-product-stat-grid>div]:[border:1px_solid_#e0e6ee] [:where(&).admin-product-stat-grid>div]:[border-radius:9px] [:where(&).admin-product-stat-grid>div]:[padding:14px_16px] [:where(&).admin-product-stat-grid>div]:[background:#fff] [:where(&).admin-product-stat-grid>div]:[box-shadow:0_6px_20px_rgba(18,_45,_77,_.035)]"], [904, "[:where(&).admin-product-stat-grid_strong]:[color:#142c50] [:where(&).admin-product-stat-grid_strong]:[font-size:22px]"], [905, "[:where(&).admin-product-stat-grid_span]:[color:#74839a] [:where(&).admin-product-stat-grid_span]:[font-size:10px] [:where(&).admin-product-stat-grid_span]:font-bold"], [1534, "[@media_(max-width:_720px)]:[:where(&).admin-product-stat-grid]:[grid-template-columns:repeat(2,_minmax(0,_1fr))]"], [1535, "[@media_(max-width:_720px)]:[:where(&).admin-product-stat-grid_strong]:[font-size:18px]"], [3386, "[.admin-route-content_:where(&).admin-product-stat-grid_strong]:[font-size:24px]"], [3387, "[.admin-route-content_:where(&).admin-product-stat-grid_span]:[font-size:12px]"]),
  "admin-special-fields": utilities([1964, "[:where(&).admin-special-fields]:[margin:4px_0_2px] [:where(&).admin-special-fields]:[padding:14px] [:where(&).admin-special-fields]:[border:1px_solid_#e3e8ef] [:where(&).admin-special-fields]:[border-radius:8px] [:where(&).admin-special-fields]:[background:#f9fbfe]"], [1965, "[:where(&).admin-special-fields_h3]:[margin:0_0_12px] [:where(&).admin-special-fields_h3]:[font-size:13px] [:where(&).admin-special-fields_h3]:[color:#18365e]"]),
  "admin-special-grid": utilities([1966, "[:where(&).admin-special-grid]:grid [:where(&).admin-special-grid]:[grid-template-columns:1fr_1fr] [:where(&).admin-special-grid]:[gap:10px]"], [1967, "[:where(&).admin-special-grid_label]:grid [:where(&).admin-special-grid_label]:[gap:6px]"], [1968, "[:where(&).admin-special-grid_input,_:where(&).admin-special-grid_select]:[width:100%] [:where(&).admin-special-grid_input,_:where(&).admin-special-grid_select]:[border:1px_solid_#dce3ec] [:where(&).admin-special-grid_input,_:where(&).admin-special-grid_select]:[border-radius:6px] [:where(&).admin-special-grid_input,_:where(&).admin-special-grid_select]:[padding:10px] [:where(&).admin-special-grid_input,_:where(&).admin-special-grid_select]:[background:#fff]"], [2018, "[@media_(max-width:700px)]:[:where(&).admin-special-grid]:[grid-template-columns:1fr]"]),
  "admin-tag": utilities([2001, "[:where(&).admin-tag]:inline-flex [:where(&).admin-tag]:items-center [:where(&).admin-tag]:[gap:6px] [:where(&).admin-tag]:[background:#e8effa] [:where(&).admin-tag]:[color:#2b4fa0] [:where(&).admin-tag]:[border:1px_solid_#c5d4ef] [:where(&).admin-tag]:[border-radius:20px] [:where(&).admin-tag]:[padding:4px_10px_4px_8px] [:where(&).admin-tag]:[font-size:12px] [:where(&).admin-tag]:font-semibold"], [2002, "[:where(&).admin-tag_img]:[width:20px] [:where(&).admin-tag_img]:[height:20px] [:where(&).admin-tag_img]:object-cover [:where(&).admin-tag_img]:[border-radius:4px]"], [2003, "[:where(&).admin-tag_button]:[background:none] [:where(&).admin-tag_button]:[border:none] [:where(&).admin-tag_button]:cursor-pointer [:where(&).admin-tag_button]:[color:#6b83c0] [:where(&).admin-tag_button]:[font-size:14px] [:where(&).admin-tag_button]:[line-height:1] [:where(&).admin-tag_button]:[padding:0_2px] [:where(&).admin-tag_button]:[margin-left:2px]"], [2004, "[:where(&).admin-tag_button:hover]:[color:#c0392b]"]),
  "admin-tags-list": utilities([2000, "[:where(&).admin-tags-list]:flex [:where(&).admin-tags-list]:flex-wrap [:where(&).admin-tags-list]:[gap:8px] [:where(&).admin-tags-list]:[margin-bottom:10px]"]),
  "admin-video-urls": utilities([420, "[:where(&).admin-video-urls]:[margin:8px_0] [:where(&).admin-video-urls]:[padding:12px] [:where(&).admin-video-urls]:[border:1px_solid_#e3e8ef] [:where(&).admin-video-urls]:[border-radius:8px] [:where(&).admin-video-urls]:[background:#f9fbfe]"]),
  "badge": utilities([2423, "[:where(&).badge]:inline-block [:where(&).badge]:[padding:5px_9px] [:where(&).badge]:[border-radius:7px] [:where(&).badge]:[background:#d9f7e7] [:where(&).badge]:[color:#0c985d] [:where(&).badge]:[font-size:10px] [:where(&).badge]:font-bold"], [2424, "[:where(&).badge.paid]:[background:#daf6e9] [:where(&).badge.paid]:[color:#0b9b5d]"], [2425, "[:where(&).badge.processing]:[background:#dcecff] [:where(&).badge.processing]:[color:#1263cc]"], [2426, "[:where(&).badge.shipped]:[background:#fff0c9] [:where(&).badge.shipped]:[color:#d88900]"], [2427, "[:where(&).badge.delivered]:[background:#daf6e9] [:where(&).badge.delivered]:[color:#0b9b5d]"], [2483, "[.orders-table_:where(&).badge]:whitespace-nowrap"], [2484, "[:where(&).badge.unpaid]:[background:#ffe6e8] [:where(&).badge.unpaid]:[color:#f33]"], [2485, "[:where(&).badge.confirmed]:[background:#ddf7e9] [:where(&).badge.confirmed]:[color:#0b965e]"], [2486, "[:where(&).badge.packed]:[background:#ece8ff] [:where(&).badge.packed]:[color:#6d4ccb]"], [2487, "[:where(&).badge.out\\_for\\_delivery]:[background:#e2edff] [:where(&).badge.out\\_for\\_delivery]:[color:#175fd1]"], [2488, "[:where(&).badge.cancelled]:[background:#ffe5e8] [:where(&).badge.cancelled]:[color:#dd3441]"]),
  "body": utilities([3684, "[.invoice-admin_.card_:where(&).body]:[padding:10px_15px] [.invoice-admin_.card_:where(&).body]:[font-size:11px] [.invoice-admin_.card_:where(&).body]:[line-height:1.55]"]),
  "brand": utilities([3612, "[.invoice-export_:where(&).brand_h1]:[margin:0] [.invoice-export_:where(&).brand_h1]:[font-size:25px] [.invoice-export_:where(&).brand_h1]:[color:#0b2445]"], [3613, "[.invoice-export_:where(&).brand_p]:[margin:7px_0_0] [.invoice-export_:where(&).brand_p]:[color:#64748b]"], [3664, "[.invoice-admin_:where(&).brand]:flex [.invoice-admin_:where(&).brand]:[gap:10px] [.invoice-admin_:where(&).brand]:items-center"], [3666, "[.invoice-admin_:where(&).brand_strong]:[font-size:26px] [.invoice-admin_:where(&).brand_strong]:[letter-spacing:2px]"], [3667, "[.invoice-admin_:where(&).brand_b]:block [.invoice-admin_:where(&).brand_b]:[font-size:13px] [.invoice-admin_:where(&).brand_b]:[letter-spacing:3px]"], [3668, "[.invoice-admin_:where(&).brand_small]:block [.invoice-admin_:where(&).brand_small]:[color:#7a91b8] [.invoice-admin_:where(&).brand_small]:[margin-top:6px]"]),
  "button": utilities([62, "[:where(&).button]:[min-height:39px] [:where(&).button]:inline-flex [:where(&).button]:items-center [:where(&).button]:justify-center [:where(&).button]:[gap:7px] [:where(&).button]:[border-radius:4px] [:where(&).button]:[padding:0_17px] [:where(&).button]:font-bold [:where(&).button]:cursor-pointer [:where(&).button]:[border:1px_solid_transparent]"], [280, "[.cart-summary_:where(&).button]:[width:100%] [.cart-summary_:where(&).button]:[margin-top:12px]"], [286, "[.checkout-form>:where(&).button]:[width:max-content] [.checkout-form>:where(&).button]:[margin-top:6px]"], [492, "[.accessory-card_:where(&).button]:[width:100%] [.accessory-card_:where(&).button]:[margin-top:12px] [.accessory-card_:where(&).button]:[border-radius:6px] [.accessory-card_:where(&).button]:text-ellipsis [.accessory-card_:where(&).button]:overflow-hidden [.accessory-card_:where(&).button]:whitespace-nowrap"], [603, "[:is(:where(&).button)]:[font-size:14px]"], [654, "[:is(.accessory-card_:where(&).button)]:[font-size:10px] [:is(.accessory-card_:where(&).button)]:[padding:0_4px] [:is(.accessory-card_:where(&).button)]:[min-height:30px]"], [683, "[@media_(max-width:_720px)]:[:where(&).button,_:where(&).text-link]:[font-size:12px]"], [809, "[.package-card_footer_:where(&).button]:[font-size:11px] [.package-card_footer_:where(&).button]:[min-height:32px] [.package-card_footer_:where(&).button]:[padding:0_13px]"], [818, "[.maintenance-cta_:where(&).button]:[margin-right:15px]"], [837, "[@media_(max-width:_720px)]:[.maintenance-cta_:where(&).button]:[margin:0_0_12px]"], [1225, "[.combo-modal>footer_:where(&).button]:[min-height:36px]"], [1289, "[@media_(max-width:_720px)]:[.combo-modal>footer_:where(&).button]:[width:100%]"], [2383, "[@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:inline-block [@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:[margin-top:15px]"], [2479, "[.reference-toolbar_:where(&).button]:[height:34px] [.reference-toolbar_:where(&).button]:[padding:0_10px] [.reference-toolbar_:where(&).button]:[font-size:10px]"], [2491, "[.order-actions_:where(&).button]:[font-size:9px] [.order-actions_:where(&).button]:[padding:6px_14px]"], [2542, "[.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[height:34px] [.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[font-size:9px]"], [2579, "[.order-confirmation-actions_:where(&).button]:flex [.order-confirmation-actions_:where(&).button]:items-center [.order-confirmation-actions_:where(&).button]:justify-center [.order-confirmation-actions_:where(&).button]:[gap:7px] [.order-confirmation-actions_:where(&).button]:[min-height:43px] [.order-confirmation-actions_:where(&).button]:[text-decoration:none]"], [2587, "[.invoice-actions_:where(&).button]:flex [.invoice-actions_:where(&).button]:items-center [.invoice-actions_:where(&).button]:justify-center [.invoice-actions_:where(&).button]:[gap:6px]"], [2627, "[@media_(max-width:680px)]:[.invoice-actions_:where(&).button]:[flex:1_1_100%]"], [2653, "[.drawer-edit-actions_:where(&).button]:[height:31px] [.drawer-edit-actions_:where(&).button]:[padding:0_11px] [.drawer-edit-actions_:where(&).button]:[font-size:9px]"]),
  "button-blue": utilities([1047, "[:where(&).button-blue]:[background:linear-gradient(135deg,_#3f70ce,_#2d5bb8)] [:where(&).button-blue]:[color:#fff] [:where(&).button-blue]:[border:0] [:where(&).button-blue]:[border-radius:7px] [:where(&).button-blue]:cursor-pointer [:where(&).button-blue]:font-bold [:where(&).button-blue]:inline-flex [:where(&).button-blue]:items-center [:where(&).button-blue]:[transition:all_0.18s]"], [1048, "[:where(&).button-blue:hover]:[background:linear-gradient(135deg,_#2d5bb8,_#1e4a9e)] [:where(&).button-blue:hover]:[transform:translateY(-1px)] [:where(&).button-blue:hover]:[box-shadow:0_4px_12px_#3f70ce30]"]),
  "button-red": utilities([65, "[:where(&).button-red]:[background:var(--red)] [:where(&).button-red]:[color:#fff]"], [446, "[.purchase-actions>:where(&).button-red]:[min-height:35px] [.purchase-actions>:where(&).button-red]:[flex:1]"], [447, "[.purchase-actions_:where(&).cart-action,_.purchase-actions_:where(&).button-red]:[font-size:16px]"], [2189, "[.purchase-actions_:where(&).button-red]:[background:var(--red)]"], [2830, "[@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[flex:1] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[min-height:38px] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[font-size:14px] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:font-bold [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[padding:0_4px]"]),
  "crud-actions": utilities([202, "[:where(&).crud-actions]:flex [:where(&).crud-actions]:[gap:8px]"], [3412, "[.admin-products-page_.product-admin-row_:where(&).crud-actions]:[min-width:110px]"]),
  "crud-empty": utilities([203, "[:where(&).crud-empty]:[padding:45px_20px] [:where(&).crud-empty]:text-center [:where(&).crud-empty]:[color:#637086] [:where(&).crud-empty]:[font-size:15px]"]),
  "crud-form": utilities([169, "[:where(&).crud-form]:[border:1px_solid_var(--line)] [:where(&).crud-form]:[border-radius:8px] [:where(&).crud-form]:grid [:where(&).crud-form]:[grid-template-columns:minmax(0,_1fr)] [:where(&).crud-form]:[background:#fff]"], [170, "[:where(&).crud-form_label]:grid"], [171, "[:where(&).crud-form_input,_:where(&).crud-form_select]:[width:100%] [:where(&).crud-form_input,_:where(&).crud-form_select]:[border:1px_solid_#dce2eb] [:where(&).crud-form_input,_:where(&).crud-form_select]:[border-radius:6px] [:where(&).crud-form_input,_:where(&).crud-form_select]:[outline:0] [:where(&).crud-form_input,_:where(&).crud-form_select]:[padding:11px_12px] [:where(&).crud-form_input,_:where(&).crud-form_select]:[color:var(--ink)] [:where(&).crud-form_input,_:where(&).crud-form_select]:[font-size:15px] [:where(&).crud-form_input,_:where(&).crud-form_select]:[background:#fff]"], [172, "[:where(&).crud-form_input[type='file']]:[padding:9px]"], [173, "[:where(&).crud-form_input:focus,_:where(&).crud-form_select:focus]:[border-color:#3f70ce]"], [919, "[:where(&).crud-form_textarea]:[width:100%] [:where(&).crud-form_textarea]:[resize:vertical] [:where(&).crud-form_textarea]:[border:1px_solid_#dce2eb] [:where(&).crud-form_textarea]:[border-radius:4px] [:where(&).crud-form_textarea]:[outline:0] [:where(&).crud-form_textarea]:[padding:9px] [:where(&).crud-form_textarea]:[color:var(--ink)] [:where(&).crud-form_textarea]:[font:inherit]"], [920, "[:is(:where(&).crud-form_textarea)]:[font-size:11px] [:is(:where(&).crud-form_textarea)]:[background:#fff] [:is(:where(&).crud-form_textarea)]:[line-height:1.5]"], [921, "[:where(&).crud-form_textarea:focus]:[border-color:#3f70ce]"], [3333, "[:where(&).crud-form,_:where(&).crud-list]:[border-color:#e1e8f2] [:where(&).crud-form,_:where(&).crud-list]:[border-radius:14px] [:where(&).crud-form,_:where(&).crud-list]:[box-shadow:0_7px_24px_rgba(19,52,94,.055)]"], [3334, "[:is(:where(&).crud-form)]:[gap:14px] [:is(:where(&).crud-form)]:[padding:20px]"], [3335, "[:is(:where(&).crud-form_label)]:[gap:6px] [:is(:where(&).crud-form_label)]:[color:#52657f] [:is(:where(&).crud-form_label)]:[font-size:11px] [:is(:where(&).crud-form_label)]:font-bold"], [3336, "[:where(&).crud-form_input,_:where(&).crud-form_select,_:where(&).crud-form_textarea]:[border-color:#dce5f0] [:where(&).crud-form_input,_:where(&).crud-form_select,_:where(&).crud-form_textarea]:[border-radius:8px] [:where(&).crud-form_input,_:where(&).crud-form_select,_:where(&).crud-form_textarea]:[padding:10px_11px] [:where(&).crud-form_input,_:where(&).crud-form_select,_:where(&).crud-form_textarea]:[color:#1b304e] [:where(&).crud-form_input,_:where(&).crud-form_select,_:where(&).crud-form_textarea]:[background:#fbfcfe] [:where(&).crud-form_input,_:where(&).crud-form_select,_:where(&).crud-form_textarea]:[font-size:12px] [:where(&).crud-form_input,_:where(&).crud-form_select,_:where(&).crud-form_textarea]:[transition:border-color_.15s,box-shadow_.15s,background_.15s]"], [3337, "[:where(&).crud-form_input:focus,_:where(&).crud-form_select:focus,_:where(&).crud-form_textarea:focus]:[border-color:#4d8cdf] [:where(&).crud-form_input:focus,_:where(&).crud-form_select:focus,_:where(&).crud-form_textarea:focus]:[background:#fff] [:where(&).crud-form_input:focus,_:where(&).crud-form_select:focus,_:where(&).crud-form_textarea:focus]:[box-shadow:0_0_0_3px_rgba(53,119,213,.11)]"], [3361, "[@media_(max-width:_720px)]:[:where(&).crud-form]:[padding:16px]"], [3376, "[.admin-route-content_:where(&).crud-form_label]:[font-size:13px]"], [3377, "[.admin-route-content_:where(&).crud-form_input,_.admin-route-content_:where(&).crud-form_select,_.admin-route-content_:where(&).crud-form_textarea]:[font-size:14px]"], [3422, "[.admin-route-content_:where(&).admin-crud-heading_span,_.admin-route-content_:where(&).crud-form_input,_.admin-route-content_:where(&).crud-form_select,_.admin-route-content_:where(&).crud-form_textarea,_.admin-route-content_:where(&).crud-product-name_strong,_.admin-route-content_:where(&).crud-row-copy_strong]:[font-size:1rem]"], [3423, "[@media_(max-width:_720px)]:[.admin-route-content_:where(&).crud-form_input,_.admin-route-content_:where(&).crud-form_select,_.admin-route-content_:where(&).crud-form_textarea]:[font-size:1rem]"]),
  "crud-grid": utilities([168, "[:where(&).crud-grid]:grid [:where(&).crud-grid]:[align-items:start]"], [581, "[@media_(max-width:_720px)]:[:where(&).crud-grid]:[grid-template-columns:1fr]"], [3332, "[:is(:where(&).crud-grid)]:[grid-template-columns:minmax(300px,390px)_minmax(0,1fr)] [:is(:where(&).crud-grid)]:[gap:18px]"], [3360, "[@media_(max-width:_720px)]:[:is(:where(&).crud-grid)]:[gap:14px]"], [3400, "[.admin-products-page_:where(&).crud-grid]:[grid-template-columns:minmax(0,_340px)_minmax(0,_1fr)] [.admin-products-page_:where(&).crud-grid]:[align-items:start]"], [3401, "[.admin-products-page_:where(&).crud-grid_>_*,_.admin-products-page_:where(&).crud-list,_.admin-products-page_:where(&).product-editor-form]:[min-width:0] [.admin-products-page_:where(&).crud-grid_>_*,_.admin-products-page_:where(&).crud-list,_.admin-products-page_:where(&).product-editor-form]:[max-width:100%]"], [3415, "[@media_(max-width:_1250px)]:[.admin-products-page_:where(&).crud-grid]:[grid-template-columns:minmax(0,_1fr)]"]),
  "crud-list": utilities([180, "[:where(&).crud-list]:[border:1px_solid_var(--line)] [:where(&).crud-list]:[border-radius:8px] [:where(&).crud-list]:[background:#fff] [:where(&).crud-list]:overflow-hidden"], [3333, "[:where(&).crud-form,_:where(&).crud-list]:[border-color:#e1e8f2] [:where(&).crud-form,_:where(&).crud-list]:[border-radius:14px] [:where(&).crud-form,_:where(&).crud-list]:[box-shadow:0_7px_24px_rgba(19,52,94,.055)]"], [3401, "[.admin-products-page_:where(&).crud-grid_>_*,_.admin-products-page_:where(&).crud-list,_.admin-products-page_:where(&).product-editor-form]:[min-width:0] [.admin-products-page_:where(&).crud-grid_>_*,_.admin-products-page_:where(&).crud-list,_.admin-products-page_:where(&).product-editor-form]:[max-width:100%]"], [3402, "[.admin-products-page_:where(&).crud-list]:overflow-hidden"]),
  "crud-list-toolbar": utilities([181, "[:where(&).crud-list-toolbar]:flex [:where(&).crud-list-toolbar]:items-center [:where(&).crud-list-toolbar]:justify-between [:where(&).crud-list-toolbar]:[gap:18px] [:where(&).crud-list-toolbar]:[border-bottom:1px_solid_var(--line)]"], [182, "[:where(&).crud-list-toolbar_h2]:[margin:0_0_4px]"], [582, "[@media_(max-width:_720px)]:[:where(&).crud-list-toolbar]:[align-items:start] [@media_(max-width:_720px)]:[:where(&).crud-list-toolbar]:flex-col"], [3340, "[:is(:where(&).crud-list-toolbar)]:[padding:16px_18px] [:is(:where(&).crud-list-toolbar)]:[background:linear-gradient(180deg,#fff,#fbfcff)]"], [3341, "[:is(:where(&).crud-list-toolbar_h2)]:[color:#183354] [:is(:where(&).crud-list-toolbar_h2)]:[font-size:16px]"], [3342, "[:where(&).crud-list-toolbar_span]:[color:#8998ad] [:where(&).crud-list-toolbar_span]:[font-size:10px]"], [3378, "[.admin-route-content_:where(&).crud-list-toolbar_h2]:[font-size:19px]"], [3379, "[.admin-route-content_:where(&).crud-list-toolbar_span]:[font-size:12px]"], [3403, "[.admin-products-page_:where(&).crud-list-toolbar]:[min-width:0] [.admin-products-page_:where(&).crud-list-toolbar]:flex-wrap"], [3417, "[@media_(max-width:_720px)]:[.admin-products-page_:where(&).crud-list-toolbar]:items-stretch"]),
  "crud-price": utilities([197, "[:where(&).crud-price]:[color:var(--red)] [:where(&).crud-price]:font-extrabold"], [665, "[:is(:where(&).crud-price)]:[font-size:13px]"], [3382, "[.admin-route-content_:where(&).crud-price,_.admin-route-content_:where(&).crud-stock,_.admin-route-content_:where(&).crud-status]:[font-size:12px]"], [3411, "[.admin-products-page_.product-admin-row_>_:where(&).crud-price,_.admin-products-page_.product-admin-row_>_:where(&).crud-status,_.admin-products-page_.product-admin-row_>_:where(&).crud-stock]:inline-flex"]),
  "crud-product-name": utilities([195, "[:where(&).crud-product-name_strong]:block [:where(&).crud-product-name_strong]:[line-height:1.4]"], [196, "[:where(&).crud-product-name_small]:block [:where(&).crud-product-name_small]:[color:#8590a3] [:where(&).crud-product-name_small]:[margin-top:5px] [:where(&).crud-product-name_small]:whitespace-nowrap [:where(&).crud-product-name_small]:overflow-hidden [:where(&).crud-product-name_small]:text-ellipsis"], [663, "[:is(:where(&).crud-product-name_strong)]:[font-size:12px]"], [664, "[:is(:where(&).crud-product-name_small)]:[font-size:10px]"], [3380, "[.admin-route-content_:where(&).crud-product-name_strong]:[font-size:14px]"], [3381, "[.admin-route-content_:where(&).crud-product-name_small]:[font-size:12px]"], [3413, "[.admin-products-page_:where(&).crud-product-name]:[min-width:0]"], [3414, "[.admin-products-page_:where(&).crud-product-name_strong,_.admin-products-page_:where(&).crud-product-name_small]:overflow-hidden [.admin-products-page_:where(&).crud-product-name_strong,_.admin-products-page_:where(&).crud-product-name_small]:text-ellipsis [.admin-products-page_:where(&).crud-product-name_strong,_.admin-products-page_:where(&).crud-product-name_small]:whitespace-nowrap"], [3422, "[.admin-route-content_:where(&).admin-crud-heading_span,_.admin-route-content_:where(&).crud-form_input,_.admin-route-content_:where(&).crud-form_select,_.admin-route-content_:where(&).crud-form_textarea,_.admin-route-content_:where(&).crud-product-name_strong,_.admin-route-content_:where(&).crud-row-copy_strong]:[font-size:1rem]"]),
  "crud-row": utilities([192, "[:where(&).crud-row]:grid [:where(&).crud-row]:items-center [:where(&).crud-row]:[border-bottom:1px_solid_#eef1f5]"], [193, "[:where(&).crud-row:last-child]:[border:0]"], [194, "[:where(&).crud-row_img]:[width:56px] [:where(&).crud-row_img]:[height:52px] [:where(&).crud-row_img]:object-contain [:where(&).crud-row_img]:[mix-blend-mode:multiply] [:where(&).crud-row_img]:[background:#f8fafc] [:where(&).crud-row_img]:[border-radius:6px]"], [1274, "[.warranty-record-table_:where(&).crud-row]:[grid-template-columns:1.5fr_.7fr_1.4fr_65px]"], [3344, "[:is(:where(&).crud-row)]:[min-height:70px] [:is(:where(&).crud-row)]:[grid-template-columns:48px_minmax(0,1fr)_auto_auto_34px_34px] [:is(:where(&).crud-row)]:[gap:12px] [:is(:where(&).crud-row)]:[padding:12px_6px] [:is(:where(&).crud-row)]:[border-bottom-color:#edf1f6] [:is(:where(&).crud-row)]:[transition:background_.15s]"], [3345, "[:where(&).crud-row:hover]:[border-radius:9px] [:where(&).crud-row:hover]:[background:#f8faff]"], [3346, "[:where(&).crud-row_img,_:where(&).crud-empty-image]:[width:48px] [:where(&).crud-row_img,_:where(&).crud-empty-image]:[height:45px] [:where(&).crud-row_img,_:where(&).crud-empty-image]:[border:1px_solid_#e7edf5] [:where(&).crud-row_img,_:where(&).crud-empty-image]:[border-radius:9px] [:where(&).crud-row_img,_:where(&).crud-empty-image]:[background:#f6f8fc]"], [3350, "[:where(&).crud-row_em]:[border-radius:999px] [:where(&).crud-row_em]:[padding:5px_8px] [:where(&).crud-row_em]:[font-size:9px] [:where(&).crud-row_em]:not-italic [:where(&).crud-row_em]:font-extrabold [:where(&).crud-row_em]:capitalize"], [3353, "[:where(&).crud-row_>_span]:[color:#8795a8] [:where(&).crud-row_>_span]:[font-size:10px] [:where(&).crud-row_>_span]:whitespace-nowrap"], [3363, "[@media_(max-width:_720px)]:[:where(&).crud-row]:[min-width:0] [@media_(max-width:_720px)]:[:where(&).crud-row]:[grid-template-columns:42px_minmax(0,1fr)_auto_30px_30px] [@media_(max-width:_720px)]:[:where(&).crud-row]:[gap:8px] [@media_(max-width:_720px)]:[:where(&).crud-row]:[padding:11px_3px]"], [3364, "[@media_(max-width:_720px)]:[:where(&).crud-row_img,_:where(&).crud-empty-image]:[width:42px] [@media_(max-width:_720px)]:[:where(&).crud-row_img,_:where(&).crud-empty-image]:[height:40px]"], [3365, "[@media_(max-width:_720px)]:[:where(&).crud-row_>_span:not(.crud-empty-image)]:hidden"], [3368, "[@media_(max-width:_720px)]:[:where(&).crud-row_em]:[padding:4px_6px] [@media_(max-width:_720px)]:[:where(&).crud-row_em]:[font-size:8px]"]),
  "crud-search": utilities([189, "[:where(&).crud-search]:[border:1px_solid_#dce2eb] [:where(&).crud-search]:[border-radius:6px] [:where(&).crud-search]:flex [:where(&).crud-search]:items-center [:where(&).crud-search]:[gap:8px] [:where(&).crud-search]:[padding:0_12px] [:where(&).crud-search]:[width:240px]"], [190, "[:where(&).crud-search_svg]:[color:#8491a7] [:where(&).crud-search_svg]:[width:18px]"], [191, "[:where(&).crud-search_input]:[border:0] [:where(&).crud-search_input]:[outline:0] [:where(&).crud-search_input]:[height:38px] [:where(&).crud-search_input]:[min-width:0] [:where(&).crud-search_input]:[width:100%] [:where(&).crud-search_input]:[font-size:14px]"], [583, "[@media_(max-width:_720px)]:[:where(&).crud-search]:[width:100%]"], [3404, "[.admin-products-page_:where(&).crud-search]:[flex:1_1_220px] [.admin-products-page_:where(&).crud-search]:[min-width:0]"], [3418, "[@media_(max-width:_720px)]:[.admin-products-page_:where(&).crud-search]:[flex-basis:100%] [@media_(max-width:_720px)]:[.admin-products-page_:where(&).crud-search]:[width:100%]"]),
  "crud-status": utilities([198, "[:where(&).crud-status]:[width:max-content] [:where(&).crud-status]:[padding:5px_8px] [:where(&).crud-status]:[border-radius:4px] [:where(&).crud-status]:[font-size:12px] [:where(&).crud-status]:font-semibold [:where(&).crud-status]:capitalize"], [199, "[:where(&).crud-status.published]:[color:#138d5d] [:where(&).crud-status.published]:[background:#e7f7ef]"], [200, "[:where(&).crud-status.draft]:[color:#a66c0b] [:where(&).crud-status.draft]:[background:#fff5dd]"], [3382, "[.admin-route-content_:where(&).crud-price,_.admin-route-content_:where(&).crud-stock,_.admin-route-content_:where(&).crud-status]:[font-size:12px]"], [3411, "[.admin-products-page_.product-admin-row_>_:where(&).crud-price,_.admin-products-page_.product-admin-row_>_:where(&).crud-status,_.admin-products-page_.product-admin-row_>_:where(&).crud-stock]:inline-flex"], [3424, "[.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:inline-flex [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:items-center [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:justify-center [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[min-width:4.25rem] [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[min-height:1.75rem] [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[padding:.35rem_.7rem] [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[border-radius:999px] [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[font-size:.75rem] [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[line-height:1.2] [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:font-bold [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:whitespace-nowrap"], [3435, "[@media_(max-width:_720px)]:[.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[min-width:4rem] [@media_(max-width:_720px)]:[.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[min-height:1.625rem] [@media_(max-width:_720px)]:[.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[padding:.3rem_.6rem] [@media_(max-width:_720px)]:[.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[font-size:.75rem]"]),
  "crud-stock": utilities([201, "[:where(&).crud-stock]:[color:#637189] [:where(&).crud-stock]:font-medium"], [666, "[:is(:where(&).crud-stock)]:[font-size:11px]"], [923, "[:where(&).crud-stock.is-low]:[color:#dd7411] [:where(&).crud-stock.is-low]:[font-weight:750]"], [3382, "[.admin-route-content_:where(&).crud-price,_.admin-route-content_:where(&).crud-stock,_.admin-route-content_:where(&).crud-status]:[font-size:12px]"], [3411, "[.admin-products-page_.product-admin-row_>_:where(&).crud-price,_.admin-products-page_.product-admin-row_>_:where(&).crud-status,_.admin-products-page_.product-admin-row_>_:where(&).crud-stock]:inline-flex"]),
  "crud-summary": utilities([164, "[:where(&).crud-summary]:[border:1px_solid_var(--line)] [:where(&).crud-summary]:[border-radius:8px] [:where(&).crud-summary]:[background:#fff] [:where(&).crud-summary]:[padding:16px_20px] [:where(&).crud-summary]:[min-width:140px]"], [165, "[:where(&).crud-summary_strong]:block [:where(&).crud-summary_strong]:[color:var(--red)] [:where(&).crud-summary_strong]:[font-size:28px]"], [166, "[:where(&).crud-summary_small]:[color:#718098] [:where(&).crud-summary_small]:[font-size:13px]"]),
  "crud-table": utilities([584, "[@media_(max-width:_720px)]:[:where(&).crud-table]:overflow-x-auto"], [3343, "[:where(&).crud-table]:[padding:4px_12px]"], [3362, "[@media_(max-width:_720px)]:[:is(:where(&).crud-table)]:[padding:4px_10px] [@media_(max-width:_720px)]:[:is(:where(&).crud-table)]:overflow-visible"], [3406, "[.admin-products-page_:where(&).crud-table]:[width:100%] [.admin-products-page_:where(&).crud-table]:[min-width:0] [.admin-products-page_:where(&).crud-table]:[max-width:100%] [.admin-products-page_:where(&).crud-table]:overflow-x-scroll [.admin-products-page_:where(&).crud-table]:overflow-y-hidden [.admin-products-page_:where(&).crud-table]:[scrollbar-gutter:stable] [.admin-products-page_:where(&).crud-table]:[scrollbar-width:auto] [.admin-products-page_:where(&).crud-table]:[scrollbar-color:#8fa5bf_#eaf0f7] [.admin-products-page_:where(&).crud-table]:[-webkit-overflow-scrolling:touch]"], [3407, "[.admin-products-page_:where(&).crud-table::-webkit-scrollbar]:[height:10px]"], [3408, "[.admin-products-page_:where(&).crud-table::-webkit-scrollbar-track]:[background:#eaf0f7]"], [3409, "[.admin-products-page_:where(&).crud-table::-webkit-scrollbar-thumb]:[border-radius:8px] [.admin-products-page_:where(&).crud-table::-webkit-scrollbar-thumb]:[background:#8fa5bf]"]),
  "current": utilities([2537, "[.timeline-event_i:where(&).current]:[background:#0c67eb]"]),
  "danger": utilities([2638, "[.order-action-menu_button:where(&).danger]:[color:#e02634] [.order-action-menu_button:where(&).danger]:[border-top:1px_solid_#edf1f6] [.order-action-menu_button:where(&).danger]:[border-radius:0_0_7px_7px] [.order-action-menu_button:where(&).danger]:[margin-top:3px] [.order-action-menu_button:where(&).danger]:[padding-top:11px]"], [2639, "[.order-action-menu_button:where(&).danger:hover]:[background:#fff1f2] [.order-action-menu_button:where(&).danger:hover]:[color:#c81826]"]),
  "draft": utilities([1476, "[.admin-article-card_span:where(&).draft]:[color:#b86200] [.admin-article-card_span:where(&).draft]:[background:#fff2de]"], [3352, "[.crud-row_em:where(&).draft]:[color:#a96400] [.crud-row_em:where(&).draft]:[background:#fff3df]"], [3424, "[.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:inline-flex [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:items-center [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:justify-center [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[min-width:4.25rem] [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[min-height:1.75rem] [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[padding:.35rem_.7rem] [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[border-radius:999px] [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[font-size:.75rem] [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[line-height:1.2] [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:font-bold [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:whitespace-nowrap"], [3435, "[@media_(max-width:_720px)]:[.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[min-width:4rem] [@media_(max-width:_720px)]:[.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[min-height:1.625rem] [@media_(max-width:_720px)]:[.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[padding:.3rem_.6rem] [@media_(max-width:_720px)]:[.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[font-size:.75rem]"]),
  "eyebrow": utilities([55, "[:where(&).eyebrow]:[color:#2b65c7] [:where(&).eyebrow]:font-extrabold [:where(&).eyebrow]:[letter-spacing:.07em] [:where(&).eyebrow]:[margin:0_0_13px]"], [599, "[:is(:where(&).eyebrow)]:[font-size:12px]"], [779, "[.maintenance-hero_:where(&).eyebrow]:[color:#a7c8f3]"], [1848, "[.hero-slider_:where(&).eyebrow]:[color:#2866d7] [.hero-slider_:where(&).eyebrow]:[letter-spacing:.09em] [.hero-slider_:where(&).eyebrow]:font-extrabold [.hero-slider_:where(&).eyebrow]:[margin:0_0_20px]"], [1872, "[@media_(max-width:_560px)]:[.hero-slider_:where(&).eyebrow]:[font-size:11px] [@media_(max-width:_560px)]:[.hero-slider_:where(&).eyebrow]:[margin-bottom:12px]"], [2098, "[:is(.hero-slider_:where(&).eyebrow)]:[margin-bottom:13px] [:is(.hero-slider_:where(&).eyebrow)]:[font-size:13px]"], [2253, "[@media_(max-width:_640px)]:[.hero-slider_:where(&).eyebrow]:[font-size:9px] [@media_(max-width:_640px)]:[.hero-slider_:where(&).eyebrow]:[margin-bottom:7px]"], [2267, "[@media_(max-width:_720px)]:[:where(&).eyebrow]:[font-size:9px] [@media_(max-width:_720px)]:[:where(&).eyebrow]:[padding:6px_10px]"], [2568, "[.order-confirmation-modal_:where(&).eyebrow]:[margin:0_0_7px] [.order-confirmation-modal_:where(&).eyebrow]:[color:#e31f2b] [.order-confirmation-modal_:where(&).eyebrow]:[font-size:11px] [.order-confirmation-modal_:where(&).eyebrow]:font-extrabold [.order-confirmation-modal_:where(&).eyebrow]:[letter-spacing:.14em]"]),
  "file-hint": utilities([175, "[:where(&).file-hint]:flex! [:where(&).file-hint]:items-center [:where(&).file-hint]:[gap:5px] [:where(&).file-hint]:[color:#7a879d]!"]),
  "form-grid": utilities([174, "[.crud-form_:where(&).form-grid]:[gap:12px]"], [287, "[:where(&).form-grid]:grid [:where(&).form-grid]:[grid-template-columns:1fr_1fr] [:where(&).form-grid]:[gap:12px]"], [579, "[@media_(max-width:_720px)]:[:where(&).form-grid]:[grid-template-columns:1fr]"]),
  "full": utilities([1233, "[.preorder-form-grid_label:where(&).full]:[grid-column:1_/_-1]"], [1276, "[@media_(max-width:_720px)]:[.preorder-form-grid_label:where(&).full]:[grid-column:auto]"], [1672, "[.checkout-fields_label:where(&).full]:[grid-column:1/-1]"], [1809, "[@media_(max-width:560px)]:[.checkout-fields_label:where(&).full]:[grid-column:auto]"]),
  "icon-button": utilities([177, "[:where(&).icon-button]:inline-grid [:where(&).icon-button]:[place-items:center] [:where(&).icon-button]:[border:1px_solid_var(--line)] [:where(&).icon-button]:[border-radius:6px] [:where(&).icon-button]:[background:#fff] [:where(&).icon-button]:[width:34px] [:where(&).icon-button]:[height:34px] [:where(&).icon-button]:[color:#50617b] [:where(&).icon-button]:cursor-pointer"], [178, "[:where(&).icon-button:hover]:[border-color:#8fa5cd] [:where(&).icon-button:hover]:[color:#1d5fc3]"], [179, "[:where(&).icon-button.danger:hover]:[border-color:#efb3b6] [:where(&).icon-button.danger:hover]:[color:var(--red)]"], [1838, "[.admin-media-grid_:where(&).icon-button]:absolute [.admin-media-grid_:where(&).icon-button]:[right:14px] [.admin-media-grid_:where(&).icon-button]:[top:14px] [.admin-media-grid_:where(&).icon-button]:[background:#fff]"], [2633, "[.order-actions_:where(&).icon-button.is-active]:[border-color:#e51f2a] [.order-actions_:where(&).icon-button.is-active]:[color:#e51f2a] [.order-actions_:where(&).icon-button.is-active]:[background:#fff5f5]"], [3354, "[.crud-row_:where(&).icon-button]:[width:30px] [.crud-row_:where(&).icon-button]:[height:30px] [.crud-row_:where(&).icon-button]:[border-color:#e2e9f2] [.crud-row_:where(&).icon-button]:[border-radius:8px]"], [3369, "[@media_(max-width:_720px)]:[.crud-row_:where(&).icon-button]:[width:28px] [@media_(max-width:_720px)]:[.crud-row_:where(&).icon-button]:[height:28px]"]),
  "items": utilities([3686, "[.invoice-admin_:where(&).items]:[width:100%] [.invoice-admin_:where(&).items]:[border-collapse:collapse] [.invoice-admin_:where(&).items]:[border:1px_solid_#cfe0f7] [.invoice-admin_:where(&).items]:[border-radius:7px] [.invoice-admin_:where(&).items]:overflow-hidden [.invoice-admin_:where(&).items]:[font-size:10px]"], [3687, "[.invoice-admin_:where(&).items_th]:[background:#edf5ff] [.invoice-admin_:where(&).items_th]:[padding:10px] [.invoice-admin_:where(&).items_th]:text-left"], [3688, "[.invoice-admin_:where(&).items_td]:[padding:9px_10px] [.invoice-admin_:where(&).items_td]:[border-top:1px_solid_#dce8f6]"], [3689, "[.invoice-admin_:where(&).items_th:nth-child(n+3),_.invoice-admin_:where(&).items_td:nth-child(n+3)]:text-center"]),
  "line": utilities([3685, "[.invoice-admin_.card_:where(&).line]:grid [.invoice-admin_.card_:where(&).line]:[grid-template-columns:105px_10px_1fr] [.invoice-admin_.card_:where(&).line]:[margin:4px_0]"]),
  "next": utilities([775, "[.article-pagination_button:where(&).next]:inline-flex [.article-pagination_button:where(&).next]:items-center [.article-pagination_button:where(&).next]:[gap:5px] [.article-pagination_button:where(&).next]:[padding-inline:11px]"]),
  "page": utilities([3662, "[.invoice-admin_:where(&).page]:[width:794px] [.invoice-admin_:where(&).page]:[min-height:1123px] [.invoice-admin_:where(&).page]:[margin:20px_auto] [.invoice-admin_:where(&).page]:[background:#fff] [.invoice-admin_:where(&).page]:[padding:28px_30px] [.invoice-admin_:where(&).page]:[box-shadow:0_4px_25px_#0a2d6218]"], [3709, "[@media_print]:[.invoice-admin_:where(&).page]:[margin:0] [@media_print]:[.invoice-admin_:where(&).page]:[box-shadow:none] [@media_print]:[.invoice-admin_:where(&).page]:[width:100%] [@media_print]:[.invoice-admin_:where(&).page]:[min-height:auto]"]),
  "price": utilities([114, "[:where(&).price]:[color:var(--red)] [:where(&).price]:font-extrabold"], [610, "[:is(:where(&).price)]:[font-size:20px]"], [690, "[@media_(max-width:_720px)]:[:where(&).price]:[font-size:17px]"], [2874, "[.accessory-store-card_:where(&).price]:[font-size:17px] [.accessory-store-card_:where(&).price]:font-bold [.accessory-store-card_:where(&).price]:[color:var(--primary)]"], [2910, "[@media_(max-width:_768px)]:[.accessory-store-card_:where(&).price]:[font-size:15px]"]),
  "product": utilities([3690, "[.invoice-admin_:where(&).product]:flex [.invoice-admin_:where(&).product]:[gap:9px] [.invoice-admin_:where(&).product]:items-center"], [3691, "[.invoice-admin_:where(&).product_img]:[width:54px] [.invoice-admin_:where(&).product_img]:[height:42px] [.invoice-admin_:where(&).product_img]:object-contain [.invoice-admin_:where(&).product_img]:[background:#f3f6fa] [.invoice-admin_:where(&).product_img]:[border-radius:6px] [.invoice-admin_:where(&).product_img]:[padding:3px]"], [3692, "[.invoice-admin_:where(&).product_small]:block [.invoice-admin_:where(&).product_small]:[color:#6f83a5] [.invoice-admin_:where(&).product_small]:[margin-top:3px]"]),
  "product-admin-row": utilities([922, "[:where(&).product-admin-row]:[grid-template-columns:52px_minmax(180px,_1fr)_90px_75px_80px_100px]"], [3410, "[.admin-products-page_:where(&).product-admin-row]:[min-width:820px] [.admin-products-page_:where(&).product-admin-row]:[grid-template-columns:52px_minmax(230px,_1fr)_100px_90px_95px_118px]"]),
  "product-editor-form": utilities([3401, "[.admin-products-page_:where(&).crud-grid_>_*,_.admin-products-page_:where(&).crud-list,_.admin-products-page_:where(&).product-editor-form]:[min-width:0] [.admin-products-page_:where(&).crud-grid_>_*,_.admin-products-page_:where(&).crud-list,_.admin-products-page_:where(&).product-editor-form]:[max-width:100%]"]),
  "product-faqs-editor": utilities([1974, "[:where(&).product-faqs-editor_h3]:[margin-bottom:4px]"]),
  "published": utilities([1475, "[.admin-article-card_span:where(&).published]:[color:#12884d] [.admin-article-card_span:where(&).published]:[background:#e5f7ed]"], [3351, "[.crud-row_em:where(&).published]:[color:#15834e] [.crud-row_em:where(&).published]:[background:#e8f8ef]"], [3424, "[.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:inline-flex [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:items-center [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:justify-center [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[min-width:4.25rem] [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[min-height:1.75rem] [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[padding:.35rem_.7rem] [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[border-radius:999px] [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[font-size:.75rem] [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[line-height:1.2] [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:font-bold [.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:whitespace-nowrap"], [3435, "[@media_(max-width:_720px)]:[.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[min-width:4rem] [@media_(max-width:_720px)]:[.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[min-height:1.625rem] [@media_(max-width:_720px)]:[.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[padding:.3rem_.6rem] [@media_(max-width:_720px)]:[.admin-route-content_:where(&).crud-status,_.admin-route-content_.crud-row_em:where(&).published,_.admin-route-content_.crud-row_em:where(&).draft,_.admin-route-content_:where(&).admin-status-badge,_.admin-route-content_:where(&).stock-pill]:[font-size:.75rem]"]),
  "rde-compact-badge": utilities([1045, "[:where(&).rde-compact-badge]:inline-flex [:where(&).rde-compact-badge]:[padding:3px_10px] [:where(&).rde-compact-badge]:[background:#ecfdf5] [:where(&).rde-compact-badge]:[color:#059669] [:where(&).rde-compact-badge]:[font-size:10px] [:where(&).rde-compact-badge]:font-bold [:where(&).rde-compact-badge]:[border-radius:12px] [:where(&).rde-compact-badge]:whitespace-nowrap [:where(&).rde-compact-badge]:[flex-shrink:0]"]),
  "rde-compact-card": utilities([1041, "[:where(&).rde-compact-card]:[border:1px_solid_#dce5f0] [:where(&).rde-compact-card]:[border-radius:10px] [:where(&).rde-compact-card]:[padding:16px] [:where(&).rde-compact-card]:[background:linear-gradient(135deg,_#fafcff,_#f0f4fa)]"]),
  "rde-compact-top": utilities([1042, "[:where(&).rde-compact-top]:flex [:where(&).rde-compact-top]:items-start [:where(&).rde-compact-top]:justify-between [:where(&).rde-compact-top]:[gap:10px] [:where(&).rde-compact-top]:[margin-bottom:12px]"], [1043, "[:where(&).rde-compact-top_strong]:block [:where(&).rde-compact-top_strong]:[font-size:13px] [:where(&).rde-compact-top_strong]:[color:#102952]"], [1044, "[:where(&).rde-compact-top_small]:block [:where(&).rde-compact-top_small]:[font-size:10px] [:where(&).rde-compact-top_small]:[color:#64748b] [:where(&).rde-compact-top_small]:[margin-top:3px] [:where(&).rde-compact-top_small]:[line-height:1.5]"]),
  "rde-open-builder": utilities([1046, "[:where(&).rde-open-builder]:[width:100%] [:where(&).rde-open-builder]:justify-center [:where(&).rde-open-builder]:[gap:6px] [:where(&).rde-open-builder]:[font-size:13px]! [:where(&).rde-open-builder]:[padding:10px_16px]!"]),
  "rde-spin": utilities([1006, "[:where(&).rde-spin]:animate-[rdeSpin_0.8s_linear_infinite]"]),
  "required": utilities([2778, "[.product-detail-sections_:where(&).required]:[color:#ed1c24]"]),
  "rich-description-editor": utilities([924, "[:where(&).rich-description-editor]:grid [:where(&).rich-description-editor]:[gap:10px] [:where(&).rich-description-editor]:[border:1px_solid_#dce5f0] [:where(&).rich-description-editor]:[border-radius:8px] [:where(&).rich-description-editor]:[padding:12px] [:where(&).rich-description-editor]:[background:linear-gradient(145deg,_#fbfdff,_#f5f8fc)]"]),
  "row": utilities([3622, "[.invoice-export_.card_:where(&).row]:flex [.invoice-export_.card_:where(&).row]:justify-between [.invoice-export_.card_:where(&).row]:[gap:12px]"], [3623, "[.invoice-export_.card_:where(&).row_b]:capitalize"]),
  "selected": utilities([417, "[.gallery-thumbs_button:where(&).selected]:[border-color:var(--red)]"]),
  "similar-products-editor": utilities([1985, "[:where(&).similar-products-editor_h3,_:where(&).product-accessories-editor_h3]:[margin-bottom:4px]"]),
  "summary": utilities([3627, "[.invoice-export_:where(&).summary]:[margin:24px_0_0_auto] [.invoice-export_:where(&).summary]:[width:min(360px,100%)]"], [3628, "[.invoice-export_:where(&).summary_p]:flex [.invoice-export_:where(&).summary_p]:justify-between [.invoice-export_:where(&).summary_p]:[border-bottom:1px_solid_#edf1f6] [.invoice-export_:where(&).summary_p]:[padding:9px_0] [.invoice-export_:where(&).summary_p]:[margin:0]"]),
  "text-button": utilities([1609, "[:where(&).text-button]:[border:0] [:where(&).text-button]:[background:transparent] [:where(&).text-button]:[color:#c81f2a] [:where(&).text-button]:cursor-pointer [:where(&).text-button]:[text-decoration:underline]"], [1984, "[.admin-spec-items_:where(&).text-button]:[margin-top:4px] [.admin-spec-items_:where(&).text-button]:[font-size:12px]"]),
  "top": utilities([3663, "[.invoice-admin_:where(&).top]:flex [.invoice-admin_:where(&).top]:justify-between [.invoice-admin_:where(&).top]:items-start [.invoice-admin_:where(&).top]:[border-bottom:1px_solid_#a9c5ea] [.invoice-admin_:where(&).top]:[padding-bottom:16px]"]),
};
const tw = (value: string | undefined | null | false) => resolveClasses(value, componentUtilities);


function CustomSelect({ options, value, onChange, placeholder, disabled, minWidth }: { options: {value: string, label: string}[], value: string, onChange: (v: string) => void, placeholder: string, disabled?: boolean, minWidth?: number }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => String(o.value) === String(value));
  return (
    <div {...withTailwindStyle(tw(undefined), { position: "relative", fontWeight: 400, minWidth })}>
      <div 
        onClick={() => !disabled && setOpen(!open)}
        {...withTailwindStyle(tw(undefined), { border: "1px solid #dce2eb", borderRadius: 6, padding: "11px 12px", background: disabled ? "#f9f9f9" : "#fff", cursor: disabled ? "not-allowed" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: disabled ? 0.6 : 1 })}
      >
        <span>{selected ? selected.label : placeholder}</span>
        <span className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[font-size:10px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-left:8px]"])}>▼</span>
      </div>
      {open && !disabled && (
        <>
          <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:fixed [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[inset:0] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[z-index:99]"])} onClick={() => setOpen(false)} />
          <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:absolute [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[top:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[left:0] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[right:0] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-top:4px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[background:#fff] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border:1px_solid_#dce2eb] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-radius:6px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[box-shadow:0_4px_12px_rgba(0,0,0,0.1)] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[z-index:100] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[max-height:250px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:overflow-y-auto"])}>
            <div 
              onClick={() => { onChange(""); setOpen(false); }}
              className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[padding:10px_12px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:cursor-pointer [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-bottom:1px_solid_#f0f0f0] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[color:#6d7890]"])}
            >
              {placeholder}
            </div>
            {options.map(o => (
              <div 
                key={String(o.value)} 
                onClick={() => { onChange(o.value); setOpen(false); }}
                {...withTailwindStyle(tw(undefined), { padding: "10px 12px", cursor: "pointer", background: String(value) === String(o.value) ? "#f4f7fb" : "transparent" })}
                onMouseEnter={e => (e.currentTarget.style.background = "#f4f7fb")}
                onMouseLeave={e => (e.currentTarget.style.background = String(value) === String(o.value) ? "#f4f7fb" : "transparent")}
              >
                {o.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

type ProductStatus = "published" | "draft" | "archived";
type HomePlacement = { section: string; sortOrder: number; isActive: boolean };
type FaqItem = { question: string; answer: string; sortOrder: number };
type SpecItem = { label: string; value: string; sortOrder: number };
type SpecTab = { tabName: string; sortOrder: number; items: SpecItem[] };
type AccessoryItem = { name: string; image: string; images: string[]; price: number; oldPrice: number; linkedSlug: string; sortOrder: number; descriptionHtml?: string; descriptionCss?: string; };
type AdminProduct = {
  id: string; name: string; color: string; slug: string; brand: string; category: string; subcategory: string; sku: string; price: number; oldPrice: number; stock: number; reorderLevel: number; unitCost: number; warehouse: string; supplier: string;
  images: string[]; image: string; galleryVideos: string[]; status: ProductStatus; badge: string; youtubeUrl: string; description: string; descriptionHtml: string; descriptionCss: string; sizeMeasurementHtml: string; preorderEnabled: boolean; preorderDepositPercent: number; preorderNote: string;
  keyFeatures: string[]; isNewArrival: boolean; isPopular: boolean; isActive: boolean; isDjiDrone: boolean; isProfessionalDrone: boolean; isEnterpriseAgriculture: boolean; isEnterprise: boolean; homePlacements: HomePlacement[]; faqs: FaqItem[];
  specificationTabs: SpecTab[];
  similarProducts: string[];
  comboProducts: string[];
  accessories: AccessoryItem[];
  accessoriesCss: string;
  linkedAccessories: string[];
};
type ProductForm = Omit<AdminProduct, "id" | "keyFeatures" | "homePlacements"> & {
  keyFeaturesText: string;
  colourDrafts: ColourDraft[];
  homePlacements: HomePlacement[];
};

const starterProduct: AdminProduct = {
  id: "demo-mini-5", name: "DJI Mini 5 Pro Fly More Combo Plus with RC2", slug: "dji-mini-5-pro-fly-more-combo-plus-rc2", brand: "DJI", category: "Camera Drone", subcategory: "", sku: "DB-MINI5", price: 117000, oldPrice: 140000, stock: 12, reorderLevel: 5, unitCost: 95000, warehouse: "Dhaka Main Warehouse", supplier: "",
  images: ["/images/products/mini-5.jpg"], image: "/images/products/mini-5.jpg", galleryVideos: [], status: "published", badge: "HOT", youtubeUrl: "", description: "A powerful ultra-light drone for creators.", descriptionHtml: starterHtml, descriptionCss: starterCss, sizeMeasurementHtml: "", preorderEnabled: true, preorderDepositPercent: 30, preorderNote: "Reserve this product before the next shipment arrives.",
  keyFeatures: ["Official product"], isNewArrival: true, isPopular: true, isActive: true, isDjiDrone: false, isProfessionalDrone: false, isEnterpriseAgriculture: false, isEnterprise: false, homePlacements: [], faqs: [],
  specificationTabs: [], similarProducts: [], comboProducts: [], accessories: [],
  accessoriesCss: "", linkedAccessories: [], color: "",
};
const blank: ProductForm = {
  name: "", slug: "", brand: "DJI", category: "", subcategory: "", sku: "", price: 0, oldPrice: 0, stock: 0, reorderLevel: 5, unitCost: 0, warehouse: "Dhaka Main Warehouse", supplier: "",
  images: [], image: "", galleryVideos: [], status: "published", badge: "", youtubeUrl: "", description: "", descriptionHtml: "", descriptionCss: starterCss, sizeMeasurementHtml: "", preorderEnabled: true, preorderDepositPercent: 30, preorderNote: "Reserve this product before the next shipment arrives.",
  keyFeaturesText: "", colourDrafts: [], isNewArrival: false, isPopular: false, isActive: true, isDjiDrone: false, isProfessionalDrone: false, isEnterpriseAgriculture: false, isEnterprise: false, homePlacements: [], faqs: [],
  specificationTabs: [], similarProducts: [], comboProducts: [], accessories: [],
  accessoriesCss: "", linkedAccessories: [], color: "",
};
const productKey = "drone-admin-products";
const DRAFT_KEY = "drone-product-draft";

type CatOption = { slug: string; name: string };

function normalizeProduct(value: Partial<AdminProduct> & { _id?: string; shortDescription?: string }, index = 0): AdminProduct {
  const images = Array.isArray(value.images) ? value.images.filter(Boolean) : value.image ? [value.image] : [];
  const homePlacements = Array.isArray(value.homePlacements) ? value.homePlacements.filter((item): item is HomePlacement => Boolean(item && typeof item === "object" && String((item as HomePlacement).section || "").trim())).map((item) => ({ section: String(item.section).trim().toLowerCase(), sortOrder: Number(item.sortOrder || 0), isActive: item.isActive !== false })) : [];
  const faqs: FaqItem[] = Array.isArray(value.faqs) ? value.faqs.filter((item): item is FaqItem => Boolean(item && typeof item === "object" && String((item as FaqItem).question || "").trim())).map((item, i) => ({ question: String(item.question).trim(), answer: String(item.answer || "").trim(), sortOrder: Number(item.sortOrder ?? i) })) : [];
  const similarProducts: string[] = Array.isArray(value.similarProducts) ? value.similarProducts.filter((s): s is string => typeof s === "string" && Boolean(s.trim())) : [];
  const comboProducts: string[] = Array.isArray(value.comboProducts) ? value.comboProducts.filter((s): s is string => typeof s === "string" && Boolean(s.trim())) : [];
  const linkedAccessories: string[] = Array.isArray(value.linkedAccessories) ? value.linkedAccessories.filter((s): s is string => typeof s === "string" && Boolean(s.trim())) : [];
  const accessories: AccessoryItem[] = Array.isArray(value.accessories)
    ? (value.accessories as AccessoryItem[]).filter((a) => Boolean(a && typeof a === "object" && a.name)).map((a, i) => {
        const images = Array.isArray(a.images) ? a.images.filter(Boolean) : a.image ? [a.image] : [];
        return {
          name: String(a.name || "").trim(),
          image: String(a.image || images[0] || ""),
          images,
          price: Number(a.price || 0),
          oldPrice: Number(a.oldPrice || 0),
          linkedSlug: String(a.linkedSlug || ""),
          descriptionHtml: String(a.descriptionHtml || ""),
          descriptionCss: String(a.descriptionCss || ""),
          sortOrder: Number(a.sortOrder ?? i),
        };
      })
    : [];
  const specificationTabs: SpecTab[] = Array.isArray(value.specificationTabs)
    ? (value.specificationTabs as SpecTab[]).filter((t) => Boolean(t && typeof t === "object" && String(t.tabName || "").trim())).map((t, ti) => ({
        tabName: String(t.tabName).trim(),
        sortOrder: Number(t.sortOrder ?? ti),
        items: Array.isArray(t.items) ? t.items.filter((it) => Boolean(it && String(it.label || "").trim())).map((it, ii) => ({ label: String(it.label).trim(), value: String(it.value || "").trim(), sortOrder: Number(it.sortOrder ?? ii) })) : [],
      }))
    : [];
  return {
    ...starterProduct, ...value,
    id: value.id || value._id || `managed-${index}`, images, image: value.image || images[0] || "", galleryVideos: Array.isArray(value.galleryVideos) ? value.galleryVideos.filter(Boolean) : [],
    color: String(value.color || "").trim(),
    brand: value.brand || "DJI", category: value.category || "", subcategory: value.subcategory || "", sku: value.sku || "",
    description: value.description || value.shortDescription || "", price: Number(value.price || 0), oldPrice: Number(value.oldPrice || value.price || 0), stock: Number(value.stock || 0),
    reorderLevel: Number(value.reorderLevel || 5), unitCost: Number(value.unitCost || 0), warehouse: value.warehouse || "Dhaka Main Warehouse", supplier: value.supplier || "",
    descriptionHtml: value.descriptionHtml || (value.description ? `<p>${value.description}</p>` : starterHtml), descriptionCss: value.descriptionCss || starterCss,
    sizeMeasurementHtml: String(value.sizeMeasurementHtml || ""),
    accessoriesCss: value.accessoriesCss || "",
    preorderEnabled: value.preorderEnabled !== false, preorderDepositPercent: Number(value.preorderDepositPercent || 30), preorderNote: value.preorderNote || starterProduct.preorderNote,
    keyFeatures: Array.isArray(value.keyFeatures) ? value.keyFeatures.map(String) : [],
    isNewArrival: Boolean(value.isNewArrival), isPopular: Boolean(value.isPopular), isActive: value.isActive !== false,
    isDjiDrone: Boolean(value.isDjiDrone), isProfessionalDrone: Boolean(value.isProfessionalDrone), isEnterpriseAgriculture: Boolean(value.isEnterpriseAgriculture), isEnterprise: Boolean(value.isEnterprise),
    status: (value.status as ProductStatus) || "published", badge: value.badge || "", youtubeUrl: value.youtubeUrl || "", homePlacements, faqs, specificationTabs, similarProducts, comboProducts, linkedAccessories, accessories,
  };
}

function toForm(product: AdminProduct): ProductForm {
  return { ...product, keyFeaturesText: product.keyFeatures.join("\n"), homePlacements: product.homePlacements.map(item => ({ ...item })), faqs: product.faqs.map(item => ({ ...item })), specificationTabs: (product.specificationTabs || []).map(t => ({ ...t, items: t.items.map(it => ({ ...it })) })), similarProducts: [...(product.similarProducts || [])], comboProducts: [...(product.comboProducts || [])], linkedAccessories: [...(product.linkedAccessories || [])], accessories: [...(product.accessories || [])], colourDrafts: [] };
}

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

export default function AdminProducts() {
  const [pageLoading, setPageLoading] = useState(true);
  const { confirm } = useAdminDialog();
  const [cropQueue, setCropQueue] = useState<Array<{ name: string; source: string; colourId?: string }>>([]);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [uploadingColourId, setUploadingColourId] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const importRef = useRef<HTMLInputElement | null>(null);
  const cropUploadLockRef = useRef(false);

  const currentCropImage = cropQueue[0] || null;

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [form, setForm] = useState<ProductForm>(blank);
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // DB-driven category/subcategory state
  const [catOptions, setCatOptions] = useState<CatOption[]>([]);
  const [subOptions, setSubOptions] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>(["DJI", "DJI Enterprise"]);

  // Similar products autocomplete
  const [simQuery, setSimQuery] = useState("");
  const [simSuggestions, setSimSuggestions] = useState<AdminProduct[]>([]);
  const simRef = useRef<HTMLInputElement | null>(null);
  const [comboQuery, setComboQuery] = useState("");
  const [comboSuggestions, setComboSuggestions] = useState<AdminProduct[]>([]);
  const [allAccessories, setAllAccessories] = useState<any[]>([]);
  const [linkAccQuery, setLinkAccQuery] = useState("");
  const [linkAccSuggestions, setLinkAccSuggestions] = useState<any[]>([]);
  const comboRef = useRef<HTMLInputElement | null>(null);
  const linkAccRef = useRef<HTMLInputElement | null>(null);

  const [loadingAccessoryImage, setLoadingAccessoryImage] = useState<number | null>(null);

  // Local-only ID for newly drafted products
  const draftId = useMemo(() => "draft_" + Math.random().toString(36).slice(2, 9), []);

  // Load products + categories + brands + accessories on mount
  useEffect(() => {
    const load = async () => {
      try {
        if (getApiBase()) {
          const [p, c, b, a] = await Promise.all([
            apiRequest<{ data?: unknown }>("/admin/products?limit=100"),
            apiRequest<{ data?: unknown[] }>("/admin/categories").catch(() => ({ data: [] as unknown[] })),
            apiRequest<{ data?: Array<{ name?: string; title?: string }> }>("/admin/brands").catch(() => ({ data: [] })),
            apiRequest<{ data?: unknown[] }>("/admin/accessories?limit=500").catch(() => ({ data: [] })),
          ]);
          if (Array.isArray(p.data)) setProducts(p.data.map((item, index) => normalizeProduct(item as Partial<AdminProduct> & { _id?: string }, index)));
          if (Array.isArray(a.data)) setAllAccessories(a.data);
          const cats = ((c.data || []) as Array<Record<string, unknown>>).map(x => ({ slug: String(x.slug || x.name || ""), name: String(x.name || x.title || "") })).filter(c => c.slug && c.name);
          if (cats.length) setCatOptions(cats);
          const bs = (b.data || []).map(x => x.title || x.name).filter(Boolean) as string[];
          if (bs.length) setBrands([...new Set(["DJI", "DJI Enterprise", ...bs])]);
          return;
        }
        const stored = localStorage.getItem(productKey);
        if (stored) setProducts((JSON.parse(stored) as Partial<AdminProduct>[]).map(normalizeProduct));
      } catch (e) { toast.error(e instanceof Error ? e.message : "Unable to load products"); } finally { setPageLoading(false); }
    };
    void load();
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (!form.category) { setSubOptions([]); return; }
    void (async () => {
      if (getApiBase()) {
        try {
          const res = await apiRequest<{ data?: unknown[] }>(`/admin/subcategories?category=${encodeURIComponent(form.category)}&names=1`);
          setSubOptions((res.data || []) as string[]);
        } catch { setSubOptions([]); }
      }
    })();
  }, [form.category]);

  // URL ?new=1 triggers new product form
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setEditing(null); setForm(blank); localStorage.removeItem(DRAFT_KEY);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchParams]);

  // Restore draft
  const draftInit = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.form && (d.editing || d.form.name)) {
          setForm({ ...blank, ...d.form, color: String(d.form.color || ""), colourDrafts: Array.isArray(d.form.colourDrafts) ? d.form.colourDrafts.map((draft: ColourDraft) => ({ id: draft.id || crypto.randomUUID(), color: String(draft.color || ""), images: Array.isArray(draft.images) ? draft.images.filter(url => typeof url === "string") : [], stock: Number(draft.stock || 0) })) : [], linkedAccessories: Array.isArray(d.form.linkedAccessories) ? d.form.linkedAccessories : [], comboProducts: Array.isArray(d.form.comboProducts) ? d.form.comboProducts : [], accessories: Array.isArray(d.form.accessories) ? d.form.accessories : [], similarProducts: Array.isArray(d.form.similarProducts) ? d.form.similarProducts : [], specificationTabs: Array.isArray(d.form.specificationTabs) ? d.form.specificationTabs : [] });
          setEditing(d.editing || null);
        }
      }
    } catch { /* ignore */ }
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (!draftInit.current) { draftInit.current = true; return; }
    if (editing || form.name) { localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, editing })); } else { localStorage.removeItem(DRAFT_KEY); }
  }, [form, editing]);

  const visible = useMemo(() => products.filter(p =>
    `${p.name} ${p.category} ${p.brand} ${p.sku} ${p.slug}`.toLowerCase().includes(search.toLowerCase()) &&
    (!categoryFilter || p.category === categoryFilter) &&
    (!brandFilter || p.brand === brandFilter) &&
    (!statusFilter || p.status === statusFilter)
  ), [products, search, categoryFilter, brandFilter, statusFilter]);

  // Similar products autocomplete: filter from loaded products
  useEffect(() => {
    const q = simQuery.trim().toLowerCase();
    if (!q) { setSimSuggestions([]); return; }
    const already = new Set(form.similarProducts);
    const matches = products.filter(p =>
      p.slug !== form.slug &&
      !already.has(p.slug) &&
      (`${p.name} ${p.slug} ${p.brand} ${p.category}`).toLowerCase().includes(q)
    ).slice(0, 8);
    setSimSuggestions(matches);
  }, [simQuery, products, form.similarProducts, form.slug]);

  useEffect(() => {
    const q = comboQuery.trim().toLowerCase();
    if (!q) { setComboSuggestions([]); return; }
    const already = new Set(form.comboProducts);
    const matches = products.filter(p =>
      p.slug !== form.slug &&
      !already.has(p.slug) &&
      (`${p.name} ${p.color} ${p.slug} ${p.brand} ${p.category}`).toLowerCase().includes(q)
    ).slice(0, 8);
    setComboSuggestions(matches);
  }, [comboQuery, products, form.comboProducts, form.slug]);

  // Fetch accessories autocomplete for Linked Accessories
  useEffect(() => {
    const q = linkAccQuery.trim().toLowerCase();
    if (q.length < 1) {
      setLinkAccSuggestions([]);
      return;
    }
    const already = new Set(form.linkedAccessories);
    const matches = allAccessories.filter(a => {
      if (already.has(a.slug)) return false;
      // Must match product's category
      if (form.category) {
        if (a.category !== form.category && !(a.categories && a.categories.includes(form.category))) {
          return false;
        }
      }
      // Must match product's subcategory
      if (form.subcategory) {
        if (a.subcategory !== form.subcategory && !(a.subcategories && a.subcategories.includes(form.subcategory))) {
          return false;
        }
      }
      // Must match query if typed
      if (q && !`${a.name} ${a.sku}`.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    }).slice(0, 8);
    setLinkAccSuggestions(matches);
  }, [linkAccQuery, allAccessories, form.linkedAccessories, form.category, form.subcategory]);

  function persist(next: AdminProduct[]) { setProducts(next); localStorage.setItem(productKey, JSON.stringify(next)); window.dispatchEvent(new Event("drone-products-updated")); }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingProduct || cropQueue.length || uploadingImage || uploadingVideo) return;
    let savedProduct: AdminProduct | null = null;
    setSavingProduct(true);
    try {
    const colours = prepareColourSave({ color: form.color, images: form.images.length ? form.images : (form.image ? [form.image] : []), stock: form.stock }, form.colourDrafts);
    const pendingDrafts = colours.remainingDraftIndices.map(index => form.colourDrafts[index]);
    const previousLinks = products.find(product => product.id === editing)?.comboProducts || [];
    const syncColourGroup = Boolean(colours.variants.length || form.comboProducts.length || previousLinks.length);
    const payload = {
      name: form.name, slug: form.slug || slugify(form.name), brand: form.brand, category: form.category, subcategory: form.subcategory || undefined,
      sku: form.sku, color: colours.primary.color, price: form.price, oldPrice: form.oldPrice || form.price, stock: colours.primary.stock,
      preorderEnabled: form.preorderEnabled, preorderDepositPercent: form.preorderDepositPercent, preorderNote: form.preorderNote,
      reorderLevel: form.reorderLevel, unitCost: form.unitCost, warehouse: form.warehouse, supplier: form.supplier,
      images: colours.primary.images,
      galleryVideos: form.galleryVideos,
      youtubeUrl: form.youtubeUrl,
      shortDescription: form.description, descriptionHtml: form.descriptionHtml, descriptionCss: form.descriptionCss, sizeMeasurementHtml: form.sizeMeasurementHtml,
      keyFeatures: form.keyFeaturesText.split("\n").map(x => x.trim()).filter(Boolean),
      badge: form.badge, status: form.status,
      isNewArrival: form.isNewArrival, isPopular: form.isPopular, isActive: form.isActive,
      isDjiDrone: form.isDjiDrone, isProfessionalDrone: form.isProfessionalDrone, isEnterpriseAgriculture: form.isEnterpriseAgriculture, isEnterprise: form.isEnterprise,
      homePlacements: form.homePlacements,
      faqs: form.faqs.map((item, i) => ({ ...item, sortOrder: i })),
      specificationTabs: form.specificationTabs.map((tab, ti) => ({ tabName: tab.tabName, sortOrder: ti, items: tab.items.map((it, ii) => ({ label: it.label, value: it.value, sortOrder: ii })) })),
      similarProducts: form.similarProducts,
      comboProducts: editing && syncColourGroup ? undefined : form.comboProducts,
      linkedAccessories: form.linkedAccessories,
      accessories: form.accessories.map((a, i) => ({ name: a.name, image: a.image, images: a.images, price: a.price, oldPrice: a.oldPrice, linkedSlug: a.linkedSlug, descriptionHtml: a.descriptionHtml, descriptionCss: a.descriptionCss, sortOrder: i })),
    };
      if (getApiBase()) {
        const response = await apiRequest<{ data?: unknown }>(editing ? `/admin/products/${editing}` : "/admin/products", { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) });
        savedProduct = normalizeProduct(response.data as Partial<AdminProduct> & { _id?: string }, products.length);
        const base = savedProduct;
        setEditing(base.id);
        setForm(current => ({ ...current, slug: base.slug, color: base.color, images: base.images, image: base.image, stock: base.stock, comboProducts: [...base.comboProducts], colourDrafts: pendingDrafts }));
        setProducts(current => [base, ...current.filter(item => item.id !== base.id)]);
        if (syncColourGroup) {
          const result = await apiRequest<{ data: { product: Partial<AdminProduct> & { _id?: string }; variants: Array<Partial<AdminProduct> & { _id?: string }> } }>(`/admin/products/${base.id}/colours`, { method: "POST", body: JSON.stringify({ variants: colours.variants, comboProducts: form.comboProducts }) });
          savedProduct = normalizeProduct(result.data.product);
          const savedColours = [savedProduct, ...result.data.variants.map((variant, index) => normalizeProduct(variant, index))];
          const group = [savedProduct.slug, ...savedProduct.comboProducts];
          const oldGroup = [base.slug, ...base.comboProducts];
          setProducts(current => [...savedColours, ...current.filter(item => !savedColours.some(saved => saved.id === item.id)).map(item => group.includes(item.slug) ? { ...item, comboProducts: group.filter(slug => slug !== item.slug) } : oldGroup.includes(item.slug) ? { ...item, comboProducts: item.comboProducts.filter(slug => !oldGroup.includes(slug)) } : item)]);
        }
      } else {
        const base = normalizeProduct({ ...payload, comboProducts: form.comboProducts, id: editing || crypto.randomUUID(), accessories: form.accessories }, products.length);
        const variants = colours.variants.map((colour, index) => normalizeProduct({ ...base, ...colour, id: crypto.randomUUID(), name: `${base.name} — ${colour.color}`, slug: `${base.slug}-${slugify(colour.color) || "colour"}-${crypto.randomUUID().slice(0, 8)}`, sku: base.sku ? `${base.sku}-C${index + 1}-${crypto.randomUUID().slice(0, 4)}` : "", image: colour.images[0] }, index));
        const group = [...new Set([base.slug, ...form.comboProducts, ...variants.map(variant => variant.slug)])];
        const grouped = [base, ...variants].map(product => ({ ...product, comboProducts: group.filter(slug => slug !== product.slug) }));
        const oldGroup = [base.slug, ...previousLinks];
        const current = products.filter(product => product.id !== base.id).map(product => group.includes(product.slug) ? { ...product, comboProducts: group.filter(slug => slug !== product.slug) } : oldGroup.includes(product.slug) ? { ...product, comboProducts: product.comboProducts.filter(slug => !oldGroup.includes(slug)) } : product);
        persist([...grouped, ...current]);
      }
      toast.success(editing ? "Product and colours updated" : "Product and colours created");
      setEditing(null); setForm(blank); localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      if (savedProduct && getApiBase()) {
        const savedId = savedProduct.id;
        try {
          const latest = await apiRequest<{ data?: unknown }>(`/admin/products/${savedId}`);
          const refreshed = normalizeProduct(latest.data as Partial<AdminProduct> & { _id?: string });
          setForm(current => ({ ...current, comboProducts: refreshed.comboProducts }));
          setProducts(current => [refreshed, ...current.filter(item => item.id !== refreshed.id)]);
        } catch { /* Keep the saved product id and unfinished colour drafts for retry. */ }
      }
      toast.error(e instanceof Error ? e.message : "Unable to save product and colours");
    } finally { setSavingProduct(false); }
  }

  function edit(product: AdminProduct) { setForm(toForm(product)); setEditing(product.id); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function remove(id: string) {
    if (!(await confirm("Delete this product?"))) return;
    try {
      if (getApiBase()) await apiRequest(`/admin/products/${id}`, { method: "DELETE" });
      const next = products.filter(p => p.id !== id);
      if (getApiBase()) setProducts(next); else persist(next);
      toast.success("Product deleted");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Unable to delete product"); }
  }

  async function readImage(file?: File, colourId?: string) {
    if (!file) return false;
    const previewUrl = URL.createObjectURL(file);
    setUploadingImage(previewUrl);
    setUploadingColourId(colourId || null);
    try {
      let url = "";
      if (getApiBase()) {
        const data = new FormData(); data.append("file", file);
        const response = await apiFormRequest<{ data?: { url?: string } }>("/admin/media?folder=products", data);
        url = response.data?.url || "";
      } else {
        url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
      }
      if (!url) throw new Error("The image upload did not return a photo URL.");
      setForm(current => colourId
        ? { ...current, colourDrafts: current.colourDrafts.map(draft => draft.id === colourId ? { ...draft, images: [...draft.images, url] } : draft) }
        : { ...current, images: [...current.images, url], image: current.image || url });
      return true;
    } catch (e) { toast.error(e instanceof Error ? e.message : "Image upload failed"); return false; } finally {
      setUploadingImage(null);
      setUploadingColourId(null);
      URL.revokeObjectURL(previewUrl);
    }
  }

  function queueProductImages(files: FileList | null) {
    const selectedImages = Array.from(files || []).filter(file => file.type.startsWith("image/"));
    if (selectedImages.length === 0) return;
    setCropQueue(current => [
      ...current,
      ...selectedImages.map(file => ({ name: file.name, source: URL.createObjectURL(file) })),
    ]);
  }

  function addColour() {
    if (form.colourDrafts.length >= 20) { toast.error("Add up to 20 colours at a time."); return; }
    setForm(current => ({ ...current, colourDrafts: [...current.colourDrafts, { id: crypto.randomUUID(), color: "", images: [], stock: current.stock }] }));
  }

  function uploadColours(files: FileList | null) {
    const selected = Array.from(files || []).filter(file => file.type.startsWith("image/"));
    if (!selected.length) return;
    if (selected.length + form.colourDrafts.length > 20) { toast.error("Add up to 20 colours at a time."); return; }
    const drafts = selected.map(() => ({ id: crypto.randomUUID(), color: "", images: [] as string[], stock: form.stock }));
    setForm(current => ({ ...current, colourDrafts: [...current.colourDrafts, ...drafts] }));
    setCropQueue(current => [...current, ...selected.map((file, index) => ({ name: file.name, source: URL.createObjectURL(file), colourId: drafts[index].id }))]);
  }

  function uploadColourImages(id: string, files: FileList | null) {
    const selected = Array.from(files || []).filter(file => file.type.startsWith("image/"));
    const draft = form.colourDrafts.find(colour => colour.id === id);
    if (!draft || !selected.length) return;
    if (draft.images.length + selected.length > 20) { toast.error("Upload up to 20 photos per colour."); return; }
    setCropQueue(current => [...current, ...selected.map(file => ({ name: file.name, source: URL.createObjectURL(file), colourId: id }))]);
  }

  function advanceCropQueue() {
    setCropQueue(current => {
      const [completed, ...remaining] = current;
      if (completed) URL.revokeObjectURL(completed.source);
      return remaining;
    });
  }

  async function uploadCurrentCrop(blob: Blob) {
    if (!currentCropImage || cropUploadLockRef.current) return;
    cropUploadLockRef.current = true;
    try {
      const extension = blob.type === "image/png" ? "png" : "jpg";
      const originalBaseName = currentCropImage.name.replace(/\.[^.]+$/, "") || "product-image";
      const file = new File([blob], `${originalBaseName}.${extension}`, { type: blob.type });
      if (await readImage(file, currentCropImage.colourId)) advanceCropQueue();
    } finally {
      cropUploadLockRef.current = false;
    }
  }

  async function uploadVideo(file?: File) {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setUploadingVideo(previewUrl);
    try {
      let url = "";
      if (getApiBase()) {
        const data = new FormData(); data.append("file", file);
        const response = await apiFormRequest<{ data?: { url?: string } }>("/admin/media?folder=products", data);
        url = response.data?.url || "";
      } else {
        url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
      }
      if (url) {
        setForm(curr => {
          if (curr.galleryVideos.includes(url)) return curr;
          return { ...curr, galleryVideos: [...curr.galleryVideos, url] };
        });
      }
      setUploadingVideo(current => current === previewUrl ? null : current);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Video upload failed");
      setUploadingVideo(current => current === previewUrl ? null : current);
    }
  }

  async function uploadAccessoryImage(index: number, file?: File) {
    if (!file) return;
    setLoadingAccessoryImage(index);
    try {
      let url = "";
      if (getApiBase()) {
        const data = new FormData(); data.append("file", file);
        // Using accessories folder to keep it organized
        const response = await apiFormRequest<{ data?: { url?: string } }>("/admin/media?folder=accessories", data);
        url = response.data?.url || "";
      } else {
        url = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(file); });
      }
      if (url) {
        setForm(current => {
          const accessories = [...current.accessories];
          const images = [...(accessories[index].images || [])];
          images.push(url);
          accessories[index] = { ...accessories[index], images, image: accessories[index].image || url };
          return { ...current, accessories };
        });
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : "Accessory image upload failed"); }
    setLoadingAccessoryImage(null);
  }

  function removeAccessoryImage(index: number, url: string) {
    setForm(current => {
       const accessories = [...current.accessories];
       const acc = accessories[index];
       const images = (acc.images || []).filter(u => u !== url);
       accessories[index] = { ...acc, images, image: acc.image === url ? (images[0] || "") : acc.image };
       return { ...current, accessories };
    });
  }

  function removeImage(url: string) { setForm(current => { const images = current.images.filter(x => x !== url); return { ...current, images, image: current.image === url ? (images[0] || "") : current.image }; }); }

  function exportCsv() {
    const headers = ["name", "slug", "brand", "category", "subcategory", "sku", "price", "oldPrice", "stock", "reorderLevel", "unitCost", "warehouse", "supplier", "status", "isNewArrival", "isPopular", "isActive", "isDjiDrone", "isProfessionalDrone", "isEnterpriseAgriculture", "isEnterprise"];
    const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const csv = [headers.join(","), ...products.map(p => headers.map(h => esc((p as unknown as Record<string, unknown>)[h])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `drone-bangladesh-products-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  async function importCsv(file?: File) {
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) throw new Error("CSV file has no product rows");
      const parse = (line: string) => { const out: string[] = []; let cur = "", quoted = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') { if (quoted && line[i + 1] === '"') { cur += '"'; i++; } else quoted = !quoted; } else if (ch === "," && !quoted) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out; };
      const headers = parse(lines[0]);
      let created = 0;
      for (const line of lines.slice(1)) {
        const values = parse(line);
        const row = Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""])) as Record<string, string>;
        if (!row.name) continue;
        const payload = { ...row, price: Number(row.price || 0), oldPrice: Number(row.oldPrice || 0), stock: Number(row.stock || 0), reorderLevel: Number(row.reorderLevel || 5), unitCost: Number(row.unitCost || 0), isNewArrival: row.isNewArrival === "true", isPopular: row.isPopular === "true", isActive: row.isActive !== "false", isDjiDrone: row.isDjiDrone === "true", isProfessionalDrone: row.isProfessionalDrone === "true", isEnterpriseAgriculture: row.isEnterpriseAgriculture === "true", isEnterprise: row.isEnterprise === "true", slug: row.slug || slugify(row.name), images: [] };
        if (getApiBase()) await apiRequest("/admin/products", { method: "POST", body: JSON.stringify(payload) });
        created++;
      }
      toast.success(`${created} products imported`);
      window.location.reload();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Import failed"); }
  }

  // Category options for filter (combine DB + product data)
  const allCategories = useMemo(() => {
    const fromProducts = [...new Set(products.map(p => p.category).filter(Boolean))];
    const fromDb = catOptions.map(c => c.name);
    return [...new Set([...fromDb, ...fromProducts])].sort();
  }, [products, catOptions]);

  if (pageLoading) return <div className={utilities("admin-page-spinner", [2904, "[:where(&).admin-page-spinner]:flex [:where(&).admin-page-spinner]:items-center [:where(&).admin-page-spinner]:justify-center [:where(&).admin-page-spinner]:[min-height:400px] [:where(&).admin-page-spinner]:[color:#6d7890]"])}><Loader2 size={40} className={utilities("rde-spin", [1006, "[:where(&).rde-spin]:animate-[rdeSpin_0.8s_linear_infinite]"])} /></div>;
  return (
    <section className={utilities("admin-crud admin-products-page", [161, "[:where(&).admin-crud]:[padding-top:4px]"])}>
      <div className={utilities("admin-crud-heading", [162, "[:where(&).admin-crud-heading]:flex [:where(&).admin-crud-heading]:[align-items:end] [:where(&).admin-crud-heading]:justify-between"], [163, "[:where(&).admin-crud-heading_h1]:[letter-spacing:-.04em] [:where(&).admin-crud-heading_h1]:[margin:6px_0]"], [580, "[@media_(max-width:_720px)]:[:where(&).admin-crud-heading]:[align-items:start] [@media_(max-width:_720px)]:[:where(&).admin-crud-heading]:flex-col [@media_(max-width:_720px)]:[:where(&).admin-crud-heading]:[gap:15px]"], [655, "[:where(&).admin-header_h1,_:where(&).admin-crud-heading_h1]:[font-size:34px]"], [656, "[:where(&).admin-header_span,_:where(&).admin-crud-heading_span]:[font-size:13px]"], [703, "[@media_(max-width:_720px)]:[:where(&).admin-header_h1,_:where(&).admin-crud-heading_h1]:[font-size:29px]"], [1530, "[@media_(max-width:_720px)]:[.admin-route-content_:where(&).admin-crud-heading]:[margin-bottom:15px]"], [3325, "[:is(:where(&).admin-crud-heading)]:[padding:4px_2px_0] [:is(:where(&).admin-crud-heading)]:[margin-bottom:20px]"], [3326, "[:is(:where(&).admin-crud-heading_h1)]:[color:#122b4d] [:is(:where(&).admin-crud-heading_h1)]:[font-size:clamp(25px,_2.2vw,_34px)] [:is(:where(&).admin-crud-heading_h1)]:[line-height:1.15]"], [3327, "[:where(&).admin-crud-heading_span]:block [:where(&).admin-crud-heading_span]:[max-width:720px] [:where(&).admin-crud-heading_span]:[color:#71829b] [:where(&).admin-crud-heading_span]:[font-size:12px] [:where(&).admin-crud-heading_span]:[line-height:1.55]"], [3356, "[@media_(max-width:_720px)]:[:is(:where(&).admin-crud-heading)]:[margin-bottom:15px]"], [3357, "[@media_(max-width:_720px)]:[:where(&).admin-crud-heading_h1]:[font-size:25px]"], [3358, "[@media_(max-width:_720px)]:[:where(&).admin-crud-heading_span]:[font-size:11px]"], [3373, "[.admin-route-content_:where(&).admin-crud-heading_h1]:[font-size:clamp(28px,_2.4vw,_38px)]"], [3374, "[.admin-route-content_:where(&).admin-crud-heading_span]:[font-size:14px]"], [3416, "[@media_(max-width:_720px)]:[.admin-route-content_:where(&).admin-crud-heading_h1]:[font-size:27px]"], [3422, "[.admin-route-content_:where(&).admin-crud-heading_span,_.admin-route-content_:where(&).crud-form_input,_.admin-route-content_:where(&).crud-form_select,_.admin-route-content_:where(&).crud-form_textarea,_.admin-route-content_:where(&).crud-product-name_strong,_.admin-route-content_:where(&).crud-row-copy_strong]:[font-size:1rem]"], [3426, "[.inventory-admin_:where(&).admin-crud-heading_span,_.preorders-admin_:where(&).admin-crud-heading_span]:[font-size:1rem]"])}>
        <div><p className={utilities("eyebrow", [55, "[:where(&).eyebrow]:[color:#2b65c7] [:where(&).eyebrow]:font-extrabold [:where(&).eyebrow]:[letter-spacing:.07em] [:where(&).eyebrow]:[margin:0_0_13px]"], [599, "[:is(:where(&).eyebrow)]:[font-size:12px]"], [779, "[.maintenance-hero_:where(&).eyebrow]:[color:#a7c8f3]"], [1848, "[.hero-slider_:where(&).eyebrow]:[color:#2866d7] [.hero-slider_:where(&).eyebrow]:[letter-spacing:.09em] [.hero-slider_:where(&).eyebrow]:font-extrabold [.hero-slider_:where(&).eyebrow]:[margin:0_0_20px]"], [1872, "[@media_(max-width:_560px)]:[.hero-slider_:where(&).eyebrow]:[font-size:11px] [@media_(max-width:_560px)]:[.hero-slider_:where(&).eyebrow]:[margin-bottom:12px]"], [2098, "[:is(.hero-slider_:where(&).eyebrow)]:[margin-bottom:13px] [:is(.hero-slider_:where(&).eyebrow)]:[font-size:13px]"], [2253, "[@media_(max-width:_640px)]:[.hero-slider_:where(&).eyebrow]:[font-size:9px] [@media_(max-width:_640px)]:[.hero-slider_:where(&).eyebrow]:[margin-bottom:7px]"], [2267, "[@media_(max-width:_720px)]:[:where(&).eyebrow]:[font-size:9px] [@media_(max-width:_720px)]:[:where(&).eyebrow]:[padding:6px_10px]"], [2568, "[.order-confirmation-modal_:where(&).eyebrow]:[margin:0_0_7px] [.order-confirmation-modal_:where(&).eyebrow]:[color:#e31f2b] [.order-confirmation-modal_:where(&).eyebrow]:[font-size:11px] [.order-confirmation-modal_:where(&).eyebrow]:font-extrabold [.order-confirmation-modal_:where(&).eyebrow]:[letter-spacing:.14em]"])}>CATALOG MANAGEMENT</p><h1>Products Management</h1><span>Manage product data, stock, gallery, features and storefront flags.</span></div>
        <div className={utilities("admin-heading-actions", [899, "[:where(&).admin-heading-actions]:flex [:where(&).admin-heading-actions]:items-center [:where(&).admin-heading-actions]:[gap:12px]"], [1532, "[@media_(max-width:_720px)]:[:where(&).admin-heading-actions]:[width:100%] [@media_(max-width:_720px)]:[:where(&).admin-heading-actions]:justify-between [@media_(max-width:_720px)]:[:where(&).admin-heading-actions]:items-stretch"])}>
          <button type="button" className={utilities("admin-inline-link", [900, "[:where(&).admin-inline-link]:inline-flex [:where(&).admin-inline-link]:items-center [:where(&).admin-inline-link]:justify-center [:where(&).admin-inline-link]:[gap:7px] [:where(&).admin-inline-link]:[border:1px_solid_#cddcf1] [:where(&).admin-inline-link]:[border-radius:7px] [:where(&).admin-inline-link]:[padding:10px_12px] [:where(&).admin-inline-link]:[color:#145fc2] [:where(&).admin-inline-link]:[background:#fff] [:where(&).admin-inline-link]:[font-size:11px] [:where(&).admin-inline-link]:font-extrabold"], [901, "[:where(&).admin-inline-link:hover]:[border-color:#80a9df] [:where(&).admin-inline-link:hover]:[background:#f6f9ff]"], [1533, "[@media_(max-width:_720px)]:[.admin-heading-actions_:where(&).admin-inline-link]:[flex:1]"])} onClick={exportCsv}><Download size={15}/> Export</button>
          <button type="button" className={utilities("admin-inline-link", [900, "[:where(&).admin-inline-link]:inline-flex [:where(&).admin-inline-link]:items-center [:where(&).admin-inline-link]:justify-center [:where(&).admin-inline-link]:[gap:7px] [:where(&).admin-inline-link]:[border:1px_solid_#cddcf1] [:where(&).admin-inline-link]:[border-radius:7px] [:where(&).admin-inline-link]:[padding:10px_12px] [:where(&).admin-inline-link]:[color:#145fc2] [:where(&).admin-inline-link]:[background:#fff] [:where(&).admin-inline-link]:[font-size:11px] [:where(&).admin-inline-link]:font-extrabold"], [901, "[:where(&).admin-inline-link:hover]:[border-color:#80a9df] [:where(&).admin-inline-link:hover]:[background:#f6f9ff]"], [1533, "[@media_(max-width:_720px)]:[.admin-heading-actions_:where(&).admin-inline-link]:[flex:1]"])} onClick={() => importRef.current?.click()}><Upload size={15}/> Import</button>
          <input ref={importRef} hidden type="file" accept=".csv,text/csv" onChange={e => void importCsv(e.target.files?.[0])}/>

          <div className={utilities("crud-summary", [164, "[:where(&).crud-summary]:[border:1px_solid_var(--line)] [:where(&).crud-summary]:[border-radius:8px] [:where(&).crud-summary]:[background:#fff] [:where(&).crud-summary]:[padding:16px_20px] [:where(&).crud-summary]:[min-width:140px]"], [165, "[:where(&).crud-summary_strong]:block [:where(&).crud-summary_strong]:[color:var(--red)] [:where(&).crud-summary_strong]:[font-size:28px]"], [166, "[:where(&).crud-summary_small]:[color:#718098] [:where(&).crud-summary_small]:[font-size:13px]"])}><strong>{products.length}</strong><small>Total products</small></div>
        </div>
      </div>
      

      <div className={utilities("admin-product-stat-grid", [902, "[:where(&).admin-product-stat-grid]:grid [:where(&).admin-product-stat-grid]:[grid-template-columns:repeat(4,_minmax(0,_1fr))] [:where(&).admin-product-stat-grid]:[gap:11px] [:where(&).admin-product-stat-grid]:[margin-bottom:17px]"], [903, "[:where(&).admin-product-stat-grid>div]:grid [:where(&).admin-product-stat-grid>div]:[gap:4px] [:where(&).admin-product-stat-grid>div]:[border:1px_solid_#e0e6ee] [:where(&).admin-product-stat-grid>div]:[border-radius:9px] [:where(&).admin-product-stat-grid>div]:[padding:14px_16px] [:where(&).admin-product-stat-grid>div]:[background:#fff] [:where(&).admin-product-stat-grid>div]:[box-shadow:0_6px_20px_rgba(18,_45,_77,_.035)]"], [904, "[:where(&).admin-product-stat-grid_strong]:[color:#142c50] [:where(&).admin-product-stat-grid_strong]:[font-size:22px]"], [905, "[:where(&).admin-product-stat-grid_span]:[color:#74839a] [:where(&).admin-product-stat-grid_span]:[font-size:10px] [:where(&).admin-product-stat-grid_span]:font-bold"], [1534, "[@media_(max-width:_720px)]:[:where(&).admin-product-stat-grid]:[grid-template-columns:repeat(2,_minmax(0,_1fr))]"], [1535, "[@media_(max-width:_720px)]:[:where(&).admin-product-stat-grid_strong]:[font-size:18px]"], [3386, "[.admin-route-content_:where(&).admin-product-stat-grid_strong]:[font-size:24px]"], [3387, "[.admin-route-content_:where(&).admin-product-stat-grid_span]:[font-size:12px]"])}>
        <div><strong>{products.length}</strong><span>Total products</span></div>
        <div><strong>{products.filter(x => x.status === "published").length}</strong><span>Published</span></div>
        <div><strong>{products.filter(x => x.stock < 10).length}</strong><span>Low stock</span></div>
        <div><strong>{products.filter(x => x.isNewArrival).length}</strong><span>New arrivals</span></div>
      </div>

      <div className={utilities("crud-grid", [168, "[:where(&).crud-grid]:grid [:where(&).crud-grid]:[align-items:start]"], [581, "[@media_(max-width:_720px)]:[:where(&).crud-grid]:[grid-template-columns:1fr]"], [3332, "[:is(:where(&).crud-grid)]:[grid-template-columns:minmax(300px,390px)_minmax(0,1fr)] [:is(:where(&).crud-grid)]:[gap:18px]"], [3360, "[@media_(max-width:_720px)]:[:is(:where(&).crud-grid)]:[gap:14px]"], [3400, "[.admin-products-page_:where(&).crud-grid]:[grid-template-columns:minmax(0,_340px)_minmax(0,_1fr)] [.admin-products-page_:where(&).crud-grid]:[align-items:start]"], [3401, "[.admin-products-page_:where(&).crud-grid_>_*,_.admin-products-page_:where(&).crud-list,_.admin-products-page_:where(&).product-editor-form]:[min-width:0] [.admin-products-page_:where(&).crud-grid_>_*,_.admin-products-page_:where(&).crud-list,_.admin-products-page_:where(&).product-editor-form]:[max-width:100%]"], [3415, "[@media_(max-width:_1250px)]:[.admin-products-page_:where(&).crud-grid]:[grid-template-columns:minmax(0,_1fr)]"])}>
        <form className={utilities("crud-form product-editor-form", [169, "[:where(&).crud-form]:[border:1px_solid_var(--line)] [:where(&).crud-form]:[border-radius:8px] [:where(&).crud-form]:grid [:where(&).crud-form]:[grid-template-columns:minmax(0,_1fr)] [:where(&).crud-form]:[background:#fff]"], [170, "[:where(&).crud-form_label]:grid"], [171, "[:where(&).crud-form_input,_:where(&).crud-form_select]:[width:100%] [:where(&).crud-form_input,_:where(&).crud-form_select]:[border:1px_solid_#dce2eb] [:where(&).crud-form_input,_:where(&).crud-form_select]:[border-radius:6px] [:where(&).crud-form_input,_:where(&).crud-form_select]:[outline:0] [:where(&).crud-form_input,_:where(&).crud-form_select]:[padding:11px_12px] [:where(&).crud-form_input,_:where(&).crud-form_select]:[color:var(--ink)] [:where(&).crud-form_input,_:where(&).crud-form_select]:[font-size:15px] [:where(&).crud-form_input,_:where(&).crud-form_select]:[background:#fff]"], [172, "[:where(&).crud-form_input[type='file']]:[padding:9px]"], [173, "[:where(&).crud-form_input:focus,_:where(&).crud-form_select:focus]:[border-color:#3f70ce]"], [919, "[:where(&).crud-form_textarea]:[width:100%] [:where(&).crud-form_textarea]:[resize:vertical] [:where(&).crud-form_textarea]:[border:1px_solid_#dce2eb] [:where(&).crud-form_textarea]:[border-radius:4px] [:where(&).crud-form_textarea]:[outline:0] [:where(&).crud-form_textarea]:[padding:9px] [:where(&).crud-form_textarea]:[color:var(--ink)] [:where(&).crud-form_textarea]:[font:inherit]"], [920, "[:is(:where(&).crud-form_textarea)]:[font-size:11px] [:is(:where(&).crud-form_textarea)]:[background:#fff] [:is(:where(&).crud-form_textarea)]:[line-height:1.5]"], [921, "[:where(&).crud-form_textarea:focus]:[border-color:#3f70ce]"], [3333, "[:where(&).crud-form,_:where(&).crud-list]:[border-color:#e1e8f2] [:where(&).crud-form,_:where(&).crud-list]:[border-radius:14px] [:where(&).crud-form,_:where(&).crud-list]:[box-shadow:0_7px_24px_rgba(19,52,94,.055)]"], [3334, "[:is(:where(&).crud-form)]:[gap:14px] [:is(:where(&).crud-form)]:[padding:20px]"], [3335, "[:is(:where(&).crud-form_label)]:[gap:6px] [:is(:where(&).crud-form_label)]:[color:#52657f] [:is(:where(&).crud-form_label)]:[font-size:11px] [:is(:where(&).crud-form_label)]:font-bold"], [3336, "[:where(&).crud-form_input,_:where(&).crud-form_select,_:where(&).crud-form_textarea]:[border-color:#dce5f0] [:where(&).crud-form_input,_:where(&).crud-form_select,_:where(&).crud-form_textarea]:[border-radius:8px] [:where(&).crud-form_input,_:where(&).crud-form_select,_:where(&).crud-form_textarea]:[padding:10px_11px] [:where(&).crud-form_input,_:where(&).crud-form_select,_:where(&).crud-form_textarea]:[color:#1b304e] [:where(&).crud-form_input,_:where(&).crud-form_select,_:where(&).crud-form_textarea]:[background:#fbfcfe] [:where(&).crud-form_input,_:where(&).crud-form_select,_:where(&).crud-form_textarea]:[font-size:12px] [:where(&).crud-form_input,_:where(&).crud-form_select,_:where(&).crud-form_textarea]:[transition:border-color_.15s,box-shadow_.15s,background_.15s]"], [3337, "[:where(&).crud-form_input:focus,_:where(&).crud-form_select:focus,_:where(&).crud-form_textarea:focus]:[border-color:#4d8cdf] [:where(&).crud-form_input:focus,_:where(&).crud-form_select:focus,_:where(&).crud-form_textarea:focus]:[background:#fff] [:where(&).crud-form_input:focus,_:where(&).crud-form_select:focus,_:where(&).crud-form_textarea:focus]:[box-shadow:0_0_0_3px_rgba(53,119,213,.11)]"], [3361, "[@media_(max-width:_720px)]:[:where(&).crud-form]:[padding:16px]"], [3376, "[.admin-route-content_:where(&).crud-form_label]:[font-size:13px]"], [3377, "[.admin-route-content_:where(&).crud-form_input,_.admin-route-content_:where(&).crud-form_select,_.admin-route-content_:where(&).crud-form_textarea]:[font-size:14px]"], [3401, "[.admin-products-page_:where(&).crud-grid_>_*,_.admin-products-page_:where(&).crud-list,_.admin-products-page_:where(&).product-editor-form]:[min-width:0] [.admin-products-page_:where(&).crud-grid_>_*,_.admin-products-page_:where(&).crud-list,_.admin-products-page_:where(&).product-editor-form]:[max-width:100%]"], [3422, "[.admin-route-content_:where(&).admin-crud-heading_span,_.admin-route-content_:where(&).crud-form_input,_.admin-route-content_:where(&).crud-form_select,_.admin-route-content_:where(&).crud-form_textarea,_.admin-route-content_:where(&).crud-product-name_strong,_.admin-route-content_:where(&).crud-row-copy_strong]:[font-size:1rem]"], [3423, "[@media_(max-width:_720px)]:[.admin-route-content_:where(&).crud-form_input,_.admin-route-content_:where(&).crud-form_select,_.admin-route-content_:where(&).crud-form_textarea]:[font-size:1rem]"])} onSubmit={submit}>
          <div className={utilities("admin-panel-heading", [310, "[:where(&).admin-panel-heading]:flex [:where(&).admin-panel-heading]:items-center [:where(&).admin-panel-heading]:justify-between"], [311, "[:where(&).admin-panel-heading_h2]:[margin:0]"], [312, "[:where(&).admin-panel-heading_select]:[border:1px_solid_var(--line)] [:where(&).admin-panel-heading_select]:[border-radius:6px] [:where(&).admin-panel-heading_select]:[padding:8px_12px] [:where(&).admin-panel-heading_select]:[font-size:14px] [:where(&).admin-panel-heading_select]:[color:#647189] [:where(&).admin-panel-heading_select]:[outline:0]"], [322, "[:where(&).admin-panel-heading>a]:[color:#1e61c6] [:where(&).admin-panel-heading>a]:[font-size:14px] [:where(&).admin-panel-heading>a]:font-semibold"], [3338, "[:is(:where(&).admin-panel-heading)]:[min-height:38px] [:is(:where(&).admin-panel-heading)]:[padding-bottom:12px] [:is(:where(&).admin-panel-heading)]:[border-bottom:1px_solid_#edf1f7]"], [3339, "[:is(:where(&).admin-panel-heading_h2)]:[color:#183354] [:is(:where(&).admin-panel-heading_h2)]:[font-size:14px]"], [3375, "[.admin-route-content_:where(&).admin-panel-heading_h2]:[font-size:17px]"])}>
            <h2>{editing ? "Edit product" : "Add product"}</h2>
            {editing && <button type="button" className={utilities("icon-button", [177, "[:where(&).icon-button]:inline-grid [:where(&).icon-button]:[place-items:center] [:where(&).icon-button]:[border:1px_solid_var(--line)] [:where(&).icon-button]:[border-radius:6px] [:where(&).icon-button]:[background:#fff] [:where(&).icon-button]:[width:34px] [:where(&).icon-button]:[height:34px] [:where(&).icon-button]:[color:#50617b] [:where(&).icon-button]:cursor-pointer"], [178, "[:where(&).icon-button:hover]:[border-color:#8fa5cd] [:where(&).icon-button:hover]:[color:#1d5fc3]"], [179, "[:where(&).icon-button.danger:hover]:[border-color:#efb3b6] [:where(&).icon-button.danger:hover]:[color:var(--red)]"], [1838, "[.admin-media-grid_:where(&).icon-button]:absolute [.admin-media-grid_:where(&).icon-button]:[right:14px] [.admin-media-grid_:where(&).icon-button]:[top:14px] [.admin-media-grid_:where(&).icon-button]:[background:#fff]"], [2633, "[.order-actions_:where(&).icon-button.is-active]:[border-color:#e51f2a] [.order-actions_:where(&).icon-button.is-active]:[color:#e51f2a] [.order-actions_:where(&).icon-button.is-active]:[background:#fff5f5]"], [3354, "[.crud-row_:where(&).icon-button]:[width:30px] [.crud-row_:where(&).icon-button]:[height:30px] [.crud-row_:where(&).icon-button]:[border-color:#e2e9f2] [.crud-row_:where(&).icon-button]:[border-radius:8px]"], [3369, "[@media_(max-width:_720px)]:[.crud-row_:where(&).icon-button]:[width:28px] [@media_(max-width:_720px)]:[.crud-row_:where(&).icon-button]:[height:28px]"])} onClick={() => { setEditing(null); setForm(blank); localStorage.removeItem(DRAFT_KEY); }}><X size={16}/></button>}
          </div>

          {/* ── Basic info ── */}
          <label>Product title <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: (form.slug === "" || form.slug === slugify(form.name)) ? slugify(e.target.value) : form.slug })}/></label>
          <label>Slug <input required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}/></label>

          <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:grid [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[gap:8px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[color:#53617a] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[font-size:14px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:font-medium"])}>Featured Categories
            <CustomSelect placeholder="Select Featured Category" value={form.category} onChange={v => setForm({ ...form, category: v, subcategory: "" })} options={catOptions.map(c => ({ value: c.name, label: c.name }))} />
          </div>

          <label>SKU <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })}/></label>

          <div className={utilities("form-grid", [174, "[.crud-form_:where(&).form-grid]:[gap:12px]"], [287, "[:where(&).form-grid]:grid [:where(&).form-grid]:[grid-template-columns:1fr_1fr] [:where(&).form-grid]:[gap:12px]"], [579, "[@media_(max-width:_720px)]:[:where(&).form-grid]:[grid-template-columns:1fr]"])}>
            <label>Badge <input value={form.badge} onChange={e => setForm({ ...form, badge: e.target.value })} placeholder="HOT / BEST SELLER"/></label>
            <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:grid [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[gap:8px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[color:#53617a] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[font-size:14px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:font-medium"])}>Status
              <CustomSelect placeholder="Select Status" value={form.status} onChange={v => setForm({ ...form, status: v as ProductStatus })} options={[{value:"published",label:"Published"},{value:"draft",label:"Draft"},{value:"archived",label:"Archived"}]} />
            </div>
          </div>

          {/* ── Pricing & stock ── */}
          <div className={utilities("form-grid", [174, "[.crud-form_:where(&).form-grid]:[gap:12px]"], [287, "[:where(&).form-grid]:grid [:where(&).form-grid]:[grid-template-columns:1fr_1fr] [:where(&).form-grid]:[gap:12px]"], [579, "[@media_(max-width:_720px)]:[:where(&).form-grid]:[grid-template-columns:1fr]"])}>
            <label>Sale price (৳) <input type="number" min="0" required value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })}/></label>
            <label>Regular price (৳) <input type="number" min="0" value={form.oldPrice} onChange={e => setForm({ ...form, oldPrice: Number(e.target.value) })}/></label>
          </div>
          <div className={utilities("form-grid", [174, "[.crud-form_:where(&).form-grid]:[gap:12px]"], [287, "[:where(&).form-grid]:grid [:where(&).form-grid]:[grid-template-columns:1fr_1fr] [:where(&).form-grid]:[gap:12px]"], [579, "[@media_(max-width:_720px)]:[:where(&).form-grid]:[grid-template-columns:1fr]"])}>
            <label>Stock <input type="number" min="0" required value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })}/></label>
            <label>Reorder level <input type="number" min="0" value={form.reorderLevel} onChange={e => setForm({ ...form, reorderLevel: Number(e.target.value) })}/></label>
          </div>
          <div className={utilities("form-grid", [174, "[.crud-form_:where(&).form-grid]:[gap:12px]"], [287, "[:where(&).form-grid]:grid [:where(&).form-grid]:[grid-template-columns:1fr_1fr] [:where(&).form-grid]:[gap:12px]"], [579, "[@media_(max-width:_720px)]:[:where(&).form-grid]:[grid-template-columns:1fr]"])}>
            <label>Unit cost (৳) <input type="number" min="0" value={form.unitCost} onChange={e => setForm({ ...form, unitCost: Number(e.target.value) })}/></label>
            <label>Warehouse <input value={form.warehouse} onChange={e => setForm({ ...form, warehouse: e.target.value })}/></label>
          </div>
          <label>Supplier <input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}/></label>

          {/* ── Category / Sub-Category (DB-driven) ── */}
          <div className={utilities("form-grid", [174, "[.crud-form_:where(&).form-grid]:[gap:12px]"], [287, "[:where(&).form-grid]:grid [:where(&).form-grid]:[grid-template-columns:1fr_1fr] [:where(&).form-grid]:[gap:12px]"], [579, "[@media_(max-width:_720px)]:[:where(&).form-grid]:[grid-template-columns:1fr]"])}>
            <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:grid [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[gap:8px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[color:#53617a] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[font-size:14px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:font-medium"])}>Category
              <CustomSelect placeholder="Select Category" value={form.category} onChange={v => setForm({ ...form, category: v, subcategory: "" })} options={catOptions.map(c => ({ value: c.name, label: c.name }))} />
            </div>
            <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:grid [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[gap:8px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[color:#53617a] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[font-size:14px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:font-medium"])}>Sub-Category
              <CustomSelect placeholder="— None —" disabled={!form.category} value={form.subcategory} onChange={v => setForm({ ...form, subcategory: v })} options={[...subOptions, ...(form.subcategory && !subOptions.includes(form.subcategory) ? [form.subcategory] : [])].map(x => ({ value: x, label: x }))} />
            </div>
          </div>

          {/* ── Gallery videos ── */}
          <div className={utilities("admin-video-urls", [420, "[:where(&).admin-video-urls]:[margin:8px_0] [:where(&).admin-video-urls]:[padding:12px] [:where(&).admin-video-urls]:[border:1px_solid_#e3e8ef] [:where(&).admin-video-urls]:[border-radius:8px] [:where(&).admin-video-urls]:[background:#f9fbfe]"])}>
            <label className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-bottom:6px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:block [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:font-semibold"])}>Gallery videos <small className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:font-normal [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[color:#6d7890]"])}>(Upload MP4/WebM/MOV)</small></label>
            <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={e => {
              const file = e.target.files?.[0];
              if (file) uploadVideo(file);
              e.target.value = "";
            }}/>
            <small className={utilities("file-hint", [175, "[:where(&).file-hint]:flex! [:where(&).file-hint]:items-center [:where(&).file-hint]:[gap:5px] [:where(&).file-hint]:[color:#7a879d]!"])}><ImagePlus size={14}/>Upload one or more product videos</small>
            {(form.galleryVideos.length > 0 || uploadingVideo) && (
              <div className={utilities("admin-gallery-preview", [1605, "[:where(&).admin-gallery-preview]:flex [:where(&).admin-gallery-preview]:[gap:8px] [:where(&).admin-gallery-preview]:flex-wrap"], [1606, "[:where(&).admin-gallery-preview_img]:[width:72px] [:where(&).admin-gallery-preview_img]:[height:56px] [:where(&).admin-gallery-preview_img]:object-contain [:where(&).admin-gallery-preview_img]:[border:1px_solid_#e3e8ef] [:where(&).admin-gallery-preview_img]:[border-radius:7px] [:where(&).admin-gallery-preview_img]:[background:#f8fafc]"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-top:12px]"])} >
                {form.galleryVideos.map((url, i) => (
                  <div key={i} className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:relative [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:100px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[height:75px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:overflow-hidden [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-radius:6px]"])}>
                    <video src={url} className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[height:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:object-cover"])} muted loop autoPlay playsInline />
                    <button type="button" onClick={() => setForm({ ...form, galleryVideos: form.galleryVideos.filter((_, j) => j !== i) })} className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:absolute [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[top:2px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[right:2px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[background:rgba(0,0,0,0.5)] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[color:#fff] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border:none] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-radius:50%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:20px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[height:20px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:cursor-pointer [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:items-center [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:justify-center [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[padding:0]"])}>×</button>
                  </div>
                ))}
                {uploadingVideo && (
                  <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:relative [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:100px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[height:75px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:overflow-hidden [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-radius:6px]"])}>
                    <video src={uploadingVideo} className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[height:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:object-cover [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[opacity:0.5]"])} muted loop autoPlay playsInline />
                    <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:absolute [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[inset:0] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:items-center [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:justify-center"])}>
                      <Loader2 className={utilities("rde-spin", [1006, "[:where(&).rde-spin]:animate-[rdeSpin_0.8s_linear_infinite]"])} size={20} color="#007bff" />
                    </div>
                    <button type="button" onClick={() => setUploadingVideo(null)} className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:absolute [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[top:2px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[right:2px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[background:rgba(0,0,0,0.5)] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[color:#fff] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border:none] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-radius:50%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:20px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[height:20px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:cursor-pointer [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:items-center [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:justify-center [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[padding:0]"])}>×</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Gallery images ── */}
          <label>Gallery images
            <input type="file" accept="image/*" multiple onChange={e => {
              queueProductImages(e.target.files);
              e.target.value = "";
            }}/>
            <small className={utilities("file-hint", [175, "[:where(&).file-hint]:flex! [:where(&).file-hint]:items-center [:where(&).file-hint]:[gap:5px] [:where(&).file-hint]:[color:#7a879d]!"])}><ImagePlus size={14}/>Upload one or more product images</small>
          </label>
          {(form.images.length > 0 || uploadingImage) && (
            <div className={utilities("admin-gallery-preview", [1605, "[:where(&).admin-gallery-preview]:flex [:where(&).admin-gallery-preview]:[gap:8px] [:where(&).admin-gallery-preview]:flex-wrap"], [1606, "[:where(&).admin-gallery-preview_img]:[width:72px] [:where(&).admin-gallery-preview_img]:[height:56px] [:where(&).admin-gallery-preview_img]:object-contain [:where(&).admin-gallery-preview_img]:[border:1px_solid_#e3e8ef] [:where(&).admin-gallery-preview_img]:[border-radius:7px] [:where(&).admin-gallery-preview_img]:[background:#f8fafc]"])}>
              {form.images.map(url => (
                <div key={url}><img src={url} alt="Product"/><button type="button" onClick={() => removeImage(url)}>×</button></div>
              ))}
              {uploadingImage && (
                <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:relative [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:72px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[height:56px]"])}>
                  <img src={uploadingImage} alt="Uploading..." className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[opacity:0.3] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[height:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:object-contain [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-radius:7px]"])} />
                  <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:absolute [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[top:0] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[left:0] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[height:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:items-center [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:justify-center"])}>
                    <Loader2 className={utilities("rde-spin", [1006, "[:where(&).rde-spin]:animate-[rdeSpin_0.8s_linear_infinite]"])} size={20} color="#007bff" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── URLs & text ── */}
          <label>YouTube URL <input value={form.youtubeUrl} onChange={e => setForm({ ...form, youtubeUrl: e.target.value })} placeholder="https://youtube.com/..."/></label>
          <label>Short summary <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short text used on product cards and search results"/></label>
          <label>Product Description — Normal text or HTML
            <textarea
              rows={10}
              value={form.descriptionHtml}
              onChange={e => setForm({ ...form, descriptionHtml: e.target.value })}
              placeholder={'Write normal text here...\n\nOr use HTML:\n<h2>Product overview</h2>\n<p>Write the full product description.</p>\n<ul><li>Main benefit</li></ul>'}
              spellCheck
            />
            <small className={utilities("admin-field-help", [1969, "[:where(&).admin-field-help]:[margin:10px_0_0] [:where(&).admin-field-help]:[color:#748095] [:where(&).admin-field-help]:[font-size:10px] [:where(&).admin-field-help]:[line-height:1.5]"])}>Normal text and HTML are both supported. Normal text is automatically formatted; unsafe scripts and event attributes are removed.</small>
          </label>
          <label>Size Measurement HTML
            <textarea rows={8} value={form.sizeMeasurementHtml} onChange={e => setForm({ ...form, sizeMeasurementHtml: e.target.value })} placeholder={'<table>\n  <tr><th>Size</th><th>Chest</th><th>Length</th></tr>\n  <tr><td>M</td><td>38 in</td><td>27 in</td></tr>\n</table>'}/>
            <small className={utilities("admin-field-help", [1969, "[:where(&).admin-field-help]:[margin:10px_0_0] [:where(&).admin-field-help]:[color:#748095] [:where(&).admin-field-help]:[font-size:10px] [:where(&).admin-field-help]:[line-height:1.5]"])}>HTML table, headings, lists and formatted text can be added here. Unsafe scripts and event attributes are removed automatically.</small>
          </label>

          {/* ── Pre-order settings ── */}
          <div className={utilities("admin-special-fields preorder-settings", [1964, "[:where(&).admin-special-fields]:[margin:4px_0_2px] [:where(&).admin-special-fields]:[padding:14px] [:where(&).admin-special-fields]:[border:1px_solid_#e3e8ef] [:where(&).admin-special-fields]:[border-radius:8px] [:where(&).admin-special-fields]:[background:#f9fbfe]"], [1965, "[:where(&).admin-special-fields_h3]:[margin:0_0_12px] [:where(&).admin-special-fields_h3]:[font-size:13px] [:where(&).admin-special-fields_h3]:[color:#18365e]"])}>
            <h3>Pre-order settings</h3>
            <p className={utilities("admin-field-help", [1969, "[:where(&).admin-field-help]:[margin:10px_0_0] [:where(&).admin-field-help]:[color:#748095] [:where(&).admin-field-help]:[font-size:10px] [:where(&).admin-field-help]:[line-height:1.5]"])}>Enable advance bookings for stock-out or upcoming products. Customers can choose full or partial payment.</p>
            <div className={utilities("admin-special-grid", [1966, "[:where(&).admin-special-grid]:grid [:where(&).admin-special-grid]:[grid-template-columns:1fr_1fr] [:where(&).admin-special-grid]:[gap:10px]"], [1967, "[:where(&).admin-special-grid_label]:grid [:where(&).admin-special-grid_label]:[gap:6px]"], [1968, "[:where(&).admin-special-grid_input,_:where(&).admin-special-grid_select]:[width:100%] [:where(&).admin-special-grid_input,_:where(&).admin-special-grid_select]:[border:1px_solid_#dce3ec] [:where(&).admin-special-grid_input,_:where(&).admin-special-grid_select]:[border-radius:6px] [:where(&).admin-special-grid_input,_:where(&).admin-special-grid_select]:[padding:10px] [:where(&).admin-special-grid_input,_:where(&).admin-special-grid_select]:[background:#fff]"], [2018, "[@media_(max-width:700px)]:[:where(&).admin-special-grid]:[grid-template-columns:1fr]"])}>
              <label className={utilities("file-hint", [175, "[:where(&).file-hint]:flex! [:where(&).file-hint]:items-center [:where(&).file-hint]:[gap:5px] [:where(&).file-hint]:[color:#7a879d]!"])}><input type="checkbox" checked={form.preorderEnabled} onChange={e => setForm({ ...form, preorderEnabled: e.target.checked })}/> Allow Pre-Order</label>
              <label>Deposit percentage <input type="number" min="1" max="100" value={form.preorderDepositPercent} onChange={e => setForm({ ...form, preorderDepositPercent: Number(e.target.value) })}/></label>
              <label>Customer message <input value={form.preorderNote} onChange={e => setForm({ ...form, preorderNote: e.target.value })} placeholder="Reserve before the next shipment"/></label>
            </div>
          </div>

          {/* ── Product display options ── */}
          <div className={utilities("admin-special-fields product-display-options", [1964, "[:where(&).admin-special-fields]:[margin:4px_0_2px] [:where(&).admin-special-fields]:[padding:14px] [:where(&).admin-special-fields]:[border:1px_solid_#e3e8ef] [:where(&).admin-special-fields]:[border-radius:8px] [:where(&).admin-special-fields]:[background:#f9fbfe]"], [1965, "[:where(&).admin-special-fields_h3]:[margin:0_0_12px] [:where(&).admin-special-fields_h3]:[font-size:13px] [:where(&).admin-special-fields_h3]:[color:#18365e]"])}>
            <h3>Product display options</h3>
            <p className={utilities("admin-field-help", [1969, "[:where(&).admin-field-help]:[margin:10px_0_0] [:where(&).admin-field-help]:[color:#748095] [:where(&).admin-field-help]:[font-size:10px] [:where(&).admin-field-help]:[line-height:1.5]"])}>Choose which product categories to show on the homepage or in product listings.</p>
            <div className={utilities("admin-checkbox-grid", [1607, "[:where(&).admin-checkbox-grid]:grid [:where(&).admin-checkbox-grid]:[grid-template-columns:repeat(2,_minmax(0,_1fr))] [:where(&).admin-checkbox-grid]:[gap:8px_12px]"], [1608, "[:where(&).admin-checkbox-grid_label]:flex [:where(&).admin-checkbox-grid_label]:items-center [:where(&).admin-checkbox-grid_label]:[gap:7px]"])}>

              <label><input type="checkbox" checked={form.isNewArrival} onChange={e => setForm({ ...form, isNewArrival: e.target.checked })}/> New Arrival</label>
              <label><input type="checkbox" checked={form.isPopular} onChange={e => setForm({ ...form, isPopular: e.target.checked })}/> Hot and popular</label>
              <label><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })}/> Active</label>
              <label><input type="checkbox" checked={slugify(form.category) === "women-t-shirt"} onChange={e => setForm({ ...form, category: e.target.checked ? "Women T shirt" : "", subcategory: "" })}/> Women T shirt</label>
              <label><input type="checkbox" checked={slugify(form.category) === "men-t-shirt"} onChange={e => setForm({ ...form, category: e.target.checked ? "Men T shirt" : "", subcategory: "" })}/> Men T shirt</label>
              <label><input type="checkbox" checked={slugify(form.category) === "hoodie"} onChange={e => setForm({ ...form, category: e.target.checked ? "Hoodie" : "", subcategory: "" })}/> Hoodie</label>
            </div>
          </div>

          {/* ── Rich Product Description ── */}
          <div className={utilities("rde-compact-card", [1041, "[:where(&).rde-compact-card]:[border:1px_solid_#dce5f0] [:where(&).rde-compact-card]:[border-radius:10px] [:where(&).rde-compact-card]:[padding:16px] [:where(&).rde-compact-card]:[background:linear-gradient(135deg,_#fafcff,_#f0f4fa)]"])}>
            <div className={utilities("rde-compact-top", [1042, "[:where(&).rde-compact-top]:flex [:where(&).rde-compact-top]:items-start [:where(&).rde-compact-top]:justify-between [:where(&).rde-compact-top]:[gap:10px] [:where(&).rde-compact-top]:[margin-bottom:12px]"], [1043, "[:where(&).rde-compact-top_strong]:block [:where(&).rde-compact-top_strong]:[font-size:13px] [:where(&).rde-compact-top_strong]:[color:#102952]"], [1044, "[:where(&).rde-compact-top_small]:block [:where(&).rde-compact-top_small]:[font-size:10px] [:where(&).rde-compact-top_small]:[color:#64748b] [:where(&).rde-compact-top_small]:[margin-top:3px] [:where(&).rde-compact-top_small]:[line-height:1.5]"])}>
              <div><strong>📄 Rich Product Description</strong><small>Create stunning DJI-style product pages with the visual page builder.</small></div>
              {form.descriptionHtml && form.descriptionHtml !== starterHtml && <span className={utilities("rde-compact-badge", [1045, "[:where(&).rde-compact-badge]:inline-flex [:where(&).rde-compact-badge]:[padding:3px_10px] [:where(&).rde-compact-badge]:[background:#ecfdf5] [:where(&).rde-compact-badge]:[color:#059669] [:where(&).rde-compact-badge]:[font-size:10px] [:where(&).rde-compact-badge]:font-bold [:where(&).rde-compact-badge]:[border-radius:12px] [:where(&).rde-compact-badge]:whitespace-nowrap [:where(&).rde-compact-badge]:[flex-shrink:0]"])}>✓ Configured</span>}
            </div>
            <Link href="/admin/products/builder" className={utilities("button button-blue rde-open-builder", [62, "[:where(&).button]:[min-height:39px] [:where(&).button]:inline-flex [:where(&).button]:items-center [:where(&).button]:justify-center [:where(&).button]:[gap:7px] [:where(&).button]:[border-radius:4px] [:where(&).button]:[padding:0_17px] [:where(&).button]:font-bold [:where(&).button]:cursor-pointer [:where(&).button]:[border:1px_solid_transparent]"], [280, "[.cart-summary_:where(&).button]:[width:100%] [.cart-summary_:where(&).button]:[margin-top:12px]"], [286, "[.checkout-form>:where(&).button]:[width:max-content] [.checkout-form>:where(&).button]:[margin-top:6px]"], [492, "[.accessory-card_:where(&).button]:[width:100%] [.accessory-card_:where(&).button]:[margin-top:12px] [.accessory-card_:where(&).button]:[border-radius:6px] [.accessory-card_:where(&).button]:text-ellipsis [.accessory-card_:where(&).button]:overflow-hidden [.accessory-card_:where(&).button]:whitespace-nowrap"], [603, "[:is(:where(&).button)]:[font-size:14px]"], [654, "[:is(.accessory-card_:where(&).button)]:[font-size:10px] [:is(.accessory-card_:where(&).button)]:[padding:0_4px] [:is(.accessory-card_:where(&).button)]:[min-height:30px]"], [683, "[@media_(max-width:_720px)]:[:where(&).button,_:where(&).text-link]:[font-size:12px]"], [809, "[.package-card_footer_:where(&).button]:[font-size:11px] [.package-card_footer_:where(&).button]:[min-height:32px] [.package-card_footer_:where(&).button]:[padding:0_13px]"], [818, "[.maintenance-cta_:where(&).button]:[margin-right:15px]"], [837, "[@media_(max-width:_720px)]:[.maintenance-cta_:where(&).button]:[margin:0_0_12px]"], [1046, "[:where(&).rde-open-builder]:[width:100%] [:where(&).rde-open-builder]:justify-center [:where(&).rde-open-builder]:[gap:6px] [:where(&).rde-open-builder]:[font-size:13px]! [:where(&).rde-open-builder]:[padding:10px_16px]!"], [1047, "[:where(&).button-blue]:[background:linear-gradient(135deg,_#3f70ce,_#2d5bb8)] [:where(&).button-blue]:[color:#fff] [:where(&).button-blue]:[border:0] [:where(&).button-blue]:[border-radius:7px] [:where(&).button-blue]:cursor-pointer [:where(&).button-blue]:font-bold [:where(&).button-blue]:inline-flex [:where(&).button-blue]:items-center [:where(&).button-blue]:[transition:all_0.18s]"], [1048, "[:where(&).button-blue:hover]:[background:linear-gradient(135deg,_#2d5bb8,_#1e4a9e)] [:where(&).button-blue:hover]:[transform:translateY(-1px)] [:where(&).button-blue:hover]:[box-shadow:0_4px_12px_#3f70ce30]"], [1225, "[.combo-modal>footer_:where(&).button]:[min-height:36px]"], [1289, "[@media_(max-width:_720px)]:[.combo-modal>footer_:where(&).button]:[width:100%]"], [2383, "[@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:inline-block [@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:[margin-top:15px]"], [2479, "[.reference-toolbar_:where(&).button]:[height:34px] [.reference-toolbar_:where(&).button]:[padding:0_10px] [.reference-toolbar_:where(&).button]:[font-size:10px]"], [2491, "[.order-actions_:where(&).button]:[font-size:9px] [.order-actions_:where(&).button]:[padding:6px_14px]"], [2542, "[.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[height:34px] [.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[font-size:9px]"], [2579, "[.order-confirmation-actions_:where(&).button]:flex [.order-confirmation-actions_:where(&).button]:items-center [.order-confirmation-actions_:where(&).button]:justify-center [.order-confirmation-actions_:where(&).button]:[gap:7px] [.order-confirmation-actions_:where(&).button]:[min-height:43px] [.order-confirmation-actions_:where(&).button]:[text-decoration:none]"], [2587, "[.invoice-actions_:where(&).button]:flex [.invoice-actions_:where(&).button]:items-center [.invoice-actions_:where(&).button]:justify-center [.invoice-actions_:where(&).button]:[gap:6px]"], [2627, "[@media_(max-width:680px)]:[.invoice-actions_:where(&).button]:[flex:1_1_100%]"], [2653, "[.drawer-edit-actions_:where(&).button]:[height:31px] [.drawer-edit-actions_:where(&).button]:[padding:0_11px] [.drawer-edit-actions_:where(&).button]:[font-size:9px]"])}><LayoutGrid size={15}/> Open Page Builder</Link>
          </div>

          {/* ── Product FAQs ── */}
          <div className={utilities("admin-special-fields product-faqs-editor", [1964, "[:where(&).admin-special-fields]:[margin:4px_0_2px] [:where(&).admin-special-fields]:[padding:14px] [:where(&).admin-special-fields]:[border:1px_solid_#e3e8ef] [:where(&).admin-special-fields]:[border-radius:8px] [:where(&).admin-special-fields]:[background:#f9fbfe]"], [1965, "[:where(&).admin-special-fields_h3]:[margin:0_0_12px] [:where(&).admin-special-fields_h3]:[font-size:13px] [:where(&).admin-special-fields_h3]:[color:#18365e]"], [1974, "[:where(&).product-faqs-editor_h3]:[margin-bottom:4px]"])}>
            <h3>Product FAQs</h3>
            <p className={utilities("admin-field-help", [1969, "[:where(&).admin-field-help]:[margin:10px_0_0] [:where(&).admin-field-help]:[color:#748095] [:where(&).admin-field-help]:[font-size:10px] [:where(&).admin-field-help]:[line-height:1.5]"])}>Add frequently asked questions for this product. These appear on the product page under the description.</p>
            {form.faqs.map((faq, i) => (
              <div key={i} className={utilities("admin-faq-row", [1970, "[:where(&).admin-faq-row]:flex [:where(&).admin-faq-row]:items-start [:where(&).admin-faq-row]:[gap:10px] [:where(&).admin-faq-row]:[background:#f7f9fc] [:where(&).admin-faq-row]:[border:1px_solid_#e4e9f0] [:where(&).admin-faq-row]:[border-radius:8px] [:where(&).admin-faq-row]:[padding:12px] [:where(&).admin-faq-row]:[margin-bottom:8px]"])}>
                <div className={utilities("admin-faq-index", [1971, "[:where(&).admin-faq-index]:[flex-shrink:0] [:where(&).admin-faq-index]:[width:24px] [:where(&).admin-faq-index]:[height:24px] [:where(&).admin-faq-index]:[background:#e8effa] [:where(&).admin-faq-index]:[color:#3b6fcf] [:where(&).admin-faq-index]:[font-size:11px] [:where(&).admin-faq-index]:font-bold [:where(&).admin-faq-index]:[border-radius:50%] [:where(&).admin-faq-index]:flex [:where(&).admin-faq-index]:items-center [:where(&).admin-faq-index]:justify-center [:where(&).admin-faq-index]:[margin-top:4px]"])}>{i + 1}</div>
                <div className={utilities("admin-faq-fields", [1972, "[:where(&).admin-faq-fields]:[flex:1] [:where(&).admin-faq-fields]:flex [:where(&).admin-faq-fields]:flex-col [:where(&).admin-faq-fields]:[gap:6px]"], [1973, "[:where(&).admin-faq-fields_input,_:where(&).admin-faq-fields_textarea]:[width:100%] [:where(&).admin-faq-fields_input,_:where(&).admin-faq-fields_textarea]:[font-size:13px]"])}>
                  <input
                    value={faq.question}
                    onChange={e => { const faqs = [...form.faqs]; faqs[i] = { ...faqs[i], question: e.target.value }; setForm({ ...form, faqs }); }}
                    placeholder="Question e.g. Is this product available now?"
                  />
                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={e => { const faqs = [...form.faqs]; faqs[i] = { ...faqs[i], answer: e.target.value }; setForm({ ...form, faqs }); }}
                    placeholder="Answer..."
                  />
                </div>
                <button type="button" className={utilities("icon-button danger", [177, "[:where(&).icon-button]:inline-grid [:where(&).icon-button]:[place-items:center] [:where(&).icon-button]:[border:1px_solid_var(--line)] [:where(&).icon-button]:[border-radius:6px] [:where(&).icon-button]:[background:#fff] [:where(&).icon-button]:[width:34px] [:where(&).icon-button]:[height:34px] [:where(&).icon-button]:[color:#50617b] [:where(&).icon-button]:cursor-pointer"], [178, "[:where(&).icon-button:hover]:[border-color:#8fa5cd] [:where(&).icon-button:hover]:[color:#1d5fc3]"], [179, "[:where(&).icon-button.danger:hover]:[border-color:#efb3b6] [:where(&).icon-button.danger:hover]:[color:var(--red)]"], [1838, "[.admin-media-grid_:where(&).icon-button]:absolute [.admin-media-grid_:where(&).icon-button]:[right:14px] [.admin-media-grid_:where(&).icon-button]:[top:14px] [.admin-media-grid_:where(&).icon-button]:[background:#fff]"], [2633, "[.order-actions_:where(&).icon-button.is-active]:[border-color:#e51f2a] [.order-actions_:where(&).icon-button.is-active]:[color:#e51f2a] [.order-actions_:where(&).icon-button.is-active]:[background:#fff5f5]"], [2638, "[.order-action-menu_button:where(&).danger]:[color:#e02634] [.order-action-menu_button:where(&).danger]:[border-top:1px_solid_#edf1f6] [.order-action-menu_button:where(&).danger]:[border-radius:0_0_7px_7px] [.order-action-menu_button:where(&).danger]:[margin-top:3px] [.order-action-menu_button:where(&).danger]:[padding-top:11px]"], [2639, "[.order-action-menu_button:where(&).danger:hover]:[background:#fff1f2] [.order-action-menu_button:where(&).danger:hover]:[color:#c81826]"], [3354, "[.crud-row_:where(&).icon-button]:[width:30px] [.crud-row_:where(&).icon-button]:[height:30px] [.crud-row_:where(&).icon-button]:[border-color:#e2e9f2] [.crud-row_:where(&).icon-button]:[border-radius:8px]"], [3369, "[@media_(max-width:_720px)]:[.crud-row_:where(&).icon-button]:[width:28px] [@media_(max-width:_720px)]:[.crud-row_:where(&).icon-button]:[height:28px]"])} onClick={() => setForm({ ...form, faqs: form.faqs.filter((_, j) => j !== i) })}>×</button>
              </div>
            ))}
            <button type="button" className={utilities("text-button", [1609, "[:where(&).text-button]:[border:0] [:where(&).text-button]:[background:transparent] [:where(&).text-button]:[color:#c81f2a] [:where(&).text-button]:cursor-pointer [:where(&).text-button]:[text-decoration:underline]"], [1984, "[.admin-spec-items_:where(&).text-button]:[margin-top:4px] [.admin-spec-items_:where(&).text-button]:[font-size:12px]"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-top:8px]"])}  onClick={() => setForm({ ...form, faqs: [...form.faqs, { question: "", answer: "", sortOrder: form.faqs.length }] })}>+ Add FAQ</button>
          </div>


          {/* ── Similar Products ── */}
          <div className={utilities("admin-special-fields similar-products-editor", [1964, "[:where(&).admin-special-fields]:[margin:4px_0_2px] [:where(&).admin-special-fields]:[padding:14px] [:where(&).admin-special-fields]:[border:1px_solid_#e3e8ef] [:where(&).admin-special-fields]:[border-radius:8px] [:where(&).admin-special-fields]:[background:#f9fbfe]"], [1965, "[:where(&).admin-special-fields_h3]:[margin:0_0_12px] [:where(&).admin-special-fields_h3]:[font-size:13px] [:where(&).admin-special-fields_h3]:[color:#18365e]"], [1985, "[:where(&).similar-products-editor_h3,_:where(&).product-accessories-editor_h3]:[margin-bottom:4px]"])}>
            <h3>Similar Products</h3>
            <p className={utilities("admin-field-help", [1969, "[:where(&).admin-field-help]:[margin:10px_0_0] [:where(&).admin-field-help]:[color:#748095] [:where(&).admin-field-help]:[font-size:10px] [:where(&).admin-field-help]:[line-height:1.5]"])}>Add related or similar products. Users will see these on the product page. Type to search from existing products.</p>
            {form.similarProducts.length > 0 && (
              <div className={utilities("admin-tags-list", [2000, "[:where(&).admin-tags-list]:flex [:where(&).admin-tags-list]:flex-wrap [:where(&).admin-tags-list]:[gap:8px] [:where(&).admin-tags-list]:[margin-bottom:10px]"])}>
                {form.similarProducts.map(slug => {
                  const prod = products.find(p => p.slug === slug);
                  return (
                    <span key={slug} className={utilities("admin-tag", [2001, "[:where(&).admin-tag]:inline-flex [:where(&).admin-tag]:items-center [:where(&).admin-tag]:[gap:6px] [:where(&).admin-tag]:[background:#e8effa] [:where(&).admin-tag]:[color:#2b4fa0] [:where(&).admin-tag]:[border:1px_solid_#c5d4ef] [:where(&).admin-tag]:[border-radius:20px] [:where(&).admin-tag]:[padding:4px_10px_4px_8px] [:where(&).admin-tag]:[font-size:12px] [:where(&).admin-tag]:font-semibold"], [2002, "[:where(&).admin-tag_img]:[width:20px] [:where(&).admin-tag_img]:[height:20px] [:where(&).admin-tag_img]:object-cover [:where(&).admin-tag_img]:[border-radius:4px]"], [2003, "[:where(&).admin-tag_button]:[background:none] [:where(&).admin-tag_button]:[border:none] [:where(&).admin-tag_button]:cursor-pointer [:where(&).admin-tag_button]:[color:#6b83c0] [:where(&).admin-tag_button]:[font-size:14px] [:where(&).admin-tag_button]:[line-height:1] [:where(&).admin-tag_button]:[padding:0_2px] [:where(&).admin-tag_button]:[margin-left:2px]"], [2004, "[:where(&).admin-tag_button:hover]:[color:#c0392b]"])}>
                      {prod ? prod.name : slug}
                      <button type="button" onClick={() => setForm({ ...form, similarProducts: form.similarProducts.filter(s => s !== slug) })}>×</button>
                    </span>
                  );
                })}
              </div>
            )}
            <div className={utilities("admin-autocomplete-wrap", [2006, "[:where(&).admin-autocomplete-wrap]:relative"], [2007, "[:where(&).admin-autocomplete-wrap_input]:[width:100%]"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:relative"])} >
              <input
                ref={simRef}
                value={simQuery}
                onChange={e => setSimQuery(e.target.value)}
                placeholder="Type product name to search…"
                autoComplete="off"
              />
              {simSuggestions.length > 0 && (
                <ul className={utilities("admin-autocomplete-dropdown", [2008, "[:where(&).admin-autocomplete-dropdown]:absolute [:where(&).admin-autocomplete-dropdown]:[top:calc(100%_+_4px)] [:where(&).admin-autocomplete-dropdown]:[left:0] [:where(&).admin-autocomplete-dropdown]:[right:0] [:where(&).admin-autocomplete-dropdown]:[z-index:200] [:where(&).admin-autocomplete-dropdown]:[background:#fff] [:where(&).admin-autocomplete-dropdown]:[border:1.5px_solid_#c5d4ef] [:where(&).admin-autocomplete-dropdown]:[border-radius:10px] [:where(&).admin-autocomplete-dropdown]:[box-shadow:0_8px_24px_rgba(0,_0,_0,_0.12)] [:where(&).admin-autocomplete-dropdown]:[list-style:none] [:where(&).admin-autocomplete-dropdown]:[margin:0] [:where(&).admin-autocomplete-dropdown]:[padding:4px] [:where(&).admin-autocomplete-dropdown]:[max-height:260px] [:where(&).admin-autocomplete-dropdown]:overflow-y-auto"], [2009, "[:where(&).admin-autocomplete-dropdown_li]:[border-radius:7px] [:where(&).admin-autocomplete-dropdown_li]:overflow-hidden"], [2010, "[:where(&).admin-autocomplete-dropdown_li_button]:flex [:where(&).admin-autocomplete-dropdown_li_button]:items-center [:where(&).admin-autocomplete-dropdown_li_button]:[gap:10px] [:where(&).admin-autocomplete-dropdown_li_button]:[width:100%] [:where(&).admin-autocomplete-dropdown_li_button]:[background:none] [:where(&).admin-autocomplete-dropdown_li_button]:[border:none] [:where(&).admin-autocomplete-dropdown_li_button]:cursor-pointer [:where(&).admin-autocomplete-dropdown_li_button]:[padding:8px_10px] [:where(&).admin-autocomplete-dropdown_li_button]:text-left [:where(&).admin-autocomplete-dropdown_li_button]:[border-radius:7px] [:where(&).admin-autocomplete-dropdown_li_button]:[transition:background_0.15s]"], [2011, "[:where(&).admin-autocomplete-dropdown_li_button:hover]:[background:#f0f4ff]"], [2012, "[:where(&).admin-autocomplete-dropdown_li_button_img]:[width:38px] [:where(&).admin-autocomplete-dropdown_li_button_img]:[height:32px] [:where(&).admin-autocomplete-dropdown_li_button_img]:object-cover [:where(&).admin-autocomplete-dropdown_li_button_img]:[border-radius:5px] [:where(&).admin-autocomplete-dropdown_li_button_img]:[flex-shrink:0]"], [2013, "[:where(&).admin-autocomplete-dropdown_li_button_span]:flex [:where(&).admin-autocomplete-dropdown_li_button_span]:flex-col [:where(&).admin-autocomplete-dropdown_li_button_span]:[gap:1px]"], [2014, "[:where(&).admin-autocomplete-dropdown_li_button_strong]:[font-size:13px] [:where(&).admin-autocomplete-dropdown_li_button_strong]:[color:#1a2a4a]"], [2015, "[:where(&).admin-autocomplete-dropdown_li_button_small]:[font-size:11px] [:where(&).admin-autocomplete-dropdown_li_button_small]:[color:#7a8797]"])}>
                  {simSuggestions.map(p => (
                    <li key={p.slug}>
                      <button type="button" onClick={() => {
                        setForm({ ...form, similarProducts: [...form.similarProducts, p.slug] });
                        setSimQuery(""); setSimSuggestions([]);
                        simRef.current?.focus();
                      }}>
                        <img src={p.image || "/images/products/mini-5.jpg"} alt="" />
                        <span><strong>{p.name}</strong><small>{p.brand} · {p.category}</small></span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ── Multiple product colour variants ── */}
          <div className={utilities("admin-special-fields combo-products-editor", [1964, "[:where(&).admin-special-fields]:[margin:4px_0_2px] [:where(&).admin-special-fields]:[padding:14px] [:where(&).admin-special-fields]:[border:1px_solid_#e3e8ef] [:where(&).admin-special-fields]:[border-radius:8px] [:where(&).admin-special-fields]:[background:#f9fbfe]"], [1965, "[:where(&).admin-special-fields_h3]:[margin:0_0_12px] [:where(&).admin-special-fields_h3]:[font-size:13px] [:where(&).admin-special-fields_h3]:[color:#18365e]"])}>
            <ProductColoursEditor
              drafts={form.colourDrafts}
              primaryColor={form.color}
              primaryStock={form.stock}
              primaryHasImages={Boolean(form.images.length || form.image)}
              linkedProducts={form.comboProducts.map(slug => products.find(product => product.slug === slug) || { slug, name: slug })}
              uploadingColourId={uploadingColourId}
              busy={savingProduct || cropQueue.length > 0}
              onAdd={addColour}
              onUploadColours={uploadColours}
              onUploadImages={uploadColourImages}
              onChange={(id, patch) => setForm(current => ({ ...current, colourDrafts: current.colourDrafts.map(draft => draft.id === id ? { ...draft, ...patch } : draft) }))}
              onRemove={id => setForm(current => ({ ...current, colourDrafts: current.colourDrafts.filter(draft => draft.id !== id) }))}
              onRemoveImage={(id, url) => setForm(current => ({ ...current, colourDrafts: current.colourDrafts.map(draft => draft.id === id ? { ...draft, images: draft.images.filter(image => image !== url) } : draft) }))}
              onRemoveLinked={slug => setForm(current => ({ ...current, comboProducts: current.comboProducts.filter(value => value !== slug) }))}
            />
            <label className="mt-3 block text-xs font-semibold text-slate-700">Current product colour
              <input aria-label="Current product colour" value={form.color} maxLength={100} placeholder="e.g. Black, White or Navy Blue" required={form.colourDrafts.length > 0 && Boolean(form.images.length || form.image)} disabled={savingProduct} onChange={event => setForm(current => ({ ...current, color: event.target.value }))} />
            </label>
            <p className="mb-3 mt-1 text-[11px] leading-relaxed text-slate-500">Name the colour shown in the main product photos. Photos uploaded with this same colour name join the main gallery and use the main product stock. You can also link a colour product already in your catalogue below.</p>
            <div className={utilities("admin-autocomplete-wrap", [2006, "[:where(&).admin-autocomplete-wrap]:relative"], [2007, "[:where(&).admin-autocomplete-wrap_input]:[width:100%]"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:relative"])} >
              <input ref={comboRef} value={comboQuery} onChange={e => setComboQuery(e.target.value)} placeholder="Search a product colour to add, e.g. Black, White or Blue…" autoComplete="off" />
              {comboSuggestions.length > 0 && <ul className={utilities("admin-autocomplete-dropdown", [2008, "[:where(&).admin-autocomplete-dropdown]:absolute [:where(&).admin-autocomplete-dropdown]:[top:calc(100%_+_4px)] [:where(&).admin-autocomplete-dropdown]:[left:0] [:where(&).admin-autocomplete-dropdown]:[right:0] [:where(&).admin-autocomplete-dropdown]:[z-index:200] [:where(&).admin-autocomplete-dropdown]:[background:#fff] [:where(&).admin-autocomplete-dropdown]:[border:1.5px_solid_#c5d4ef] [:where(&).admin-autocomplete-dropdown]:[border-radius:10px] [:where(&).admin-autocomplete-dropdown]:[box-shadow:0_8px_24px_rgba(0,_0,_0,_0.12)] [:where(&).admin-autocomplete-dropdown]:[list-style:none] [:where(&).admin-autocomplete-dropdown]:[margin:0] [:where(&).admin-autocomplete-dropdown]:[padding:4px] [:where(&).admin-autocomplete-dropdown]:[max-height:260px] [:where(&).admin-autocomplete-dropdown]:overflow-y-auto"], [2009, "[:where(&).admin-autocomplete-dropdown_li]:[border-radius:7px] [:where(&).admin-autocomplete-dropdown_li]:overflow-hidden"], [2010, "[:where(&).admin-autocomplete-dropdown_li_button]:flex [:where(&).admin-autocomplete-dropdown_li_button]:items-center [:where(&).admin-autocomplete-dropdown_li_button]:[gap:10px] [:where(&).admin-autocomplete-dropdown_li_button]:[width:100%] [:where(&).admin-autocomplete-dropdown_li_button]:[background:none] [:where(&).admin-autocomplete-dropdown_li_button]:[border:none] [:where(&).admin-autocomplete-dropdown_li_button]:cursor-pointer [:where(&).admin-autocomplete-dropdown_li_button]:[padding:8px_10px] [:where(&).admin-autocomplete-dropdown_li_button]:text-left [:where(&).admin-autocomplete-dropdown_li_button]:[border-radius:7px] [:where(&).admin-autocomplete-dropdown_li_button]:[transition:background_0.15s]"], [2011, "[:where(&).admin-autocomplete-dropdown_li_button:hover]:[background:#f0f4ff]"], [2012, "[:where(&).admin-autocomplete-dropdown_li_button_img]:[width:38px] [:where(&).admin-autocomplete-dropdown_li_button_img]:[height:32px] [:where(&).admin-autocomplete-dropdown_li_button_img]:object-cover [:where(&).admin-autocomplete-dropdown_li_button_img]:[border-radius:5px] [:where(&).admin-autocomplete-dropdown_li_button_img]:[flex-shrink:0]"], [2013, "[:where(&).admin-autocomplete-dropdown_li_button_span]:flex [:where(&).admin-autocomplete-dropdown_li_button_span]:flex-col [:where(&).admin-autocomplete-dropdown_li_button_span]:[gap:1px]"], [2014, "[:where(&).admin-autocomplete-dropdown_li_button_strong]:[font-size:13px] [:where(&).admin-autocomplete-dropdown_li_button_strong]:[color:#1a2a4a]"], [2015, "[:where(&).admin-autocomplete-dropdown_li_button_small]:[font-size:11px] [:where(&).admin-autocomplete-dropdown_li_button_small]:[color:#7a8797]"])}>
                {comboSuggestions.map(p => <li key={p.slug}><button type="button" onClick={() => { setForm({ ...form, comboProducts: [...form.comboProducts, p.slug] }); setComboQuery(""); setComboSuggestions([]); comboRef.current?.focus(); }}><img src={p.image || "/images/products/mini-5.jpg"} alt="" /><span><strong>{p.color ? `${p.color} — ${p.name}` : p.name}</strong><small>{p.brand} · {p.category} · ৳{p.price.toLocaleString("en-BD")}</small></span></button></li>)}
              </ul>}
            </div>
          </div>

          {/* ── Linked Accessories ── */}
          <div className={utilities("admin-special-fields linked-accessories-editor", [1964, "[:where(&).admin-special-fields]:[margin:4px_0_2px] [:where(&).admin-special-fields]:[padding:14px] [:where(&).admin-special-fields]:[border:1px_solid_#e3e8ef] [:where(&).admin-special-fields]:[border-radius:8px] [:where(&).admin-special-fields]:[background:#f9fbfe]"], [1965, "[:where(&).admin-special-fields_h3]:[margin:0_0_12px] [:where(&).admin-special-fields_h3]:[font-size:13px] [:where(&).admin-special-fields_h3]:[color:#18365e]"])}>
            <h3>Link Accessories</h3>
            <p className={utilities("admin-field-help", [1969, "[:where(&).admin-field-help]:[margin:10px_0_0] [:where(&).admin-field-help]:[color:#748095] [:where(&).admin-field-help]:[font-size:10px] [:where(&).admin-field-help]:[line-height:1.5]"])}>Search and link accessories to this product based on its category. Linked accessories will show in the "Accessories" section of the product page.</p>
            {form.linkedAccessories.length > 0 && (
              <div className={utilities("admin-tags-list", [2000, "[:where(&).admin-tags-list]:flex [:where(&).admin-tags-list]:flex-wrap [:where(&).admin-tags-list]:[gap:8px] [:where(&).admin-tags-list]:[margin-bottom:10px]"])}>
                {form.linkedAccessories.map(slug => {
                  const name = (window as any)[`acc_name_${slug}`] || slug;
                  return <span key={slug} className={utilities("admin-tag", [2001, "[:where(&).admin-tag]:inline-flex [:where(&).admin-tag]:items-center [:where(&).admin-tag]:[gap:6px] [:where(&).admin-tag]:[background:#e8effa] [:where(&).admin-tag]:[color:#2b4fa0] [:where(&).admin-tag]:[border:1px_solid_#c5d4ef] [:where(&).admin-tag]:[border-radius:20px] [:where(&).admin-tag]:[padding:4px_10px_4px_8px] [:where(&).admin-tag]:[font-size:12px] [:where(&).admin-tag]:font-semibold"], [2002, "[:where(&).admin-tag_img]:[width:20px] [:where(&).admin-tag_img]:[height:20px] [:where(&).admin-tag_img]:object-cover [:where(&).admin-tag_img]:[border-radius:4px]"], [2003, "[:where(&).admin-tag_button]:[background:none] [:where(&).admin-tag_button]:[border:none] [:where(&).admin-tag_button]:cursor-pointer [:where(&).admin-tag_button]:[color:#6b83c0] [:where(&).admin-tag_button]:[font-size:14px] [:where(&).admin-tag_button]:[line-height:1] [:where(&).admin-tag_button]:[padding:0_2px] [:where(&).admin-tag_button]:[margin-left:2px]"], [2004, "[:where(&).admin-tag_button:hover]:[color:#c0392b]"])}>{name}<button type="button" onClick={() => setForm({ ...form, linkedAccessories: form.linkedAccessories.filter(s => s !== slug) })}>×</button></span>;
                })}
              </div>
            )}
            <div className={utilities("admin-autocomplete-wrap", [2006, "[:where(&).admin-autocomplete-wrap]:relative"], [2007, "[:where(&).admin-autocomplete-wrap_input]:[width:100%]"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:relative"])} >
              <input
                ref={linkAccRef}
                value={linkAccQuery}
                onChange={e => setLinkAccQuery(e.target.value)}
                onBlur={() => setTimeout(() => { setLinkAccSuggestions([]); }, 200)}
                placeholder="Type accessory name or SKU..."
                autoComplete="off"
              />
              {linkAccSuggestions.length > 0 && <ul className={utilities("admin-autocomplete-dropdown", [2008, "[:where(&).admin-autocomplete-dropdown]:absolute [:where(&).admin-autocomplete-dropdown]:[top:calc(100%_+_4px)] [:where(&).admin-autocomplete-dropdown]:[left:0] [:where(&).admin-autocomplete-dropdown]:[right:0] [:where(&).admin-autocomplete-dropdown]:[z-index:200] [:where(&).admin-autocomplete-dropdown]:[background:#fff] [:where(&).admin-autocomplete-dropdown]:[border:1.5px_solid_#c5d4ef] [:where(&).admin-autocomplete-dropdown]:[border-radius:10px] [:where(&).admin-autocomplete-dropdown]:[box-shadow:0_8px_24px_rgba(0,_0,_0,_0.12)] [:where(&).admin-autocomplete-dropdown]:[list-style:none] [:where(&).admin-autocomplete-dropdown]:[margin:0] [:where(&).admin-autocomplete-dropdown]:[padding:4px] [:where(&).admin-autocomplete-dropdown]:[max-height:260px] [:where(&).admin-autocomplete-dropdown]:overflow-y-auto"], [2009, "[:where(&).admin-autocomplete-dropdown_li]:[border-radius:7px] [:where(&).admin-autocomplete-dropdown_li]:overflow-hidden"], [2010, "[:where(&).admin-autocomplete-dropdown_li_button]:flex [:where(&).admin-autocomplete-dropdown_li_button]:items-center [:where(&).admin-autocomplete-dropdown_li_button]:[gap:10px] [:where(&).admin-autocomplete-dropdown_li_button]:[width:100%] [:where(&).admin-autocomplete-dropdown_li_button]:[background:none] [:where(&).admin-autocomplete-dropdown_li_button]:[border:none] [:where(&).admin-autocomplete-dropdown_li_button]:cursor-pointer [:where(&).admin-autocomplete-dropdown_li_button]:[padding:8px_10px] [:where(&).admin-autocomplete-dropdown_li_button]:text-left [:where(&).admin-autocomplete-dropdown_li_button]:[border-radius:7px] [:where(&).admin-autocomplete-dropdown_li_button]:[transition:background_0.15s]"], [2011, "[:where(&).admin-autocomplete-dropdown_li_button:hover]:[background:#f0f4ff]"], [2012, "[:where(&).admin-autocomplete-dropdown_li_button_img]:[width:38px] [:where(&).admin-autocomplete-dropdown_li_button_img]:[height:32px] [:where(&).admin-autocomplete-dropdown_li_button_img]:object-cover [:where(&).admin-autocomplete-dropdown_li_button_img]:[border-radius:5px] [:where(&).admin-autocomplete-dropdown_li_button_img]:[flex-shrink:0]"], [2013, "[:where(&).admin-autocomplete-dropdown_li_button_span]:flex [:where(&).admin-autocomplete-dropdown_li_button_span]:flex-col [:where(&).admin-autocomplete-dropdown_li_button_span]:[gap:1px]"], [2014, "[:where(&).admin-autocomplete-dropdown_li_button_strong]:[font-size:13px] [:where(&).admin-autocomplete-dropdown_li_button_strong]:[color:#1a2a4a]"], [2015, "[:where(&).admin-autocomplete-dropdown_li_button_small]:[font-size:11px] [:where(&).admin-autocomplete-dropdown_li_button_small]:[color:#7a8797]"])}>
                {linkAccSuggestions.map(p => <li key={p.slug}><button type="button" onClick={() => { (window as any)[`acc_name_${p.slug}`] = p.name; setForm({ ...form, linkedAccessories: [...form.linkedAccessories, p.slug] }); setLinkAccQuery(""); setLinkAccSuggestions([]); }}><img src={p.image || "/images/products/mini-5.jpg"} alt="" /><span><strong>{p.name}</strong><small>{p.brand} · ৳{p.price.toLocaleString("en-BD")}</small></span></button></li>)}
              </ul>}
            </div>
          </div>




          <button className={utilities("button button-red", [62, "[:where(&).button]:[min-height:39px] [:where(&).button]:inline-flex [:where(&).button]:items-center [:where(&).button]:justify-center [:where(&).button]:[gap:7px] [:where(&).button]:[border-radius:4px] [:where(&).button]:[padding:0_17px] [:where(&).button]:font-bold [:where(&).button]:cursor-pointer [:where(&).button]:[border:1px_solid_transparent]"], [65, "[:where(&).button-red]:[background:var(--red)] [:where(&).button-red]:[color:#fff]"], [280, "[.cart-summary_:where(&).button]:[width:100%] [.cart-summary_:where(&).button]:[margin-top:12px]"], [286, "[.checkout-form>:where(&).button]:[width:max-content] [.checkout-form>:where(&).button]:[margin-top:6px]"], [446, "[.purchase-actions>:where(&).button-red]:[min-height:35px] [.purchase-actions>:where(&).button-red]:[flex:1]"], [447, "[.purchase-actions_:where(&).cart-action,_.purchase-actions_:where(&).button-red]:[font-size:16px]"], [492, "[.accessory-card_:where(&).button]:[width:100%] [.accessory-card_:where(&).button]:[margin-top:12px] [.accessory-card_:where(&).button]:[border-radius:6px] [.accessory-card_:where(&).button]:text-ellipsis [.accessory-card_:where(&).button]:overflow-hidden [.accessory-card_:where(&).button]:whitespace-nowrap"], [603, "[:is(:where(&).button)]:[font-size:14px]"], [654, "[:is(.accessory-card_:where(&).button)]:[font-size:10px] [:is(.accessory-card_:where(&).button)]:[padding:0_4px] [:is(.accessory-card_:where(&).button)]:[min-height:30px]"], [683, "[@media_(max-width:_720px)]:[:where(&).button,_:where(&).text-link]:[font-size:12px]"], [809, "[.package-card_footer_:where(&).button]:[font-size:11px] [.package-card_footer_:where(&).button]:[min-height:32px] [.package-card_footer_:where(&).button]:[padding:0_13px]"], [818, "[.maintenance-cta_:where(&).button]:[margin-right:15px]"], [837, "[@media_(max-width:_720px)]:[.maintenance-cta_:where(&).button]:[margin:0_0_12px]"], [1225, "[.combo-modal>footer_:where(&).button]:[min-height:36px]"], [1289, "[@media_(max-width:_720px)]:[.combo-modal>footer_:where(&).button]:[width:100%]"], [2189, "[.purchase-actions_:where(&).button-red]:[background:var(--red)]"], [2383, "[@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:inline-block [@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:[margin-top:15px]"], [2479, "[.reference-toolbar_:where(&).button]:[height:34px] [.reference-toolbar_:where(&).button]:[padding:0_10px] [.reference-toolbar_:where(&).button]:[font-size:10px]"], [2491, "[.order-actions_:where(&).button]:[font-size:9px] [.order-actions_:where(&).button]:[padding:6px_14px]"], [2542, "[.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[height:34px] [.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[font-size:9px]"], [2579, "[.order-confirmation-actions_:where(&).button]:flex [.order-confirmation-actions_:where(&).button]:items-center [.order-confirmation-actions_:where(&).button]:justify-center [.order-confirmation-actions_:where(&).button]:[gap:7px] [.order-confirmation-actions_:where(&).button]:[min-height:43px] [.order-confirmation-actions_:where(&).button]:[text-decoration:none]"], [2587, "[.invoice-actions_:where(&).button]:flex [.invoice-actions_:where(&).button]:items-center [.invoice-actions_:where(&).button]:justify-center [.invoice-actions_:where(&).button]:[gap:6px]"], [2627, "[@media_(max-width:680px)]:[.invoice-actions_:where(&).button]:[flex:1_1_100%]"], [2653, "[.drawer-edit-actions_:where(&).button]:[height:31px] [.drawer-edit-actions_:where(&).button]:[padding:0_11px] [.drawer-edit-actions_:where(&).button]:[font-size:9px]"], [2830, "[@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[flex:1] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[min-height:38px] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[font-size:14px] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:font-bold [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[padding:0_4px]"])} type="submit" disabled={savingProduct || cropQueue.length > 0 || Boolean(uploadingImage || uploadingVideo)}>{savingProduct ? <><Loader2 size={15} className="animate-spin"/>Saving product and colours…</> : editing ? <><Save size={15}/>Save product</> : <><Plus size={15}/>Create product</>}</button>
        </form>

        {/* ── Product list ── */}
        <section className={utilities("crud-list", [180, "[:where(&).crud-list]:[border:1px_solid_var(--line)] [:where(&).crud-list]:[border-radius:8px] [:where(&).crud-list]:[background:#fff] [:where(&).crud-list]:overflow-hidden"], [3333, "[:where(&).crud-form,_:where(&).crud-list]:[border-color:#e1e8f2] [:where(&).crud-form,_:where(&).crud-list]:[border-radius:14px] [:where(&).crud-form,_:where(&).crud-list]:[box-shadow:0_7px_24px_rgba(19,52,94,.055)]"], [3401, "[.admin-products-page_:where(&).crud-grid_>_*,_.admin-products-page_:where(&).crud-list,_.admin-products-page_:where(&).product-editor-form]:[min-width:0] [.admin-products-page_:where(&).crud-grid_>_*,_.admin-products-page_:where(&).crud-list,_.admin-products-page_:where(&).product-editor-form]:[max-width:100%]"], [3402, "[.admin-products-page_:where(&).crud-list]:overflow-hidden"])}>
          <div className={utilities("crud-list-toolbar product-filter-toolbar", [181, "[:where(&).crud-list-toolbar]:flex [:where(&).crud-list-toolbar]:items-center [:where(&).crud-list-toolbar]:justify-between [:where(&).crud-list-toolbar]:[gap:18px] [:where(&).crud-list-toolbar]:[border-bottom:1px_solid_var(--line)]"], [182, "[:where(&).crud-list-toolbar_h2]:[margin:0_0_4px]"], [582, "[@media_(max-width:_720px)]:[:where(&).crud-list-toolbar]:[align-items:start] [@media_(max-width:_720px)]:[:where(&).crud-list-toolbar]:flex-col"], [3340, "[:is(:where(&).crud-list-toolbar)]:[padding:16px_18px] [:is(:where(&).crud-list-toolbar)]:[background:linear-gradient(180deg,#fff,#fbfcff)]"], [3341, "[:is(:where(&).crud-list-toolbar_h2)]:[color:#183354] [:is(:where(&).crud-list-toolbar_h2)]:[font-size:16px]"], [3342, "[:where(&).crud-list-toolbar_span]:[color:#8998ad] [:where(&).crud-list-toolbar_span]:[font-size:10px]"], [3378, "[.admin-route-content_:where(&).crud-list-toolbar_h2]:[font-size:19px]"], [3379, "[.admin-route-content_:where(&).crud-list-toolbar_span]:[font-size:12px]"], [3403, "[.admin-products-page_:where(&).crud-list-toolbar]:[min-width:0] [.admin-products-page_:where(&).crud-list-toolbar]:flex-wrap"], [3417, "[@media_(max-width:_720px)]:[.admin-products-page_:where(&).crud-list-toolbar]:items-stretch"])}>
            <div><h2>Catalog</h2><span>{visible.length} products shown</span></div>
            <label className={utilities("crud-search", [189, "[:where(&).crud-search]:[border:1px_solid_#dce2eb] [:where(&).crud-search]:[border-radius:6px] [:where(&).crud-search]:flex [:where(&).crud-search]:items-center [:where(&).crud-search]:[gap:8px] [:where(&).crud-search]:[padding:0_12px] [:where(&).crud-search]:[width:240px]"], [190, "[:where(&).crud-search_svg]:[color:#8491a7] [:where(&).crud-search_svg]:[width:18px]"], [191, "[:where(&).crud-search_input]:[border:0] [:where(&).crud-search_input]:[outline:0] [:where(&).crud-search_input]:[height:38px] [:where(&).crud-search_input]:[min-width:0] [:where(&).crud-search_input]:[width:100%] [:where(&).crud-search_input]:[font-size:14px]"], [583, "[@media_(max-width:_720px)]:[:where(&).crud-search]:[width:100%]"], [3404, "[.admin-products-page_:where(&).crud-search]:[flex:1_1_220px] [.admin-products-page_:where(&).crud-search]:[min-width:0]"], [3418, "[@media_(max-width:_720px)]:[.admin-products-page_:where(&).crud-search]:[flex-basis:100%] [@media_(max-width:_720px)]:[.admin-products-page_:where(&).crud-search]:[width:100%]"])}><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search product, SKU, category or brand"/></label>
            <CustomSelect minWidth={150} placeholder="All categories" value={categoryFilter} onChange={setCategoryFilter} options={allCategories.map(x => ({ value: x, label: x }))} />
            <CustomSelect minWidth={130} placeholder="All brands" value={brandFilter} onChange={setBrandFilter} options={brands.map(x => ({ value: x, label: x }))} />
            <CustomSelect minWidth={120} placeholder="All status" value={statusFilter} onChange={setStatusFilter} options={[{value:"published",label:"Published"},{value:"draft",label:"Draft"},{value:"archived",label:"Archived"}]} />
            <button className={utilities("text-button", [1609, "[:where(&).text-button]:[border:0] [:where(&).text-button]:[background:transparent] [:where(&).text-button]:[color:#c81f2a] [:where(&).text-button]:cursor-pointer [:where(&).text-button]:[text-decoration:underline]"], [1984, "[.admin-spec-items_:where(&).text-button]:[margin-top:4px] [.admin-spec-items_:where(&).text-button]:[font-size:12px]"])} onClick={() => { setSearch(""); setCategoryFilter(""); setBrandFilter(""); setStatusFilter(""); }}>Reset</button>
          </div>
          <div className={utilities("crud-table", [584, "[@media_(max-width:_720px)]:[:where(&).crud-table]:overflow-x-auto"], [3343, "[:where(&).crud-table]:[padding:4px_12px]"], [3362, "[@media_(max-width:_720px)]:[:is(:where(&).crud-table)]:[padding:4px_10px] [@media_(max-width:_720px)]:[:is(:where(&).crud-table)]:overflow-visible"], [3406, "[.admin-products-page_:where(&).crud-table]:[width:100%] [.admin-products-page_:where(&).crud-table]:[min-width:0] [.admin-products-page_:where(&).crud-table]:[max-width:100%] [.admin-products-page_:where(&).crud-table]:overflow-x-scroll [.admin-products-page_:where(&).crud-table]:overflow-y-hidden [.admin-products-page_:where(&).crud-table]:[scrollbar-gutter:stable] [.admin-products-page_:where(&).crud-table]:[scrollbar-width:auto] [.admin-products-page_:where(&).crud-table]:[scrollbar-color:#8fa5bf_#eaf0f7] [.admin-products-page_:where(&).crud-table]:[-webkit-overflow-scrolling:touch]"], [3407, "[.admin-products-page_:where(&).crud-table::-webkit-scrollbar]:[height:10px]"], [3408, "[.admin-products-page_:where(&).crud-table::-webkit-scrollbar-track]:[background:#eaf0f7]"], [3409, "[.admin-products-page_:where(&).crud-table::-webkit-scrollbar-thumb]:[border-radius:8px] [.admin-products-page_:where(&).crud-table::-webkit-scrollbar-thumb]:[background:#8fa5bf]"])}>
            {visible.map(product => (
              <article className={utilities("crud-row product-admin-row", [192, "[:where(&).crud-row]:grid [:where(&).crud-row]:items-center [:where(&).crud-row]:[border-bottom:1px_solid_#eef1f5]"], [193, "[:where(&).crud-row:last-child]:[border:0]"], [194, "[:where(&).crud-row_img]:[width:56px] [:where(&).crud-row_img]:[height:52px] [:where(&).crud-row_img]:object-contain [:where(&).crud-row_img]:[mix-blend-mode:multiply] [:where(&).crud-row_img]:[background:#f8fafc] [:where(&).crud-row_img]:[border-radius:6px]"], [922, "[:where(&).product-admin-row]:[grid-template-columns:52px_minmax(180px,_1fr)_90px_75px_80px_100px]"], [1274, "[.warranty-record-table_:where(&).crud-row]:[grid-template-columns:1.5fr_.7fr_1.4fr_65px]"], [3344, "[:is(:where(&).crud-row)]:[min-height:70px] [:is(:where(&).crud-row)]:[grid-template-columns:48px_minmax(0,1fr)_auto_auto_34px_34px] [:is(:where(&).crud-row)]:[gap:12px] [:is(:where(&).crud-row)]:[padding:12px_6px] [:is(:where(&).crud-row)]:[border-bottom-color:#edf1f6] [:is(:where(&).crud-row)]:[transition:background_.15s]"], [3345, "[:where(&).crud-row:hover]:[border-radius:9px] [:where(&).crud-row:hover]:[background:#f8faff]"], [3346, "[:where(&).crud-row_img,_:where(&).crud-empty-image]:[width:48px] [:where(&).crud-row_img,_:where(&).crud-empty-image]:[height:45px] [:where(&).crud-row_img,_:where(&).crud-empty-image]:[border:1px_solid_#e7edf5] [:where(&).crud-row_img,_:where(&).crud-empty-image]:[border-radius:9px] [:where(&).crud-row_img,_:where(&).crud-empty-image]:[background:#f6f8fc]"], [3350, "[:where(&).crud-row_em]:[border-radius:999px] [:where(&).crud-row_em]:[padding:5px_8px] [:where(&).crud-row_em]:[font-size:9px] [:where(&).crud-row_em]:not-italic [:where(&).crud-row_em]:font-extrabold [:where(&).crud-row_em]:capitalize"], [3353, "[:where(&).crud-row_>_span]:[color:#8795a8] [:where(&).crud-row_>_span]:[font-size:10px] [:where(&).crud-row_>_span]:whitespace-nowrap"], [3363, "[@media_(max-width:_720px)]:[:where(&).crud-row]:[min-width:0] [@media_(max-width:_720px)]:[:where(&).crud-row]:[grid-template-columns:42px_minmax(0,1fr)_auto_30px_30px] [@media_(max-width:_720px)]:[:where(&).crud-row]:[gap:8px] [@media_(max-width:_720px)]:[:where(&).crud-row]:[padding:11px_3px]"], [3364, "[@media_(max-width:_720px)]:[:where(&).crud-row_img,_:where(&).crud-empty-image]:[width:42px] [@media_(max-width:_720px)]:[:where(&).crud-row_img,_:where(&).crud-empty-image]:[height:40px]"], [3365, "[@media_(max-width:_720px)]:[:where(&).crud-row_>_span:not(.crud-empty-image)]:hidden"], [3368, "[@media_(max-width:_720px)]:[:where(&).crud-row_em]:[padding:4px_6px] [@media_(max-width:_720px)]:[:where(&).crud-row_em]:[font-size:8px]"], [3410, "[.admin-products-page_:where(&).product-admin-row]:[min-width:820px] [.admin-products-page_:where(&).product-admin-row]:[grid-template-columns:52px_minmax(230px,_1fr)_100px_90px_95px_118px]"])} key={product.id}>
                <img src={product.image || "/images/products/mini-5.jpg"} alt=""/>
                <div className={utilities("crud-product-name", [195, "[:where(&).crud-product-name_strong]:block [:where(&).crud-product-name_strong]:[line-height:1.4]"], [196, "[:where(&).crud-product-name_small]:block [:where(&).crud-product-name_small]:[color:#8590a3] [:where(&).crud-product-name_small]:[margin-top:5px] [:where(&).crud-product-name_small]:whitespace-nowrap [:where(&).crud-product-name_small]:overflow-hidden [:where(&).crud-product-name_small]:text-ellipsis"], [663, "[:is(:where(&).crud-product-name_strong)]:[font-size:12px]"], [664, "[:is(:where(&).crud-product-name_small)]:[font-size:10px]"], [3380, "[.admin-route-content_:where(&).crud-product-name_strong]:[font-size:14px]"], [3381, "[.admin-route-content_:where(&).crud-product-name_small]:[font-size:12px]"], [3413, "[.admin-products-page_:where(&).crud-product-name]:[min-width:0]"], [3414, "[.admin-products-page_:where(&).crud-product-name_strong,_.admin-products-page_:where(&).crud-product-name_small]:overflow-hidden [.admin-products-page_:where(&).crud-product-name_strong,_.admin-products-page_:where(&).crud-product-name_small]:text-ellipsis [.admin-products-page_:where(&).crud-product-name_strong,_.admin-products-page_:where(&).crud-product-name_small]:whitespace-nowrap"], [3422, "[.admin-route-content_:where(&).admin-crud-heading_span,_.admin-route-content_:where(&).crud-form_input,_.admin-route-content_:where(&).crud-form_select,_.admin-route-content_:where(&).crud-form_textarea,_.admin-route-content_:where(&).crud-product-name_strong,_.admin-route-content_:where(&).crud-row-copy_strong]:[font-size:1rem]"])}>
                  <strong>{product.name}</strong>
                  <small>{product.brand} · {product.category}{product.subcategory ? ` › ${product.subcategory}` : ""} · {product.sku || product.slug}</small>
                </div>
                <span className={utilities("crud-price", [197, "[:where(&).crud-price]:[color:var(--red)] [:where(&).crud-price]:font-extrabold"], [665, "[:is(:where(&).crud-price)]:[font-size:13px]"], [3382, "[.admin-route-content_:where(&).crud-price,_.admin-route-content_:where(&).crud-stock,_.admin-route-content_:where(&).crud-status]:[font-size:12px]"], [3411, "[.admin-products-page_.product-admin-row_>_:where(&).crud-price,_.admin-products-page_.product-admin-row_>_:where(&).crud-status,_.admin-products-page_.product-admin-row_>_:where(&).crud-stock]:inline-flex"])}>৳{product.price.toLocaleString("en-BD")}</span>
                <span className={tw(`crud-status ${product.status}`)}>{product.status}</span>
                <span className={tw(`crud-stock ${product.stock < 10 ? "is-low" : ""}`)}>{product.stock} in stock</span>
                <div className={utilities("crud-actions", [202, "[:where(&).crud-actions]:flex [:where(&).crud-actions]:[gap:8px]"], [3412, "[.admin-products-page_.product-admin-row_:where(&).crud-actions]:[min-width:110px]"])}>
                  <Link className={utilities("icon-button", [177, "[:where(&).icon-button]:inline-grid [:where(&).icon-button]:[place-items:center] [:where(&).icon-button]:[border:1px_solid_var(--line)] [:where(&).icon-button]:[border-radius:6px] [:where(&).icon-button]:[background:#fff] [:where(&).icon-button]:[width:34px] [:where(&).icon-button]:[height:34px] [:where(&).icon-button]:[color:#50617b] [:where(&).icon-button]:cursor-pointer"], [178, "[:where(&).icon-button:hover]:[border-color:#8fa5cd] [:where(&).icon-button:hover]:[color:#1d5fc3]"], [179, "[:where(&).icon-button.danger:hover]:[border-color:#efb3b6] [:where(&).icon-button.danger:hover]:[color:var(--red)]"], [1838, "[.admin-media-grid_:where(&).icon-button]:absolute [.admin-media-grid_:where(&).icon-button]:[right:14px] [.admin-media-grid_:where(&).icon-button]:[top:14px] [.admin-media-grid_:where(&).icon-button]:[background:#fff]"], [2633, "[.order-actions_:where(&).icon-button.is-active]:[border-color:#e51f2a] [.order-actions_:where(&).icon-button.is-active]:[color:#e51f2a] [.order-actions_:where(&).icon-button.is-active]:[background:#fff5f5]"], [3354, "[.crud-row_:where(&).icon-button]:[width:30px] [.crud-row_:where(&).icon-button]:[height:30px] [.crud-row_:where(&).icon-button]:[border-color:#e2e9f2] [.crud-row_:where(&).icon-button]:[border-radius:8px]"], [3369, "[@media_(max-width:_720px)]:[.crud-row_:where(&).icon-button]:[width:28px] [@media_(max-width:_720px)]:[.crud-row_:where(&).icon-button]:[height:28px]"])} href={`/products/${product.slug}`}>↗</Link>
                  <button className={utilities("icon-button", [177, "[:where(&).icon-button]:inline-grid [:where(&).icon-button]:[place-items:center] [:where(&).icon-button]:[border:1px_solid_var(--line)] [:where(&).icon-button]:[border-radius:6px] [:where(&).icon-button]:[background:#fff] [:where(&).icon-button]:[width:34px] [:where(&).icon-button]:[height:34px] [:where(&).icon-button]:[color:#50617b] [:where(&).icon-button]:cursor-pointer"], [178, "[:where(&).icon-button:hover]:[border-color:#8fa5cd] [:where(&).icon-button:hover]:[color:#1d5fc3]"], [179, "[:where(&).icon-button.danger:hover]:[border-color:#efb3b6] [:where(&).icon-button.danger:hover]:[color:var(--red)]"], [1838, "[.admin-media-grid_:where(&).icon-button]:absolute [.admin-media-grid_:where(&).icon-button]:[right:14px] [.admin-media-grid_:where(&).icon-button]:[top:14px] [.admin-media-grid_:where(&).icon-button]:[background:#fff]"], [2633, "[.order-actions_:where(&).icon-button.is-active]:[border-color:#e51f2a] [.order-actions_:where(&).icon-button.is-active]:[color:#e51f2a] [.order-actions_:where(&).icon-button.is-active]:[background:#fff5f5]"], [3354, "[.crud-row_:where(&).icon-button]:[width:30px] [.crud-row_:where(&).icon-button]:[height:30px] [.crud-row_:where(&).icon-button]:[border-color:#e2e9f2] [.crud-row_:where(&).icon-button]:[border-radius:8px]"], [3369, "[@media_(max-width:_720px)]:[.crud-row_:where(&).icon-button]:[width:28px] [@media_(max-width:_720px)]:[.crud-row_:where(&).icon-button]:[height:28px]"])} onClick={() => edit(product)}><Pencil size={14}/></button>
                  <button className={utilities("icon-button danger", [177, "[:where(&).icon-button]:inline-grid [:where(&).icon-button]:[place-items:center] [:where(&).icon-button]:[border:1px_solid_var(--line)] [:where(&).icon-button]:[border-radius:6px] [:where(&).icon-button]:[background:#fff] [:where(&).icon-button]:[width:34px] [:where(&).icon-button]:[height:34px] [:where(&).icon-button]:[color:#50617b] [:where(&).icon-button]:cursor-pointer"], [178, "[:where(&).icon-button:hover]:[border-color:#8fa5cd] [:where(&).icon-button:hover]:[color:#1d5fc3]"], [179, "[:where(&).icon-button.danger:hover]:[border-color:#efb3b6] [:where(&).icon-button.danger:hover]:[color:var(--red)]"], [1838, "[.admin-media-grid_:where(&).icon-button]:absolute [.admin-media-grid_:where(&).icon-button]:[right:14px] [.admin-media-grid_:where(&).icon-button]:[top:14px] [.admin-media-grid_:where(&).icon-button]:[background:#fff]"], [2633, "[.order-actions_:where(&).icon-button.is-active]:[border-color:#e51f2a] [.order-actions_:where(&).icon-button.is-active]:[color:#e51f2a] [.order-actions_:where(&).icon-button.is-active]:[background:#fff5f5]"], [2638, "[.order-action-menu_button:where(&).danger]:[color:#e02634] [.order-action-menu_button:where(&).danger]:[border-top:1px_solid_#edf1f6] [.order-action-menu_button:where(&).danger]:[border-radius:0_0_7px_7px] [.order-action-menu_button:where(&).danger]:[margin-top:3px] [.order-action-menu_button:where(&).danger]:[padding-top:11px]"], [2639, "[.order-action-menu_button:where(&).danger:hover]:[background:#fff1f2] [.order-action-menu_button:where(&).danger:hover]:[color:#c81826]"], [3354, "[.crud-row_:where(&).icon-button]:[width:30px] [.crud-row_:where(&).icon-button]:[height:30px] [.crud-row_:where(&).icon-button]:[border-color:#e2e9f2] [.crud-row_:where(&).icon-button]:[border-radius:8px]"], [3369, "[@media_(max-width:_720px)]:[.crud-row_:where(&).icon-button]:[width:28px] [@media_(max-width:_720px)]:[.crud-row_:where(&).icon-button]:[height:28px]"])} onClick={() => void remove(product.id)}><Trash2 size={14}/></button>
                </div>
              </article>
            ))}
            {visible.length === 0 && <div className={utilities("crud-empty", [203, "[:where(&).crud-empty]:[padding:45px_20px] [:where(&).crud-empty]:text-center [:where(&).crud-empty]:[color:#637086] [:where(&).crud-empty]:[font-size:15px]"])}>No products match your search.</div>}
          </div>
        </section>
      </div>

      {currentCropImage && (
        <ImageCropperModal
          key={currentCropImage.source}
          imageSrc={currentCropImage.source}
          aspectRatio={1}
          targetWidth={600}
          targetHeight={600}
          onClose={() => { if (!cropUploadLockRef.current) advanceCropQueue(); }}
          onCropComplete={(blob) => {
            void uploadCurrentCrop(blob);
          }}
        />
      )}
    </section>
  );
}

