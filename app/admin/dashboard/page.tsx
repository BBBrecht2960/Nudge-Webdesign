'use client';

import { useEffect, useState } from 'react';
import { supabase, type Lead } from '@/lib/db';
import { Users, Mail, CheckCircle, XCircle, Clock } from 'lucide-react';

interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  leadsByStatus: {
    new: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
  };
  recentLeads: Lead[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Get all leads
      const { data: allLeads, error: allError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (allError) throw allError;

      // Calculate stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const newLeads = allLeads?.filter(
        (lead) => new Date(lead.created_at) >= startOfMonth
      ).length || 0;

      const leadsByStatus = {
        new: allLeads?.filter((l) => l.status === 'new').length || 0,
        contacted: allLeads?.filter((l) => l.status === 'contacted').length || 0,
        qualified: allLeads?.filter((l) => l.status === 'qualified').length || 0,
        converted: allLeads?.filter((l) => l.status === 'converted').length || 0,
        lost: allLeads?.filter((l) => l.status === 'lost').length || 0,
      };

      const recentLeads = allLeads?.slice(0, 10) || [];

      setStats({
        totalLeads: allLeads?.length || 0,
        newLeads,
        leadsByStatus,
        recentLeads,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="text-center">Laden...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <div className="text-center text-muted-foreground">Geen data beschikbaar</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Totaal Leads</p>
              <p className="text-3xl font-bold">{stats.totalLeads}</p>
            </div>
            <Users className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nieuwe Leads (deze maand)</p>
              <p className="text-3xl font-bold">{stats.newLeads}</p>
            </div>
            <Mail className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Geconverteerd</p>
              <p className="text-3xl font-bold">{stats.leadsByStatus.converted}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Nieuw</p>
              <p className="text-3xl font-bold">{stats.leadsByStatus.new}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Leads per Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Nieuw</p>
            <p className="text-2xl font-bold">{stats.leadsByStatus.new}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gecontacteerd</p>
            <p className="text-2xl font-bold">{stats.leadsByStatus.contacted}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gekwalificeerd</p>
            <p className="text-2xl font-bold">{stats.leadsByStatus.qualified}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Geconverteerd</p>
            <p className="text-2xl font-bold text-green-600">{stats.leadsByStatus.converted}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Verloren</p>
            <p className="text-2xl font-bold text-red-600">{stats.leadsByStatus.lost}</p>
          </div>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Recente Leads</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2">Naam</th>
                <th className="text-left p-2">Bedrijf</th>
                <th className="text-left p-2">E-mail</th>
                <th className="text-left p-2">Pakket</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Datum</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-border hover:bg-accent">
                  <td className="p-2">{lead.name}</td>
                  <td className="p-2">{lead.company_name || '-'}</td>
                  <td className="p-2">{lead.email}</td>
                  <td className="p-2">{lead.package_interest || '-'}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      lead.status === 'converted' ? 'bg-green-100 text-green-800' :
                      lead.status === 'lost' ? 'bg-red-100 text-red-800' :
                      lead.status === 'qualified' ? 'bg-blue-100 text-blue-800' :
                      lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="p-2 text-sm text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString('nl-BE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <a
            href="/admin/leads"
            className="text-primary hover:underline"
          >
            Bekijk alle leads →
          </a>
        </div>
      </div>
    </div>
  );
}
