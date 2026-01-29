'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileImage, FileText, Trash2, Upload, Mail, User, MapPin, Phone, CreditCard, Users, ShieldCheck } from 'lucide-react';
import { Button } from '@/app/components/Button';
import { Field, Input, Textarea, Section } from '../_form-fields';

type AdminUserDetail = {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  gender: string | null;
  birth_date: string | null;
  birth_place: string | null;
  nationality: string | null;
  rijksregisternummer: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  gsm: string | null;
  phone: string | null;
  iban: string | null;
  bic: string | null;
  bank_name: string | null;
  account_holder: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relation: string | null;
  emergency_contact_phone: string | null;
  can_leads: boolean;
  can_customers: boolean;
  can_analytics: boolean;
  can_manage_users: boolean;
  is_super_admin?: boolean;
  has_passport_front: boolean;
  has_passport_back: boolean;
  has_nda: boolean;
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<AdminUserDetail>>({});
  const [newPassword, setNewPassword] = useState('');
  const [docUploading, setDocUploading] = useState<'passport_front' | 'passport_back' | 'nda' | null>(null);
  const [docError, setDocError] = useState<string | null>(null);

  const DEFAULT_PASSWORD = 'Nudge2026!!';

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/users/${id}`, { credentials: 'include' });
        if (!res.ok) {
          if (res.status === 404) setError('Gebruiker niet gevonden');
          else setError('Fout bij ophalen gebruiker');
          return;
        }
        const data = await res.json();
        setUser(data);
        setForm({
          email: data.email,
          full_name: data.full_name ?? '',
          first_name: data.first_name ?? '',
          gender: data.gender ?? '',
          birth_date: data.birth_date ?? '',
          birth_place: data.birth_place ?? '',
          nationality: data.nationality ?? '',
          rijksregisternummer: data.rijksregisternummer ?? '',
          address: data.address ?? '',
          postal_code: data.postal_code ?? '',
          city: data.city ?? '',
          country: data.country ?? '',
          gsm: data.gsm ?? '',
          phone: data.phone ?? '',
          iban: data.iban ?? '',
          bic: data.bic ?? '',
          bank_name: data.bank_name ?? '',
          account_holder: data.account_holder ?? '',
          emergency_contact_name: data.emergency_contact_name ?? '',
          emergency_contact_relation: data.emergency_contact_relation ?? '',
          emergency_contact_phone: data.emergency_contact_phone ?? '',
          can_leads: data.can_leads,
          can_customers: data.can_customers,
          can_analytics: data.can_analytics,
          can_manage_users: data.can_manage_users,
        });
      } catch {
        setError('Fout bij laden');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.is_super_admin) return;
    setSaveError(null);
    setSaving(true);
    try {
      const v = (x: string | null | undefined) => x ?? '';
      const payload: Record<string, unknown> = {};
      if (form.email !== user.email) payload.email = form.email;
      if (form.full_name !== (user.full_name ?? '')) payload.full_name = (form.full_name ?? '').trim() || null;
      if (form.first_name !== v(user.first_name)) payload.first_name = (form.first_name ?? '').trim() || null;
      if (form.gender !== v(user.gender)) payload.gender = form.gender || null;
      if (form.birth_date !== v(user.birth_date)) payload.birth_date = (form.birth_date ?? '').trim() || null;
      if (form.birth_place !== v(user.birth_place)) payload.birth_place = (form.birth_place ?? '').trim() || null;
      if (form.nationality !== v(user.nationality)) payload.nationality = (form.nationality ?? '').trim() || null;
      if (form.rijksregisternummer !== (user.rijksregisternummer ?? '')) payload.rijksregisternummer = (form.rijksregisternummer ?? '').trim() || null;
      if (form.address !== (user.address ?? '')) payload.address = (form.address ?? '').trim() || null;
      if (form.postal_code !== v(user.postal_code)) payload.postal_code = (form.postal_code ?? '').trim() || null;
      if (form.city !== v(user.city)) payload.city = (form.city ?? '').trim() || null;
      if (form.country !== v(user.country)) payload.country = (form.country ?? '').trim() || null;
      if (form.gsm !== (user.gsm ?? '')) payload.gsm = (form.gsm ?? '').trim() || null;
      if (form.phone !== v(user.phone)) payload.phone = (form.phone ?? '').trim() || null;
      if (form.iban !== v(user.iban)) payload.iban = (form.iban ?? '').trim() || null;
      if (form.bic !== v(user.bic)) payload.bic = (form.bic ?? '').trim() || null;
      if (form.bank_name !== v(user.bank_name)) payload.bank_name = (form.bank_name ?? '').trim() || null;
      if (form.account_holder !== v(user.account_holder)) payload.account_holder = (form.account_holder ?? '').trim() || null;
      if (form.emergency_contact_name !== v(user.emergency_contact_name)) payload.emergency_contact_name = (form.emergency_contact_name ?? '').trim() || null;
      if (form.emergency_contact_relation !== v(user.emergency_contact_relation)) payload.emergency_contact_relation = (form.emergency_contact_relation ?? '').trim() || null;
      if (form.emergency_contact_phone !== v(user.emergency_contact_phone)) payload.emergency_contact_phone = (form.emergency_contact_phone ?? '').trim() || null;
      if (form.can_leads !== user.can_leads) payload.can_leads = form.can_leads;
      if (form.can_customers !== user.can_customers) payload.can_customers = form.can_customers;
      if (form.can_analytics !== user.can_analytics) payload.can_analytics = form.can_analytics;
      if (form.can_manage_users !== user.can_manage_users) payload.can_manage_users = form.can_manage_users;

      if (Object.keys(payload).length === 0) {
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.error || 'Fout bij opslaan');
        return;
      }
      setUser((prev) => prev ? { ...prev, ...data } : null);
      setNewPassword('');
    } catch {
      setSaveError('Fout bij opslaan');
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async (documentType: 'passport_front' | 'passport_back' | 'nda', file: File) => {
    setDocError(null);
    setDocUploading(documentType);
    try {
      const fd = new FormData();
      fd.append('document_type', documentType);
      fd.append('file', file);
      const res = await fetch(`/api/admin/users/${id}/documents`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDocError(data.error || 'Upload mislukt');
        return;
      }
      setUser((prev) => prev ? { ...prev, [`has_${documentType}`]: true } : null);
    } catch {
      setDocError('Upload mislukt');
    } finally {
      setDocUploading(null);
    }
  };

  const handleDocumentDelete = async (documentType: 'passport_front' | 'passport_back' | 'nda') => {
    if (!confirm('Document verwijderen?')) return;
    setDocError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}/documents/${documentType}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDocError(data.error || 'Verwijderen mislukt');
        return;
      }
      setUser((prev) => prev ? { ...prev, [`has_${documentType}`]: false } : null);
    } catch {
      setDocError('Verwijderen mislukt');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">Laden...</div>
      </div>
    );
  }
  if (error || !user) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Terug naar gebruikersbeheer
        </Link>
        <p className="text-destructive">{error || 'Gebruiker niet gevonden'}</p>
      </div>
    );
  }

  const canEdit = !user.is_super_admin;
  const docLabel = (type: 'passport_front' | 'passport_back' | 'nda') =>
    type === 'passport_front' ? 'Paspoort voorzijde' : type === 'passport_back' ? 'Paspoort achterzijde' : 'NDA';

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      <div className="mb-6">
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Terug naar gebruikersbeheer
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-1">{user.full_name || user.email}</h1>
      <p className="text-muted-foreground text-sm mb-6">Gegevens en documenten voor administratie en contracten. {!canEdit && 'Deze gebruiker is superbeheerder en kan niet worden gewijzigd.'}</p>

      {saveError && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm" role="alert">
          {saveError}
        </div>
      )}
      {docError && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm" role="alert">
          {docError}
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Section title="E-mail" description="Inlogadres voor het adminpaneel." icon={Mail}>
          <Field id="email" label="E-mail" required>
            <Input id="email" type="email" required value={form.email ?? ''} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} disabled={!canEdit} placeholder="naam@bedrijf.be" />
          </Field>
        </Section>

        <Section title="Wachtwoord" description="Wijzig het wachtwoord van deze gebruiker. Laat leeg om niet te wijzigen." icon={Mail}>
          <Field id="new_password" label="Nieuw wachtwoord" hint="Optioneel. Minimaal 8 tekens. Standaard: Nudge2026!!">
            <div className="flex flex-wrap gap-2 items-center">
              <Input id="new_password" type="password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} disabled={!canEdit} placeholder="Laat leeg om niet te wijzigen" className="flex-1 min-w-[200px]" />
              {canEdit && (
                <Button type="button" variant="outline" size="sm" onClick={() => setNewPassword(DEFAULT_PASSWORD)}>
                  Standaard (Nudge2026!!)
                </Button>
              )}
            </div>
          </Field>
        </Section>

        <Section title="Persoonlijke gegevens" description="Zoals op identiteitskaart. Voor contracten." icon={User}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="full_name" label="Volledige naam" hint="Achternaam + voornaam.">
              <Input id="full_name" type="text" value={form.full_name ?? ''} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} disabled={!canEdit} placeholder="Janssen Jan" />
            </Field>
            <Field id="first_name" label="Voornaam">
              <Input id="first_name" type="text" value={form.first_name ?? ''} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} disabled={!canEdit} placeholder="Jan" />
            </Field>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Geslacht</label>
            <div className="flex flex-wrap gap-4">
              <label className={`flex items-center gap-2 cursor-pointer rounded-lg border px-4 py-2.5 transition-colors ${!canEdit ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5'} border-border`}>
                <input type="radio" name="gender" value="M" checked={(form.gender ?? '') === 'M'} onChange={() => setForm((f) => ({ ...f, gender: 'M' }))} disabled={!canEdit} className="border-border text-primary focus:ring-primary" />
                <span className="text-sm">Man</span>
              </label>
              <label className={`flex items-center gap-2 cursor-pointer rounded-lg border px-4 py-2.5 transition-colors ${!canEdit ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5'} border-border`}>
                <input type="radio" name="gender" value="V" checked={(form.gender ?? '') === 'V'} onChange={() => setForm((f) => ({ ...f, gender: 'V' }))} disabled={!canEdit} className="border-border text-primary focus:ring-primary" />
                <span className="text-sm">Vrouw</span>
              </label>
              <label className={`flex items-center gap-2 cursor-pointer rounded-lg border px-4 py-2.5 transition-colors ${!canEdit ? 'opacity-60 cursor-not-allowed' : 'hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5'} border-border`}>
                <input type="radio" name="gender" value="X" checked={(form.gender ?? '') === 'X'} onChange={() => setForm((f) => ({ ...f, gender: 'X' }))} disabled={!canEdit} className="border-border text-primary focus:ring-primary" />
                <span className="text-sm">X</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="birth_date" label="Geboortedatum">
              <Input id="birth_date" type="date" value={form.birth_date ?? ''} onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))} disabled={!canEdit} />
            </Field>
            <Field id="birth_place" label="Geboorteplaats">
              <Input id="birth_place" type="text" value={form.birth_place ?? ''} onChange={(e) => setForm((f) => ({ ...f, birth_place: e.target.value }))} disabled={!canEdit} placeholder="Hasselt" />
            </Field>
          </div>
          <Field id="nationality" label="Nationaliteit">
            <Input id="nationality" type="text" value={form.nationality ?? ''} onChange={(e) => setForm((f) => ({ ...f, nationality: e.target.value }))} disabled={!canEdit} placeholder="Belgisch" />
          </Field>
          <Field id="rijksregisternummer" label="Rijksregisternummer" hint="11 cijfers, zonder spaties. Achterkant identiteitskaart.">
            <Input id="rijksregisternummer" type="text" value={form.rijksregisternummer ?? ''} onChange={(e) => setForm((f) => ({ ...f, rijksregisternummer: e.target.value.replace(/\D/g, '').slice(0, 11) }))} disabled={!canEdit} placeholder="00000000001" maxLength={11} inputMode="numeric" />
          </Field>
        </Section>

        <Section title="Adres" description="Woonadres voor contracten." icon={MapPin}>
          <Field id="address" label="Straat en nummer" hint="Straatnaam, nummer en eventueel bus.">
            <Textarea id="address" value={form.address ?? ''} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} disabled={!canEdit} placeholder="Naamsestraat 123" rows={1} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field id="postal_code" label="Postcode" hint="4 cijfers in België.">
              <Input id="postal_code" type="text" value={form.postal_code ?? ''} onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value.replace(/\D/g, '').slice(0, 4) }))} disabled={!canEdit} placeholder="3500" maxLength={4} inputMode="numeric" />
            </Field>
            <Field id="city" label="Gemeente" className="sm:col-span-2">
              <Input id="city" type="text" value={form.city ?? ''} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} disabled={!canEdit} placeholder="Hasselt" />
            </Field>
          </div>
          <Field id="country" label="Land">
            <Input id="country" type="text" value={form.country ?? ''} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} disabled={!canEdit} placeholder="België" />
          </Field>
        </Section>

        <Section title="Contact" description="Telefoonnummers." icon={Phone}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="gsm" label="GSM" hint="Bv. +32 470 12 34 56">
              <Input id="gsm" type="tel" value={form.gsm ?? ''} onChange={(e) => setForm((f) => ({ ...f, gsm: e.target.value }))} disabled={!canEdit} placeholder="+32 470 12 34 56" />
            </Field>
            <Field id="phone" label="Vaste telefoon">
              <Input id="phone" type="tel" value={form.phone ?? ''} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} disabled={!canEdit} placeholder="011 23 45 67" />
            </Field>
          </div>
        </Section>

        <Section title="Bankgegevens" description="Belgisch IBAN begint met BE." icon={CreditCard}>
          <Field id="iban" label="IBAN" hint="Bv. BE68 5390 0754 7034">
            <Input id="iban" type="text" value={form.iban ?? ''} onChange={(e) => setForm((f) => ({ ...f, iban: e.target.value.toUpperCase().replace(/\s/g, '') }))} disabled={!canEdit} placeholder="BE68 5390 0754 7034" maxLength={21} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="bic" label="BIC / SWIFT" hint="8 of 11 tekens. Bv. GKCCBEBB">
              <Input id="bic" type="text" value={form.bic ?? ''} onChange={(e) => setForm((f) => ({ ...f, bic: e.target.value.toUpperCase() }))} disabled={!canEdit} placeholder="GKCCBEBB" maxLength={11} />
            </Field>
            <Field id="bank_name" label="Banknaam">
              <Input id="bank_name" type="text" value={form.bank_name ?? ''} onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))} disabled={!canEdit} placeholder="KBC, Belfius, …" />
            </Field>
          </div>
          <Field id="account_holder" label="Rekeninghouder">
            <Input id="account_holder" type="text" value={form.account_holder ?? ''} onChange={(e) => setForm((f) => ({ ...f, account_holder: e.target.value }))} disabled={!canEdit} placeholder="Jan Janssen" />
          </Field>
        </Section>

        <Section title="Noodcontact" description="Contactpersoon in noodgevallen." icon={Users}>
          <Field id="emergency_contact_name" label="Naam contactpersoon">
            <Input id="emergency_contact_name" type="text" value={form.emergency_contact_name ?? ''} onChange={(e) => setForm((f) => ({ ...f, emergency_contact_name: e.target.value }))} disabled={!canEdit} placeholder="Marie Janssen" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="emergency_contact_relation" label="Relatie" hint="Bv. partner, ouder, broer/zus">
              <Input id="emergency_contact_relation" type="text" value={form.emergency_contact_relation ?? ''} onChange={(e) => setForm((f) => ({ ...f, emergency_contact_relation: e.target.value }))} disabled={!canEdit} placeholder="Partner, ouder, …" />
            </Field>
            <Field id="emergency_contact_phone" label="Telefoon">
              <Input id="emergency_contact_phone" type="tel" value={form.emergency_contact_phone ?? ''} onChange={(e) => setForm((f) => ({ ...f, emergency_contact_phone: e.target.value }))} disabled={!canEdit} placeholder="+32 470 00 00 00" />
            </Field>
          </div>
        </Section>

        <Section title="Rechten" description="Welke onderdelen mag deze gebruiker gebruiken?" icon={ShieldCheck} className="lg:col-span-2">
          {canEdit ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input type="checkbox" checked={form.can_leads ?? false} onChange={(e) => setForm((f) => ({ ...f, can_leads: e.target.checked }))} className="rounded border-border text-primary focus:ring-primary h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-sm font-medium block">Leads</span>
                    <span className="text-xs text-muted-foreground">Leads bekijken en beheren</span>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input type="checkbox" checked={form.can_customers ?? false} onChange={(e) => setForm((f) => ({ ...f, can_customers: e.target.checked }))} className="rounded border-border text-primary focus:ring-primary h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-sm font-medium block">Klanten</span>
                    <span className="text-xs text-muted-foreground">Klanten bekijken en beheren</span>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input type="checkbox" checked={form.can_analytics ?? false} onChange={(e) => setForm((f) => ({ ...f, can_analytics: e.target.checked }))} className="rounded border-border text-primary focus:ring-primary h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-sm font-medium block">Analyses</span>
                    <span className="text-xs text-muted-foreground">Statistieken en rapporten</span>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input type="checkbox" checked={form.can_manage_users ?? false} onChange={(e) => setForm((f) => ({ ...f, can_manage_users: e.target.checked }))} className="rounded border-border text-primary focus:ring-primary h-4 w-4 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-sm font-medium block">Gebruikers beheren</span>
                    <span className="text-xs text-muted-foreground">Nieuwe gebruikers en rechten</span>
                  </div>
                </label>
              </div>
              <div className="pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Bezig...' : 'Wijzigingen opslaan'}
                </Button>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">De superbeheerder heeft alle rechten en kan niet worden gewijzigd.</p>
          )}
        </Section>
      </form>

      <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Documenten (beveiligd)</h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Paspoort voor- en achterzijde (JPEG/PNG), NDA (JPEG/PNG/PDF). Max. 10 MB. Toegang alleen voor beheerders.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {(['passport_front', 'passport_back', 'nda'] as const).map((docType) => (
            <div key={docType} className="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-border/80 bg-muted/20">
              {docType === 'nda' ? (
                <FileText className="w-8 h-8 text-muted-foreground shrink-0" />
              ) : (
                <FileImage className="w-8 h-8 text-muted-foreground shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{docLabel(docType)}</p>
                {user[`has_${docType}`] ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/api/admin/users/${id}/documents/${docType}`, '_blank', 'noopener')}
                    >
                      Bekijken
                    </Button>
                    {canEdit && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDocumentDelete(docType)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Verwijderen
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm mt-1">Nog niet geüpload</p>
                )}
              </div>
              {canEdit && (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept={docType === 'nda' ? 'image/jpeg,image/png,application/pdf' : 'image/jpeg,image/png'}
                    className="sr-only"
                    disabled={docUploading !== null}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDocumentUpload(docType, file);
                      e.target.value = '';
                    }}
                  />
                  <span className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted/50">
                    <Upload className="w-4 h-4" />
                    {docUploading === docType ? 'Bezig...' : 'Upload'}
                  </span>
                </label>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
