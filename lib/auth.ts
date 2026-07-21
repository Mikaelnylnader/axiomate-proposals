import { createClient } from "@/lib/supabase/server";

export async function requireAdmin(): Promise<{
  userId: string;
  email: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    throw new Error("Not authenticated");
  }

  // Verify admin flag from profiles table
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.is_admin) {
    throw new Error("Not authorized");
  }

  return { userId: user.id, email: user.email };
}

export async function getAdminUser(): Promise<{
  userId: string;
  email: string;
} | null> {
  try {
    return await requireAdmin();
  } catch {
    return null;
  }
}
