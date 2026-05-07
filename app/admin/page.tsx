import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { SiteFooter, SiteHeader } from "@/components/layout/site-chrome";
import { auth } from "@/lib/auth";

export default async function AdminLoginPage() {
  const session = await auth();

  if (session?.user?.role?.toLowerCase() === "admin") {
    redirect("/admin/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center p-4 sm:p-6 lg:p-8">
        <AdminLoginForm />
      </main>
      <SiteFooter />
    </div>
  );
}
