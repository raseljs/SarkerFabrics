"use client";


import { withTailwindStyle, utilities, resolveClasses } from "@/lib/tailwind";
import { useTimedFeedback } from "@/hooks/use-timed-feedback";

import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState, useCallback, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest, getApiBase } from "@/lib/api";

// Component styling is compiled from these local Tailwind utilities.
const componentUtilities: Record<string, string> = {
  "acc-grid": utilities([2862, "[:where(&).acc-grid]:grid [:where(&).acc-grid]:[grid-template-columns:repeat(4,_1fr)] [:where(&).acc-grid]:[gap:13px]"], [2863, "[@media_(max-width:_960px)]:[:where(&).accessories-grid,_:where(&).acc-grid]:[grid-template-columns:repeat(2,_1fr)] [@media_(max-width:_960px)]:[:where(&).accessories-grid,_:where(&).acc-grid]:[gap:10px]"], [2864, "[@media_(max-width:_720px)]:[:where(&).acc-grid]:[grid-template-columns:repeat(2,_1fr)] [@media_(max-width:_720px)]:[:where(&).acc-grid]:[gap:8px]"]),
  "accessory-img": utilities([2869, "[:where(&).accessory-img]:[width:100%] [:where(&).accessory-img]:[height:100%] [:where(&).accessory-img]:object-cover [:where(&).accessory-img]:[object-position:center] [:where(&).accessory-img]:[mix-blend-mode:multiply] [:where(&).accessory-img]:block"]),
  "accessory-store-card": utilities([2865, "[:where(&).accessory-store-card]:[border:1px_solid_var(--line)] [:where(&).accessory-store-card]:[border-radius:8px] [:where(&).accessory-store-card]:[background:#fff] [:where(&).accessory-store-card]:overflow-hidden [:where(&).accessory-store-card]:flex [:where(&).accessory-store-card]:flex-col [:where(&).accessory-store-card]:[transition:box-shadow_0.2s,_border-color_0.2s]"], [2866, "[:where(&).accessory-store-card>div]:[min-width:0]"], [2867, "[:where(&).accessory-store-card:hover]:[border-color:#d0d7e5] [:where(&).accessory-store-card:hover]:[box-shadow:0_8px_24px_rgba(16,_46,_89,_0.06)]"]),
  "accessory-store-desc": utilities([2872, "[:where(&).accessory-store-desc]:[font-size:13px] [:where(&).accessory-store-desc]:[color:var(--text-light)] [:where(&).accessory-store-desc]:[margin:0_0_12px] [:where(&).accessory-store-desc]:[line-height:1.4]"], [2908, "[@media_(max-width:_768px)]:[:where(&).accessory-store-desc]:[font-size:11px] [@media_(max-width:_768px)]:[:where(&).accessory-store-desc]:[margin-bottom:8px] [@media_(max-width:_768px)]:[:where(&).accessory-store-desc]:[display:-webkit-box] [@media_(max-width:_768px)]:[:where(&).accessory-store-desc]:[-webkit-line-clamp:2] [@media_(max-width:_768px)]:[:where(&).accessory-store-desc]:[-webkit-box-orient:vertical] [@media_(max-width:_768px)]:[:where(&).accessory-store-desc]:overflow-hidden"]),
  "accessory-store-image": utilities([2868, "[:where(&).accessory-store-image]:[background:#fbfcfe] [:where(&).accessory-store-image]:[height:190px] [:where(&).accessory-store-image]:block [:where(&).accessory-store-image]:[border-bottom:1px_solid_var(--line)] [:where(&).accessory-store-image]:overflow-hidden"], [2905, "[@media_(max-width:_768px)]:[:where(&).accessory-store-image]:[height:140px]"]),
  "accessory-store-info": utilities([2870, "[:where(&).accessory-store-info]:[padding:16px] [:where(&).accessory-store-info]:flex [:where(&).accessory-store-info]:flex-col [:where(&).accessory-store-info]:[flex-grow:1]"], [2871, "[:where(&).accessory-store-info_h3]:[font-size:15px] [:where(&).accessory-store-info_h3]:font-semibold [:where(&).accessory-store-info_h3]:[color:var(--text)] [:where(&).accessory-store-info_h3]:[margin:0_0_6px] [:where(&).accessory-store-info_h3]:[line-height:1.3]"], [2906, "[@media_(max-width:_768px)]:[:where(&).accessory-store-info]:[padding:10px]"], [2907, "[@media_(max-width:_768px)]:[:where(&).accessory-store-info_h3]:[font-size:13px] [@media_(max-width:_768px)]:[:where(&).accessory-store-info_h3]:[margin-bottom:4px] [@media_(max-width:_768px)]:[:where(&).accessory-store-info_h3]:[display:-webkit-box] [@media_(max-width:_768px)]:[:where(&).accessory-store-info_h3]:[-webkit-line-clamp:2] [@media_(max-width:_768px)]:[:where(&).accessory-store-info_h3]:[-webkit-box-orient:vertical] [@media_(max-width:_768px)]:[:where(&).accessory-store-info_h3]:overflow-hidden"]),
  "active": utilities([74, "[.hero-dots_:where(&).active]:[background:#173e89]"], [299, "[.admin-sidebar_a:where(&).active,_:where(&).admin-sidebar_a:hover]:[color:var(--ink)] [.admin-sidebar_a:where(&).active,_:where(&).admin-sidebar_a:hover]:[background:#eef4ff]"], [459, "[.detail-tabs_button:where(&).active]:[background:var(--red)] [.detail-tabs_button:where(&).active]:[color:#fff]"], [466, "[.content-tabs_:where(&).active]:[color:var(--red)] [.content-tabs_:where(&).active]:font-extrabold [.content-tabs_:where(&).active]:[border-top:2px_solid_var(--red)]"], [728, "[:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[background:#f1f4f8] [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[color:var(--ink)] [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:font-bold [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[border-left:3px_solid_#73b2cd] [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[padding-left:16px]"], [741, "[.nav-bar>a:where(&).active,_.nav-bar_:where(&).maintenance-link.active]:[color:var(--red)]"], [742, "[.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[content:''] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:absolute [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[left:0] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[right:0] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[bottom:0] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[height:2px] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[background:var(--red)]"], [774, "[.article-pagination_button:where(&).active]:[border-color:var(--red)] [.article-pagination_button:where(&).active]:[background:var(--red)] [.article-pagination_button:where(&).active]:[color:#fff]"], [843, "[.mega-mode-tabs_button:where(&).active]:[color:#1266cf] [.mega-mode-tabs_button:where(&).active]:[border-bottom-color:#1266cf]"], [932, "[.rich-editor-tabs_button:where(&).active]:[color:#155fc5] [.rich-editor-tabs_button:where(&).active]:[border-bottom-color:#155fc5]"], [992, "[.rde-toggle-row_button:where(&).active]:[background:#eef4ff] [.rde-toggle-row_button:where(&).active]:[border-color:#3f70ce] [.rde-toggle-row_button:where(&).active]:[color:#155fc5]"], [1071, "[:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[border-left-color:#72b6d2] [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[background:#f0f3f7] [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[color:#102952] [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:font-bold [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[outline:0]"], [1120, "[@media_(max-width:_720px)]:[:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[padding-left:5px]"], [1143, "[@media_(max-width:_720px)]:[:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[border-color:#72b6d2] [@media_(max-width:_720px)]:[:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[background:#eef7fb]"], [1369, "[.admin-app-nav_a:where(&).active]:[color:#fff] [.admin-app-nav_a:where(&).active]:[background:linear-gradient(120deg,_#1a7de8_0%,_#1e97f5_100%)] [.admin-app-nav_a:where(&).active]:[box-shadow:0_6px_20px_rgba(22,_100,_220,_.4),_inset_0_1px_0_rgba(255,_255,_255,_.15)] [.admin-app-nav_a:where(&).active]:font-bold"], [1370, "[.admin-app-nav_a:where(&).active_svg]:[color:#e0f0ff] [.admin-app-nav_a:where(&).active_svg]:[opacity:1]"], [1864, "[.hero-slider-dots_button:where(&).active]:[width:10px] [.hero-slider-dots_button:where(&).active]:[background:#1d5fb8]"], [2075, "[.nav-bar>a:where(&).active]:[color:var(--red)]"], [2226, "[.product-space-tabs_button:where(&).active]:[background:#e91b23] [.product-space-tabs_button:where(&).active]:[color:#fff]"], [2411, "[.order-tabs_button:where(&).active]:[color:#0d67e8] [.order-tabs_button:where(&).active]:[border-bottom-color:#0d67e8]"], [2413, "[.order-tabs_:where(&).active_b]:[background:#166cf0] [.order-tabs_:where(&).active_b]:[color:#fff]"], [2498, "[.order-pagination_button:where(&).active]:[background:#0968f5] [.order-pagination_button:where(&).active]:[color:#fff] [.order-pagination_button:where(&).active]:[border-color:#0968f5]"], [2898, "[.product-nav-pill_button:where(&).active]:[background:var(--red)] [.product-nav-pill_button:where(&).active]:[color:#fff]"], [3331, "[.resource-tabs_button:where(&).active]:[color:#fff] [.resource-tabs_button:where(&).active]:[border-color:transparent] [.resource-tabs_button:where(&).active]:[background:linear-gradient(135deg,#145bc6,#277fe3)] [.resource-tabs_button:where(&).active]:[box-shadow:0_5px_12px_rgba(29,100,207,.22)]"]),
  "body": utilities([3684, "[.invoice-admin_.card_:where(&).body]:[padding:10px_15px] [.invoice-admin_.card_:where(&).body]:[font-size:11px] [.invoice-admin_.card_:where(&).body]:[line-height:1.55]"]),
  "brand": utilities([3612, "[.invoice-export_:where(&).brand_h1]:[margin:0] [.invoice-export_:where(&).brand_h1]:[font-size:25px] [.invoice-export_:where(&).brand_h1]:[color:#0b2445]"], [3613, "[.invoice-export_:where(&).brand_p]:[margin:7px_0_0] [.invoice-export_:where(&).brand_p]:[color:#64748b]"], [3664, "[.invoice-admin_:where(&).brand]:flex [.invoice-admin_:where(&).brand]:[gap:10px] [.invoice-admin_:where(&).brand]:items-center"], [3666, "[.invoice-admin_:where(&).brand_strong]:[font-size:26px] [.invoice-admin_:where(&).brand_strong]:[letter-spacing:2px]"], [3667, "[.invoice-admin_:where(&).brand_b]:block [.invoice-admin_:where(&).brand_b]:[font-size:13px] [.invoice-admin_:where(&).brand_b]:[letter-spacing:3px]"], [3668, "[.invoice-admin_:where(&).brand_small]:block [.invoice-admin_:where(&).brand_small]:[color:#7a91b8] [.invoice-admin_:where(&).brand_small]:[margin-top:6px]"]),
  "button": utilities([62, "[:where(&).button]:[min-height:39px] [:where(&).button]:inline-flex [:where(&).button]:items-center [:where(&).button]:justify-center [:where(&).button]:[gap:7px] [:where(&).button]:[border-radius:4px] [:where(&).button]:[padding:0_17px] [:where(&).button]:font-bold [:where(&).button]:cursor-pointer [:where(&).button]:[border:1px_solid_transparent]"], [280, "[.cart-summary_:where(&).button]:[width:100%] [.cart-summary_:where(&).button]:[margin-top:12px]"], [286, "[.checkout-form>:where(&).button]:[width:max-content] [.checkout-form>:where(&).button]:[margin-top:6px]"], [492, "[.accessory-card_:where(&).button]:[width:100%] [.accessory-card_:where(&).button]:[margin-top:12px] [.accessory-card_:where(&).button]:[border-radius:6px] [.accessory-card_:where(&).button]:text-ellipsis [.accessory-card_:where(&).button]:overflow-hidden [.accessory-card_:where(&).button]:whitespace-nowrap"], [603, "[:is(:where(&).button)]:[font-size:14px]"], [654, "[:is(.accessory-card_:where(&).button)]:[font-size:10px] [:is(.accessory-card_:where(&).button)]:[padding:0_4px] [:is(.accessory-card_:where(&).button)]:[min-height:30px]"], [683, "[@media_(max-width:_720px)]:[:where(&).button,_:where(&).text-link]:[font-size:12px]"], [809, "[.package-card_footer_:where(&).button]:[font-size:11px] [.package-card_footer_:where(&).button]:[min-height:32px] [.package-card_footer_:where(&).button]:[padding:0_13px]"], [818, "[.maintenance-cta_:where(&).button]:[margin-right:15px]"], [837, "[@media_(max-width:_720px)]:[.maintenance-cta_:where(&).button]:[margin:0_0_12px]"], [1225, "[.combo-modal>footer_:where(&).button]:[min-height:36px]"], [1289, "[@media_(max-width:_720px)]:[.combo-modal>footer_:where(&).button]:[width:100%]"], [2383, "[@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:inline-block [@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:[margin-top:15px]"], [2479, "[.reference-toolbar_:where(&).button]:[height:34px] [.reference-toolbar_:where(&).button]:[padding:0_10px] [.reference-toolbar_:where(&).button]:[font-size:10px]"], [2491, "[.order-actions_:where(&).button]:[font-size:9px] [.order-actions_:where(&).button]:[padding:6px_14px]"], [2542, "[.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[height:34px] [.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[font-size:9px]"], [2579, "[.order-confirmation-actions_:where(&).button]:flex [.order-confirmation-actions_:where(&).button]:items-center [.order-confirmation-actions_:where(&).button]:justify-center [.order-confirmation-actions_:where(&).button]:[gap:7px] [.order-confirmation-actions_:where(&).button]:[min-height:43px] [.order-confirmation-actions_:where(&).button]:[text-decoration:none]"], [2587, "[.invoice-actions_:where(&).button]:flex [.invoice-actions_:where(&).button]:items-center [.invoice-actions_:where(&).button]:justify-center [.invoice-actions_:where(&).button]:[gap:6px]"], [2627, "[@media_(max-width:680px)]:[.invoice-actions_:where(&).button]:[flex:1_1_100%]"], [2653, "[.drawer-edit-actions_:where(&).button]:[height:31px] [.drawer-edit-actions_:where(&).button]:[padding:0_11px] [.drawer-edit-actions_:where(&).button]:[font-size:9px]"]),
  "button-primary": utilities([63, "[:where(&).button-primary]:[background:var(--navy)] [:where(&).button-primary]:[color:#fff]"], [64, "[:where(&).button-primary:hover]:[background:#123d6b]"]),
  "button-red": utilities([65, "[:where(&).button-red]:[background:var(--red)] [:where(&).button-red]:[color:#fff]"], [446, "[.purchase-actions>:where(&).button-red]:[min-height:35px] [.purchase-actions>:where(&).button-red]:[flex:1]"], [447, "[.purchase-actions_:where(&).cart-action,_.purchase-actions_:where(&).button-red]:[font-size:16px]"], [2189, "[.purchase-actions_:where(&).button-red]:[background:var(--red)]"], [2830, "[@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[flex:1] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[min-height:38px] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[font-size:14px] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:font-bold [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[padding:0_4px]"]),
  "catalog-breadcrumb": utilities([337, "[:where(&).catalog-breadcrumb]:flex [:where(&).catalog-breadcrumb]:items-center [:where(&).catalog-breadcrumb]:flex-wrap [:where(&).catalog-breadcrumb]:[gap:2px] [:where(&).catalog-breadcrumb]:[font-size:11px] [:where(&).catalog-breadcrumb]:[color:#b7c8dc] [:where(&).catalog-breadcrumb]:[margin:0_0_20px] [:where(&).catalog-breadcrumb]:[letter-spacing:0.03em]"], [338, "[:where(&).catalog-breadcrumb_a]:[color:#b7c8dc] [:where(&).catalog-breadcrumb_a]:[text-decoration:none] [:where(&).catalog-breadcrumb_a]:[transition:color_0.15s]"], [339, "[:where(&).catalog-breadcrumb_a:hover]:[color:#fff] [:where(&).catalog-breadcrumb_a:hover]:[text-decoration:underline]"], [340, "[:where(&).catalog-breadcrumb_span]:[color:#7a9abc]"], [341, "[:where(&).catalog-breadcrumb>span:last-child]:[color:#fff] [:where(&).catalog-breadcrumb>span:last-child]:font-semibold"]),
  "catalog-hero": utilities([330, "[:where(&).catalog-hero]:[background:radial-gradient(circle_at_75%_30%,_#2e4d70,_transparent_40%),_linear-gradient(115deg,_#071b32,_#1e3b5c)] [:where(&).catalog-hero]:[color:#fff] [:where(&).catalog-hero]:[padding:39px_0_42px] [:where(&).catalog-hero]:[margin-top:0] [:where(&).catalog-hero]:relative [:where(&).catalog-hero]:overflow-hidden"], [334, "[:where(&).catalog-hero_p]:[color:#b7c8dc] [:where(&).catalog-hero_p]:[margin:0_0_23px]"], [335, "[:where(&).catalog-hero_h1]:[font-size:clamp(32px,_4vw,_54px)] [:where(&).catalog-hero_h1]:[letter-spacing:-.05em] [:where(&).catalog-hero_h1]:[margin:0_0_10px]"], [336, "[:where(&).catalog-hero_span]:[color:#d0dbea]"], [543, "[@media_(max-width:_720px)]:[:where(&).catalog-hero]:[padding:29px_0_32px]"], [544, "[@media_(max-width:_720px)]:[:where(&).catalog-hero_h1]:[font-size:35px]"], [545, "[@media_(max-width:_720px)]:[:where(&).catalog-hero_p]:[margin-bottom:17px]"], [624, "[:is(:where(&).catalog-hero_p)]:[font-size:13px]"], [625, "[:is(:where(&).catalog-hero_span)]:[font-size:15px]"]),
  "catalog-hero--has-image": utilities([331, "[:where(&).catalog-hero--has-image]:[background-size:cover] [:where(&).catalog-hero--has-image]:[background-position:center] [:where(&).catalog-hero--has-image]:[background-repeat:no-repeat]"], [332, "[:where(&).catalog-hero--has-image::before]:[content:''] [:where(&).catalog-hero--has-image::before]:absolute [:where(&).catalog-hero--has-image::before]:[inset:0] [:where(&).catalog-hero--has-image::before]:[background:rgba(0,_0,_0,_0.55)] [:where(&).catalog-hero--has-image::before]:[z-index:0]"]),
  "clear-filter": utilities([360, "[:where(&).clear-filter]:[margin:15px] [:where(&).clear-filter]:[width:calc(100%_-_30px)] [:where(&).clear-filter]:[height:31px] [:where(&).clear-filter]:[border:1px_solid_#bdc8d7] [:where(&).clear-filter]:[background:#fff] [:where(&).clear-filter]:[color:var(--ink)] [:where(&).clear-filter]:[border-radius:3px] [:where(&).clear-filter]:flex [:where(&).clear-filter]:items-center [:where(&).clear-filter]:justify-center [:where(&).clear-filter]:[gap:6px] [:where(&).clear-filter]:cursor-pointer"], [630, "[:is(:where(&).clear-filter)]:[font-size:12px]"]),
  "current": utilities([2537, "[.timeline-event_i:where(&).current]:[background:#0c67eb]"]),
  "empty-state": utilities([281, "[:where(&).empty-state]:text-center [:where(&).empty-state]:[border:1px_dashed_#cfd8e4] [:where(&).empty-state]:[border-radius:8px] [:where(&).empty-state]:[padding:65px_20px] [:where(&).empty-state]:[margin-top:28px]"], [283, "[:where(&).empty-state_h2]:[font-size:20px] [:where(&).empty-state_h2]:[margin:10px_0_7px]"], [284, "[:where(&).empty-state_p]:[color:#626e83] [:where(&).empty-state_p]:[font-size:11px] [:where(&).empty-state_p]:[margin:0_0_20px]"]),
  "filter-apply-btn": utilities([361, "[:where(&).filter-apply-btn]:[margin:15px] [:where(&).filter-apply-btn]:[width:calc(100%_-_30px)] [:where(&).filter-apply-btn]:[font-size:12px] [:where(&).filter-apply-btn]:font-semibold [:where(&).filter-apply-btn]:[letter-spacing:0.02em] [:where(&).filter-apply-btn]:[transition:background_0.2s,_opacity_0.2s,_transform_0.15s]"], [362, "[:where(&).filter-apply-btn:disabled]:[opacity:0.85] [:where(&).filter-apply-btn:disabled]:[cursor:wait] [:where(&).filter-apply-btn:disabled]:[transform:none]"], [1565, "[:is(:where(&).filter-apply-btn)]:flex [:is(:where(&).filter-apply-btn)]:items-center [:is(:where(&).filter-apply-btn)]:justify-center [:is(:where(&).filter-apply-btn)]:[gap:8px]"]),
  "filter-btn-spinner": utilities([363, "[:where(&).filter-btn-spinner]:inline-block [:where(&).filter-btn-spinner]:[width:13px] [:where(&).filter-btn-spinner]:[height:13px] [:where(&).filter-btn-spinner]:[border:2px_solid_rgba(255,_255,_255,_0.35)]"], [364, "[:is(:where(&).filter-btn-spinner)]:[border-top-color:#fff] [:is(:where(&).filter-btn-spinner)]:[border-radius:50%] [:is(:where(&).filter-btn-spinner)]:animate-[spinner-rotate_0.7s_linear_infinite] [:is(:where(&).filter-btn-spinner)]:[flex-shrink:0]"]),
  "filter-group": utilities([351, "[:where(&).filter-group]:[padding:16px_15px] [:where(&).filter-group]:[border-bottom:1px_solid_var(--line)]"], [352, "[:where(&).filter-group>strong]:block [:where(&).filter-group>strong]:[margin-bottom:14px]"], [353, "[:where(&).filter-group_label]:flex [:where(&).filter-group_label]:items-center [:where(&).filter-group_label]:[gap:8px] [:where(&).filter-group_label]:[color:#6d7890] [:where(&).filter-group_label]:[margin:10px_0]"], [354, "[:where(&).filter-group_input]:[accent-color:var(--red)]"], [627, "[:is(:where(&).filter-group>strong)]:[font-size:13px]"], [628, "[:is(:where(&).filter-group_label)]:[font-size:12px]"]),
  "filter-panel": utilities([349, "[:where(&).filter-panel]:[border:1px_solid_var(--line)] [:where(&).filter-panel]:[border-radius:8px] [:where(&).filter-panel]:[height:max-content]"], [540, "[@media_(max-width:_720px)]:[:where(&).filter-panel]:hidden"], [1560, "[:where(&).filter-panel_form]:grid [:where(&).filter-panel_form]:[gap:12px]"], [1561, "[:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[width:100%] [:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[border:1px_solid_#dfe5ec] [:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[border-radius:7px] [:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[background:#fff] [:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[padding:10px_11px] [:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[color:#1f3048] [:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[font:inherit]"]),
  "filter-title": utilities([350, "[:where(&).filter-title]:flex [:where(&).filter-title]:items-center [:where(&).filter-title]:justify-between [:where(&).filter-title]:[padding:15px] [:where(&).filter-title]:[border-bottom:1px_solid_var(--line)]"], [626, "[:is(:where(&).filter-title)]:[font-size:14px]"]),
  "items": utilities([3686, "[.invoice-admin_:where(&).items]:[width:100%] [.invoice-admin_:where(&).items]:[border-collapse:collapse] [.invoice-admin_:where(&).items]:[border:1px_solid_#cfe0f7] [.invoice-admin_:where(&).items]:[border-radius:7px] [.invoice-admin_:where(&).items]:overflow-hidden [.invoice-admin_:where(&).items]:[font-size:10px]"], [3687, "[.invoice-admin_:where(&).items_th]:[background:#edf5ff] [.invoice-admin_:where(&).items_th]:[padding:10px] [.invoice-admin_:where(&).items_th]:text-left"], [3688, "[.invoice-admin_:where(&).items_td]:[padding:9px_10px] [.invoice-admin_:where(&).items_td]:[border-top:1px_solid_#dce8f6]"], [3689, "[.invoice-admin_:where(&).items_th:nth-child(n+3),_.invoice-admin_:where(&).items_td:nth-child(n+3)]:text-center"]),
  "line": utilities([3685, "[.invoice-admin_.card_:where(&).line]:grid [.invoice-admin_.card_:where(&).line]:[grid-template-columns:105px_10px_1fr] [.invoice-admin_.card_:where(&).line]:[margin:4px_0]"]),
  "listing-layout": utilities([347, "[:where(&).listing-layout]:grid [:where(&).listing-layout]:[grid-template-columns:218px_1fr] [:where(&).listing-layout]:[gap:27px] [:where(&).listing-layout]:[padding-top:24px]"], [539, "[@media_(max-width:_720px)]:[:where(&).listing-layout]:[grid-template-columns:1fr] [@media_(max-width:_720px)]:[:where(&).listing-layout]:[gap:16px]"]),
  "listing-results": utilities([348, "[:where(&).listing-results]:[min-width:0]"]),
  "listing-toolbar": utilities([377, "[:where(&).listing-toolbar]:flex [:where(&).listing-toolbar]:justify-between [:where(&).listing-toolbar]:items-center [:where(&).listing-toolbar]:[color:#6a758a] [:where(&).listing-toolbar]:[margin-bottom:14px]"], [378, "[:where(&).listing-toolbar_label]:flex [:where(&).listing-toolbar_label]:items-center [:where(&).listing-toolbar_label]:[gap:8px]"], [379, "[:where(&).listing-toolbar_select]:[border:1px_solid_#d9e0e8] [:where(&).listing-toolbar_select]:[border-radius:4px] [:where(&).listing-toolbar_select]:[padding:7px_26px_7px_10px] [:where(&).listing-toolbar_select]:[color:var(--ink)] [:where(&).listing-toolbar_select]:[background:#fff]"], [380, "[:where(&).listing-toolbar_label_svg]:[margin-left:-24px] [:where(&).listing-toolbar_label_svg]:pointer-events-none"], [541, "[@media_(max-width:_720px)]:[:where(&).listing-toolbar]:[margin-top:3px]"], [631, "[:is(:where(&).listing-toolbar)]:[font-size:13px]"], [632, "[:is(:where(&).listing-toolbar_select)]:[font-size:12px]"]),
  "meta": utilities([3618, "[.invoice-export_:where(&).meta]:grid [.invoice-export_:where(&).meta]:[grid-template-columns:1fr_1fr] [.invoice-export_:where(&).meta]:[gap:24px] [.invoice-export_:where(&).meta]:[margin:28px_0]"], [3633, "[@media_(max-width:650px)]:[.invoice-export_:where(&).head,_.invoice-export_:where(&).meta]:block"], [3676, "[.invoice-admin_:where(&).meta]:[border-left:1px_solid_#d6e2f2] [.invoice-admin_:where(&).meta]:[padding-left:28px]"], [3677, "[.invoice-admin_:where(&).meta_p]:grid [.invoice-admin_:where(&).meta_p]:[grid-template-columns:115px_12px_1fr] [.invoice-admin_:where(&).meta_p]:[margin:7px_0] [.invoice-admin_:where(&).meta_p]:[font-size:11px]"]),
  "next": utilities([775, "[.article-pagination_button:where(&).next]:inline-flex [.article-pagination_button:where(&).next]:items-center [.article-pagination_button:where(&).next]:[gap:5px] [.article-pagination_button:where(&).next]:[padding-inline:11px]"]),
  "old-price": utilities([115, "[:where(&).old-price]:[color:#687384] [:where(&).old-price]:[text-decoration:line-through]"], [611, "[:is(:where(&).old-price)]:[font-size:12px]"], [2875, "[.accessory-store-card_:where(&).old-price]:[font-size:13px] [.accessory-store-card_:where(&).old-price]:[color:var(--text-light)] [.accessory-store-card_:where(&).old-price]:[text-decoration:line-through]"], [2911, "[@media_(max-width:_768px)]:[.accessory-store-card_:where(&).old-price]:[font-size:12px]"]),
  "page": utilities([3662, "[.invoice-admin_:where(&).page]:[width:794px] [.invoice-admin_:where(&).page]:[min-height:1123px] [.invoice-admin_:where(&).page]:[margin:20px_auto] [.invoice-admin_:where(&).page]:[background:#fff] [.invoice-admin_:where(&).page]:[padding:28px_30px] [.invoice-admin_:where(&).page]:[box-shadow:0_4px_25px_#0a2d6218]"], [3709, "[@media_print]:[.invoice-admin_:where(&).page]:[margin:0] [@media_print]:[.invoice-admin_:where(&).page]:[box-shadow:none] [@media_print]:[.invoice-admin_:where(&).page]:[width:100%] [@media_print]:[.invoice-admin_:where(&).page]:[min-height:auto]"]),
  "page-container": utilities([15, "[:where(&).page-container]:[width:min(1240px,_calc(100%_-_24px))] [:where(&).page-container]:[margin-inline:auto]"], [16, "[@media_(min-width:_768px)]:[:where(&).page-container]:[width:min(1240px,_calc(100%_-_48px))]"], [333, "[.catalog-hero_:where(&).page-container]:relative [.catalog-hero_:where(&).page-container]:[z-index:1]"], [501, "[@media_(max-width:_720px)]:[:where(&).page-container]:[width:min(100%_-_28px,_620px)]"]),
  "pagination": utilities([384, "[:where(&).pagination]:flex [:where(&).pagination]:items-center [:where(&).pagination]:justify-center [:where(&).pagination]:[gap:6px]"]),
  "pagination-arrow": utilities([388, "[:where(&).pagination-arrow]:inline-flex [:where(&).pagination-arrow]:items-center [:where(&).pagination-arrow]:justify-center [:where(&).pagination-arrow]:[width:40px] [:where(&).pagination-arrow]:[height:40px] [:where(&).pagination-arrow]:[background:#fff] [:where(&).pagination-arrow]:[border:1.5px_solid_#dde3ed] [:where(&).pagination-arrow]:[border-radius:10px] [:where(&).pagination-arrow]:[color:#3a4a6b] [:where(&).pagination-arrow]:[text-decoration:none] [:where(&).pagination-arrow]:[transition:border-color_.15s,_background_.15s,_color_.15s]"], [389, "[:where(&).pagination-arrow:hover]:[border-color:#071b32] [:where(&).pagination-arrow:hover]:[background:#071b32] [:where(&).pagination-arrow:hover]:[color:#fff]"]),
  "pagination-ellipsis": utilities([390, "[:where(&).pagination-ellipsis]:inline-flex [:where(&).pagination-ellipsis]:items-center [:where(&).pagination-ellipsis]:justify-center [:where(&).pagination-ellipsis]:[width:36px] [:where(&).pagination-ellipsis]:[height:40px] [:where(&).pagination-ellipsis]:[color:#8a9bb0] [:where(&).pagination-ellipsis]:[font-size:16px] [:where(&).pagination-ellipsis]:font-bold [:where(&).pagination-ellipsis]:pointer-events-none"]),
  "pagination-info": utilities([383, "[:where(&).pagination-info]:[font-size:13px] [:where(&).pagination-info]:[color:#8a9bb0] [:where(&).pagination-info]:font-medium"]),
  "pagination-nav": utilities([382, "[:where(&).pagination-nav]:flex [:where(&).pagination-nav]:flex-col [:where(&).pagination-nav]:items-center [:where(&).pagination-nav]:[gap:14px] [:where(&).pagination-nav]:[margin:36px_0_12px]"]),
  "pagination-page": utilities([385, "[:where(&).pagination-page]:inline-flex [:where(&).pagination-page]:items-center [:where(&).pagination-page]:justify-center [:where(&).pagination-page]:[min-width:40px] [:where(&).pagination-page]:[height:40px] [:where(&).pagination-page]:[padding:0_4px] [:where(&).pagination-page]:[background:#fff] [:where(&).pagination-page]:[border:1.5px_solid_#dde3ed] [:where(&).pagination-page]:[border-radius:10px] [:where(&).pagination-page]:[font-size:14px] [:where(&).pagination-page]:font-semibold [:where(&).pagination-page]:[color:#3a4a6b] [:where(&).pagination-page]:[text-decoration:none] [:where(&).pagination-page]:[transition:border-color_.15s,_background_.15s,_color_.15s,_box-shadow_.15s]"], [386, "[:where(&).pagination-page:hover]:[border-color:#0d67e8] [:where(&).pagination-page:hover]:[color:#0d67e8] [:where(&).pagination-page:hover]:[background:#f0f6ff]"], [387, "[:where(&).pagination-page.active]:[background:#ed1c24] [:where(&).pagination-page.active]:[border-color:#ed1c24] [:where(&).pagination-page.active]:[color:#fff] [:where(&).pagination-page.active]:[box-shadow:0_4px_14px_rgba(237,_28,_36,_.32)] [:where(&).pagination-page.active]:pointer-events-none"]),
  "price": utilities([114, "[:where(&).price]:[color:var(--red)] [:where(&).price]:font-extrabold"], [610, "[:is(:where(&).price)]:[font-size:20px]"], [690, "[@media_(max-width:_720px)]:[:where(&).price]:[font-size:17px]"], [2874, "[.accessory-store-card_:where(&).price]:[font-size:17px] [.accessory-store-card_:where(&).price]:font-bold [.accessory-store-card_:where(&).price]:[color:var(--primary)]"], [2910, "[@media_(max-width:_768px)]:[.accessory-store-card_:where(&).price]:[font-size:15px]"]),
  "price-range-dash": utilities([1564, "[:where(&).price-range-dash]:[color:#8a9bb0] [:where(&).price-range-dash]:[font-size:16px] [:where(&).price-range-dash]:[flex-shrink:0]"]),
  "price-range-row": utilities([1562, "[:where(&).price-range-row]:flex [:where(&).price-range-row]:items-center [:where(&).price-range-row]:[gap:8px]"], [1563, "[:where(&).price-range-row_input]:[flex:1] [:where(&).price-range-row_input]:[width:0]"]),
  "price-row": utilities([113, "[:where(&).price-row]:flex [:where(&).price-row]:[gap:7px] [:where(&).price-row]:items-baseline [:where(&).price-row]:flex-wrap"], [590, "[@media_(max-width:_720px)]:[:where(&).price-row]:[margin-top:2px]"], [2873, "[.accessory-store-card_:where(&).price-row]:flex [.accessory-store-card_:where(&).price-row]:items-center [.accessory-store-card_:where(&).price-row]:[gap:8px] [.accessory-store-card_:where(&).price-row]:[margin-bottom:14px]"], [2909, "[@media_(max-width:_768px)]:[.accessory-store-card_:where(&).price-row]:[margin-bottom:10px] [@media_(max-width:_768px)]:[.accessory-store-card_:where(&).price-row]:flex-wrap [@media_(max-width:_768px)]:[.accessory-store-card_:where(&).price-row]:[gap:4px]"]),
  "product-grid--loading": utilities([366, "[:where(&).product-grid--loading]:[opacity:0.25] [:where(&).product-grid--loading]:pointer-events-none [:where(&).product-grid--loading]:[filter:blur(2px)] [:where(&).product-grid--loading]:[transition:opacity_0.25s_ease,_filter_0.25s_ease]"]),
  "product-grid-wrapper": utilities([365, "[:where(&).product-grid-wrapper]:relative [:where(&).product-grid-wrapper]:[min-height:320px] [:where(&).product-grid-wrapper]:[min-width:0] [:where(&).product-grid-wrapper]:overflow-hidden"]),
  "product-loading-overlay": utilities([367, "[:where(&).product-loading-overlay]:fixed [:where(&).product-loading-overlay]:[inset:0] [:where(&).product-loading-overlay]:[z-index:9999] [:where(&).product-loading-overlay]:flex [:where(&).product-loading-overlay]:items-center [:where(&).product-loading-overlay]:justify-center [:where(&).product-loading-overlay]:animate-[overlay-fadein_0.18s_ease] [:where(&).product-loading-overlay]:pointer-events-none"]),
  "product-spinner-backdrop": utilities([368, "[:where(&).product-spinner-backdrop]:fixed [:where(&).product-spinner-backdrop]:[inset:0] [:where(&).product-spinner-backdrop]:[background:rgba(7,_27,_50,_0.18)] [:where(&).product-spinner-backdrop]:[backdrop-filter:blur(2px)] [:where(&).product-spinner-backdrop]:[-webkit-backdrop-filter:blur(2px)]"]),
  "product-spinner-container": utilities([369, "[:where(&).product-spinner-container]:relative [:where(&).product-spinner-container]:[z-index:10000] [:where(&).product-spinner-container]:flex [:where(&).product-spinner-container]:flex-col [:where(&).product-spinner-container]:items-center [:where(&).product-spinner-container]:[gap:18px] [:where(&).product-spinner-container]:[padding:40px_56px] [:where(&).product-spinner-container]:[background:#ffffff] [:where(&).product-spinner-container]:[border-radius:24px] [:where(&).product-spinner-container]:[box-shadow:0_20px_60px_rgba(7,_27,_50,_0.22),_0_2px_8px_rgba(7,_27,_50,_0.10)] [:where(&).product-spinner-container]:[border:1px_solid_rgba(220,_230,_245,_0.9)]"]),
  "product-spinner-ring": utilities([370, "[:where(&).product-spinner-ring]:inline-block [:where(&).product-spinner-ring]:relative [:where(&).product-spinner-ring]:[width:52px] [:where(&).product-spinner-ring]:[height:52px]"], [371, "[:where(&).product-spinner-ring_div]:box-border [:where(&).product-spinner-ring_div]:block [:where(&).product-spinner-ring_div]:absolute [:where(&).product-spinner-ring_div]:[width:44px] [:where(&).product-spinner-ring_div]:[height:44px] [:where(&).product-spinner-ring_div]:[margin:4px] [:where(&).product-spinner-ring_div]:[border:4px_solid_transparent] [:where(&).product-spinner-ring_div]:[border-radius:50%] [:where(&).product-spinner-ring_div]:animate-[spinner-rotate_1s_cubic-bezier(0.5,_0,_0.5,_1)_infinite]"], [372, "[:where(&).product-spinner-ring_div:nth-child(1)]:[border-top-color:#ed1c24] [:where(&).product-spinner-ring_div:nth-child(1)]:[animation-delay:-0.30s]"], [373, "[:where(&).product-spinner-ring_div:nth-child(2)]:[border-top-color:#1b3f72] [:where(&).product-spinner-ring_div:nth-child(2)]:[animation-delay:-0.20s]"], [374, "[:where(&).product-spinner-ring_div:nth-child(3)]:[border-top-color:#ed1c24] [:where(&).product-spinner-ring_div:nth-child(3)]:[animation-delay:-0.10s] [:where(&).product-spinner-ring_div:nth-child(3)]:[opacity:0.55]"], [375, "[:where(&).product-spinner-ring_div:nth-child(4)]:[border-top-color:#1b3f72] [:where(&).product-spinner-ring_div:nth-child(4)]:[opacity:0.35]"]),
  "product-spinner-text": utilities([376, "[:where(&).product-spinner-text]:[font-size:13px] [:where(&).product-spinner-text]:font-semibold [:where(&).product-spinner-text]:[color:#2d3d57] [:where(&).product-spinner-text]:[letter-spacing:0.04em] [:where(&).product-spinner-text]:[margin:0] [:where(&).product-spinner-text]:animate-[text-pulse_1.4s_ease-in-out_infinite]"]),
  "quantity": utilities([443, "[:where(&).quantity]:flex [:where(&).quantity]:[height:35px] [:where(&).quantity]:[border:1px_solid_#cbd3df] [:where(&).quantity]:[border-radius:3px]"], [444, "[:where(&).quantity_button,_:where(&).quantity_span]:[border:0] [:where(&).quantity_button,_:where(&).quantity_span]:[width:30px] [:where(&).quantity_button,_:where(&).quantity_span]:grid [:where(&).quantity_button,_:where(&).quantity_span]:[place-items:center] [:where(&).quantity_button,_:where(&).quantity_span]:[background:#fff] [:where(&).quantity_button,_:where(&).quantity_span]:[font-size:11px]"], [2827, "[@media_(max-width:_720px)]:[.purchase-actions_:where(&).quantity]:[height:38px] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).quantity]:[flex-shrink:0]"]),
  "top": utilities([3663, "[.invoice-admin_:where(&).top]:flex [.invoice-admin_:where(&).top]:justify-between [.invoice-admin_:where(&).top]:items-start [.invoice-admin_:where(&).top]:[border-bottom:1px_solid_#a9c5ea] [.invoice-admin_:where(&).top]:[padding-bottom:16px]"]),
  "total": utilities([2531, "[.drawer-totals_p:where(&).total]:[background:#eaf3ff] [.drawer-totals_p:where(&).total]:[color:#075de2] [.drawer-totals_p:where(&).total]:[border-radius:5px] [.drawer-totals_p:where(&).total]:font-extrabold"]),
};
const tw = (value: string | undefined | null | false) => resolveClasses(value, componentUtilities);


export type AccessoryData = {
  id: string;
  name: string;
  slug: string;
  image: string;
  images?: string[];
  brand?: string;
  sku?: string;
  stock?: number;
  price: number;
  oldPrice?: number;
  description?: string;
  descriptionHtml?: string;
  descriptionCss?: string;
  keyFeatures?: string[];
  specifications?: Record<string, string> | Map<string, string>;
  faqs?: Array<{ question: string; answer: string; sortOrder?: number }>;
  linkedProductSlug?: string;
  category?: string;
  subcategory?: string;
  categories?: string[];
  subcategories?: string[];
  unitCost?: number;
  warehouse?: string;
  supplier?: string;
  variants?: Array<{ type: string; name: string; image: string; currentPrice: number; regularPrice: number; stock: number }>;
  preorderEnabled?: boolean;
  preorderNote?: string;
  preorderDepositPercent?: number;
};

export type AccessoryQueryResult = {
  products: AccessoryData[]; // using "products" to align with our listing layout
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

function priceFormat(value: number) { return `৳${value.toLocaleString("en-BD")}`; }

export function AccessoryCard({ accessory, basePath = "/accessories" }: { accessory: AccessoryData, basePath?: string }) {
  const [added, setAdded] = useTimedFeedback(false, 1300);
  const router = useRouter();

  const toSlug = (s: string) => s.replace(/\s+/g, '-');
  
  // Guarantee a 3-segment URL so that [[...slug]]/page.tsx knows it's a detail page!
  const catParam = accessory.category ? encodeURIComponent(toSlug(accessory.category)) : "All";
  const subParam = accessory.subcategory ? encodeURIComponent(toSlug(accessory.subcategory)) : "All";
  
  // Base path will always be overridden to ensure absolute structure for accessories
  const detailsHref = `/accessories/${catParam}/${subParam}/${accessory.slug}`;

  async function addToCart() {
    if (typeof window === "undefined") return;
    if (getApiBase()) {
      try {
        await apiRequest("/cart/items", { method: "POST", body: JSON.stringify({ slug: accessory.slug, quantity: 1, isAccessory: true }) });
        window.dispatchEvent(new Event("drone-cart-updated"));
        return;
      } catch (e) {
        console.warn("API addToCart failed, falling back to local storage", e);
      }
    }
    
    const cartKey = "drone-bangladesh-cart";
      const cart = JSON.parse(window.localStorage.getItem(cartKey) || "[]");
      const existing = cart.find((item: any) => item.slug === accessory.slug);
      if (existing) existing.quantity += 1;
      else cart.push({ ...accessory, quantity: 1, isAccessory: true });
      window.localStorage.setItem(cartKey, JSON.stringify(cart));
      window.dispatchEvent(new Event("drone-cart-updated"));
    setAdded(true);
    router.push("/checkout");
  }

  return (
    <article className={utilities("accessory-store-card", [2865, "[:where(&).accessory-store-card]:[border:1px_solid_var(--line)] [:where(&).accessory-store-card]:[border-radius:8px] [:where(&).accessory-store-card]:[background:#fff] [:where(&).accessory-store-card]:overflow-hidden [:where(&).accessory-store-card]:flex [:where(&).accessory-store-card]:flex-col [:where(&).accessory-store-card]:[transition:box-shadow_0.2s,_border-color_0.2s]"], [2866, "[:where(&).accessory-store-card>div]:[min-width:0]"], [2867, "[:where(&).accessory-store-card:hover]:[border-color:#d0d7e5] [:where(&).accessory-store-card:hover]:[box-shadow:0_8px_24px_rgba(16,_46,_89,_0.06)]"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:grid [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[grid-template-rows:1fr_auto]"])} >
      <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex-col"])}>
        <Link href={detailsHref} className={utilities("accessory-store-image", [2868, "[:where(&).accessory-store-image]:[background:#fbfcfe] [:where(&).accessory-store-image]:[height:190px] [:where(&).accessory-store-image]:block [:where(&).accessory-store-image]:[border-bottom:1px_solid_var(--line)] [:where(&).accessory-store-image]:overflow-hidden"], [2905, "[@media_(max-width:_768px)]:[:where(&).accessory-store-image]:[height:140px]"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:block [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[aspect-ratio:1/1] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:relative [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[background-color:#f8fafc] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-radius:8px_8px_0_0] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:overflow-hidden"])} >
          <Image
            src={accessory.image || "/images/products/mini-5.jpg"}
            alt={accessory.name}
            fill
            
            sizes="(max-width: 640px) 90vw, (max-width: 1100px) 40vw, 280px"
            quality={72}
            className={utilities("accessory-img", [2869, "[:where(&).accessory-img]:[width:100%] [:where(&).accessory-img]:[height:100%] [:where(&).accessory-img]:object-cover [:where(&).accessory-img]:[object-position:center] [:where(&).accessory-img]:[mix-blend-mode:multiply] [:where(&).accessory-img]:block"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:object-contain [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[padding:16px]"])}
            unoptimized={accessory.image?.startsWith("data:")}
          />
        </Link>
        <div className={utilities("accessory-store-info", [2870, "[:where(&).accessory-store-info]:[padding:16px] [:where(&).accessory-store-info]:flex [:where(&).accessory-store-info]:flex-col [:where(&).accessory-store-info]:[flex-grow:1]"], [2871, "[:where(&).accessory-store-info_h3]:[font-size:15px] [:where(&).accessory-store-info_h3]:font-semibold [:where(&).accessory-store-info_h3]:[color:var(--text)] [:where(&).accessory-store-info_h3]:[margin:0_0_6px] [:where(&).accessory-store-info_h3]:[line-height:1.3]"], [2906, "[@media_(max-width:_768px)]:[:where(&).accessory-store-info]:[padding:10px]"], [2907, "[@media_(max-width:_768px)]:[:where(&).accessory-store-info_h3]:[font-size:13px] [@media_(max-width:_768px)]:[:where(&).accessory-store-info_h3]:[margin-bottom:4px] [@media_(max-width:_768px)]:[:where(&).accessory-store-info_h3]:[display:-webkit-box] [@media_(max-width:_768px)]:[:where(&).accessory-store-info_h3]:[-webkit-line-clamp:2] [@media_(max-width:_768px)]:[:where(&).accessory-store-info_h3]:[-webkit-box-orient:vertical] [@media_(max-width:_768px)]:[:where(&).accessory-store-info_h3]:overflow-hidden"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[flex-grow:1] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex-col"])} >
          <Link href={detailsHref} className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[text-decoration:none]"])}>
            <h3>{accessory.name}</h3>
          </Link>
          <p className={utilities("accessory-store-desc", [2872, "[:where(&).accessory-store-desc]:[font-size:13px] [:where(&).accessory-store-desc]:[color:var(--text-light)] [:where(&).accessory-store-desc]:[margin:0_0_12px] [:where(&).accessory-store-desc]:[line-height:1.4]"], [2908, "[@media_(max-width:_768px)]:[:where(&).accessory-store-desc]:[font-size:11px] [@media_(max-width:_768px)]:[:where(&).accessory-store-desc]:[margin-bottom:8px] [@media_(max-width:_768px)]:[:where(&).accessory-store-desc]:[display:-webkit-box] [@media_(max-width:_768px)]:[:where(&).accessory-store-desc]:[-webkit-line-clamp:2] [@media_(max-width:_768px)]:[:where(&).accessory-store-desc]:[-webkit-box-orient:vertical] [@media_(max-width:_768px)]:[:where(&).accessory-store-desc]:overflow-hidden"])}>{accessory.description || "Official accessory."}</p>
          <div className={utilities("price-row", [113, "[:where(&).price-row]:flex [:where(&).price-row]:[gap:7px] [:where(&).price-row]:items-baseline [:where(&).price-row]:flex-wrap"], [590, "[@media_(max-width:_720px)]:[:where(&).price-row]:[margin-top:2px]"], [2873, "[.accessory-store-card_:where(&).price-row]:flex [.accessory-store-card_:where(&).price-row]:items-center [.accessory-store-card_:where(&).price-row]:[gap:8px] [.accessory-store-card_:where(&).price-row]:[margin-bottom:14px]"], [2909, "[@media_(max-width:_768px)]:[.accessory-store-card_:where(&).price-row]:[margin-bottom:10px] [@media_(max-width:_768px)]:[.accessory-store-card_:where(&).price-row]:flex-wrap [@media_(max-width:_768px)]:[.accessory-store-card_:where(&).price-row]:[gap:4px]"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-top:auto]"])} >
            <span className={utilities("price", [114, "[:where(&).price]:[color:var(--red)] [:where(&).price]:font-extrabold"], [610, "[:is(:where(&).price)]:[font-size:20px]"], [690, "[@media_(max-width:_720px)]:[:where(&).price]:[font-size:17px]"], [2874, "[.accessory-store-card_:where(&).price]:[font-size:17px] [.accessory-store-card_:where(&).price]:font-bold [.accessory-store-card_:where(&).price]:[color:var(--primary)]"], [2910, "[@media_(max-width:_768px)]:[.accessory-store-card_:where(&).price]:[font-size:15px]"])}>{priceFormat(accessory.price)}</span>
            {Number(accessory.oldPrice) > accessory.price && (
              <span className={utilities("old-price", [115, "[:where(&).old-price]:[color:#687384] [:where(&).old-price]:[text-decoration:line-through]"], [611, "[:is(:where(&).old-price)]:[font-size:12px]"], [2875, "[.accessory-store-card_:where(&).old-price]:[font-size:13px] [.accessory-store-card_:where(&).old-price]:[color:var(--text-light)] [.accessory-store-card_:where(&).old-price]:[text-decoration:line-through]"], [2911, "[@media_(max-width:_768px)]:[.accessory-store-card_:where(&).old-price]:[font-size:12px]"])}>{priceFormat(Number(accessory.oldPrice))}</span>
            )}
          </div>
        </div>
      </div>
      <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[padding:0_16px_16px]"])}>
        {(accessory.stock ?? 1) > 0 ? (
          <button
            className={utilities("button button-primary", [62, "[:where(&).button]:[min-height:39px] [:where(&).button]:inline-flex [:where(&).button]:items-center [:where(&).button]:justify-center [:where(&).button]:[gap:7px] [:where(&).button]:[border-radius:4px] [:where(&).button]:[padding:0_17px] [:where(&).button]:font-bold [:where(&).button]:cursor-pointer [:where(&).button]:[border:1px_solid_transparent]"], [63, "[:where(&).button-primary]:[background:var(--navy)] [:where(&).button-primary]:[color:#fff]"], [64, "[:where(&).button-primary:hover]:[background:#123d6b]"], [280, "[.cart-summary_:where(&).button]:[width:100%] [.cart-summary_:where(&).button]:[margin-top:12px]"], [286, "[.checkout-form>:where(&).button]:[width:max-content] [.checkout-form>:where(&).button]:[margin-top:6px]"], [492, "[.accessory-card_:where(&).button]:[width:100%] [.accessory-card_:where(&).button]:[margin-top:12px] [.accessory-card_:where(&).button]:[border-radius:6px] [.accessory-card_:where(&).button]:text-ellipsis [.accessory-card_:where(&).button]:overflow-hidden [.accessory-card_:where(&).button]:whitespace-nowrap"], [603, "[:is(:where(&).button)]:[font-size:14px]"], [654, "[:is(.accessory-card_:where(&).button)]:[font-size:10px] [:is(.accessory-card_:where(&).button)]:[padding:0_4px] [:is(.accessory-card_:where(&).button)]:[min-height:30px]"], [683, "[@media_(max-width:_720px)]:[:where(&).button,_:where(&).text-link]:[font-size:12px]"], [809, "[.package-card_footer_:where(&).button]:[font-size:11px] [.package-card_footer_:where(&).button]:[min-height:32px] [.package-card_footer_:where(&).button]:[padding:0_13px]"], [818, "[.maintenance-cta_:where(&).button]:[margin-right:15px]"], [837, "[@media_(max-width:_720px)]:[.maintenance-cta_:where(&).button]:[margin:0_0_12px]"], [1225, "[.combo-modal>footer_:where(&).button]:[min-height:36px]"], [1289, "[@media_(max-width:_720px)]:[.combo-modal>footer_:where(&).button]:[width:100%]"], [2383, "[@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:inline-block [@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:[margin-top:15px]"], [2479, "[.reference-toolbar_:where(&).button]:[height:34px] [.reference-toolbar_:where(&).button]:[padding:0_10px] [.reference-toolbar_:where(&).button]:[font-size:10px]"], [2491, "[.order-actions_:where(&).button]:[font-size:9px] [.order-actions_:where(&).button]:[padding:6px_14px]"], [2542, "[.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[height:34px] [.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[font-size:9px]"], [2579, "[.order-confirmation-actions_:where(&).button]:flex [.order-confirmation-actions_:where(&).button]:items-center [.order-confirmation-actions_:where(&).button]:justify-center [.order-confirmation-actions_:where(&).button]:[gap:7px] [.order-confirmation-actions_:where(&).button]:[min-height:43px] [.order-confirmation-actions_:where(&).button]:[text-decoration:none]"], [2587, "[.invoice-actions_:where(&).button]:flex [.invoice-actions_:where(&).button]:items-center [.invoice-actions_:where(&).button]:justify-center [.invoice-actions_:where(&).button]:[gap:6px]"], [2627, "[@media_(max-width:680px)]:[.invoice-actions_:where(&).button]:[flex:1_1_100%]"], [2653, "[.drawer-edit-actions_:where(&).button]:[height:31px] [.drawer-edit-actions_:where(&).button]:[padding:0_11px] [.drawer-edit-actions_:where(&).button]:[font-size:9px]"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[padding:10px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-radius:6px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[font-size:14px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[min-height:34px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:items-center [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:justify-center [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:box-border"])}
            
            onClick={() => void addToCart()}
            aria-label={`Buy Now: ${accessory.name}`}
          >
            Buy Now
          </button>
        ) : accessory.preorderEnabled !== false ? (
          <Link
            href={`${detailsHref}#preorder`}
            className={utilities("button button-red", [62, "[:where(&).button]:[min-height:39px] [:where(&).button]:inline-flex [:where(&).button]:items-center [:where(&).button]:justify-center [:where(&).button]:[gap:7px] [:where(&).button]:[border-radius:4px] [:where(&).button]:[padding:0_17px] [:where(&).button]:font-bold [:where(&).button]:cursor-pointer [:where(&).button]:[border:1px_solid_transparent]"], [65, "[:where(&).button-red]:[background:var(--red)] [:where(&).button-red]:[color:#fff]"], [280, "[.cart-summary_:where(&).button]:[width:100%] [.cart-summary_:where(&).button]:[margin-top:12px]"], [286, "[.checkout-form>:where(&).button]:[width:max-content] [.checkout-form>:where(&).button]:[margin-top:6px]"], [446, "[.purchase-actions>:where(&).button-red]:[min-height:35px] [.purchase-actions>:where(&).button-red]:[flex:1]"], [447, "[.purchase-actions_:where(&).cart-action,_.purchase-actions_:where(&).button-red]:[font-size:16px]"], [492, "[.accessory-card_:where(&).button]:[width:100%] [.accessory-card_:where(&).button]:[margin-top:12px] [.accessory-card_:where(&).button]:[border-radius:6px] [.accessory-card_:where(&).button]:text-ellipsis [.accessory-card_:where(&).button]:overflow-hidden [.accessory-card_:where(&).button]:whitespace-nowrap"], [603, "[:is(:where(&).button)]:[font-size:14px]"], [654, "[:is(.accessory-card_:where(&).button)]:[font-size:10px] [:is(.accessory-card_:where(&).button)]:[padding:0_4px] [:is(.accessory-card_:where(&).button)]:[min-height:30px]"], [683, "[@media_(max-width:_720px)]:[:where(&).button,_:where(&).text-link]:[font-size:12px]"], [809, "[.package-card_footer_:where(&).button]:[font-size:11px] [.package-card_footer_:where(&).button]:[min-height:32px] [.package-card_footer_:where(&).button]:[padding:0_13px]"], [818, "[.maintenance-cta_:where(&).button]:[margin-right:15px]"], [837, "[@media_(max-width:_720px)]:[.maintenance-cta_:where(&).button]:[margin:0_0_12px]"], [1225, "[.combo-modal>footer_:where(&).button]:[min-height:36px]"], [1289, "[@media_(max-width:_720px)]:[.combo-modal>footer_:where(&).button]:[width:100%]"], [2189, "[.purchase-actions_:where(&).button-red]:[background:var(--red)]"], [2383, "[@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:inline-block [@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:[margin-top:15px]"], [2479, "[.reference-toolbar_:where(&).button]:[height:34px] [.reference-toolbar_:where(&).button]:[padding:0_10px] [.reference-toolbar_:where(&).button]:[font-size:10px]"], [2491, "[.order-actions_:where(&).button]:[font-size:9px] [.order-actions_:where(&).button]:[padding:6px_14px]"], [2542, "[.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[height:34px] [.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[font-size:9px]"], [2579, "[.order-confirmation-actions_:where(&).button]:flex [.order-confirmation-actions_:where(&).button]:items-center [.order-confirmation-actions_:where(&).button]:justify-center [.order-confirmation-actions_:where(&).button]:[gap:7px] [.order-confirmation-actions_:where(&).button]:[min-height:43px] [.order-confirmation-actions_:where(&).button]:[text-decoration:none]"], [2587, "[.invoice-actions_:where(&).button]:flex [.invoice-actions_:where(&).button]:items-center [.invoice-actions_:where(&).button]:justify-center [.invoice-actions_:where(&).button]:[gap:6px]"], [2627, "[@media_(max-width:680px)]:[.invoice-actions_:where(&).button]:[flex:1_1_100%]"], [2653, "[.drawer-edit-actions_:where(&).button]:[height:31px] [.drawer-edit-actions_:where(&).button]:[padding:0_11px] [.drawer-edit-actions_:where(&).button]:[font-size:9px]"], [2830, "[@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[flex:1] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[min-height:38px] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[font-size:14px] [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:font-bold [@media_(max-width:_720px)]:[.purchase-actions_:where(&).button-red]:[padding:0_4px]"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[padding:10px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-radius:6px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[font-size:14px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[min-height:34px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:items-center [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:justify-center [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[text-decoration:none] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:box-border"])}
            
            aria-label={`Pre-Order: ${accessory.name}`}
          >
            Pre-Order
          </Link>
        ) : (
          <span
            className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[padding:10px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-radius:6px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[font-size:14px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[min-height:34px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:items-center [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:justify-center [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[background:#f1f5f9] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[color:#94a3b8] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:font-semibold"])}
          >
            Out of Stock
          </span>
        )}
      </div>
    </article>
  );
}

/* ── Filter Panel for Accessories ── */
function AccessoryFilterPanel({
  query,
  onSearch,
  isLoading,
}: {
  query: Record<string, any>;
  onSearch: (q: Record<string, any>) => void;
  isLoading: boolean;
}) {
  const [q, setQ] = useState(query.q || "");
  const [minPrice, setMinPrice] = useState(query.minPrice !== undefined ? String(query.minPrice) : "");
  const [maxPrice, setMaxPrice] = useState(query.maxPrice !== undefined ? String(query.maxPrice) : "");
  const [sort, setSort] = useState(query.sort || "newest");

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    onSearch({
      q: q || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort: sort !== "newest" ? sort : undefined,
      page: 1,
    });
  }

  function clearFilters() {
    setQ(""); setMinPrice(""); setMaxPrice(""); setSort("newest");
    onSearch({ page: 1, q: undefined, minPrice: undefined, maxPrice: undefined, sort: undefined });
  }

  return (
    <aside className={utilities("filter-panel", [349, "[:where(&).filter-panel]:[border:1px_solid_var(--line)] [:where(&).filter-panel]:[border-radius:8px] [:where(&).filter-panel]:[height:max-content]"], [540, "[@media_(max-width:_720px)]:[:where(&).filter-panel]:hidden"], [1560, "[:where(&).filter-panel_form]:grid [:where(&).filter-panel_form]:[gap:12px]"], [1561, "[:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[width:100%] [:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[border:1px_solid_#dfe5ec] [:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[border-radius:7px] [:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[background:#fff] [:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[padding:10px_11px] [:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[color:#1f3048] [:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[font:inherit]"])}>
      <form onSubmit={applyFilters}>
        <div className={utilities("filter-title", [350, "[:where(&).filter-title]:flex [:where(&).filter-title]:items-center [:where(&).filter-title]:justify-between [:where(&).filter-title]:[padding:15px] [:where(&).filter-title]:[border-bottom:1px_solid_var(--line)]"], [626, "[:is(:where(&).filter-title)]:[font-size:14px]"])}><strong>Filter accessories</strong></div>
        <div className={utilities("filter-group", [351, "[:where(&).filter-group]:[padding:16px_15px] [:where(&).filter-group]:[border-bottom:1px_solid_var(--line)]"], [352, "[:where(&).filter-group>strong]:block [:where(&).filter-group>strong]:[margin-bottom:14px]"], [353, "[:where(&).filter-group_label]:flex [:where(&).filter-group_label]:items-center [:where(&).filter-group_label]:[gap:8px] [:where(&).filter-group_label]:[color:#6d7890] [:where(&).filter-group_label]:[margin:10px_0]"], [354, "[:where(&).filter-group_input]:[accent-color:var(--red)]"], [627, "[:is(:where(&).filter-group>strong)]:[font-size:13px]"], [628, "[:is(:where(&).filter-group_label)]:[font-size:12px]"])}>
          <strong>Search</strong>
          <input aria-label="Search accessories" value={q} onChange={e => setQ(e.target.value)} placeholder="Accessory name" />
        </div>
        <div className={utilities("filter-group", [351, "[:where(&).filter-group]:[padding:16px_15px] [:where(&).filter-group]:[border-bottom:1px_solid_var(--line)]"], [352, "[:where(&).filter-group>strong]:block [:where(&).filter-group>strong]:[margin-bottom:14px]"], [353, "[:where(&).filter-group_label]:flex [:where(&).filter-group_label]:items-center [:where(&).filter-group_label]:[gap:8px] [:where(&).filter-group_label]:[color:#6d7890] [:where(&).filter-group_label]:[margin:10px_0]"], [354, "[:where(&).filter-group_input]:[accent-color:var(--red)]"], [627, "[:is(:where(&).filter-group>strong)]:[font-size:13px]"], [628, "[:is(:where(&).filter-group_label)]:[font-size:12px]"])}>
          <strong>Price range (৳)</strong>
          <div className={utilities("price-range-row", [1562, "[:where(&).price-range-row]:flex [:where(&).price-range-row]:items-center [:where(&).price-range-row]:[gap:8px]"], [1563, "[:where(&).price-range-row_input]:[flex:1] [:where(&).price-range-row_input]:[width:0]"])}>
            <input aria-label="Minimum price in taka" type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min" />
            <span className={utilities("price-range-dash", [1564, "[:where(&).price-range-dash]:[color:#8a9bb0] [:where(&).price-range-dash]:[font-size:16px] [:where(&).price-range-dash]:[flex-shrink:0]"])}>–</span>
            <input aria-label="Maximum price in taka" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max" />
          </div>
        </div>
        <div className={utilities("filter-group", [351, "[:where(&).filter-group]:[padding:16px_15px] [:where(&).filter-group]:[border-bottom:1px_solid_var(--line)]"], [352, "[:where(&).filter-group>strong]:block [:where(&).filter-group>strong]:[margin-bottom:14px]"], [353, "[:where(&).filter-group_label]:flex [:where(&).filter-group_label]:items-center [:where(&).filter-group_label]:[gap:8px] [:where(&).filter-group_label]:[color:#6d7890] [:where(&).filter-group_label]:[margin:10px_0]"], [354, "[:where(&).filter-group_input]:[accent-color:var(--red)]"], [627, "[:is(:where(&).filter-group>strong)]:[font-size:13px]"], [628, "[:is(:where(&).filter-group_label)]:[font-size:12px]"])}>
          <strong>Sort</strong>
          <select aria-label="Sort order" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
        <button className={utilities("button button-primary filter-apply-btn", [62, "[:where(&).button]:[min-height:39px] [:where(&).button]:inline-flex [:where(&).button]:items-center [:where(&).button]:justify-center [:where(&).button]:[gap:7px] [:where(&).button]:[border-radius:4px] [:where(&).button]:[padding:0_17px] [:where(&).button]:font-bold [:where(&).button]:cursor-pointer [:where(&).button]:[border:1px_solid_transparent]"], [63, "[:where(&).button-primary]:[background:var(--navy)] [:where(&).button-primary]:[color:#fff]"], [64, "[:where(&).button-primary:hover]:[background:#123d6b]"], [280, "[.cart-summary_:where(&).button]:[width:100%] [.cart-summary_:where(&).button]:[margin-top:12px]"], [286, "[.checkout-form>:where(&).button]:[width:max-content] [.checkout-form>:where(&).button]:[margin-top:6px]"], [361, "[:where(&).filter-apply-btn]:[margin:15px] [:where(&).filter-apply-btn]:[width:calc(100%_-_30px)] [:where(&).filter-apply-btn]:[font-size:12px] [:where(&).filter-apply-btn]:font-semibold [:where(&).filter-apply-btn]:[letter-spacing:0.02em] [:where(&).filter-apply-btn]:[transition:background_0.2s,_opacity_0.2s,_transform_0.15s]"], [362, "[:where(&).filter-apply-btn:disabled]:[opacity:0.85] [:where(&).filter-apply-btn:disabled]:[cursor:wait] [:where(&).filter-apply-btn:disabled]:[transform:none]"], [492, "[.accessory-card_:where(&).button]:[width:100%] [.accessory-card_:where(&).button]:[margin-top:12px] [.accessory-card_:where(&).button]:[border-radius:6px] [.accessory-card_:where(&).button]:text-ellipsis [.accessory-card_:where(&).button]:overflow-hidden [.accessory-card_:where(&).button]:whitespace-nowrap"], [603, "[:is(:where(&).button)]:[font-size:14px]"], [654, "[:is(.accessory-card_:where(&).button)]:[font-size:10px] [:is(.accessory-card_:where(&).button)]:[padding:0_4px] [:is(.accessory-card_:where(&).button)]:[min-height:30px]"], [683, "[@media_(max-width:_720px)]:[:where(&).button,_:where(&).text-link]:[font-size:12px]"], [809, "[.package-card_footer_:where(&).button]:[font-size:11px] [.package-card_footer_:where(&).button]:[min-height:32px] [.package-card_footer_:where(&).button]:[padding:0_13px]"], [818, "[.maintenance-cta_:where(&).button]:[margin-right:15px]"], [837, "[@media_(max-width:_720px)]:[.maintenance-cta_:where(&).button]:[margin:0_0_12px]"], [1225, "[.combo-modal>footer_:where(&).button]:[min-height:36px]"], [1289, "[@media_(max-width:_720px)]:[.combo-modal>footer_:where(&).button]:[width:100%]"], [1565, "[:is(:where(&).filter-apply-btn)]:flex [:is(:where(&).filter-apply-btn)]:items-center [:is(:where(&).filter-apply-btn)]:justify-center [:is(:where(&).filter-apply-btn)]:[gap:8px]"], [2383, "[@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:inline-block [@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:[margin-top:15px]"], [2479, "[.reference-toolbar_:where(&).button]:[height:34px] [.reference-toolbar_:where(&).button]:[padding:0_10px] [.reference-toolbar_:where(&).button]:[font-size:10px]"], [2491, "[.order-actions_:where(&).button]:[font-size:9px] [.order-actions_:where(&).button]:[padding:6px_14px]"], [2542, "[.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[height:34px] [.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[font-size:9px]"], [2579, "[.order-confirmation-actions_:where(&).button]:flex [.order-confirmation-actions_:where(&).button]:items-center [.order-confirmation-actions_:where(&).button]:justify-center [.order-confirmation-actions_:where(&).button]:[gap:7px] [.order-confirmation-actions_:where(&).button]:[min-height:43px] [.order-confirmation-actions_:where(&).button]:[text-decoration:none]"], [2587, "[.invoice-actions_:where(&).button]:flex [.invoice-actions_:where(&).button]:items-center [.invoice-actions_:where(&).button]:justify-center [.invoice-actions_:where(&).button]:[gap:6px]"], [2627, "[@media_(max-width:680px)]:[.invoice-actions_:where(&).button]:[flex:1_1_100%]"], [2653, "[.drawer-edit-actions_:where(&).button]:[height:31px] [.drawer-edit-actions_:where(&).button]:[padding:0_11px] [.drawer-edit-actions_:where(&).button]:[font-size:9px]"])} type="submit" disabled={isLoading}>
          {isLoading
            ? (<><span className={utilities("filter-btn-spinner", [363, "[:where(&).filter-btn-spinner]:inline-block [:where(&).filter-btn-spinner]:[width:13px] [:where(&).filter-btn-spinner]:[height:13px] [:where(&).filter-btn-spinner]:[border:2px_solid_rgba(255,_255,_255,_0.35)]"], [364, "[:is(:where(&).filter-btn-spinner)]:[border-top-color:#fff] [:is(:where(&).filter-btn-spinner)]:[border-radius:50%] [:is(:where(&).filter-btn-spinner)]:animate-[spinner-rotate_0.7s_linear_infinite] [:is(:where(&).filter-btn-spinner)]:[flex-shrink:0]"])} aria-hidden="true" /><span>Searching…</span></>)
            : <span>Apply filters</span>
          }
        </button>
        <button type="button" className={utilities("clear-filter", [360, "[:where(&).clear-filter]:[margin:15px] [:where(&).clear-filter]:[width:calc(100%_-_30px)] [:where(&).clear-filter]:[height:31px] [:where(&).clear-filter]:[border:1px_solid_#bdc8d7] [:where(&).clear-filter]:[background:#fff] [:where(&).clear-filter]:[color:var(--ink)] [:where(&).clear-filter]:[border-radius:3px] [:where(&).clear-filter]:flex [:where(&).clear-filter]:items-center [:where(&).clear-filter]:justify-center [:where(&).clear-filter]:[gap:6px] [:where(&).clear-filter]:cursor-pointer"], [630, "[:is(:where(&).clear-filter)]:[font-size:12px]"])} onClick={clearFilters}>Clear filters</button>
      </form>
    </aside>
  );
}

/* ── AccessoryListing Export ── */
export function AccessoryListing({
  title = "Official Accessories",
  description = "Find genuine batteries, propellers, bags, and parts for your equipment.",
  bannerImage,
  searchParams = {},
  result: initialResult,
}: {
  title?: string;
  description?: string;
  bannerImage?: string;
  searchParams?: Record<string, string | string[] | undefined>;
  result: AccessoryQueryResult;
}) {
  const one = (key: string) => Array.isArray(searchParams[key]) ? searchParams[key]?.[0] : searchParams[key];

  const initQuery = {
    q: one("q"),
    sort: one("sort"),
    minPrice: one("minPrice") ? Number(one("minPrice")) : undefined,
    maxPrice: one("maxPrice") ? Number(one("maxPrice")) : undefined,
    page: Math.max(1, Number(one("page")) || 1),
    limit: 25,
  };

  const [result, setResult] = useState<AccessoryQueryResult>(initialResult);
  const [activeQuery, setActiveQuery] = useState<Record<string, any>>(initQuery);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const searchKeyRef = useRef("");

  useEffect(() => () => abortRef.current?.abort(), []);

  const fetchAccessories = useCallback(async (query: Record<string, any>) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    flushSync(() => {
      setIsLoading(true);
      setResult(prev => ({ ...prev, products: [] }));
    });

    if (ctrl.signal.aborted) return;

    try {
      const qs = new URLSearchParams();
      if (query.q) qs.set("q", query.q);
      if (query.sort && query.sort !== "newest") qs.set("sort", query.sort);
      if (query.minPrice) qs.set("minPrice", String(query.minPrice));
      if (query.maxPrice) qs.set("maxPrice", String(query.maxPrice));
      if ((query.page || 1) > 1) qs.set("page", String(query.page));
      qs.set("limit", "25");
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || getApiBase() || "/api/v1"}/accessories?${qs.toString()}`, { signal: ctrl.signal });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      
      if (!ctrl.signal.aborted) {
        setResult({ products: data.data || [], meta: data.meta });
        setActiveQuery(query);
        const newUrl = `/accessories${qs.toString() ? `?${qs.toString()}` : ""}`;
        window.history.replaceState(null, "", newUrl);
      }
    } catch {
      // ignore
    } finally {
      if (!ctrl.signal.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const key = [initQuery.q, initQuery.page, initQuery.sort, initQuery.minPrice, initQuery.maxPrice].join("|");
    if (key !== searchKeyRef.current) {
      searchKeyRef.current = key;
      setResult(initialResult);
      setActiveQuery(initQuery);
      setIsLoading(false);
    }
  }, [initialResult]);

  function handleSearch(overrides: Record<string, any>) {
    const next = { ...activeQuery, ...overrides, limit: 25 };
    void fetchAccessories(next);
  }

  function handlePage(page: number) {
    void fetchAccessories({ ...activeQuery, page, limit: 25 });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main>
      <section
        
        {...withTailwindStyle(tw(`catalog-hero${bannerImage ? " catalog-hero--has-image" : ""}`), bannerImage ? { backgroundImage: `url(${bannerImage})` } : undefined)}
      >
        <div className={utilities("page-container", [15, "[:where(&).page-container]:[width:min(1240px,_calc(100%_-_24px))] [:where(&).page-container]:[margin-inline:auto]"], [16, "[@media_(min-width:_768px)]:[:where(&).page-container]:[width:min(1240px,_calc(100%_-_48px))]"], [333, "[.catalog-hero_:where(&).page-container]:relative [.catalog-hero_:where(&).page-container]:[z-index:1]"], [501, "[@media_(max-width:_720px)]:[:where(&).page-container]:[width:min(100%_-_28px,_620px)]"])}>
          <p className={utilities("catalog-breadcrumb", [337, "[:where(&).catalog-breadcrumb]:flex [:where(&).catalog-breadcrumb]:items-center [:where(&).catalog-breadcrumb]:flex-wrap [:where(&).catalog-breadcrumb]:[gap:2px] [:where(&).catalog-breadcrumb]:[font-size:11px] [:where(&).catalog-breadcrumb]:[color:#b7c8dc] [:where(&).catalog-breadcrumb]:[margin:0_0_20px] [:where(&).catalog-breadcrumb]:[letter-spacing:0.03em]"], [338, "[:where(&).catalog-breadcrumb_a]:[color:#b7c8dc] [:where(&).catalog-breadcrumb_a]:[text-decoration:none] [:where(&).catalog-breadcrumb_a]:[transition:color_0.15s]"], [339, "[:where(&).catalog-breadcrumb_a:hover]:[color:#fff] [:where(&).catalog-breadcrumb_a:hover]:[text-decoration:underline]"], [340, "[:where(&).catalog-breadcrumb_span]:[color:#7a9abc]"], [341, "[:where(&).catalog-breadcrumb>span:last-child]:[color:#fff] [:where(&).catalog-breadcrumb>span:last-child]:font-semibold"])}>
            <Link href="/">Home</Link>
            <span> / </span>
            <Link href="/accessories">Accessories</Link>
          </p>
          <h1>{title}</h1>
          <span>{description}</span>
        </div>
      </section>
      
      <div className={utilities("page-container listing-layout", [15, "[:where(&).page-container]:[width:min(1240px,_calc(100%_-_24px))] [:where(&).page-container]:[margin-inline:auto]"], [16, "[@media_(min-width:_768px)]:[:where(&).page-container]:[width:min(1240px,_calc(100%_-_48px))]"], [333, "[.catalog-hero_:where(&).page-container]:relative [.catalog-hero_:where(&).page-container]:[z-index:1]"], [347, "[:where(&).listing-layout]:grid [:where(&).listing-layout]:[grid-template-columns:218px_1fr] [:where(&).listing-layout]:[gap:27px] [:where(&).listing-layout]:[padding-top:24px]"], [501, "[@media_(max-width:_720px)]:[:where(&).page-container]:[width:min(100%_-_28px,_620px)]"], [539, "[@media_(max-width:_720px)]:[:where(&).listing-layout]:[grid-template-columns:1fr] [@media_(max-width:_720px)]:[:where(&).listing-layout]:[gap:16px]"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-top:24px]"])} >
        <AccessoryFilterPanel query={activeQuery} onSearch={handleSearch} isLoading={isLoading} />
        <section className={utilities("listing-results", [348, "[:where(&).listing-results]:[min-width:0]"])}>
          <div className={utilities("listing-toolbar", [377, "[:where(&).listing-toolbar]:flex [:where(&).listing-toolbar]:justify-between [:where(&).listing-toolbar]:items-center [:where(&).listing-toolbar]:[color:#6a758a] [:where(&).listing-toolbar]:[margin-bottom:14px]"], [378, "[:where(&).listing-toolbar_label]:flex [:where(&).listing-toolbar_label]:items-center [:where(&).listing-toolbar_label]:[gap:8px]"], [379, "[:where(&).listing-toolbar_select]:[border:1px_solid_#d9e0e8] [:where(&).listing-toolbar_select]:[border-radius:4px] [:where(&).listing-toolbar_select]:[padding:7px_26px_7px_10px] [:where(&).listing-toolbar_select]:[color:var(--ink)] [:where(&).listing-toolbar_select]:[background:#fff]"], [380, "[:where(&).listing-toolbar_label_svg]:[margin-left:-24px] [:where(&).listing-toolbar_label_svg]:pointer-events-none"], [541, "[@media_(max-width:_720px)]:[:where(&).listing-toolbar]:[margin-top:3px]"], [631, "[:is(:where(&).listing-toolbar)]:[font-size:13px]"], [632, "[:is(:where(&).listing-toolbar_select)]:[font-size:12px]"])}>
            <span>{result.meta?.total || 0} result{result.meta?.total === 1 ? "" : "s"}</span>
          </div>
          <div className={utilities("product-grid-wrapper", [365, "[:where(&).product-grid-wrapper]:relative [:where(&).product-grid-wrapper]:[min-height:320px] [:where(&).product-grid-wrapper]:[min-width:0] [:where(&).product-grid-wrapper]:overflow-hidden"])}>
            {isLoading && (
              <div className={utilities("product-loading-overlay", [367, "[:where(&).product-loading-overlay]:fixed [:where(&).product-loading-overlay]:[inset:0] [:where(&).product-loading-overlay]:[z-index:9999] [:where(&).product-loading-overlay]:flex [:where(&).product-loading-overlay]:items-center [:where(&).product-loading-overlay]:justify-center [:where(&).product-loading-overlay]:animate-[overlay-fadein_0.18s_ease] [:where(&).product-loading-overlay]:pointer-events-none"])} aria-live="polite" aria-label="Loading accessories">
                <div className={utilities("product-spinner-backdrop", [368, "[:where(&).product-spinner-backdrop]:fixed [:where(&).product-spinner-backdrop]:[inset:0] [:where(&).product-spinner-backdrop]:[background:rgba(7,_27,_50,_0.18)] [:where(&).product-spinner-backdrop]:[backdrop-filter:blur(2px)] [:where(&).product-spinner-backdrop]:[-webkit-backdrop-filter:blur(2px)]"])} />
                <div className={utilities("product-spinner-container", [369, "[:where(&).product-spinner-container]:relative [:where(&).product-spinner-container]:[z-index:10000] [:where(&).product-spinner-container]:flex [:where(&).product-spinner-container]:flex-col [:where(&).product-spinner-container]:items-center [:where(&).product-spinner-container]:[gap:18px] [:where(&).product-spinner-container]:[padding:40px_56px] [:where(&).product-spinner-container]:[background:#ffffff] [:where(&).product-spinner-container]:[border-radius:24px] [:where(&).product-spinner-container]:[box-shadow:0_20px_60px_rgba(7,_27,_50,_0.22),_0_2px_8px_rgba(7,_27,_50,_0.10)] [:where(&).product-spinner-container]:[border:1px_solid_rgba(220,_230,_245,_0.9)]"])}>
                  <div className={utilities("product-spinner-ring", [370, "[:where(&).product-spinner-ring]:inline-block [:where(&).product-spinner-ring]:relative [:where(&).product-spinner-ring]:[width:52px] [:where(&).product-spinner-ring]:[height:52px]"], [371, "[:where(&).product-spinner-ring_div]:box-border [:where(&).product-spinner-ring_div]:block [:where(&).product-spinner-ring_div]:absolute [:where(&).product-spinner-ring_div]:[width:44px] [:where(&).product-spinner-ring_div]:[height:44px] [:where(&).product-spinner-ring_div]:[margin:4px] [:where(&).product-spinner-ring_div]:[border:4px_solid_transparent] [:where(&).product-spinner-ring_div]:[border-radius:50%] [:where(&).product-spinner-ring_div]:animate-[spinner-rotate_1s_cubic-bezier(0.5,_0,_0.5,_1)_infinite]"], [372, "[:where(&).product-spinner-ring_div:nth-child(1)]:[border-top-color:#ed1c24] [:where(&).product-spinner-ring_div:nth-child(1)]:[animation-delay:-0.30s]"], [373, "[:where(&).product-spinner-ring_div:nth-child(2)]:[border-top-color:#1b3f72] [:where(&).product-spinner-ring_div:nth-child(2)]:[animation-delay:-0.20s]"], [374, "[:where(&).product-spinner-ring_div:nth-child(3)]:[border-top-color:#ed1c24] [:where(&).product-spinner-ring_div:nth-child(3)]:[animation-delay:-0.10s] [:where(&).product-spinner-ring_div:nth-child(3)]:[opacity:0.55]"], [375, "[:where(&).product-spinner-ring_div:nth-child(4)]:[border-top-color:#1b3f72] [:where(&).product-spinner-ring_div:nth-child(4)]:[opacity:0.35]"])}>
                    <div /><div /><div /><div />
                  </div>
                  <p className={utilities("product-spinner-text", [376, "[:where(&).product-spinner-text]:[font-size:13px] [:where(&).product-spinner-text]:font-semibold [:where(&).product-spinner-text]:[color:#2d3d57] [:where(&).product-spinner-text]:[letter-spacing:0.04em] [:where(&).product-spinner-text]:[margin:0] [:where(&).product-spinner-text]:animate-[text-pulse_1.4s_ease-in-out_infinite]"])}>Loading accessories…</p>
                </div>
              </div>
            )}
            {result.products?.length
              ? <div className={tw(`acc-grid${isLoading ? " product-grid--loading" : ""}`)}>{result.products.map(acc => <AccessoryCard accessory={acc} key={acc.slug || acc.id} />)}</div>
              : !isLoading && <div className={utilities("empty-state", [281, "[:where(&).empty-state]:text-center [:where(&).empty-state]:[border:1px_dashed_#cfd8e4] [:where(&).empty-state]:[border-radius:8px] [:where(&).empty-state]:[padding:65px_20px] [:where(&).empty-state]:[margin-top:28px]"], [283, "[:where(&).empty-state_h2]:[font-size:20px] [:where(&).empty-state_h2]:[margin:10px_0_7px]"], [284, "[:where(&).empty-state_p]:[color:#626e83] [:where(&).empty-state_p]:[font-size:11px] [:where(&).empty-state_p]:[margin:0_0_20px]"])}><h2>No accessories found</h2><p>Try a different search or filter.</p></div>
            }
          </div>
          {result.meta && result.meta.pages > 1 && (
            <nav className={utilities("pagination-nav", [382, "[:where(&).pagination-nav]:flex [:where(&).pagination-nav]:flex-col [:where(&).pagination-nav]:items-center [:where(&).pagination-nav]:[gap:14px] [:where(&).pagination-nav]:[margin:36px_0_12px]"])} aria-label="Page navigation">
              <div className={utilities("pagination-info", [383, "[:where(&).pagination-info]:[font-size:13px] [:where(&).pagination-info]:[color:#8a9bb0] [:where(&).pagination-info]:font-medium"])}>Page {result.meta.page} of {result.meta.pages} &mdash; {result.meta.total} results</div>
              <div className={utilities("pagination", [384, "[:where(&).pagination]:flex [:where(&).pagination]:items-center [:where(&).pagination]:justify-center [:where(&).pagination]:[gap:6px]"])}>
                {result.meta.page > 1 && (
                  <button type="button" className={utilities("pagination-arrow", [388, "[:where(&).pagination-arrow]:inline-flex [:where(&).pagination-arrow]:items-center [:where(&).pagination-arrow]:justify-center [:where(&).pagination-arrow]:[width:40px] [:where(&).pagination-arrow]:[height:40px] [:where(&).pagination-arrow]:[background:#fff] [:where(&).pagination-arrow]:[border:1.5px_solid_#dde3ed] [:where(&).pagination-arrow]:[border-radius:10px] [:where(&).pagination-arrow]:[color:#3a4a6b] [:where(&).pagination-arrow]:[text-decoration:none] [:where(&).pagination-arrow]:[transition:border-color_.15s,_background_.15s,_color_.15s]"], [389, "[:where(&).pagination-arrow:hover]:[border-color:#071b32] [:where(&).pagination-arrow:hover]:[background:#071b32] [:where(&).pagination-arrow:hover]:[color:#fff]"])} onClick={() => handlePage(result.meta.page - 1)} aria-label="Previous page">
                    <ChevronLeft size={16}/>
                  </button>
                )}
                {(() => {
                  const total = result.meta.pages;
                  const cur = result.meta.page;
                  const pages: (number | "…")[] = [];
                  if (total <= 7) {
                    for (let i = 1; i <= total; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (cur > 3) pages.push("…");
                    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
                    if (cur < total - 2) pages.push("…");
                    pages.push(total);
                  }
                  return pages.map((p, i) => p === "…"
                    ? <span key={`e${i}`} className={utilities("pagination-ellipsis", [390, "[:where(&).pagination-ellipsis]:inline-flex [:where(&).pagination-ellipsis]:items-center [:where(&).pagination-ellipsis]:justify-center [:where(&).pagination-ellipsis]:[width:36px] [:where(&).pagination-ellipsis]:[height:40px] [:where(&).pagination-ellipsis]:[color:#8a9bb0] [:where(&).pagination-ellipsis]:[font-size:16px] [:where(&).pagination-ellipsis]:font-bold [:where(&).pagination-ellipsis]:pointer-events-none"])}>…</span>
                    : <button key={p} type="button" className={tw(p === cur ? "pagination-page active" : "pagination-page")} onClick={() => handlePage(p as number)}>{p}</button>
                  );
                })()}
                {result.meta.page < result.meta.pages && (
                  <button type="button" className={utilities("pagination-arrow", [388, "[:where(&).pagination-arrow]:inline-flex [:where(&).pagination-arrow]:items-center [:where(&).pagination-arrow]:justify-center [:where(&).pagination-arrow]:[width:40px] [:where(&).pagination-arrow]:[height:40px] [:where(&).pagination-arrow]:[background:#fff] [:where(&).pagination-arrow]:[border:1.5px_solid_#dde3ed] [:where(&).pagination-arrow]:[border-radius:10px] [:where(&).pagination-arrow]:[color:#3a4a6b] [:where(&).pagination-arrow]:[text-decoration:none] [:where(&).pagination-arrow]:[transition:border-color_.15s,_background_.15s,_color_.15s]"], [389, "[:where(&).pagination-arrow:hover]:[border-color:#071b32] [:where(&).pagination-arrow:hover]:[background:#071b32] [:where(&).pagination-arrow:hover]:[color:#fff]"])} onClick={() => handlePage(result.meta.page + 1)} aria-label="Next page">
                    <ChevronRight size={16}/>
                  </button>
                )}
              </div>
            </nav>
          )}
        </section>
      </div>
    </main>
  );
}
