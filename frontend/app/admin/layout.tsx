
import { utilities } from "@/lib/tailwind";
import type { Metadata } from "next";
import { Suspense } from "react";
import AdminShell from "@/components/admin-shell";
import { noIndexMetadata } from "@/lib/seo";
export const metadata: Metadata = noIndexMetadata;
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <Suspense fallback={<main className={utilities("admin-auth-loading", [1401, "[:where(&).admin-auth-loading]:fixed [:where(&).admin-auth-loading]:[inset:0] [:where(&).admin-auth-loading]:[z-index:99999] [:where(&).admin-auth-loading]:[background:#0d1421] [:where(&).admin-auth-loading]:flex [:where(&).admin-auth-loading]:flex-col [:where(&).admin-auth-loading]:items-center [:where(&).admin-auth-loading]:justify-center [:where(&).admin-auth-loading]:[gap:18px] [:where(&).admin-auth-loading]:[color:#7a8fa8] [:where(&).admin-auth-loading]:[font-size:13.5px] [:where(&).admin-auth-loading]:font-medium"], [1402, "[:where(&).admin-auth-loading_p]:[margin:0] [:where(&).admin-auth-loading_p]:[color:#7a8fa8] [:where(&).admin-auth-loading_p]:[font-size:13.5px]"])}>Loading admin…</main>}><AdminShell>{children}</AdminShell></Suspense>; }
