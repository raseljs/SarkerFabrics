"use client";

import { withTailwindStyle, utilities, resolveClasses } from "@/lib/tailwind";
import { useEffect, useState, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import Link from "next/link";
import { ProductCard } from "@/components/storefront";
import { AccessoryCard } from "@/components/accessories-storefront";
import { queryProducts, type ProductQuery, type ProductQueryResult } from "@/lib/catalog";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Component styling is compiled from these local Tailwind utilities.
const componentUtilities: Record<string, string> = {
  "active": utilities([74, "[.hero-dots_:where(&).active]:[background:#173e89]"], [299, "[.admin-sidebar_a:where(&).active,_:where(&).admin-sidebar_a:hover]:[color:var(--ink)] [.admin-sidebar_a:where(&).active,_:where(&).admin-sidebar_a:hover]:[background:#eef4ff]"], [459, "[.detail-tabs_button:where(&).active]:[background:var(--red)] [.detail-tabs_button:where(&).active]:[color:#fff]"], [466, "[.content-tabs_:where(&).active]:[color:var(--red)] [.content-tabs_:where(&).active]:font-extrabold [.content-tabs_:where(&).active]:[border-top:2px_solid_var(--red)]"], [728, "[:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[background:#f1f4f8] [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[color:var(--ink)] [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:font-bold [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[border-left:3px_solid_#73b2cd] [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[padding-left:16px]"], [741, "[.nav-bar>a:where(&).active,_.nav-bar_:where(&).maintenance-link.active]:[color:var(--red)]"], [742, "[.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[content:''] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:absolute [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[left:0] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[right:0] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[bottom:0] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[height:2px] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[background:var(--red)]"], [774, "[.article-pagination_button:where(&).active]:[border-color:var(--red)] [.article-pagination_button:where(&).active]:[background:var(--red)] [.article-pagination_button:where(&).active]:[color:#fff]"], [843, "[.mega-mode-tabs_button:where(&).active]:[color:#1266cf] [.mega-mode-tabs_button:where(&).active]:[border-bottom-color:#1266cf]"], [932, "[.rich-editor-tabs_button:where(&).active]:[color:#155fc5] [.rich-editor-tabs_button:where(&).active]:[border-bottom-color:#155fc5]"], [992, "[.rde-toggle-row_button:where(&).active]:[background:#eef4ff] [.rde-toggle-row_button:where(&).active]:[border-color:#3f70ce] [.rde-toggle-row_button:where(&).active]:[color:#155fc5]"], [1071, "[:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[border-left-color:#72b6d2] [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[background:#f0f3f7] [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[color:#102952] [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:font-bold [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[outline:0]"], [1120, "[@media_(max-width:_720px)]:[:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[padding-left:5px]"], [1143, "[@media_(max-width:_720px)]:[:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[border-color:#72b6d2] [@media_(max-width:_720px)]:[:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[background:#eef7fb]"], [1369, "[.admin-app-nav_a:where(&).active]:[color:#fff] [.admin-app-nav_a:where(&).active]:[background:linear-gradient(120deg,_#1a7de8_0%,_#1e97f5_100%)] [.admin-app-nav_a:where(&).active]:[box-shadow:0_6px_20px_rgba(22,_100,_220,_.4),_inset_0_1px_0_rgba(255,_255,_255,_.15)] [.admin-app-nav_a:where(&).active]:font-bold"], [1370, "[.admin-app-nav_a:where(&).active_svg]:[color:#e0f0ff] [.admin-app-nav_a:where(&).active_svg]:[opacity:1]"], [1864, "[.hero-slider-dots_button:where(&).active]:[width:10px] [.hero-slider-dots_button:where(&).active]:[background:#1d5fb8]"], [2075, "[.nav-bar>a:where(&).active]:[color:var(--red)]"], [2226, "[.product-space-tabs_button:where(&).active]:[background:#e91b23] [.product-space-tabs_button:where(&).active]:[color:#fff]"], [2411, "[.order-tabs_button:where(&).active]:[color:#0d67e8] [.order-tabs_button:where(&).active]:[border-bottom-color:#0d67e8]"], [2413, "[.order-tabs_:where(&).active_b]:[background:#166cf0] [.order-tabs_:where(&).active_b]:[color:#fff]"], [2498, "[.order-pagination_button:where(&).active]:[background:#0968f5] [.order-pagination_button:where(&).active]:[color:#fff] [.order-pagination_button:where(&).active]:[border-color:#0968f5]"], [2898, "[.product-nav-pill_button:where(&).active]:[background:var(--red)] [.product-nav-pill_button:where(&).active]:[color:#fff]"], [3331, "[.resource-tabs_button:where(&).active]:[color:#fff] [.resource-tabs_button:where(&).active]:[border-color:transparent] [.resource-tabs_button:where(&).active]:[background:linear-gradient(135deg,#145bc6,#277fe3)] [.resource-tabs_button:where(&).active]:[box-shadow:0_5px_12px_rgba(29,100,207,.22)]"]),
  "brand": utilities([3612, "[.invoice-export_:where(&).brand_h1]:[margin:0] [.invoice-export_:where(&).brand_h1]:[font-size:25px] [.invoice-export_:where(&).brand_h1]:[color:#0b2445]"], [3613, "[.invoice-export_:where(&).brand_p]:[margin:7px_0_0] [.invoice-export_:where(&).brand_p]:[color:#64748b]"], [3664, "[.invoice-admin_:where(&).brand]:flex [.invoice-admin_:where(&).brand]:[gap:10px] [.invoice-admin_:where(&).brand]:items-center"], [3666, "[.invoice-admin_:where(&).brand_strong]:[font-size:26px] [.invoice-admin_:where(&).brand_strong]:[letter-spacing:2px]"], [3667, "[.invoice-admin_:where(&).brand_b]:block [.invoice-admin_:where(&).brand_b]:[font-size:13px] [.invoice-admin_:where(&).brand_b]:[letter-spacing:3px]"], [3668, "[.invoice-admin_:where(&).brand_small]:block [.invoice-admin_:where(&).brand_small]:[color:#7a91b8] [.invoice-admin_:where(&).brand_small]:[margin-top:6px]"]),
  "button": utilities([62, "[:where(&).button]:[min-height:39px] [:where(&).button]:inline-flex [:where(&).button]:items-center [:where(&).button]:justify-center [:where(&).button]:[gap:7px] [:where(&).button]:[border-radius:4px] [:where(&).button]:[padding:0_17px] [:where(&).button]:font-bold [:where(&).button]:cursor-pointer [:where(&).button]:[border:1px_solid_transparent]"], [280, "[.cart-summary_:where(&).button]:[width:100%] [.cart-summary_:where(&).button]:[margin-top:12px]"], [286, "[.checkout-form>:where(&).button]:[width:max-content] [.checkout-form>:where(&).button]:[margin-top:6px]"], [492, "[.accessory-card_:where(&).button]:[width:100%] [.accessory-card_:where(&).button]:[margin-top:12px] [.accessory-card_:where(&).button]:[border-radius:6px] [.accessory-card_:where(&).button]:text-ellipsis [.accessory-card_:where(&).button]:overflow-hidden [.accessory-card_:where(&).button]:whitespace-nowrap"], [603, "[:is(:where(&).button)]:[font-size:14px]"], [654, "[:is(.accessory-card_:where(&).button)]:[font-size:10px] [:is(.accessory-card_:where(&).button)]:[padding:0_4px] [:is(.accessory-card_:where(&).button)]:[min-height:30px]"], [683, "[@media_(max-width:_720px)]:[:where(&).button,_:where(&).text-link]:[font-size:12px]"], [809, "[.package-card_footer_:where(&).button]:[font-size:11px] [.package-card_footer_:where(&).button]:[min-height:32px] [.package-card_footer_:where(&).button]:[padding:0_13px]"], [818, "[.maintenance-cta_:where(&).button]:[margin-right:15px]"], [837, "[@media_(max-width:_720px)]:[.maintenance-cta_:where(&).button]:[margin:0_0_12px]"], [1225, "[.combo-modal>footer_:where(&).button]:[min-height:36px]"], [1289, "[@media_(max-width:_720px)]:[.combo-modal>footer_:where(&).button]:[width:100%]"], [2383, "[@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:inline-block [@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:[margin-top:15px]"], [2479, "[.reference-toolbar_:where(&).button]:[height:34px] [.reference-toolbar_:where(&).button]:[padding:0_10px] [.reference-toolbar_:where(&).button]:[font-size:10px]"], [2491, "[.order-actions_:where(&).button]:[font-size:9px] [.order-actions_:where(&).button]:[padding:6px_14px]"], [2542, "[.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[height:34px] [.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[font-size:9px]"], [2579, "[.order-confirmation-actions_:where(&).button]:flex [.order-confirmation-actions_:where(&).button]:items-center [.order-confirmation-actions_:where(&).button]:justify-center [.order-confirmation-actions_:where(&).button]:[gap:7px] [.order-confirmation-actions_:where(&).button]:[min-height:43px] [.order-confirmation-actions_:where(&).button]:[text-decoration:none]"], [2587, "[.invoice-actions_:where(&).button]:flex [.invoice-actions_:where(&).button]:items-center [.invoice-actions_:where(&).button]:justify-center [.invoice-actions_:where(&).button]:[gap:6px]"], [2627, "[@media_(max-width:680px)]:[.invoice-actions_:where(&).button]:[flex:1_1_100%]"], [2653, "[.drawer-edit-actions_:where(&).button]:[height:31px] [.drawer-edit-actions_:where(&).button]:[padding:0_11px] [.drawer-edit-actions_:where(&).button]:[font-size:9px]"]),
  "button-primary": utilities([63, "[:where(&).button-primary]:[background:var(--navy)] [:where(&).button-primary]:[color:#fff]"], [64, "[:where(&).button-primary:hover]:[background:#123d6b]"]),
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
  "line": utilities([3685, "[.invoice-admin_.card_:where(&).line]:grid [.invoice-admin_.card_:where(&).line]:[grid-template-columns:105px_10px_1fr] [.invoice-admin_.card_:where(&).line]:[margin:4px_0]"]),
  "listing-layout": utilities([347, "[:where(&).listing-layout]:grid [:where(&).listing-layout]:[grid-template-columns:218px_1fr] [:where(&).listing-layout]:[gap:27px] [:where(&).listing-layout]:[padding-top:24px]"], [539, "[@media_(max-width:_720px)]:[:where(&).listing-layout]:[grid-template-columns:1fr] [@media_(max-width:_720px)]:[:where(&).listing-layout]:[gap:16px]"]),
  "listing-results": utilities([348, "[:where(&).listing-results]:[min-width:0]"]),
  "listing-toolbar": utilities([377, "[:where(&).listing-toolbar]:flex [:where(&).listing-toolbar]:justify-between [:where(&).listing-toolbar]:items-center [:where(&).listing-toolbar]:[color:#6a758a] [:where(&).listing-toolbar]:[margin-bottom:14px]"], [378, "[:where(&).listing-toolbar_label]:flex [:where(&).listing-toolbar_label]:items-center [:where(&).listing-toolbar_label]:[gap:8px]"], [379, "[:where(&).listing-toolbar_select]:[border:1px_solid_#d9e0e8] [:where(&).listing-toolbar_select]:[border-radius:4px] [:where(&).listing-toolbar_select]:[padding:7px_26px_7px_10px] [:where(&).listing-toolbar_select]:[color:var(--ink)] [:where(&).listing-toolbar_select]:[background:#fff]"], [380, "[:where(&).listing-toolbar_label_svg]:[margin-left:-24px] [:where(&).listing-toolbar_label_svg]:pointer-events-none"], [541, "[@media_(max-width:_720px)]:[:where(&).listing-toolbar]:[margin-top:3px]"], [631, "[:is(:where(&).listing-toolbar)]:[font-size:13px]"], [632, "[:is(:where(&).listing-toolbar_select)]:[font-size:12px]"]),
  "meta": utilities([3618, "[.invoice-export_:where(&).meta]:grid [.invoice-export_:where(&).meta]:[grid-template-columns:1fr_1fr] [.invoice-export_:where(&).meta]:[gap:24px] [.invoice-export_:where(&).meta]:[margin:28px_0]"], [3633, "[@media_(max-width:650px)]:[.invoice-export_:where(&).head,_.invoice-export_:where(&).meta]:block"], [3676, "[.invoice-admin_:where(&).meta]:[border-left:1px_solid_#d6e2f2] [.invoice-admin_:where(&).meta]:[padding-left:28px]"], [3677, "[.invoice-admin_:where(&).meta_p]:grid [.invoice-admin_:where(&).meta_p]:[grid-template-columns:115px_12px_1fr] [.invoice-admin_:where(&).meta_p]:[margin:7px_0] [.invoice-admin_:where(&).meta_p]:[font-size:11px]"]),
  "next": utilities([775, "[.article-pagination_button:where(&).next]:inline-flex [.article-pagination_button:where(&).next]:items-center [.article-pagination_button:where(&).next]:[gap:5px] [.article-pagination_button:where(&).next]:[padding-inline:11px]"]),
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
  "product": utilities([3690, "[.invoice-admin_:where(&).product]:flex [.invoice-admin_:where(&).product]:[gap:9px] [.invoice-admin_:where(&).product]:items-center"], [3691, "[.invoice-admin_:where(&).product_img]:[width:54px] [.invoice-admin_:where(&).product_img]:[height:42px] [.invoice-admin_:where(&).product_img]:object-contain [.invoice-admin_:where(&).product_img]:[background:#f3f6fa] [.invoice-admin_:where(&).product_img]:[border-radius:6px] [.invoice-admin_:where(&).product_img]:[padding:3px]"], [3692, "[.invoice-admin_:where(&).product_small]:block [.invoice-admin_:where(&).product_small]:[color:#6f83a5] [.invoice-admin_:where(&).product_small]:[margin-top:3px]"]),
  "product-grid": utilities([101, "[:where(&).product-grid]:grid [:where(&).product-grid]:[grid-template-columns:repeat(4,_1fr)] [:where(&).product-grid]:[gap:13px]"], [102, "[:where(&).product-grid.five]:[grid-template-columns:repeat(5,_1fr)]"], [381, "[:where(&).product-grid.four]:[grid-template-columns:repeat(4,_1fr)]"], [496, "[@media_(max-width:_1050px)]:[:where(&).product-grid.five]:[grid-template-columns:repeat(3,_1fr)]"], [497, "[@media_(max-width:_1050px)]:[:where(&).product-grid.four]:[grid-template-columns:repeat(2,_1fr)]"], [527, "[@media_(max-width:_720px)]:[:where(&).product-grid.five,_:where(&).product-grid]:[grid-template-columns:repeat(2,_1fr)] [@media_(max-width:_720px)]:[:where(&).product-grid.five,_:where(&).product-grid]:[gap:8px]"], [542, "[@media_(max-width:_720px)]:[:where(&).product-grid.four]:[grid-template-columns:repeat(2,_1fr)]"]),
  "product-grid--loading": utilities([366, "[:where(&).product-grid--loading]:[opacity:0.25] [:where(&).product-grid--loading]:pointer-events-none [:where(&).product-grid--loading]:[filter:blur(2px)] [:where(&).product-grid--loading]:[transition:opacity_0.25s_ease,_filter_0.25s_ease]"]),
  "product-grid-wrapper": utilities([365, "[:where(&).product-grid-wrapper]:relative [:where(&).product-grid-wrapper]:[min-height:320px] [:where(&).product-grid-wrapper]:[min-width:0] [:where(&).product-grid-wrapper]:overflow-hidden"]),
  "product-loading-overlay": utilities([367, "[:where(&).product-loading-overlay]:fixed [:where(&).product-loading-overlay]:[inset:0] [:where(&).product-loading-overlay]:[z-index:9999] [:where(&).product-loading-overlay]:flex [:where(&).product-loading-overlay]:items-center [:where(&).product-loading-overlay]:justify-center [:where(&).product-loading-overlay]:animate-[overlay-fadein_0.18s_ease] [:where(&).product-loading-overlay]:pointer-events-none"]),
  "product-spinner-backdrop": utilities([368, "[:where(&).product-spinner-backdrop]:fixed [:where(&).product-spinner-backdrop]:[inset:0] [:where(&).product-spinner-backdrop]:[background:rgba(7,_27,_50,_0.18)] [:where(&).product-spinner-backdrop]:[backdrop-filter:blur(2px)] [:where(&).product-spinner-backdrop]:[-webkit-backdrop-filter:blur(2px)]"]),
  "product-spinner-container": utilities([369, "[:where(&).product-spinner-container]:relative [:where(&).product-spinner-container]:[z-index:10000] [:where(&).product-spinner-container]:flex [:where(&).product-spinner-container]:flex-col [:where(&).product-spinner-container]:items-center [:where(&).product-spinner-container]:[gap:18px] [:where(&).product-spinner-container]:[padding:40px_56px] [:where(&).product-spinner-container]:[background:#ffffff] [:where(&).product-spinner-container]:[border-radius:24px] [:where(&).product-spinner-container]:[box-shadow:0_20px_60px_rgba(7,_27,_50,_0.22),_0_2px_8px_rgba(7,_27,_50,_0.10)] [:where(&).product-spinner-container]:[border:1px_solid_rgba(220,_230,_245,_0.9)]"]),
  "product-spinner-ring": utilities([370, "[:where(&).product-spinner-ring]:inline-block [:where(&).product-spinner-ring]:relative [:where(&).product-spinner-ring]:[width:52px] [:where(&).product-spinner-ring]:[height:52px]"], [371, "[:where(&).product-spinner-ring_div]:box-border [:where(&).product-spinner-ring_div]:block [:where(&).product-spinner-ring_div]:absolute [:where(&).product-spinner-ring_div]:[width:44px] [:where(&).product-spinner-ring_div]:[height:44px] [:where(&).product-spinner-ring_div]:[margin:4px] [:where(&).product-spinner-ring_div]:[border:4px_solid_transparent] [:where(&).product-spinner-ring_div]:[border-radius:50%] [:where(&).product-spinner-ring_div]:animate-[spinner-rotate_1s_cubic-bezier(0.5,_0,_0.5,_1)_infinite]"], [372, "[:where(&).product-spinner-ring_div:nth-child(1)]:[border-top-color:#ed1c24] [:where(&).product-spinner-ring_div:nth-child(1)]:[animation-delay:-0.30s]"], [373, "[:where(&).product-spinner-ring_div:nth-child(2)]:[border-top-color:#1b3f72] [:where(&).product-spinner-ring_div:nth-child(2)]:[animation-delay:-0.20s]"], [374, "[:where(&).product-spinner-ring_div:nth-child(3)]:[border-top-color:#ed1c24] [:where(&).product-spinner-ring_div:nth-child(3)]:[animation-delay:-0.10s] [:where(&).product-spinner-ring_div:nth-child(3)]:[opacity:0.55]"], [375, "[:where(&).product-spinner-ring_div:nth-child(4)]:[border-top-color:#1b3f72] [:where(&).product-spinner-ring_div:nth-child(4)]:[opacity:0.35]"]),
  "product-spinner-text": utilities([376, "[:where(&).product-spinner-text]:[font-size:13px] [:where(&).product-spinner-text]:font-semibold [:where(&).product-spinner-text]:[color:#2d3d57] [:where(&).product-spinner-text]:[letter-spacing:0.04em] [:where(&).product-spinner-text]:[margin:0] [:where(&).product-spinner-text]:animate-[text-pulse_1.4s_ease-in-out_infinite]"]),
  "subcategory-chip": utilities([344, "[:where(&).subcategory-chip]:inline-flex [:where(&).subcategory-chip]:items-center [:where(&).subcategory-chip]:[padding:7px_16px] [:where(&).subcategory-chip]:[border-radius:20px] [:where(&).subcategory-chip]:[border:1.5px_solid_var(--line)] [:where(&).subcategory-chip]:[background:#fff] [:where(&).subcategory-chip]:[color:#45536b] [:where(&).subcategory-chip]:[font-size:13px] [:where(&).subcategory-chip]:font-medium [:where(&).subcategory-chip]:whitespace-nowrap [:where(&).subcategory-chip]:[text-decoration:none] [:where(&).subcategory-chip]:[transition:all_.15s]"], [345, "[:where(&).subcategory-chip:hover]:[border-color:var(--navy)] [:where(&).subcategory-chip:hover]:[color:var(--navy)] [:where(&).subcategory-chip:hover]:[background:#eef4ff]"], [346, "[:where(&).subcategory-chip.active]:[border-color:var(--red)] [:where(&).subcategory-chip.active]:[background:var(--red)] [:where(&).subcategory-chip.active]:[color:#fff]"]),
  "subcategory-chips": utilities([343, "[:where(&).subcategory-chips]:flex [:where(&).subcategory-chips]:[gap:8px] [:where(&).subcategory-chips]:[padding:12px_0] [:where(&).subcategory-chips]:overflow-x-auto [:where(&).subcategory-chips]:[scrollbar-width:none] [:where(&).subcategory-chips]:flex-wrap"]),
  "subcategory-chips-bar": utilities([342, "[:where(&).subcategory-chips-bar]:[background:#fff] [:where(&).subcategory-chips-bar]:[border-bottom:1px_solid_var(--line)]"]),
  "top": utilities([3663, "[.invoice-admin_:where(&).top]:flex [.invoice-admin_:where(&).top]:justify-between [.invoice-admin_:where(&).top]:items-start [.invoice-admin_:where(&).top]:[border-bottom:1px_solid_#a9c5ea] [.invoice-admin_:where(&).top]:[padding-bottom:16px]"]),
  "total": utilities([2531, "[.drawer-totals_p:where(&).total]:[background:#eaf3ff] [.drawer-totals_p:where(&).total]:[color:#075de2] [.drawer-totals_p:where(&).total]:[border-radius:5px] [.drawer-totals_p:where(&).total]:font-extrabold"]),
};
const tw = (value: string | undefined | null | false) => resolveClasses(value, componentUtilities);


/* ── helpers ── */
function pageHref(basePath: string, params: Record<string, string | number | undefined>, page: number) {
  const qs = new URLSearchParams();
  Object.entries({ ...params, page }).forEach(([k, v]) => {
    if (v !== undefined && String(v) !== "") qs.set(k, String(v));
  });
  return `${basePath}?${qs.toString()}`;
}

function slugToTitle(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((p) => (p.toLowerCase() === "dji" ? "DJI" : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

type ProductResult = ProductQueryResult;

/* ── Client Filter Panel ── */
function FilterPanel({
  basePath,
  query,
  onSearch,
  isLoading,
}: {
  basePath: string;
  query: ProductQuery;
  onSearch: (q: ProductQuery) => void;
  isLoading: boolean;
}) {
  const [q, setQ] = useState(query.q || "");
  const [subcategory, setSubcategory] = useState(query.subcategory || "");
  const [minPrice, setMinPrice] = useState(query.minPrice !== undefined ? String(query.minPrice) : "");
  const [maxPrice, setMaxPrice] = useState(query.maxPrice !== undefined ? String(query.maxPrice) : "");
  const [stock, setStock] = useState(query.stock || "");
  const [sort, setSort] = useState(query.sort || "newest");

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    onSearch({
      q: q || undefined,
      subcategory: subcategory || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      stock: (stock as "in" | "out") || undefined,
      sort: sort !== "newest" ? sort : undefined,
      page: 1,
    });
  }

  function clearFilters() {
    setQ(""); setSubcategory(""); setMinPrice(""); setMaxPrice(""); setStock(""); setSort("newest");
    onSearch({ page: 1 });
  }

  return (
    <aside className={utilities("filter-panel", [349, "[:where(&).filter-panel]:[border:1px_solid_var(--line)] [:where(&).filter-panel]:[border-radius:8px] [:where(&).filter-panel]:[height:max-content]"], [540, "[@media_(max-width:_720px)]:[:where(&).filter-panel]:hidden"], [1560, "[:where(&).filter-panel_form]:grid [:where(&).filter-panel_form]:[gap:12px]"], [1561, "[:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[width:100%] [:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[border:1px_solid_#dfe5ec] [:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[border-radius:7px] [:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[background:#fff] [:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[padding:10px_11px] [:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[color:#1f3048] [:where(&).filter-panel_input,_:where(&).filter-panel_select,_:where(&).account-form_input,_:where(&).track-order-panel_input,_:where(&).maintenance-request-section_input,_:where(&).maintenance-request-section_select,_:where(&).maintenance-request-section_textarea,_:where(&).admin-op-table_select]:[font:inherit]"])}>
      <form onSubmit={applyFilters}>
        <div className={utilities("filter-title", [350, "[:where(&).filter-title]:flex [:where(&).filter-title]:items-center [:where(&).filter-title]:justify-between [:where(&).filter-title]:[padding:15px] [:where(&).filter-title]:[border-bottom:1px_solid_var(--line)]"], [626, "[:is(:where(&).filter-title)]:[font-size:14px]"])}><strong>Filter products</strong></div>
        <div className={utilities("filter-group", [351, "[:where(&).filter-group]:[padding:16px_15px] [:where(&).filter-group]:[border-bottom:1px_solid_var(--line)]"], [352, "[:where(&).filter-group>strong]:block [:where(&).filter-group>strong]:[margin-bottom:14px]"], [353, "[:where(&).filter-group_label]:flex [:where(&).filter-group_label]:items-center [:where(&).filter-group_label]:[gap:8px] [:where(&).filter-group_label]:[color:#6d7890] [:where(&).filter-group_label]:[margin:10px_0]"], [354, "[:where(&).filter-group_input]:[accent-color:var(--red)]"], [627, "[:is(:where(&).filter-group>strong)]:[font-size:13px]"], [628, "[:is(:where(&).filter-group_label)]:[font-size:12px]"])}>
          <strong>Search</strong>
          <input aria-label="Search products" value={q} onChange={e => setQ(e.target.value)} placeholder="Product, SKU, category" />
        </div>
        {query.subcategory !== undefined && (
          <div className={utilities("filter-group", [351, "[:where(&).filter-group]:[padding:16px_15px] [:where(&).filter-group]:[border-bottom:1px_solid_var(--line)]"], [352, "[:where(&).filter-group>strong]:block [:where(&).filter-group>strong]:[margin-bottom:14px]"], [353, "[:where(&).filter-group_label]:flex [:where(&).filter-group_label]:items-center [:where(&).filter-group_label]:[gap:8px] [:where(&).filter-group_label]:[color:#6d7890] [:where(&).filter-group_label]:[margin:10px_0]"], [354, "[:where(&).filter-group_input]:[accent-color:var(--red)]"], [627, "[:is(:where(&).filter-group>strong)]:[font-size:13px]"], [628, "[:is(:where(&).filter-group_label)]:[font-size:12px]"])}>
            <strong>Subcategory</strong>
            <input aria-label="Subcategory" value={subcategory} onChange={e => setSubcategory(e.target.value)} placeholder="Filter by subcategory" />
          </div>
        )}
        <div className={utilities("filter-group", [351, "[:where(&).filter-group]:[padding:16px_15px] [:where(&).filter-group]:[border-bottom:1px_solid_var(--line)]"], [352, "[:where(&).filter-group>strong]:block [:where(&).filter-group>strong]:[margin-bottom:14px]"], [353, "[:where(&).filter-group_label]:flex [:where(&).filter-group_label]:items-center [:where(&).filter-group_label]:[gap:8px] [:where(&).filter-group_label]:[color:#6d7890] [:where(&).filter-group_label]:[margin:10px_0]"], [354, "[:where(&).filter-group_input]:[accent-color:var(--red)]"], [627, "[:is(:where(&).filter-group>strong)]:[font-size:13px]"], [628, "[:is(:where(&).filter-group_label)]:[font-size:12px]"])}>
          <strong>Price range (৳)</strong>
          <div className={utilities("price-range-row", [1562, "[:where(&).price-range-row]:flex [:where(&).price-range-row]:items-center [:where(&).price-range-row]:[gap:8px]"], [1563, "[:where(&).price-range-row_input]:[flex:1] [:where(&).price-range-row_input]:[width:0]"])}>
            <input aria-label="Minimum price in taka" type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} placeholder="Min" />
            <span className={utilities("price-range-dash", [1564, "[:where(&).price-range-dash]:[color:#8a9bb0] [:where(&).price-range-dash]:[font-size:16px] [:where(&).price-range-dash]:[flex-shrink:0]"])}>–</span>
            <input aria-label="Maximum price in taka" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder="Max" />
          </div>
        </div>
        <div className={utilities("filter-group", [351, "[:where(&).filter-group]:[padding:16px_15px] [:where(&).filter-group]:[border-bottom:1px_solid_var(--line)]"], [352, "[:where(&).filter-group>strong]:block [:where(&).filter-group>strong]:[margin-bottom:14px]"], [353, "[:where(&).filter-group_label]:flex [:where(&).filter-group_label]:items-center [:where(&).filter-group_label]:[gap:8px] [:where(&).filter-group_label]:[color:#6d7890] [:where(&).filter-group_label]:[margin:10px_0]"], [354, "[:where(&).filter-group_input]:[accent-color:var(--red)]"], [627, "[:is(:where(&).filter-group>strong)]:[font-size:13px]"], [628, "[:is(:where(&).filter-group_label)]:[font-size:12px]"])}>
          <strong>Availability</strong>
          <select aria-label="Availability" value={stock} onChange={e => setStock(e.target.value)}>
            <option value="">All</option>
            <option value="in">In stock</option>
            <option value="out">Out of stock</option>
          </select>
        </div>
        <div className={utilities("filter-group", [351, "[:where(&).filter-group]:[padding:16px_15px] [:where(&).filter-group]:[border-bottom:1px_solid_var(--line)]"], [352, "[:where(&).filter-group>strong]:block [:where(&).filter-group>strong]:[margin-bottom:14px]"], [353, "[:where(&).filter-group_label]:flex [:where(&).filter-group_label]:items-center [:where(&).filter-group_label]:[gap:8px] [:where(&).filter-group_label]:[color:#6d7890] [:where(&).filter-group_label]:[margin:10px_0]"], [354, "[:where(&).filter-group_input]:[accent-color:var(--red)]"], [627, "[:is(:where(&).filter-group>strong)]:[font-size:13px]"], [628, "[:is(:where(&).filter-group_label)]:[font-size:12px]"])}>
          <strong>Sort</strong>
          <select aria-label="Sort order" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="name">Name</option>
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

/* ── Main export ── */
export default function ProductListing({
  title = "All Products",
  description = "Official drones, handhelds and accessories.",
  basePath = "/products",
  fixedCategory,
  fixedBrand,
  bannerImage,
  searchParams = {},
  result: initialResult,
}: {
  title?: string;
  description?: string;
  basePath?: string;
  fixedCategory?: string;
  fixedBrand?: string;
  bannerImage?: string;
  searchParams?: Record<string, string | string[] | undefined>;
  result: ProductResult;
}) {
  const one = (key: string) => Array.isArray(searchParams[key]) ? searchParams[key]?.[0] : searchParams[key];

  // Initial query from server-side searchParams
  const initQuery: ProductQuery = {
    q: one("q"),
    category: fixedCategory || one("category"),
    brand: fixedBrand || one("brand"),
    subcategory: one("subcategory"),
    sort: one("sort"),
    stock: one("stock") === "out" ? "out" : one("stock") === "in" ? "in" : undefined,
    minPrice: one("minPrice") ? Number(one("minPrice")) : undefined,
    maxPrice: one("maxPrice") ? Number(one("maxPrice")) : undefined,
    page: Math.max(1, Number(one("page")) || 1),
    limit: 24,
  };

  const [result, setResult] = useState<ProductResult>(initialResult);
  const [activeQuery, setActiveQuery] = useState<ProductQuery>(initQuery);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // Track last server-side searchKey to detect navigation changes
  const searchKeyRef = useRef("");

  useEffect(() => () => abortRef.current?.abort(), []);

  // Client-side fetch — no page reload
  const fetchProducts = useCallback(async (query: ProductQuery) => {
    // Abort any previous in-flight request
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    // flushSync forces React to SYNCHRONOUSLY paint the spinner + empty grid
    // BEFORE any async work begins. This is necessary because queryProducts
    // can return near-instantly from Next.js cache, giving React no chance
    // to render the loading state otherwise.
    flushSync(() => {
      setIsLoading(true);
      setResult(prev => ({ ...prev, products: [] }));
    });

    if (ctrl.signal.aborted) return;

    try {
      const data = await queryProducts(query, ctrl.signal);
      if (!ctrl.signal.aborted) {
        setResult(data);
        setActiveQuery(query);

        // Sync URL without triggering navigation (replace, not push)
        const qs = new URLSearchParams();
        if (query.q) qs.set("q", query.q);
        if (query.category && !fixedCategory) qs.set("category", query.category);
        if (query.subcategory) qs.set("subcategory", query.subcategory);
        if (query.sort && query.sort !== "newest") qs.set("sort", query.sort);
        if (query.stock) qs.set("stock", query.stock);
        if (query.minPrice) qs.set("minPrice", String(query.minPrice));
        if (query.maxPrice) qs.set("maxPrice", String(query.maxPrice));
        if ((query.page || 1) > 1) qs.set("page", String(query.page));
        const newUrl = `${basePath}${qs.toString() ? `?${qs.toString()}` : ""}`;
        window.history.replaceState(null, "", newUrl);
      }
    } catch {
      // aborted or network error — ignore
    } finally {
      if (!ctrl.signal.aborted) setIsLoading(false);
    }
  }, [basePath, fixedCategory]);

  // Sync local state whenever the server-side result changes (navigation, back button, etc.)
  useEffect(() => {
    // Build a key from the URL-driven query params to detect real navigation
    const key = [initQuery.q, initQuery.category, initQuery.subcategory, initQuery.brand, initQuery.page].join("|");
    if (key !== searchKeyRef.current) {
      searchKeyRef.current = key;
      setResult(initialResult);
      setActiveQuery(initQuery);
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialResult]);

  function handleSearch(overrides: Partial<ProductQuery>) {
    const next: ProductQuery = {
      ...activeQuery,
      ...overrides,
      category: fixedCategory || activeQuery.category,
      brand: fixedBrand || activeQuery.brand,
      limit: 24,
    };
    void fetchProducts(next);
  }

  function handlePage(page: number) {
    void fetchProducts({ ...activeQuery, page, limit: 24 });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }


  // Derive unique subcategories from current result (for chip bar)
  const subcategoryChips = fixedCategory
    ? [...new Set(result.products.map(p => (p as typeof p & {subcategory?:string}).subcategory).filter(Boolean))] as string[]
    : [];

  // Breadcrumb
  const catSlug = fixedCategory || one("category");
  const subSlug = one("subcategory");
  const catLabel = catSlug ? slugToTitle(catSlug) : undefined;
  const subLabel = subSlug ? slugToTitle(subSlug) : undefined;

  return (
    <main>
      <section
        
        {...withTailwindStyle(tw(`catalog-hero${bannerImage ? " catalog-hero--has-image" : ""}`), bannerImage ? { backgroundImage: `url(${bannerImage})` } : undefined)}
      >
        <div className={utilities("page-container", [15, "[:where(&).page-container]:[width:min(1240px,_calc(100%_-_24px))] [:where(&).page-container]:[margin-inline:auto]"], [16, "[@media_(min-width:_768px)]:[:where(&).page-container]:[width:min(1240px,_calc(100%_-_48px))]"], [333, "[.catalog-hero_:where(&).page-container]:relative [.catalog-hero_:where(&).page-container]:[z-index:1]"], [501, "[@media_(max-width:_720px)]:[:where(&).page-container]:[width:min(100%_-_28px,_620px)]"])}>
          <p className={utilities("catalog-breadcrumb", [337, "[:where(&).catalog-breadcrumb]:flex [:where(&).catalog-breadcrumb]:items-center [:where(&).catalog-breadcrumb]:flex-wrap [:where(&).catalog-breadcrumb]:[gap:2px] [:where(&).catalog-breadcrumb]:[font-size:11px] [:where(&).catalog-breadcrumb]:[color:#b7c8dc] [:where(&).catalog-breadcrumb]:[margin:0_0_20px] [:where(&).catalog-breadcrumb]:[letter-spacing:0.03em]"], [338, "[:where(&).catalog-breadcrumb_a]:[color:#b7c8dc] [:where(&).catalog-breadcrumb_a]:[text-decoration:none] [:where(&).catalog-breadcrumb_a]:[transition:color_0.15s]"], [339, "[:where(&).catalog-breadcrumb_a:hover]:[color:#fff] [:where(&).catalog-breadcrumb_a:hover]:[text-decoration:underline]"], [340, "[:where(&).catalog-breadcrumb_span]:[color:#7a9abc]"], [341, "[:where(&).catalog-breadcrumb>span:last-child]:[color:#fff] [:where(&).catalog-breadcrumb>span:last-child]:font-semibold"])}>
            <Link href="/">Home</Link>
            <span> / </span>
            <Link href="/products">Products</Link>
            {catLabel && catSlug && (
              <>
                <span> / </span>
                <Link href={`/categories/${catSlug}`}>{catLabel}</Link>
              </>
            )}
            {subLabel && (
              <>
                <span> / </span>
                <span>{subLabel}</span>
              </>
            )}
          </p>
          <h1>{title}</h1>
          <span>{description}</span>
        </div>
      </section>
      {subcategoryChips.length > 0 && (
        <div className={utilities("subcategory-chips-bar", [342, "[:where(&).subcategory-chips-bar]:[background:#fff] [:where(&).subcategory-chips-bar]:[border-bottom:1px_solid_var(--line)]"])}>
          <div className={utilities("page-container", [15, "[:where(&).page-container]:[width:min(1240px,_calc(100%_-_24px))] [:where(&).page-container]:[margin-inline:auto]"], [16, "[@media_(min-width:_768px)]:[:where(&).page-container]:[width:min(1240px,_calc(100%_-_48px))]"], [333, "[.catalog-hero_:where(&).page-container]:relative [.catalog-hero_:where(&).page-container]:[z-index:1]"], [501, "[@media_(max-width:_720px)]:[:where(&).page-container]:[width:min(100%_-_28px,_620px)]"])}>
            <div className={utilities("subcategory-chips", [343, "[:where(&).subcategory-chips]:flex [:where(&).subcategory-chips]:[gap:8px] [:where(&).subcategory-chips]:[padding:12px_0] [:where(&).subcategory-chips]:overflow-x-auto [:where(&).subcategory-chips]:[scrollbar-width:none] [:where(&).subcategory-chips]:flex-wrap"])}>
              <button
                type="button"
                className={tw(`subcategory-chip${!activeQuery.subcategory ? " active" : ""}`)}
                onClick={() => handleSearch({ subcategory: undefined, page: 1 })}
              >All</button>
              {subcategoryChips.map(sub => (
                <button
                  key={sub}
                  type="button"
                  className={tw(`subcategory-chip${activeQuery.subcategory === sub ? " active" : ""}`)}
                  onClick={() => handleSearch({ subcategory: sub, page: 1 })}
                >{sub}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className={utilities("page-container listing-layout", [15, "[:where(&).page-container]:[width:min(1240px,_calc(100%_-_24px))] [:where(&).page-container]:[margin-inline:auto]"], [16, "[@media_(min-width:_768px)]:[:where(&).page-container]:[width:min(1240px,_calc(100%_-_48px))]"], [333, "[.catalog-hero_:where(&).page-container]:relative [.catalog-hero_:where(&).page-container]:[z-index:1]"], [347, "[:where(&).listing-layout]:grid [:where(&).listing-layout]:[grid-template-columns:218px_1fr] [:where(&).listing-layout]:[gap:27px] [:where(&).listing-layout]:[padding-top:24px]"], [501, "[@media_(max-width:_720px)]:[:where(&).page-container]:[width:min(100%_-_28px,_620px)]"], [539, "[@media_(max-width:_720px)]:[:where(&).listing-layout]:[grid-template-columns:1fr] [@media_(max-width:_720px)]:[:where(&).listing-layout]:[gap:16px]"])}>
        <FilterPanel basePath={basePath} query={activeQuery} onSearch={handleSearch} isLoading={isLoading} />
        <section className={utilities("listing-results", [348, "[:where(&).listing-results]:[min-width:0]"])}>
          <div className={utilities("listing-toolbar", [377, "[:where(&).listing-toolbar]:flex [:where(&).listing-toolbar]:justify-between [:where(&).listing-toolbar]:items-center [:where(&).listing-toolbar]:[color:#6a758a] [:where(&).listing-toolbar]:[margin-bottom:14px]"], [378, "[:where(&).listing-toolbar_label]:flex [:where(&).listing-toolbar_label]:items-center [:where(&).listing-toolbar_label]:[gap:8px]"], [379, "[:where(&).listing-toolbar_select]:[border:1px_solid_#d9e0e8] [:where(&).listing-toolbar_select]:[border-radius:4px] [:where(&).listing-toolbar_select]:[padding:7px_26px_7px_10px] [:where(&).listing-toolbar_select]:[color:var(--ink)] [:where(&).listing-toolbar_select]:[background:#fff]"], [380, "[:where(&).listing-toolbar_label_svg]:[margin-left:-24px] [:where(&).listing-toolbar_label_svg]:pointer-events-none"], [541, "[@media_(max-width:_720px)]:[:where(&).listing-toolbar]:[margin-top:3px]"], [631, "[:is(:where(&).listing-toolbar)]:[font-size:13px]"], [632, "[:is(:where(&).listing-toolbar_select)]:[font-size:12px]"])}>
            <span>{result.meta.total} result{result.meta.total === 1 ? "" : "s"}</span>
          </div>
          <div className={utilities("product-grid-wrapper", [365, "[:where(&).product-grid-wrapper]:relative [:where(&).product-grid-wrapper]:[min-height:320px] [:where(&).product-grid-wrapper]:[min-width:0] [:where(&).product-grid-wrapper]:overflow-hidden"])}>
            {isLoading && (
              <div className={utilities("product-loading-overlay", [367, "[:where(&).product-loading-overlay]:fixed [:where(&).product-loading-overlay]:[inset:0] [:where(&).product-loading-overlay]:[z-index:9999] [:where(&).product-loading-overlay]:flex [:where(&).product-loading-overlay]:items-center [:where(&).product-loading-overlay]:justify-center [:where(&).product-loading-overlay]:animate-[overlay-fadein_0.18s_ease] [:where(&).product-loading-overlay]:pointer-events-none"])} aria-live="polite" aria-label="Loading products">
                <div className={utilities("product-spinner-backdrop", [368, "[:where(&).product-spinner-backdrop]:fixed [:where(&).product-spinner-backdrop]:[inset:0] [:where(&).product-spinner-backdrop]:[background:rgba(7,_27,_50,_0.18)] [:where(&).product-spinner-backdrop]:[backdrop-filter:blur(2px)] [:where(&).product-spinner-backdrop]:[-webkit-backdrop-filter:blur(2px)]"])} />
                <div className={utilities("product-spinner-container", [369, "[:where(&).product-spinner-container]:relative [:where(&).product-spinner-container]:[z-index:10000] [:where(&).product-spinner-container]:flex [:where(&).product-spinner-container]:flex-col [:where(&).product-spinner-container]:items-center [:where(&).product-spinner-container]:[gap:18px] [:where(&).product-spinner-container]:[padding:40px_56px] [:where(&).product-spinner-container]:[background:#ffffff] [:where(&).product-spinner-container]:[border-radius:24px] [:where(&).product-spinner-container]:[box-shadow:0_20px_60px_rgba(7,_27,_50,_0.22),_0_2px_8px_rgba(7,_27,_50,_0.10)] [:where(&).product-spinner-container]:[border:1px_solid_rgba(220,_230,_245,_0.9)]"])}>
                  <div className={utilities("product-spinner-ring", [370, "[:where(&).product-spinner-ring]:inline-block [:where(&).product-spinner-ring]:relative [:where(&).product-spinner-ring]:[width:52px] [:where(&).product-spinner-ring]:[height:52px]"], [371, "[:where(&).product-spinner-ring_div]:box-border [:where(&).product-spinner-ring_div]:block [:where(&).product-spinner-ring_div]:absolute [:where(&).product-spinner-ring_div]:[width:44px] [:where(&).product-spinner-ring_div]:[height:44px] [:where(&).product-spinner-ring_div]:[margin:4px] [:where(&).product-spinner-ring_div]:[border:4px_solid_transparent] [:where(&).product-spinner-ring_div]:[border-radius:50%] [:where(&).product-spinner-ring_div]:animate-[spinner-rotate_1s_cubic-bezier(0.5,_0,_0.5,_1)_infinite]"], [372, "[:where(&).product-spinner-ring_div:nth-child(1)]:[border-top-color:#ed1c24] [:where(&).product-spinner-ring_div:nth-child(1)]:[animation-delay:-0.30s]"], [373, "[:where(&).product-spinner-ring_div:nth-child(2)]:[border-top-color:#1b3f72] [:where(&).product-spinner-ring_div:nth-child(2)]:[animation-delay:-0.20s]"], [374, "[:where(&).product-spinner-ring_div:nth-child(3)]:[border-top-color:#ed1c24] [:where(&).product-spinner-ring_div:nth-child(3)]:[animation-delay:-0.10s] [:where(&).product-spinner-ring_div:nth-child(3)]:[opacity:0.55]"], [375, "[:where(&).product-spinner-ring_div:nth-child(4)]:[border-top-color:#1b3f72] [:where(&).product-spinner-ring_div:nth-child(4)]:[opacity:0.35]"])}>
                    <div /><div /><div /><div />
                  </div>
                  <p className={utilities("product-spinner-text", [376, "[:where(&).product-spinner-text]:[font-size:13px] [:where(&).product-spinner-text]:font-semibold [:where(&).product-spinner-text]:[color:#2d3d57] [:where(&).product-spinner-text]:[letter-spacing:0.04em] [:where(&).product-spinner-text]:[margin:0] [:where(&).product-spinner-text]:animate-[text-pulse_1.4s_ease-in-out_infinite]"])}>Loading products…</p>
                </div>
              </div>
            )}
            {result.products.length
              ? <div className={tw(`product-grid four${isLoading ? " product-grid--loading" : ""}`)}>{result.products.map(product => (product as any).isAccessory ? <AccessoryCard accessory={product as any} key={product.slug} /> : <ProductCard product={product} key={product.slug} />)}</div>
              : !isLoading && <div className={utilities("empty-state", [281, "[:where(&).empty-state]:text-center [:where(&).empty-state]:[border:1px_dashed_#cfd8e4] [:where(&).empty-state]:[border-radius:8px] [:where(&).empty-state]:[padding:65px_20px] [:where(&).empty-state]:[margin-top:28px]"], [283, "[:where(&).empty-state_h2]:[font-size:20px] [:where(&).empty-state_h2]:[margin:10px_0_7px]"], [284, "[:where(&).empty-state_p]:[color:#626e83] [:where(&).empty-state_p]:[font-size:11px] [:where(&).empty-state_p]:[margin:0_0_20px]"])}><h2>No products found</h2><p>Try a different search or filter.</p></div>
            }
          </div>
          {result.meta.pages > 1 && (
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
