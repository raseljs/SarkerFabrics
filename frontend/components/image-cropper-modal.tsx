
import { utilities } from "@/lib/tailwind";
import React, { useState, useRef } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ImageCropperModalProps {
  imageSrc: string;
  aspectRatio?: number;
  targetWidth?: number;
  targetHeight?: number;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight,
  );
}

export function ImageCropperModal({ imageSrc, aspectRatio = 1.5, targetWidth = 600, targetHeight = 400, onClose, onCropComplete }: ImageCropperModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspectRatio));
  }

  async function handleCrop() {
    if (!completedCrop || !imgRef.current) return;
    
    const image = imgRef.current;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Target dimensions
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      targetWidth,
      targetHeight
    );

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let hasTransparency = false;
    for (let alpha = 3; alpha < pixels.length; alpha += 4) {
      if (pixels[alpha] < 255) {
        hasTransparency = true;
        break;
      }
    }
    const outputType = hasTransparency ? "image/png" : "image/jpeg";
    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, outputType, 0.95);
  }

  return (
    <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:fixed [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[top:0] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[left:0] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[width:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[height:100%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[background-color:rgba(0,0,0,0.75)] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[z-index:99999] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex-col [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:items-center [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:justify-center"])}>
      <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[background-color:#fff] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[padding:20px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-radius:8px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[max-width:90%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[max-height:90%] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex-col"])}>
        <h3 className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin:0_0_15px_0] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[font-size:18px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:font-semibold"])}>Crop Image ({targetWidth}x{targetHeight})</h3>
        
        <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[flex:1] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:overflow-auto [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[min-height:0] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:justify-center [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[background:#f8f9fa] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[border-radius:4px]"])}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
          >
            <img 
              ref={imgRef}
              src={imageSrc} 
              alt="Crop area" 
              className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[max-height:60vh] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:object-contain"])}
              onLoad={onImageLoad} 
            />
          </ReactCrop>
        </div>
        
        <div className={utilities([10000, "[&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:flex [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:justify-end [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[gap:10px] [&:not(#tailwind-inline#tailwind-inline#tailwind-inline)]:[margin-top:15px]"])}>
          <button className={utilities("button button-outline", [62, "[:where(&).button]:[min-height:39px] [:where(&).button]:inline-flex [:where(&).button]:items-center [:where(&).button]:justify-center [:where(&).button]:[gap:7px] [:where(&).button]:[border-radius:4px] [:where(&).button]:[padding:0_17px] [:where(&).button]:font-bold [:where(&).button]:cursor-pointer [:where(&).button]:[border:1px_solid_transparent]"], [66, "[:where(&).button-outline]:[background:#fff] [:where(&).button-outline]:[border-color:#b7c0cf] [:where(&).button-outline]:[color:var(--ink)]"], [280, "[.cart-summary_:where(&).button]:[width:100%] [.cart-summary_:where(&).button]:[margin-top:12px]"], [286, "[.checkout-form>:where(&).button]:[width:max-content] [.checkout-form>:where(&).button]:[margin-top:6px]"], [492, "[.accessory-card_:where(&).button]:[width:100%] [.accessory-card_:where(&).button]:[margin-top:12px] [.accessory-card_:where(&).button]:[border-radius:6px] [.accessory-card_:where(&).button]:text-ellipsis [.accessory-card_:where(&).button]:overflow-hidden [.accessory-card_:where(&).button]:whitespace-nowrap"], [603, "[:is(:where(&).button)]:[font-size:14px]"], [654, "[:is(.accessory-card_:where(&).button)]:[font-size:10px] [:is(.accessory-card_:where(&).button)]:[padding:0_4px] [:is(.accessory-card_:where(&).button)]:[min-height:30px]"], [683, "[@media_(max-width:_720px)]:[:where(&).button,_:where(&).text-link]:[font-size:12px]"], [809, "[.package-card_footer_:where(&).button]:[font-size:11px] [.package-card_footer_:where(&).button]:[min-height:32px] [.package-card_footer_:where(&).button]:[padding:0_13px]"], [818, "[.maintenance-cta_:where(&).button]:[margin-right:15px]"], [837, "[@media_(max-width:_720px)]:[.maintenance-cta_:where(&).button]:[margin:0_0_12px]"], [1225, "[.combo-modal>footer_:where(&).button]:[min-height:36px]"], [1289, "[@media_(max-width:_720px)]:[.combo-modal>footer_:where(&).button]:[width:100%]"], [2383, "[@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:inline-block [@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:[margin-top:15px]"], [2479, "[.reference-toolbar_:where(&).button]:[height:34px] [.reference-toolbar_:where(&).button]:[padding:0_10px] [.reference-toolbar_:where(&).button]:[font-size:10px]"], [2491, "[.order-actions_:where(&).button]:[font-size:9px] [.order-actions_:where(&).button]:[padding:6px_14px]"], [2542, "[.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[height:34px] [.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[font-size:9px]"], [2579, "[.order-confirmation-actions_:where(&).button]:flex [.order-confirmation-actions_:where(&).button]:items-center [.order-confirmation-actions_:where(&).button]:justify-center [.order-confirmation-actions_:where(&).button]:[gap:7px] [.order-confirmation-actions_:where(&).button]:[min-height:43px] [.order-confirmation-actions_:where(&).button]:[text-decoration:none]"], [2587, "[.invoice-actions_:where(&).button]:flex [.invoice-actions_:where(&).button]:items-center [.invoice-actions_:where(&).button]:justify-center [.invoice-actions_:where(&).button]:[gap:6px]"], [2627, "[@media_(max-width:680px)]:[.invoice-actions_:where(&).button]:[flex:1_1_100%]"], [2653, "[.drawer-edit-actions_:where(&).button]:[height:31px] [.drawer-edit-actions_:where(&).button]:[padding:0_11px] [.drawer-edit-actions_:where(&).button]:[font-size:9px]"])} onClick={onClose}>Cancel</button>
          <button className={utilities("button button-primary", [62, "[:where(&).button]:[min-height:39px] [:where(&).button]:inline-flex [:where(&).button]:items-center [:where(&).button]:justify-center [:where(&).button]:[gap:7px] [:where(&).button]:[border-radius:4px] [:where(&).button]:[padding:0_17px] [:where(&).button]:font-bold [:where(&).button]:cursor-pointer [:where(&).button]:[border:1px_solid_transparent]"], [63, "[:where(&).button-primary]:[background:var(--navy)] [:where(&).button-primary]:[color:#fff]"], [64, "[:where(&).button-primary:hover]:[background:#123d6b]"], [280, "[.cart-summary_:where(&).button]:[width:100%] [.cart-summary_:where(&).button]:[margin-top:12px]"], [286, "[.checkout-form>:where(&).button]:[width:max-content] [.checkout-form>:where(&).button]:[margin-top:6px]"], [492, "[.accessory-card_:where(&).button]:[width:100%] [.accessory-card_:where(&).button]:[margin-top:12px] [.accessory-card_:where(&).button]:[border-radius:6px] [.accessory-card_:where(&).button]:text-ellipsis [.accessory-card_:where(&).button]:overflow-hidden [.accessory-card_:where(&).button]:whitespace-nowrap"], [603, "[:is(:where(&).button)]:[font-size:14px]"], [654, "[:is(.accessory-card_:where(&).button)]:[font-size:10px] [:is(.accessory-card_:where(&).button)]:[padding:0_4px] [:is(.accessory-card_:where(&).button)]:[min-height:30px]"], [683, "[@media_(max-width:_720px)]:[:where(&).button,_:where(&).text-link]:[font-size:12px]"], [809, "[.package-card_footer_:where(&).button]:[font-size:11px] [.package-card_footer_:where(&).button]:[min-height:32px] [.package-card_footer_:where(&).button]:[padding:0_13px]"], [818, "[.maintenance-cta_:where(&).button]:[margin-right:15px]"], [837, "[@media_(max-width:_720px)]:[.maintenance-cta_:where(&).button]:[margin:0_0_12px]"], [1225, "[.combo-modal>footer_:where(&).button]:[min-height:36px]"], [1289, "[@media_(max-width:_720px)]:[.combo-modal>footer_:where(&).button]:[width:100%]"], [2383, "[@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:inline-block [@media_(max-width:768px)]:[.contact-location-heading_:where(&).button]:[margin-top:15px]"], [2479, "[.reference-toolbar_:where(&).button]:[height:34px] [.reference-toolbar_:where(&).button]:[padding:0_10px] [.reference-toolbar_:where(&).button]:[font-size:10px]"], [2491, "[.order-actions_:where(&).button]:[font-size:9px] [.order-actions_:where(&).button]:[padding:6px_14px]"], [2542, "[.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[height:34px] [.drawer-actions_:where(&).button,_:where(&).drawer-actions_select]:[font-size:9px]"], [2579, "[.order-confirmation-actions_:where(&).button]:flex [.order-confirmation-actions_:where(&).button]:items-center [.order-confirmation-actions_:where(&).button]:justify-center [.order-confirmation-actions_:where(&).button]:[gap:7px] [.order-confirmation-actions_:where(&).button]:[min-height:43px] [.order-confirmation-actions_:where(&).button]:[text-decoration:none]"], [2587, "[.invoice-actions_:where(&).button]:flex [.invoice-actions_:where(&).button]:items-center [.invoice-actions_:where(&).button]:justify-center [.invoice-actions_:where(&).button]:[gap:6px]"], [2627, "[@media_(max-width:680px)]:[.invoice-actions_:where(&).button]:[flex:1_1_100%]"], [2653, "[.drawer-edit-actions_:where(&).button]:[height:31px] [.drawer-edit-actions_:where(&).button]:[padding:0_11px] [.drawer-edit-actions_:where(&).button]:[font-size:9px]"])} onClick={() => void handleCrop()}>Crop &amp; Upload</button>
        </div>
      </div>
    </div>
  );
}
