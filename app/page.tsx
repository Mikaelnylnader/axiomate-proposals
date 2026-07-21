import { redirect } from "next/navigation";
import { getAdminUser } from "@/lib/auth";

export default async function Home() {
  const user = await getAdminUser();
  if (user) {
    redirect("/dashboard");
  }
  redirect("/login");
}
