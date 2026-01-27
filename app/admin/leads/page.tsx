'use client';

import { useEffect, useState } from 'react';
import { supabase, type Lead } from '@/lib/db';
import { useRouter } from 'next/navigation';

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLeads();
  }, [filter]);

  const loadLeads = async () => {
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error loading leads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      lead.name.toLowerCase().includes(searchLower) ||
      lead.email.toLowerCase().includes(searchLower) ||
      (lead.company_name && lead.company_name.toLowerCase().includes(searchLower))
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'converted':
        return 'bg-green-100 text-green-800';
      case 'lost':
        return 'bg-red-100 text-red-800';
      case 'qualified':
        return 'bg-blue-100 text-blue-800';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center">Laden...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Leads</h1>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Zoek op naam, e-mail of bedrijf..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">Alle statussen</option>
            <option value="new">Nieuw</option>
            <option value="contacted">Gecontacteerd</option>
            <option value="qualified">Gekwalificeerd</option>
            <option value="converted">Geconverteerd</option>
            <option value="lost">Verloren</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4">Naam</th>
                <th className="text-left p-4">Bedrijf</th>
                <th className="text-left p-4">E-mail</th>
                <th className="text-left p-4">Telefoon</th>
                <th className="text-left p-4">Pakket</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Datum</th>
                <th className="text-left p-4">Acties</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Geen leads gevonden
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-t border-border hover:bg-accent cursor-pointer"
                    onClick={() => router.push(`/admin/leads/${lead.id}`)}
                  >
                    <td className="p-4">{lead.name}</td>
                    <td className="p-4">{lead.company_name || '-'}</td>
                    <td className="p-4">
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {lead.email}
                      </a>
                    </td>
                    <td className="p-4">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {lead.phone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="p-4">{lead.package_interest || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString('nl-BE')}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/leads/${lead.id}`);
                        }}
                        className="text-primary hover:underline text-sm"
                      >
                        Bekijk
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        Totaal: {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
