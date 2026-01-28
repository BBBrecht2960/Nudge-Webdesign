'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/Button';
import { packages } from '@/lib/pricing';
import {
  ArrowLeft,
  Building,
  User,
  FileText,
} from 'lucide-react';

const PACKAGE_OPTIONS = packages.map((p) => ({ id: p.id, name: p.name }));

export default function NewLeadPage() {
  const router = useRouter();
  const errorRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adminUsers, setAdminUsers] = useState<{ email: string }[]>([]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyPostalCode, setCompanyPostalCode] = useState('');
  const [companyCity, setCompanyCity] = useState('');
  const [companyCountry, setCompanyCountry] = useState('België');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [packageInterest, setPackageInterest] = useState('');
  const [message, setMessage] = useState('');
  const [painPointsText, setPainPointsText] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleKboLookup = async () => {
    const vat = vatNumber.trim();
    if (!vat) {
      setLookupError('Vul eerst een BTW-nummer in.');
      return;
    }
    setLookupError(null);
    setLookupLoading(true);
    try {
      const res = await fetch(`/api/admin/company-lookup?vat=${encodeURIComponent(vat)}`, { credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setLookupError(data.error || 'Ophalen mislukt.');
        return;
      }
      if (data.company_name) setCompanyName(data.company_name);
      if (data.company_address) setCompanyAddress(data.company_address);
      if (data.company_postal_code) setCompanyPostalCode(data.company_postal_code);
      if (data.company_city) setCompanyCity(data.company_city);
      if (data.company_country) setCompanyCountry(data.company_country);
      if (data.vat_number) setVatNumber(data.vat_number);
    } catch {
      setLookupError('Ophalen mislukt.');
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    fetch('/api/admin/users', { credentials: 'include' })
      .then((res) => res.ok ? res.json() : { users: [] })
      .then((data) => setAdminUsers(data.users || []))
      .catch(() => setAdminUsers([]));
  }, []);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName || trimmedName.length < 2) {
      setError('Naam moet minstens 2 tekens zijn.');
      return;
    }
    if (!trimmedEmail) {
      setError('E-mail is verplicht.');
      return;
    }
    const painPoints = painPointsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: phone.trim() || null,
          company_name: companyName.trim() || null,
          vat_number: vatNumber.trim() || null,
          company_address: companyAddress.trim() || null,
          company_postal_code: companyPostalCode.trim() || null,
          company_city: companyCity.trim() || null,
          company_country: companyCountry.trim() || null,
          company_website: companyWebsite.trim() || null,
          package_interest: packageInterest.trim() || null,
          message: message.trim() || null,
          pain_points: painPoints,
          assigned_to: assignedTo.trim() || null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || `Fout (${res.status})`);
        return;
      }

      const leadId = data.lead_id ?? data.id;
      if (leadId != null && String(leadId).trim()) {
        router.push(`/admin/leads/${String(leadId).trim()}`);
        router.refresh();
        return;
      }
      setError('Geen lead_id ontvangen van de server.');
    } catch (err) {
      console.error(err);
      setError('Versturen mislukt. Probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto w-full min-w-0 max-w-full overflow-x-hidden box-border">
      <Button
        variant="outline"
        size="sm"
        className="mb-4"
        onClick={() => router.push('/admin/leads')}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Terug naar leads
      </Button>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
        Nieuwe lead
      </p>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Lead aanmaken</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div ref={errorRef} role="alert" className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <User className="w-4 h-4" />
            Contactgegevens
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Naam *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                maxLength={255}
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Volledige naam"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">E-mail *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="email@voorbeeld.be"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefoon</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+32 ..."
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Building className="w-4 h-4" />
            Bedrijfsgegevens
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Bedrijfsnaam</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Bedrijf BV"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="block text-sm font-medium mb-1">BTW-nummer</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={vatNumber}
                  onChange={(e) => { setVatNumber(e.target.value); setLookupError(null); }}
                  className="flex-1 min-w-0 px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="BE0123456789"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleKboLookup}
                  disabled={lookupLoading || !vatNumber.trim()}
                  className="shrink-0"
                  title="Bedrijfsgegevens ophalen uit KBO"
                >
                  {lookupLoading ? 'Bezig...' : 'Ophalen uit KBO'}
                </Button>
              </div>
              {lookupError && (
                <p className="text-xs text-destructive">{lookupError}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Website</label>
              <input
                type="url"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://..."
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">Adres</label>
              <input
                type="text"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Straat en nummer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Postcode</label>
              <input
                type="text"
                value={companyPostalCode}
                onChange={(e) => setCompanyPostalCode(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gemeente</label>
              <input
                type="text"
                value={companyCity}
                onChange={(e) => setCompanyCity(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Brussel"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Land</label>
              <input
                type="text"
                value={companyCountry}
                onChange={(e) => setCompanyCountry(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="België"
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Overige
          </h2>
          <div>
            <label className="block text-sm font-medium mb-1">Pakket interesse</label>
            <div className="flex flex-wrap gap-2">
              {PACKAGE_OPTIONS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPackageInterest(packageInterest === p.name ? '' : p.name)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                    packageInterest === p.name
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border hover:bg-accent'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={packageInterest && !PACKAGE_OPTIONS.some((p) => p.name === packageInterest) ? packageInterest : ''}
              onChange={(e) => setPackageInterest(e.target.value)}
              placeholder="Of typ een andere optie"
              className="mt-2 w-full px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Toegewezen aan</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">— Niet toegewezen —</option>
              {adminUsers.map((u) => (
                <option key={u.email} value={u.email}>
                  {u.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bericht / notities</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y"
              placeholder="Vrije notities over deze lead..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Uitdagingen (één per regel)</label>
            <textarea
              value={painPointsText}
              onChange={(e) => setPainPointsText(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y"
              placeholder="Uitdaging 1&#10;Uitdaging 2"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Bezig met aanmaken...' : 'Lead aanmaken'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/leads')}
            disabled={isSubmitting}
          >
            Annuleren
          </Button>
        </div>
      </form>
    </div>
  );
}
