"use client";
import { utilities } from "@/lib/tailwind";


import { useState, useRef, useEffect } from "react";
import { X, User, Mail, Phone, Globe, Building2, Target, MessageSquare, Send } from "lucide-react";
import Image from "next/image";
import { apiRequest, getApiBase } from "@/lib/api";

export type InquiryProduct = {
  slug: string;
  name: string;
  image?: string;
  tagline?: string;
};

const INTENDED_USE_OPTIONS = [
  "Agriculture & Crop Spraying",
  "Surveying & Mapping",
  "Search & Rescue",
  "Industrial Inspection",
  "Construction & Infrastructure",
  "Mining & Quarrying",
  "Forestry & Environmental Monitoring",
  "Security & Surveillance",
  "Government & Defense",
  "Research & Education",
  "Other",
];

const COUNTRIES = [
  "Bangladesh", "India", "Pakistan", "Sri Lanka", "Nepal", "Bhutan", "Maldives",
  "China", "Japan", "South Korea", "Singapore", "Malaysia", "Thailand", "Vietnam",
  "Indonesia", "Philippines", "United Arab Emirates", "Saudi Arabia", "Qatar",
  "United Kingdom", "United States", "Canada", "Australia", "Germany", "France",
  "Other",
];

export default function InquiryModal({
  product,
  onClose,
}: {
  product: InquiryProduct;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Bangladesh");
  const [company, setCompany] = useState("");
  const [intendedUse, setIntendedUse] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const backdropRef = useRef<HTMLDivElement>(null);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // ESC key closes modal
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!agreed) { setErrorMsg("Please agree to be contacted before submitting."); return; }
    setBusy(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      if (!getApiBase()) throw new Error("Backend API is not configured. Please contact us directly.");
      const result = await apiRequest<{ message?: string }>("/inquiries", {
        method: "POST",
        body: JSON.stringify({
          productSlug: product.slug,
          productName: product.name,
          productImage: product.image || "",
          name, email, phone, country, company, intendedUse, message,
        }),
      });
      setSuccessMsg(result.message || "Your inquiry has been submitted. Our team will contact you soon.");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to submit inquiry. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      ref={backdropRef}
      className={utilities("inquiry-modal-backdrop", [2934, "[:where(&).inquiry-modal-backdrop]:fixed [:where(&).inquiry-modal-backdrop]:[inset:0] [:where(&).inquiry-modal-backdrop]:[background:rgba(11,_31,_56,_0.72)] [:where(&).inquiry-modal-backdrop]:[z-index:9000] [:where(&).inquiry-modal-backdrop]:flex [:where(&).inquiry-modal-backdrop]:items-center [:where(&).inquiry-modal-backdrop]:justify-center [:where(&).inquiry-modal-backdrop]:[padding:16px] [:where(&).inquiry-modal-backdrop]:[backdrop-filter:blur(3px)] [:where(&).inquiry-modal-backdrop]:animate-[inquiryFadeIn_0.22s_ease]"])}
      role="presentation"
      onMouseDown={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div
        className={utilities("inquiry-modal", [2935, "[:where(&).inquiry-modal]:[background:#fff] [:where(&).inquiry-modal]:[border-radius:16px] [:where(&).inquiry-modal]:[width:100%] [:where(&).inquiry-modal]:[max-width:680px] [:where(&).inquiry-modal]:[max-height:92vh] [:where(&).inquiry-modal]:overflow-y-auto [:where(&).inquiry-modal]:relative [:where(&).inquiry-modal]:[box-shadow:0_32px_80px_rgba(11,_31,_56,_0.32),_0_8px_24px_rgba(11,_31,_56,_0.18)] [:where(&).inquiry-modal]:animate-[inquirySlideUp_0.28s_cubic-bezier(0.34,_1.56,_0.64,_1)]"])}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-modal-title"
      >
        {/* Close button */}
        <button type="button" className={utilities("inquiry-modal-close", [2936, "[:where(&).inquiry-modal-close]:absolute [:where(&).inquiry-modal-close]:[top:14px] [:where(&).inquiry-modal-close]:[right:14px] [:where(&).inquiry-modal-close]:[width:36px] [:where(&).inquiry-modal-close]:[height:36px] [:where(&).inquiry-modal-close]:[border-radius:50%] [:where(&).inquiry-modal-close]:[border:1.5px_solid_rgba(255,_255,_255,_0.45)] [:where(&).inquiry-modal-close]:[background:rgba(11,_31,_56,_0.55)] [:where(&).inquiry-modal-close]:[color:#fff] [:where(&).inquiry-modal-close]:grid [:where(&).inquiry-modal-close]:[place-items:center] [:where(&).inquiry-modal-close]:cursor-pointer [:where(&).inquiry-modal-close]:[z-index:20] [:where(&).inquiry-modal-close]:[transition:background_0.15s_ease,_border-color_0.15s_ease] [:where(&).inquiry-modal-close]:[backdrop-filter:blur(4px)] [:where(&).inquiry-modal-close]:[box-shadow:0_2px_8px_rgba(0,_0,_0,_0.35)]"], [2937, "[:where(&).inquiry-modal-close:hover]:[background:rgba(11,_31,_56,_0.85)] [:where(&).inquiry-modal-close:hover]:[border-color:rgba(255,_255,_255,_0.7)]"])} onClick={onClose} aria-label="Close inquiry form">
          <X size={20} />
        </button>

        {/* Header */}
        <div className={utilities("inquiry-modal-header", [2938, "[:where(&).inquiry-modal-header]:flex [:where(&).inquiry-modal-header]:items-start [:where(&).inquiry-modal-header]:[gap:16px] [:where(&).inquiry-modal-header]:[padding:28px_28px_24px] [:where(&).inquiry-modal-header]:[background:linear-gradient(135deg,_#0b1f38_0%,_#1a3a5c_100%)] [:where(&).inquiry-modal-header]:[border-radius:16px_16px_0_0] [:where(&).inquiry-modal-header]:[color:#fff]"], [2977, "[@media_(max-width:_600px)]:[:where(&).inquiry-modal-header]:flex-col [@media_(max-width:_600px)]:[:where(&).inquiry-modal-header]:[padding:22px_20px_18px]"])}>
          <div className={utilities("inquiry-modal-header-text", [2939, "[:where(&).inquiry-modal-header-text]:[flex:1] [:where(&).inquiry-modal-header-text]:[min-width:0]"])}>
            <div className={utilities("inquiry-modal-logo", [2940, "[:where(&).inquiry-modal-logo]:[margin-bottom:12px] [:where(&).inquiry-modal-logo]:[opacity:0.92] [:where(&).inquiry-modal-logo]:[filter:brightness(0)_invert(1)]"])}>
              <Image src="/images/logo/sarker-fabrics.svg" alt="Sarker Fabrics" width={140} height={46} quality={80} />
            </div>
            <h2 id="inquiry-modal-title" className={utilities("inquiry-modal-product-name", [2941, "[:where(&).inquiry-modal-product-name]:[font-size:22px] [:where(&).inquiry-modal-product-name]:font-bold [:where(&).inquiry-modal-product-name]:[margin:0_0_4px] [:where(&).inquiry-modal-product-name]:[line-height:1.2] [:where(&).inquiry-modal-product-name]:[color:#fff]"], [2982, "[@media_(max-width:_600px)]:[:where(&).inquiry-modal-product-name]:[font-size:18px]"])}>{product.name}</h2>
            <p className={utilities("inquiry-modal-tagline", [2942, "[:where(&).inquiry-modal-tagline]:[font-size:13px] [:where(&).inquiry-modal-tagline]:[color:#94b4d4] [:where(&).inquiry-modal-tagline]:[margin:0_0_6px]"])}>{product.tagline || "Powerful. Reliable. Built for a bigger tomorrow."}</p>
            <p className={utilities("inquiry-modal-subtitle", [2943, "[:where(&).inquiry-modal-subtitle]:[font-size:13px] [:where(&).inquiry-modal-subtitle]:[color:#7a9bbc] [:where(&).inquiry-modal-subtitle]:[margin:0] [:where(&).inquiry-modal-subtitle]:[line-height:1.5]"])}>Get in touch with our team for pricing, availability and more information.</p>
          </div>
          {product.image && (
            <div className={utilities("inquiry-modal-product-image", [2944, "[:where(&).inquiry-modal-product-image]:[flex-shrink:0] [:where(&).inquiry-modal-product-image]:[width:160px] [:where(&).inquiry-modal-product-image]:flex [:where(&).inquiry-modal-product-image]:items-center [:where(&).inquiry-modal-product-image]:justify-center [:where(&).inquiry-modal-product-image]:relative [:where(&).inquiry-modal-product-image]:[border-radius:10px] [:where(&).inquiry-modal-product-image]:overflow-hidden"], [2945, "[:where(&).inquiry-modal-product-image::before]:[content:''] [:where(&).inquiry-modal-product-image::before]:absolute [:where(&).inquiry-modal-product-image::before]:[inset:0] [:where(&).inquiry-modal-product-image::before]:[background:linear-gradient(135deg,_rgba(11,_31,_56,_0.22)_0%,_rgba(11,_31,_56,_0.08)_50%,_rgba(11,_31,_56,_0.38)_100%)] [:where(&).inquiry-modal-product-image::before]:[border-radius:10px] [:where(&).inquiry-modal-product-image::before]:[z-index:1] [:where(&).inquiry-modal-product-image::before]:pointer-events-none"], [2946, "[:where(&).inquiry-modal-product-image_img]:relative [:where(&).inquiry-modal-product-image_img]:[z-index:0] [:where(&).inquiry-modal-product-image_img]:[filter:drop-shadow(0_4px_16px_rgba(0,_0,_0,_0.35))]"], [2978, "[@media_(max-width:_600px)]:[:where(&).inquiry-modal-product-image]:[width:100%] [@media_(max-width:_600px)]:[:where(&).inquiry-modal-product-image]:justify-end [@media_(max-width:_600px)]:[:where(&).inquiry-modal-product-image]:[margin-top:-60px] [@media_(max-width:_600px)]:[:where(&).inquiry-modal-product-image]:[align-self:flex-end]"], [2979, "[@media_(max-width:_600px)]:[:where(&).inquiry-modal-product-image_img]:[max-width:120px]"])}>
              <Image src={product.image} alt={product.name} width={180} height={140} quality={80} className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:object-contain"])} />
              <div className={utilities("inquiry-modal-image-overlay", [2947, "[:where(&).inquiry-modal-image-overlay]:absolute [:where(&).inquiry-modal-image-overlay]:[inset:0] [:where(&).inquiry-modal-image-overlay]:[background:rgba(0,_0,_0,_0.28)] [:where(&).inquiry-modal-image-overlay]:[z-index:1] [:where(&).inquiry-modal-image-overlay]:pointer-events-none [:where(&).inquiry-modal-image-overlay]:[border-radius:10px]"])} />
            </div>
          )}
        </div>

        {/* Body */}
        <div className={utilities("inquiry-modal-body", [2948, "[:where(&).inquiry-modal-body]:[padding:24px_28px_28px]"], [2980, "[@media_(max-width:_600px)]:[:where(&).inquiry-modal-body]:[padding:18px_16px_22px]"])}>
          {successMsg ? (
            <div className={utilities("inquiry-success", [2971, "[:where(&).inquiry-success]:flex [:where(&).inquiry-success]:flex-col [:where(&).inquiry-success]:items-center [:where(&).inquiry-success]:text-center [:where(&).inquiry-success]:[padding:32px_16px] [:where(&).inquiry-success]:[gap:12px]"], [2973, "[:where(&).inquiry-success_h3]:[font-size:20px] [:where(&).inquiry-success_h3]:font-bold [:where(&).inquiry-success_h3]:[color:#0b1f38] [:where(&).inquiry-success_h3]:[margin:0]"], [2974, "[:where(&).inquiry-success_p]:[color:#4b5563] [:where(&).inquiry-success_p]:[font-size:14px] [:where(&).inquiry-success_p]:[margin:0] [:where(&).inquiry-success_p]:[max-width:400px] [:where(&).inquiry-success_p]:[line-height:1.6]"])}>
              <div className={utilities("inquiry-success-icon", [2972, "[:where(&).inquiry-success-icon]:[width:60px] [:where(&).inquiry-success-icon]:[height:60px] [:where(&).inquiry-success-icon]:[background:linear-gradient(135deg,_#0b1f38,_#1a3a5c)] [:where(&).inquiry-success-icon]:[color:#fff] [:where(&).inquiry-success-icon]:[border-radius:50%] [:where(&).inquiry-success-icon]:grid [:where(&).inquiry-success-icon]:[place-items:center] [:where(&).inquiry-success-icon]:[font-size:24px] [:where(&).inquiry-success-icon]:font-bold"])}>✓</div>
              <h3>Inquiry Submitted!</h3>
              <p>{successMsg}</p>
              <button type="button" className={utilities("inquiry-btn-primary", [2975, "[.inquiry-success_:where(&).inquiry-btn-primary]:[margin-top:8px] [.inquiry-success_:where(&).inquiry-btn-primary]:[padding:10px_28px] [.inquiry-success_:where(&).inquiry-btn-primary]:[background:#0b1f38] [.inquiry-success_:where(&).inquiry-btn-primary]:[color:#fff] [.inquiry-success_:where(&).inquiry-btn-primary]:[border:0] [.inquiry-success_:where(&).inquiry-btn-primary]:[border-radius:8px] [.inquiry-success_:where(&).inquiry-btn-primary]:[font-size:14px] [.inquiry-success_:where(&).inquiry-btn-primary]:font-semibold [.inquiry-success_:where(&).inquiry-btn-primary]:cursor-pointer [.inquiry-success_:where(&).inquiry-btn-primary]:[transition:background_0.18s_ease]"], [2976, "[.inquiry-success_:where(&).inquiry-btn-primary:hover]:[background:#162d50]"])} onClick={onClose}>Close</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className={utilities("inquiry-section-label", [2949, "[:where(&).inquiry-section-label]:flex [:where(&).inquiry-section-label]:items-center [:where(&).inquiry-section-label]:[gap:8px] [:where(&).inquiry-section-label]:[font-size:15px] [:where(&).inquiry-section-label]:font-bold [:where(&).inquiry-section-label]:[color:#0b1f38] [:where(&).inquiry-section-label]:[margin:0_0_18px] [:where(&).inquiry-section-label]:[padding-bottom:10px] [:where(&).inquiry-section-label]:[border-bottom:2px_solid_#edf2f7]"])}>
                <User size={16} />
                Your Information
              </div>

              <div className={utilities("inquiry-form-grid", [2950, "[:where(&).inquiry-form-grid]:grid [:where(&).inquiry-form-grid]:[grid-template-columns:1fr_1fr] [:where(&).inquiry-form-grid]:[gap:14px] [:where(&).inquiry-form-grid]:[margin-bottom:14px]"], [2981, "[@media_(max-width:_600px)]:[:where(&).inquiry-form-grid]:[grid-template-columns:1fr]"])}>
                <label className={utilities("inquiry-field", [2951, "[:where(&).inquiry-field]:flex [:where(&).inquiry-field]:flex-col [:where(&).inquiry-field]:[gap:5px] [:where(&).inquiry-field]:[font-size:13px] [:where(&).inquiry-field]:font-semibold [:where(&).inquiry-field]:[color:#374151]"], [2952, "[:where(&).inquiry-field_em]:[color:#e53e3e] [:where(&).inquiry-field_em]:not-italic"], [2961, "[.inquiry-message-section_:where(&).inquiry-field_span]:flex [.inquiry-message-section_:where(&).inquiry-field_span]:items-center [.inquiry-message-section_:where(&).inquiry-field_span]:[gap:6px]"], [2962, "[:where(&).inquiry-field_textarea]:[width:100%] [:where(&).inquiry-field_textarea]:[padding:12px] [:where(&).inquiry-field_textarea]:[border:1.5px_solid_#d1d9e6] [:where(&).inquiry-field_textarea]:[border-radius:8px] [:where(&).inquiry-field_textarea]:[font-size:14px] [:where(&).inquiry-field_textarea]:[color:#1a2233] [:where(&).inquiry-field_textarea]:[background:#f9fafc] [:where(&).inquiry-field_textarea]:[outline:none] [:where(&).inquiry-field_textarea]:[resize:vertical] [:where(&).inquiry-field_textarea]:[font-family:inherit] [:where(&).inquiry-field_textarea]:[transition:border-color_0.18s_ease] [:where(&).inquiry-field_textarea]:box-border [:where(&).inquiry-field_textarea]:[min-height:100px]"], [2963, "[:where(&).inquiry-field_textarea:focus]:[border-color:#0b1f38] [:where(&).inquiry-field_textarea:focus]:[background:#fff]"])}>
                  <span>Full Name <em>*</em></span>
                  <div className={utilities("inquiry-input-wrap", [2955, "[:where(&).inquiry-input-wrap]:relative [:where(&).inquiry-input-wrap]:flex [:where(&).inquiry-input-wrap]:items-center"], [2956, "[:where(&).inquiry-input-wrap_svg]:absolute [:where(&).inquiry-input-wrap_svg]:[left:12px] [:where(&).inquiry-input-wrap_svg]:[color:#9ca3af] [:where(&).inquiry-input-wrap_svg]:[flex-shrink:0] [:where(&).inquiry-input-wrap_svg]:pointer-events-none"], [2957, "[:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[width:100%] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[height:42px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[padding:0_12px_0_36px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[border:1.5px_solid_#d1d9e6] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[border-radius:8px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[font-size:14px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[color:#1a2233] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[background:#f9fafc] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[outline:none] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[transition:border-color_0.18s_ease,_background_0.18s_ease] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:box-border [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[-webkit-appearance:none] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[appearance:none]"], [2958, "[:where(&).inquiry-input-wrap_input:focus,_:where(&).inquiry-input-wrap_select:focus]:[border-color:#0b1f38] [:where(&).inquiry-input-wrap_input:focus,_:where(&).inquiry-input-wrap_select:focus]:[background:#fff]"])}>
                    <User size={15} />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      maxLength={120}
                      autoComplete="name"
                    />
                  </div>
                </label>

                <label className={utilities("inquiry-field", [2951, "[:where(&).inquiry-field]:flex [:where(&).inquiry-field]:flex-col [:where(&).inquiry-field]:[gap:5px] [:where(&).inquiry-field]:[font-size:13px] [:where(&).inquiry-field]:font-semibold [:where(&).inquiry-field]:[color:#374151]"], [2952, "[:where(&).inquiry-field_em]:[color:#e53e3e] [:where(&).inquiry-field_em]:not-italic"], [2961, "[.inquiry-message-section_:where(&).inquiry-field_span]:flex [.inquiry-message-section_:where(&).inquiry-field_span]:items-center [.inquiry-message-section_:where(&).inquiry-field_span]:[gap:6px]"], [2962, "[:where(&).inquiry-field_textarea]:[width:100%] [:where(&).inquiry-field_textarea]:[padding:12px] [:where(&).inquiry-field_textarea]:[border:1.5px_solid_#d1d9e6] [:where(&).inquiry-field_textarea]:[border-radius:8px] [:where(&).inquiry-field_textarea]:[font-size:14px] [:where(&).inquiry-field_textarea]:[color:#1a2233] [:where(&).inquiry-field_textarea]:[background:#f9fafc] [:where(&).inquiry-field_textarea]:[outline:none] [:where(&).inquiry-field_textarea]:[resize:vertical] [:where(&).inquiry-field_textarea]:[font-family:inherit] [:where(&).inquiry-field_textarea]:[transition:border-color_0.18s_ease] [:where(&).inquiry-field_textarea]:box-border [:where(&).inquiry-field_textarea]:[min-height:100px]"], [2963, "[:where(&).inquiry-field_textarea:focus]:[border-color:#0b1f38] [:where(&).inquiry-field_textarea:focus]:[background:#fff]"])}>
                  <span>Email Address <em>*</em></span>
                  <div className={utilities("inquiry-input-wrap", [2955, "[:where(&).inquiry-input-wrap]:relative [:where(&).inquiry-input-wrap]:flex [:where(&).inquiry-input-wrap]:items-center"], [2956, "[:where(&).inquiry-input-wrap_svg]:absolute [:where(&).inquiry-input-wrap_svg]:[left:12px] [:where(&).inquiry-input-wrap_svg]:[color:#9ca3af] [:where(&).inquiry-input-wrap_svg]:[flex-shrink:0] [:where(&).inquiry-input-wrap_svg]:pointer-events-none"], [2957, "[:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[width:100%] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[height:42px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[padding:0_12px_0_36px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[border:1.5px_solid_#d1d9e6] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[border-radius:8px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[font-size:14px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[color:#1a2233] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[background:#f9fafc] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[outline:none] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[transition:border-color_0.18s_ease,_background_0.18s_ease] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:box-border [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[-webkit-appearance:none] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[appearance:none]"], [2958, "[:where(&).inquiry-input-wrap_input:focus,_:where(&).inquiry-input-wrap_select:focus]:[border-color:#0b1f38] [:where(&).inquiry-input-wrap_input:focus,_:where(&).inquiry-input-wrap_select:focus]:[background:#fff]"])}>
                    <Mail size={15} />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      maxLength={180}
                      autoComplete="email"
                    />
                  </div>
                </label>

                <label className={utilities("inquiry-field", [2951, "[:where(&).inquiry-field]:flex [:where(&).inquiry-field]:flex-col [:where(&).inquiry-field]:[gap:5px] [:where(&).inquiry-field]:[font-size:13px] [:where(&).inquiry-field]:font-semibold [:where(&).inquiry-field]:[color:#374151]"], [2952, "[:where(&).inquiry-field_em]:[color:#e53e3e] [:where(&).inquiry-field_em]:not-italic"], [2961, "[.inquiry-message-section_:where(&).inquiry-field_span]:flex [.inquiry-message-section_:where(&).inquiry-field_span]:items-center [.inquiry-message-section_:where(&).inquiry-field_span]:[gap:6px]"], [2962, "[:where(&).inquiry-field_textarea]:[width:100%] [:where(&).inquiry-field_textarea]:[padding:12px] [:where(&).inquiry-field_textarea]:[border:1.5px_solid_#d1d9e6] [:where(&).inquiry-field_textarea]:[border-radius:8px] [:where(&).inquiry-field_textarea]:[font-size:14px] [:where(&).inquiry-field_textarea]:[color:#1a2233] [:where(&).inquiry-field_textarea]:[background:#f9fafc] [:where(&).inquiry-field_textarea]:[outline:none] [:where(&).inquiry-field_textarea]:[resize:vertical] [:where(&).inquiry-field_textarea]:[font-family:inherit] [:where(&).inquiry-field_textarea]:[transition:border-color_0.18s_ease] [:where(&).inquiry-field_textarea]:box-border [:where(&).inquiry-field_textarea]:[min-height:100px]"], [2963, "[:where(&).inquiry-field_textarea:focus]:[border-color:#0b1f38] [:where(&).inquiry-field_textarea:focus]:[background:#fff]"])}>
                  <span>Phone Number <em>*</em></span>
                  <div className={utilities("inquiry-input-wrap", [2955, "[:where(&).inquiry-input-wrap]:relative [:where(&).inquiry-input-wrap]:flex [:where(&).inquiry-input-wrap]:items-center"], [2956, "[:where(&).inquiry-input-wrap_svg]:absolute [:where(&).inquiry-input-wrap_svg]:[left:12px] [:where(&).inquiry-input-wrap_svg]:[color:#9ca3af] [:where(&).inquiry-input-wrap_svg]:[flex-shrink:0] [:where(&).inquiry-input-wrap_svg]:pointer-events-none"], [2957, "[:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[width:100%] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[height:42px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[padding:0_12px_0_36px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[border:1.5px_solid_#d1d9e6] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[border-radius:8px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[font-size:14px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[color:#1a2233] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[background:#f9fafc] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[outline:none] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[transition:border-color_0.18s_ease,_background_0.18s_ease] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:box-border [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[-webkit-appearance:none] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[appearance:none]"], [2958, "[:where(&).inquiry-input-wrap_input:focus,_:where(&).inquiry-input-wrap_select:focus]:[border-color:#0b1f38] [:where(&).inquiry-input-wrap_input:focus,_:where(&).inquiry-input-wrap_select:focus]:[background:#fff]"])}>
                    <Phone size={15} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      required
                      maxLength={40}
                      autoComplete="tel"
                    />
                  </div>
                </label>

                <label className={utilities("inquiry-field", [2951, "[:where(&).inquiry-field]:flex [:where(&).inquiry-field]:flex-col [:where(&).inquiry-field]:[gap:5px] [:where(&).inquiry-field]:[font-size:13px] [:where(&).inquiry-field]:font-semibold [:where(&).inquiry-field]:[color:#374151]"], [2952, "[:where(&).inquiry-field_em]:[color:#e53e3e] [:where(&).inquiry-field_em]:not-italic"], [2961, "[.inquiry-message-section_:where(&).inquiry-field_span]:flex [.inquiry-message-section_:where(&).inquiry-field_span]:items-center [.inquiry-message-section_:where(&).inquiry-field_span]:[gap:6px]"], [2962, "[:where(&).inquiry-field_textarea]:[width:100%] [:where(&).inquiry-field_textarea]:[padding:12px] [:where(&).inquiry-field_textarea]:[border:1.5px_solid_#d1d9e6] [:where(&).inquiry-field_textarea]:[border-radius:8px] [:where(&).inquiry-field_textarea]:[font-size:14px] [:where(&).inquiry-field_textarea]:[color:#1a2233] [:where(&).inquiry-field_textarea]:[background:#f9fafc] [:where(&).inquiry-field_textarea]:[outline:none] [:where(&).inquiry-field_textarea]:[resize:vertical] [:where(&).inquiry-field_textarea]:[font-family:inherit] [:where(&).inquiry-field_textarea]:[transition:border-color_0.18s_ease] [:where(&).inquiry-field_textarea]:box-border [:where(&).inquiry-field_textarea]:[min-height:100px]"], [2963, "[:where(&).inquiry-field_textarea:focus]:[border-color:#0b1f38] [:where(&).inquiry-field_textarea:focus]:[background:#fff]"])}>
                  <span>Country / Region <em>*</em></span>
                  <div className={utilities("inquiry-input-wrap inquiry-select-wrap", [2955, "[:where(&).inquiry-input-wrap]:relative [:where(&).inquiry-input-wrap]:flex [:where(&).inquiry-input-wrap]:items-center"], [2956, "[:where(&).inquiry-input-wrap_svg]:absolute [:where(&).inquiry-input-wrap_svg]:[left:12px] [:where(&).inquiry-input-wrap_svg]:[color:#9ca3af] [:where(&).inquiry-input-wrap_svg]:[flex-shrink:0] [:where(&).inquiry-input-wrap_svg]:pointer-events-none"], [2957, "[:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[width:100%] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[height:42px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[padding:0_12px_0_36px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[border:1.5px_solid_#d1d9e6] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[border-radius:8px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[font-size:14px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[color:#1a2233] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[background:#f9fafc] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[outline:none] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[transition:border-color_0.18s_ease,_background_0.18s_ease] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:box-border [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[-webkit-appearance:none] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[appearance:none]"], [2958, "[:where(&).inquiry-input-wrap_input:focus,_:where(&).inquiry-input-wrap_select:focus]:[border-color:#0b1f38] [:where(&).inquiry-input-wrap_input:focus,_:where(&).inquiry-input-wrap_select:focus]:[background:#fff]"], [2959, "[:where(&).inquiry-select-wrap::after]:[content:'▾'] [:where(&).inquiry-select-wrap::after]:absolute [:where(&).inquiry-select-wrap::after]:[right:12px] [:where(&).inquiry-select-wrap::after]:[color:#6b7280] [:where(&).inquiry-select-wrap::after]:pointer-events-none [:where(&).inquiry-select-wrap::after]:[font-size:13px]"])}>
                    <Globe size={15} />
                    <select value={country} onChange={e => setCountry(e.target.value)} required>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </label>

                <label className={utilities("inquiry-field inquiry-field-full", [2951, "[:where(&).inquiry-field]:flex [:where(&).inquiry-field]:flex-col [:where(&).inquiry-field]:[gap:5px] [:where(&).inquiry-field]:[font-size:13px] [:where(&).inquiry-field]:font-semibold [:where(&).inquiry-field]:[color:#374151]"], [2952, "[:where(&).inquiry-field_em]:[color:#e53e3e] [:where(&).inquiry-field_em]:not-italic"], [2954, "[:where(&).inquiry-field-full]:[grid-column:1_/_-1]"], [2961, "[.inquiry-message-section_:where(&).inquiry-field_span]:flex [.inquiry-message-section_:where(&).inquiry-field_span]:items-center [.inquiry-message-section_:where(&).inquiry-field_span]:[gap:6px]"], [2962, "[:where(&).inquiry-field_textarea]:[width:100%] [:where(&).inquiry-field_textarea]:[padding:12px] [:where(&).inquiry-field_textarea]:[border:1.5px_solid_#d1d9e6] [:where(&).inquiry-field_textarea]:[border-radius:8px] [:where(&).inquiry-field_textarea]:[font-size:14px] [:where(&).inquiry-field_textarea]:[color:#1a2233] [:where(&).inquiry-field_textarea]:[background:#f9fafc] [:where(&).inquiry-field_textarea]:[outline:none] [:where(&).inquiry-field_textarea]:[resize:vertical] [:where(&).inquiry-field_textarea]:[font-family:inherit] [:where(&).inquiry-field_textarea]:[transition:border-color_0.18s_ease] [:where(&).inquiry-field_textarea]:box-border [:where(&).inquiry-field_textarea]:[min-height:100px]"], [2963, "[:where(&).inquiry-field_textarea:focus]:[border-color:#0b1f38] [:where(&).inquiry-field_textarea:focus]:[background:#fff]"])}>
                  <span>Company / Organization <em className={utilities("optional", [2953, "[.inquiry-field_em:where(&).optional]:[color:#94a3b8] [.inquiry-field_em:where(&).optional]:font-normal"])}>(Optional)</em></span>
                  <div className={utilities("inquiry-input-wrap", [2955, "[:where(&).inquiry-input-wrap]:relative [:where(&).inquiry-input-wrap]:flex [:where(&).inquiry-input-wrap]:items-center"], [2956, "[:where(&).inquiry-input-wrap_svg]:absolute [:where(&).inquiry-input-wrap_svg]:[left:12px] [:where(&).inquiry-input-wrap_svg]:[color:#9ca3af] [:where(&).inquiry-input-wrap_svg]:[flex-shrink:0] [:where(&).inquiry-input-wrap_svg]:pointer-events-none"], [2957, "[:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[width:100%] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[height:42px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[padding:0_12px_0_36px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[border:1.5px_solid_#d1d9e6] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[border-radius:8px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[font-size:14px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[color:#1a2233] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[background:#f9fafc] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[outline:none] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[transition:border-color_0.18s_ease,_background_0.18s_ease] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:box-border [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[-webkit-appearance:none] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[appearance:none]"], [2958, "[:where(&).inquiry-input-wrap_input:focus,_:where(&).inquiry-input-wrap_select:focus]:[border-color:#0b1f38] [:where(&).inquiry-input-wrap_input:focus,_:where(&).inquiry-input-wrap_select:focus]:[background:#fff]"])}>
                    <Building2 size={15} />
                    <input
                      type="text"
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      placeholder="Enter your company or organization name"
                      maxLength={200}
                      autoComplete="organization"
                    />
                  </div>
                </label>

                <label className={utilities("inquiry-field inquiry-field-full", [2951, "[:where(&).inquiry-field]:flex [:where(&).inquiry-field]:flex-col [:where(&).inquiry-field]:[gap:5px] [:where(&).inquiry-field]:[font-size:13px] [:where(&).inquiry-field]:font-semibold [:where(&).inquiry-field]:[color:#374151]"], [2952, "[:where(&).inquiry-field_em]:[color:#e53e3e] [:where(&).inquiry-field_em]:not-italic"], [2954, "[:where(&).inquiry-field-full]:[grid-column:1_/_-1]"], [2961, "[.inquiry-message-section_:where(&).inquiry-field_span]:flex [.inquiry-message-section_:where(&).inquiry-field_span]:items-center [.inquiry-message-section_:where(&).inquiry-field_span]:[gap:6px]"], [2962, "[:where(&).inquiry-field_textarea]:[width:100%] [:where(&).inquiry-field_textarea]:[padding:12px] [:where(&).inquiry-field_textarea]:[border:1.5px_solid_#d1d9e6] [:where(&).inquiry-field_textarea]:[border-radius:8px] [:where(&).inquiry-field_textarea]:[font-size:14px] [:where(&).inquiry-field_textarea]:[color:#1a2233] [:where(&).inquiry-field_textarea]:[background:#f9fafc] [:where(&).inquiry-field_textarea]:[outline:none] [:where(&).inquiry-field_textarea]:[resize:vertical] [:where(&).inquiry-field_textarea]:[font-family:inherit] [:where(&).inquiry-field_textarea]:[transition:border-color_0.18s_ease] [:where(&).inquiry-field_textarea]:box-border [:where(&).inquiry-field_textarea]:[min-height:100px]"], [2963, "[:where(&).inquiry-field_textarea:focus]:[border-color:#0b1f38] [:where(&).inquiry-field_textarea:focus]:[background:#fff]"])}>
                  <span>Intended Use <em>*</em></span>
                  <div className={utilities("inquiry-input-wrap inquiry-select-wrap", [2955, "[:where(&).inquiry-input-wrap]:relative [:where(&).inquiry-input-wrap]:flex [:where(&).inquiry-input-wrap]:items-center"], [2956, "[:where(&).inquiry-input-wrap_svg]:absolute [:where(&).inquiry-input-wrap_svg]:[left:12px] [:where(&).inquiry-input-wrap_svg]:[color:#9ca3af] [:where(&).inquiry-input-wrap_svg]:[flex-shrink:0] [:where(&).inquiry-input-wrap_svg]:pointer-events-none"], [2957, "[:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[width:100%] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[height:42px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[padding:0_12px_0_36px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[border:1.5px_solid_#d1d9e6] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[border-radius:8px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[font-size:14px] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[color:#1a2233] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[background:#f9fafc] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[outline:none] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[transition:border-color_0.18s_ease,_background_0.18s_ease] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:box-border [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[-webkit-appearance:none] [:where(&).inquiry-input-wrap_input,_:where(&).inquiry-input-wrap_select]:[appearance:none]"], [2958, "[:where(&).inquiry-input-wrap_input:focus,_:where(&).inquiry-input-wrap_select:focus]:[border-color:#0b1f38] [:where(&).inquiry-input-wrap_input:focus,_:where(&).inquiry-input-wrap_select:focus]:[background:#fff]"], [2959, "[:where(&).inquiry-select-wrap::after]:[content:'▾'] [:where(&).inquiry-select-wrap::after]:absolute [:where(&).inquiry-select-wrap::after]:[right:12px] [:where(&).inquiry-select-wrap::after]:[color:#6b7280] [:where(&).inquiry-select-wrap::after]:pointer-events-none [:where(&).inquiry-select-wrap::after]:[font-size:13px]"])}>
                    <Target size={15} />
                    <select value={intendedUse} onChange={e => setIntendedUse(e.target.value)} required>
                      <option value="">Select how you plan to use the drone</option>
                      {INTENDED_USE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </label>
              </div>

              <div className={utilities("inquiry-message-section", [2960, "[:where(&).inquiry-message-section]:[margin-bottom:14px]"])}>
                <label className={utilities("inquiry-field inquiry-field-full", [2951, "[:where(&).inquiry-field]:flex [:where(&).inquiry-field]:flex-col [:where(&).inquiry-field]:[gap:5px] [:where(&).inquiry-field]:[font-size:13px] [:where(&).inquiry-field]:font-semibold [:where(&).inquiry-field]:[color:#374151]"], [2952, "[:where(&).inquiry-field_em]:[color:#e53e3e] [:where(&).inquiry-field_em]:not-italic"], [2954, "[:where(&).inquiry-field-full]:[grid-column:1_/_-1]"], [2961, "[.inquiry-message-section_:where(&).inquiry-field_span]:flex [.inquiry-message-section_:where(&).inquiry-field_span]:items-center [.inquiry-message-section_:where(&).inquiry-field_span]:[gap:6px]"], [2962, "[:where(&).inquiry-field_textarea]:[width:100%] [:where(&).inquiry-field_textarea]:[padding:12px] [:where(&).inquiry-field_textarea]:[border:1.5px_solid_#d1d9e6] [:where(&).inquiry-field_textarea]:[border-radius:8px] [:where(&).inquiry-field_textarea]:[font-size:14px] [:where(&).inquiry-field_textarea]:[color:#1a2233] [:where(&).inquiry-field_textarea]:[background:#f9fafc] [:where(&).inquiry-field_textarea]:[outline:none] [:where(&).inquiry-field_textarea]:[resize:vertical] [:where(&).inquiry-field_textarea]:[font-family:inherit] [:where(&).inquiry-field_textarea]:[transition:border-color_0.18s_ease] [:where(&).inquiry-field_textarea]:box-border [:where(&).inquiry-field_textarea]:[min-height:100px]"], [2963, "[:where(&).inquiry-field_textarea:focus]:[border-color:#0b1f38] [:where(&).inquiry-field_textarea:focus]:[background:#fff]"])}>
                  <span><MessageSquare size={15} /> Additional Message <em className={utilities("optional", [2953, "[.inquiry-field_em:where(&).optional]:[color:#94a3b8] [.inquiry-field_em:where(&).optional]:font-normal"])}>(Optional)</em></span>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Tell us more about your requirements, questions or special requests..."
                    rows={4}
                    maxLength={2000}
                  />
                  <span className={utilities("inquiry-char-count", [2964, "[:where(&).inquiry-char-count]:[font-size:11px] [:where(&).inquiry-char-count]:[color:#94a3b8] [:where(&).inquiry-char-count]:text-right [:where(&).inquiry-char-count]:block [:where(&).inquiry-char-count]:[margin-top:2px] [:where(&).inquiry-char-count]:font-normal"])}>{message.length}/2000</span>
                </label>
              </div>

              <label className={utilities("inquiry-consent", [2965, "[:where(&).inquiry-consent]:flex [:where(&).inquiry-consent]:items-start [:where(&).inquiry-consent]:[gap:10px] [:where(&).inquiry-consent]:[font-size:13px] [:where(&).inquiry-consent]:[color:#4b5563] [:where(&).inquiry-consent]:[margin-bottom:18px] [:where(&).inquiry-consent]:cursor-pointer [:where(&).inquiry-consent]:[line-height:1.5]"], [2966, "[:where(&).inquiry-consent_input[type='checkbox']]:[width:16px] [:where(&).inquiry-consent_input[type='checkbox']]:[height:16px] [:where(&).inquiry-consent_input[type='checkbox']]:[border:1.5px_solid_#d1d9e6] [:where(&).inquiry-consent_input[type='checkbox']]:[border-radius:4px] [:where(&).inquiry-consent_input[type='checkbox']]:[flex-shrink:0] [:where(&).inquiry-consent_input[type='checkbox']]:[margin-top:2px] [:where(&).inquiry-consent_input[type='checkbox']]:[accent-color:#0b1f38] [:where(&).inquiry-consent_input[type='checkbox']]:cursor-pointer"])}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                <span>I agree to be contacted by Drone Bangladesh regarding my inquiry.</span>
              </label>

              {errorMsg && <div className={utilities("inquiry-error", [2967, "[:where(&).inquiry-error]:[background:#fef2f2] [:where(&).inquiry-error]:[border:1px_solid_#fecaca] [:where(&).inquiry-error]:[color:#b91c1c] [:where(&).inquiry-error]:[border-radius:8px] [:where(&).inquiry-error]:[padding:10px_14px] [:where(&).inquiry-error]:[font-size:13px] [:where(&).inquiry-error]:[margin-bottom:14px]"])}>{errorMsg}</div>}

              <button type="submit" className={utilities("inquiry-submit-btn", [2968, "[:where(&).inquiry-submit-btn]:flex [:where(&).inquiry-submit-btn]:items-center [:where(&).inquiry-submit-btn]:justify-center [:where(&).inquiry-submit-btn]:[gap:8px] [:where(&).inquiry-submit-btn]:[width:100%] [:where(&).inquiry-submit-btn]:[height:50px] [:where(&).inquiry-submit-btn]:[background:#0b1f38] [:where(&).inquiry-submit-btn]:[color:#fff] [:where(&).inquiry-submit-btn]:[border:0] [:where(&).inquiry-submit-btn]:[border-radius:10px] [:where(&).inquiry-submit-btn]:[font-size:15px] [:where(&).inquiry-submit-btn]:font-bold [:where(&).inquiry-submit-btn]:cursor-pointer [:where(&).inquiry-submit-btn]:[letter-spacing:0.02em] [:where(&).inquiry-submit-btn]:[transition:background_0.18s_ease,_transform_0.14s_ease]"], [2969, "[:where(&).inquiry-submit-btn:hover:not(:disabled)]:[background:#162d50] [:where(&).inquiry-submit-btn:hover:not(:disabled)]:[transform:translateY(-1px)]"], [2970, "[:where(&).inquiry-submit-btn:disabled]:[opacity:0.65] [:where(&).inquiry-submit-btn:disabled]:cursor-not-allowed"])} disabled={busy}>
                <Send size={16} />
                {busy ? "Submitting…" : "Submit Inquiry"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
