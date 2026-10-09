"use client";
import { utilities } from "@/lib/tailwind";


import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from "react";
import { AlertCircle, HelpCircle, FileQuestion, X } from "lucide-react";

type DialogType = "alert" | "confirm" | "prompt";

interface DialogState {
  isOpen: boolean;
  type: DialogType;
  title: string;
  message: string | ReactNode;
  defaultValue?: string;
  resolve?: (value: any) => void;
}

interface AdminDialogContextType {
  alert: (message: string | ReactNode, title?: string) => Promise<void>;
  confirm: (message: string | ReactNode, title?: string) => Promise<boolean>;
  prompt: (message: string | ReactNode, defaultValue?: string, title?: string) => Promise<string | null>;
}

const AdminDialogContext = createContext<AdminDialogContextType | null>(null);

export function useAdminDialog() {
  const context = useContext(AdminDialogContext);
  if (!context) {
    throw new Error("useAdminDialog must be used within an AdminDialogProvider");
  }
  return context;
}

export function AdminDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    type: "alert",
    title: "",
    message: ""
  });
  
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const focusTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (focusTimeoutRef.current !== null) window.clearTimeout(focusTimeoutRef.current);
    if (dialog.isOpen && dialog.type === "prompt" && inputRef.current) {
      // Small timeout to ensure DOM is ready
      focusTimeoutRef.current = window.setTimeout(() => inputRef.current?.focus(), 50);
    }
    return () => {
      if (focusTimeoutRef.current !== null) window.clearTimeout(focusTimeoutRef.current);
    };
  }, [dialog.isOpen, dialog.type]);

  const closeDialog = () => {
    setDialog((prev) => ({ ...prev, isOpen: false }));
    setInputValue("");
  };

  const handleAlert = (message: string | ReactNode, title = "Alert"): Promise<void> => {
    return new Promise((resolve) => {
      setDialog({ isOpen: true, type: "alert", title, message, resolve });
    });
  };

  const handleConfirm = (message: string | ReactNode, title = "Confirm"): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ isOpen: true, type: "confirm", title, message, resolve });
    });
  };

  const handlePrompt = (message: string | ReactNode, defaultValue = "", title = "Input Required"): Promise<string | null> => {
    return new Promise((resolve) => {
      setInputValue(defaultValue);
      setDialog({ isOpen: true, type: "prompt", title, message, defaultValue, resolve });
    });
  };

  const submitDialog = (value: any) => {
    if (dialog.resolve) {
      dialog.resolve(value);
    }
    closeDialog();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      submitDialog(dialog.type === "prompt" ? null : false);
    }
    if (e.key === "Enter" && dialog.type !== "alert") {
      submitDialog(dialog.type === "prompt" ? inputValue : true);
    }
    if (e.key === "Enter" && dialog.type === "alert") {
      submitDialog(undefined);
    }
  };

  return (
    <AdminDialogContext.Provider value={{ alert: handleAlert, confirm: handleConfirm, prompt: handlePrompt }}>
      {children}
      
      {dialog.isOpen && (
        <div className={utilities("admin-dialog-backdrop", [2878, "[:where(&).admin-dialog-backdrop]:fixed [:where(&).admin-dialog-backdrop]:[top:0] [:where(&).admin-dialog-backdrop]:[left:0] [:where(&).admin-dialog-backdrop]:[right:0] [:where(&).admin-dialog-backdrop]:[bottom:0] [:where(&).admin-dialog-backdrop]:[background:rgba(0,_0,_0,_0.5)] [:where(&).admin-dialog-backdrop]:[backdrop-filter:blur(4px)] [:where(&).admin-dialog-backdrop]:[z-index:99999] [:where(&).admin-dialog-backdrop]:flex [:where(&).admin-dialog-backdrop]:items-center [:where(&).admin-dialog-backdrop]:justify-center [:where(&).admin-dialog-backdrop]:animate-[fadeIn_0.2s_ease-out]"])}>
          <div className={utilities("admin-dialog-modal", [2879, "[:where(&).admin-dialog-modal]:[background:white] [:where(&).admin-dialog-modal]:[border-radius:12px] [:where(&).admin-dialog-modal]:[width:90%] [:where(&).admin-dialog-modal]:[max-width:400px] [:where(&).admin-dialog-modal]:[box-shadow:0_10px_40px_rgba(0,_0,_0,_0.1)] [:where(&).admin-dialog-modal]:overflow-hidden [:where(&).admin-dialog-modal]:relative [:where(&).admin-dialog-modal]:animate-[slideUp_0.2s_ease-out]"])} role="dialog" aria-modal="true" onKeyDown={handleKeyDown}>
            <button type="button" className={utilities("admin-dialog-close", [2880, "[:where(&).admin-dialog-close]:absolute [:where(&).admin-dialog-close]:[top:15px] [:where(&).admin-dialog-close]:[right:15px] [:where(&).admin-dialog-close]:[background:none] [:where(&).admin-dialog-close]:[border:none] [:where(&).admin-dialog-close]:[color:#666] [:where(&).admin-dialog-close]:cursor-pointer [:where(&).admin-dialog-close]:[padding:4px] [:where(&).admin-dialog-close]:[border-radius:4px]"], [2881, "[:where(&).admin-dialog-close:hover]:[background:#f0f0f0] [:where(&).admin-dialog-close:hover]:[color:#000]"])} onClick={() => submitDialog(dialog.type === "prompt" ? null : false)}>
              <X size={18} />
            </button>
            
            <div className={utilities("admin-dialog-header", [2882, "[:where(&).admin-dialog-header]:[padding:24px_24px_12px] [:where(&).admin-dialog-header]:flex [:where(&).admin-dialog-header]:items-center [:where(&).admin-dialog-header]:[gap:12px]"], [2883, "[:where(&).admin-dialog-header_h3]:[margin:0] [:where(&).admin-dialog-header_h3]:[font-size:1.1rem] [:where(&).admin-dialog-header_h3]:font-semibold"])}>
              {dialog.type === "alert" && <AlertCircle className={utilities("dialog-icon alert", [2884, "[:where(&).dialog-icon]:[padding:8px] [:where(&).dialog-icon]:[border-radius:50%] [:where(&).dialog-icon]:[width:36px] [:where(&).dialog-icon]:[height:36px]"], [2885, "[:where(&).dialog-icon.alert]:[background:#fee2e2] [:where(&).dialog-icon.alert]:[color:#ef4444]"], [2886, "[:where(&).dialog-icon.confirm]:[background:#fef9c3] [:where(&).dialog-icon.confirm]:[color:#eab308]"], [2887, "[:where(&).dialog-icon.prompt]:[background:#e0f2fe] [:where(&).dialog-icon.prompt]:[color:#0ea5e9]"])} />}
              {dialog.type === "confirm" && <HelpCircle className={utilities("dialog-icon confirm", [2884, "[:where(&).dialog-icon]:[padding:8px] [:where(&).dialog-icon]:[border-radius:50%] [:where(&).dialog-icon]:[width:36px] [:where(&).dialog-icon]:[height:36px]"], [2885, "[:where(&).dialog-icon.alert]:[background:#fee2e2] [:where(&).dialog-icon.alert]:[color:#ef4444]"], [2886, "[:where(&).dialog-icon.confirm]:[background:#fef9c3] [:where(&).dialog-icon.confirm]:[color:#eab308]"], [2887, "[:where(&).dialog-icon.prompt]:[background:#e0f2fe] [:where(&).dialog-icon.prompt]:[color:#0ea5e9]"])} />}
              {dialog.type === "prompt" && <FileQuestion className={utilities("dialog-icon prompt", [2884, "[:where(&).dialog-icon]:[padding:8px] [:where(&).dialog-icon]:[border-radius:50%] [:where(&).dialog-icon]:[width:36px] [:where(&).dialog-icon]:[height:36px]"], [2885, "[:where(&).dialog-icon.alert]:[background:#fee2e2] [:where(&).dialog-icon.alert]:[color:#ef4444]"], [2886, "[:where(&).dialog-icon.confirm]:[background:#fef9c3] [:where(&).dialog-icon.confirm]:[color:#eab308]"], [2887, "[:where(&).dialog-icon.prompt]:[background:#e0f2fe] [:where(&).dialog-icon.prompt]:[color:#0ea5e9]"])} />}
              <h3>{dialog.title}</h3>
            </div>
            
            <div className={utilities("admin-dialog-body", [2888, "[:where(&).admin-dialog-body]:[padding:0_24px_24px] [:where(&).admin-dialog-body]:[color:#4b5563] [:where(&).admin-dialog-body]:[font-size:0.95rem] [:where(&).admin-dialog-body]:[line-height:1.5]"])}>
              <p>{dialog.message}</p>
              
              {dialog.type === "prompt" && (
                <input 
                  ref={inputRef}
                  type="text" 
                  value={inputValue} 
                  onChange={(e) => setInputValue(e.target.value)} 
                  className={utilities("admin-dialog-input", [2889, "[:where(&).admin-dialog-input]:[width:100%] [:where(&).admin-dialog-input]:[margin-top:16px] [:where(&).admin-dialog-input]:[padding:10px_14px] [:where(&).admin-dialog-input]:[border:1px_solid_#ddd] [:where(&).admin-dialog-input]:[border-radius:8px] [:where(&).admin-dialog-input]:[font-size:0.95rem] [:where(&).admin-dialog-input]:[outline:none] [:where(&).admin-dialog-input]:[transition:border-color_0.2s]"], [2890, "[:where(&).admin-dialog-input:focus]:[border-color:#0ea5e9]"])}
                  placeholder="Enter value..."
                />
              )}
            </div>
            
            <div className={utilities("admin-dialog-footer", [2891, "[:where(&).admin-dialog-footer]:[padding:16px_24px] [:where(&).admin-dialog-footer]:[background:#f9fafb] [:where(&).admin-dialog-footer]:flex [:where(&).admin-dialog-footer]:justify-end [:where(&).admin-dialog-footer]:[gap:12px] [:where(&).admin-dialog-footer]:[border-top:1px_solid_#eee]"])}>
              {dialog.type !== "alert" && (
                <button type="button" className={utilities("button button-outline", [62, "[:where(&).button]:[min-height:39px] [:where(&).button]:inline-flex [:where(&).button]:items-center [:where(&).button]:justify-center [:where(&).button]:[gap:7px] [:where(&).button]:[border-radius:4px] [:where(&).button]:[padding:0_17px] [:where(&).button]:font-bold [:where(&).button]:cursor-pointer [:where(&).button]:[border:1px_solid_transparent]"], [66, "[:where(&).button-outline]:[background:#fff] [:where(&).button-outline]:[border-color:#b7c0cf] [:where(&).button-outline]:[color:var(--ink)]"], [280, "[.cart-summary_:where(&).button]:[width:100%] [.cart-summary_:where(&).button]:[margin-top:12px]"], [286, "[.checkout-form>:where(&).button]:[width:max-content] [.checkout-form>:where(&).button]:[margin-top:6px]"], [492, "[.accessory-card_:where(&).button]:[width:100%] [.accessory-card_:where(&).button]:[margin-top:12px] [.accessory-card_:where(&).button]:[border-radius:6px] [.accessory-card_:where(&).button]:text-ellipsis [.accessory-card_:where(&).button]:overflow-hidden [.accessory-card_:where(&).button]:whitespace-nowrap"], [603, "[:is(:where(&).button)]:[font-size:14px]"], [654, "[:is(.accessory-card_:where(&).button)]:[font-size:10px] [:is(.accessory-card_:where(&).button)]:[padding:0_4px] [:is(.accessory-card_:where(&).button)]:[min-height:30px]"], [683, "[@media_(max-width:_720px)]:[:where(&).button,_:where(&).text-link]:[font-size:12px]"], [809, "[.package-card_footer_:where(&).button]:[font-size:11px] [.package-card_footer_:where(&).button]:[min-height:32px] [.package-card_footer_:where(&).button]:[padding:0_13px]"], [818, "[.maintenance-cta_:where(&).button]:[margin-right:15px]"], [837, "[@media_(max-width:_720px)]:[.maintenance-cta_:where(&).button]:[margin:0_0_12px]"], [1225, "[.combo-modal>footer_:where(&).button]:[min-height:36px]"], [1289, "[@media_(max-width:_720px)]:[.combo-modal>footer_:where(&).button]:[width:100%]"], [2383, "[@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:inline-block [@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:[margin-top:15px]"], [2479, "[.reference-toolbar_:where(&).button]:[height:34px] [.reference-toolbar_:where(&).button]:[padding:0_10px] [.reference-toolbar_:where(&).button]:[font-size:10px]"], [2491, "[.order-actions_:where(&).button]:[font-size:9px] [.order-actions_:where(&).button]:[padding:6px_14px]"], [2542, "[.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[height:34px] [.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[font-size:9px]"], [2579, "[.order-confirmation-actions_:where(&).button]:flex [.order-confirmation-actions_:where(&).button]:items-center [.order-confirmation-actions_:where(&).button]:justify-center [.order-confirmation-actions_:where(&).button]:[gap:7px] [.order-confirmation-actions_:where(&).button]:[min-height:43px] [.order-confirmation-actions_:where(&).button]:[text-decoration:none]"], [2587, "[.invoice-actions_:where(&).button]:flex [.invoice-actions_:where(&).button]:items-center [.invoice-actions_:where(&).button]:justify-center [.invoice-actions_:where(&).button]:[gap:6px]"], [2627, "[@media_(max-width:680px)]:[.invoice-actions_:where(&).button]:[flex:1_1_100%]"], [2653, "[.drawer-edit-actions_:where(&).button]:[height:31px] [.drawer-edit-actions_:where(&).button]:[padding:0_11px] [.drawer-edit-actions_:where(&).button]:[font-size:9px]"])} onClick={() => submitDialog(dialog.type === "prompt" ? null : false)}>
                  Cancel
                </button>
              )}
              
              {dialog.type === "alert" && (
                <button type="button" className={utilities("button button-primary", [62, "[:where(&).button]:[min-height:39px] [:where(&).button]:inline-flex [:where(&).button]:items-center [:where(&).button]:justify-center [:where(&).button]:[gap:7px] [:where(&).button]:[border-radius:4px] [:where(&).button]:[padding:0_17px] [:where(&).button]:font-bold [:where(&).button]:cursor-pointer [:where(&).button]:[border:1px_solid_transparent]"], [63, "[:where(&).button-primary]:[background:var(--navy)] [:where(&).button-primary]:[color:#fff]"], [64, "[:where(&).button-primary:hover]:[background:#123d6b]"], [280, "[.cart-summary_:where(&).button]:[width:100%] [.cart-summary_:where(&).button]:[margin-top:12px]"], [286, "[.checkout-form>:where(&).button]:[width:max-content] [.checkout-form>:where(&).button]:[margin-top:6px]"], [492, "[.accessory-card_:where(&).button]:[width:100%] [.accessory-card_:where(&).button]:[margin-top:12px] [.accessory-card_:where(&).button]:[border-radius:6px] [.accessory-card_:where(&).button]:text-ellipsis [.accessory-card_:where(&).button]:overflow-hidden [.accessory-card_:where(&).button]:whitespace-nowrap"], [603, "[:is(:where(&).button)]:[font-size:14px]"], [654, "[:is(.accessory-card_:where(&).button)]:[font-size:10px] [:is(.accessory-card_:where(&).button)]:[padding:0_4px] [:is(.accessory-card_:where(&).button)]:[min-height:30px]"], [683, "[@media_(max-width:_720px)]:[:where(&).button,_:where(&).text-link]:[font-size:12px]"], [809, "[.package-card_footer_:where(&).button]:[font-size:11px] [.package-card_footer_:where(&).button]:[min-height:32px] [.package-card_footer_:where(&).button]:[padding:0_13px]"], [818, "[.maintenance-cta_:where(&).button]:[margin-right:15px]"], [837, "[@media_(max-width:_720px)]:[.maintenance-cta_:where(&).button]:[margin:0_0_12px]"], [1225, "[.combo-modal>footer_:where(&).button]:[min-height:36px]"], [1289, "[@media_(max-width:_720px)]:[.combo-modal>footer_:where(&).button]:[width:100%]"], [2383, "[@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:inline-block [@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:[margin-top:15px]"], [2479, "[.reference-toolbar_:where(&).button]:[height:34px] [.reference-toolbar_:where(&).button]:[padding:0_10px] [.reference-toolbar_:where(&).button]:[font-size:10px]"], [2491, "[.order-actions_:where(&).button]:[font-size:9px] [.order-actions_:where(&).button]:[padding:6px_14px]"], [2542, "[.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[height:34px] [.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[font-size:9px]"], [2579, "[.order-confirmation-actions_:where(&).button]:flex [.order-confirmation-actions_:where(&).button]:items-center [.order-confirmation-actions_:where(&).button]:justify-center [.order-confirmation-actions_:where(&).button]:[gap:7px] [.order-confirmation-actions_:where(&).button]:[min-height:43px] [.order-confirmation-actions_:where(&).button]:[text-decoration:none]"], [2587, "[.invoice-actions_:where(&).button]:flex [.invoice-actions_:where(&).button]:items-center [.invoice-actions_:where(&).button]:justify-center [.invoice-actions_:where(&).button]:[gap:6px]"], [2627, "[@media_(max-width:680px)]:[.invoice-actions_:where(&).button]:[flex:1_1_100%]"], [2653, "[.drawer-edit-actions_:where(&).button]:[height:31px] [.drawer-edit-actions_:where(&).button]:[padding:0_11px] [.drawer-edit-actions_:where(&).button]:[font-size:9px]"])} onClick={() => submitDialog(undefined)} autoFocus>
                  OK
                </button>
              )}
              
              {dialog.type === "confirm" && (
                <button type="button" className={utilities("button button-primary", [62, "[:where(&).button]:[min-height:39px] [:where(&).button]:inline-flex [:where(&).button]:items-center [:where(&).button]:justify-center [:where(&).button]:[gap:7px] [:where(&).button]:[border-radius:4px] [:where(&).button]:[padding:0_17px] [:where(&).button]:font-bold [:where(&).button]:cursor-pointer [:where(&).button]:[border:1px_solid_transparent]"], [63, "[:where(&).button-primary]:[background:var(--navy)] [:where(&).button-primary]:[color:#fff]"], [64, "[:where(&).button-primary:hover]:[background:#123d6b]"], [280, "[.cart-summary_:where(&).button]:[width:100%] [.cart-summary_:where(&).button]:[margin-top:12px]"], [286, "[.checkout-form>:where(&).button]:[width:max-content] [.checkout-form>:where(&).button]:[margin-top:6px]"], [492, "[.accessory-card_:where(&).button]:[width:100%] [.accessory-card_:where(&).button]:[margin-top:12px] [.accessory-card_:where(&).button]:[border-radius:6px] [.accessory-card_:where(&).button]:text-ellipsis [.accessory-card_:where(&).button]:overflow-hidden [.accessory-card_:where(&).button]:whitespace-nowrap"], [603, "[:is(:where(&).button)]:[font-size:14px]"], [654, "[:is(.accessory-card_:where(&).button)]:[font-size:10px] [:is(.accessory-card_:where(&).button)]:[padding:0_4px] [:is(.accessory-card_:where(&).button)]:[min-height:30px]"], [683, "[@media_(max-width:_720px)]:[:where(&).button,_:where(&).text-link]:[font-size:12px]"], [809, "[.package-card_footer_:where(&).button]:[font-size:11px] [.package-card_footer_:where(&).button]:[min-height:32px] [.package-card_footer_:where(&).button]:[padding:0_13px]"], [818, "[.maintenance-cta_:where(&).button]:[margin-right:15px]"], [837, "[@media_(max-width:_720px)]:[.maintenance-cta_:where(&).button]:[margin:0_0_12px]"], [1225, "[.combo-modal>footer_:where(&).button]:[min-height:36px]"], [1289, "[@media_(max-width:_720px)]:[.combo-modal>footer_:where(&).button]:[width:100%]"], [2383, "[@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:inline-block [@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:[margin-top:15px]"], [2479, "[.reference-toolbar_:where(&).button]:[height:34px] [.reference-toolbar_:where(&).button]:[padding:0_10px] [.reference-toolbar_:where(&).button]:[font-size:10px]"], [2491, "[.order-actions_:where(&).button]:[font-size:9px] [.order-actions_:where(&).button]:[padding:6px_14px]"], [2542, "[.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[height:34px] [.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[font-size:9px]"], [2579, "[.order-confirmation-actions_:where(&).button]:flex [.order-confirmation-actions_:where(&).button]:items-center [.order-confirmation-actions_:where(&).button]:justify-center [.order-confirmation-actions_:where(&).button]:[gap:7px] [.order-confirmation-actions_:where(&).button]:[min-height:43px] [.order-confirmation-actions_:where(&).button]:[text-decoration:none]"], [2587, "[.invoice-actions_:where(&).button]:flex [.invoice-actions_:where(&).button]:items-center [.invoice-actions_:where(&).button]:justify-center [.invoice-actions_:where(&).button]:[gap:6px]"], [2627, "[@media_(max-width:680px)]:[.invoice-actions_:where(&).button]:[flex:1_1_100%]"], [2653, "[.drawer-edit-actions_:where(&).button]:[height:31px] [.drawer-edit-actions_:where(&).button]:[padding:0_11px] [.drawer-edit-actions_:where(&).button]:[font-size:9px]"])} onClick={() => submitDialog(true)} autoFocus>
                  Confirm
                </button>
              )}
              
              {dialog.type === "prompt" && (
                <button type="button" className={utilities("button button-primary", [62, "[:where(&).button]:[min-height:39px] [:where(&).button]:inline-flex [:where(&).button]:items-center [:where(&).button]:justify-center [:where(&).button]:[gap:7px] [:where(&).button]:[border-radius:4px] [:where(&).button]:[padding:0_17px] [:where(&).button]:font-bold [:where(&).button]:cursor-pointer [:where(&).button]:[border:1px_solid_transparent]"], [63, "[:where(&).button-primary]:[background:var(--navy)] [:where(&).button-primary]:[color:#fff]"], [64, "[:where(&).button-primary:hover]:[background:#123d6b]"], [280, "[.cart-summary_:where(&).button]:[width:100%] [.cart-summary_:where(&).button]:[margin-top:12px]"], [286, "[.checkout-form>:where(&).button]:[width:max-content] [.checkout-form>:where(&).button]:[margin-top:6px]"], [492, "[.accessory-card_:where(&).button]:[width:100%] [.accessory-card_:where(&).button]:[margin-top:12px] [.accessory-card_:where(&).button]:[border-radius:6px] [.accessory-card_:where(&).button]:text-ellipsis [.accessory-card_:where(&).button]:overflow-hidden [.accessory-card_:where(&).button]:whitespace-nowrap"], [603, "[:is(:where(&).button)]:[font-size:14px]"], [654, "[:is(.accessory-card_:where(&).button)]:[font-size:10px] [:is(.accessory-card_:where(&).button)]:[padding:0_4px] [:is(.accessory-card_:where(&).button)]:[min-height:30px]"], [683, "[@media_(max-width:_720px)]:[:where(&).button,_:where(&).text-link]:[font-size:12px]"], [809, "[.package-card_footer_:where(&).button]:[font-size:11px] [.package-card_footer_:where(&).button]:[min-height:32px] [.package-card_footer_:where(&).button]:[padding:0_13px]"], [818, "[.maintenance-cta_:where(&).button]:[margin-right:15px]"], [837, "[@media_(max-width:_720px)]:[.maintenance-cta_:where(&).button]:[margin:0_0_12px]"], [1225, "[.combo-modal>footer_:where(&).button]:[min-height:36px]"], [1289, "[@media_(max-width:_720px)]:[.combo-modal>footer_:where(&).button]:[width:100%]"], [2383, "[@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:inline-block [@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:[margin-top:15px]"], [2479, "[.reference-toolbar_:where(&).button]:[height:34px] [.reference-toolbar_:where(&).button]:[padding:0_10px] [.reference-toolbar_:where(&).button]:[font-size:10px]"], [2491, "[.order-actions_:where(&).button]:[font-size:9px] [.order-actions_:where(&).button]:[padding:6px_14px]"], [2542, "[.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[height:34px] [.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[font-size:9px]"], [2579, "[.order-confirmation-actions_:where(&).button]:flex [.order-confirmation-actions_:where(&).button]:items-center [.order-confirmation-actions_:where(&).button]:justify-center [.order-confirmation-actions_:where(&).button]:[gap:7px] [.order-confirmation-actions_:where(&).button]:[min-height:43px] [.order-confirmation-actions_:where(&).button]:[text-decoration:none]"], [2587, "[.invoice-actions_:where(&).button]:flex [.invoice-actions_:where(&).button]:items-center [.invoice-actions_:where(&).button]:justify-center [.invoice-actions_:where(&).button]:[gap:6px]"], [2627, "[@media_(max-width:680px)]:[.invoice-actions_:where(&).button]:[flex:1_1_100%]"], [2653, "[.drawer-edit-actions_:where(&).button]:[height:31px] [.drawer-edit-actions_:where(&).button]:[padding:0_11px] [.drawer-edit-actions_:where(&).button]:[font-size:9px]"])} onClick={() => submitDialog(inputValue)}>
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminDialogContext.Provider>
  );
}
