"use client";

import { ImagePlus, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { useId } from "react";

export type ColourDraft = {
  id: string;
  color: string;
  images: string[];
  stock: number;
};

export type LinkedColourProduct = {
  slug: string;
  name: string;
  color?: string;
  image?: string;
  images?: string[];
};

type ProductColoursEditorProps = {
  drafts: ColourDraft[];
  linkedProducts: LinkedColourProduct[];
  primaryColor?: string;
  primaryStock?: number;
  primaryHasImages?: boolean;
  uploadingColourId: string | null;
  busy: boolean;
  onAdd: () => void;
  onUploadColours: (files: FileList | null) => void;
  onUploadImages: (id: string, files: FileList | null) => void;
  onChange: (id: string, patch: Partial<Pick<ColourDraft, "color" | "stock">>) => void;
  onRemove: (id: string) => void;
  onRemoveImage: (id: string, url: string) => void;
  onRemoveLinked: (slug: string) => void;
};

export default function ProductColoursEditor({
  drafts,
  linkedProducts,
  primaryColor = "",
  primaryStock = 0,
  primaryHasImages = false,
  uploadingColourId,
  busy,
  onAdd,
  onUploadColours,
  onUploadImages,
  onChange,
  onRemove,
  onRemoveImage,
  onRemoveLinked,
}: ProductColoursEditorProps) {
  const inputPrefix = useId();
  const locked = busy || uploadingColourId !== null;
  const normalizedPrimaryColour = primaryColor.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");

  return (
    <div className="min-w-0 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-[#17375e]">Multiple Product Colours</h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Upload photos for different colours and enter each colour name. New colours use this
          product&apos;s price and details.
        </p>
      </div>

      <div className="space-y-2">
        <label
          className={`relative flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-center text-xs font-semibold text-blue-700 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 ${locked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-blue-100"}`}
        >
          <Upload size={16} aria-hidden="true" className="shrink-0" />
          Upload colour photos
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            multiple
            disabled={locked}
            aria-label="Upload photos to add multiple product colours"
            onChange={(event) => {
              onUploadColours(event.currentTarget.files);
              event.currentTarget.value = "";
            }}
          />
        </label>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Each selected photo adds a colour. Add more photos to its gallery below.
        </p>
        <button
          type="button"
          onClick={onAdd}
          disabled={locked}
          className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#17375e] hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={15} aria-hidden="true" />
          Add colour
        </button>
      </div>

      {drafts.length === 0 && linkedProducts.length === 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <ImagePlus size={18} aria-hidden="true" />
          </span>
          <p className="text-xs leading-relaxed text-slate-500">
            No colours added yet. Upload photos or add a colour to get started.
          </p>
        </div>
      )}

      {drafts.map((draft, index) => {
        const colourInputId = `${inputPrefix}-colour-${index}`;
        const stockInputId = `${inputPrefix}-stock-${index}`;
        const colourHintId = `${inputPrefix}-main-colour-${index}`;
        const uploading = uploadingColourId === draft.id;
        const colourLabel = draft.color.trim() || `Colour ${index + 1}`;
        const usesPrimaryStock = primaryHasImages && normalizedPrimaryColour !== "" &&
          draft.color.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US") === normalizedPrimaryColour;

        return (
          <fieldset
            key={draft.id}
            disabled={locked}
            className="min-w-0 space-y-3 rounded-lg border border-slate-200 bg-white p-3"
          >
            <legend className="sr-only">{colourLabel}</legend>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#17375e]">Colour {index + 1}</span>
              <button
                type="button"
                aria-label={`Remove ${colourLabel}`}
                onClick={() => onRemove(draft.id)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={15} aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <label htmlFor={colourInputId} className="mb-1 block text-xs font-medium text-slate-600">
                  Colour name <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id={colourInputId}
                  type="text"
                  value={draft.color}
                  required
                  maxLength={80}
                  placeholder="e.g. Navy blue"
                  autoComplete="off"
                  aria-describedby={usesPrimaryStock ? colourHintId : undefined}
                  onChange={(event) => onChange(draft.id, { color: event.currentTarget.value })}
                  className="min-h-10 w-full min-w-0 rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm text-[#17375e] placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-slate-50"
                />
              </div>
              <div className="w-16 shrink-0">
                <label htmlFor={stockInputId} className="mb-1 block text-xs font-medium text-slate-600">
                  Stock
                </label>
                <input
                  id={stockInputId}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={usesPrimaryStock ? primaryStock : draft.stock}
                  disabled={usesPrimaryStock}
                  aria-describedby={usesPrimaryStock ? colourHintId : undefined}
                  onChange={(event) =>
                    onChange(draft.id, {
                      stock: Math.max(0, Math.floor(Number(event.currentTarget.value) || 0)),
                    })
                  }
                  className="min-h-10 w-full rounded-md border border-slate-200 bg-white px-2 py-2 text-sm text-[#17375e] focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-slate-50"
                />
              </div>
            </div>

            {usesPrimaryStock && (
              <p id={colourHintId} className="text-[11px] leading-relaxed text-blue-700">
                These photos join the main colour gallery. Stock uses the main product&apos;s quantity.
              </p>
            )}

            {draft.images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {draft.images.map((url, imageIndex) => (
                  <div key={`${url}-${imageIndex}`} className="relative aspect-square min-w-0 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                    {/* Product photos are supplied by the same upload flow as the main gallery. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`${colourLabel}, photo ${imageIndex + 1}`}
                      className="h-full w-full object-contain"
                    />
                    {imageIndex === 0 && (
                      <span className="absolute bottom-0 left-0 rounded-tr bg-[#17375e]/85 px-1.5 py-0.5 text-[9px] font-medium text-white">Main</span>
                    )}
                    <button
                      type="button"
                      aria-label={`Remove photo ${imageIndex + 1} from ${colourLabel}`}
                      onClick={() => onRemoveImage(draft.id, url)}
                      className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-sm hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X size={13} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400">
                Add at least one photo for this colour.
              </p>
            )}

            <label className={`flex min-h-9 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-blue-200 bg-blue-50/50 px-2 py-2 text-xs font-medium text-blue-700 focus-within:ring-2 focus-within:ring-blue-500 ${locked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-blue-50"}`}>
              {uploading ? <Loader2 size={15} aria-hidden="true" className="animate-spin" /> : <ImagePlus size={15} aria-hidden="true" />}
              {uploading ? "Uploading photos…" : "Add photos"}
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                multiple
                disabled={locked}
                aria-label={`Upload gallery photos for ${colourLabel}`}
                onChange={(event) => {
                  onUploadImages(draft.id, event.currentTarget.files);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </fieldset>
        );
      })}

      {linkedProducts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Linked colour products</p>
          {linkedProducts.map((product) => {
            const photo = product.image || product.images?.[0];
            const colourLabel = product.color?.trim() || product.name;
            return (
              <div key={product.slug} className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo} alt={colourLabel} className="h-11 w-11 shrink-0 rounded-md bg-slate-50 object-contain" />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-400"><ImagePlus size={18} aria-hidden="true" /></span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="break-words text-xs font-semibold text-[#17375e]">{colourLabel}</p>
                  {product.color?.trim() && <p className="mt-0.5 truncate text-[11px] text-slate-500" title={product.name}>{product.name}</p>}
                </div>
                <button
                  type="button"
                  disabled={locked}
                  aria-label={`Unlink ${colourLabel}`}
                  onClick={() => onRemoveLinked(product.slug)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
