import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const ROLES = ["admin", "legal", "credit", "merchant", "buyer"] as const;
type Role = (typeof ROLES)[number];

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Response("Forbidden", { status: 403 });
}

export const listUsersWithRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { data: usersResp, error: usersErr } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (usersErr) throw new Response(usersErr.message, { status: 500 });

    const { data: rolesData, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rolesErr) throw new Response(rolesErr.message, { status: 500 });

    const rolesByUser = new Map<string, Role[]>();
    for (const r of rolesData ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role as Role);
      rolesByUser.set(r.user_id, arr);
    }

    return usersResp.users
      .map((u) => ({
        id: u.id,
        email: u.email ?? "",
        created_at: u.created_at,
        roles: rolesByUser.get(u.id) ?? [],
      }))
      .sort((a, b) => (a.email > b.email ? 1 : -1));
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => {
    const d = data as { userId?: string; role?: string; grant?: boolean };
    if (!d?.userId || typeof d.userId !== "string") throw new Error("userId required");
    if (!d?.role || !ROLES.includes(d.role as Role)) throw new Error("invalid role");
    return { userId: d.userId, role: d.role as Role, grant: !!d.grant };
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);

    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (error && !error.message.includes("duplicate")) {
        throw new Response(error.message, { status: 500 });
      }
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Response(error.message, { status: 500 });
    }
    return { ok: true };
  });