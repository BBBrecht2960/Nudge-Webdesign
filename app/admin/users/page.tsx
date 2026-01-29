'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserCog, Plus } from 'lucide-react';
import { Button } from '@/app/components/Button';

type AdminUser = {
  id: string;
  email: string;
  full_name: string | null;
  gsm: string | null;
  can_leads: boolean;
  can_customers: boolean;
  can_analytics: boolean;
  can_manage_users: boolean;
  is_super_admin?: boolean;
  has_nda?: boolean;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [canManage, setCanManage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session', { credentials: 'include' });
        if (!sessionRes.ok) {
          router.replace('/admin/dashboard');
          return;
        }
        const sessionData = await sessionRes.json();
        if (!sessionData.permissions?.can_manage_users) {
          router.replace('/admin/dashboard');
          return;
        }
        setCanManage(true);

        const usersRes = await fetch('/api/admin/users', { credentials: 'include' });
        if (!usersRes.ok) {
          setError('Fout bij ophalen gebruikers');
          return;
        }
        const { users: list } = await usersRes.json();
        setUsers(Array.isArray(list) ? list : []);
      } catch {
        setError('Fout bij laden');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [router]);

  const handlePermissionChange = async (userId: string, field: keyof Omit<AdminUser, 'id' | 'email'>, value: boolean) => {
    if (!canManage) return;
    setSaveError(null);
    setSavingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ [field]: value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error || 'Fout bij opslaan');
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, [field]: value } : u))
      );
    } catch {
      setSaveError('Fout bij opslaan');
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center">Laden...</div>
      </div>
    );
  }

  if (!canManage) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center gap-2">
            <UserCog className="w-6 h-6 sm:w-8 sm:h-8 text-primary shrink-0" />
            Gebruikersbeheer
          </h1>
          <p className="text-muted-foreground text-sm">
            Rechten en gegevens per admin. Alleen gebruikers met &quot;Gebruikers beheren&quot; kunnen deze pagina zien en wijzigen.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/admin/users/new">
            <Plus className="w-4 h-4 mr-2" />
            Nieuwe gebruiker
          </Link>
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">
          {error}
        </div>
      )}

      {saveError && (
        <div className="mb-6 bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">
          {saveError}
        </div>
      )}

      <section aria-label="Overzicht gebruikers">
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold">Overzicht gebruikers</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Rechten per admin. Superbeheerder is niet wijzigbaar.</p>
          </div>
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="bg-muted/30 text-muted-foreground">
                  <th className="text-left py-3 px-4 font-medium">Naam</th>
                  <th className="text-left py-3 px-4 font-medium">E-mail</th>
                  <th className="text-center py-3 px-4 font-medium">Leads</th>
                  <th className="text-center py-3 px-4 font-medium">Klanten</th>
                  <th className="text-center py-3 px-4 font-medium">Analyses</th>
                  <th className="text-center py-3 px-4 font-medium">Gebruikers beheren</th>
                  <th className="text-center py-3 px-4 font-medium">NDA</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isSuperAdmin = user.is_super_admin ?? false;
                  const canEdit = canManage && !isSuperAdmin;
                  return (
                    <tr
                      key={user.id}
                      className="border-t border-border/80 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                    >
                      <td className="py-3 px-4 min-w-0 font-medium">
                        <div className="flex flex-col gap-1 min-w-0">
                          <span>{user.full_name || '-'}</span>
                          {isSuperAdmin && (
                            <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded w-fit">
                              Superbeheerder (niet wijzigbaar)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 min-w-0 font-medium">
                        <span className="break-all">{user.email}</span>
                      </td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={user.can_leads}
                            disabled={!canEdit || savingId === user.id}
                            onChange={(e) => handlePermissionChange(user.id, 'can_leads', e.target.checked)}
                            className="rounded border-border"
                          />
                          <span className="sr-only">Leads</span>
                        </label>
                      </td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={user.can_customers}
                            disabled={!canEdit || savingId === user.id}
                            onChange={(e) => handlePermissionChange(user.id, 'can_customers', e.target.checked)}
                            className="rounded border-border"
                          />
                          <span className="sr-only">Klanten</span>
                        </label>
                      </td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={user.can_analytics}
                            disabled={!canEdit || savingId === user.id}
                            onChange={(e) => handlePermissionChange(user.id, 'can_analytics', e.target.checked)}
                            className="rounded border-border"
                          />
                          <span className="sr-only">Analyses</span>
                        </label>
                      </td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <label className="inline-flex items-center justify-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={user.can_manage_users}
                            disabled={!canEdit || savingId === user.id}
                            onChange={(e) => handlePermissionChange(user.id, 'can_manage_users', e.target.checked)}
                            className="rounded border-border"
                          />
                          <span className="sr-only">Gebruikers beheren</span>
                        </label>
                      </td>
                      <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {user.has_nda ? (
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">Ja</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Nee</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {users.length === 0 && !error && (
        <p className="text-muted-foreground text-sm mt-4">Geen gebruikers gevonden.</p>
      )}
    </div>
  );
}
