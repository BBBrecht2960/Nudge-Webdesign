'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/app/components/Button';

export default function NewLeadPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          company_name: form.company_name.trim() || null,
          message: form.message.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Fout bij aanmaken lead');
        return;
      }
      if (data.lead_id) {
        router.replace(`/admin/leads/${data.lead_id}`);
        return;
      }
      setError('Geen lead_id ontvangen');
    } catch (err) {
      console.error(err);
      setError('Er is iets misgegaan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/admin/leads"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Terug naar leads
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-6">Nieuwe lead toevoegen</h1>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">Naam *</label>
          <input
            id="name"
            type="text"
            required
            minLength={2}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Voor- en achternaam"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">E-mail *</label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="email@voorbeeld.be"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">Telefoon *</label>
          <input
            id="phone"
            type="tel"
            required
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="0494 12 34 56"
          />
        </div>
        <div>
          <label htmlFor="company_name" className="block text-sm font-medium mb-1">Bedrijfsnaam</label>
          <input
            id="company_name"
            type="text"
            value={form.company_name}
            onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Optioneel"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">Bericht</label>
          <textarea
            id="message"
            rows={3}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y"
            placeholder="Optioneel"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Bezig…' : 'Lead aanmaken'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/admin/leads')}>
            Annuleren
          </Button>
        </div>
      </form>
    </div>
  );
}
