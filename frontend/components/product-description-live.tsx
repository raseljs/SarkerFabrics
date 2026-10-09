"use client";


import { tailwindHtml, withTailwindStyle, utilities, resolveClasses } from "@/lib/tailwind";
import { useEffect, useState, useMemo, memo, useRef } from "react";
import { normalizeDescriptionInput } from "@/lib/rich-description";

// Component styling is compiled from these local Tailwind utilities.
const componentUtilities: Record<string, string> = {
  "active": utilities([74, "[.hero-dots_:where(&).active]:[background:#173e89]"], [299, "[.admin-sidebar_a:where(&).active,_:where(&).admin-sidebar_a:hover]:[color:var(--ink)] [.admin-sidebar_a:where(&).active,_:where(&).admin-sidebar_a:hover]:[background:#eef4ff]"], [459, "[.detail-tabs_button:where(&).active]:[background:var(--red)] [.detail-tabs_button:where(&).active]:[color:#fff]"], [466, "[.content-tabs_:where(&).active]:[color:var(--red)] [.content-tabs_:where(&).active]:font-extrabold [.content-tabs_:where(&).active]:[border-top:2px_solid_var(--red)]"], [728, "[:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[background:#f1f4f8] [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[color:var(--ink)] [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:font-bold [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[border-left:3px_solid_#73b2cd] [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[padding-left:16px]"], [741, "[.nav-bar>a:where(&).active,_.nav-bar_:where(&).maintenance-link.active]:[color:var(--red)]"], [742, "[.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[content:''] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:absolute [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[left:0] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[right:0] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[bottom:0] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[height:2px] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[background:var(--red)]"], [774, "[.article-pagination_button:where(&).active]:[border-color:var(--red)] [.article-pagination_button:where(&).active]:[background:var(--red)] [.article-pagination_button:where(&).active]:[color:#fff]"], [843, "[.mega-mode-tabs_button:where(&).active]:[color:#1266cf] [.mega-mode-tabs_button:where(&).active]:[border-bottom-color:#1266cf]"], [932, "[.rich-editor-tabs_button:where(&).active]:[color:#155fc5] [.rich-editor-tabs_button:where(&).active]:[border-bottom-color:#155fc5]"], [992, "[.rde-toggle-row_button:where(&).active]:[background:#eef4ff] [.rde-toggle-row_button:where(&).active]:[border-color:#3f70ce] [.rde-toggle-row_button:where(&).active]:[color:#155fc5]"], [1071, "[:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[border-left-color:#72b6d2] [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[background:#f0f3f7] [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[color:#102952] [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:font-bold [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[outline:0]"], [1120, "[@media_(max-width:_720px)]:[:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[padding-left:5px]"], [1143, "[@media_(max-width:_720px)]:[:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[border-color:#72b6d2] [@media_(max-width:_720px)]:[:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[background:#eef7fb]"], [1369, "[.admin-app-nav_a:where(&).active]:[color:#fff] [.admin-app-nav_a:where(&).active]:[background:linear-gradient(120deg,_#1a7de8_0%,_#1e97f5_100%)] [.admin-app-nav_a:where(&).active]:[box-shadow:0_6px_20px_rgba(22,_100,_220,_.4),_inset_0_1px_0_rgba(255,_255,_255,_.15)] [.admin-app-nav_a:where(&).active]:font-bold"], [1370, "[.admin-app-nav_a:where(&).active_svg]:[color:#e0f0ff] [.admin-app-nav_a:where(&).active_svg]:[opacity:1]"], [1864, "[.hero-slider-dots_button:where(&).active]:[width:10px] [.hero-slider-dots_button:where(&).active]:[background:#1d5fb8]"], [2075, "[.nav-bar>a:where(&).active]:[color:var(--red)]"], [2226, "[.product-space-tabs_button:where(&).active]:[background:#e91b23] [.product-space-tabs_button:where(&).active]:[color:#fff]"], [2411, "[.order-tabs_button:where(&).active]:[color:#0d67e8] [.order-tabs_button:where(&).active]:[border-bottom-color:#0d67e8]"], [2413, "[.order-tabs_:where(&).active_b]:[background:#166cf0] [.order-tabs_:where(&).active_b]:[color:#fff]"], [2498, "[.order-pagination_button:where(&).active]:[background:#0968f5] [.order-pagination_button:where(&).active]:[color:#fff] [.order-pagination_button:where(&).active]:[border-color:#0968f5]"], [2898, "[.product-nav-pill_button:where(&).active]:[background:var(--red)] [.product-nav-pill_button:where(&).active]:[color:#fff]"], [3331, "[.resource-tabs_button:where(&).active]:[color:#fff] [.resource-tabs_button:where(&).active]:[border-color:transparent] [.resource-tabs_button:where(&).active]:[background:linear-gradient(135deg,#145bc6,#277fe3)] [.resource-tabs_button:where(&).active]:[box-shadow:0_5px_12px_rgba(29,100,207,.22)]"]),
  "button": utilities([62, "[:where(&).button]:[min-height:39px] [:where(&).button]:inline-flex [:where(&).button]:items-center [:where(&).button]:justify-center [:where(&).button]:[gap:7px] [:where(&).button]:[border-radius:4px] [:where(&).button]:[padding:0_17px] [:where(&).button]:font-bold [:where(&).button]:cursor-pointer [:where(&).button]:[border:1px_solid_transparent]"], [280, "[.cart-summary_:where(&).button]:[width:100%] [.cart-summary_:where(&).button]:[margin-top:12px]"], [286, "[.checkout-form>:where(&).button]:[width:max-content] [.checkout-form>:where(&).button]:[margin-top:6px]"], [492, "[.accessory-card_:where(&).button]:[width:100%] [.accessory-card_:where(&).button]:[margin-top:12px] [.accessory-card_:where(&).button]:[border-radius:6px] [.accessory-card_:where(&).button]:text-ellipsis [.accessory-card_:where(&).button]:overflow-hidden [.accessory-card_:where(&).button]:whitespace-nowrap"], [603, "[:is(:where(&).button)]:[font-size:14px]"], [654, "[:is(.accessory-card_:where(&).button)]:[font-size:10px] [:is(.accessory-card_:where(&).button)]:[padding:0_4px] [:is(.accessory-card_:where(&).button)]:[min-height:30px]"], [683, "[@media_(max-width:_720px)]:[:where(&).button,_:where(&).text-link]:[font-size:12px]"], [809, "[.package-card_footer_:where(&).button]:[font-size:11px] [.package-card_footer_:where(&).button]:[min-height:32px] [.package-card_footer_:where(&).button]:[padding:0_13px]"], [818, "[.maintenance-cta_:where(&).button]:[margin-right:15px]"], [837, "[@media_(max-width:_720px)]:[.maintenance-cta_:where(&).button]:[margin:0_0_12px]"], [1225, "[.combo-modal>footer_:where(&).button]:[min-height:36px]"], [1289, "[@media_(max-width:_720px)]:[.combo-modal>footer_:where(&).button]:[width:100%]"], [2383, "[@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:inline-block [@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:[margin-top:15px]"], [2479, "[.reference-toolbar_:where(&).button]:[height:34px] [.reference-toolbar_:where(&).button]:[padding:0_10px] [.reference-toolbar_:where(&).button]:[font-size:10px]"], [2491, "[.order-actions_:where(&).button]:[font-size:9px] [.order-actions_:where(&).button]:[padding:6px_14px]"], [2542, "[.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[height:34px] [.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[font-size:9px]"], [2579, "[.order-confirmation-actions_:where(&).button]:flex [.order-confirmation-actions_:where(&).button]:items-center [.order-confirmation-actions_:where(&).button]:justify-center [.order-confirmation-actions_:where(&).button]:[gap:7px] [.order-confirmation-actions_:where(&).button]:[min-height:43px] [.order-confirmation-actions_:where(&).button]:[text-decoration:none]"], [2587, "[.invoice-actions_:where(&).button]:flex [.invoice-actions_:where(&).button]:items-center [.invoice-actions_:where(&).button]:justify-center [.invoice-actions_:where(&).button]:[gap:6px]"], [2627, "[@media_(max-width:680px)]:[.invoice-actions_:where(&).button]:[flex:1_1_100%]"], [2653, "[.drawer-edit-actions_:where(&).button]:[height:31px] [.drawer-edit-actions_:where(&).button]:[padding:0_11px] [.drawer-edit-actions_:where(&).button]:[font-size:9px]"]),
  "button-outline": utilities([66, "[:where(&).button-outline]:[background:#fff] [:where(&).button-outline]:[border-color:#b7c0cf] [:where(&).button-outline]:[color:var(--ink)]"]),
  "button-primary": utilities([63, "[:where(&).button-primary]:[background:var(--navy)] [:where(&).button-primary]:[color:#fff]"], [64, "[:where(&).button-primary:hover]:[background:#123d6b]"]),
  "button-red": utilities([65, "[:where(&).button-red]:[background:var(--red)] [:where(&).button-red]:[color:#fff]"], [446, "[.purchase-actions>:where(&).button-red]:[min-height:35px] [.purchase-actions>:where(&).button-red]:[flex:1]"], [447, "[.purchase-actions_:where(&).cart-action,_.purchase-actions_:where(&).button-red]:[font-size:16px]"], [2189, "[.purchase-actions_:where(&).button-red]:[background:var(--red)]"], [2830, "[@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[flex:1] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[min-height:38px] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[font-size:14px] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:font-bold [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[padding:0_4px]"]),
  "current": utilities([2537, "[.timeline-event_i:where(&).current]:[background:#0c67eb]"]),
  "faq-body": utilities([2727, "[.product-detail-sections_:where(&).faq-body]:[padding:4px_24px_20px_54px]"], [2728, "[.product-detail-sections_:where(&).faq-body_p]:[margin:0] [.product-detail-sections_:where(&).faq-body_p]:[font-size:14px] [.product-detail-sections_:where(&).faq-body_p]:[line-height:1.72] [.product-detail-sections_:where(&).faq-body_p]:[color:#4a5e78]"], [2731, "[@media_(max-width:640px)]:[.product-detail-sections_:where(&).faq-body]:[padding:4px_16px_18px_16px]"]),
  "faq-card": utilities([462, "[:where(&).detail-main,_:where(&).faq-card]:[border:1px_solid_var(--line)] [:where(&).detail-main,_:where(&).faq-card]:[border-radius:8px]"], [472, "[:where(&).description-card_h2,_:where(&).faq-card_h2,_:where(&).customer-review_h2]:[margin:0_0_11px]"], [475, "[:where(&).faq-card]:[padding:15px] [:where(&).faq-card]:[height:max-content]"], [476, "[:where(&).faq-card>button]:[width:100%] [:where(&).faq-card>button]:[min-height:38px] [:where(&).faq-card>button]:flex [:where(&).faq-card>button]:items-center [:where(&).faq-card>button]:justify-between [:where(&).faq-card>button]:[border:0]"], [477, "[:is(:where(&).faq-card>button)]:[border-top:1px_solid_var(--line)] [:is(:where(&).faq-card>button)]:[background:#fff] [:is(:where(&).faq-card>button)]:text-left [:is(:where(&).faq-card>button)]:[color:#506079] [:is(:where(&).faq-card>button)]:[font-size:10px] [:is(:where(&).faq-card>button)]:cursor-pointer"], [555, "[@media_(max-width:_720px)]:[:where(&).faq-card]:hidden"], [649, "[:is(:where(&).description-card_h2),_:is(:where(&).faq-card_h2),_:is(:where(&).customer-review_h2)]:[font-size:15px]"], [650, "[:where(&).description-card_p,_:where(&).faq-card>button,_:where(&).customer-review_p]:[font-size:12px]"]),
  "faq-chevron": utilities([2725, "[.product-detail-sections_:where(&).faq-chevron]:flex [.product-detail-sections_:where(&).faq-chevron]:items-center [.product-detail-sections_:where(&).faq-chevron]:[color:#94a3b8] [.product-detail-sections_:where(&).faq-chevron]:[transition:transform_.3s_cubic-bezier(.4,_0,_.2,_1),_color_.2s] [.product-detail-sections_:where(&).faq-chevron]:[flex-shrink:0]"], [2726, "[.product-detail-sections_:where(&).faq-chevron.rotated]:[transform:rotate(180deg)] [.product-detail-sections_:where(&).faq-chevron.rotated]:[color:#ed1c24]"]),
  "faq-expand-list": utilities([2230, "[.product-info-box_:where(&).faq-expand-list_article_button]:[width:100%] [.product-info-box_:where(&).faq-expand-list_article_button]:[padding:12px_0] [.product-info-box_:where(&).faq-expand-list_article_button]:[border:0]"], [2231, "[:is(.product-info-box_:where(&).faq-expand-list_article_button)]:[border-bottom:1px_solid_var(--line)] [:is(.product-info-box_:where(&).faq-expand-list_article_button)]:[background:#fff] [:is(.product-info-box_:where(&).faq-expand-list_article_button)]:flex [:is(.product-info-box_:where(&).faq-expand-list_article_button)]:justify-between [:is(.product-info-box_:where(&).faq-expand-list_article_button)]:[font-size:12px]"], [2286, "[.product-info-box_:where(&).description-card,_.product-info-box_:where(&).faq-expand-list,_.product-info-box_:where(&).review-tab-layout]:[padding:16px]"], [2288, "[:where(&).faq-expand-list]:[max-height:390px] [:where(&).faq-expand-list]:overflow-auto"]),
  "faq-item": utilities([2718, "[.product-detail-sections_:where(&).faq-item]:[border-bottom:1px_solid_#eef2f8] [.product-detail-sections_:where(&).faq-item]:animate-[pds-faq-in_.4s_ease_both]"], [2719, "[.product-detail-sections_:where(&).faq-item:last-child]:[border-bottom:0]"]),
  "faq-list": utilities([2717, "[.product-detail-sections_:where(&).faq-list]:flex [.product-detail-sections_:where(&).faq-list]:flex-col [.product-detail-sections_:where(&).faq-list]:[gap:0] [.product-detail-sections_:where(&).faq-list]:[border:1px_solid_#e4ecf4] [.product-detail-sections_:where(&).faq-list]:[border-radius:14px] [.product-detail-sections_:where(&).faq-list]:overflow-hidden [.product-detail-sections_:where(&).faq-list]:[box-shadow:0_4px_18px_rgba(8,_30,_60,_.04)] [.product-detail-sections_:where(&).faq-list]:[background:#fff]"]),
  "faq-num": utilities([2723, "[.product-detail-sections_:where(&).faq-num]:[font-size:11px] [.product-detail-sections_:where(&).faq-num]:font-extrabold [.product-detail-sections_:where(&).faq-num]:[color:#ed1c24] [.product-detail-sections_:where(&).faq-num]:[background:#fff0f0] [.product-detail-sections_:where(&).faq-num]:[border-radius:6px] [.product-detail-sections_:where(&).faq-num]:[padding:3px_8px] [.product-detail-sections_:where(&).faq-num]:[min-width:30px] [.product-detail-sections_:where(&).faq-num]:text-center [.product-detail-sections_:where(&).faq-num]:[flex-shrink:0]"]),
  "faq-q": utilities([2724, "[.product-detail-sections_:where(&).faq-q]:[flex:1] [.product-detail-sections_:where(&).faq-q]:[font-size:15px] [.product-detail-sections_:where(&).faq-q]:[font-weight:650] [.product-detail-sections_:where(&).faq-q]:[color:#102a4c]"], [2730, "[@media_(max-width:640px)]:[.product-detail-sections_:where(&).faq-q]:[font-size:14px]"]),
  "faq-trigger": utilities([2720, "[.product-detail-sections_:where(&).faq-trigger]:flex [.product-detail-sections_:where(&).faq-trigger]:items-center [.product-detail-sections_:where(&).faq-trigger]:[gap:16px] [.product-detail-sections_:where(&).faq-trigger]:[width:100%] [.product-detail-sections_:where(&).faq-trigger]:[border:0] [.product-detail-sections_:where(&).faq-trigger]:[background:#fff] [.product-detail-sections_:where(&).faq-trigger]:[padding:20px_24px] [.product-detail-sections_:where(&).faq-trigger]:text-left [.product-detail-sections_:where(&).faq-trigger]:cursor-pointer [.product-detail-sections_:where(&).faq-trigger]:[transition:background_.18s] [.product-detail-sections_:where(&).faq-trigger]:[font-family:inherit]"], [2721, "[.product-detail-sections_:where(&).faq-trigger:hover]:[background:#f7f9fc]"], [2722, "[.product-detail-sections_.faq-item.faq-open_:where(&).faq-trigger]:[background:#f9fbfd]"], [2729, "[@media_(max-width:640px)]:[.product-detail-sections_:where(&).faq-trigger]:[padding:16px] [@media_(max-width:640px)]:[.product-detail-sections_:where(&).faq-trigger]:[gap:10px]"]),
  "itb-card": utilities([2691, "[:where(&).itb-card]:[background:#fff] [:where(&).itb-card]:[border:1px_solid_#f1f5f9] [:where(&).itb-card]:[border-radius:12px] [:where(&).itb-card]:[padding:24px_16px] [:where(&).itb-card]:flex [:where(&).itb-card]:flex-col [:where(&).itb-card]:items-center [:where(&).itb-card]:text-center [:where(&).itb-card]:[transition:all_0.3s_ease] [:where(&).itb-card]:[box-shadow:0_4px_20px_rgba(0,_0,_0,_0.03)]"], [2692, "[:where(&).itb-card:hover]:[transform:translateY(-4px)] [:where(&).itb-card:hover]:[box-shadow:0_10px_25px_rgba(0,_0,_0,_0.08)]"]),
  "itb-card-img": utilities([2693, "[:where(&).itb-card-img]:[width:100%] [:where(&).itb-card-img]:[height:100px] [:where(&).itb-card-img]:flex [:where(&).itb-card-img]:items-center [:where(&).itb-card-img]:justify-center [:where(&).itb-card-img]:[margin-bottom:20px]"], [2694, "[:where(&).itb-card-img_img]:[max-width:100%] [:where(&).itb-card-img_img]:[max-height:100%] [:where(&).itb-card-img_img]:object-contain"]),
  "itb-card-name": utilities([2695, "[:where(&).itb-card-name]:[font-size:13px] [:where(&).itb-card-name]:font-semibold [:where(&).itb-card-name]:[color:#1e293b] [:where(&).itb-card-name]:[line-height:1.4]"]),
  "itb-compare-bar": utilities([2684, "[:where(&).itb-compare-bar]:flex [:where(&).itb-compare-bar]:items-center [:where(&).itb-compare-bar]:[gap:15px] [:where(&).itb-compare-bar]:[margin-bottom:30px] [:where(&).itb-compare-bar]:flex-wrap"]),
  "itb-compare-label": utilities([2685, "[:where(&).itb-compare-label]:[font-size:13px] [:where(&).itb-compare-label]:font-bold [:where(&).itb-compare-label]:[color:#64748b] [:where(&).itb-compare-label]:[letter-spacing:0.1em] [:where(&).itb-compare-label]:uppercase"]),
  "itb-grid": utilities([2690, "[:where(&).itb-grid]:grid [:where(&).itb-grid]:[grid-template-columns:repeat(auto-fill,_minmax(160px,_1fr))] [:where(&).itb-grid]:[gap:16px]"]),
  "itb-tab-btn": utilities([2687, "[:where(&).itb-tab-btn]:[padding:8px_16px] [:where(&).itb-tab-btn]:[border:none] [:where(&).itb-tab-btn]:[background:#f1f5f9] [:where(&).itb-tab-btn]:[color:#475569] [:where(&).itb-tab-btn]:[font-size:13px] [:where(&).itb-tab-btn]:font-medium [:where(&).itb-tab-btn]:[border-radius:99px] [:where(&).itb-tab-btn]:cursor-pointer [:where(&).itb-tab-btn]:[transition:all_0.25s_ease] [:where(&).itb-tab-btn]:whitespace-nowrap"], [2688, "[:where(&).itb-tab-btn:hover]:[background:#e2e8f0]"], [2689, "[:where(&).itb-tab-btn.active]:[background:#007aff] [:where(&).itb-tab-btn.active]:[color:#fff] [:where(&).itb-tab-btn.active]:font-semibold [:where(&).itb-tab-btn.active]:[box-shadow:0_4px_12px_rgba(0,_122,_255,_0.3)]"]),
  "itb-tabs": utilities([2686, "[:where(&).itb-tabs]:flex [:where(&).itb-tabs]:flex-wrap [:where(&).itb-tabs]:[gap:10px]"]),
  "items": utilities([3686, "[.invoice-admin_:where(&).items]:[width:100%] [.invoice-admin_:where(&).items]:[border-collapse:collapse] [.invoice-admin_:where(&).items]:[border:1px_solid_#cfe0f7] [.invoice-admin_:where(&).items]:[border-radius:7px] [.invoice-admin_:where(&).items]:overflow-hidden [.invoice-admin_:where(&).items]:[font-size:10px]"], [3687, "[.invoice-admin_:where(&).items_th]:[background:#edf5ff] [.invoice-admin_:where(&).items_th]:[padding:10px] [.invoice-admin_:where(&).items_th]:text-left"], [3688, "[.invoice-admin_:where(&).items_td]:[padding:9px_10px] [.invoice-admin_:where(&).items_td]:[border-top:1px_solid_#dce8f6]"], [3689, "[.invoice-admin_:where(&).items_th:nth-child(n+3),_.invoice-admin_:where(&).items_td:nth-child(n+3)]:text-center"]),
  "pd-spec-section-rendered": utilities([2834, "[:where(&).pd-spec-section-rendered]:[margin:1.5rem_0]"]),
  "pd-spec-tab": utilities([2836, "[:where(&).pd-spec-tab]:[padding:0.4375rem_1.125rem] [:where(&).pd-spec-tab]:[border-radius:999px] [:where(&).pd-spec-tab]:[border:1px_solid_#d1d9e6] [:where(&).pd-spec-tab]:[background:white] [:where(&).pd-spec-tab]:[color:#5a6a7a] [:where(&).pd-spec-tab]:[font-size:0.8125rem] [:where(&).pd-spec-tab]:font-medium [:where(&).pd-spec-tab]:cursor-pointer [:where(&).pd-spec-tab]:[transition:all_0.18s] [:where(&).pd-spec-tab]:whitespace-nowrap"], [2837, "[:where(&).pd-spec-tab:hover]:[border-color:#e51e2a] [:where(&).pd-spec-tab:hover]:[color:#e51e2a] [:where(&).pd-spec-tab:hover]:[background:#fff5f5]"], [2838, "[:where(&).pd-spec-tab.pd-spec-tab-active]:[background:#e51e2a] [:where(&).pd-spec-tab.pd-spec-tab-active]:[border-color:#e51e2a] [:where(&).pd-spec-tab.pd-spec-tab-active]:[color:white] [:where(&).pd-spec-tab.pd-spec-tab-active]:font-semibold"]),
  "pd-spec-tabs": utilities([2835, "[:where(&).pd-spec-tabs]:flex [:where(&).pd-spec-tabs]:flex-wrap [:where(&).pd-spec-tabs]:[gap:0.5rem] [:where(&).pd-spec-tabs]:[margin-bottom:1.25rem] [:where(&).pd-spec-tabs]:[padding-bottom:1rem] [:where(&).pd-spec-tabs]:[border-bottom:1px_solid_#e2e8f0]"]),
  "pds-itb": utilities([2683, "[:where(&).pds-itb]:[margin-top:40px] [:where(&).pds-itb]:[margin-bottom:40px]"]),
  "product": utilities([3690, "[.invoice-admin_:where(&).product]:flex [.invoice-admin_:where(&).product]:[gap:9px] [.invoice-admin_:where(&).product]:items-center"], [3691, "[.invoice-admin_:where(&).product_img]:[width:54px] [.invoice-admin_:where(&).product_img]:[height:42px] [.invoice-admin_:where(&).product_img]:object-contain [.invoice-admin_:where(&).product_img]:[background:#f3f6fa] [.invoice-admin_:where(&).product_img]:[border-radius:6px] [.invoice-admin_:where(&).product_img]:[padding:3px]"], [3692, "[.invoice-admin_:where(&).product_small]:block [.invoice-admin_:where(&).product_small]:[color:#6f83a5] [.invoice-admin_:where(&).product_small]:[margin-top:3px]"]),
  "product-description-rendered": utilities([942, "[:where(&).product-description-rendered_h1,_:where(&).product-description-rendered_h2,_:where(&).product-description-rendered_h3]:[color:#102952] [:where(&).product-description-rendered_h1,_:where(&).product-description-rendered_h2,_:where(&).product-description-rendered_h3]:[line-height:1.25]"], [943, "[:where(&).product-description-rendered_h2]:[margin:0_0_10px] [:where(&).product-description-rendered_h2]:[font-size:18px]"], [944, "[:where(&).product-description-rendered_p,_:where(&).product-description-rendered_li]:[color:#536783] [:where(&).product-description-rendered_p,_:where(&).product-description-rendered_li]:[font-size:11px] [:where(&).product-description-rendered_p,_:where(&).product-description-rendered_li]:[line-height:1.65]"], [945, "[:where(&).product-description-rendered_ul,_:where(&).product-description-rendered_ol]:[padding-left:20px]"]),
  "row": utilities([3622, "[.invoice-export_.card_:where(&).row]:flex [.invoice-export_.card_:where(&).row]:justify-between [.invoice-export_.card_:where(&).row]:[gap:12px]"], [3623, "[.invoice-export_.card_:where(&).row_b]:capitalize"]),
  "spec-tab-btn": utilities([2697, "[:where(&).spec-tab-btn]:[padding:8px_20px] [:where(&).spec-tab-btn]:[border:none] [:where(&).spec-tab-btn]:[background:transparent] [:where(&).spec-tab-btn]:[color:#475569] [:where(&).spec-tab-btn]:[font-size:14px] [:where(&).spec-tab-btn]:font-medium [:where(&).spec-tab-btn]:[border-radius:99px] [:where(&).spec-tab-btn]:cursor-pointer [:where(&).spec-tab-btn]:[transition:all_0.25s_ease] [:where(&).spec-tab-btn]:whitespace-nowrap [:where(&).spec-tab-btn]:[line-height:1.3]"], [2698, "[:where(&).spec-tab-btn:hover]:[background:#f1f5f9] [:where(&).spec-tab-btn:hover]:[color:#1e293b]"], [2699, "[:where(&).spec-tab-btn.active]:[background:#2563eb] [:where(&).spec-tab-btn.active]:[color:#fff] [:where(&).spec-tab-btn.active]:font-semibold [:where(&).spec-tab-btn.active]:[box-shadow:0_2px_8px_rgba(37,_99,_235,_.25)]"], [2708, "[@media_(max-width:_640px)]:[:where(&).spec-tab-btn]:[padding:6px_14px] [@media_(max-width:_640px)]:[:where(&).spec-tab-btn]:[font-size:12px]"]),
  "spec-table": utilities([468, "[:where(&).spec-table]:[border-collapse:collapse] [:where(&).spec-table]:[width:100%]"], [469, "[:where(&).spec-table_th,_:where(&).spec-table_td]:[border-bottom:1px_solid_#eef1f5] [:where(&).spec-table_th,_:where(&).spec-table_td]:text-left [:where(&).spec-table_th,_:where(&).spec-table_td]:[padding:8px_7px]"], [470, "[:where(&).spec-table_th]:[color:#5c6a81]"], [471, "[:where(&).spec-table_td]:[color:#25354f]"], [648, "[:is(:where(&).spec-table)]:[font-size:11px]"], [2229, "[.product-info-box_:where(&).spec-table]:[font-size:11px]"], [2284, "[:is(:where(&).spec-table_th)]:[width:42%] [:is(:where(&).spec-table_th)]:font-semibold [:is(:where(&).spec-table_th)]:text-left"], [2285, "[:where(&).spec-table_td,_:where(&).spec-table_th]:[padding:10px_12px] [:where(&).spec-table_td,_:where(&).spec-table_th]:[border-bottom:1px_solid_#eef0f3]"], [2303, "[:is(:is(:where(&).spec-table))]:[table-layout:fixed]"], [2304, "[:is(:where(&).spec-table_th),_:is(:where(&).spec-table_td)]:[word-break:break-word]"], [2700, "[:is(:is(:is(:where(&).spec-table)))]:[border-top:none]"]),
  "spec-table-empty": utilities([2705, "[:where(&).spec-table-empty]:[padding:32px_24px] [:where(&).spec-table-empty]:text-center [:where(&).spec-table-empty]:[color:#94a3b8] [:where(&).spec-table-empty]:[font-size:14px] [:where(&).spec-table-empty]:italic"]),
  "spec-table-label": utilities([2703, "[:where(&).spec-table-label]:[padding:18px_24px] [:where(&).spec-table-label]:font-semibold [:where(&).spec-table-label]:[font-size:14px] [:where(&).spec-table-label]:[color:#1e293b] [:where(&).spec-table-label]:[line-height:1.6]"], [2710, "[@media_(max-width:_640px)]:[:where(&).spec-table-label]:[padding:14px_16px_4px] [@media_(max-width:_640px)]:[:where(&).spec-table-label]:[font-size:13px]"]),
  "spec-table-row": utilities([2701, "[:where(&).spec-table-row]:grid [:where(&).spec-table-row]:[grid-template-columns:minmax(180px,_1fr)_2fr] [:where(&).spec-table-row]:[border-bottom:1px_solid_#eef2f7] [:where(&).spec-table-row]:[transition:background_0.2s_ease]"], [2702, "[:where(&).spec-table-row:hover]:[background:#f8fafc]"], [2709, "[@media_(max-width:_640px)]:[:where(&).spec-table-row]:[grid-template-columns:1fr]"]),
  "spec-table-value": utilities([2704, "[:where(&).spec-table-value]:[padding:18px_24px] [:where(&).spec-table-value]:[font-size:14px] [:where(&).spec-table-value]:[color:#475569] [:where(&).spec-table-value]:[line-height:1.6]"], [2711, "[@media_(max-width:_640px)]:[:where(&).spec-table-value]:[padding:4px_16px_14px] [@media_(max-width:_640px)]:[:where(&).spec-table-value]:[font-size:13px]"]),
  "spec-tabs-bar": utilities([2696, "[:where(&).spec-tabs-bar]:flex [:where(&).spec-tabs-bar]:flex-wrap [:where(&).spec-tabs-bar]:[gap:6px] [:where(&).spec-tabs-bar]:[padding:0_0_20px] [:where(&).spec-tabs-bar]:[border-bottom:1px_solid_#e8ecf2] [:where(&).spec-tabs-bar]:[margin-bottom:0]"], [2706, "[@media_(max-width:_640px)]:[:where(&).spec-tabs-bar]:[gap:4px] [@media_(max-width:_640px)]:[:where(&).spec-tabs-bar]:[padding-bottom:14px] [@media_(max-width:_640px)]:[:where(&).spec-tabs-bar]:overflow-x-auto [@media_(max-width:_640px)]:[:where(&).spec-tabs-bar]:flex-nowrap [@media_(max-width:_640px)]:[:where(&).spec-tabs-bar]:[-webkit-overflow-scrolling:touch] [@media_(max-width:_640px)]:[:where(&).spec-tabs-bar]:[scrollbar-width:none]"], [2707, "[@media_(max-width:_640px)]:[:where(&).spec-tabs-bar::-webkit-scrollbar]:hidden"]),
  "spec-tabs-editor": utilities([1975, "[:where(&).spec-tabs-editor_h3]:[margin-bottom:4px]"]),
};
const tw = (value: string | undefined | null | false) => resolveClasses(value, componentUtilities);


type Props = { slug: string; initialHtml: string; initialCss?: string; fallback: string };

const HtmlPart = memo(({ content }: { content: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    const videos = containerRef.current.querySelectorAll("video[autoplay]");
    videos.forEach((vid) => {
      (vid as HTMLVideoElement).play().catch(() => {});
    });
  }, [content]);

  return <div ref={containerRef} dangerouslySetInnerHTML={{ __html: tailwindHtml(content, componentUtilities) }} />;
});

/* ─── Spec Tab Filter ─── */
function parseStyleString(styleStr: string): React.CSSProperties {
  if (!styleStr) return {};
  const style: any = {};
  styleStr.split(';').forEach(rule => {
    const [key, value] = rule.split(':');
    if (key && value) {
      const camelKey = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
      style[camelKey] = value.trim();
    }
  });
  return style;
}

function ItbBlock({ part, sectionIndex }: { part: any, sectionIndex: number }) {
  const [activeTab, setActiveTab] = useState(part.tabs?.[0]?.tabName || "");
  const activeTabData = part.tabs?.find((t: any) => t.tabName === activeTab);
  const visibleItems = activeTabData ? activeTabData.items : [];
  const customStyle = part.wrapperStyle ? parseStyleString(part.wrapperStyle) : {};

  return (
    <div  {...withTailwindStyle(tw("pds-block pds-itb"), customStyle)}>
      {part.tabs && part.tabs.length > 1 && (
        <div className={utilities("itb-compare-bar", [2684, "[:where(&).itb-compare-bar]:flex [:where(&).itb-compare-bar]:items-center [:where(&).itb-compare-bar]:[gap:15px] [:where(&).itb-compare-bar]:[margin-bottom:30px] [:where(&).itb-compare-bar]:flex-wrap"])}>
          <span className={utilities("itb-compare-label", [2685, "[:where(&).itb-compare-label]:[font-size:13px] [:where(&).itb-compare-label]:font-bold [:where(&).itb-compare-label]:[color:#64748b] [:where(&).itb-compare-label]:[letter-spacing:0.1em] [:where(&).itb-compare-label]:uppercase"])}>COMPARE:</span>
          <div className={utilities("itb-tabs", [2686, "[:where(&).itb-tabs]:flex [:where(&).itb-tabs]:flex-wrap [:where(&).itb-tabs]:[gap:10px]"])}>
            {part.tabs.map((t: any) => (
              <button
                key={t.tabName}
                type="button"
                className={tw(`itb-tab-btn ${activeTab === t.tabName ? "active" : ""}`)}
                onClick={() => setActiveTab(t.tabName)}
              >
                {t.tabName}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className={utilities("itb-grid", [2690, "[:where(&).itb-grid]:grid [:where(&).itb-grid]:[grid-template-columns:repeat(auto-fill,_minmax(160px,_1fr))] [:where(&).itb-grid]:[gap:16px]"])}>
        {visibleItems.map((item: any, i: number) => (
          <div className={utilities("itb-card", [2691, "[:where(&).itb-card]:[background:#fff] [:where(&).itb-card]:[border:1px_solid_#f1f5f9] [:where(&).itb-card]:[border-radius:12px] [:where(&).itb-card]:[padding:24px_16px] [:where(&).itb-card]:flex [:where(&).itb-card]:flex-col [:where(&).itb-card]:items-center [:where(&).itb-card]:text-center [:where(&).itb-card]:[transition:all_0.3s_ease] [:where(&).itb-card]:[box-shadow:0_4px_20px_rgba(0,_0,_0,_0.03)]"], [2692, "[:where(&).itb-card:hover]:[transform:translateY(-4px)] [:where(&).itb-card:hover]:[box-shadow:0_10px_25px_rgba(0,_0,_0,_0.08)]"])} key={`${item.name}-${i}`}>
            <div className={utilities("itb-card-img", [2693, "[:where(&).itb-card-img]:[width:100%] [:where(&).itb-card-img]:[height:100px] [:where(&).itb-card-img]:flex [:where(&).itb-card-img]:items-center [:where(&).itb-card-img]:justify-center [:where(&).itb-card-img]:[margin-bottom:20px]"], [2694, "[:where(&).itb-card-img_img]:[max-width:100%] [:where(&).itb-card-img_img]:[max-height:100%] [:where(&).itb-card-img_img]:object-contain"])}>
              <img src={item.image || "/images/products/mini-5.jpg"} alt={item.name} loading="lazy" />
            </div>
            <div className={utilities("itb-card-name", [2695, "[:where(&).itb-card-name]:[font-size:13px] [:where(&).itb-card-name]:font-semibold [:where(&).itb-card-name]:[color:#1e293b] [:where(&).itb-card-name]:[line-height:1.4]"])}>{item.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpecTableBlock({ part, sectionIndex }: { part: any, sectionIndex: number }) {
  const [activeCat, setActiveCat] = useState("All");
  const hasCategories = (part.categories?.length || 0) > 0;
  const tabs = hasCategories ? ["All", ...(part.categories || [])] : [];
  const visibleRows = hasCategories && activeCat !== "All"
    ? (part.rows || []).filter((r: any) => r.cat === activeCat)
    : (part.rows || []);
  const customStyle = part.wrapperStyle ? parseStyleString(part.wrapperStyle) : {};

  return (
    <div  id="specification" {...withTailwindStyle(tw("pd-spec-section-rendered pds-specs"), customStyle)}>
      <h2 {...withTailwindStyle(tw(undefined), { fontSize: part.headingSize || "1.5rem", marginBottom: "1rem", color: "#102952", fontWeight: 700 })}>Specification</h2>
      {hasCategories && (
        <div className={utilities("spec-tabs-bar", [2696, "[:where(&).spec-tabs-bar]:flex [:where(&).spec-tabs-bar]:flex-wrap [:where(&).spec-tabs-bar]:[gap:6px] [:where(&).spec-tabs-bar]:[padding:0_0_20px] [:where(&).spec-tabs-bar]:[border-bottom:1px_solid_#e8ecf2] [:where(&).spec-tabs-bar]:[margin-bottom:0]"], [2706, "[@media_(max-width:_640px)]:[:where(&).spec-tabs-bar]:[gap:4px] [@media_(max-width:_640px)]:[:where(&).spec-tabs-bar]:[padding-bottom:14px] [@media_(max-width:_640px)]:[:where(&).spec-tabs-bar]:overflow-x-auto [@media_(max-width:_640px)]:[:where(&).spec-tabs-bar]:flex-nowrap [@media_(max-width:_640px)]:[:where(&).spec-tabs-bar]:[-webkit-overflow-scrolling:touch] [@media_(max-width:_640px)]:[:where(&).spec-tabs-bar]:[scrollbar-width:none]"], [2707, "[@media_(max-width:_640px)]:[:where(&).spec-tabs-bar::-webkit-scrollbar]:hidden"])}>
          {tabs.map((tab: string) => (
            <button
              key={tab}
              type="button"
              className={tw(`spec-tab-btn ${activeCat === tab ? "active" : ""}`)}
              onClick={() => setActiveCat(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      )}
      <table className="pd-spec-table">
        <tbody>
          {visibleRows.map((row: any, ri: number) => (
            <tr key={ri}>
              <th>{row.key}</th>
              <td>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const SpecSection = memo(function SpecSection({ html }: { html: string }) {
  const parts = useMemo(() => {
    const parsedParts: Array<{ type: "html" | "spec" | "itb"; content: string; id: string; categories?: string[]; rows?: Array<{ key: string; value: string; cat: string }>; tabs?: Array<{ tabName: string; items: Array<{ name: string; image: string }> }>; headingSize?: string; wrapperStyle?: string }> = [];

    const specPattern = /(?:<div class="pd-block-wrapper" style="([^"]*)">\s*)?<div[^>]*class="[^"]*(pd-spec-section|pd-itb-section)[^"]*"[^>]*data-(categories|tabs)="([^"]*)"[^>]*>([\s\S]*?)<\/div>(?:\s*<\/div>)?/g;
    let lastIndex = 0;
    let match;
    let specIndex = 0;

    const regex = new RegExp(specPattern.source, specPattern.flags);

    while ((match = regex.exec(html)) !== null) {
      if (match.index > lastIndex) {
        parsedParts.push({ type: "html", content: html.slice(lastIndex, match.index), id: `h-${lastIndex}` });
      }

      const wrapperStyle = match[1] || "";
      const isItb = match[2] === "pd-itb-section";

      if (isItb) {
        let tabs = [];
        try { tabs = JSON.parse(match[4].replace(/&quot;/g, '"')); } catch { /* ignore */ }
        parsedParts.push({ type: "itb", content: match[0], id: `itb-${specIndex}`, tabs, wrapperStyle });
      } else {
        let categories: string[] = [];
        try { categories = JSON.parse(match[4].replace(/&quot;/g, '"')); } catch { /* ignore */ }

        const tableHtml = match[5];
        const rows: Array<{ key: string; value: string; cat: string }> = [];
        const rowPattern = /<tr data-cat="([^"]*)"[^>]*>\s*<th>([^<]*)<\/th>\s*<td>([^<]*)<\/td>\s*<\/tr>/g;
        let rowMatch;
        while ((rowMatch = rowPattern.exec(tableHtml)) !== null) {
          rows.push({ cat: rowMatch[1], key: rowMatch[2], value: rowMatch[3] });
        }

        const divTag = match[0].substring(0, match[0].indexOf(">"));
        const headingSizeMatch = divTag.match(/data-headingsize="([^"]*)"/);
        const headingSize = headingSizeMatch ? headingSizeMatch[1] : "1.5rem";

        parsedParts.push({ type: "spec", content: match[0], id: `spec-${specIndex}`, categories, rows, headingSize, wrapperStyle });
      }
      specIndex++;
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < html.length) {
      parsedParts.push({ type: "html", content: html.slice(lastIndex), id: `h-end` });
    }

    return parsedParts;
  }, [html]);

  if (parts.length === 0 || parts.every(p => p.type === "html")) {
    return <div className={utilities("product-description-rendered", [942, "[:where(&).product-description-rendered_h1,_:where(&).product-description-rendered_h2,_:where(&).product-description-rendered_h3]:[color:#102952] [:where(&).product-description-rendered_h1,_:where(&).product-description-rendered_h2,_:where(&).product-description-rendered_h3]:[line-height:1.25]"], [943, "[:where(&).product-description-rendered_h2]:[margin:0_0_10px] [:where(&).product-description-rendered_h2]:[font-size:18px]"], [944, "[:where(&).product-description-rendered_p,_:where(&).product-description-rendered_li]:[color:#536783] [:where(&).product-description-rendered_p,_:where(&).product-description-rendered_li]:[font-size:11px] [:where(&).product-description-rendered_p,_:where(&).product-description-rendered_li]:[line-height:1.65]"], [945, "[:where(&).product-description-rendered_ul,_:where(&).product-description-rendered_ol]:[padding-left:20px]"])}><HtmlPart content={html} /></div>;
  }

  return (
    <div className={utilities("product-description-rendered", [942, "[:where(&).product-description-rendered_h1,_:where(&).product-description-rendered_h2,_:where(&).product-description-rendered_h3]:[color:#102952] [:where(&).product-description-rendered_h1,_:where(&).product-description-rendered_h2,_:where(&).product-description-rendered_h3]:[line-height:1.25]"], [943, "[:where(&).product-description-rendered_h2]:[margin:0_0_10px] [:where(&).product-description-rendered_h2]:[font-size:18px]"], [944, "[:where(&).product-description-rendered_p,_:where(&).product-description-rendered_li]:[color:#536783] [:where(&).product-description-rendered_p,_:where(&).product-description-rendered_li]:[font-size:11px] [:where(&).product-description-rendered_p,_:where(&).product-description-rendered_li]:[line-height:1.65]"], [945, "[:where(&).product-description-rendered_ul,_:where(&).product-description-rendered_ol]:[padding-left:20px]"])}>
      {parts.map((part, pi) => {
        if (part.type === "html") {
          return <HtmlPart key={part.id} content={part.content} />;
        }
        if (part.type === "itb") {
          return <ItbBlock key={part.id} part={part} sectionIndex={pi} />;
        }
        return <SpecTableBlock key={part.id} part={part} sectionIndex={pi} />;
      })}
    </div>
  );
});

export default function ProductDescriptionLive({ slug, initialHtml, initialCss = "", fallback }: Props) {
  const [content, setContent] = useState({ html: initialHtml, css: initialCss });
  useEffect(() => {
    const read = () => {
      try {
        const products = JSON.parse(window.localStorage.getItem("drone-admin-products") || "[]") as Array<{ slug?: string; description?: string; descriptionHtml?: string; descriptionCss?: string }>;
        const product = products.find((item) => item.slug === slug);
        if (product) setContent({ html: product.descriptionHtml || product.description || fallback, css: product.descriptionCss || "" });
      } catch { /* server content remains visible */ }
    };
    read();
    window.addEventListener("drone-products-updated", read);
    return () => window.removeEventListener("drone-products-updated", read);
  }, [fallback, slug]);
  const html = normalizeDescriptionInput(content.html || fallback);
  return <>
    <style>{content.css}</style>
    <SpecSection html={html} />
  </>;
}
