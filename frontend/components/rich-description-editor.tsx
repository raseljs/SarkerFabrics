"use client";


import { withTailwindStyle, utilities, resolveClasses } from "@/lib/tailwind";
import {
  AlignLeft, Bold, ChevronDown, ChevronUp, Code2, Eye,
  Film, GripVertical, Heading, Image as ImageIcon, Info, Italic,
  LayoutGrid, List, ListChecks, ListOrdered, Loader2, Minus, PanelLeft,
  Pilcrow, Play, Plus, RotateCcw, Sparkles, Table2, Trash2, Upload, Wand2, Video,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { normalizeDescriptionInput } from "@/lib/rich-description";
import { apiFormRequest, getApiBase } from "@/lib/api";
import { SpecSection } from "./product-description-live";

// Component styling is compiled from these local Tailwind utilities.
const componentUtilities: Record<string, string> = {
  "active": utilities([74, "[.hero-dots_:where(&).active]:[background:#173e89]"], [299, "[.admin-sidebar_a:where(&).active,_:where(&).admin-sidebar_a:hover]:[color:var(--ink)] [.admin-sidebar_a:where(&).active,_:where(&).admin-sidebar_a:hover]:[background:#eef4ff]"], [459, "[.detail-tabs_button:where(&).active]:[background:var(--red)] [.detail-tabs_button:where(&).active]:[color:#fff]"], [466, "[.content-tabs_:where(&).active]:[color:var(--red)] [.content-tabs_:where(&).active]:font-extrabold [.content-tabs_:where(&).active]:[border-top:2px_solid_var(--red)]"], [728, "[:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[background:#f1f4f8] [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[color:var(--ink)] [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:font-bold [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[border-left:3px_solid_#73b2cd] [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[padding-left:16px]"], [741, "[.nav-bar>a:where(&).active,_.nav-bar_:where(&).maintenance-link.active]:[color:var(--red)]"], [742, "[.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[content:''] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:absolute [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[left:0] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[right:0] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[bottom:0] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[height:2px] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[background:var(--red)]"], [774, "[.article-pagination_button:where(&).active]:[border-color:var(--red)] [.article-pagination_button:where(&).active]:[background:var(--red)] [.article-pagination_button:where(&).active]:[color:#fff]"], [843, "[.mega-mode-tabs_button:where(&).active]:[color:#1266cf] [.mega-mode-tabs_button:where(&).active]:[border-bottom-color:#1266cf]"], [932, "[.rich-editor-tabs_button:where(&).active]:[color:#155fc5] [.rich-editor-tabs_button:where(&).active]:[border-bottom-color:#155fc5]"], [992, "[.rde-toggle-row_button:where(&).active]:[background:#eef4ff] [.rde-toggle-row_button:where(&).active]:[border-color:#3f70ce] [.rde-toggle-row_button:where(&).active]:[color:#155fc5]"], [1071, "[:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[border-left-color:#72b6d2] [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[background:#f0f3f7] [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[color:#102952] [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:font-bold [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[outline:0]"], [1120, "[@media_(max-width:_720px)]:[:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[padding-left:5px]"], [1143, "[@media_(max-width:_720px)]:[:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[border-color:#72b6d2] [@media_(max-width:_720px)]:[:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[background:#eef7fb]"], [1369, "[.admin-app-nav_a:where(&).active]:[color:#fff] [.admin-app-nav_a:where(&).active]:[background:linear-gradient(120deg,_#1a7de8_0%,_#1e97f5_100%)] [.admin-app-nav_a:where(&).active]:[box-shadow:0_6px_20px_rgba(22,_100,_220,_.4),_inset_0_1px_0_rgba(255,_255,_255,_.15)] [.admin-app-nav_a:where(&).active]:font-bold"], [1370, "[.admin-app-nav_a:where(&).active_svg]:[color:#e0f0ff] [.admin-app-nav_a:where(&).active_svg]:[opacity:1]"], [1864, "[.hero-slider-dots_button:where(&).active]:[width:10px] [.hero-slider-dots_button:where(&).active]:[background:#1d5fb8]"], [2075, "[.nav-bar>a:where(&).active]:[color:var(--red)]"], [2226, "[.product-space-tabs_button:where(&).active]:[background:#e91b23] [.product-space-tabs_button:where(&).active]:[color:#fff]"], [2411, "[.order-tabs_button:where(&).active]:[color:#0d67e8] [.order-tabs_button:where(&).active]:[border-bottom-color:#0d67e8]"], [2413, "[.order-tabs_:where(&).active_b]:[background:#166cf0] [.order-tabs_:where(&).active_b]:[color:#fff]"], [2498, "[.order-pagination_button:where(&).active]:[background:#0968f5] [.order-pagination_button:where(&).active]:[color:#fff] [.order-pagination_button:where(&).active]:[border-color:#0968f5]"], [2898, "[.product-nav-pill_button:where(&).active]:[background:var(--red)] [.product-nav-pill_button:where(&).active]:[color:#fff]"], [3331, "[.resource-tabs_button:where(&).active]:[color:#fff] [.resource-tabs_button:where(&).active]:[border-color:transparent] [.resource-tabs_button:where(&).active]:[background:linear-gradient(135deg,#145bc6,#277fe3)] [.resource-tabs_button:where(&).active]:[box-shadow:0_5px_12px_rgba(29,100,207,.22)]"]),
  "body": utilities([3684, "[.invoice-admin_.card_:where(&).body]:[padding:10px_15px] [.invoice-admin_.card_:where(&).body]:[font-size:11px] [.invoice-admin_.card_:where(&).body]:[line-height:1.55]"]),
  "bottom": utilities([3693, "[.invoice-admin_:where(&).bottom]:grid [.invoice-admin_:where(&).bottom]:[grid-template-columns:1fr_1fr] [.invoice-admin_:where(&).bottom]:[gap:16px] [.invoice-admin_:where(&).bottom]:[margin-top:13px]"]),
  "button": utilities([62, "[:where(&).button]:[min-height:39px] [:where(&).button]:inline-flex [:where(&).button]:items-center [:where(&).button]:justify-center [:where(&).button]:[gap:7px] [:where(&).button]:[border-radius:4px] [:where(&).button]:[padding:0_17px] [:where(&).button]:font-bold [:where(&).button]:cursor-pointer [:where(&).button]:[border:1px_solid_transparent]"], [280, "[.cart-summary_:where(&).button]:[width:100%] [.cart-summary_:where(&).button]:[margin-top:12px]"], [286, "[.checkout-form>:where(&).button]:[width:max-content] [.checkout-form>:where(&).button]:[margin-top:6px]"], [492, "[.accessory-card_:where(&).button]:[width:100%] [.accessory-card_:where(&).button]:[margin-top:12px] [.accessory-card_:where(&).button]:[border-radius:6px] [.accessory-card_:where(&).button]:text-ellipsis [.accessory-card_:where(&).button]:overflow-hidden [.accessory-card_:where(&).button]:whitespace-nowrap"], [603, "[:is(:where(&).button)]:[font-size:14px]"], [654, "[:is(.accessory-card_:where(&).button)]:[font-size:10px] [:is(.accessory-card_:where(&).button)]:[padding:0_4px] [:is(.accessory-card_:where(&).button)]:[min-height:30px]"], [683, "[@media_(max-width:_720px)]:[:where(&).button,_:where(&).text-link]:[font-size:12px]"], [809, "[.package-card_footer_:where(&).button]:[font-size:11px] [.package-card_footer_:where(&).button]:[min-height:32px] [.package-card_footer_:where(&).button]:[padding:0_13px]"], [818, "[.maintenance-cta_:where(&).button]:[margin-right:15px]"], [837, "[@media_(max-width:_720px)]:[.maintenance-cta_:where(&).button]:[margin:0_0_12px]"], [1225, "[.combo-modal>footer_:where(&).button]:[min-height:36px]"], [1289, "[@media_(max-width:_720px)]:[.combo-modal>footer_:where(&).button]:[width:100%]"], [2383, "[@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:inline-block [@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:[margin-top:15px]"], [2479, "[.reference-toolbar_:where(&).button]:[height:34px] [.reference-toolbar_:where(&).button]:[padding:0_10px] [.reference-toolbar_:where(&).button]:[font-size:10px]"], [2491, "[.order-actions_:where(&).button]:[font-size:9px] [.order-actions_:where(&).button]:[padding:6px_14px]"], [2542, "[.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[height:34px] [.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[font-size:9px]"], [2579, "[.order-confirmation-actions_:where(&).button]:flex [.order-confirmation-actions_:where(&).button]:items-center [.order-confirmation-actions_:where(&).button]:justify-center [.order-confirmation-actions_:where(&).button]:[gap:7px] [.order-confirmation-actions_:where(&).button]:[min-height:43px] [.order-confirmation-actions_:where(&).button]:[text-decoration:none]"], [2587, "[.invoice-actions_:where(&).button]:flex [.invoice-actions_:where(&).button]:items-center [.invoice-actions_:where(&).button]:justify-center [.invoice-actions_:where(&).button]:[gap:6px]"], [2627, "[@media_(max-width:680px)]:[.invoice-actions_:where(&).button]:[flex:1_1_100%]"], [2653, "[.drawer-edit-actions_:where(&).button]:[height:31px] [.drawer-edit-actions_:where(&).button]:[padding:0_11px] [.drawer-edit-actions_:where(&).button]:[font-size:9px]"]),
  "card": utilities([3619, "[.invoice-export_:where(&).card]:[border:1px_solid_#e3eaf3] [.invoice-export_:where(&).card]:[border-radius:10px] [.invoice-export_:where(&).card]:[padding:18px]"], [3620, "[.invoice-export_:where(&).card_h3]:[margin:0_0_10px] [.invoice-export_:where(&).card_h3]:[font-size:13px] [.invoice-export_:where(&).card_h3]:uppercase [.invoice-export_:where(&).card_h3]:[letter-spacing:.08em]"], [3621, "[.invoice-export_:where(&).card_p]:[margin:6px_0] [.invoice-export_:where(&).card_p]:[line-height:1.55] [.invoice-export_:where(&).card_p]:[color:#53657d]"], [3635, "[@media_(max-width:650px)]:[.invoice-export_.meta_:where(&).card]:[margin-bottom:12px]"], [3682, "[.invoice-admin_:where(&).card]:[border:1px_solid_#cfe0f7] [.invoice-admin_:where(&).card]:[border-radius:8px] [.invoice-admin_:where(&).card]:overflow-hidden [.invoice-admin_:where(&).card]:[min-height:106px]"], [3683, "[.invoice-admin_:where(&).card_h3]:[font-size:13px] [.invoice-admin_:where(&).card_h3]:[margin:0] [.invoice-admin_:where(&).card_h3]:[padding:10px_15px] [.invoice-admin_:where(&).card_h3]:[background:#edf5ff] [.invoice-admin_:where(&).card_h3]:[color:#123e90]"]),
  "cards": utilities([3681, "[.invoice-admin_:where(&).cards]:grid [.invoice-admin_:where(&).cards]:[grid-template-columns:1fr_1fr] [.invoice-admin_:where(&).cards]:[gap:12px] [.invoice-admin_:where(&).cards]:[margin:4px_0_12px]"]),
  "current": utilities([2537, "[.timeline-event_i:where(&).current]:[background:#0c67eb]"]),
  "danger": utilities([2638, "[.order-action-menu_button:where(&).danger]:[color:#e02634] [.order-action-menu_button:where(&).danger]:[border-top:1px_solid_#edf1f6] [.order-action-menu_button:where(&).danger]:[border-radius:0_0_7px_7px] [.order-action-menu_button:where(&).danger]:[margin-top:3px] [.order-action-menu_button:where(&).danger]:[padding-top:11px]"], [2639, "[.order-action-menu_button:where(&).danger:hover]:[background:#fff1f2] [.order-action-menu_button:where(&).danger:hover]:[color:#c81826]"]),
  "full": utilities([1233, "[.preorder-form-grid_label:where(&).full]:[grid-column:1_/_-1]"], [1276, "[@media_(max-width:_720px)]:[.preorder-form-grid_label:where(&).full]:[grid-column:auto]"], [1672, "[.checkout-fields_label:where(&).full]:[grid-column:1/-1]"], [1809, "[@media_(max-width:560px)]:[.checkout-fields_label:where(&).full]:[grid-column:auto]"]),
  "icon-button": utilities([177, "[:where(&).icon-button]:inline-grid [:where(&).icon-button]:[place-items:center] [:where(&).icon-button]:[border:1px_solid_var(--line)] [:where(&).icon-button]:[border-radius:6px] [:where(&).icon-button]:[background:#fff] [:where(&).icon-button]:[width:34px] [:where(&).icon-button]:[height:34px] [:where(&).icon-button]:[color:#50617b] [:where(&).icon-button]:cursor-pointer"], [178, "[:where(&).icon-button:hover]:[border-color:#8fa5cd] [:where(&).icon-button:hover]:[color:#1d5fc3]"], [179, "[:where(&).icon-button.danger:hover]:[border-color:#efb3b6] [:where(&).icon-button.danger:hover]:[color:var(--red)]"], [1838, "[.admin-media-grid_:where(&).icon-button]:absolute [.admin-media-grid_:where(&).icon-button]:[right:14px] [.admin-media-grid_:where(&).icon-button]:[top:14px] [.admin-media-grid_:where(&).icon-button]:[background:#fff]"], [2633, "[.order-actions_:where(&).icon-button.is-active]:[border-color:#e51f2a] [.order-actions_:where(&).icon-button.is-active]:[color:#e51f2a] [.order-actions_:where(&).icon-button.is-active]:[background:#fff5f5]"], [3354, "[.crud-row_:where(&).icon-button]:[width:30px] [.crud-row_:where(&).icon-button]:[height:30px] [.crud-row_:where(&).icon-button]:[border-color:#e2e9f2] [.crud-row_:where(&).icon-button]:[border-radius:8px]"], [3369, "[@media_(max-width:_720px)]:[.crud-row_:where(&).icon-button]:[width:28px] [@media_(max-width:_720px)]:[.crud-row_:where(&).icon-button]:[height:28px]"]),
  "items": utilities([3686, "[.invoice-admin_:where(&).items]:[width:100%] [.invoice-admin_:where(&).items]:[border-collapse:collapse] [.invoice-admin_:where(&).items]:[border:1px_solid_#cfe0f7] [.invoice-admin_:where(&).items]:[border-radius:7px] [.invoice-admin_:where(&).items]:overflow-hidden [.invoice-admin_:where(&).items]:[font-size:10px]"], [3687, "[.invoice-admin_:where(&).items_th]:[background:#edf5ff] [.invoice-admin_:where(&).items_th]:[padding:10px] [.invoice-admin_:where(&).items_th]:text-left"], [3688, "[.invoice-admin_:where(&).items_td]:[padding:9px_10px] [.invoice-admin_:where(&).items_td]:[border-top:1px_solid_#dce8f6]"], [3689, "[.invoice-admin_:where(&).items_th:nth-child(n+3),_.invoice-admin_:where(&).items_td:nth-child(n+3)]:text-center"]),
  "line": utilities([3685, "[.invoice-admin_.card_:where(&).line]:grid [.invoice-admin_.card_:where(&).line]:[grid-template-columns:105px_10px_1fr] [.invoice-admin_.card_:where(&).line]:[margin:4px_0]"]),
  "next": utilities([775, "[.article-pagination_button:where(&).next]:inline-flex [.article-pagination_button:where(&).next]:items-center [.article-pagination_button:where(&).next]:[gap:5px] [.article-pagination_button:where(&).next]:[padding-inline:11px]"]),
  "note": utilities([3631, "[.invoice-export_:where(&).note]:[margin-top:16px] [.invoice-export_:where(&).note]:text-center [.invoice-export_:where(&).note]:[color:#7a8797] [.invoice-export_:where(&).note]:[font-size:11px]"], [3694, "[.invoice-admin_:where(&).note]:[background:#f4f8fd] [.invoice-admin_:where(&).note]:[border-radius:7px] [.invoice-admin_:where(&).note]:[padding:13px] [.invoice-admin_:where(&).note]:[font-size:10px] [.invoice-admin_:where(&).note]:[line-height:1.55]"], [3695, "[.invoice-admin_:where(&).note_h3]:[margin:0_0_8px] [.invoice-admin_:where(&).note_h3]:[color:#0e4bc1]"]),
  "optional": utilities([2953, "[.inquiry-field_em:where(&).optional]:[color:#94a3b8] [.inquiry-field_em:where(&).optional]:font-normal"]),
  "page": utilities([3662, "[.invoice-admin_:where(&).page]:[width:794px] [.invoice-admin_:where(&).page]:[min-height:1123px] [.invoice-admin_:where(&).page]:[margin:20px_auto] [.invoice-admin_:where(&).page]:[background:#fff] [.invoice-admin_:where(&).page]:[padding:28px_30px] [.invoice-admin_:where(&).page]:[box-shadow:0_4px_25px_#0a2d6218]"], [3709, "[@media_print]:[.invoice-admin_:where(&).page]:[margin:0] [@media_print]:[.invoice-admin_:where(&).page]:[box-shadow:none] [@media_print]:[.invoice-admin_:where(&).page]:[width:100%] [@media_print]:[.invoice-admin_:where(&).page]:[min-height:auto]"]),
  "pds-itb": utilities([2683, "[:where(&).pds-itb]:[margin-top:40px] [:where(&).pds-itb]:[margin-bottom:40px]"]),
  "product": utilities([3690, "[.invoice-admin_:where(&).product]:flex [.invoice-admin_:where(&).product]:[gap:9px] [.invoice-admin_:where(&).product]:items-center"], [3691, "[.invoice-admin_:where(&).product_img]:[width:54px] [.invoice-admin_:where(&).product_img]:[height:42px] [.invoice-admin_:where(&).product_img]:object-contain [.invoice-admin_:where(&).product_img]:[background:#f3f6fa] [.invoice-admin_:where(&).product_img]:[border-radius:6px] [.invoice-admin_:where(&).product_img]:[padding:3px]"], [3692, "[.invoice-admin_:where(&).product_small]:block [.invoice-admin_:where(&).product_small]:[color:#6f83a5] [.invoice-admin_:where(&).product_small]:[margin-top:3px]"]),
  "product-description-rendered": utilities([942, "[:where(&).product-description-rendered_h1,_:where(&).product-description-rendered_h2,_:where(&).product-description-rendered_h3]:[color:#102952] [:where(&).product-description-rendered_h1,_:where(&).product-description-rendered_h2,_:where(&).product-description-rendered_h3]:[line-height:1.25]"], [943, "[:where(&).product-description-rendered_h2]:[margin:0_0_10px] [:where(&).product-description-rendered_h2]:[font-size:18px]"], [944, "[:where(&).product-description-rendered_p,_:where(&).product-description-rendered_li]:[color:#536783] [:where(&).product-description-rendered_p,_:where(&).product-description-rendered_li]:[font-size:11px] [:where(&).product-description-rendered_p,_:where(&).product-description-rendered_li]:[line-height:1.65]"], [945, "[:where(&).product-description-rendered_ul,_:where(&).product-description-rendered_ol]:[padding-left:20px]"]),
  "rde-add-cat-btn": utilities([2841, "[:where(&).rde-add-cat-btn]:[font-size:0.6875rem] [:where(&).rde-add-cat-btn]:[padding:0.25rem_0.625rem] [:where(&).rde-add-cat-btn]:[border:1px_solid_#e51e2a] [:where(&).rde-add-cat-btn]:[background:white] [:where(&).rde-add-cat-btn]:[color:#e51e2a] [:where(&).rde-add-cat-btn]:[border-radius:0.3125rem] [:where(&).rde-add-cat-btn]:cursor-pointer [:where(&).rde-add-cat-btn]:font-semibold [:where(&).rde-add-cat-btn]:[transition:all_0.15s]"], [2842, "[:where(&).rde-add-cat-btn:hover]:[background:#e51e2a] [:where(&).rde-add-cat-btn:hover]:[color:white]"]),
  "rde-add-row": utilities([1032, "[:where(&).rde-add-row]:inline-flex [:where(&).rde-add-row]:items-center [:where(&).rde-add-row]:[gap:4px] [:where(&).rde-add-row]:[border:1px_dashed_#d0daea] [:where(&).rde-add-row]:[border-radius:5px] [:where(&).rde-add-row]:[padding:5px_10px] [:where(&).rde-add-row]:[color:#64748b] [:where(&).rde-add-row]:[background:transparent] [:where(&).rde-add-row]:cursor-pointer [:where(&).rde-add-row]:[font-size:10px] [:where(&).rde-add-row]:font-semibold [:where(&).rde-add-row]:[justify-self:start] [:where(&).rde-add-row]:[transition:all_0.15s]"], [1033, "[:where(&).rde-add-row:hover]:[border-color:#8eafe0] [:where(&).rde-add-row:hover]:[color:#155fc5] [:where(&).rde-add-row:hover]:[background:#f5f8ff]"]),
  "rde-block": utilities([968, "[:where(&).rde-block]:[border:1px_solid_#dce5f0] [:where(&).rde-block]:[border-radius:8px] [:where(&).rde-block]:[background:#fff] [:where(&).rde-block]:overflow-hidden [:where(&).rde-block]:[transition:box-shadow_0.2s,_border-color_0.2s] [:where(&).rde-block]:animate-[rdeBlockIn_0.25s_ease]"], [969, "[:where(&).rde-block:hover]:[border-color:#b8cce5] [:where(&).rde-block:hover]:[box-shadow:0_2px_8px_#10295208]"], [970, "[:where(&).rde-block.rde-dragging]:[opacity:0.35] [:where(&).rde-block.rde-dragging]:[border-style:dashed]"]),
  "rde-block-actions": utilities([977, "[:where(&).rde-block-actions]:flex [:where(&).rde-block-actions]:[gap:2px]"], [978, "[:where(&).rde-block-actions_button]:[width:24px] [:where(&).rde-block-actions_button]:[height:22px] [:where(&).rde-block-actions_button]:grid [:where(&).rde-block-actions_button]:[place-items:center] [:where(&).rde-block-actions_button]:[border:0] [:where(&).rde-block-actions_button]:[border-radius:4px] [:where(&).rde-block-actions_button]:[color:#8898ad] [:where(&).rde-block-actions_button]:[background:transparent] [:where(&).rde-block-actions_button]:cursor-pointer [:where(&).rde-block-actions_button]:[transition:all_0.15s]"], [979, "[:where(&).rde-block-actions_button:hover]:[background:#e8eef7] [:where(&).rde-block-actions_button:hover]:[color:#49627e]"]),
  "rde-block-body": utilities([981, "[:where(&).rde-block-body]:[padding:10px]"], [982, "[:where(&).rde-block-body_input,_:where(&).rde-block-body_textarea,_:where(&).rde-block-body_select]:[width:100%] [:where(&).rde-block-body_input,_:where(&).rde-block-body_textarea,_:where(&).rde-block-body_select]:[border:1px_solid_#e2e8f0] [:where(&).rde-block-body_input,_:where(&).rde-block-body_textarea,_:where(&).rde-block-body_select]:[border-radius:5px] [:where(&).rde-block-body_input,_:where(&).rde-block-body_textarea,_:where(&).rde-block-body_select]:[padding:6px_8px] [:where(&).rde-block-body_input,_:where(&).rde-block-body_textarea,_:where(&).rde-block-body_select]:[font:inherit]"], [983, "[:is(:where(&).rde-block-body_input),_:is(:where(&).rde-block-body_textarea),_:is(:where(&).rde-block-body_select)]:[font-size:11px] [:is(:where(&).rde-block-body_input),_:is(:where(&).rde-block-body_textarea),_:is(:where(&).rde-block-body_select)]:[color:#1e3a5f] [:is(:where(&).rde-block-body_input),_:is(:where(&).rde-block-body_textarea),_:is(:where(&).rde-block-body_select)]:[outline:0] [:is(:where(&).rde-block-body_input),_:is(:where(&).rde-block-body_textarea),_:is(:where(&).rde-block-body_select)]:[background:#fafcfe] [:is(:where(&).rde-block-body_input),_:is(:where(&).rde-block-body_textarea),_:is(:where(&).rde-block-body_select)]:[transition:border-color_0.15s,_box-shadow_0.15s]"], [984, "[:where(&).rde-block-body_input:focus,_:where(&).rde-block-body_textarea:focus]:[border-color:#4d83d1] [:where(&).rde-block-body_input:focus,_:where(&).rde-block-body_textarea:focus]:[box-shadow:0_0_0_2px_#4d83d110]"], [985, "[:where(&).rde-block-body_select]:[width:auto] [:where(&).rde-block-body_select]:cursor-pointer [:where(&).rde-block-body_select]:[padding-right:24px]"], [986, "[:where(&).rde-block-body_textarea]:[resize:vertical] [:where(&).rde-block-body_textarea]:[line-height:1.5]"]),
  "rde-block-head": utilities([971, "[:where(&).rde-block-head]:flex [:where(&).rde-block-head]:items-center [:where(&).rde-block-head]:[gap:6px] [:where(&).rde-block-head]:[padding:6px_8px] [:where(&).rde-block-head]:[background:linear-gradient(135deg,_#f6f9fd,_#eef3fa)] [:where(&).rde-block-head]:[border-bottom:1px_solid_#e4ebf4]"]),
  "rde-block-type": utilities([975, "[:where(&).rde-block-type]:inline-flex [:where(&).rde-block-type]:items-center [:where(&).rde-block-type]:[gap:5px] [:where(&).rde-block-type]:[font-size:10px] [:where(&).rde-block-type]:font-bold [:where(&).rde-block-type]:[color:#49627e] [:where(&).rde-block-type]:[flex:1]"], [976, "[:where(&).rde-block-type_svg]:[width:13px] [:where(&).rde-block-type_svg]:[height:13px]"]),
  "rde-builder": utilities([946, "[:where(&).rde-builder]:grid [:where(&).rde-builder]:[gap:12px]"]),
  "rde-canvas": utilities([955, "[:where(&).rde-canvas]:[min-height:120px] [:where(&).rde-canvas]:[border:1px_dashed_#d0daea] [:where(&).rde-canvas]:[border-radius:8px] [:where(&).rde-canvas]:[padding:8px] [:where(&).rde-canvas]:[background:#fafcff] [:where(&).rde-canvas]:[transition:border-color_0.2s]"]),
  "rde-drag-handle": utilities([972, "[:where(&).rde-drag-handle]:cursor-grab [:where(&).rde-drag-handle]:[color:#b0bdd0] [:where(&).rde-drag-handle]:grid [:where(&).rde-drag-handle]:[place-items:center] [:where(&).rde-drag-handle]:[transition:color_0.15s]"], [973, "[:where(&).rde-drag-handle:hover]:[color:#7b8da6]"], [974, "[:where(&).rde-drag-handle:active]:cursor-grabbing"]),
  "rde-drop-zone": utilities([962, "[:where(&).rde-drop-zone]:[height:6px] [:where(&).rde-drop-zone]:[border-radius:3px] [:where(&).rde-drop-zone]:[margin:2px_0] [:where(&).rde-drop-zone]:[transition:all_0.15s]"], [963, "[:where(&).rde-drop-zone.rde-drop-active]:[height:4px] [:where(&).rde-drop-zone.rde-drop-active]:[background:linear-gradient(90deg,_#3f70ce,_#6b8fd6)] [:where(&).rde-drop-zone.rde-drop-active]:[margin:6px_0] [:where(&).rde-drop-zone.rde-drop-active]:[box-shadow:0_0_10px_#3f70ce40] [:where(&).rde-drop-zone.rde-drop-active]:animate-[rdeDropPulse_1s_ease_infinite]"]),
  "rde-drop-zone-end": utilities([964, "[:where(&).rde-drop-zone-end]:[min-height:36px] [:where(&).rde-drop-zone-end]:flex [:where(&).rde-drop-zone-end]:items-center [:where(&).rde-drop-zone-end]:justify-center [:where(&).rde-drop-zone-end]:[border:1px_dashed_transparent] [:where(&).rde-drop-zone-end]:[border-radius:6px] [:where(&).rde-drop-zone-end]:[transition:all_0.15s]"], [965, "[:where(&).rde-drop-zone-end_span]:[font-size:9px] [:where(&).rde-drop-zone-end_span]:[color:transparent] [:where(&).rde-drop-zone-end_span]:[transition:color_0.15s]"], [966, "[:where(&).rde-drop-zone-end.rde-drop-active]:[border-color:#3f70ce] [:where(&).rde-drop-zone-end.rde-drop-active]:[background:#eef4ff]"], [967, "[:where(&).rde-drop-zone-end.rde-drop-active_span]:[color:#3f70ce]"]),
  "rde-edit-divider": utilities([1039, "[:where(&).rde-edit-divider]:flex [:where(&).rde-edit-divider]:[gap:12px] [:where(&).rde-edit-divider]:[padding:4px_0]"], [1040, "[:where(&).rde-edit-divider_label]:inline-flex [:where(&).rde-edit-divider_label]:items-center [:where(&).rde-edit-divider_label]:[gap:4px] [:where(&).rde-edit-divider_label]:[font-size:11px] [:where(&).rde-edit-divider_label]:[color:#49627e] [:where(&).rde-edit-divider_label]:cursor-pointer"]),
  "rde-edit-grid": utilities([1010, "[:where(&).rde-edit-grid]:grid [:where(&).rde-edit-grid]:[gap:8px]"]),
  "rde-edit-heading": utilities([1018, "[:where(&).rde-edit-heading]:items-center"], [1019, "[:where(&).rde-edit-heading_select]:text-center"], [2156, "[:is(:where(&).rde-edit-heading)]:flex [:is(:where(&).rde-edit-heading)]:flex-col [:is(:where(&).rde-edit-heading)]:[gap:6px]"], [2158, "[:is(:where(&).rde-edit-heading_select)]:[width:160px] [:is(:where(&).rde-edit-heading_select)]:[flex-shrink:0] [:is(:where(&).rde-edit-heading_select)]:font-semibold"], [2159, "[:where(&).rde-edit-heading_input]:[flex:1] [:where(&).rde-edit-heading_input]:font-bold [:where(&).rde-edit-heading_input]:[font-size:13px]"]),
  "rde-edit-hero": utilities([994, "[:where(&).rde-edit-hero]:grid [:where(&).rde-edit-hero]:[gap:6px]"]),
  "rde-edit-image": utilities([1020, "[:where(&).rde-edit-image]:grid [:where(&).rde-edit-image]:[gap:6px]"]),
  "rde-edit-image-row": utilities([1021, "[:where(&).rde-edit-image-row]:grid [:where(&).rde-edit-image-row]:[grid-template-columns:1fr_1fr] [:where(&).rde-edit-image-row]:[gap:6px]"], [1539, "[@media_(max-width:_720px)]:[:where(&).rde-edit-image-row]:[grid-template-columns:1fr]"]),
  "rde-edit-info": utilities([1037, "[:where(&).rde-edit-info]:grid [:where(&).rde-edit-info]:[gap:6px]"], [1038, "[:where(&).rde-edit-info_select]:[width:auto] [:where(&).rde-edit-info_select]:[justify-self:start]"]),
  "rde-edit-list": utilities([1023, "[:where(&).rde-edit-list,_:where(&).rde-edit-table]:grid [:where(&).rde-edit-list,_:where(&).rde-edit-table]:[gap:4px]"]),
  "rde-edit-para": utilities([2160, "[:where(&).rde-edit-para]:flex [:where(&).rde-edit-para]:flex-col [:where(&).rde-edit-para]:[gap:6px]"]),
  "rde-edit-showcase": utilities([997, "[:where(&).rde-edit-showcase]:grid [:where(&).rde-edit-showcase]:[gap:6px]"]),
  "rde-edit-split": utilities([1008, "[:where(&).rde-edit-split]:grid [:where(&).rde-edit-split]:[gap:6px]"]),
  "rde-edit-table": utilities([1023, "[:where(&).rde-edit-list,_:where(&).rde-edit-table]:grid [:where(&).rde-edit-list,_:where(&).rde-edit-table]:[gap:4px]"]),
  "rde-edit-text": utilities([2161, "[:where(&).rde-edit-text]:[width:100%] [:where(&).rde-edit-text]:[min-height:60px]"]),
  "rde-edit-video": utilities([1034, "[:where(&).rde-edit-video]:grid [:where(&).rde-edit-video]:[gap:8px]"]),
  "rde-empty": utilities([956, "[:where(&).rde-empty]:flex [:where(&).rde-empty]:flex-col [:where(&).rde-empty]:items-center [:where(&).rde-empty]:justify-center [:where(&).rde-empty]:[gap:6px] [:where(&).rde-empty]:[min-height:140px] [:where(&).rde-empty]:[color:#94a3b8] [:where(&).rde-empty]:text-center [:where(&).rde-empty]:[border-radius:6px] [:where(&).rde-empty]:[padding:24px] [:where(&).rde-empty]:[transition:all_0.2s]"], [957, "[:where(&).rde-empty_svg]:[opacity:0.35]"], [958, "[:where(&).rde-empty_strong]:[font-size:12px] [:where(&).rde-empty_strong]:[color:#64748b]"], [959, "[:where(&).rde-empty_span]:[font-size:10px]"], [960, "[:where(&).rde-empty.rde-drop-active]:[background:#eef4ff] [:where(&).rde-empty.rde-drop-active]:[border:2px_dashed_#3f70ce] [:where(&).rde-empty.rde-drop-active]:[color:#155fc5]"], [961, "[:where(&).rde-empty.rde-drop-active_svg]:[opacity:0.7]"]),
  "rde-field-label": utilities([2170, "[:where(&).rde-field-label]:[font-size:0.6875rem] [:where(&).rde-field-label]:font-semibold [:where(&).rde-field-label]:[color:#5a6a7a] [:where(&).rde-field-label]:uppercase [:where(&).rde-field-label]:[letter-spacing:0.01875rem] [:where(&).rde-field-label]:[margin-bottom:0.125rem] [:where(&).rde-field-label]:block"]),
  "rde-format-group": utilities([2163, "[:where(&).rde-format-group]:flex [:where(&).rde-format-group]:items-center [:where(&).rde-format-group]:[gap:0.375rem]"]),
  "rde-format-label": utilities([2164, "[:where(&).rde-format-label]:[font-size:0.625rem] [:where(&).rde-format-label]:font-semibold [:where(&).rde-format-label]:uppercase [:where(&).rde-format-label]:[color:#94a3b8] [:where(&).rde-format-label]:[letter-spacing:0.03125rem] [:where(&).rde-format-label]:whitespace-nowrap"]),
  "rde-format-pill": utilities([2167, "[:where(&).rde-format-pill]:[font-size:0.6875rem] [:where(&).rde-format-pill]:[padding:0.1875rem_0.5rem] [:where(&).rde-format-pill]:[border:1px_solid_#d1d9e6] [:where(&).rde-format-pill]:[border-radius:0.3125rem] [:where(&).rde-format-pill]:[background:white] [:where(&).rde-format-pill]:[color:#5a6a7a] [:where(&).rde-format-pill]:cursor-pointer [:where(&).rde-format-pill]:[height:1.75rem] [:where(&).rde-format-pill]:[transition:all_0.15s] [:where(&).rde-format-pill]:whitespace-nowrap"], [2168, "[:where(&).rde-format-pill:hover]:[background:#f1f5f9] [:where(&).rde-format-pill:hover]:[border-color:#94a3b8]"], [2169, "[:where(&).rde-format-pill.active]:[background:#1a4f7b] [:where(&).rde-format-pill.active]:[border-color:#1a4f7b] [:where(&).rde-format-pill.active]:[color:white]"]),
  "rde-format-pills": utilities([2166, "[:where(&).rde-format-pills]:flex [:where(&).rde-format-pills]:[gap:0.1875rem]"]),
  "rde-format-select": utilities([2165, "[:where(&).rde-format-select]:[font-size:0.75rem] [:where(&).rde-format-select]:[padding:0.1875rem_0.375rem] [:where(&).rde-format-select]:[border:1px_solid_#d1d9e6] [:where(&).rde-format-select]:[border-radius:0.3125rem] [:where(&).rde-format-select]:[background:white] [:where(&).rde-format-select]:[color:#374151] [:where(&).rde-format-select]:cursor-pointer [:where(&).rde-format-select]:[height:1.75rem] [:where(&).rde-format-select]:[width:auto]"]),
  "rde-grid-card": utilities([1014, "[:where(&).rde-grid-card]:grid [:where(&).rde-grid-card]:[gap:4px] [:where(&).rde-grid-card]:[padding:8px] [:where(&).rde-grid-card]:[border:1px_solid_#e2e8f0] [:where(&).rde-grid-card]:[border-radius:7px] [:where(&).rde-grid-card]:[background:#f8fafc] [:where(&).rde-grid-card]:relative"]),
  "rde-grid-card-thumb": utilities([1017, "[:where(&).rde-grid-card-thumb]:[width:100%] [:where(&).rde-grid-card-thumb]:[height:52px] [:where(&).rde-grid-card-thumb]:object-cover [:where(&).rde-grid-card-thumb]:[border-radius:4px] [:where(&).rde-grid-card-thumb]:[border:1px_solid_#e2e8f0]"]),
  "rde-grid-card-x": utilities([1015, "[:where(&).rde-grid-card-x]:absolute [:where(&).rde-grid-card-x]:[top:4px] [:where(&).rde-grid-card-x]:[right:4px] [:where(&).rde-grid-card-x]:[width:20px] [:where(&).rde-grid-card-x]:[height:20px] [:where(&).rde-grid-card-x]:grid [:where(&).rde-grid-card-x]:[place-items:center] [:where(&).rde-grid-card-x]:[border:0] [:where(&).rde-grid-card-x]:[border-radius:4px] [:where(&).rde-grid-card-x]:[color:#94a3b8] [:where(&).rde-grid-card-x]:[background:transparent] [:where(&).rde-grid-card-x]:cursor-pointer [:where(&).rde-grid-card-x]:[font-size:13px] [:where(&).rde-grid-card-x]:[transition:all_0.15s] [:where(&).rde-grid-card-x]:[z-index:1]"], [1016, "[:where(&).rde-grid-card-x:hover]:[background:#fde8e8] [:where(&).rde-grid-card-x:hover]:[color:#dc2626]"]),
  "rde-grid-cards": utilities([1013, "[:where(&).rde-grid-cards]:grid [:where(&).rde-grid-cards]:[grid-template-columns:1fr_1fr] [:where(&).rde-grid-cards]:[gap:6px]"], [1540, "[@media_(max-width:_720px)]:[:where(&).rde-grid-cards]:[grid-template-columns:1fr]"]),
  "rde-grid-count": utilities([1012, "[:where(&).rde-grid-count]:[font-size:9px] [:where(&).rde-grid-count]:[color:#8898ad] [:where(&).rde-grid-count]:font-semibold"]),
  "rde-grid-top": utilities([1011, "[:where(&).rde-grid-top]:flex [:where(&).rde-grid-top]:items-center [:where(&).rde-grid-top]:justify-between"]),
  "rde-heading-top": utilities([2157, "[:where(&).rde-heading-top]:flex [:where(&).rde-heading-top]:[gap:6px] [:where(&).rde-heading-top]:items-center"]),
  "rde-hero-thumb": utilities([995, "[:where(&).rde-hero-thumb]:[width:100%] [:where(&).rde-hero-thumb]:[height:80px] [:where(&).rde-hero-thumb]:[border-radius:6px] [:where(&).rde-hero-thumb]:[background-size:cover] [:where(&).rde-hero-thumb]:[background-position:center] [:where(&).rde-hero-thumb]:flex [:where(&).rde-hero-thumb]:items-end [:where(&).rde-hero-thumb]:justify-start [:where(&).rde-hero-thumb]:overflow-hidden"]),
  "rde-hero-thumb-label": utilities([996, "[:where(&).rde-hero-thumb-label]:[padding:3px_8px] [:where(&).rde-hero-thumb-label]:[background:rgba(0,_0,_0,_0.55)] [:where(&).rde-hero-thumb-label]:[color:#fff] [:where(&).rde-hero-thumb-label]:[font-size:8px] [:where(&).rde-hero-thumb-label]:font-bold [:where(&).rde-hero-thumb-label]:[border-radius:0_4px_0_0]"]),
  "rde-image-preview": utilities([1022, "[:where(&).rde-image-preview]:[width:100%] [:where(&).rde-image-preview]:[max-height:120px] [:where(&).rde-image-preview]:object-cover [:where(&).rde-image-preview]:[border-radius:6px] [:where(&).rde-image-preview]:[margin-top:4px] [:where(&).rde-image-preview]:[border:1px_solid_#e2e8f0]"]),
  "rde-img-upload": utilities([998, "[:where(&).rde-img-upload]:grid [:where(&).rde-img-upload]:[gap:3px]"]),
  "rde-img-upload-row": utilities([999, "[:where(&).rde-img-upload-row]:flex [:where(&).rde-img-upload-row]:[gap:4px] [:where(&).rde-img-upload-row]:items-center"], [1000, "[:where(&).rde-img-upload-row_input[type='text'],_:where(&).rde-img-upload-row_input:not([type])]:[flex:1]"]),
  "rde-input-lg": utilities([987, "[:where(&).rde-input-lg]:font-bold! [:where(&).rde-input-lg]:[font-size:13px]!"]),
  "rde-input-sm-bold": utilities([988, "[:where(&).rde-input-sm-bold]:font-semibold!"]),
  "rde-list-bullet": utilities([1026, "[:where(&).rde-list-bullet]:[width:18px] [:where(&).rde-list-bullet]:text-center [:where(&).rde-list-bullet]:[color:#10b981] [:where(&).rde-list-bullet]:font-bold [:where(&).rde-list-bullet]:[font-size:11px] [:where(&).rde-list-bullet]:[flex-shrink:0]"]),
  "rde-list-item": utilities([1024, "[:where(&).rde-list-item,_:where(&).rde-table-row]:flex [:where(&).rde-list-item,_:where(&).rde-table-row]:[gap:4px] [:where(&).rde-list-item,_:where(&).rde-table-row]:items-center"], [1025, "[:where(&).rde-list-item_input,_:where(&).rde-table-row_input]:[flex:1]"], [1030, "[:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[width:22px] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[height:22px] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:grid [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[place-items:center] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[border:0] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[border-radius:4px] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[color:#94a3b8] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[background:transparent] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:cursor-pointer [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[flex-shrink:0] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[font-size:14px] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[transition:all_0.15s]"], [1031, "[:where(&).rde-list-item_button:hover,_:where(&).rde-table-row_button:hover]:[background:#fde8e8] [:where(&).rde-list-item_button:hover,_:where(&).rde-table-row_button:hover]:[color:#dc2626]"]),
  "rde-palette": utilities([947, "[:where(&).rde-palette]:[background:linear-gradient(135deg,_#f0f4fa,_#e8eef7)] [:where(&).rde-palette]:[border-radius:8px] [:where(&).rde-palette]:[padding:12px] [:where(&).rde-palette]:[border:1px_solid_#d6e1ef]"]),
  "rde-palette-grid": utilities([950, "[:where(&).rde-palette-grid]:grid [:where(&).rde-palette-grid]:[grid-template-columns:repeat(6,_1fr)] [:where(&).rde-palette-grid]:[gap:5px]"], [1538, "[@media_(max-width:_720px)]:[:where(&).rde-palette-grid]:[grid-template-columns:repeat(3,_1fr)]"]),
  "rde-palette-item": utilities([951, "[:where(&).rde-palette-item]:flex [:where(&).rde-palette-item]:flex-col [:where(&).rde-palette-item]:items-center [:where(&).rde-palette-item]:[gap:3px] [:where(&).rde-palette-item]:[padding:8px_3px] [:where(&).rde-palette-item]:[border:1px_solid_#d6e1ef] [:where(&).rde-palette-item]:[border-radius:7px] [:where(&).rde-palette-item]:[background:#fff] [:where(&).rde-palette-item]:[color:#49627e] [:where(&).rde-palette-item]:cursor-grab [:where(&).rde-palette-item]:[font-size:8.5px] [:where(&).rde-palette-item]:font-semibold [:where(&).rde-palette-item]:[transition:all_0.18s] [:where(&).rde-palette-item]:[user-select:none]"], [952, "[:where(&).rde-palette-item:hover]:[border-color:#8eafe0] [:where(&).rde-palette-item:hover]:[color:#155fc5] [:where(&).rde-palette-item:hover]:[background:#f0f5ff] [:where(&).rde-palette-item:hover]:[transform:translateY(-1px)] [:where(&).rde-palette-item:hover]:[box-shadow:0_3px_8px_#155fc510]"], [953, "[:where(&).rde-palette-item:active]:cursor-grabbing [:where(&).rde-palette-item:active]:[transform:scale(0.96)]"], [954, "[:where(&).rde-palette-item_svg]:[opacity:0.8]"]),
  "rde-palette-label": utilities([949, "[:where(&).rde-palette-label]:block [:where(&).rde-palette-label]:[font-size:8px] [:where(&).rde-palette-label]:font-extrabold [:where(&).rde-palette-label]:[color:#8898ad] [:where(&).rde-palette-label]:uppercase [:where(&).rde-palette-label]:[letter-spacing:0.8px] [:where(&).rde-palette-label]:[margin-bottom:2px]"]),
  "rde-palette-sections": utilities([948, "[:where(&).rde-palette-sections]:grid [:where(&).rde-palette-sections]:[gap:8px]"]),
  "rde-remove": utilities([980, "[.rde-block-actions_:where(&).rde-remove:hover]:[background:#fde8e8] [.rde-block-actions_:where(&).rde-remove:hover]:[color:#dc2626]"]),
  "rde-spec-cat-pills": utilities([2843, "[:where(&).rde-spec-cat-pills]:flex [:where(&).rde-spec-cat-pills]:flex-wrap [:where(&).rde-spec-cat-pills]:[gap:6px] [:where(&).rde-spec-cat-pills]:[min-height:26px]"]),
  "rde-spec-cat-tag": utilities([2844, "[:where(&).rde-spec-cat-tag]:inline-flex [:where(&).rde-spec-cat-tag]:items-center [:where(&).rde-spec-cat-tag]:[gap:4px] [:where(&).rde-spec-cat-tag]:[padding:3px_8px_3px_10px] [:where(&).rde-spec-cat-tag]:[background:#e51e2a15] [:where(&).rde-spec-cat-tag]:[border:1px_solid_#e51e2a40] [:where(&).rde-spec-cat-tag]:[border-radius:999px] [:where(&).rde-spec-cat-tag]:[font-size:12px] [:where(&).rde-spec-cat-tag]:font-medium [:where(&).rde-spec-cat-tag]:[color:#c0161f]"], [2845, "[:where(&).rde-spec-cat-tag_button]:[background:none] [:where(&).rde-spec-cat-tag_button]:[border:none] [:where(&).rde-spec-cat-tag_button]:cursor-pointer [:where(&).rde-spec-cat-tag_button]:[color:#e51e2a] [:where(&).rde-spec-cat-tag_button]:[font-size:14px] [:where(&).rde-spec-cat-tag_button]:[line-height:1] [:where(&).rde-spec-cat-tag_button]:[padding:0] [:where(&).rde-spec-cat-tag_button]:flex [:where(&).rde-spec-cat-tag_button]:items-center"]),
  "rde-spec-cats": utilities([2839, "[:where(&).rde-spec-cats]:[padding:0.625rem_0.75rem] [:where(&).rde-spec-cats]:[background:#f8fafc] [:where(&).rde-spec-cats]:[border:1px_solid_#e2e8f0] [:where(&).rde-spec-cats]:[border-radius:0.5rem] [:where(&).rde-spec-cats]:[margin-bottom:0.625rem]"]),
  "rde-spec-cats-header": utilities([2840, "[:where(&).rde-spec-cats-header]:flex [:where(&).rde-spec-cats-header]:justify-between [:where(&).rde-spec-cats-header]:items-center [:where(&).rde-spec-cats-header]:[margin-bottom:0.5rem]"]),
  "rde-spin": utilities([1006, "[:where(&).rde-spin]:animate-[rdeSpin_0.8s_linear_infinite]"]),
  "rde-split-thumb": utilities([1009, "[:where(&).rde-split-thumb]:[width:100%] [:where(&).rde-split-thumb]:[max-height:80px] [:where(&).rde-split-thumb]:object-cover [:where(&).rde-split-thumb]:[border-radius:6px] [:where(&).rde-split-thumb]:[border:1px_solid_#e2e8f0]"]),
  "rde-table-header": utilities([1027, "[:where(&).rde-table-header]:flex [:where(&).rde-table-header]:[gap:4px] [:where(&).rde-table-header]:[padding:0_0_4px] [:where(&).rde-table-header]:[border-bottom:1px_solid_#e8edf4] [:where(&).rde-table-header]:[margin-bottom:4px]"], [1028, "[:where(&).rde-table-header_span]:[flex:1] [:where(&).rde-table-header_span]:[font-size:9px] [:where(&).rde-table-header_span]:font-bold [:where(&).rde-table-header_span]:[color:#8898ad] [:where(&).rde-table-header_span]:uppercase"], [1029, "[:where(&).rde-table-header_span:last-child]:[width:22px] [:where(&).rde-table-header_span:last-child]:[flex:0_0_22px]"]),
  "rde-table-row": utilities([1024, "[:where(&).rde-list-item,_:where(&).rde-table-row]:flex [:where(&).rde-list-item,_:where(&).rde-table-row]:[gap:4px] [:where(&).rde-list-item,_:where(&).rde-table-row]:items-center"], [1025, "[:where(&).rde-list-item_input,_:where(&).rde-table-row_input]:[flex:1]"], [1030, "[:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[width:22px] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[height:22px] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:grid [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[place-items:center] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[border:0] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[border-radius:4px] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[color:#94a3b8] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[background:transparent] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:cursor-pointer [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[flex-shrink:0] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[font-size:14px] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[transition:all_0.15s]"], [1031, "[:where(&).rde-list-item_button:hover,_:where(&).rde-table-row_button:hover]:[background:#fde8e8] [:where(&).rde-list-item_button:hover,_:where(&).rde-table-row_button:hover]:[color:#dc2626]"]),
  "rde-table-row-4": utilities([2846, "[:where(&).rde-table-row-4]:[grid-template-columns:1fr_1fr_auto_auto]!"], [2847, "[:where(&).rde-table-row-4_select]:[font-size:12px] [:where(&).rde-table-row-4_select]:[padding:4px_6px] [:where(&).rde-table-row-4_select]:[border:1px_solid_#d1d9e6] [:where(&).rde-table-row-4_select]:[border-radius:5px] [:where(&).rde-table-row-4_select]:[background:white] [:where(&).rde-table-row-4_select]:[height:32px]"]),
  "rde-text-format-bar": utilities([2162, "[:where(&).rde-text-format-bar]:flex [:where(&).rde-text-format-bar]:flex-wrap [:where(&).rde-text-format-bar]:[gap:0.75rem] [:where(&).rde-text-format-bar]:items-center [:where(&).rde-text-format-bar]:[padding:0.5rem_0.625rem] [:where(&).rde-text-format-bar]:[background:#f8fafc] [:where(&).rde-text-format-bar]:[border:1px_solid_#e2e8f0] [:where(&).rde-text-format-bar]:[border-radius:0.4375rem] [:where(&).rde-text-format-bar]:[margin-top:0.25rem]"]),
  "rde-toggle-label": utilities([990, "[:where(&).rde-toggle-label]:[font-size:10px] [:where(&).rde-toggle-label]:font-bold [:where(&).rde-toggle-label]:[color:#64748b] [:where(&).rde-toggle-label]:[margin-right:4px] [:where(&).rde-toggle-label]:whitespace-nowrap"]),
  "rde-toggle-row": utilities([989, "[:where(&).rde-toggle-row]:flex [:where(&).rde-toggle-row]:items-center [:where(&).rde-toggle-row]:[gap:4px]"], [991, "[:where(&).rde-toggle-row_button]:[padding:4px_10px] [:where(&).rde-toggle-row_button]:[border:1px_solid_#d6e1ef] [:where(&).rde-toggle-row_button]:[border-radius:5px] [:where(&).rde-toggle-row_button]:[background:#fff] [:where(&).rde-toggle-row_button]:[font-size:10px] [:where(&).rde-toggle-row_button]:font-semibold [:where(&).rde-toggle-row_button]:cursor-pointer [:where(&).rde-toggle-row_button]:[color:#64748b] [:where(&).rde-toggle-row_button]:[transition:all_0.15s]"], [993, "[:where(&).rde-toggle-row_button:hover:not(.active)]:[background:#f5f8ff]"]),
  "rde-upload-btn": utilities([1001, "[:where(&).rde-upload-btn]:inline-flex [:where(&).rde-upload-btn]:items-center [:where(&).rde-upload-btn]:[gap:4px] [:where(&).rde-upload-btn]:[padding:6px_10px] [:where(&).rde-upload-btn]:[border:1px_solid_#d6e1ef] [:where(&).rde-upload-btn]:[border-radius:5px] [:where(&).rde-upload-btn]:[background:linear-gradient(135deg,_#f0f5ff,_#e8eef7)] [:where(&).rde-upload-btn]:[color:#3f70ce] [:where(&).rde-upload-btn]:[font-size:10px] [:where(&).rde-upload-btn]:font-bold [:where(&).rde-upload-btn]:cursor-pointer [:where(&).rde-upload-btn]:whitespace-nowrap [:where(&).rde-upload-btn]:[transition:all_0.15s] [:where(&).rde-upload-btn]:[flex-shrink:0]"], [1002, "[:where(&).rde-upload-btn:hover:not(:disabled)]:[background:linear-gradient(135deg,_#e0eaff,_#d0dffa)] [:where(&).rde-upload-btn:hover:not(:disabled)]:[border-color:#8eafe0] [:where(&).rde-upload-btn:hover:not(:disabled)]:[color:#155fc5] [:where(&).rde-upload-btn:hover:not(:disabled)]:[transform:translateY(-1px)] [:where(&).rde-upload-btn:hover:not(:disabled)]:[box-shadow:0_2px_8px_#3f70ce18]"], [1003, "[:where(&).rde-upload-btn:active:not(:disabled)]:[transform:scale(0.97)]"], [1004, "[:where(&).rde-upload-btn:disabled]:[opacity:0.7] [:where(&).rde-upload-btn:disabled]:[cursor:wait]"]),
  "rde-upload-error": utilities([1007, "[:where(&).rde-upload-error]:[font-size:10px] [:where(&).rde-upload-error]:[color:#dc2626] [:where(&).rde-upload-error]:font-semibold"]),
  "rde-uploading": utilities([1005, "[:where(&).rde-uploading]:[background:linear-gradient(135deg,_#ecfdf5,_#d1fae5)]! [:where(&).rde-uploading]:[border-color:#10b981]! [:where(&).rde-uploading]:[color:#059669]!"]),
  "rich-description-editor": utilities([924, "[:where(&).rich-description-editor]:grid [:where(&).rich-description-editor]:[gap:10px] [:where(&).rich-description-editor]:[border:1px_solid_#dce5f0] [:where(&).rich-description-editor]:[border-radius:8px] [:where(&).rich-description-editor]:[padding:12px] [:where(&).rich-description-editor]:[background:linear-gradient(145deg,_#fbfdff,_#f5f8fc)]"]),
  "rich-editor-heading": utilities([925, "[:where(&).rich-editor-heading]:flex [:where(&).rich-editor-heading]:items-start [:where(&).rich-editor-heading]:justify-between [:where(&).rich-editor-heading]:[gap:10px]"], [926, "[:where(&).rich-editor-heading_strong]:block [:where(&).rich-editor-heading_strong]:[color:#172f53] [:where(&).rich-editor-heading_strong]:[font-size:12px]"], [927, "[:where(&).rich-editor-heading_small]:block [:where(&).rich-editor-heading_small]:[margin-top:4px] [:where(&).rich-editor-heading_small]:[color:#74839a] [:where(&).rich-editor-heading_small]:[font-size:9px] [:where(&).rich-editor-heading_small]:[line-height:1.4]"], [1536, "[@media_(max-width:_720px)]:[:where(&).rich-editor-heading]:flex-col"]),
  "rich-editor-help": utilities([939, "[:where(&).rich-editor-help]:[margin:0] [:where(&).rich-editor-help]:[color:#72829a] [:where(&).rich-editor-help]:[font-size:9px]"], [940, "[:where(&).rich-editor-help_code]:[color:#155fc5]"]),
  "rich-editor-preview": utilities([941, "[:where(&).rich-editor-preview]:[min-height:135px] [:where(&).rich-editor-preview]:overflow-auto [:where(&).rich-editor-preview]:[border:1px_solid_#d7e0ec] [:where(&).rich-editor-preview]:[border-radius:6px] [:where(&).rich-editor-preview]:[padding:13px] [:where(&).rich-editor-preview]:[background:#fff]"]),
  "rich-editor-reset": utilities([928, "[:where(&).rich-editor-reset]:inline-flex [:where(&).rich-editor-reset]:items-center [:where(&).rich-editor-reset]:[gap:5px] [:where(&).rich-editor-reset]:[border:1px_solid_#d6e1ef] [:where(&).rich-editor-reset]:[border-radius:5px] [:where(&).rich-editor-reset]:[padding:6px_8px] [:where(&).rich-editor-reset]:[color:#2767c4] [:where(&).rich-editor-reset]:[background:#fff] [:where(&).rich-editor-reset]:cursor-pointer [:where(&).rich-editor-reset]:[font-size:9px] [:where(&).rich-editor-reset]:[font-weight:750] [:where(&).rich-editor-reset]:whitespace-nowrap"], [1537, "[@media_(max-width:_720px)]:[:where(&).rich-editor-reset]:[justify-self:start]"]),
  "rich-editor-source": utilities([933, "[:where(&).rich-editor-source]:grid [:where(&).rich-editor-source]:[gap:7px]"], [937, "[:where(&).rich-editor-source_textarea]:[min-height:135px] [:where(&).rich-editor-source_textarea]:[width:100%] [:where(&).rich-editor-source_textarea]:[resize:vertical] [:where(&).rich-editor-source_textarea]:[border:1px_solid_#d7e0ec] [:where(&).rich-editor-source_textarea]:[border-radius:6px] [:where(&).rich-editor-source_textarea]:[padding:10px] [:where(&).rich-editor-source_textarea]:[color:#18304f] [:where(&).rich-editor-source_textarea]:[background:#fff] [:where(&).rich-editor-source_textarea]:[font:11px/1.55_ui-monospace,_SFMono-Regular,_Menlo,_monospace] [:where(&).rich-editor-source_textarea]:[outline:0]"], [938, "[:where(&).rich-editor-source_textarea:focus]:[border-color:#4d83d1] [:where(&).rich-editor-source_textarea:focus]:[box-shadow:0_0_0_3px_#4d83d114]"]),
  "rich-editor-tabs": utilities([929, "[:where(&).rich-editor-tabs]:flex [:where(&).rich-editor-tabs]:[gap:4px] [:where(&).rich-editor-tabs]:[border-bottom:1px_solid_#e0e7f0]"], [930, "[:where(&).rich-editor-tabs_button]:inline-flex [:where(&).rich-editor-tabs_button]:items-center [:where(&).rich-editor-tabs_button]:[gap:5px] [:where(&).rich-editor-tabs_button]:[border:0]"], [931, "[:is(:where(&).rich-editor-tabs_button)]:[border-bottom:2px_solid_transparent] [:is(:where(&).rich-editor-tabs_button)]:[padding:7px_8px] [:is(:where(&).rich-editor-tabs_button)]:[color:#64748b] [:is(:where(&).rich-editor-tabs_button)]:[background:transparent] [:is(:where(&).rich-editor-tabs_button)]:cursor-pointer [:is(:where(&).rich-editor-tabs_button)]:[font-size:10px] [:is(:where(&).rich-editor-tabs_button)]:[font-weight:750]"]),
  "rich-editor-toolbar": utilities([934, "[:where(&).rich-editor-toolbar]:flex [:where(&).rich-editor-toolbar]:[gap:5px]"], [935, "[:where(&).rich-editor-toolbar_button]:[width:27px] [:where(&).rich-editor-toolbar_button]:[height:25px] [:where(&).rich-editor-toolbar_button]:grid [:where(&).rich-editor-toolbar_button]:[place-items:center] [:where(&).rich-editor-toolbar_button]:[border:1px_solid_#dce4ef] [:where(&).rich-editor-toolbar_button]:[border-radius:4px] [:where(&).rich-editor-toolbar_button]:[color:#49627e] [:where(&).rich-editor-toolbar_button]:[background:#fff] [:where(&).rich-editor-toolbar_button]:cursor-pointer"], [936, "[:where(&).rich-editor-toolbar_button:hover]:[border-color:#8eafe0] [:where(&).rich-editor-toolbar_button:hover]:[color:#155fc5]"]),
  "row": utilities([3622, "[.invoice-export_.card_:where(&).row]:flex [.invoice-export_.card_:where(&).row]:justify-between [.invoice-export_.card_:where(&).row]:[gap:12px]"], [3623, "[.invoice-export_.card_:where(&).row_b]:capitalize"]),
  "spec-table": utilities([468, "[:where(&).spec-table]:[border-collapse:collapse] [:where(&).spec-table]:[width:100%]"], [469, "[:where(&).spec-table_th,_:where(&).spec-table_td]:[border-bottom:1px_solid_#eef1f5] [:where(&).spec-table_th,_:where(&).spec-table_td]:text-left [:where(&).spec-table_th,_:where(&).spec-table_td]:[padding:8px_7px]"], [470, "[:where(&).spec-table_th]:[color:#5c6a81]"], [471, "[:where(&).spec-table_td]:[color:#25354f]"], [648, "[:is(:where(&).spec-table)]:[font-size:11px]"], [2229, "[.product-info-box_:where(&).spec-table]:[font-size:11px]"], [2284, "[:is(:where(&).spec-table_th)]:[width:42%] [:is(:where(&).spec-table_th)]:font-semibold [:is(:where(&).spec-table_th)]:text-left"], [2285, "[:where(&).spec-table_td,_:where(&).spec-table_th]:[padding:10px_12px] [:where(&).spec-table_td,_:where(&).spec-table_th]:[border-bottom:1px_solid_#eef0f3]"], [2303, "[:is(:is(:where(&).spec-table))]:[table-layout:fixed]"], [2304, "[:is(:where(&).spec-table_th),_:is(:where(&).spec-table_td)]:[word-break:break-word]"], [2700, "[:is(:is(:is(:where(&).spec-table)))]:[border-top:none]"]),
  "text-button": utilities([1609, "[:where(&).text-button]:[border:0] [:where(&).text-button]:[background:transparent] [:where(&).text-button]:[color:#c81f2a] [:where(&).text-button]:cursor-pointer [:where(&).text-button]:[text-decoration:underline]"], [1984, "[.admin-spec-items_:where(&).text-button]:[margin-top:4px] [.admin-spec-items_:where(&).text-button]:[font-size:12px]"]),
  "top": utilities([3663, "[.invoice-admin_:where(&).top]:flex [.invoice-admin_:where(&).top]:justify-between [.invoice-admin_:where(&).top]:items-start [.invoice-admin_:where(&).top]:[border-bottom:1px_solid_#a9c5ea] [.invoice-admin_:where(&).top]:[padding-bottom:16px]"]),
};
const tw = (value: string | undefined | null | false) => resolveClasses(value, componentUtilities);


/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

type DescriptionValue = { html: string; css: string };
type BlockType = "hero" | "showcase" | "split" | "video-split" | "grid" | "heading" | "paragraph" | "image" | "checklist" | "spec-table" | "itb" | "video" | "info-box" | "divider";
interface Block { id: string; type: BlockType; data: Record<string, unknown> }

/* ═══════════════════════════════════════════════════════════════════════════
   Palette — draggable items
   ═══════════════════════════════════════════════════════════════════════════ */

const PALETTE: Array<{ type: BlockType; label: string; icon: React.ReactNode; desc: string }> = [
  { type: "hero",         label: "Hero",        icon: <Film size={16} />,       desc: "Full-width banner with overlay text" },
  { type: "showcase",     label: "Showcase",    icon: <Sparkles size={16} />,   desc: "Centered heading + large image" },
  { type: "split",        label: "Img+Text",    icon: <PanelLeft size={16} />,  desc: "Image & text side-by-side" },
  { type: "video-split",  label: "Vid+Text",    icon: <Video size={16} />,      desc: "Video & text side-by-side" },
  { type: "grid",         label: "Grid",        icon: <LayoutGrid size={16} />, desc: "Feature cards in columns" },
  { type: "image",        label: "Image",       icon: <ImageIcon size={16} />,  desc: "Full-width product image" },
  { type: "video",        label: "Video",       icon: <Play size={16} />,       desc: "YouTube video embed" },
  { type: "heading",      label: "Heading",     icon: <Heading size={16} />,    desc: "Section title (H2 / H3 / H4)" },
  { type: "paragraph",    label: "Text",        icon: <AlignLeft size={16} />,  desc: "Rich text paragraph" },
  { type: "checklist",    label: "Checklist",   icon: <ListChecks size={16} />, desc: "Checkmark feature list" },
  { type: "spec-table",   label: "Specs",       icon: <Table2 size={16} />,     desc: "Specification table" },
  { type: "itb",          label: "ITB Builder", icon: <LayoutGrid size={16} />, desc: "In the Box grid" },
  { type: "info-box",     label: "Info Box",    icon: <Info size={16} />,       desc: "Tip / Warning / Note callout" },
  { type: "divider",      label: "Divider",     icon: <Minus size={16} />,      desc: "Horizontal separator" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Default data per block type
   ═══════════════════════════════════════════════════════════════════════════ */

function defaults(type: BlockType): Record<string, unknown> {
  switch (type) {
    case "hero":         return { imageUrl: "", videoUrl: "", heading: "Product Name", subtitle: "Discover the next generation of innovation", overlay: "dark", textAlign: "left", headingSize: "1.75rem", subtitleSize: "0.906rem", verticalAlign: "bottom" };
    case "showcase":     return { heading: "Incredible Feature", subtitle: "A brief description of what makes this feature stand out from the rest.", imageUrl: "", titleSize: "1.375rem", titleWeight: "700", titleAlign: "center", descSize: "0.875rem", descWeight: "normal", descAlign: "center" };
    case "split":        return { imageUrl: "", imagePosition: "left", heading: "Feature Title", text: "Describe this feature in detail. What makes it special and how does it benefit the customer?", headingSize: "1.1875rem", textSize: "0.844rem", textWeight: "normal" };
    case "video-split":  return { videoUrl: "", videoPosition: "left", heading: "Feature Title", text: "Describe this feature in detail. What makes it special and how does it benefit the customer?", headingSize: "1.1875rem", textSize: "0.844rem", textWeight: "normal" };
    case "grid":         return { columns: 3, cards: [{ imageUrl: "", title: "Feature One", description: "Brief description" }, { imageUrl: "", title: "Feature Two", description: "Brief description" }, { imageUrl: "", title: "Feature Three", description: "Brief description" }] };
    case "heading":      return { text: "Section heading", level: "h2", fontSize: "1.375rem", fontWeight: "700", align: "left" };
    case "paragraph":    return { text: "Write your content here…", fontSize: "0.844rem", fontWeight: "normal", color: "#536783", align: "left" };
    case "image":        return { url: "", alt: "", caption: "" };
    case "checklist":    return { items: ["Feature one", "Feature two", "Feature three"], fontSize: "0.8125rem" };
    case "spec-table":   return { headingSize: "1.5rem", categories: ["Aircraft", "Camera", "Battery"], rows: [{ key: "Takeoff Weight", value: "Approx. 1063 g", category: "Aircraft" }, { key: "Max Flight Time", value: "51 min", category: "Aircraft" }, { key: "Max Resolution", value: "4K/60fps", category: "Camera" }] };
    case "itb":          return { tabs: [{ tabName: "(DJI RC 2)", items: [{ name: "1 x DJI Mavic 4 Pro", image: "" }] }] };
    case "video":        return { url: "" };
    case "info-box":     return { variant: "tip", title: "💡 Tip", text: "Enter helpful information here.", fontSize: "0.8125rem" };
    case "divider":      return { style: "line" };
    default:             return {};
  }
}

function makeBlock(type: BlockType): Block {
  return { id: crypto.randomUUID(), type, data: defaults(type) };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Media Upload Field
   ═══════════════════════════════════════════════════════════════════════════ */

function MediaUploadField({ value, onChange, placeholder, accept = "image/*", mini = false }: { value: string; onChange: (url: string) => void; placeholder?: string; accept?: string; mini?: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file?: File | null) {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      if (getApiBase()) {
        const data = new FormData();
        data.append("file", file); // Backend expects "file" for both now
        const response = await apiFormRequest<{ data?: { url?: string } }>("/admin/media?folder=products", data);
        const url = response.data?.url;
        if (url) onChange(url);
        else setError("Upload returned no URL");
      } else {
        const reader = new FileReader();
        reader.onload = () => onChange(String(reader.result));
        reader.onerror = () => setError("Failed to read file");
        reader.readAsDataURL(file);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (mini) {
    return (
      <div className={utilities("rde-img-upload mini", [998, "[:where(&).rde-img-upload]:grid [:where(&).rde-img-upload]:[gap:3px]"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:items-center [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:justify-center [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:40px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[height:40px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border:1px_dashed_#cbd5e1] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-radius:6px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:cursor-pointer [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:overflow-hidden [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[background:#fff] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:relative"])}  onClick={() => fileRef.current?.click()}>
        <input ref={fileRef} type="file" accept={accept} hidden onChange={e => handleFile(e.target.files?.[0])} />
        {value ? <img src={value} alt="Preview" className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[height:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:object-contain"])} /> : (uploading ? <Loader2 size={16} className={utilities("rde-spin", [1006, "[:where(&).rde-spin]:animate-[rdeSpin_0.8s_linear_infinite]"])} /> : <ImageIcon size={16} color="#94a3b8" />)}
      </div>
    );
  }

  return (
    <div className={utilities("rde-img-upload", [998, "[:where(&).rde-img-upload]:grid [:where(&).rde-img-upload]:[gap:3px]"])}>
      <div className={utilities("rde-img-upload-row", [999, "[:where(&).rde-img-upload-row]:flex [:where(&).rde-img-upload-row]:[gap:4px] [:where(&).rde-img-upload-row]:items-center"], [1000, "[:where(&).rde-img-upload-row_input[type='text'],_:where(&).rde-img-upload-row_input:not([type])]:[flex:1]"])}>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || "Image URL or upload →"} />
        <input ref={fileRef} type="file" accept={accept} hidden onChange={e => handleFile(e.target.files?.[0])} />
        <button type="button" className={tw(`rde-upload-btn ${uploading ? "rde-uploading" : ""}`)} onClick={() => fileRef.current?.click()} disabled={uploading} title="Upload image to Cloudinary">
          {uploading ? <Loader2 size={13} className={utilities("rde-spin", [1006, "[:where(&).rde-spin]:animate-[rdeSpin_0.8s_linear_infinite]"])} /> : <Upload size={13} />}
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>
      {error && <span className={utilities("rde-upload-error", [1007, "[:where(&).rde-upload-error]:[font-size:10px] [:where(&).rde-upload-error]:[color:#dc2626] [:where(&).rde-upload-error]:font-semibold"])}>{error}</span>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Spacing Control Component
   ═══════════════════════════════════════════════════════════════════════════ */

function parseSpacing(value: string) {
  const parts = (value || "").toString().trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === "") return { num: 0, unit: "rem", mode: "all" };

  const extract = (str: string) => {
    const match = str.match(/^(-?\d*\.?\d+)(px|rem|em|%|vh|vw)?/);
    if (!match) return null;
    return { num: Number(match[1]), unit: match[2] || "rem" };
  };

  const isZ = (s: string) => s === "0" || s === "0px" || s === "0rem" || s === "0em" || s === "0%" || s === "0vw" || s === "0vh";

  if (parts.length === 1) {
    const ex = extract(parts[0]);
    return ex ? { num: ex.num, unit: ex.unit, mode: "all" } : { num: 0, unit: "rem", mode: "all" };
  }
  
  if (parts.length === 2) {
    if (isZ(parts[0])) {
       const ex = extract(parts[1]); return ex ? { num: ex.num, unit: ex.unit, mode: "x" } : { num: 0, unit: "rem", mode: "all" };
    }
    if (isZ(parts[1])) {
       const ex = extract(parts[0]); return ex ? { num: ex.num, unit: ex.unit, mode: "y" } : { num: 0, unit: "rem", mode: "all" };
    }
  }

  if (parts.length === 4) {
    const [t, r, b, l] = parts;
    if (!isZ(t) && isZ(r) && isZ(b) && isZ(l)) {
       const ex = extract(t); return ex ? { num: ex.num, unit: ex.unit, mode: "top" } : { num: 0, unit: "rem", mode: "all" };
    }
    if (isZ(t) && !isZ(r) && isZ(b) && isZ(l)) {
       const ex = extract(r); return ex ? { num: ex.num, unit: ex.unit, mode: "right" } : { num: 0, unit: "rem", mode: "all" };
    }
    if (isZ(t) && isZ(r) && !isZ(b) && isZ(l)) {
       const ex = extract(b); return ex ? { num: ex.num, unit: ex.unit, mode: "bottom" } : { num: 0, unit: "rem", mode: "all" };
    }
    if (isZ(t) && isZ(r) && isZ(b) && !isZ(l)) {
       const ex = extract(l); return ex ? { num: ex.num, unit: ex.unit, mode: "left" } : { num: 0, unit: "rem", mode: "all" };
    }
  }
  
  const ex = extract(parts[0]);
  return ex ? { num: ex.num, unit: ex.unit, mode: "all" } : { num: 0, unit: "rem", mode: "all" };
}

function buildSpacing(num: number, unit: string, mode: string) {
  const v = num === 0 ? "0" : `${num}${unit}`;
  switch (mode) {
    case "x": return `0 ${v}`;
    case "y": return `${v} 0`;
    case "top": return `${v} 0 0 0`;
    case "right": return `0 ${v} 0 0`;
    case "bottom": return `0 0 ${v} 0`;
    case "left": return `0 0 0 ${v}`;
    case "all":
    default: return v;
  }
}

function SpacingControl({ label, value, onChange, allowNegative }: { label: string; value: string; onChange: (v: string) => void, allowNegative?: boolean }) {
  const parsed = parseSpacing(value);
  const numValue = parsed.num;
  const unit = parsed.unit;
  const mode = parsed.mode;

  const handleValueChange = (newVal: number) => onChange(buildSpacing(newVal, unit, mode));
  const handleUnitChange = (newUnit: string) => onChange(buildSpacing(numValue, newUnit, mode));
  const handleModeChange = (newMode: string) => onChange(buildSpacing(numValue, unit, newMode));

  const maxVal = unit === "px" ? 100 : 10;
  const minVal = allowNegative ? -maxVal : 0;
  const step = unit === "px" ? 1 : 0.1;

  return (
    <div className={utilities("rde-spacing-ctrl", [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[flex:1] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex-col [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[gap:6px]"])}  onMouseDown={e => e.stopPropagation()} draggable onDragStart={e => { e.preventDefault(); e.stopPropagation(); }}>
      <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:justify-between [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:items-center [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-bottom:2px]"])}>
        <span className={utilities("rde-format-label", [2164, "[:where(&).rde-format-label]:[font-size:0.625rem] [:where(&).rde-format-label]:font-semibold [:where(&).rde-format-label]:uppercase [:where(&).rde-format-label]:[color:#94a3b8] [:where(&).rde-format-label]:[letter-spacing:0.03125rem] [:where(&).rde-format-label]:whitespace-nowrap"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:block"])} >{label}</span>
        <select 
          value={mode} 
          onChange={e => handleModeChange(e.target.value)}
          className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[padding:2px_4px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[font-size:11px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border:1px_solid_#cbd5e1] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-radius:4px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[background:#f8fafc] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[color:#64748b] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:cursor-pointer"])}
        >
          <option value="all">All Around</option>
          <option value="x">Left & Right (X)</option>
          <option value="y">Top & Bottom (Y)</option>
          <option value="top">Top Only</option>
          <option value="right">Right Only</option>
          <option value="bottom">Bottom Only</option>
          <option value="left">Left Only</option>
        </select>
      </div>
      <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[gap:8px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:items-center"])}>
        <input 
          type="range" 
          value={numValue} 
          min={minVal} 
          max={maxVal} 
          step={step}
          onChange={e => handleValueChange(Number(e.target.value))} 
          className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[flex:1] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[accent-color:#3b82f6] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[cursor:ew-resize]"])}
        />
        <input 
          type="number" 
          value={numValue}
          onChange={e => handleValueChange(Number(e.target.value))}
          className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:60px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[padding:4px_8px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[font-size:13px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border:1px_solid_#cbd5e1] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-radius:4px]"])}
        />
        <select 
          value={unit} 
          onChange={e => handleUnitChange(e.target.value)}
          className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[padding:4px_8px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[font-size:13px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border:1px_solid_#cbd5e1] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-radius:4px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[background:#fff] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:cursor-pointer"])}
        >
          <option value="rem">rem</option>
          <option value="px">px</option>
          <option value="%">%</option>
          <option value="vw">vw</option>
          <option value="vh">vh</option>
        </select>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Text Formatting Toolbar — font size + font weight inline controls
   ═══════════════════════════════════════════════════════════════════════════ */

const FONT_SIZES = ["0.6875rem", "0.75rem", "0.8125rem", "0.844rem", "0.875rem", "0.9375rem", "1rem", "1.125rem", "1.25rem", "1.375rem", "1.5rem", "1.75rem", "2rem"];
const FONT_WEIGHTS = [
  { label: "Light", value: "300" },
  { label: "Normal", value: "normal" },
  { label: "Semi-Bold", value: "600" },
  { label: "Bold", value: "700" },
  { label: "Black", value: "900" },
];

function TextFormattingBar({
  fontSize, fontWeight, onFontSize, onFontWeight,
  showAlign, align, onAlign,
}: {
  fontSize?: string; fontWeight?: string;
  onFontSize?: (v: string) => void; onFontWeight?: (v: string) => void;
  showAlign?: boolean; align?: string; onAlign?: (v: string) => void;
}) {
  return (
    <div className={utilities("rde-text-format-bar", [2162, "[:where(&).rde-text-format-bar]:flex [:where(&).rde-text-format-bar]:flex-wrap [:where(&).rde-text-format-bar]:[gap:0.75rem] [:where(&).rde-text-format-bar]:items-center [:where(&).rde-text-format-bar]:[padding:0.5rem_0.625rem] [:where(&).rde-text-format-bar]:[background:#f8fafc] [:where(&).rde-text-format-bar]:[border:1px_solid_#e2e8f0] [:where(&).rde-text-format-bar]:[border-radius:0.4375rem] [:where(&).rde-text-format-bar]:[margin-top:0.25rem]"])}>
      {onFontSize && (
        <div className={utilities("rde-format-group", [2163, "[:where(&).rde-format-group]:flex [:where(&).rde-format-group]:items-center [:where(&).rde-format-group]:[gap:0.375rem]"])}>
          <span className={utilities("rde-format-label", [2164, "[:where(&).rde-format-label]:[font-size:0.625rem] [:where(&).rde-format-label]:font-semibold [:where(&).rde-format-label]:uppercase [:where(&).rde-format-label]:[color:#94a3b8] [:where(&).rde-format-label]:[letter-spacing:0.03125rem] [:where(&).rde-format-label]:whitespace-nowrap"])}>Size</span>
          <select value={fontSize || "0.844rem"} onChange={e => onFontSize(e.target.value)} className={utilities("rde-format-select", [2165, "[:where(&).rde-format-select]:[font-size:0.75rem] [:where(&).rde-format-select]:[padding:0.1875rem_0.375rem] [:where(&).rde-format-select]:[border:1px_solid_#d1d9e6] [:where(&).rde-format-select]:[border-radius:0.3125rem] [:where(&).rde-format-select]:[background:white] [:where(&).rde-format-select]:[color:#374151] [:where(&).rde-format-select]:cursor-pointer [:where(&).rde-format-select]:[height:1.75rem] [:where(&).rde-format-select]:[width:auto]"])}>
            {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      )}
      {onFontWeight && (
        <div className={utilities("rde-format-group", [2163, "[:where(&).rde-format-group]:flex [:where(&).rde-format-group]:items-center [:where(&).rde-format-group]:[gap:0.375rem]"])}>
          <span className={utilities("rde-format-label", [2164, "[:where(&).rde-format-label]:[font-size:0.625rem] [:where(&).rde-format-label]:font-semibold [:where(&).rde-format-label]:uppercase [:where(&).rde-format-label]:[color:#94a3b8] [:where(&).rde-format-label]:[letter-spacing:0.03125rem] [:where(&).rde-format-label]:whitespace-nowrap"])}>Weight</span>
          <div className={utilities("rde-format-pills", [2166, "[:where(&).rde-format-pills]:flex [:where(&).rde-format-pills]:[gap:0.1875rem]"])}>
            {FONT_WEIGHTS.map(w => (
              <button key={w.value} type="button"
                
                onClick={() => onFontWeight(w.value)}
                {...withTailwindStyle(tw(`rde-format-pill ${(fontWeight || "normal") === w.value ? "active" : ""}`), { fontWeight: w.value === "normal" ? 400 : Number(w.value) || 400 })}>
                {w.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {showAlign && onAlign && (
        <div className={utilities("rde-format-group", [2163, "[:where(&).rde-format-group]:flex [:where(&).rde-format-group]:items-center [:where(&).rde-format-group]:[gap:0.375rem]"])}>
          <span className={utilities("rde-format-label", [2164, "[:where(&).rde-format-label]:[font-size:0.625rem] [:where(&).rde-format-label]:font-semibold [:where(&).rde-format-label]:uppercase [:where(&).rde-format-label]:[color:#94a3b8] [:where(&).rde-format-label]:[letter-spacing:0.03125rem] [:where(&).rde-format-label]:whitespace-nowrap"])}>Align</span>
          <div className={utilities("rde-format-pills", [2166, "[:where(&).rde-format-pills]:flex [:where(&).rde-format-pills]:[gap:0.1875rem]"])}>
            {["left", "center", "right"].map(a => (
              <button key={a} type="button"
                className={tw(`rde-format-pill ${(align || "left") === a ? "active" : ""}`)}
                onClick={() => onAlign(a)}>
                {a === "left" ? "←" : a === "center" ? "↔" : "→"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HTML helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function esc(s: unknown)     { return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function escAttr(s: unknown) { return String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"); }

function ytEmbed(url: string): string {
  if (!url) return "";
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : "";
}

/* ═══════════════════════════════════════════════════════════════════════════
   Block → HTML
   ═══════════════════════════════════════════════════════════════════════════ */

function getBlockInnerHtml(b: Block): string {
  const d = b.data;
  switch (b.type) {

    case "hero": {
      const bg = d.imageUrl ? `background-image:url('${String(d.imageUrl)}')` : "background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)";
      const textAlign = d.textAlign ? `text-align:${d.textAlign};` : "";
      const contentStyle = textAlign ? ` style="${textAlign}"` : "";
      const h2Style = d.headingSize ? ` style="font-size:${d.headingSize}"` : "";
      const pStyle = d.subtitleSize ? ` style="font-size:${d.subtitleSize}"` : "";
      
      let videoHtml = "";
      if (d.videoUrl) {
         videoHtml = `\n  <video class="pd-hero-video" src="${escAttr(d.videoUrl as string)}" autoplay loop muted playsinline></video>`;
      }
      
      const vAlign = d.verticalAlign === "center" ? "align-items:center;" : d.verticalAlign === "top" ? "align-items:flex-start;" : "";
      const heroStyle = (d.videoUrl ? '' : bg + ';') + vAlign;
      
      return `<div class="pd-hero pd-hero-${d.overlay || "dark"}" style="${heroStyle}">` + videoHtml + `\n  <div class="pd-hero-overlay"></div>\n  <div class="pd-hero-content"${contentStyle}>\n    <h2${h2Style}>${esc(d.heading)}</h2>\n    <p${pStyle}>${esc(d.subtitle)}</p>\n  </div>\n</div>`;
    }

    case "showcase": {
      const titleStyle = `font-size:${d.titleSize || "1.375rem"};font-weight:${d.titleWeight || "700"};text-align:${d.titleAlign || "center"};`;
      const descStyle = `font-size:${d.descSize || "0.875rem"};font-weight:${d.descWeight || "normal"};text-align:${d.descAlign || "center"};`;
      let h = `<div class="pd-showcase">\n  <div class="pd-showcase-text">\n    <h2 style="${titleStyle}">${esc(d.heading)}</h2>\n    <p style="${descStyle}">${esc(d.subtitle)}</p>\n  </div>`;
      if (d.imageUrl) h += `\n  <img class="pd-showcase-img" src="${escAttr(d.imageUrl)}" alt="${escAttr(d.heading)}" />`;
      return h + "\n</div>";
    }

    case "split": {
      const pos = d.imagePosition === "right" ? "pd-split-right" : "pd-split-left";
      const alignStyle = d.textAlign ? `text-align:${d.textAlign};` : "";
      const textStyle = `font-size:${d.textSize || "0.844rem"};font-weight:${d.textWeight || "normal"};${alignStyle}`;
      const headStyle = `font-size:${d.headingSize || "1.1875rem"};${alignStyle}`;
      let h = `<div class="pd-split ${pos}">\n  <div class="pd-split-media">`;
      if (d.imageUrl) h += `<img src="${escAttr(d.imageUrl)}" alt="${escAttr(d.heading)}" />`;
      h += `</div>\n  <div class="pd-split-body">\n    <h3 style="${headStyle}">${esc(d.heading)}</h3>\n    <p style="${textStyle}">${esc(d.text)}</p>\n  </div>\n</div>`;
      return h;
    }

    case "video-split": {
      const pos = d.videoPosition === "right" ? "pd-split-right" : "pd-split-left";
      const alignStyle = d.textAlign ? `text-align:${d.textAlign};` : "";
      const textStyle = `font-size:${d.textSize || "0.844rem"};font-weight:${d.textWeight || "normal"};${alignStyle}`;
      const headStyle = `font-size:${d.headingSize || "1.1875rem"};${alignStyle}`;
      let h = `<div class="pd-split pd-video-split ${pos}">\n  <div class="pd-split-media pd-split-video">`;
      if (d.videoUrl) h += `<div class="pd-video-embed-inline"><video src="${escAttr(d.videoUrl as string)}" controls muted loop playsinline></video></div>`;
      h += `</div>\n  <div class="pd-split-body">\n    <h3 style="${headStyle}">${esc(d.heading)}</h3>\n    <p style="${textStyle}">${esc(d.text)}</p>\n  </div>\n</div>`;
      return h;
    }

    case "grid": {
      const cols = Number(d.columns) || 3;
      const titleStyle = `font-size:${d.titleSize || "1.125rem"};font-weight:${d.titleWeight || "700"};text-align:${d.titleAlign || "left"};`;
      const descStyle = `font-size:${d.descSize || "0.844rem"};font-weight:${d.descWeight || "normal"};text-align:${d.descAlign || "left"};`;
      const cards = (d.cards as Array<{ imageUrl: string; title: string; description: string }>) || [];
      const items = cards.filter(c => c.title || c.description).map(c => {
        let h = `  <div class="pd-fgrid-item">`;
        if (c.imageUrl) h += `\n    <img src="${escAttr(c.imageUrl)}" alt="${escAttr(c.title)}" />`;
        h += `\n    <div class="pd-fgrid-info"><h4 style="${titleStyle}">${esc(c.title)}</h4><p style="${descStyle}">${esc(c.description)}</p></div>\n  </div>`;
        return h;
      }).join("\n");
      return `<div class="pd-fgrid pd-fgrid-${cols}">\n${items}\n</div>`;
    }

    case "heading": {
      const tag = (d.level as string) || "h2";
      const style = `font-size:${d.fontSize || "1.375rem"};font-weight:${d.fontWeight || "700"};text-align:${d.align || "left"};`;
      return `<${tag} style="${style}">${esc(d.text)}</${tag}>`;
    }

    case "paragraph": {
      const style = `font-size:${d.fontSize || "0.844rem"};font-weight:${d.fontWeight || "normal"};color:${d.color || "#536783"};text-align:${d.align || "left"};`;
      return `<p style="${style}">${esc(d.text)}</p>`;
    }

    case "image": {
      let h = `<figure class="pd-image-block"><img src="${escAttr(d.url)}" alt="${escAttr(d.alt)}" />`;
      if (d.caption) h += `<figcaption>${esc(d.caption)}</figcaption>`;
      return h + "</figure>";
    }

    case "checklist": {
      const fs = d.fontSize ? ` style="font-size:${d.fontSize}"` : "";
      const items = (d.items as string[] || []).filter(Boolean).map(i => `  <li${fs}>${esc(i)}</li>`).join("\n");
      return `<ul class="pd-feature-list">\n${items}\n</ul>`;
    }

    case "spec-table": {
      const categories = (d.categories as string[] || []).filter(Boolean);
      const rows = (d.rows as Array<{ key: string; value: string; category?: string }> || []).filter(r => r.key || r.value);
      const allRows = rows.map(r => `  <tr data-cat="${escAttr(r.category || '')}"><th>${esc(r.key)}</th><td>${esc(r.value)}</td></tr>`).join("\n");
      const catAttrs = categories.map(c => `data-cat-${escAttr(c.toLowerCase().replace(/\s+/g, '-'))}="${escAttr(c)}"`).join(" ");
      const headingSize = (d.headingSize as string) || "1.5rem";
      return `<div class="pd-spec-section pds-specs" id="specification" data-categories="${escAttr(JSON.stringify(categories))}" data-headingsize="${escAttr(headingSize)}" ${catAttrs}>\n<table class="pd-spec-table" id="pd-spec-${escAttr(b.id)}">\n${allRows}\n</table>\n</div>`;
    }

    case "itb": {
      const tabs = (d.tabs as Array<{ tabName: string; items: Array<{ name: string; image: string }> }>) || [];
      const tabsJson = JSON.stringify(tabs);
      return `<div class="pd-itb-section pds-itb" id="in-the-box" data-tabs="${escAttr(tabsJson)}"></div>`;
    }

    case "video": {
      return d.url ? `<div class="pd-video-embed"><video src="${escAttr(d.url as string)}" controls playsinline></video></div>` : "";
    }

    case "info-box": {
      const fs = d.fontSize ? ` style="font-size:${d.fontSize}"` : "";
      return `<div class="pd-info-box pd-info-${d.variant || "tip"}">\n  <strong>${esc(d.title)}</strong>\n  <p${fs}>${esc(d.text)}</p>\n</div>`;
    }

    case "divider":
      return d.style === "space" ? `<div class="pd-spacer"></div>` : d.style === "dots" ? `<div class="pd-divider pd-divider-dots">•••</div>` : `<hr class="pd-divider" />`;

    default: return "";
  }
}

function blockHtml(b: Block): string {
  const h = getBlockInnerHtml(b);
  if (!h) return h;
  const d = b.data;
  let styleStr = "";
  if (d.margin && d.margin !== "0" && d.margin !== "0rem" && d.margin !== "0px") styleStr += `margin:${escAttr(d.margin)};`;
  if (d.padding && d.padding !== "0" && d.padding !== "0rem" && d.padding !== "0px") styleStr += `padding:${escAttr(d.padding)};`;

  if (styleStr) {
    return `<div class="pd-block-wrapper" style="${styleStr}">\n${h}\n</div>`;
  }
  return h;
}

function blocksToHtml(blocks: Block[]): string {
  return blocks.map(blockHtml).filter(Boolean).join("\n\n");
}

/* ═══════════════════════════════════════════════════════════════════════════
   Auto-generated CSS
   ═══════════════════════════════════════════════════════════════════════════ */

const BUILDER_CSS = `/* Auto-generated by Drone Bangladesh Page Builder */

/* ── Base typography ── */
.product-description-rendered { line-height: 1.75; color: #374151; }
.product-description-rendered h2 { color: #102952; font-size: 1.375rem; font-weight: 700; margin: 1.75rem 0 0.625rem; line-height: 1.3; }
.product-description-rendered h2:first-child { margin-top: 0; }
.product-description-rendered h3 { color: #1e3a5f; font-size: 1.0625rem; font-weight: 700; margin: 1.375rem 0 0.5rem; line-height: 1.35; }
.product-description-rendered h4 { color: #2d4a6e; font-size: 0.875rem; font-weight: 700; margin: 1rem 0 0.375rem; }
.product-description-rendered p { margin: 0 0 0.75rem; font-size: 0.844rem; line-height: 1.75; color: #536783; }

/* ── Hero Banner ── */
.product-description-rendered .pd-hero { position: relative; min-height: 21.25rem; border-radius: 0.875rem; overflow: hidden; background-size: cover; background-position: center; display: flex; align-items: flex-end; margin: 0 0 1.75rem; }
.product-description-rendered .pd-hero-video { position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
.product-description-rendered .pd-hero-overlay { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.product-description-rendered .pd-hero-content { width: 100%; padding: 4.5rem 2rem 2rem; position: relative; z-index: 2; }
.product-description-rendered .pd-hero-dark .pd-hero-overlay { background: linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.1) 100%); }
.product-description-rendered .pd-hero-dark h2 { color: #fff; font-size: 1.75rem; margin: 0 0 0.375rem; text-shadow: 0 2px 12px rgba(0,0,0,0.5); }
.product-description-rendered .pd-hero-dark p { color: rgba(255,255,255,0.95); font-size: 0.906rem; margin: 0; line-height: 1.55; text-shadow: 0 1px 8px rgba(0,0,0,0.4); }
.product-description-rendered .pd-hero-light .pd-hero-overlay { background: linear-gradient(0deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 60%, rgba(255,255,255,0.2) 100%); }
.product-description-rendered .pd-hero-light h2 { color: #102952; font-size: 1.75rem; margin: 0 0 0.375rem; }
.product-description-rendered .pd-hero-light p { color: #475569; font-size: 0.906rem; margin: 0; line-height: 1.55; }

/* ── Feature Showcase ── */
.product-description-rendered .pd-showcase { margin: 2.25rem 0; text-align: center; }
.product-description-rendered .pd-showcase-text { max-width: 36.25rem; margin: 0 auto 1.25rem; }
.product-description-rendered .pd-showcase-text h2 { text-align: center; font-size: 1.375rem; color: #102952; margin: 0 0 0.625rem; }
.product-description-rendered .pd-showcase-text p { text-align: center; color: #64748b; font-size: 0.875rem; line-height: 1.65; margin: 0; }
.product-description-rendered .pd-showcase-img { width: 100%; border-radius: 0.75rem; display: block; }

/* ── Image + Text Split ── */
.product-description-rendered .pd-split { display: grid; grid-template-columns: 1fr 1fr; gap: 1.75rem; align-items: center; margin: 2rem 0; }
.product-description-rendered .pd-split-right .pd-split-media { order: 2; }
.product-description-rendered .pd-split-right .pd-split-body { order: 1; }
.product-description-rendered .pd-split-media img { width: 100%; border-radius: 0.75rem; display: block; }
.product-description-rendered .pd-split-body h3 { color: #102952; font-size: 1.1875rem; margin: 0 0 0.75rem; font-weight: 700; line-height: 1.3; }
.product-description-rendered .pd-split-body p { color: #536783; font-size: 0.844rem; line-height: 1.8; margin: 0; }

/* ── Video + Text Split ── */
.product-description-rendered .pd-split-video { position: relative; }
.product-description-rendered .pd-video-embed-inline { position: relative; padding-bottom: 56.25%; border-radius: 0.75rem; overflow: hidden; background: #0f172a; }
.product-description-rendered .pd-video-embed-inline iframe, .product-description-rendered .pd-video-embed-inline video { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; object-fit: cover; }

/* ── Feature Grid ── */
.product-description-rendered .pd-fgrid { display: grid; gap: 0.875rem; margin: 1.75rem 0; }
.product-description-rendered .pd-fgrid-2 { grid-template-columns: repeat(2, 1fr); }
.product-description-rendered .pd-fgrid-3 { grid-template-columns: repeat(3, 1fr); }
.product-description-rendered .pd-fgrid-4 { grid-template-columns: repeat(4, 1fr); }
.product-description-rendered .pd-fgrid-item { background: #f8fafc; border-radius: 0.75rem; overflow: hidden; border: 1px solid #e5e7eb; transition: transform 0.2s, box-shadow 0.2s; }
.product-description-rendered .pd-fgrid-item:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(0,0,0,0.07); }
.product-description-rendered .pd-fgrid-item img { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; }
.product-description-rendered .pd-fgrid-info { padding: 0.875rem 1rem; }
.product-description-rendered .pd-fgrid-info h4 { color: #102952; font-size: 0.844rem; margin: 0 0 0.3125rem; font-weight: 700; }
.product-description-rendered .pd-fgrid-info p { color: #64748b; font-size: 0.719rem; margin: 0; line-height: 1.55; }

/* ── Full Image ── */
.product-description-rendered .pd-image-block { margin: 1.5rem 0; border-radius: 0.75rem; overflow: hidden; }
.product-description-rendered .pd-image-block img { width: 100%; display: block; border-radius: 0.75rem; }
.product-description-rendered .pd-image-block figcaption { text-align: center; padding: 0.625rem 0 0; font-size: 0.719rem; color: #6b7280; font-style: italic; }

/* ── Checklist ── */
.product-description-rendered .pd-feature-list { margin: 1.125rem 0; padding: 0; list-style: none; }
.product-description-rendered .pd-feature-list li { position: relative; padding: 0.375rem 0 0.375rem 1.625rem; font-size: 0.8125rem; line-height: 1.65; color: #475569; }
.product-description-rendered .pd-feature-list li::before { content: "✓"; position: absolute; left: 0; top: 0.375rem; width: 1.125rem; height: 1.125rem; display: grid; place-items: center; background: #ecfdf5; color: #059669; font-weight: 700; font-size: 0.6875rem; border-radius: 50%; }

/* ── Specification Table ── */
.product-description-rendered .pd-spec-table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: 0.781rem; border-radius: 0.625rem; overflow: hidden; border: 1px solid #e5e7eb; }
.product-description-rendered .pd-spec-table th, .product-description-rendered .pd-spec-table td { padding: 0.6875rem 0.9375rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
.product-description-rendered .pd-spec-table th { font-weight: 600; color: #102952; background: #f8fafc; width: 38%; }
.product-description-rendered .pd-spec-table td { color: #475569; }
.product-description-rendered .pd-spec-table tr:last-child th, .product-description-rendered .pd-spec-table tr:last-child td { border-bottom: 0; }
.product-description-rendered .pd-spec-table tr:nth-child(even) td { background: #fafbfd; }

/* ── Video Embed ── */
.product-description-rendered .pd-video-embed { position: relative; margin: 1.5rem 0; padding-bottom: 56.25%; border-radius: 0.875rem; overflow: hidden; background: #0f172a; }
.product-description-rendered .pd-video-embed iframe, .product-description-rendered .pd-video-embed video { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; object-fit: cover; }

/* ── Info Box ── */
.product-description-rendered .pd-info-box { margin: 1.25rem 0; padding: 1rem 1.25rem; border-radius: 0.625rem; border-left: 4px solid; font-size: 0.8125rem; }
.product-description-rendered .pd-info-tip { background: #ecfdf5; border-color: #10b981; color: #065f46; }
.product-description-rendered .pd-info-warning { background: #fffbeb; border-color: #f59e0b; color: #78350f; }
.product-description-rendered .pd-info-note { background: #eff6ff; border-color: #3b82f6; color: #1e3a5f; }
.product-description-rendered .pd-info-box strong { display: block; margin-bottom: 0.375rem; font-size: 0.8125rem; }
.product-description-rendered .pd-info-box p { margin: 0; line-height: 1.65; }

/* ── Divider ── */
.product-description-rendered .pd-divider { margin: 1.75rem 0; border: 0; border-top: 1px solid #e2e8f0; }
.product-description-rendered .pd-divider-dots { text-align: center; border: 0; color: #94a3b8; font-size: 1.125rem; letter-spacing: 0.5rem; margin: 1.75rem 0; }
.product-description-rendered .pd-spacer { height: 2.25rem; }

/* ── Responsive ── */
@media (max-width: 640px) {
  .product-description-rendered .pd-split { grid-template-columns: 1fr; gap: 1rem; }
  .product-description-rendered .pd-split-right .pd-split-media { order: 0; }
  .product-description-rendered .pd-fgrid-2, .product-description-rendered .pd-fgrid-3, .product-description-rendered .pd-fgrid-4 { grid-template-columns: 1fr; }
  .product-description-rendered .pd-hero { min-height: 15rem; }
  .product-description-rendered .pd-hero-content { padding: 2rem 1.25rem 1.25rem; }
  .product-description-rendered .pd-hero-dark h2, .product-description-rendered .pd-hero-light h2 { font-size: 1.375rem; }
}`;

/* ═══════════════════════════════════════════════════════════════════════════
   Parse existing HTML → Block[]
   ═══════════════════════════════════════════════════════════════════════════ */

function parseHtml(html: string): Block[] | null {
  if (!html?.trim()) return [];
  if (typeof window === "undefined") return null;
  try {
    const doc = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
    const nodes = Array.from(doc.body.children);
    if (!nodes.length) return null;
    const blocks: Block[] = [];
    for (const el of nodes) {
      const initialLength = blocks.length;
      
      let margin = "";
      let padding = "";
      let targetEl = el;

      if (el.className === "pd-block-wrapper") {
        margin = (el as HTMLElement).style.margin || "";
        padding = (el as HTMLElement).style.padding || "";
        targetEl = el.firstElementChild as Element;
        if (!targetEl) continue;
      }

      const tag = targetEl.tagName.toLowerCase();
      const cls = targetEl.className || "";

      if (cls.includes("pd-hero")) {
        // Because pd-hero-light or dark is now on the root pd-hero element, cls.includes works!
        // We also check child nodes just in case of old data.
        let overlay = "dark";
        if (cls.includes("pd-hero-light") || targetEl.querySelector(".pd-hero-light")) overlay = "light";
        const content = targetEl.querySelector(".pd-hero-content");
        const style = targetEl.getAttribute("style") || "";
        const bgMatch = style.match(/url\(['"]?([^'"')]+)['"]?\)/);
        const rawUrl = (bgMatch?.[1] || "").replace(/&quot;/g, "").replace(/["']/g, "").trim();
        const videoEl = targetEl.querySelector("video");
        const videoUrl = videoEl?.getAttribute("src") || "";
        const h2 = content?.querySelector("h2");
        const p = content?.querySelector("p");
        
        let verticalAlign = "bottom";
        if (style.includes("align-items:center") || style.includes("align-items: center")) verticalAlign = "center";
        if (style.includes("align-items:flex-start") || style.includes("align-items: flex-start")) verticalAlign = "top";
        
        blocks.push({ id: crypto.randomUUID(), type: "hero", data: { imageUrl: rawUrl, videoUrl, heading: h2?.textContent || "", subtitle: p?.textContent || "", overlay, textAlign: (content as HTMLElement)?.style?.textAlign || "", headingSize: h2?.style?.fontSize || "", subtitleSize: p?.style?.fontSize || "", verticalAlign } });
      } else if (cls.includes("pd-showcase")) {
        const textEl = targetEl.querySelector(".pd-showcase-text");
        const img = targetEl.querySelector(".pd-showcase-img") as HTMLImageElement | null;
        const h2 = textEl?.querySelector("h2");
        const p = textEl?.querySelector("p");
        
        let titleSize = "1.375rem", titleWeight = "700", titleAlign = "center";
        let descSize = "0.875rem", descWeight = "normal", descAlign = "center";
        if (h2) {
           titleSize = h2.style.fontSize || titleSize;
           titleWeight = h2.style.fontWeight || titleWeight;
           titleAlign = h2.style.textAlign || titleAlign;
        }
        if (p) {
           descSize = p.style.fontSize || descSize;
           descWeight = p.style.fontWeight || descWeight;
           descAlign = p.style.textAlign || descAlign;
        }

        blocks.push({ id: crypto.randomUUID(), type: "showcase", data: { heading: h2?.textContent || "", subtitle: p?.textContent || "", imageUrl: img?.getAttribute("src") || "", titleSize, titleWeight, titleAlign, descSize, descWeight, descAlign } });
      } else if (cls.includes("pd-split") && cls.includes("pd-video-split")) {
        const pos = cls.includes("pd-split-right") ? "right" : "left";
        const iframe = targetEl.querySelector("iframe, video");
        const body = targetEl.querySelector(".pd-split-body");
        const h3 = body?.querySelector("h3") as HTMLElement | null;
        const p = body?.querySelector("p") as HTMLElement | null;
        blocks.push({ id: crypto.randomUUID(), type: "video-split", data: { videoUrl: iframe?.getAttribute("src") || "", videoPosition: pos, heading: h3?.textContent || "", text: p?.textContent || "", headingSize: h3?.style.fontSize, textAlign: p?.style.textAlign || h3?.style.textAlign, textSize: p?.style.fontSize, textWeight: p?.style.fontWeight } });
      } else if (cls.includes("pd-split")) {
        const pos = cls.includes("pd-split-right") ? "right" : "left";
        const img = targetEl.querySelector(".pd-split-media img") as HTMLImageElement | null;
        const body = targetEl.querySelector(".pd-split-body");
        const h3 = body?.querySelector("h3") as HTMLElement | null;
        const p = body?.querySelector("p") as HTMLElement | null;
        blocks.push({ id: crypto.randomUUID(), type: "split", data: { imageUrl: img?.getAttribute("src") || "", imagePosition: pos, heading: h3?.textContent || "", text: p?.textContent || "", headingSize: h3?.style.fontSize, textAlign: p?.style.textAlign || h3?.style.textAlign, textSize: p?.style.fontSize, textWeight: p?.style.fontWeight } });
      } else if (cls.includes("pd-fgrid")) {
        const colMatch = cls.match(/pd-fgrid-(\d)/);
        const cards = Array.from(targetEl.querySelectorAll(".pd-fgrid-item")).map(item => ({
          imageUrl: (item.querySelector("img") as HTMLImageElement | null)?.getAttribute("src") || "",
          title: item.querySelector("h4")?.textContent || "",
          description: item.querySelector("p")?.textContent || "",
        }));

        let titleSize = "1.125rem", titleWeight = "700", titleAlign = "left";
        let descSize = "0.844rem", descWeight = "normal", descAlign = "left";
        const firstH4 = targetEl.querySelector("h4") as HTMLElement;
        if (firstH4) {
          titleSize = firstH4.style.fontSize || "1.125rem";
          titleWeight = firstH4.style.fontWeight || "700";
          titleAlign = firstH4.style.textAlign || "left";
        }
        const firstP = targetEl.querySelector("p") as HTMLElement;
        if (firstP) {
          descSize = firstP.style.fontSize || "0.844rem";
          descWeight = firstP.style.fontWeight || "normal";
          descAlign = firstP.style.textAlign || "left";
        }

        blocks.push({ id: crypto.randomUUID(), type: "grid", data: { columns: Number(colMatch?.[1]) || 3, cards, titleSize, titleWeight, titleAlign, descSize, descWeight, descAlign } });
      } else if (["h2", "h3", "h4"].includes(tag)) {
        const style = targetEl.getAttribute("style") || "";
        const fsize = style.match(/font-size:([^;]+)/)?.[1]?.trim() || "1.375rem";
        const fweight = style.match(/font-weight:([^;]+)/)?.[1]?.trim() || "700";
        blocks.push({ id: crypto.randomUUID(), type: "heading", data: { text: targetEl.textContent || "", level: tag, fontSize: fsize, fontWeight: fweight } });
      } else if (tag === "p" && !cls.includes("pd-divider")) {
        const style = targetEl.getAttribute("style") || "";
        const fsize = style.match(/font-size:([^;]+)/)?.[1]?.trim() || "0.844rem";
        const fweight = style.match(/font-weight:([^;]+)/)?.[1]?.trim() || "normal";
        const align = style.match(/text-align:([^;]+)/)?.[1]?.trim() || "left";
        blocks.push({ id: crypto.randomUUID(), type: "paragraph", data: { text: targetEl.textContent || "", fontSize: fsize, fontWeight: fweight, align } });
      } else if (tag === "figure" && cls.includes("pd-image-block")) {
        const img = targetEl.querySelector("img");
        const cap = targetEl.querySelector("figcaption");
        blocks.push({ id: crypto.randomUUID(), type: "image", data: { url: img?.getAttribute("src") || "", alt: img?.getAttribute("alt") || "", caption: cap?.textContent || "" } });
      } else if (tag === "ul" || tag === "ol") {
        blocks.push({ id: crypto.randomUUID(), type: "checklist", data: { items: Array.from(targetEl.querySelectorAll("li")).map(li => li.textContent || "") } });
      } else if (cls.includes("pd-spec-section")) {
        const table = targetEl.querySelector("table");
        const catAttr = targetEl.getAttribute("data-categories");
        const headingSize = targetEl.getAttribute("data-headingsize") || "1.5rem";
        let categories: string[] = [];
        try { categories = catAttr ? JSON.parse(catAttr) : []; } catch { /* ignore */ }
        const rows = Array.from(table?.querySelectorAll("tr") || []).map(tr => ({ key: tr.querySelector("th")?.textContent || "", value: tr.querySelector("td")?.textContent || "", category: tr.getAttribute("data-cat") || "" }));
        blocks.push({ id: crypto.randomUUID(), type: "spec-table", data: { headingSize, categories, rows } });
      } else if (cls.includes("pd-itb-section")) {
        const tabsAttr = targetEl.getAttribute("data-tabs");
        let tabs = [];
        try { tabs = tabsAttr ? JSON.parse(tabsAttr) : []; } catch { /* ignore */ }
        blocks.push({ id: crypto.randomUUID(), type: "itb", data: { tabs } });
      } else if (tag === "table") {
        blocks.push({ id: crypto.randomUUID(), type: "spec-table", data: { headingSize: "1.5rem", categories: [], rows: Array.from(targetEl.querySelectorAll("tr")).map(tr => ({ key: tr.querySelector("th")?.textContent || "", value: tr.querySelector("td")?.textContent || "", category: "" })) } });
      } else if (cls.includes("pd-video-embed")) {
        const iframe = targetEl.querySelector("iframe, video");
        blocks.push({ id: crypto.randomUUID(), type: "video", data: { url: iframe?.getAttribute("src") || "" } });
      } else if (cls.includes("pd-info-box")) {
        const variant = cls.includes("pd-info-warning") ? "warning" : cls.includes("pd-info-note") ? "note" : "tip";
        blocks.push({ id: crypto.randomUUID(), type: "info-box", data: { variant, title: targetEl.querySelector("strong")?.textContent || "", text: targetEl.querySelector("p")?.textContent || "" } });
      } else if (tag === "hr" || cls.includes("pd-divider") || cls.includes("pd-spacer")) {
        const style = cls.includes("pd-spacer") ? "space" : cls.includes("pd-divider-dots") ? "dots" : "line";
        blocks.push({ id: crypto.randomUUID(), type: "divider", data: { style } });
      }

      if (blocks.length > initialLength) {
         const lastBlock = blocks[blocks.length - 1];
         // Try reading from style directly if there was no wrapper, though our new logic uses wrappers.
         const fallbackMargin = (targetEl as HTMLElement).style?.margin;
         const fallbackPadding = (targetEl as HTMLElement).style?.padding;
         if (margin || fallbackMargin) lastBlock.data.margin = margin || fallbackMargin;
         if (padding || fallbackPadding) lastBlock.data.padding = padding || fallbackPadding;
      }
    }
    return blocks.length > 0 ? blocks : null;
  } catch { return null; }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Starter content
   ═══════════════════════════════════════════════════════════════════════════ */

const starterHtml = `<h2>Product overview</h2>\n<p>Write a clear, helpful description for this product.</p>\n<ul>\n  <li>Add the main benefit or use case.</li>\n  <li>Explain what is included in the box.</li>\n</ul>`;
const starterCss = `.product-description-rendered h2 {\n  color: #102952;\n  margin-bottom: 12px;\n}\n.product-description-rendered p {\n  line-height: 1.7;\n}`;

/* ═══════════════════════════════════════════════════════════════════════════
   Block inline editors — one per block type
   ═══════════════════════════════════════════════════════════════════════════ */

function BlockEditorInline({ block, onChange }: { block: Block; onChange: (patch: Record<string, unknown>) => void }) {
  const d = block.data;

  switch (block.type) {

    /* ── Hero Banner ── */
    case "hero":
      return (
        <div className={utilities("rde-edit-hero", [994, "[:where(&).rde-edit-hero]:grid [:where(&).rde-edit-hero]:[gap:6px]"])}>
          <label className={utilities("rde-field-label", [2170, "[:where(&).rde-field-label]:[font-size:0.6875rem] [:where(&).rde-field-label]:font-semibold [:where(&).rde-field-label]:[color:#5a6a7a] [:where(&).rde-field-label]:uppercase [:where(&).rde-field-label]:[letter-spacing:0.01875rem] [:where(&).rde-field-label]:[margin-bottom:0.125rem] [:where(&).rde-field-label]:block"])}>Background Media</label>
          <div className={utilities("rde-toggle-row", [989, "[:where(&).rde-toggle-row]:flex [:where(&).rde-toggle-row]:items-center [:where(&).rde-toggle-row]:[gap:4px]"], [991, "[:where(&).rde-toggle-row_button]:[padding:4px_10px] [:where(&).rde-toggle-row_button]:[border:1px_solid_#d6e1ef] [:where(&).rde-toggle-row_button]:[border-radius:5px] [:where(&).rde-toggle-row_button]:[background:#fff] [:where(&).rde-toggle-row_button]:[font-size:10px] [:where(&).rde-toggle-row_button]:font-semibold [:where(&).rde-toggle-row_button]:cursor-pointer [:where(&).rde-toggle-row_button]:[color:#64748b] [:where(&).rde-toggle-row_button]:[transition:all_0.15s]"], [993, "[:where(&).rde-toggle-row_button:hover:not(.active)]:[background:#f5f8ff]"])}>
            <MediaUploadField value={d.imageUrl as string} onChange={url => onChange({ imageUrl: url, videoUrl: "" })} placeholder="Image URL" />
            <MediaUploadField accept="video/mp4,video/webm" value={d.videoUrl as string} onChange={url => onChange({ videoUrl: url, imageUrl: "" })} placeholder="Video URL" />
          </div>
          {(d.imageUrl as string) && <div  {...withTailwindStyle(tw("rde-hero-thumb"), { backgroundImage: `url(${d.imageUrl})` })}><span className={utilities("rde-hero-thumb-label", [996, "[:where(&).rde-hero-thumb-label]:[padding:3px_8px] [:where(&).rde-hero-thumb-label]:[background:rgba(0,_0,_0,_0.55)] [:where(&).rde-hero-thumb-label]:[color:#fff] [:where(&).rde-hero-thumb-label]:[font-size:8px] [:where(&).rde-hero-thumb-label]:font-bold [:where(&).rde-hero-thumb-label]:[border-radius:0_4px_0_0]"])}>Hero preview</span></div>}
          {(d.videoUrl as string) && <div className={utilities("rde-hero-thumb", [995, "[:where(&).rde-hero-thumb]:[width:100%] [:where(&).rde-hero-thumb]:[height:80px] [:where(&).rde-hero-thumb]:[border-radius:6px] [:where(&).rde-hero-thumb]:[background-size:cover] [:where(&).rde-hero-thumb]:[background-position:center] [:where(&).rde-hero-thumb]:flex [:where(&).rde-hero-thumb]:items-end [:where(&).rde-hero-thumb]:justify-start [:where(&).rde-hero-thumb]:overflow-hidden"])}><video src={d.videoUrl as string} className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[height:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:object-cover"])} controls /><span className={utilities("rde-hero-thumb-label", [996, "[:where(&).rde-hero-thumb-label]:[padding:3px_8px] [:where(&).rde-hero-thumb-label]:[background:rgba(0,_0,_0,_0.55)] [:where(&).rde-hero-thumb-label]:[color:#fff] [:where(&).rde-hero-thumb-label]:[font-size:8px] [:where(&).rde-hero-thumb-label]:font-bold [:where(&).rde-hero-thumb-label]:[border-radius:0_4px_0_0]"])}>Video preview</span></div>}
          
          <input value={d.heading as string} onChange={e => onChange({ heading: e.target.value })} placeholder="Heading text" className={utilities("rde-input-lg", [987, "[:where(&).rde-input-lg]:font-bold! [:where(&).rde-input-lg]:[font-size:13px]!"])} />
          <TextFormattingBar
             fontSize={d.headingSize as string} fontWeight={undefined}
             onFontSize={v => onChange({ headingSize: v })} onFontWeight={undefined}
             showAlign align={d.textAlign as string} onAlign={v => onChange({ textAlign: v })}
          />
          <input value={d.subtitle as string} onChange={e => onChange({ subtitle: e.target.value })} placeholder="Subtitle / tagline" />
          <TextFormattingBar
             fontSize={d.subtitleSize as string} fontWeight={undefined}
             onFontSize={v => onChange({ subtitleSize: v })} onFontWeight={undefined}
             showAlign align={d.textAlign as string} onAlign={v => onChange({ textAlign: v })}
          />
          <div className={utilities("rde-toggle-row", [989, "[:where(&).rde-toggle-row]:flex [:where(&).rde-toggle-row]:items-center [:where(&).rde-toggle-row]:[gap:4px]"], [991, "[:where(&).rde-toggle-row_button]:[padding:4px_10px] [:where(&).rde-toggle-row_button]:[border:1px_solid_#d6e1ef] [:where(&).rde-toggle-row_button]:[border-radius:5px] [:where(&).rde-toggle-row_button]:[background:#fff] [:where(&).rde-toggle-row_button]:[font-size:10px] [:where(&).rde-toggle-row_button]:font-semibold [:where(&).rde-toggle-row_button]:cursor-pointer [:where(&).rde-toggle-row_button]:[color:#64748b] [:where(&).rde-toggle-row_button]:[transition:all_0.15s]"], [993, "[:where(&).rde-toggle-row_button:hover:not(.active)]:[background:#f5f8ff]"])}>
            <span className={utilities("rde-toggle-label", [990, "[:where(&).rde-toggle-label]:[font-size:10px] [:where(&).rde-toggle-label]:font-bold [:where(&).rde-toggle-label]:[color:#64748b] [:where(&).rde-toggle-label]:[margin-right:4px] [:where(&).rde-toggle-label]:whitespace-nowrap"])}>Vertical Align</span>
            <button type="button" className={tw(d.verticalAlign === "top" ? "active" : "")} onClick={() => onChange({ verticalAlign: "top" })}>Top</button>
            <button type="button" className={tw(d.verticalAlign === "center" ? "active" : "")} onClick={() => onChange({ verticalAlign: "center" })}>Middle</button>
            <button type="button" className={tw((d.verticalAlign || "bottom") === "bottom" ? "active" : "")} onClick={() => onChange({ verticalAlign: "bottom" })}>Bottom</button>
          </div>
          <div className={utilities("rde-toggle-row", [989, "[:where(&).rde-toggle-row]:flex [:where(&).rde-toggle-row]:items-center [:where(&).rde-toggle-row]:[gap:4px]"], [991, "[:where(&).rde-toggle-row_button]:[padding:4px_10px] [:where(&).rde-toggle-row_button]:[border:1px_solid_#d6e1ef] [:where(&).rde-toggle-row_button]:[border-radius:5px] [:where(&).rde-toggle-row_button]:[background:#fff] [:where(&).rde-toggle-row_button]:[font-size:10px] [:where(&).rde-toggle-row_button]:font-semibold [:where(&).rde-toggle-row_button]:cursor-pointer [:where(&).rde-toggle-row_button]:[color:#64748b] [:where(&).rde-toggle-row_button]:[transition:all_0.15s]"], [993, "[:where(&).rde-toggle-row_button:hover:not(.active)]:[background:#f5f8ff]"])}>
            <span className={utilities("rde-toggle-label", [990, "[:where(&).rde-toggle-label]:[font-size:10px] [:where(&).rde-toggle-label]:font-bold [:where(&).rde-toggle-label]:[color:#64748b] [:where(&).rde-toggle-label]:[margin-right:4px] [:where(&).rde-toggle-label]:whitespace-nowrap"])}>Overlay</span>
            <button type="button" className={tw(d.overlay === "dark" ? "active" : "")} onClick={() => onChange({ overlay: "dark" })}>Dark</button>
            <button type="button" className={tw(d.overlay === "light" ? "active" : "")} onClick={() => onChange({ overlay: "light" })}>Light</button>
          </div>
        </div>
      );

    /* ── Feature Showcase ── */
    case "showcase":
      return (
        <div className={utilities("rde-edit-showcase", [997, "[:where(&).rde-edit-showcase]:grid [:where(&).rde-edit-showcase]:[gap:6px]"])}>
          <input value={d.heading as string} onChange={e => onChange({ heading: e.target.value })} placeholder="Feature heading" className={utilities("rde-input-lg", [987, "[:where(&).rde-input-lg]:font-bold! [:where(&).rde-input-lg]:[font-size:13px]!"])} />
          <TextFormattingBar
            fontSize={d.titleSize as string || "1.375rem"}
            fontWeight={d.titleWeight as string || "700"}
            onFontSize={v => onChange({ titleSize: v })}
            onFontWeight={v => onChange({ titleWeight: v })}
            showAlign
            align={d.titleAlign as string || "center"}
            onAlign={v => onChange({ titleAlign: v })}
          />
          <textarea value={d.subtitle as string} onChange={e => onChange({ subtitle: e.target.value })} placeholder="Description text (centered below heading)" rows={2} />
          <TextFormattingBar
            fontSize={d.descSize as string || "0.875rem"}
            fontWeight={d.descWeight as string || "normal"}
            onFontSize={v => onChange({ descSize: v })}
            onFontWeight={v => onChange({ descWeight: v })}
            showAlign
            align={d.descAlign as string || "center"}
            onAlign={v => onChange({ descAlign: v })}
          />
          <MediaUploadField value={d.imageUrl as string} onChange={url => onChange({ imageUrl: url })} placeholder="Showcase image URL" />
          {(d.imageUrl as string) && <img className={utilities("rde-image-preview", [1022, "[:where(&).rde-image-preview]:[width:100%] [:where(&).rde-image-preview]:[max-height:120px] [:where(&).rde-image-preview]:object-cover [:where(&).rde-image-preview]:[border-radius:6px] [:where(&).rde-image-preview]:[margin-top:4px] [:where(&).rde-image-preview]:[border:1px_solid_#e2e8f0]"])} src={d.imageUrl as string} alt="Showcase preview" />}
        </div>
      );

    /* ── Image + Text Split ── */
    case "split":
      return (
        <div className={utilities("rde-edit-split", [1008, "[:where(&).rde-edit-split]:grid [:where(&).rde-edit-split]:[gap:6px]"])}>
          <MediaUploadField value={d.imageUrl as string} onChange={url => onChange({ imageUrl: url })} placeholder="Feature image URL" />
          {(d.imageUrl as string) && <img className={utilities("rde-split-thumb", [1009, "[:where(&).rde-split-thumb]:[width:100%] [:where(&).rde-split-thumb]:[max-height:80px] [:where(&).rde-split-thumb]:object-cover [:where(&).rde-split-thumb]:[border-radius:6px] [:where(&).rde-split-thumb]:[border:1px_solid_#e2e8f0]"])} src={d.imageUrl as string} alt="Split preview" />}
          <div className={utilities("rde-toggle-row", [989, "[:where(&).rde-toggle-row]:flex [:where(&).rde-toggle-row]:items-center [:where(&).rde-toggle-row]:[gap:4px]"], [991, "[:where(&).rde-toggle-row_button]:[padding:4px_10px] [:where(&).rde-toggle-row_button]:[border:1px_solid_#d6e1ef] [:where(&).rde-toggle-row_button]:[border-radius:5px] [:where(&).rde-toggle-row_button]:[background:#fff] [:where(&).rde-toggle-row_button]:[font-size:10px] [:where(&).rde-toggle-row_button]:font-semibold [:where(&).rde-toggle-row_button]:cursor-pointer [:where(&).rde-toggle-row_button]:[color:#64748b] [:where(&).rde-toggle-row_button]:[transition:all_0.15s]"], [993, "[:where(&).rde-toggle-row_button:hover:not(.active)]:[background:#f5f8ff]"])}>
            <span className={utilities("rde-toggle-label", [990, "[:where(&).rde-toggle-label]:[font-size:10px] [:where(&).rde-toggle-label]:font-bold [:where(&).rde-toggle-label]:[color:#64748b] [:where(&).rde-toggle-label]:[margin-right:4px] [:where(&).rde-toggle-label]:whitespace-nowrap"])}>Image position</span>
            <button type="button" className={tw(d.imagePosition === "left" ? "active" : "")} onClick={() => onChange({ imagePosition: "left" })}>◀ Left</button>
            <button type="button" className={tw(d.imagePosition === "right" ? "active" : "")} onClick={() => onChange({ imagePosition: "right" })}>Right ▶</button>
          </div>
          <input value={d.heading as string} onChange={e => onChange({ heading: e.target.value })} placeholder="Feature title" className={utilities("rde-input-lg", [987, "[:where(&).rde-input-lg]:font-bold! [:where(&).rde-input-lg]:[font-size:13px]!"])} />
          <TextFormattingBar
            fontSize={d.headingSize as string} fontWeight={undefined}
            onFontSize={v => onChange({ headingSize: v })} onFontWeight={undefined}
            showAlign align={d.textAlign as string || "left"} onAlign={v => onChange({ textAlign: v })}
          />
          <textarea value={d.text as string} onChange={e => onChange({ text: e.target.value })} placeholder="Feature description…" rows={3} />
          <TextFormattingBar
            fontSize={d.textSize as string} fontWeight={d.textWeight as string}
            onFontSize={v => onChange({ textSize: v })} onFontWeight={v => onChange({ textWeight: v })}
          />
        </div>
      );

    /* ── Video + Text Split ── */
    case "video-split":
      return (
        <div className={utilities("rde-edit-split", [1008, "[:where(&).rde-edit-split]:grid [:where(&).rde-edit-split]:[gap:6px]"])}>
          <label className={utilities("rde-field-label", [2170, "[:where(&).rde-field-label]:[font-size:0.6875rem] [:where(&).rde-field-label]:font-semibold [:where(&).rde-field-label]:[color:#5a6a7a] [:where(&).rde-field-label]:uppercase [:where(&).rde-field-label]:[letter-spacing:0.01875rem] [:where(&).rde-field-label]:[margin-bottom:0.125rem] [:where(&).rde-field-label]:block"])}>Video file</label>
          <MediaUploadField accept="video/mp4,video/webm" value={d.videoUrl as string} onChange={e => onChange({ videoUrl: e })} placeholder="Upload video or enter URL" />
          <div className={utilities("rde-toggle-row", [989, "[:where(&).rde-toggle-row]:flex [:where(&).rde-toggle-row]:items-center [:where(&).rde-toggle-row]:[gap:4px]"], [991, "[:where(&).rde-toggle-row_button]:[padding:4px_10px] [:where(&).rde-toggle-row_button]:[border:1px_solid_#d6e1ef] [:where(&).rde-toggle-row_button]:[border-radius:5px] [:where(&).rde-toggle-row_button]:[background:#fff] [:where(&).rde-toggle-row_button]:[font-size:10px] [:where(&).rde-toggle-row_button]:font-semibold [:where(&).rde-toggle-row_button]:cursor-pointer [:where(&).rde-toggle-row_button]:[color:#64748b] [:where(&).rde-toggle-row_button]:[transition:all_0.15s]"], [993, "[:where(&).rde-toggle-row_button:hover:not(.active)]:[background:#f5f8ff]"])}>
            <span className={utilities("rde-toggle-label", [990, "[:where(&).rde-toggle-label]:[font-size:10px] [:where(&).rde-toggle-label]:font-bold [:where(&).rde-toggle-label]:[color:#64748b] [:where(&).rde-toggle-label]:[margin-right:4px] [:where(&).rde-toggle-label]:whitespace-nowrap"])}>Video position</span>
            <button type="button" className={tw(d.videoPosition === "left" ? "active" : "")} onClick={() => onChange({ videoPosition: "left" })}>◀ Left</button>
            <button type="button" className={tw(d.videoPosition === "right" ? "active" : "")} onClick={() => onChange({ videoPosition: "right" })}>Right ▶</button>
          </div>
          <input value={d.heading as string} onChange={e => onChange({ heading: e.target.value })} placeholder="Feature title" className={utilities("rde-input-lg", [987, "[:where(&).rde-input-lg]:font-bold! [:where(&).rde-input-lg]:[font-size:13px]!"])} />
          <TextFormattingBar
            fontSize={d.headingSize as string} fontWeight={undefined}
            onFontSize={v => onChange({ headingSize: v })} onFontWeight={undefined}
            showAlign align={d.textAlign as string || "left"} onAlign={v => onChange({ textAlign: v })}
          />
          <textarea value={d.text as string} onChange={e => onChange({ text: e.target.value })} placeholder="Feature description…" rows={3} />
          <TextFormattingBar
            fontSize={d.textSize as string} fontWeight={d.textWeight as string}
            onFontSize={v => onChange({ textSize: v })} onFontWeight={v => onChange({ textWeight: v })}
          />
        </div>
      );

    /* ── Feature Grid ── */
    case "grid": {
      const cards = (d.cards as Array<{ imageUrl: string; title: string; description: string }>) || [];
      return (
        <div className={utilities("rde-edit-grid", [1010, "[:where(&).rde-edit-grid]:grid [:where(&).rde-edit-grid]:[gap:8px]"])}>
          <div className={utilities("rde-grid-top", [1011, "[:where(&).rde-grid-top]:flex [:where(&).rde-grid-top]:items-center [:where(&).rde-grid-top]:justify-between"])}>
            <div className={utilities("rde-toggle-row", [989, "[:where(&).rde-toggle-row]:flex [:where(&).rde-toggle-row]:items-center [:where(&).rde-toggle-row]:[gap:4px]"], [991, "[:where(&).rde-toggle-row_button]:[padding:4px_10px] [:where(&).rde-toggle-row_button]:[border:1px_solid_#d6e1ef] [:where(&).rde-toggle-row_button]:[border-radius:5px] [:where(&).rde-toggle-row_button]:[background:#fff] [:where(&).rde-toggle-row_button]:[font-size:10px] [:where(&).rde-toggle-row_button]:font-semibold [:where(&).rde-toggle-row_button]:cursor-pointer [:where(&).rde-toggle-row_button]:[color:#64748b] [:where(&).rde-toggle-row_button]:[transition:all_0.15s]"], [993, "[:where(&).rde-toggle-row_button:hover:not(.active)]:[background:#f5f8ff]"])}>
              <span className={utilities("rde-toggle-label", [990, "[:where(&).rde-toggle-label]:[font-size:10px] [:where(&).rde-toggle-label]:font-bold [:where(&).rde-toggle-label]:[color:#64748b] [:where(&).rde-toggle-label]:[margin-right:4px] [:where(&).rde-toggle-label]:whitespace-nowrap"])}>Columns</span>
              {[2, 3, 4].map(n => (
                <button key={n} type="button" className={tw(Number(d.columns) === n ? "active" : "")} onClick={() => onChange({ columns: n })}>{n}</button>
              ))}
            </div>
            <span className={utilities("rde-grid-count", [1012, "[:where(&).rde-grid-count]:[font-size:9px] [:where(&).rde-grid-count]:[color:#8898ad] [:where(&).rde-grid-count]:font-semibold"])}>{cards.length} cards</span>
          </div>
          
          <div className={utilities("rde-grid-formatting", [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[padding:12px_0] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-bottom:1px_dashed_#cbd5e1] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-bottom:12px]"])} >
            <span className={utilities("rde-format-label", [2164, "[:where(&).rde-format-label]:[font-size:0.625rem] [:where(&).rde-format-label]:font-semibold [:where(&).rde-format-label]:uppercase [:where(&).rde-format-label]:[color:#94a3b8] [:where(&).rde-format-label]:[letter-spacing:0.03125rem] [:where(&).rde-format-label]:whitespace-nowrap"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-bottom:6px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:block"])} >Title Formatting</span>
            <TextFormattingBar
              fontSize={d.titleSize as string || "1.125rem"}
              fontWeight={d.titleWeight as string || "700"}
              onFontSize={v => onChange({ titleSize: v })}
              onFontWeight={v => onChange({ titleWeight: v })}
              showAlign
              align={d.titleAlign as string || "left"}
              onAlign={v => onChange({ titleAlign: v })}
            />
            <span className={utilities("rde-format-label", [2164, "[:where(&).rde-format-label]:[font-size:0.625rem] [:where(&).rde-format-label]:font-semibold [:where(&).rde-format-label]:uppercase [:where(&).rde-format-label]:[color:#94a3b8] [:where(&).rde-format-label]:[letter-spacing:0.03125rem] [:where(&).rde-format-label]:whitespace-nowrap"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-top:12px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-bottom:6px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:block"])} >Description Formatting</span>
            <TextFormattingBar
              fontSize={d.descSize as string || "0.844rem"}
              fontWeight={d.descWeight as string || "normal"}
              onFontSize={v => onChange({ descSize: v })}
              onFontWeight={v => onChange({ descWeight: v })}
              showAlign
              align={d.descAlign as string || "left"}
              onAlign={v => onChange({ descAlign: v })}
            />
          </div>

          <div className={utilities("rde-grid-cards", [1013, "[:where(&).rde-grid-cards]:grid [:where(&).rde-grid-cards]:[grid-template-columns:1fr_1fr] [:where(&).rde-grid-cards]:[gap:6px]"], [1540, "[@media_(max-width:_720px)]:[:where(&).rde-grid-cards]:[grid-template-columns:1fr]"])}>
            {cards.map((card, i) => (
              <div className={utilities("rde-grid-card", [1014, "[:where(&).rde-grid-card]:grid [:where(&).rde-grid-card]:[gap:4px] [:where(&).rde-grid-card]:[padding:8px] [:where(&).rde-grid-card]:[border:1px_solid_#e2e8f0] [:where(&).rde-grid-card]:[border-radius:7px] [:where(&).rde-grid-card]:[background:#f8fafc] [:where(&).rde-grid-card]:relative"])} key={i}>
                <button type="button" className={utilities("rde-grid-card-x", [1015, "[:where(&).rde-grid-card-x]:absolute [:where(&).rde-grid-card-x]:[top:4px] [:where(&).rde-grid-card-x]:[right:4px] [:where(&).rde-grid-card-x]:[width:20px] [:where(&).rde-grid-card-x]:[height:20px] [:where(&).rde-grid-card-x]:grid [:where(&).rde-grid-card-x]:[place-items:center] [:where(&).rde-grid-card-x]:[border:0] [:where(&).rde-grid-card-x]:[border-radius:4px] [:where(&).rde-grid-card-x]:[color:#94a3b8] [:where(&).rde-grid-card-x]:[background:transparent] [:where(&).rde-grid-card-x]:cursor-pointer [:where(&).rde-grid-card-x]:[font-size:13px] [:where(&).rde-grid-card-x]:[transition:all_0.15s] [:where(&).rde-grid-card-x]:[z-index:1]"], [1016, "[:where(&).rde-grid-card-x:hover]:[background:#fde8e8] [:where(&).rde-grid-card-x:hover]:[color:#dc2626]"])} onClick={() => onChange({ cards: cards.filter((_: { imageUrl: string; title: string; description: string }, j: number) => j !== i) })}>×</button>
                <MediaUploadField value={card.imageUrl} onChange={url => { const next = [...cards]; next[i] = { ...next[i], imageUrl: url }; onChange({ cards: next }); }} placeholder="Card image URL" />
                {card.imageUrl && <img className={utilities("rde-grid-card-thumb", [1017, "[:where(&).rde-grid-card-thumb]:[width:100%] [:where(&).rde-grid-card-thumb]:[height:52px] [:where(&).rde-grid-card-thumb]:object-cover [:where(&).rde-grid-card-thumb]:[border-radius:4px] [:where(&).rde-grid-card-thumb]:[border:1px_solid_#e2e8f0]"])} src={card.imageUrl} alt={card.title || "Card"} />}
                <input value={card.title} onChange={e => { const next = [...cards]; next[i] = { ...next[i], title: e.target.value }; onChange({ cards: next }); }} placeholder="Card title"  {...withTailwindStyle(tw("rde-input-sm-bold"), { textAlign: (d.titleAlign as any) || "left" })} />
                <input value={card.description} onChange={e => { const next = [...cards]; next[i] = { ...next[i], description: e.target.value }; onChange({ cards: next }); }} placeholder="Brief description" {...withTailwindStyle(tw(undefined), { textAlign: (d.descAlign as any) || "left" })} />
              </div>
            ))}
          </div>
          {cards.length < 10 && (
            <button type="button" className={utilities("rde-add-row", [1032, "[:where(&).rde-add-row]:inline-flex [:where(&).rde-add-row]:items-center [:where(&).rde-add-row]:[gap:4px] [:where(&).rde-add-row]:[border:1px_dashed_#d0daea] [:where(&).rde-add-row]:[border-radius:5px] [:where(&).rde-add-row]:[padding:5px_10px] [:where(&).rde-add-row]:[color:#64748b] [:where(&).rde-add-row]:[background:transparent] [:where(&).rde-add-row]:cursor-pointer [:where(&).rde-add-row]:[font-size:10px] [:where(&).rde-add-row]:font-semibold [:where(&).rde-add-row]:[justify-self:start] [:where(&).rde-add-row]:[transition:all_0.15s]"], [1033, "[:where(&).rde-add-row:hover]:[border-color:#8eafe0] [:where(&).rde-add-row:hover]:[color:#155fc5] [:where(&).rde-add-row:hover]:[background:#f5f8ff]"])} onClick={() => onChange({ cards: [...cards, { imageUrl: "", title: "", description: "" }] })}>
              <Plus size={12} /> Add card ({cards.length}/10)
            </button>
          )}
        </div>
      );
    }

    /* ── Heading ── */
    case "heading":
      return (
        <div className={utilities("rde-edit-heading", [1018, "[:where(&).rde-edit-heading]:items-center"], [1019, "[:where(&).rde-edit-heading_select]:text-center"], [2156, "[:is(:where(&).rde-edit-heading)]:flex [:is(:where(&).rde-edit-heading)]:flex-col [:is(:where(&).rde-edit-heading)]:[gap:6px]"], [2158, "[:is(:where(&).rde-edit-heading_select)]:[width:160px] [:is(:where(&).rde-edit-heading_select)]:[flex-shrink:0] [:is(:where(&).rde-edit-heading_select)]:font-semibold"], [2159, "[:where(&).rde-edit-heading_input]:[flex:1] [:where(&).rde-edit-heading_input]:font-bold [:where(&).rde-edit-heading_input]:[font-size:13px]"])}>
          <div className={utilities("rde-heading-top", [2157, "[:where(&).rde-heading-top]:flex [:where(&).rde-heading-top]:[gap:6px] [:where(&).rde-heading-top]:items-center"])}>
            <select value={(d.level as string) || "h2"} onChange={e => onChange({ level: e.target.value })}>
              <option value="h2">H2 — Section</option><option value="h3">H3 — Sub-section</option><option value="h4">H4 — Small</option>
            </select>
          </div>
          <input value={d.text as string} onChange={e => onChange({ text: e.target.value })} placeholder="Heading text" className={utilities("rde-input-lg", [987, "[:where(&).rde-input-lg]:font-bold! [:where(&).rde-input-lg]:[font-size:13px]!"])} />
          <TextFormattingBar
            fontSize={d.fontSize as string} fontWeight={d.fontWeight as string}
            onFontSize={v => onChange({ fontSize: v })} onFontWeight={v => onChange({ fontWeight: v })}
            showAlign align={d.align as string} onAlign={v => onChange({ align: v })}
          />
        </div>
      );

    /* ── Paragraph ── */
    case "paragraph":
      return (
        <div className={utilities("rde-edit-para", [2160, "[:where(&).rde-edit-para]:flex [:where(&).rde-edit-para]:flex-col [:where(&).rde-edit-para]:[gap:6px]"])}>
          <textarea className={utilities("rde-edit-text", [2161, "[:where(&).rde-edit-text]:[width:100%] [:where(&).rde-edit-text]:[min-height:60px]"])} value={d.text as string} onChange={e => onChange({ text: e.target.value })} placeholder="Paragraph text…" rows={3} />
          <TextFormattingBar
            fontSize={d.fontSize as string} fontWeight={d.fontWeight as string}
            onFontSize={v => onChange({ fontSize: v })} onFontWeight={v => onChange({ fontWeight: v })}
            showAlign align={d.align as string} onAlign={v => onChange({ align: v })}
          />
        </div>
      );

    /* ── Full Image ── */
    case "image":
      return (
        <div className={utilities("rde-edit-image", [1020, "[:where(&).rde-edit-image]:grid [:where(&).rde-edit-image]:[gap:6px]"])}>
          <MediaUploadField value={d.url as string} onChange={url => onChange({ url })} placeholder="Image URL (paste or upload)" />
          <div className={utilities("rde-edit-image-row", [1021, "[:where(&).rde-edit-image-row]:grid [:where(&).rde-edit-image-row]:[grid-template-columns:1fr_1fr] [:where(&).rde-edit-image-row]:[gap:6px]"], [1539, "[@media_(max-width:_720px)]:[:where(&).rde-edit-image-row]:[grid-template-columns:1fr]"])}>
            <input value={d.alt as string} onChange={e => onChange({ alt: e.target.value })} placeholder="Alt text" />
            <input value={d.caption as string} onChange={e => onChange({ caption: e.target.value })} placeholder="Caption (optional)" />
          </div>
          {(d.url as string) && <img className={utilities("rde-image-preview", [1022, "[:where(&).rde-image-preview]:[width:100%] [:where(&).rde-image-preview]:[max-height:120px] [:where(&).rde-image-preview]:object-cover [:where(&).rde-image-preview]:[border-radius:6px] [:where(&).rde-image-preview]:[margin-top:4px] [:where(&).rde-image-preview]:[border:1px_solid_#e2e8f0]"])} src={d.url as string} alt={(d.alt as string) || "Preview"} />}
        </div>
      );

    /* ── Checklist ── */
    case "checklist": {
      const items = (d.items as string[]) || [];
      return (
        <div className={utilities("rde-edit-list", [1023, "[:where(&).rde-edit-list,_:where(&).rde-edit-table]:grid [:where(&).rde-edit-list,_:where(&).rde-edit-table]:[gap:4px]"])}>
          {items.map((item: string, i: number) => (
            <div className={utilities("rde-list-item", [1024, "[:where(&).rde-list-item,_:where(&).rde-table-row]:flex [:where(&).rde-list-item,_:where(&).rde-table-row]:[gap:4px] [:where(&).rde-list-item,_:where(&).rde-table-row]:items-center"], [1025, "[:where(&).rde-list-item_input,_:where(&).rde-table-row_input]:[flex:1]"], [1030, "[:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[width:22px] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[height:22px] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:grid [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[place-items:center] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[border:0] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[border-radius:4px] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[color:#94a3b8] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[background:transparent] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:cursor-pointer [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[flex-shrink:0] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[font-size:14px] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[transition:all_0.15s]"], [1031, "[:where(&).rde-list-item_button:hover,_:where(&).rde-table-row_button:hover]:[background:#fde8e8] [:where(&).rde-list-item_button:hover,_:where(&).rde-table-row_button:hover]:[color:#dc2626]"])} key={i}>
              <span className={utilities("rde-list-bullet", [1026, "[:where(&).rde-list-bullet]:[width:18px] [:where(&).rde-list-bullet]:text-center [:where(&).rde-list-bullet]:[color:#10b981] [:where(&).rde-list-bullet]:font-bold [:where(&).rde-list-bullet]:[font-size:11px] [:where(&).rde-list-bullet]:[flex-shrink:0]"])}>✓</span>
              <input value={item} onChange={e => { const next = [...items]; next[i] = e.target.value; onChange({ items: next }); }} placeholder={`Feature ${i + 1}`} />
              <button type="button" onClick={() => onChange({ items: items.filter((_: string, j: number) => j !== i) })}>×</button>
            </div>
          ))}
          <TextFormattingBar
            fontSize={d.fontSize as string} fontWeight={undefined}
            onFontSize={v => onChange({ fontSize: v })} onFontWeight={undefined}
          />
          <button type="button" className={utilities("rde-add-row", [1032, "[:where(&).rde-add-row]:inline-flex [:where(&).rde-add-row]:items-center [:where(&).rde-add-row]:[gap:4px] [:where(&).rde-add-row]:[border:1px_dashed_#d0daea] [:where(&).rde-add-row]:[border-radius:5px] [:where(&).rde-add-row]:[padding:5px_10px] [:where(&).rde-add-row]:[color:#64748b] [:where(&).rde-add-row]:[background:transparent] [:where(&).rde-add-row]:cursor-pointer [:where(&).rde-add-row]:[font-size:10px] [:where(&).rde-add-row]:font-semibold [:where(&).rde-add-row]:[justify-self:start] [:where(&).rde-add-row]:[transition:all_0.15s]"], [1033, "[:where(&).rde-add-row:hover]:[border-color:#8eafe0] [:where(&).rde-add-row:hover]:[color:#155fc5] [:where(&).rde-add-row:hover]:[background:#f5f8ff]"])} onClick={() => onChange({ items: [...items, ""] })}><Plus size={12} /> Add item</button>
        </div>
      );
    }

    /* ── Spec Table ── */
    case "spec-table": {
      const categories = (d.categories as string[]) || [];
      const rows = (d.rows as Array<{ key: string; value: string; category: string }>) || [];
      return (
        <div className={utilities("rde-edit-table", [1023, "[:where(&).rde-edit-list,_:where(&).rde-edit-table]:grid [:where(&).rde-edit-list,_:where(&).rde-edit-table]:[gap:4px]"])}>
          {/* Heading Size */}
          <div className={utilities("rde-spec-heading-edit", [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-bottom:15px]"])} >
            <span className={utilities("rde-format-label", [2164, "[:where(&).rde-format-label]:[font-size:0.625rem] [:where(&).rde-format-label]:font-semibold [:where(&).rde-format-label]:uppercase [:where(&).rde-format-label]:[color:#94a3b8] [:where(&).rde-format-label]:[letter-spacing:0.03125rem] [:where(&).rde-format-label]:whitespace-nowrap"])}>Specification Heading Size</span>
            <TextFormattingBar
               fontSize={d.headingSize as string || "1.5rem"}
               onFontSize={v => onChange({ headingSize: v })}
            />
          </div>

          {/* Category manager */}
          <div className={utilities("rde-spec-cats", [2839, "[:where(&).rde-spec-cats]:[padding:0.625rem_0.75rem] [:where(&).rde-spec-cats]:[background:#f8fafc] [:where(&).rde-spec-cats]:[border:1px_solid_#e2e8f0] [:where(&).rde-spec-cats]:[border-radius:0.5rem] [:where(&).rde-spec-cats]:[margin-bottom:0.625rem]"])}>
            <div className={utilities("rde-spec-cats-header", [2840, "[:where(&).rde-spec-cats-header]:flex [:where(&).rde-spec-cats-header]:justify-between [:where(&).rde-spec-cats-header]:items-center [:where(&).rde-spec-cats-header]:[margin-bottom:0.5rem]"])}>
              <span className={utilities("rde-format-label", [2164, "[:where(&).rde-format-label]:[font-size:0.625rem] [:where(&).rde-format-label]:font-semibold [:where(&).rde-format-label]:uppercase [:where(&).rde-format-label]:[color:#94a3b8] [:where(&).rde-format-label]:[letter-spacing:0.03125rem] [:where(&).rde-format-label]:whitespace-nowrap"])}>Categories</span>
              <button type="button" className={utilities("rde-add-cat-btn", [2841, "[:where(&).rde-add-cat-btn]:[font-size:0.6875rem] [:where(&).rde-add-cat-btn]:[padding:0.25rem_0.625rem] [:where(&).rde-add-cat-btn]:[border:1px_solid_#e51e2a] [:where(&).rde-add-cat-btn]:[background:white] [:where(&).rde-add-cat-btn]:[color:#e51e2a] [:where(&).rde-add-cat-btn]:[border-radius:0.3125rem] [:where(&).rde-add-cat-btn]:cursor-pointer [:where(&).rde-add-cat-btn]:font-semibold [:where(&).rde-add-cat-btn]:[transition:all_0.15s]"], [2842, "[:where(&).rde-add-cat-btn:hover]:[background:#e51e2a] [:where(&).rde-add-cat-btn:hover]:[color:white]"])} onClick={() => {
                const name = prompt("Category name (e.g. Aircraft, Camera):");
                if (name?.trim() && !categories.includes(name.trim())) onChange({ categories: [...categories, name.trim()] });
              }}>+ Add Category</button>
            </div>
            <div className={utilities("rde-spec-cat-pills", [2843, "[:where(&).rde-spec-cat-pills]:flex [:where(&).rde-spec-cat-pills]:flex-wrap [:where(&).rde-spec-cat-pills]:[gap:6px] [:where(&).rde-spec-cat-pills]:[min-height:26px]"])}>
              {categories.map((cat, ci) => (
                <span key={ci} className={utilities("rde-spec-cat-tag", [2844, "[:where(&).rde-spec-cat-tag]:inline-flex [:where(&).rde-spec-cat-tag]:items-center [:where(&).rde-spec-cat-tag]:[gap:4px] [:where(&).rde-spec-cat-tag]:[padding:3px_8px_3px_10px] [:where(&).rde-spec-cat-tag]:[background:#e51e2a15] [:where(&).rde-spec-cat-tag]:[border:1px_solid_#e51e2a40] [:where(&).rde-spec-cat-tag]:[border-radius:999px] [:where(&).rde-spec-cat-tag]:[font-size:12px] [:where(&).rde-spec-cat-tag]:font-medium [:where(&).rde-spec-cat-tag]:[color:#c0161f]"], [2845, "[:where(&).rde-spec-cat-tag_button]:[background:none] [:where(&).rde-spec-cat-tag_button]:[border:none] [:where(&).rde-spec-cat-tag_button]:cursor-pointer [:where(&).rde-spec-cat-tag_button]:[color:#e51e2a] [:where(&).rde-spec-cat-tag_button]:[font-size:14px] [:where(&).rde-spec-cat-tag_button]:[line-height:1] [:where(&).rde-spec-cat-tag_button]:[padding:0] [:where(&).rde-spec-cat-tag_button]:flex [:where(&).rde-spec-cat-tag_button]:items-center"])}>
                  {cat}
                  <button type="button" onClick={() => {
                    const next = categories.filter((_: string, j: number) => j !== ci);
                    const updatedRows = rows.map(r => ({ ...r, category: r.category === cat ? "" : r.category }));
                    onChange({ categories: next, rows: updatedRows });
                  }}>×</button>
                </span>
              ))}
              {categories.length === 0 && <span className={utilities("rde-format-label", [2164, "[:where(&).rde-format-label]:[font-size:0.625rem] [:where(&).rde-format-label]:font-semibold [:where(&).rde-format-label]:uppercase [:where(&).rde-format-label]:[color:#94a3b8] [:where(&).rde-format-label]:[letter-spacing:0.03125rem] [:where(&).rde-format-label]:whitespace-nowrap"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:italic"])} >No categories yet — specs will show in one flat list</span>}
            </div>
          </div>

          {/* Row editor */}
          <div className={utilities("rde-table-header", [1027, "[:where(&).rde-table-header]:flex [:where(&).rde-table-header]:[gap:4px] [:where(&).rde-table-header]:[padding:0_0_4px] [:where(&).rde-table-header]:[border-bottom:1px_solid_#e8edf4] [:where(&).rde-table-header]:[margin-bottom:4px]"], [1028, "[:where(&).rde-table-header_span]:[flex:1] [:where(&).rde-table-header_span]:[font-size:9px] [:where(&).rde-table-header_span]:font-bold [:where(&).rde-table-header_span]:[color:#8898ad] [:where(&).rde-table-header_span]:uppercase"], [1029, "[:where(&).rde-table-header_span:last-child]:[width:22px] [:where(&).rde-table-header_span:last-child]:[flex:0_0_22px]"])}><span>Spec Name</span><span>Value</span><span>Category</span><span /></div>
          {rows.map((row, i) => (
            <div className={utilities("rde-table-row rde-table-row-4", [1024, "[:where(&).rde-list-item,_:where(&).rde-table-row]:flex [:where(&).rde-list-item,_:where(&).rde-table-row]:[gap:4px] [:where(&).rde-list-item,_:where(&).rde-table-row]:items-center"], [1025, "[:where(&).rde-list-item_input,_:where(&).rde-table-row_input]:[flex:1]"], [1030, "[:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[width:22px] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[height:22px] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:grid [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[place-items:center] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[border:0] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[border-radius:4px] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[color:#94a3b8] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[background:transparent] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:cursor-pointer [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[flex-shrink:0] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[font-size:14px] [:where(&).rde-list-item_button,_:where(&).rde-table-row_button]:[transition:all_0.15s]"], [1031, "[:where(&).rde-list-item_button:hover,_:where(&).rde-table-row_button:hover]:[background:#fde8e8] [:where(&).rde-list-item_button:hover,_:where(&).rde-table-row_button:hover]:[color:#dc2626]"], [2846, "[:where(&).rde-table-row-4]:[grid-template-columns:1fr_1fr_auto_auto]!"], [2847, "[:where(&).rde-table-row-4_select]:[font-size:12px] [:where(&).rde-table-row-4_select]:[padding:4px_6px] [:where(&).rde-table-row-4_select]:[border:1px_solid_#d1d9e6] [:where(&).rde-table-row-4_select]:[border-radius:5px] [:where(&).rde-table-row-4_select]:[background:white] [:where(&).rde-table-row-4_select]:[height:32px]"])} key={i}>
              <input value={row.key} onChange={e => { const next = [...rows]; next[i] = { ...next[i], key: e.target.value }; onChange({ rows: next }); }} placeholder="Spec name" />
              <input value={row.value} onChange={e => { const next = [...rows]; next[i] = { ...next[i], value: e.target.value }; onChange({ rows: next }); }} placeholder="Value" />
              <select value={row.category || ""} onChange={e => { const next = [...rows]; next[i] = { ...next[i], category: e.target.value }; onChange({ rows: next }); }}>
                <option value="">— All —</option>
                {categories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <button type="button" onClick={() => onChange({ rows: rows.filter((_: { key: string; value: string; category: string }, j: number) => j !== i) })}>×</button>
            </div>
          ))}
          <button type="button" className={utilities("rde-add-row", [1032, "[:where(&).rde-add-row]:inline-flex [:where(&).rde-add-row]:items-center [:where(&).rde-add-row]:[gap:4px] [:where(&).rde-add-row]:[border:1px_dashed_#d0daea] [:where(&).rde-add-row]:[border-radius:5px] [:where(&).rde-add-row]:[padding:5px_10px] [:where(&).rde-add-row]:[color:#64748b] [:where(&).rde-add-row]:[background:transparent] [:where(&).rde-add-row]:cursor-pointer [:where(&).rde-add-row]:[font-size:10px] [:where(&).rde-add-row]:font-semibold [:where(&).rde-add-row]:[justify-self:start] [:where(&).rde-add-row]:[transition:all_0.15s]"], [1033, "[:where(&).rde-add-row:hover]:[border-color:#8eafe0] [:where(&).rde-add-row:hover]:[color:#155fc5] [:where(&).rde-add-row:hover]:[background:#f5f8ff]"])} onClick={() => onChange({ rows: [...rows, { key: "", value: "", category: categories[0] || "" }] })}><Plus size={12} /> Add row</button>
        </div>
      );
    }

    /* ── ITB Builder ── */
    case "itb": {
      const tabs = (d.tabs as Array<{ tabName: string; items: Array<{ name: string; image: string }> }>) || [];
      return (
        <div className="rde-edit-itb">
          <p className={utilities("rde-format-label", [2164, "[:where(&).rde-format-label]:[font-size:0.625rem] [:where(&).rde-format-label]:font-semibold [:where(&).rde-format-label]:uppercase [:where(&).rde-format-label]:[color:#94a3b8] [:where(&).rde-format-label]:[letter-spacing:0.03125rem] [:where(&).rde-format-label]:whitespace-nowrap"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-bottom:10px]"])} >In the Box comparison grid (e.g. Fly More Combo vs Drone Only)</p>
          {tabs.map((tab, ti) => (
            <div key={ti} className={utilities("rde-itb-tab-block", [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[background:#f8fafc] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[padding:12px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-radius:8px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-bottom:10px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border:1px_solid_#e2e8f0]"])} >
              <div className={utilities("rde-itb-tab-header", [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[gap:8px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-bottom:10px]"])} >
                <input className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[flex:1] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[font-weight:bold]"])} value={tab.tabName} onChange={e => { const next = [...tabs]; next[ti] = { ...next[ti], tabName: e.target.value }; onChange({ tabs: next }); }} placeholder="Tab name (e.g. Fly More Combo)" />
                <button type="button" className={utilities("icon-button danger", [177, "[:where(&).icon-button]:inline-grid [:where(&).icon-button]:[place-items:center] [:where(&).icon-button]:[border:1px_solid_var(--line)] [:where(&).icon-button]:[border-radius:6px] [:where(&).icon-button]:[background:#fff] [:where(&).icon-button]:[width:34px] [:where(&).icon-button]:[height:34px] [:where(&).icon-button]:[color:#50617b] [:where(&).icon-button]:cursor-pointer"], [178, "[:where(&).icon-button:hover]:[border-color:#8fa5cd] [:where(&).icon-button:hover]:[color:#1d5fc3]"], [179, "[:where(&).icon-button.danger:hover]:[border-color:#efb3b6] [:where(&).icon-button.danger:hover]:[color:var(--red)]"], [1838, "[.admin-media-grid_:where(&).icon-button]:absolute [.admin-media-grid_:where(&).icon-button]:[right:14px] [.admin-media-grid_:where(&).icon-button]:[top:14px] [.admin-media-grid_:where(&).icon-button]:[background:#fff]"], [2633, "[.order-actions_:where(&).icon-button.is-active]:[border-color:#e51f2a] [.order-actions_:where(&).icon-button.is-active]:[color:#e51f2a] [.order-actions_:where(&).icon-button.is-active]:[background:#fff5f5]"], [2638, "[.order-action-menu_button:where(&).danger]:[color:#e02634] [.order-action-menu_button:where(&).danger]:[border-top:1px_solid_#edf1f6] [.order-action-menu_button:where(&).danger]:[border-radius:0_0_7px_7px] [.order-action-menu_button:where(&).danger]:[margin-top:3px] [.order-action-menu_button:where(&).danger]:[padding-top:11px]"], [2639, "[.order-action-menu_button:where(&).danger:hover]:[background:#fff1f2] [.order-action-menu_button:where(&).danger:hover]:[color:#c81826]"], [3354, "[.crud-row_:where(&).icon-button]:[width:30px] [.crud-row_:where(&).icon-button]:[height:30px] [.crud-row_:where(&).icon-button]:[border-color:#e2e9f2] [.crud-row_:where(&).icon-button]:[border-radius:8px]"], [3369, "[@media_(max-width:_720px)]:[.crud-row_:where(&).icon-button]:[width:28px] [@media_(max-width:_720px)]:[.crud-row_:where(&).icon-button]:[height:28px]"])} onClick={() => onChange({ tabs: tabs.filter((_, j) => j !== ti) })}>×</button>
              </div>
              <div className={utilities("rde-itb-items", [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[padding-left:20px]"])} >
                {tab.items.map((item, ii) => (
                  <div key={ii} className={utilities("rde-itb-item-row", [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[gap:8px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-bottom:8px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:items-center"])} >
                    <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[flex-shrink:0] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:40px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[height:40px]"])}>
                       <MediaUploadField value={item.image} onChange={url => { const next = [...tabs]; const items = [...next[ti].items]; items[ii] = { ...items[ii], image: url }; next[ti] = { ...next[ti], items }; onChange({ tabs: next }); }} mini />
                    </div>
                    <input className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[flex:1]"])} value={item.name} onChange={e => { const next = [...tabs]; const items = [...next[ti].items]; items[ii] = { ...items[ii], name: e.target.value }; next[ti] = { ...next[ti], items }; onChange({ tabs: next }); }} placeholder="Item name (e.g. 1 x DJI RC 2)" />
                    <button type="button" className={utilities("icon-button danger", [177, "[:where(&).icon-button]:inline-grid [:where(&).icon-button]:[place-items:center] [:where(&).icon-button]:[border:1px_solid_var(--line)] [:where(&).icon-button]:[border-radius:6px] [:where(&).icon-button]:[background:#fff] [:where(&).icon-button]:[width:34px] [:where(&).icon-button]:[height:34px] [:where(&).icon-button]:[color:#50617b] [:where(&).icon-button]:cursor-pointer"], [178, "[:where(&).icon-button:hover]:[border-color:#8fa5cd] [:where(&).icon-button:hover]:[color:#1d5fc3]"], [179, "[:where(&).icon-button.danger:hover]:[border-color:#efb3b6] [:where(&).icon-button.danger:hover]:[color:var(--red)]"], [1838, "[.admin-media-grid_:where(&).icon-button]:absolute [.admin-media-grid_:where(&).icon-button]:[right:14px] [.admin-media-grid_:where(&).icon-button]:[top:14px] [.admin-media-grid_:where(&).icon-button]:[background:#fff]"], [2633, "[.order-actions_:where(&).icon-button.is-active]:[border-color:#e51f2a] [.order-actions_:where(&).icon-button.is-active]:[color:#e51f2a] [.order-actions_:where(&).icon-button.is-active]:[background:#fff5f5]"], [2638, "[.order-action-menu_button:where(&).danger]:[color:#e02634] [.order-action-menu_button:where(&).danger]:[border-top:1px_solid_#edf1f6] [.order-action-menu_button:where(&).danger]:[border-radius:0_0_7px_7px] [.order-action-menu_button:where(&).danger]:[margin-top:3px] [.order-action-menu_button:where(&).danger]:[padding-top:11px]"], [2639, "[.order-action-menu_button:where(&).danger:hover]:[background:#fff1f2] [.order-action-menu_button:where(&).danger:hover]:[color:#c81826]"], [3354, "[.crud-row_:where(&).icon-button]:[width:30px] [.crud-row_:where(&).icon-button]:[height:30px] [.crud-row_:where(&).icon-button]:[border-color:#e2e9f2] [.crud-row_:where(&).icon-button]:[border-radius:8px]"], [3369, "[@media_(max-width:_720px)]:[.crud-row_:where(&).icon-button]:[width:28px] [@media_(max-width:_720px)]:[.crud-row_:where(&).icon-button]:[height:28px]"])} onClick={() => { const next = [...tabs]; next[ti] = { ...next[ti], items: next[ti].items.filter((_, j) => j !== ii) }; onChange({ tabs: next }); }}>×</button>
                  </div>
                ))}
                <button type="button" className={utilities("text-button rde-add-row", [1032, "[:where(&).rde-add-row]:inline-flex [:where(&).rde-add-row]:items-center [:where(&).rde-add-row]:[gap:4px] [:where(&).rde-add-row]:[border:1px_dashed_#d0daea] [:where(&).rde-add-row]:[border-radius:5px] [:where(&).rde-add-row]:[padding:5px_10px] [:where(&).rde-add-row]:[color:#64748b] [:where(&).rde-add-row]:[background:transparent] [:where(&).rde-add-row]:cursor-pointer [:where(&).rde-add-row]:[font-size:10px] [:where(&).rde-add-row]:font-semibold [:where(&).rde-add-row]:[justify-self:start] [:where(&).rde-add-row]:[transition:all_0.15s]"], [1033, "[:where(&).rde-add-row:hover]:[border-color:#8eafe0] [:where(&).rde-add-row:hover]:[color:#155fc5] [:where(&).rde-add-row:hover]:[background:#f5f8ff]"], [1609, "[:where(&).text-button]:[border:0] [:where(&).text-button]:[background:transparent] [:where(&).text-button]:[color:#c81f2a] [:where(&).text-button]:cursor-pointer [:where(&).text-button]:[text-decoration:underline]"], [1984, "[.admin-spec-items_:where(&).text-button]:[margin-top:4px] [.admin-spec-items_:where(&).text-button]:[font-size:12px]"])} onClick={() => { const next = [...tabs]; next[ti] = { ...next[ti], items: [...next[ti].items, { name: "", image: "" }] }; onChange({ tabs: next }); }}><Plus size={12} /> Add item</button>
              </div>
            </div>
          ))}
          <button type="button" className={utilities("rde-add-row", [1032, "[:where(&).rde-add-row]:inline-flex [:where(&).rde-add-row]:items-center [:where(&).rde-add-row]:[gap:4px] [:where(&).rde-add-row]:[border:1px_dashed_#d0daea] [:where(&).rde-add-row]:[border-radius:5px] [:where(&).rde-add-row]:[padding:5px_10px] [:where(&).rde-add-row]:[color:#64748b] [:where(&).rde-add-row]:[background:transparent] [:where(&).rde-add-row]:cursor-pointer [:where(&).rde-add-row]:[font-size:10px] [:where(&).rde-add-row]:font-semibold [:where(&).rde-add-row]:[justify-self:start] [:where(&).rde-add-row]:[transition:all_0.15s]"], [1033, "[:where(&).rde-add-row:hover]:[border-color:#8eafe0] [:where(&).rde-add-row:hover]:[color:#155fc5] [:where(&).rde-add-row:hover]:[background:#f5f8ff]"])} onClick={() => onChange({ tabs: [...tabs, { tabName: "New Tab", items: [{ name: "", image: "" }] }] })}><Plus size={12} /> Add ITB Tab</button>
        </div>
      );
    }

    /* ── Video ── */
    case "video":
      return (
        <div className={utilities("rde-edit-video", [1034, "[:where(&).rde-edit-video]:grid [:where(&).rde-edit-video]:[gap:8px]"])}>
          <label className={utilities("rde-field-label", [2170, "[:where(&).rde-field-label]:[font-size:0.6875rem] [:where(&).rde-field-label]:font-semibold [:where(&).rde-field-label]:[color:#5a6a7a] [:where(&).rde-field-label]:uppercase [:where(&).rde-field-label]:[letter-spacing:0.01875rem] [:where(&).rde-field-label]:[margin-bottom:0.125rem] [:where(&).rde-field-label]:block"])}>Video file</label>
          <MediaUploadField accept="video/mp4,video/webm" value={d.url as string} onChange={e => onChange({ url: e })} placeholder="Upload video or enter URL" />
        </div>
      );

    /* ── Info Box ── */
    case "info-box":
      return (
        <div className={utilities("rde-edit-info", [1037, "[:where(&).rde-edit-info]:grid [:where(&).rde-edit-info]:[gap:6px]"], [1038, "[:where(&).rde-edit-info_select]:[width:auto] [:where(&).rde-edit-info_select]:[justify-self:start]"])}>
          <select value={(d.variant as string) || "tip"} onChange={e => onChange({ variant: e.target.value, title: e.target.value === "warning" ? "⚠️ Warning" : e.target.value === "note" ? "📝 Note" : "💡 Tip" })}>
            <option value="tip">💡 Tip</option><option value="warning">⚠️ Warning</option><option value="note">📝 Note</option>
          </select>
          <input value={d.title as string} onChange={e => onChange({ title: e.target.value })} placeholder="Box title" />
          <textarea value={d.text as string} onChange={e => onChange({ text: e.target.value })} placeholder="Info text…" rows={2} />
          <TextFormattingBar
            fontSize={d.fontSize as string} fontWeight={undefined}
            onFontSize={v => onChange({ fontSize: v })} onFontWeight={undefined}
          />
        </div>
      );

    /* ── Divider ── */
    case "divider":
      return (
        <div className={utilities("rde-edit-divider", [1039, "[:where(&).rde-edit-divider]:flex [:where(&).rde-edit-divider]:[gap:12px] [:where(&).rde-edit-divider]:[padding:4px_0]"], [1040, "[:where(&).rde-edit-divider_label]:inline-flex [:where(&).rde-edit-divider_label]:items-center [:where(&).rde-edit-divider_label]:[gap:4px] [:where(&).rde-edit-divider_label]:[font-size:11px] [:where(&).rde-edit-divider_label]:[color:#49627e] [:where(&).rde-edit-divider_label]:cursor-pointer"])}>
          <label><input type="radio" name={`div-${block.id}`} checked={d.style === "line"} onChange={() => onChange({ style: "line" })} /> Line</label>
          <label><input type="radio" name={`div-${block.id}`} checked={d.style === "dots"} onChange={() => onChange({ style: "dots" })} /> Dots •••</label>
          <label><input type="radio" name={`div-${block.id}`} checked={d.style === "space"} onChange={() => onChange({ style: "space" })} /> Space</label>
        </div>
      );

    default:
      return <p>Unknown block type</p>;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main editor component
   ═══════════════════════════════════════════════════════════════════════════ */

export default function RichDescriptionEditor({ value, onChange }: { value: DescriptionValue; onChange: (v: DescriptionValue) => void }) {
  const [tab, setTab] = useState<"builder" | "html" | "css" | "preview">("builder");
  const [blocks, setBlocks] = useState<Block[]>(() => parseHtml(value.html) || []);
  const [dragOver, setDragOver] = useState(-1);
  const dragRef = useRef<{ source: "palette" | "canvas"; type?: BlockType; index?: number } | null>(null);

  const syncToParent = useCallback((updated: Block[]) => {
    setBlocks(updated);
    onChange({ html: blocksToHtml(updated), css: BUILDER_CSS });
  }, [onChange]);

  function switchTab(next: typeof tab) {
    if (next === "builder" && tab !== "builder") {
      const parsed = parseHtml(value.html);
      if (parsed) setBlocks(parsed);
    }
    setTab(next);
  }

  function addBlock(type: BlockType, atIndex?: number) {
    const b = makeBlock(type);
    const updated = [...blocks];
    if (atIndex !== undefined) updated.splice(atIndex, 0, b); else updated.push(b);
    syncToParent(updated);
  }

  function updateBlock(id: string, patch: Record<string, unknown>) {
    syncToParent(blocks.map(b => b.id === id ? { ...b, data: { ...b.data, ...patch } } : b));
  }

  function removeBlock(id: string) {
    syncToParent(blocks.filter(b => b.id !== id));
  }

  function moveBlock(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex + 1 === toIndex) return;
    const updated = [...blocks];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex > fromIndex ? toIndex - 1 : toIndex, 0, moved);
    syncToParent(updated);
  }

  function onPaletteDragStart(e: React.DragEvent, type: BlockType) {
    dragRef.current = { source: "palette", type };
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", type);
  }

  function onCanvasDragStart(e: React.DragEvent, index: number) {
    dragRef.current = { source: "canvas", index };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    (e.currentTarget as HTMLElement).classList.add("rde-dragging");
  }

  function onZoneDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = dragRef.current?.source === "palette" ? "copy" : "move";
    setDragOver(index);
  }

  function onZoneDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOver(-1);
    const ref = dragRef.current;
    if (!ref) return;
    if (ref.source === "palette" && ref.type) addBlock(ref.type, index);
    else if (ref.source === "canvas" && ref.index !== undefined) moveBlock(ref.index, index);
    dragRef.current = null;
  }

  function onDragEnd() {
    setDragOver(-1);
    dragRef.current = null;
    document.querySelectorAll(".rde-dragging").forEach(el => el.classList.remove("rde-dragging"));
  }

  function insertSnippet(snippet: string) { onChange({ ...value, html: value.html ? `${value.html}\n${snippet}` : snippet }); }

  return (
    <section className={utilities("rich-description-editor", [924, "[:where(&).rich-description-editor]:grid [:where(&).rich-description-editor]:[gap:10px] [:where(&).rich-description-editor]:[border:1px_solid_#dce5f0] [:where(&).rich-description-editor]:[border-radius:8px] [:where(&).rich-description-editor]:[padding:12px] [:where(&).rich-description-editor]:[background:linear-gradient(145deg,_#fbfdff,_#f5f8fc)]"])} aria-label="Product description editor">

      <div className={utilities("rich-editor-heading", [925, "[:where(&).rich-editor-heading]:flex [:where(&).rich-editor-heading]:items-start [:where(&).rich-editor-heading]:justify-between [:where(&).rich-editor-heading]:[gap:10px]"], [926, "[:where(&).rich-editor-heading_strong]:block [:where(&).rich-editor-heading_strong]:[color:#172f53] [:where(&).rich-editor-heading_strong]:[font-size:12px]"], [927, "[:where(&).rich-editor-heading_small]:block [:where(&).rich-editor-heading_small]:[margin-top:4px] [:where(&).rich-editor-heading_small]:[color:#74839a] [:where(&).rich-editor-heading_small]:[font-size:9px] [:where(&).rich-editor-heading_small]:[line-height:1.4]"], [1536, "[@media_(max-width:_720px)]:[:where(&).rich-editor-heading]:flex-col"])}>
        <div>
          <strong>Rich product description</strong>
          <small>Use the visual builder to create DJI-style product pages, or switch to HTML / CSS for full control.</small>
        </div>
        <button type="button" className={utilities("rich-editor-reset", [928, "[:where(&).rich-editor-reset]:inline-flex [:where(&).rich-editor-reset]:items-center [:where(&).rich-editor-reset]:[gap:5px] [:where(&).rich-editor-reset]:[border:1px_solid_#d6e1ef] [:where(&).rich-editor-reset]:[border-radius:5px] [:where(&).rich-editor-reset]:[padding:6px_8px] [:where(&).rich-editor-reset]:[color:#2767c4] [:where(&).rich-editor-reset]:[background:#fff] [:where(&).rich-editor-reset]:cursor-pointer [:where(&).rich-editor-reset]:[font-size:9px] [:where(&).rich-editor-reset]:[font-weight:750] [:where(&).rich-editor-reset]:whitespace-nowrap"], [1537, "[@media_(max-width:_720px)]:[:where(&).rich-editor-reset]:[justify-self:start]"])} onClick={() => {
          const parsed = parseHtml(starterHtml);
          if (parsed) setBlocks(parsed);
          onChange({ html: starterHtml, css: starterCss });
          setTab("builder");
        }}><RotateCcw size={13} />Use starter</button>
      </div>

      <div className={utilities("rich-editor-tabs", [929, "[:where(&).rich-editor-tabs]:flex [:where(&).rich-editor-tabs]:[gap:4px] [:where(&).rich-editor-tabs]:[border-bottom:1px_solid_#e0e7f0]"], [930, "[:where(&).rich-editor-tabs_button]:inline-flex [:where(&).rich-editor-tabs_button]:items-center [:where(&).rich-editor-tabs_button]:[gap:5px] [:where(&).rich-editor-tabs_button]:[border:0]"], [931, "[:is(:where(&).rich-editor-tabs_button)]:[border-bottom:2px_solid_transparent] [:is(:where(&).rich-editor-tabs_button)]:[padding:7px_8px] [:is(:where(&).rich-editor-tabs_button)]:[color:#64748b] [:is(:where(&).rich-editor-tabs_button)]:[background:transparent] [:is(:where(&).rich-editor-tabs_button)]:cursor-pointer [:is(:where(&).rich-editor-tabs_button)]:[font-size:10px] [:is(:where(&).rich-editor-tabs_button)]:[font-weight:750]"])} role="tablist" aria-label="Description editor views">
        <button type="button" className={tw(tab === "builder" ? "active" : "")} onClick={() => switchTab("builder")}><LayoutGrid size={14} />Builder</button>
        <button type="button" className={tw(tab === "html" ? "active" : "")} onClick={() => switchTab("html")}><Code2 size={14} />HTML</button>
        <button type="button" className={tw(tab === "css" ? "active" : "")} onClick={() => switchTab("css")}><Pilcrow size={14} />CSS</button>
        <button type="button" className={tw(tab === "preview" ? "active" : "")} onClick={() => switchTab("preview")}><Eye size={14} />Preview</button>
      </div>

      {/* ════════  BUILDER TAB  ════════ */}
      {tab === "builder" && (
        <div className={utilities("rde-builder", [946, "[:where(&).rde-builder]:grid [:where(&).rde-builder]:[gap:12px]"])}>

          <div className={utilities("rde-palette", [947, "[:where(&).rde-palette]:[background:linear-gradient(135deg,_#f0f4fa,_#e8eef7)] [:where(&).rde-palette]:[border-radius:8px] [:where(&).rde-palette]:[padding:12px] [:where(&).rde-palette]:[border:1px_solid_#d6e1ef]"])}>
            <div className={utilities("rde-palette-sections", [948, "[:where(&).rde-palette-sections]:grid [:where(&).rde-palette-sections]:[gap:8px]"])}>
              <span className={utilities("rde-palette-label", [949, "[:where(&).rde-palette-label]:block [:where(&).rde-palette-label]:[font-size:8px] [:where(&).rde-palette-label]:font-extrabold [:where(&).rde-palette-label]:[color:#8898ad] [:where(&).rde-palette-label]:uppercase [:where(&).rde-palette-label]:[letter-spacing:0.8px] [:where(&).rde-palette-label]:[margin-bottom:2px]"])}>Layout blocks</span>
              <div className={utilities("rde-palette-grid", [950, "[:where(&).rde-palette-grid]:grid [:where(&).rde-palette-grid]:[grid-template-columns:repeat(6,_1fr)] [:where(&).rde-palette-grid]:[gap:5px]"], [1538, "[@media_(max-width:_720px)]:[:where(&).rde-palette-grid]:[grid-template-columns:repeat(3,_1fr)]"])}>
                {PALETTE.slice(0, 7).map(item => (
                  <button key={item.type} type="button" className={utilities("rde-palette-item", [951, "[:where(&).rde-palette-item]:flex [:where(&).rde-palette-item]:flex-col [:where(&).rde-palette-item]:items-center [:where(&).rde-palette-item]:[gap:3px] [:where(&).rde-palette-item]:[padding:8px_3px] [:where(&).rde-palette-item]:[border:1px_solid_#d6e1ef] [:where(&).rde-palette-item]:[border-radius:7px] [:where(&).rde-palette-item]:[background:#fff] [:where(&).rde-palette-item]:[color:#49627e] [:where(&).rde-palette-item]:cursor-grab [:where(&).rde-palette-item]:[font-size:8.5px] [:where(&).rde-palette-item]:font-semibold [:where(&).rde-palette-item]:[transition:all_0.18s] [:where(&).rde-palette-item]:[user-select:none]"], [952, "[:where(&).rde-palette-item:hover]:[border-color:#8eafe0] [:where(&).rde-palette-item:hover]:[color:#155fc5] [:where(&).rde-palette-item:hover]:[background:#f0f5ff] [:where(&).rde-palette-item:hover]:[transform:translateY(-1px)] [:where(&).rde-palette-item:hover]:[box-shadow:0_3px_8px_#155fc510]"], [953, "[:where(&).rde-palette-item:active]:cursor-grabbing [:where(&).rde-palette-item:active]:[transform:scale(0.96)]"], [954, "[:where(&).rde-palette-item_svg]:[opacity:0.8]"])} draggable
                    onDragStart={e => onPaletteDragStart(e, item.type)} onDragEnd={onDragEnd}
                    onClick={() => addBlock(item.type)} title={item.desc}
                  >{item.icon}<span>{item.label}</span></button>
                ))}
              </div>
              <span className={utilities("rde-palette-label", [949, "[:where(&).rde-palette-label]:block [:where(&).rde-palette-label]:[font-size:8px] [:where(&).rde-palette-label]:font-extrabold [:where(&).rde-palette-label]:[color:#8898ad] [:where(&).rde-palette-label]:uppercase [:where(&).rde-palette-label]:[letter-spacing:0.8px] [:where(&).rde-palette-label]:[margin-bottom:2px]"])}>Content blocks</span>
              <div className={utilities("rde-palette-grid", [950, "[:where(&).rde-palette-grid]:grid [:where(&).rde-palette-grid]:[grid-template-columns:repeat(6,_1fr)] [:where(&).rde-palette-grid]:[gap:5px]"], [1538, "[@media_(max-width:_720px)]:[:where(&).rde-palette-grid]:[grid-template-columns:repeat(3,_1fr)]"])}>
                {PALETTE.slice(7).map(item => (
                  <button key={item.type} type="button" className={utilities("rde-palette-item", [951, "[:where(&).rde-palette-item]:flex [:where(&).rde-palette-item]:flex-col [:where(&).rde-palette-item]:items-center [:where(&).rde-palette-item]:[gap:3px] [:where(&).rde-palette-item]:[padding:8px_3px] [:where(&).rde-palette-item]:[border:1px_solid_#d6e1ef] [:where(&).rde-palette-item]:[border-radius:7px] [:where(&).rde-palette-item]:[background:#fff] [:where(&).rde-palette-item]:[color:#49627e] [:where(&).rde-palette-item]:cursor-grab [:where(&).rde-palette-item]:[font-size:8.5px] [:where(&).rde-palette-item]:font-semibold [:where(&).rde-palette-item]:[transition:all_0.18s] [:where(&).rde-palette-item]:[user-select:none]"], [952, "[:where(&).rde-palette-item:hover]:[border-color:#8eafe0] [:where(&).rde-palette-item:hover]:[color:#155fc5] [:where(&).rde-palette-item:hover]:[background:#f0f5ff] [:where(&).rde-palette-item:hover]:[transform:translateY(-1px)] [:where(&).rde-palette-item:hover]:[box-shadow:0_3px_8px_#155fc510]"], [953, "[:where(&).rde-palette-item:active]:cursor-grabbing [:where(&).rde-palette-item:active]:[transform:scale(0.96)]"], [954, "[:where(&).rde-palette-item_svg]:[opacity:0.8]"])} draggable
                    onDragStart={e => onPaletteDragStart(e, item.type)} onDragEnd={onDragEnd}
                    onClick={() => addBlock(item.type)} title={item.desc}
                  >{item.icon}<span>{item.label}</span></button>
                ))}
              </div>
            </div>
          </div>

          <div className={utilities("rde-canvas", [955, "[:where(&).rde-canvas]:[min-height:120px] [:where(&).rde-canvas]:[border:1px_dashed_#d0daea] [:where(&).rde-canvas]:[border-radius:8px] [:where(&).rde-canvas]:[padding:8px] [:where(&).rde-canvas]:[background:#fafcff] [:where(&).rde-canvas]:[transition:border-color_0.2s]"])}>
            {blocks.length === 0 && (
              <div className={tw(`rde-empty ${dragOver === 0 ? "rde-drop-active" : ""}`)}
                onDragOver={e => onZoneDragOver(e, 0)} onDragLeave={() => setDragOver(-1)} onDrop={e => onZoneDrop(e, 0)}>
                <Wand2 size={28} />
                <strong>Build a stunning product page</strong>
                <span>Drag Hero, Showcase, Img+Text, or Vid+Text blocks to create DJI-style layouts</span>
              </div>
            )}

            {blocks.map((block, i) => (
              <div key={block.id}>
                <div className={tw(`rde-drop-zone ${dragOver === i ? "rde-drop-active" : ""}`)}
                  onDragOver={e => onZoneDragOver(e, i)} onDragLeave={() => setDragOver(-1)} onDrop={e => onZoneDrop(e, i)} />

                <div className={utilities("rde-block", [968, "[:where(&).rde-block]:[border:1px_solid_#dce5f0] [:where(&).rde-block]:[border-radius:8px] [:where(&).rde-block]:[background:#fff] [:where(&).rde-block]:overflow-hidden [:where(&).rde-block]:[transition:box-shadow_0.2s,_border-color_0.2s] [:where(&).rde-block]:animate-[rdeBlockIn_0.25s_ease]"], [969, "[:where(&).rde-block:hover]:[border-color:#b8cce5] [:where(&).rde-block:hover]:[box-shadow:0_2px_8px_#10295208]"], [970, "[:where(&).rde-block.rde-dragging]:[opacity:0.35] [:where(&).rde-block.rde-dragging]:[border-style:dashed]"])} draggable onDragStart={e => onCanvasDragStart(e, i)} onDragEnd={onDragEnd}>
                  <div className={utilities("rde-block-head", [971, "[:where(&).rde-block-head]:flex [:where(&).rde-block-head]:items-center [:where(&).rde-block-head]:[gap:6px] [:where(&).rde-block-head]:[padding:6px_8px] [:where(&).rde-block-head]:[background:linear-gradient(135deg,_#f6f9fd,_#eef3fa)] [:where(&).rde-block-head]:[border-bottom:1px_solid_#e4ebf4]"])}>
                    <span className={utilities("rde-drag-handle", [972, "[:where(&).rde-drag-handle]:cursor-grab [:where(&).rde-drag-handle]:[color:#b0bdd0] [:where(&).rde-drag-handle]:grid [:where(&).rde-drag-handle]:[place-items:center] [:where(&).rde-drag-handle]:[transition:color_0.15s]"], [973, "[:where(&).rde-drag-handle:hover]:[color:#7b8da6]"], [974, "[:where(&).rde-drag-handle:active]:cursor-grabbing"])}><GripVertical size={14} /></span>
                    <span className={utilities("rde-block-type", [975, "[:where(&).rde-block-type]:inline-flex [:where(&).rde-block-type]:items-center [:where(&).rde-block-type]:[gap:5px] [:where(&).rde-block-type]:[font-size:10px] [:where(&).rde-block-type]:font-bold [:where(&).rde-block-type]:[color:#49627e] [:where(&).rde-block-type]:[flex:1]"], [976, "[:where(&).rde-block-type_svg]:[width:13px] [:where(&).rde-block-type_svg]:[height:13px]"])}>{PALETTE.find(p => p.type === block.type)?.icon}{PALETTE.find(p => p.type === block.type)?.label}</span>
                    <div className={utilities("rde-block-actions", [977, "[:where(&).rde-block-actions]:flex [:where(&).rde-block-actions]:[gap:2px]"], [978, "[:where(&).rde-block-actions_button]:[width:24px] [:where(&).rde-block-actions_button]:[height:22px] [:where(&).rde-block-actions_button]:grid [:where(&).rde-block-actions_button]:[place-items:center] [:where(&).rde-block-actions_button]:[border:0] [:where(&).rde-block-actions_button]:[border-radius:4px] [:where(&).rde-block-actions_button]:[color:#8898ad] [:where(&).rde-block-actions_button]:[background:transparent] [:where(&).rde-block-actions_button]:cursor-pointer [:where(&).rde-block-actions_button]:[transition:all_0.15s]"], [979, "[:where(&).rde-block-actions_button:hover]:[background:#e8eef7] [:where(&).rde-block-actions_button:hover]:[color:#49627e]"])}>
                      {i > 0 && <button type="button" onClick={() => moveBlock(i, i - 1)} title="Move up"><ChevronUp size={14} /></button>}
                      {i < blocks.length - 1 && <button type="button" onClick={() => moveBlock(i, i + 2)} title="Move down"><ChevronDown size={14} /></button>}
                      <button type="button" className={utilities("rde-remove", [980, "[.rde-block-actions_:where(&).rde-remove:hover]:[background:#fde8e8] [.rde-block-actions_:where(&).rde-remove:hover]:[color:#dc2626]"])} onClick={() => removeBlock(block.id)} title="Remove block"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className={utilities("rde-block-body", [981, "[:where(&).rde-block-body]:[padding:10px]"], [982, "[:where(&).rde-block-body_input,_:where(&).rde-block-body_textarea,_:where(&).rde-block-body_select]:[width:100%] [:where(&).rde-block-body_input,_:where(&).rde-block-body_textarea,_:where(&).rde-block-body_select]:[border:1px_solid_#e2e8f0] [:where(&).rde-block-body_input,_:where(&).rde-block-body_textarea,_:where(&).rde-block-body_select]:[border-radius:5px] [:where(&).rde-block-body_input,_:where(&).rde-block-body_textarea,_:where(&).rde-block-body_select]:[padding:6px_8px] [:where(&).rde-block-body_input,_:where(&).rde-block-body_textarea,_:where(&).rde-block-body_select]:[font:inherit]"], [983, "[:is(:where(&).rde-block-body_input),_:is(:where(&).rde-block-body_textarea),_:is(:where(&).rde-block-body_select)]:[font-size:11px] [:is(:where(&).rde-block-body_input),_:is(:where(&).rde-block-body_textarea),_:is(:where(&).rde-block-body_select)]:[color:#1e3a5f] [:is(:where(&).rde-block-body_input),_:is(:where(&).rde-block-body_textarea),_:is(:where(&).rde-block-body_select)]:[outline:0] [:is(:where(&).rde-block-body_input),_:is(:where(&).rde-block-body_textarea),_:is(:where(&).rde-block-body_select)]:[background:#fafcfe] [:is(:where(&).rde-block-body_input),_:is(:where(&).rde-block-body_textarea),_:is(:where(&).rde-block-body_select)]:[transition:border-color_0.15s,_box-shadow_0.15s]"], [984, "[:where(&).rde-block-body_input:focus,_:where(&).rde-block-body_textarea:focus]:[border-color:#4d83d1] [:where(&).rde-block-body_input:focus,_:where(&).rde-block-body_textarea:focus]:[box-shadow:0_0_0_2px_#4d83d110]"], [985, "[:where(&).rde-block-body_select]:[width:auto] [:where(&).rde-block-body_select]:cursor-pointer [:where(&).rde-block-body_select]:[padding-right:24px]"], [986, "[:where(&).rde-block-body_textarea]:[resize:vertical] [:where(&).rde-block-body_textarea]:[line-height:1.5]"])}>
                    <BlockEditorInline block={block} onChange={patch => updateBlock(block.id, patch)} />
                    <div className={utilities("rde-spacing-controls", [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-top:15px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[padding-top:15px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-top:1px_dashed_#cbd5e1]"])} >
                      <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[gap:16px]"])}>
                         <SpacingControl label="Outer Spacing (Margin)" value={block.data.margin as string || ""} onChange={v => updateBlock(block.id, { margin: v })} allowNegative />
                         <SpacingControl label="Inner Spacing (Padding)" value={block.data.padding as string || ""} onChange={v => updateBlock(block.id, { padding: v })} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {blocks.length > 0 && (
              <div className={tw(`rde-drop-zone rde-drop-zone-end ${dragOver === blocks.length ? "rde-drop-active" : ""}`)}
                onDragOver={e => onZoneDragOver(e, blocks.length)} onDragLeave={() => setDragOver(-1)} onDrop={e => onZoneDrop(e, blocks.length)}>
                <span>Drop here to add at end</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════  HTML TAB  ════════ */}
      {tab === "html" && (
        <div className={utilities("rich-editor-source", [933, "[:where(&).rich-editor-source]:grid [:where(&).rich-editor-source]:[gap:7px]"], [937, "[:where(&).rich-editor-source_textarea]:[min-height:135px] [:where(&).rich-editor-source_textarea]:[width:100%] [:where(&).rich-editor-source_textarea]:[resize:vertical] [:where(&).rich-editor-source_textarea]:[border:1px_solid_#d7e0ec] [:where(&).rich-editor-source_textarea]:[border-radius:6px] [:where(&).rich-editor-source_textarea]:[padding:10px] [:where(&).rich-editor-source_textarea]:[color:#18304f] [:where(&).rich-editor-source_textarea]:[background:#fff] [:where(&).rich-editor-source_textarea]:[font:11px/1.55_ui-monospace,_SFMono-Regular,_Menlo,_monospace] [:where(&).rich-editor-source_textarea]:[outline:0]"], [938, "[:where(&).rich-editor-source_textarea:focus]:[border-color:#4d83d1] [:where(&).rich-editor-source_textarea:focus]:[box-shadow:0_0_0_3px_#4d83d114]"])}>
          <div className={utilities("rich-editor-toolbar", [934, "[:where(&).rich-editor-toolbar]:flex [:where(&).rich-editor-toolbar]:[gap:5px]"], [935, "[:where(&).rich-editor-toolbar_button]:[width:27px] [:where(&).rich-editor-toolbar_button]:[height:25px] [:where(&).rich-editor-toolbar_button]:grid [:where(&).rich-editor-toolbar_button]:[place-items:center] [:where(&).rich-editor-toolbar_button]:[border:1px_solid_#dce4ef] [:where(&).rich-editor-toolbar_button]:[border-radius:4px] [:where(&).rich-editor-toolbar_button]:[color:#49627e] [:where(&).rich-editor-toolbar_button]:[background:#fff] [:where(&).rich-editor-toolbar_button]:cursor-pointer"], [936, "[:where(&).rich-editor-toolbar_button:hover]:[border-color:#8eafe0] [:where(&).rich-editor-toolbar_button:hover]:[color:#155fc5]"])}>
            <button type="button" onClick={() => insertSnippet("<strong>Bold text</strong>")} title="Insert bold"><Bold size={14} /></button>
            <button type="button" onClick={() => insertSnippet("<em>Italic text</em>")} title="Insert italic"><Italic size={14} /></button>
            <button type="button" onClick={() => insertSnippet("<ul>\n  <li>List item</li>\n</ul>")} title="Insert list"><List size={14} /></button>
            <button type="button" onClick={() => insertSnippet("<ol>\n  <li>Ordered item</li>\n</ol>")} title="Insert ordered list"><ListOrdered size={14} /></button>
          </div>
          <textarea value={value.html} onChange={e => onChange({ ...value, html: e.target.value })} placeholder="<h2>DJI Mini 5 Pro</h2>\n<p>Write your product description...</p>" spellCheck={false} />
        </div>
      )}

      {/* ════════  CSS TAB  ════════ */}
      {tab === "css" && (
        <div className={utilities("rich-editor-source", [933, "[:where(&).rich-editor-source]:grid [:where(&).rich-editor-source]:[gap:7px]"], [937, "[:where(&).rich-editor-source_textarea]:[min-height:135px] [:where(&).rich-editor-source_textarea]:[width:100%] [:where(&).rich-editor-source_textarea]:[resize:vertical] [:where(&).rich-editor-source_textarea]:[border:1px_solid_#d7e0ec] [:where(&).rich-editor-source_textarea]:[border-radius:6px] [:where(&).rich-editor-source_textarea]:[padding:10px] [:where(&).rich-editor-source_textarea]:[color:#18304f] [:where(&).rich-editor-source_textarea]:[background:#fff] [:where(&).rich-editor-source_textarea]:[font:11px/1.55_ui-monospace,_SFMono-Regular,_Menlo,_monospace] [:where(&).rich-editor-source_textarea]:[outline:0]"], [938, "[:where(&).rich-editor-source_textarea:focus]:[border-color:#4d83d1] [:where(&).rich-editor-source_textarea:focus]:[box-shadow:0_0_0_3px_#4d83d114]"])}>
          <p className={utilities("rich-editor-help", [939, "[:where(&).rich-editor-help]:[margin:0] [:where(&).rich-editor-help]:[color:#72829a] [:where(&).rich-editor-help]:[font-size:9px]"], [940, "[:where(&).rich-editor-help_code]:[color:#155fc5]"])}>Scope selectors under <code>.product-description-rendered</code> so your styling stays inside the description.</p>
          <textarea value={value.css} onChange={e => onChange({ ...value, css: e.target.value })} placeholder=".product-description-rendered h2 { color: #102952; }" spellCheck={false} />
        </div>
      )}

      {/* ════════  PREVIEW TAB  ════════ */}
      {tab === "preview" && (
        <div className={utilities("rich-editor-preview", [941, "[:where(&).rich-editor-preview]:[min-height:135px] [:where(&).rich-editor-preview]:overflow-auto [:where(&).rich-editor-preview]:[border:1px_solid_#d7e0ec] [:where(&).rich-editor-preview]:[border-radius:6px] [:where(&).rich-editor-preview]:[padding:13px] [:where(&).rich-editor-preview]:[background:#fff]"])}>
          <style>{value.css}</style>
          <SpecSection html={normalizeDescriptionInput(value.html)} />
        </div>
      )}
    </section>
  );
}

export { starterCss, starterHtml };
