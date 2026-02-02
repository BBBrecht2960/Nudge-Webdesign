'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, User, MapPin, Phone, CreditCard, Users, ShieldCheck } from 'lucide-react';
import { Button } from '@/app/components/Button';
import { Field, Input, Textarea, Section } from '../_form-fields';

export default function NewAdminUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: 'emiclalferarano@gmail.com',
    password: '',
    full_name: 'Emiel',
    first_name: 'Alfarano',
    gender: 'M' as '' | 'M' | 'V' | 'X',
    birth_date: '23/04/2004',
    birth_place: 'Hasselt',
    nationality: 'Belgische',
    rijksregisternummer: '04042317948',
    address: 'Weg naar Bijloos 16',
    postal_code: '3530',
    city: 'Houthalen',
    country: 'België',
    gsm: '+32487317229',
    phone: '011 23 45 67',
    iban: 'BE25303147880782',
    bic: 'BBAUBEBB',
    bank_name: 'ING',
    account_holder: 'Emiel Alfarano',
    emergency_contact_name: 'Test',
    emergency_contact_relation: 'Test',
    emergency_contact_phone: '044',
    can_leads: true,
    can_customers: true,
    can_analytics: false,
    can_manage_users: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        can_leads: form.can_leads,
        can_customers: form.can_customers,
        can_analytics: form.can_analytics,
        can_manage_users: form.can_manage_users,
      };
      if (form.full_name.trim()) body.full_name = form.full_name.trim();
      if (form.first_name.trim()) body.first_name = form.first_name.trim();
      if (form.gender) body.gender = form.gender;
      if (form.birth_date.trim()) body.birth_date = form.birth_date.trim();
      if (form.birth_place.trim()) body.birth_place = form.birth_place.trim();
      if (form.nationality.trim()) body.nationality = form.nationality.trim();
      if (form.rijksregisternummer.trim()) body.rijksregisternummer = form.rijksregisternummer.trim();
      if (form.address.trim()) body.address = form.address.trim();
      if (form.postal_code.trim()) body.postal_code = form.postal_code.trim();
      if (form.city.trim()) body.city = form.city.trim();
      if (form.country.trim()) body.country = form.country.trim();
      if (form.gsm.trim()) body.gsm = form.gsm.trim();
      if (form.phone.trim()) body.phone = form.phone.trim();
      if (form.iban.trim()) body.iban = form.iban.trim();
      if (form.bic.trim()) body.bic = form.bic.trim();
      if (form.bank_name.trim()) body.bank_name = form.bank_name.trim();
      if (form.account_holder.trim()) body.account_holder = form.account_holder.trim();
      if (form.emergency_contact_name.trim()) body.emergency_contact_name = form.emergency_contact_name.trim();
      if (form.emergency_contact_relation.trim()) body.emergency_contact_relation = form.emergency_contact_relation.trim();
      if (form.emergency_contact_phone.trim()) body.emergency_contact_phone = form.emergency_contact_phone.trim();

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const detailMsg = Array.isArray(data.details) ? data.details.join(' ') : data.details || '';
        setError([data.error, detailMsg].filter(Boolean).join(' — ') || 'Fout bij aanmaken gebruiker');
        return;
      }
      if (data.id) {
        router.replace(`/admin/users/${data.id}`);
        return;
      }
      router.replace('/admin/users');
    } catch {
      setError('Er is iets misgegaan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const set = (key: keyof typeof form, value: string | boolean) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      <div className="mb-6">
        <Link href="/admin/users" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Terug naar gebruikersbeheer
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-1">Nieuwe gebruiker toevoegen</h1>
      <p className="text-muted-foreground text-sm mb-8">Vul de gegevens in. Velden met * zijn verplicht. Overige velden zijn optioneel maar handig voor contracten.</p>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {error && (
          <div className="lg:col-span-2 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm" role="alert">
            {error}
          </div>
        )}

        <Section title="Inloggegevens" description="E-mail en wachtwoord om in te loggen op het adminpaneel." icon={Mail}>
          <Field id="email" label="E-mail" required hint="Het e-mailadres waarmee deze gebruiker inlogt.">
            <Input id="email" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="naam@bedrijf.be" />
          </Field>
          <Field id="password" label="Wachtwoord" required hint="Standaard: Nudge2026!!. Minimaal 8 tekens. Je kunt dit aanpassen.">
            <Input id="password" type="password" required minLength={8} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Nudge2026!!" />
          </Field>
        </Section>

        <Section title="Persoonlijke gegevens" description="Zoals op identiteitskaart of paspoort. Voor contracten en intentieverklaringen." icon={User}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="full_name" label="Volledige naam" hint="Achternaam + voornaam, zoals op identiteitskaart.">
              <Input id="full_name" type="text" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="Janssen Jan" />
            </Field>
            <Field id="first_name" label="Voornaam">
              <Input id="first_name" type="text" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} placeholder="Jan" />
            </Field>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Geslacht</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border px-4 py-2.5 hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                <input type="radio" name="gender" value="M" checked={form.gender === 'M'} onChange={(e) => set('gender', e.target.value as 'M')} className="border-border text-primary focus:ring-primary" />
                <span className="text-sm">Man</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border px-4 py-2.5 hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                <input type="radio" name="gender" value="V" checked={form.gender === 'V'} onChange={(e) => set('gender', e.target.value as 'V')} className="border-border text-primary focus:ring-primary" />
                <span className="text-sm">Vrouw</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border px-4 py-2.5 hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                <input type="radio" name="gender" value="X" checked={form.gender === 'X'} onChange={(e) => set('gender', e.target.value as 'X')} className="border-border text-primary focus:ring-primary" />
                <span className="text-sm">X</span>
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="birth_date" label="Geboortedatum">
              <Input id="birth_date" type="date" value={form.birth_date} onChange={(e) => set('birth_date', e.target.value)} />
            </Field>
            <Field id="birth_place" label="Geboorteplaats" hint="Plaats zoals op identiteitskaart.">
              <Input id="birth_place" type="text" value={form.birth_place} onChange={(e) => set('birth_place', e.target.value)} placeholder="Hasselt" />
            </Field>
          </div>
          <Field id="nationality" label="Nationaliteit">
            <Input id="nationality" type="text" value={form.nationality} onChange={(e) => set('nationality', e.target.value)} placeholder="Belgisch" />
          </Field>
          <Field id="rijksregisternummer" label="Rijksregisternummer" hint="11 cijfers, zonder spaties. Staat op de achterkant van de identiteitskaart (onder de foto). Bv. 00000000001">
            <Input id="rijksregisternummer" type="text" value={form.rijksregisternummer} onChange={(e) => set('rijksregisternummer', e.target.value.replace(/\D/g, '').slice(0, 11))} placeholder="00000000001" maxLength={11} inputMode="numeric" />
          </Field>
        </Section>

        <Section title="Adres" description="Woonadres voor contracten en post." icon={MapPin}>
          <Field id="address" label="Straat en nummer" hint="Straatnaam, huisnummer en eventueel bus. Bv. Naamsestraat 123 bus 4">
            <Textarea id="address" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Naamsestraat 123" rows={1} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field id="postal_code" label="Postcode" hint="4 cijfers in België. Bv. 3500">
              <Input id="postal_code" type="text" value={form.postal_code} onChange={(e) => set('postal_code', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="3500" maxLength={4} inputMode="numeric" />
            </Field>
            <Field id="city" label="Gemeente">
              <Input id="city" type="text" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Hasselt" className="sm:col-span-2" />
            </Field>
          </div>
          <Field id="country" label="Land">
            <Input id="country" type="text" value={form.country} onChange={(e) => set('country', e.target.value)} placeholder="België" />
          </Field>
        </Section>

        <Section title="Contact" description="Telefoonnummers voor bereikbaarheid." icon={Phone}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="gsm" label="GSM" hint="Mobiel nummer. Bv. +32 470 12 34 56 of 0470 12 34 56">
              <Input id="gsm" type="tel" value={form.gsm} onChange={(e) => set('gsm', e.target.value)} placeholder="+32 470 12 34 56" />
            </Field>
            <Field id="phone" label="Vaste telefoon" hint="Optioneel. Bv. 011 23 45 67">
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="011 23 45 67" />
            </Field>
          </div>
        </Section>

        <Section title="Bankgegevens" description="Voor loonbetaling of facturatie. Belgisch IBAN begint met BE." icon={CreditCard}>
          <Field id="iban" label="IBAN" hint="Belgisch formaat: BE + 2 cijfers + 4x4 cijfers. Bv. BE68 5390 0754 7034. Spaties worden genegeerd.">
            <Input id="iban" type="text" value={form.iban} onChange={(e) => set('iban', e.target.value.toUpperCase().replace(/\s/g, ''))} placeholder="BE68 5390 0754 7034" maxLength={21} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="bic" label="BIC / SWIFT-code" hint="8 of 11 tekens. Staat op je bankkaart of bankafschrift. Bv. GKCCBEBB">
              <Input id="bic" type="text" value={form.bic} onChange={(e) => set('bic', e.target.value.toUpperCase())} placeholder="GKCCBEBB" maxLength={11} />
            </Field>
            <Field id="bank_name" label="Banknaam">
              <Input id="bank_name" type="text" value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)} placeholder="bv. KBC, Belfius, ING" />
            </Field>
          </div>
          <Field id="account_holder" label="Rekeninghouder" hint="Naam zoals op de bankrekening (vaak volledige naam).">
            <Input id="account_holder" type="text" value={form.account_holder} onChange={(e) => set('account_holder', e.target.value)} placeholder="Jan Janssen" />
          </Field>
        </Section>

        <Section title="Noodcontact" description="Persoon om te contacteren in noodgevallen." icon={Users}>
          <Field id="emergency_contact_name" label="Naam contactpersoon">
            <Input id="emergency_contact_name" type="text" value={form.emergency_contact_name} onChange={(e) => set('emergency_contact_name', e.target.value)} placeholder="Marie Janssen" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field id="emergency_contact_relation" label="Relatie" hint="Bv. partner, ouder, broer/zus, vriend(in)">
              <Input id="emergency_contact_relation" type="text" value={form.emergency_contact_relation} onChange={(e) => set('emergency_contact_relation', e.target.value)} placeholder="Partner, ouder, …" />
            </Field>
            <Field id="emergency_contact_phone" label="Telefoon">
              <Input id="emergency_contact_phone" type="tel" value={form.emergency_contact_phone} onChange={(e) => set('emergency_contact_phone', e.target.value)} placeholder="+32 470 00 00 00" />
            </Field>
          </div>
        </Section>

        <Section title="Rechten" description="Geef aan welke onderdelen van het adminpaneel deze gebruiker mag gebruiken." icon={ShieldCheck} className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
              <input type="checkbox" checked={form.can_leads} onChange={(e) => set('can_leads', e.target.checked)} className="rounded border-border text-primary focus:ring-primary h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <span className="text-sm font-medium block">Leads</span>
                <span className="text-xs text-muted-foreground">Leads bekijken en beheren</span>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
              <input type="checkbox" checked={form.can_customers} onChange={(e) => set('can_customers', e.target.checked)} className="rounded border-border text-primary focus:ring-primary h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <span className="text-sm font-medium block">Klanten</span>
                <span className="text-xs text-muted-foreground">Klanten bekijken en beheren</span>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
              <input type="checkbox" checked={form.can_analytics} onChange={(e) => set('can_analytics', e.target.checked)} className="rounded border-border text-primary focus:ring-primary h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <span className="text-sm font-medium block">Analyses</span>
                <span className="text-xs text-muted-foreground">Statistieken en rapporten</span>
              </div>
            </label>
            <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-border p-3 hover:bg-muted/30 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
              <input type="checkbox" checked={form.can_manage_users} onChange={(e) => set('can_manage_users', e.target.checked)} className="rounded border-border text-primary focus:ring-primary h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <span className="text-sm font-medium block">Gebruikers beheren</span>
                <span className="text-xs text-muted-foreground">Nieuwe gebruikers en rechten</span>
              </div>
            </label>
          </div>
        </Section>

        <div className="lg:col-span-2 flex flex-wrap gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Bezig...' : 'Gebruiker aanmaken'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/users')}>
            Annuleren
          </Button>
        </div>
      </form>
    </div>
  );
}
