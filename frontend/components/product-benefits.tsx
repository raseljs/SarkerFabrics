import { RotateCcw, ShieldCheck, Truck } from "lucide-react";

import { utilities } from "@/lib/tailwind";

const benefits = [
  {
    title: "100% Original",
    subtitle: "Genuine products",
    icon: ShieldCheck,
    iconClass: "bg-blue-100 text-blue-600 shadow-[0_3px_9px_rgba(37,99,235,0.18)]",
  },
  {
    title: "Replacement",
    subtitle: "Support available",
    icon: RotateCcw,
    iconClass: "bg-orange-100 text-orange-600 shadow-[0_3px_9px_rgba(234,88,12,0.18)]",
  },
  {
    title: "Free Home Delivery",
    subtitle: "All Bangladesh",
    icon: Truck,
    iconClass: "bg-red-100 text-red-600 shadow-[0_3px_9px_rgba(220,38,38,0.18)]",
  },
] as const;

export default function ProductBenefits({ variant }: { variant: "desktop" | "mobile" }) {
  const rootClass = variant === "desktop"
    ? "col-start-1 row-start-2 self-start mt-6 mb-7 grid grid-cols-3 gap-3 p-2.5 max-[850px]:hidden"
    : "hidden max-[850px]:order-3 max-[850px]:mt-6 max-[850px]:mb-[30px] max-[850px]:grid max-[850px]:w-full max-[850px]:grid-cols-1 max-[850px]:gap-2.5";

  return (
    <div className={utilities(rootClass)} aria-label="Product benefits">
      {benefits.map(({ title, subtitle, icon: Icon, iconClass }) => (
        <div
          key={title}
          className={utilities(
            "flex min-h-[68px] min-w-0 items-center gap-2.5 rounded-[11px] border border-slate-200 bg-white px-3.5 py-3 text-slate-600 shadow-[0_5px_16px_rgba(15,42,76,0.06)]",
            "max-[850px]:min-h-[62px] max-[850px]:px-[15px]",
          )}
        >
          <span className={utilities("grid size-[34px] shrink-0 place-items-center rounded-full", iconClass)}>
            <Icon aria-hidden="true" size={20} strokeWidth={2.1} />
          </span>
          <span className="flex min-w-0 flex-col gap-0.5 leading-[1.35]">
            <strong
              className={utilities(
                "whitespace-nowrap text-[11.5px] font-bold text-slate-800",
                title === "Free Home Delivery" ? "max-[850px]:text-[15px] max-[850px]:leading-5" : "",
              )}
            >
              {title}
            </strong>
            <span
              className={utilities(
                "whitespace-nowrap text-[10px] text-slate-500",
                title === "Free Home Delivery" ? "max-[850px]:text-[11.5px]" : "",
              )}
            >
              {subtitle}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
