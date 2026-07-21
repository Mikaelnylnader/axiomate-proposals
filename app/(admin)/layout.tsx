import { requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: { email: string };
  try {
    user = await requireAdmin();
  } catch {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminNav email={user.email} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
