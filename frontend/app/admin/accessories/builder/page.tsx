
import { utilities } from "@/lib/tailwind";
import { Suspense } from "react";
import AdminAccessoryBuilder from "@/components/admin-accessory-builder";

export default function AdminAccessoryBuilderPage() { 
  return (
    <main className={utilities("admin-page admin-builder-wrapper", [291, "[:where(&).admin-page]:[padding-top:45px] [:where(&).admin-page]:[padding-bottom:60px]"], [1049, "[:where(&).admin-builder-wrapper]:[padding:0]! [:where(&).admin-builder-wrapper]:[max-width:100%]!"], [1408, "[.admin-route-content>:where(&).admin-page]:[width:100%] [.admin-route-content>:where(&).admin-page]:[margin:0] [.admin-route-content>:where(&).admin-page]:[padding:0]"])}>
      <Suspense fallback={<div className={utilities("admin-auth-loading", [1401, "[:where(&).admin-auth-loading]:fixed [:where(&).admin-auth-loading]:[inset:0] [:where(&).admin-auth-loading]:[z-index:99999] [:where(&).admin-auth-loading]:[background:#0d1421] [:where(&).admin-auth-loading]:flex [:where(&).admin-auth-loading]:flex-col [:where(&).admin-auth-loading]:items-center [:where(&).admin-auth-loading]:justify-center [:where(&).admin-auth-loading]:[gap:18px] [:where(&).admin-auth-loading]:[color:#7a8fa8] [:where(&).admin-auth-loading]:[font-size:13.5px] [:where(&).admin-auth-loading]:font-medium"], [1402, "[:where(&).admin-auth-loading_p]:[margin:0] [:where(&).admin-auth-loading_p]:[color:#7a8fa8] [:where(&).admin-auth-loading_p]:[font-size:13.5px]"])}>Loading builder…</div>}>
        <AdminAccessoryBuilder />
      </Suspense>
    </main>
  ); 
}
