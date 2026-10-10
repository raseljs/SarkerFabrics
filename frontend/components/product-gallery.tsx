"use client";

import { utilities, resolveClasses } from "@/lib/tailwind";
import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import Image from "next/image";
import ProductHoverZoom from "./product-hover-zoom";

// Component styling is compiled from these local Tailwind utilities.
const componentUtilities: Record<string, string> = {
  "active": utilities([74, "[.hero-dots_:where(&).active]:[background:#173e89]"], [299, "[.admin-sidebar_a:where(&).active,_:where(&).admin-sidebar_a:hover]:[color:var(--ink)] [.admin-sidebar_a:where(&).active,_:where(&).admin-sidebar_a:hover]:[background:#eef4ff]"], [459, "[.detail-tabs_button:where(&).active]:[background:var(--red)] [.detail-tabs_button:where(&).active]:[color:#fff]"], [466, "[.content-tabs_:where(&).active]:[color:var(--red)] [.content-tabs_:where(&).active]:font-extrabold [.content-tabs_:where(&).active]:[border-top:2px_solid_var(--red)]"], [728, "[:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[background:#f1f4f8] [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[color:var(--ink)] [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:font-bold [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[border-left:3px_solid_#73b2cd] [:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[padding-left:16px]"], [741, "[.nav-bar>a:where(&).active,_.nav-bar_:where(&).maintenance-link.active]:[color:var(--red)]"], [742, "[.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[content:''] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:absolute [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[left:0] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[right:0] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[bottom:0] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[height:2px] [.nav-bar>a:where(&).active::after,_.nav-bar_:where(&).maintenance-link.active::after]:[background:var(--red)]"], [774, "[.article-pagination_button:where(&).active]:[border-color:var(--red)] [.article-pagination_button:where(&).active]:[background:var(--red)] [.article-pagination_button:where(&).active]:[color:#fff]"], [843, "[.mega-mode-tabs_button:where(&).active]:[color:#1266cf] [.mega-mode-tabs_button:where(&).active]:[border-bottom-color:#1266cf]"], [932, "[.rich-editor-tabs_button:where(&).active]:[color:#155fc5] [.rich-editor-tabs_button:where(&).active]:[border-bottom-color:#155fc5]"], [992, "[.rde-toggle-row_button:where(&).active]:[background:#eef4ff] [.rde-toggle-row_button:where(&).active]:[border-color:#3f70ce] [.rde-toggle-row_button:where(&).active]:[color:#155fc5]"], [1071, "[:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[border-left-color:#72b6d2] [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[background:#f0f3f7] [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[color:#102952] [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:font-bold [:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[outline:0]"], [1120, "[@media_(max-width:_720px)]:[:where(&).mega-menu-sidebar_button:hover,_.mega-menu-sidebar_button:where(&).active]:[padding-left:5px]"], [1143, "[@media_(max-width:_720px)]:[:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[border-color:#72b6d2] [@media_(max-width:_720px)]:[:where(&).all-products-sidebar-list_button:hover,_:where(&).all-products-sidebar-list_button:focus-visible,_.all-products-sidebar-list_button:where(&).active]:[background:#eef7fb]"], [1369, "[.admin-app-nav_a:where(&).active]:[color:#fff] [.admin-app-nav_a:where(&).active]:[background:linear-gradient(120deg,_#1a7de8_0%,_#1e97f5_100%)] [.admin-app-nav_a:where(&).active]:[box-shadow:0_6px_20px_rgba(22,_100,_220,_.4),_inset_0_1px_0_rgba(255,_255,_255,_.15)] [.admin-app-nav_a:where(&).active]:font-bold"], [1370, "[.admin-app-nav_a:where(&).active_svg]:[color:#e0f0ff] [.admin-app-nav_a:where(&).active_svg]:[opacity:1]"], [1864, "[.hero-slider-dots_button:where(&).active]:[width:10px] [.hero-slider-dots_button:where(&).active]:[background:#1d5fb8]"], [2075, "[.nav-bar>a:where(&).active]:[color:var(--red)]"], [2226, "[.product-space-tabs_button:where(&).active]:[background:#e91b23] [.product-space-tabs_button:where(&).active]:[color:#fff]"], [2411, "[.order-tabs_button:where(&).active]:[color:#0d67e8] [.order-tabs_button:where(&).active]:[border-bottom-color:#0d67e8]"], [2413, "[.order-tabs_:where(&).active_b]:[background:#166cf0] [.order-tabs_:where(&).active_b]:[color:#fff]"], [2498, "[.order-pagination_button:where(&).active]:[background:#0968f5] [.order-pagination_button:where(&).active]:[color:#fff] [.order-pagination_button:where(&).active]:[border-color:#0968f5]"], [2898, "[.product-nav-pill_button:where(&).active]:[background:var(--red)] [.product-nav-pill_button:where(&).active]:[color:#fff]"], [3331, "[.resource-tabs_button:where(&).active]:[color:#fff] [.resource-tabs_button:where(&).active]:[border-color:transparent] [.resource-tabs_button:where(&).active]:[background:linear-gradient(135deg,#145bc6,#277fe3)] [.resource-tabs_button:where(&).active]:[box-shadow:0_5px_12px_rgba(29,100,207,.22)]"]),
  "bottom": utilities([3693, "[.invoice-admin_:where(&).bottom]:grid [.invoice-admin_:where(&).bottom]:[grid-template-columns:1fr_1fr] [.invoice-admin_:where(&).bottom]:[gap:16px] [.invoice-admin_:where(&).bottom]:[margin-top:13px]"]),
  "button": utilities([62, "[:where(&).button]:[min-height:39px] [:where(&).button]:inline-flex [:where(&).button]:items-center [:where(&).button]:justify-center [:where(&).button]:[gap:7px] [:where(&).button]:[border-radius:4px] [:where(&).button]:[padding:0_17px] [:where(&).button]:font-bold [:where(&).button]:cursor-pointer [:where(&).button]:[border:1px_solid_transparent]"], [280, "[.cart-summary_:where(&).button]:[width:100%] [.cart-summary_:where(&).button]:[margin-top:12px]"], [286, "[.checkout-form>:where(&).button]:[width:max-content] [.checkout-form>:where(&).button]:[margin-top:6px]"], [492, "[.accessory-card_:where(&).button]:[width:100%] [.accessory-card_:where(&).button]:[margin-top:12px] [.accessory-card_:where(&).button]:[border-radius:6px] [.accessory-card_:where(&).button]:text-ellipsis [.accessory-card_:where(&).button]:overflow-hidden [.accessory-card_:where(&).button]:whitespace-nowrap"], [603, "[:is(:where(&).button)]:[font-size:14px]"], [654, "[:is(.accessory-card_:where(&).button)]:[font-size:10px] [:is(.accessory-card_:where(&).button)]:[padding:0_4px] [:is(.accessory-card_:where(&).button)]:[min-height:30px]"], [683, "[@media_(max-width:_720px)]:[:where(&).button,_:where(&).text-link]:[font-size:12px]"], [809, "[.package-card_footer_:where(&).button]:[font-size:11px] [.package-card_footer_:where(&).button]:[min-height:32px] [.package-card_footer_:where(&).button]:[padding:0_13px]"], [818, "[.maintenance-cta_:where(&).button]:[margin-right:15px]"], [837, "[@media_(max-width:_720px)]:[.maintenance-cta_:where(&).button]:[margin:0_0_12px]"], [1225, "[.combo-modal>footer_:where(&).button]:[min-height:36px]"], [1289, "[@media_(max-width:_720px)]:[.combo-modal>footer_:where(&).button]:[width:100%]"], [2383, "[@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:inline-block [@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:[margin-top:15px]"], [2479, "[.reference-toolbar_:where(&).button]:[height:34px] [.reference-toolbar_:where(&).button]:[padding:0_10px] [.reference-toolbar_:where(&).button]:[font-size:10px]"], [2491, "[.order-actions_:where(&).button]:[font-size:9px] [.order-actions_:where(&).button]:[padding:6px_14px]"], [2542, "[.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[height:34px] [.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[font-size:9px]"], [2579, "[.order-confirmation-actions_:where(&).button]:flex [.order-confirmation-actions_:where(&).button]:items-center [.order-confirmation-actions_:where(&).button]:justify-center [.order-confirmation-actions_:where(&).button]:[gap:7px] [.order-confirmation-actions_:where(&).button]:[min-height:43px] [.order-confirmation-actions_:where(&).button]:[text-decoration:none]"], [2587, "[.invoice-actions_:where(&).button]:flex [.invoice-actions_:where(&).button]:items-center [.invoice-actions_:where(&).button]:justify-center [.invoice-actions_:where(&).button]:[gap:6px]"], [2627, "[@media_(max-width:680px)]:[.invoice-actions_:where(&).button]:[flex:1_1_100%]"], [2653, "[.drawer-edit-actions_:where(&).button]:[height:31px] [.drawer-edit-actions_:where(&).button]:[padding:0_11px] [.drawer-edit-actions_:where(&).button]:[font-size:9px]"]),
  "current": utilities([2537, "[.timeline-event_i:where(&).current]:[background:#0c67eb]"]),
  "detail-gallery": utilities([411, "[:where(&).detail-gallery]:[border:1px_solid_var(--line)] [:where(&).detail-gallery]:[border-radius:8px] [:where(&).detail-gallery]:[padding:10px] [:where(&).detail-gallery]:flex [:where(&).detail-gallery]:flex-col [:where(&).detail-gallery]:[gap:10px]"], [548, "[@media_(max-width:_720px)]:[:where(&).detail-gallery]:[order:1] [@media_(max-width:_720px)]:[:where(&).detail-gallery]:[width:100%] [@media_(max-width:_720px)]:[:where(&).detail-gallery]:[min-width:0]"], [2144, "[.product-detail-layout_:where(&).detail-gallery]:[border:1px_solid_var(--line)] [.product-detail-layout_:where(&).detail-gallery]:[border-radius:8px] [.product-detail-layout_:where(&).detail-gallery]:[background:#fff] [.product-detail-layout_:where(&).detail-gallery]:[padding:12px] [.product-detail-layout_:where(&).detail-gallery]:flex [.product-detail-layout_:where(&).detail-gallery]:flex-col [.product-detail-layout_:where(&).detail-gallery]:[gap:10px]"], [2210, "[@media_(max-width:850px)]:[.product-detail-layout_:where(&).detail-gallery,_:where(&).detail-gallery]:[min-width:0] [@media_(max-width:850px)]:[.product-detail-layout_:where(&).detail-gallery,_:where(&).detail-gallery]:[width:calc(100%_+_28px)] [@media_(max-width:850px)]:[.product-detail-layout_:where(&).detail-gallery,_:where(&).detail-gallery]:[margin-inline:-14px] [@media_(max-width:850px)]:[.product-detail-layout_:where(&).detail-gallery,_:where(&).detail-gallery]:[border-radius:0] [@media_(max-width:850px)]:[.product-detail-layout_:where(&).detail-gallery,_:where(&).detail-gallery]:[border-left:none] [@media_(max-width:850px)]:[.product-detail-layout_:where(&).detail-gallery,_:where(&).detail-gallery]:[border-right:none] [@media_(max-width:850px)]:[.product-detail-layout_:where(&).detail-gallery,_:where(&).detail-gallery]:[padding:0] [@media_(max-width:850px)]:[.product-detail-layout_:where(&).detail-gallery,_:where(&).detail-gallery]:[background:#eef2f6] [@media_(max-width:850px)]:[.product-detail-layout_:where(&).detail-gallery,_:where(&).detail-gallery]:box-border"], [10001, "[@media_(max-width:720px)]:[.product-detail-layout_:where(&).detail-gallery]:[width:calc(100%_+_28px)]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).detail-gallery]:[margin-inline:-14px]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).detail-gallery]:[border:0]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).detail-gallery]:[border-radius:0]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).detail-gallery]:[padding:0]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).detail-gallery]:[background:#fff]!"]),
  "gallery-dot": utilities([2154, "[:where(&).gallery-dot]:[width:6px] [:where(&).gallery-dot]:[height:6px] [:where(&).gallery-dot]:[border-radius:50%] [:where(&).gallery-dot]:[background:rgba(255,_255,_255,_0.45)] [:where(&).gallery-dot]:[transition:background_.2s,_transform_.2s] [:where(&).gallery-dot]:block"], [2155, "[:where(&).gallery-dot.active]:[background:#fff] [:where(&).gallery-dot.active]:[transform:scale(1.35)]"]),
  "gallery-dots": utilities([2153, "[:where(&).gallery-dots]:absolute [:where(&).gallery-dots]:[bottom:10px] [:where(&).gallery-dots]:[left:50%] [:where(&).gallery-dots]:[transform:translateX(-50%)] [:where(&).gallery-dots]:flex [:where(&).gallery-dots]:[gap:6px] [:where(&).gallery-dots]:[z-index:10] [:where(&).gallery-dots]:pointer-events-none"]),
  "gallery-img-anim-left": utilities([2151, "[:where(&).gallery-img-anim-left]:animate-[gallery-slide-in-left_.28s_cubic-bezier(.25,_.46,_.45,_.94)_both] [:where(&).gallery-img-anim-left]:[will-change:transform,_opacity] [:where(&).gallery-img-anim-left]:[backface-visibility:hidden]"]),
  "gallery-img-anim-right": utilities([2152, "[:where(&).gallery-img-anim-right]:animate-[gallery-slide-in-right_.28s_cubic-bezier(.25,_.46,_.45,_.94)_both] [:where(&).gallery-img-anim-right]:[will-change:transform,_opacity] [:where(&).gallery-img-anim-right]:[backface-visibility:hidden]"]),
  "gallery-main": utilities([412, "[:where(&).gallery-main]:[height:410px] [:where(&).gallery-main]:grid [:where(&).gallery-main]:[place-items:center] [:where(&).gallery-main]:[background:#fbfcfe] [:where(&).gallery-main]:overflow-hidden [:where(&).gallery-main]:relative [:where(&).gallery-main]:[z-index:0] [:where(&).gallery-main]:[flex-shrink:0]"], [413, "[:where(&).gallery-main_img]:[width:100%] [:where(&).gallery-main_img]:[height:100%] [:where(&).gallery-main_img]:object-cover [:where(&).gallery-main_img]:[object-position:center]"], [2145, "[.product-detail-layout_:where(&).gallery-main]:[width:100%] [.product-detail-layout_:where(&).gallery-main]:[aspect-ratio:1_/_1] [.product-detail-layout_:where(&).gallery-main]:[flex-shrink:0] [.product-detail-layout_:where(&).gallery-main]:[background:#fbfcfe] [.product-detail-layout_:where(&).gallery-main]:[border-radius:6px] [.product-detail-layout_:where(&).gallery-main]:flex [.product-detail-layout_:where(&).gallery-main]:items-center [.product-detail-layout_:where(&).gallery-main]:justify-center [.product-detail-layout_:where(&).gallery-main]:overflow-hidden"], [2146, "[.product-detail-layout_:where(&).gallery-main_img]:[width:100%] [.product-detail-layout_:where(&).gallery-main_img]:[height:100%] [.product-detail-layout_:where(&).gallery-main_img]:object-cover [.product-detail-layout_:where(&).gallery-main_img]:[object-position:center] [.product-detail-layout_:where(&).gallery-main_img]:block"], [2212, "[@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:[width:calc(100%_+_32px)]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:relative! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:[margin-inline:-16px]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:[max-width:none]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:[height:280px]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:[aspect-ratio:unset]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:[border-radius:0]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:[background:#fbfcfe]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:[box-shadow:none]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:[padding:0]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:box-border! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:overflow-hidden!"], [2213, "[@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_img,_:where(&).gallery-main_img]:absolute! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_img,_:where(&).gallery-main_img]:[inset:0]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_img,_:where(&).gallery-main_img]:[width:100%]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_img,_:where(&).gallery-main_img]:[height:100%]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_img,_:where(&).gallery-main_img]:object-contain! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_img,_:where(&).gallery-main_img]:[object-position:center]!"], [2214, "[@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_video,_:where(&).gallery-main_video]:absolute! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_video,_:where(&).gallery-main_video]:[inset:0]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_video,_:where(&).gallery-main_video]:[width:100%]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_video,_:where(&).gallery-main_video]:[height:100%]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_video,_:where(&).gallery-main_video]:object-cover! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_video,_:where(&).gallery-main_video]:[object-position:center]!"], [10001, "[@media_(max-width:720px)]:[.product-detail-layout_:where(&).gallery-main]:[width:100%]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).gallery-main]:[margin-inline:0]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).gallery-main]:[height:auto]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).gallery-main]:[aspect-ratio:3_/_4]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).gallery-main_img]:object-cover!"]),
  "gallery-media-wrapper": utilities([2149, "[:where(&).gallery-media-wrapper]:absolute [:where(&).gallery-media-wrapper]:[inset:0] [:where(&).gallery-media-wrapper]:[width:100%] [:where(&).gallery-media-wrapper]:[height:100%] [:where(&).gallery-media-wrapper]:[will-change:transform,_opacity] [:where(&).gallery-media-wrapper]:[backface-visibility:hidden]"]),
  "gallery-thumbs": utilities([415, "[:where(&).gallery-thumbs]:flex [:where(&).gallery-thumbs]:[gap:8px] [:where(&).gallery-thumbs]:[flex-shrink:0] [:where(&).gallery-thumbs]:flex-wrap [:where(&).gallery-thumbs]:[margin-top:0]"], [416, "[:where(&).gallery-thumbs_button]:[width:62px] [:where(&).gallery-thumbs_button]:[height:57px] [:where(&).gallery-thumbs_button]:[background:#fff] [:where(&).gallery-thumbs_button]:[border:1px_solid_var(--line)] [:where(&).gallery-thumbs_button]:[border-radius:4px] [:where(&).gallery-thumbs_button]:[padding:4px] [:where(&).gallery-thumbs_button]:cursor-pointer [:where(&).gallery-thumbs_button]:[transition:border-color_.15s] [:where(&).gallery-thumbs_button]:[flex-shrink:0]"], [418, "[:where(&).gallery-thumbs_img]:[width:100%] [:where(&).gallery-thumbs_img]:[height:100%] [:where(&).gallery-thumbs_img]:object-contain [:where(&).gallery-thumbs_img]:[mix-blend-mode:multiply]"], [2113, "[.product-detail-layout_:where(&).gallery-thumbs]:[background:#f5f5f5]"], [2148, "[:is(.product-detail-layout_:where(&).gallery-thumbs)]:[flex-shrink:0] [:is(.product-detail-layout_:where(&).gallery-thumbs)]:flex [:is(.product-detail-layout_:where(&).gallery-thumbs)]:[gap:8px] [:is(.product-detail-layout_:where(&).gallery-thumbs)]:flex-wrap [:is(.product-detail-layout_:where(&).gallery-thumbs)]:[margin-top:0]"], [2215, "[@media_(max-width:850px)]:[:where(&).gallery-thumbs]:[padding:4px] [@media_(max-width:850px)]:[:where(&).gallery-thumbs]:overflow-x-auto [@media_(max-width:850px)]:[:where(&).gallery-thumbs]:[scrollbar-width:none]"], [10001, "[@media_(max-width:720px)]:[.product-detail-layout_:where(&).gallery-thumbs]:flex-nowrap! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).gallery-thumbs]:[padding:0_8px_8px]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).gallery-thumbs]:[background:#fff]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).gallery-thumbs]:[max-width:100%]!"]),
  "gallery-video-main": utilities([414, "[:where(&).gallery-video-main]:[width:100%] [:where(&).gallery-video-main]:[height:100%] [:where(&).gallery-video-main]:object-cover [:where(&).gallery-video-main]:block [:where(&).gallery-video-main]:[border-radius:4px]"], [2147, "[.product-detail-layout_:where(&).gallery-video-main]:[width:100%] [.product-detail-layout_:where(&).gallery-video-main]:[height:100%] [.product-detail-layout_:where(&).gallery-video-main]:object-cover [.product-detail-layout_:where(&).gallery-video-main]:block [.product-detail-layout_:where(&).gallery-video-main]:[border-radius:4px]"]),
  "gallery-video-thumb": utilities([419, "[:where(&).gallery-video-thumb]:[width:100%] [:where(&).gallery-video-thumb]:[height:100%] [:where(&).gallery-video-thumb]:flex [:where(&).gallery-video-thumb]:items-center [:where(&).gallery-video-thumb]:justify-center [:where(&).gallery-video-thumb]:[background:#0b1730] [:where(&).gallery-video-thumb]:[border-radius:2px] [:where(&).gallery-video-thumb]:[color:#fff]"]),
  "line": utilities([3685, "[.invoice-admin_.card_:where(&).line]:grid [.invoice-admin_.card_:where(&).line]:[grid-template-columns:105px_10px_1fr] [.invoice-admin_.card_:where(&).line]:[margin:4px_0]"]),
  "next": utilities([775, "[.article-pagination_button:where(&).next]:inline-flex [.article-pagination_button:where(&).next]:items-center [.article-pagination_button:where(&).next]:[gap:5px] [.article-pagination_button:where(&).next]:[padding-inline:11px]"]),
  "selected": utilities([417, "[.gallery-thumbs_button:where(&).selected]:[border-color:var(--red)]"]),
};
const tw = (value: string | undefined | null | false) => resolveClasses(value, componentUtilities);


type MediaItem = { type: "image"; url: string } | { type: "video"; url: string };

export type ColourThumbnail = { slug: string; image: string; name: string };
type GalleryThumbnail = MediaItem & { key: string; mediaIndex: number; productSlug?: string; name?: string };

function mediaItems(images: unknown, videos: unknown): MediaItem[] {
  const items: MediaItem[] = [];
  const seen = new Set<string>();
  for (const [type, values] of [["image", images], ["video", videos]] as const) {
    if (!Array.isArray(values)) continue;
    for (const value of values) {
      if (typeof value !== "string" || !value.trim()) continue;
      const url = value.trim();
      const key = `${type}:${url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ type, url });
    }
  }
  return items;
}

function selectedMediaIndex(items: MediaItem[], selectedImage: unknown): number {
  const index = typeof selectedImage === "string"
    ? items.findIndex(item => item.type === "image" && item.url === selectedImage.trim())
    : -1;
  return Math.max(0, index);
}

export default function ProductGallery({
  images,
  name,
  galleryVideos,
  selectedImage,
  colourThumbnails,
  selectedProductSlug,
}: {
  images: string[];
  name: string;
  galleryVideos?: string[];
  selectedImage?: string;
  colourThumbnails?: ColourThumbnail[];
  selectedProductSlug?: string;
}) {
  const initialMediaItems = mediaItems(images, galleryVideos);

  const [activeMediaItems, setActiveMediaItems] = useState(initialMediaItems);
  const [activeIndex, setActiveIndex] = useState(() => selectedMediaIndex(initialMediaItems, selectedImage));
  const [activeName, setActiveName] = useState(name);
  const initialProductSlug = selectedProductSlug || colourThumbnails?.find(item => item.image === selectedImage)?.slug || colourThumbnails?.[0]?.slug;
  const [activeProductSlug, setActiveProductSlug] = useState(initialProductSlug);
  const [animKey, setAnimKey] = useState(0);
  // "left" = next (slides in from right), "right" = prev (slides in from left)
  const [swipeDir, setSwipeDir] = useState<"left" | "right">("left");

  useEffect(() => {
    setActiveMediaItems(initialMediaItems);
    setActiveIndex(selectedMediaIndex(initialMediaItems, selectedImage));
    setActiveName(name);
    setActiveProductSlug(initialProductSlug);
  }, [images, galleryVideos, selectedImage, name, initialProductSlug]);

  useEffect(() => {
    function handleComboSelected(e: Event) {
      const detail: unknown = (e as CustomEvent).detail;
      if (!detail || typeof detail !== "object" || Array.isArray(detail)) return;
      const selection = detail as Record<string, unknown>;
      const newMedia = mediaItems(selection.images, selection.galleryVideos);
      if (newMedia.length > 0) {
        setActiveMediaItems(newMedia);
        setActiveIndex(selectedMediaIndex(newMedia, selection.selectedImage));
        if (typeof selection.name === "string" && selection.name.trim()) setActiveName(selection.name.trim());
        const selectedProduct = selection.product;
        if (selectedProduct && typeof selectedProduct === "object" && !Array.isArray(selectedProduct)) {
          const slug = (selectedProduct as Record<string, unknown>).slug;
          if (typeof slug === "string" && colourThumbnails?.some(item => item.slug === slug)) setActiveProductSlug(slug);
        }
      }
    }
    window.addEventListener('combo-selected', handleComboSelected);
    return () => window.removeEventListener('combo-selected', handleComboSelected);
  }, [colourThumbnails]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const galleryMainRef = useRef<HTMLDivElement>(null);
  const galleryImageRef = useRef<HTMLImageElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef(false);

  const active = activeMediaItems[activeIndex] ?? { type: "image" as const, url: "/images/products/mini-5.jpg" };

  useEffect(() => {
    const video = videoRef.current;
    if (active.type === "video" && video) {
      video.load();
      video.play().catch(() => {});
    }
    return () => {
      video?.pause();
    };
  }, [activeIndex, active.type, active.url]);

  const goTo = useCallback(
    (index: number, dir: "left" | "right") => {
      if (index === activeIndex || activeMediaItems.length <= 1) return;
      setSwipeDir(dir);
      setAnimKey((k) => k + 1); // triggers animation restart on wrapper
      setActiveIndex(index);
    },
    [activeIndex, activeMediaItems.length]
  );

  function handleSelect(index: number) {
    goTo(index, index > activeIndex ? "left" : "right");
  }

  // ── Touch handlers ──────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  }

  function onTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      isDragging.current = true;
      e.preventDefault();
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (!isDragging.current || Math.abs(dx) < 40) return;

    if (dx < 0) {
      goTo((activeIndex + 1) % activeMediaItems.length, "left");
    } else {
      goTo((activeIndex - 1 + activeMediaItems.length) % activeMediaItems.length, "right");
    }
    isDragging.current = false;
  }

  const thumbnails: GalleryThumbnail[] = colourThumbnails?.length
    ? colourThumbnails.map(item => ({ type: "image", url: item.image, key: item.slug, productSlug: item.slug, name: item.name, mediaIndex: activeMediaItems.findIndex(media => media.type === "image" && media.url === item.image) }))
    : activeMediaItems.map((item, index) => ({ ...item, key: `${item.url}-${index}`, mediaIndex: index }));

  function selectThumbnail(item: GalleryThumbnail) {
    if (item.mediaIndex < 0) return;
    handleSelect(item.mediaIndex);
    if (item.productSlug) {
      setActiveProductSlug(item.productSlug);
      if (item.name) setActiveName(item.name);
      window.dispatchEvent(new CustomEvent('colour-thumbnail-selected', { detail: { slug: item.productSlug } }));
    }
  }

  const animClass = swipeDir === "left" ? "gallery-img-anim-left" : "gallery-img-anim-right";

  return (
    <section className={utilities("detail-gallery", [411, "[:where(&).detail-gallery]:[border:1px_solid_var(--line)] [:where(&).detail-gallery]:[border-radius:8px] [:where(&).detail-gallery]:[padding:10px] [:where(&).detail-gallery]:flex [:where(&).detail-gallery]:flex-col [:where(&).detail-gallery]:[gap:10px]"], [548, "[@media_(max-width:_720px)]:[:where(&).detail-gallery]:[order:1] [@media_(max-width:_720px)]:[:where(&).detail-gallery]:[width:100%] [@media_(max-width:_720px)]:[:where(&).detail-gallery]:[min-width:0]"], [2144, "[.product-detail-layout_:where(&).detail-gallery]:[border:1px_solid_var(--line)] [.product-detail-layout_:where(&).detail-gallery]:[border-radius:8px] [.product-detail-layout_:where(&).detail-gallery]:[background:#fff] [.product-detail-layout_:where(&).detail-gallery]:[padding:12px] [.product-detail-layout_:where(&).detail-gallery]:flex [.product-detail-layout_:where(&).detail-gallery]:flex-col [.product-detail-layout_:where(&).detail-gallery]:[gap:10px]"], [2210, "[@media_(max-width:850px)]:[.product-detail-layout_:where(&).detail-gallery,_:where(&).detail-gallery]:[min-width:0] [@media_(max-width:850px)]:[.product-detail-layout_:where(&).detail-gallery,_:where(&).detail-gallery]:[width:calc(100%_+_28px)] [@media_(max-width:850px)]:[.product-detail-layout_:where(&).detail-gallery,_:where(&).detail-gallery]:[margin-inline:-14px] [@media_(max-width:850px)]:[.product-detail-layout_:where(&).detail-gallery,_:where(&).detail-gallery]:[border-radius:0] [@media_(max-width:850px)]:[.product-detail-layout_:where(&).detail-gallery,_:where(&).detail-gallery]:[border-left:none] [@media_(max-width:850px)]:[.product-detail-layout_:where(&).detail-gallery,_:where(&).detail-gallery]:[border-right:none] [@media_(max-width:850px)]:[.product-detail-layout_:where(&).detail-gallery,_:where(&).detail-gallery]:[padding:0] [@media_(max-width:850px)]:[.product-detail-layout_:where(&).detail-gallery,_:where(&).detail-gallery]:[background:#eef2f6] [@media_(max-width:850px)]:[.product-detail-layout_:where(&).detail-gallery,_:where(&).detail-gallery]:box-border"], [10001, "[@media_(max-width:720px)]:[.product-detail-layout_:where(&).detail-gallery]:[width:calc(100%_+_28px)]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).detail-gallery]:[margin-inline:-14px]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).detail-gallery]:[border:0]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).detail-gallery]:[border-radius:0]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).detail-gallery]:[padding:0]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).detail-gallery]:[background:#fff]!"])}>
      {/* Main viewer */}
      <div
        className={utilities("gallery-main", [412, "[:where(&).gallery-main]:[height:410px] [:where(&).gallery-main]:grid [:where(&).gallery-main]:[place-items:center] [:where(&).gallery-main]:[background:#fbfcfe] [:where(&).gallery-main]:overflow-hidden [:where(&).gallery-main]:relative [:where(&).gallery-main]:[z-index:0] [:where(&).gallery-main]:[flex-shrink:0]"], [413, "[:where(&).gallery-main_img]:[width:100%] [:where(&).gallery-main_img]:[height:100%] [:where(&).gallery-main_img]:object-cover [:where(&).gallery-main_img]:[object-position:center]"], [2145, "[.product-detail-layout_:where(&).gallery-main]:[width:100%] [.product-detail-layout_:where(&).gallery-main]:[aspect-ratio:1_/_1] [.product-detail-layout_:where(&).gallery-main]:[flex-shrink:0] [.product-detail-layout_:where(&).gallery-main]:[background:#fbfcfe] [.product-detail-layout_:where(&).gallery-main]:[border-radius:6px] [.product-detail-layout_:where(&).gallery-main]:flex [.product-detail-layout_:where(&).gallery-main]:items-center [.product-detail-layout_:where(&).gallery-main]:justify-center [.product-detail-layout_:where(&).gallery-main]:overflow-hidden"], [2146, "[.product-detail-layout_:where(&).gallery-main_img]:[width:100%] [.product-detail-layout_:where(&).gallery-main_img]:[height:100%] [.product-detail-layout_:where(&).gallery-main_img]:object-cover [.product-detail-layout_:where(&).gallery-main_img]:[object-position:center] [.product-detail-layout_:where(&).gallery-main_img]:block"], [2212, "[@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:[width:calc(100%_+_32px)]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:relative! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:[margin-inline:-16px]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:[max-width:none]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:[height:280px]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:[aspect-ratio:unset]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:[border-radius:0]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:[background:#fbfcfe]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:[box-shadow:none]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:[padding:0]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:box-border! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main,_:where(&).gallery-main]:overflow-hidden!"], [2213, "[@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_img,_:where(&).gallery-main_img]:absolute! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_img,_:where(&).gallery-main_img]:[inset:0]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_img,_:where(&).gallery-main_img]:[width:100%]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_img,_:where(&).gallery-main_img]:[height:100%]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_img,_:where(&).gallery-main_img]:object-contain! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_img,_:where(&).gallery-main_img]:[object-position:center]!"], [2214, "[@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_video,_:where(&).gallery-main_video]:absolute! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_video,_:where(&).gallery-main_video]:[inset:0]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_video,_:where(&).gallery-main_video]:[width:100%]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_video,_:where(&).gallery-main_video]:[height:100%]! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_video,_:where(&).gallery-main_video]:object-cover! [@media_(max-width:850px)]:[.product-detail-layout_:where(&).gallery-main_video,_:where(&).gallery-main_video]:[object-position:center]!"], [10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:relative"], [10001, "[@media_(max-width:720px)]:[.product-detail-layout_:where(&).gallery-main]:[width:100%]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).gallery-main]:[margin-inline:0]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).gallery-main]:[height:auto]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).gallery-main]:[aspect-ratio:3_/_4]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).gallery-main_img]:object-cover!"])}
        
        ref={galleryMainRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/*
          key is on the WRAPPER div, not the Image/video.
          This lets Next.js Image keep its internal state (no remount = no blank flash),
          while the wrapper's animation class restarts cleanly on each swipe.
        */}
        <div key={animKey} className={tw(`gallery-media-wrapper ${animClass}`)}>
          {active.type === "image" ? (
            <Image
              ref={galleryImageRef}
              src={active.url}
              alt={activeName}
              fill
              sizes="(max-width: 760px) 100vw, (max-width: 1288px) 48vw, 600px"
              quality={72}
              loading="eager"
              fetchPriority={activeIndex === 0 ? "high" : "auto"}
              className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:object-contain [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[object-position:center]"])}
            />
          ) : (
            <video
              ref={videoRef}
              src={active.url}
              muted
              autoPlay
              loop
              playsInline
              controls={false}
              className={utilities("gallery-video-main", [414, "[:where(&).gallery-video-main]:[width:100%] [:where(&).gallery-video-main]:[height:100%] [:where(&).gallery-video-main]:object-cover [:where(&).gallery-video-main]:block [:where(&).gallery-video-main]:[border-radius:4px]"], [2147, "[.product-detail-layout_:where(&).gallery-video-main]:[width:100%] [.product-detail-layout_:where(&).gallery-video-main]:[height:100%] [.product-detail-layout_:where(&).gallery-video-main]:object-cover [.product-detail-layout_:where(&).gallery-video-main]:block [.product-detail-layout_:where(&).gallery-video-main]:[border-radius:4px]"])}
            />
          )}
        </div>

        <ProductHoverZoom container={galleryMainRef} image={galleryImageRef} src={active.type === "image" ? active.url : null} name={activeName} />

        {Boolean(colourThumbnails?.length) && activeMediaItems.length > 1 && <>
          <button type="button" aria-label="Previous product photo" className="absolute! left-2 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 bg-white/85 text-slate-800 shadow" onClick={() => goTo((activeIndex - 1 + activeMediaItems.length) % activeMediaItems.length, "right")}><ChevronLeft size={20} /></button>
          <button type="button" aria-label="Next product photo" className="absolute! right-2 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 bg-white/85 text-slate-800 shadow" onClick={() => goTo((activeIndex + 1) % activeMediaItems.length, "left")}><ChevronRight size={20} /></button>
        </>}

        {/* Dot indicators */}
        {activeMediaItems.length > 1 && (
          <div className={utilities("gallery-dots", [2153, "[:where(&).gallery-dots]:absolute [:where(&).gallery-dots]:[bottom:10px] [:where(&).gallery-dots]:[left:50%] [:where(&).gallery-dots]:[transform:translateX(-50%)] [:where(&).gallery-dots]:flex [:where(&).gallery-dots]:[gap:6px] [:where(&).gallery-dots]:[z-index:10] [:where(&).gallery-dots]:pointer-events-none"])} aria-hidden="true">
            {activeMediaItems.map((_, i) => (
              <span key={i} className={tw(`gallery-dot${i === activeIndex ? " active" : ""}`)} />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails strip */}
      {thumbnails.length > 0 && (
        <div className={utilities("gallery-thumbs", [415, "[:where(&).gallery-thumbs]:flex [:where(&).gallery-thumbs]:[gap:8px] [:where(&).gallery-thumbs]:[flex-shrink:0] [:where(&).gallery-thumbs]:flex-wrap [:where(&).gallery-thumbs]:[margin-top:0]"], [416, "[:where(&).gallery-thumbs_button]:[width:62px] [:where(&).gallery-thumbs_button]:[height:57px] [:where(&).gallery-thumbs_button]:[background:#fff] [:where(&).gallery-thumbs_button]:[border:1px_solid_var(--line)] [:where(&).gallery-thumbs_button]:[border-radius:4px] [:where(&).gallery-thumbs_button]:[padding:4px] [:where(&).gallery-thumbs_button]:cursor-pointer [:where(&).gallery-thumbs_button]:[transition:border-color_.15s] [:where(&).gallery-thumbs_button]:[flex-shrink:0]"], [418, "[:where(&).gallery-thumbs_img]:[width:100%] [:where(&).gallery-thumbs_img]:[height:100%] [:where(&).gallery-thumbs_img]:object-contain [:where(&).gallery-thumbs_img]:[mix-blend-mode:multiply]"], [2113, "[.product-detail-layout_:where(&).gallery-thumbs]:[background:#f5f5f5]"], [2148, "[:is(.product-detail-layout_:where(&).gallery-thumbs)]:[flex-shrink:0] [:is(.product-detail-layout_:where(&).gallery-thumbs)]:flex [:is(.product-detail-layout_:where(&).gallery-thumbs)]:[gap:8px] [:is(.product-detail-layout_:where(&).gallery-thumbs)]:flex-wrap [:is(.product-detail-layout_:where(&).gallery-thumbs)]:[margin-top:0]"], [2215, "[@media_(max-width:850px)]:[:where(&).gallery-thumbs]:[padding:4px] [@media_(max-width:850px)]:[:where(&).gallery-thumbs]:overflow-x-auto [@media_(max-width:850px)]:[:where(&).gallery-thumbs]:[scrollbar-width:none]"], [10001, "[@media_(max-width:720px)]:[.product-detail-layout_:where(&).gallery-thumbs]:flex-nowrap! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).gallery-thumbs]:[padding:0_8px_8px]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).gallery-thumbs]:[background:#fff]! [@media_(max-width:720px)]:[.product-detail-layout_:where(&).gallery-thumbs]:[max-width:100%]!"])}>
          {thumbnails.map(item => (
            <button
              key={item.key}
              type="button"
              className={tw((item.productSlug ? activeProductSlug === item.productSlug : activeIndex === item.mediaIndex) ? "selected" : "")}
              onClick={() => selectThumbnail(item)}
              aria-label={item.productSlug ? `View colour ${item.name}` : `View ${item.type} ${item.mediaIndex + 1} of ${activeName}`}
              aria-pressed={item.productSlug ? activeProductSlug === item.productSlug : activeIndex === item.mediaIndex}
            >
              {item.type === "image" ? (
                <Image src={item.url} alt="" width={80} height={80} sizes="80px" quality={72} />
              ) : (
                <span className={utilities("gallery-video-thumb", [419, "[:where(&).gallery-video-thumb]:[width:100%] [:where(&).gallery-video-thumb]:[height:100%] [:where(&).gallery-video-thumb]:flex [:where(&).gallery-video-thumb]:items-center [:where(&).gallery-video-thumb]:justify-center [:where(&).gallery-video-thumb]:[background:#0b1730] [:where(&).gallery-video-thumb]:[border-radius:2px] [:where(&).gallery-video-thumb]:[color:#fff]"])}>
                  <PlayCircle size={22} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
