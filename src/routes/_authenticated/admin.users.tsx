import { createFileRoute, Navigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { listUsersWithRoles, setUserRole } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsersPage,
});

const ALL_ROLES = ["admin", "legal", "credit", "merchant", "buyer"] as const;
type Role = (typeof ALL_ROLES)[number];

type Row = {
  id: string;
  email: string;
  created_at: string;
  roles: Role[];
};

function AdminUsersPage() {
  const { roles, loading } = useAuth();
  const router = useRouter();
  const list = useServerFn(listUsersWithRoles);
  const update = useServerFn(setUserRole);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (!isAdmin) return;
    list().then((d) => setRows(d as Row[])).catch((e) => toast.error(String(e)));
  }, [isAdmin]);

  if (loading) return <div className="mx-auto max-w-6xl px-6 py-12">Loading…</div>;
  if (!isAdmin) return <Navigate to="/dashboard" />;

  const toggle = async (userId: string, role: Role, grant: boolean) => {
    setBusy(`${userId}:${role}`);
    try {
      await update({ data: { userId, role, grant } });
      setRows((prev) =>
        prev?.map((r) =>
          r.id === userId
            ? {
                ...r,
                roles: grant
                  ? Array.from(new Set([...r.roles, role]))
                  : r.roles.filter((x) => x !== role),
              }
            : r,
        ) ?? null,
      );
      toast.success(grant ? `Granted ${role}` : `Revoked ${role}`);
      router.invalidate();
    } catch (e) {
      toast.error(String(e));
    } finally {
      setBusy(null);
    }
  };

  const filtered = (rows ?? []).filter((r) =>
    r.email.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Users & roles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Grant or revoke staff roles. Changes take effect immediately.
          </p>
        </div>
        <Input
          placeholder="Filter by email…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Current roles</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows === null ? (
              <TableRow><TableCell colSpan={3}>Loading…</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={3} className="text-muted-foreground">No users.</TableCell></TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {r.roles.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        r.roles.map((role) => (
                          <Badge key={role} variant="outline" className="capitalize border-primary/40 text-emerald-deep">
                            {role}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {ALL_ROLES.map((role) => {
                        const has = r.roles.includes(role);
                        const key = `${r.id}:${role}`;
                        return (
                          <Button
                            key={role}
                            size="sm"
                            variant={has ? "secondary" : "outline"}
                            disabled={busy === key}
                            onClick={() => toggle(r.id, role, !has)}
                            className="capitalize"
                          >
                            {has ? `− ${role}` : `+ ${role}`}
                          </Button>
                        );
                      })}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}