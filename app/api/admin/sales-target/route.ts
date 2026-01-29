import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminPermission } from '@/lib/api-security';
import * as z from 'zod';

const putSchema = z.object({
  daily_target_eur: z.number().min(0).optional(),
  weekly_target_eur: z.number().min(0).optional(),
}).strict();

/**
 * GET: Haal salesdoelen op. can_customers vereist.
 * - Met can_manage_users: dagdoel, weekdoel, revenue_today, revenue_this_week (exacte omzet).
 * - Zonder: dagdoel, weekdoel, progress_daily_pct, progress_weekly_pct (geen exacte omzet).
 */
export async function GET() {
  const authResult = await requireAdminPermission('can_customers');
  if ('error' in authResult) return authResult.error;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Database niet geconfigureerd' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data: targetRow, error: targetError } = await supabase
    .from('sales_targets')
    .select('daily_target_eur, weekly_target_eur')
    .limit(1)
    .maybeSingle();

  if (targetError) {
    if (targetError.code === '42P01') {
      return NextResponse.json({
        daily_target_eur: 0,
        weekly_target_eur: 0,
        revenue_today: 0,
        revenue_this_week: 0,
        progress_daily_pct: 0,
        progress_weekly_pct: 0,
      });
    }
    console.error('Error fetching sales_targets:', targetError);
    return NextResponse.json(
      { error: 'Fout bij ophalen salesdoelen' },
      { status: 500 }
    );
  }

  const dailyTarget = Number(targetRow?.daily_target_eur ?? 0) || 0;
  const weeklyTarget = Number(targetRow?.weekly_target_eur ?? 0) || 0;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const { data: customers } = await supabase
    .from('customers')
    .select('converted_at, quote_total, project_status')
    .not('converted_at', 'is', null)
    .neq('project_status', 'canceled');

  const list = customers ?? [];
  let revenueToday = 0;
  let revenueThisWeek = 0;
  for (const c of list) {
    const conv = new Date(c.converted_at);
    const rev = Number(c.quote_total) || 0;
    if (conv >= todayStart && conv < todayEnd) revenueToday += rev;
    if (conv >= weekStart && conv < weekEnd) revenueThisWeek += rev;
  }

  const canManageUsers = authResult.permissions.can_manage_users === true;

  if (canManageUsers) {
    return NextResponse.json({
      daily_target_eur: dailyTarget,
      weekly_target_eur: weeklyTarget,
      revenue_today: Math.round(revenueToday * 100) / 100,
      revenue_this_week: Math.round(revenueThisWeek * 100) / 100,
    });
  }

  const progressDailyPct = dailyTarget > 0
    ? Math.min(999, Math.round((revenueToday / dailyTarget) * 100))
    : 0;
  const progressWeeklyPct = weeklyTarget > 0
    ? Math.min(999, Math.round((revenueThisWeek / weeklyTarget) * 100))
    : 0;

  return NextResponse.json({
    daily_target_eur: dailyTarget,
    weekly_target_eur: weeklyTarget,
    progress_daily_pct: progressDailyPct,
    progress_weekly_pct: progressWeeklyPct,
  });
}

/**
 * PUT: Stel salesdoelen in. Alleen can_manage_users.
 */
export async function PUT(request: NextRequest) {
  const authResult = await requireAdminPermission('can_manage_users');
  if ('error' in authResult) return authResult.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldige JSON' }, { status: 400 });
  }
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ongeldige velden', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Database niet geconfigureerd' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const updates: { daily_target_eur?: number; weekly_target_eur?: number; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };
  if (parsed.data.daily_target_eur !== undefined) updates.daily_target_eur = parsed.data.daily_target_eur;
  if (parsed.data.weekly_target_eur !== undefined) updates.weekly_target_eur = parsed.data.weekly_target_eur;

  const { data: existing } = await supabase
    .from('sales_targets')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('sales_targets')
      .update(updates)
      .eq('id', existing.id);
    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'Tabel sales_targets bestaat niet. Voer create-sales-targets-table.sql uit.' },
          { status: 500 }
        );
      }
      console.error('Error updating sales_targets:', error);
      return NextResponse.json({ error: 'Fout bij opslaan salesdoelen' }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from('sales_targets')
      .insert({
        daily_target_eur: parsed.data.daily_target_eur ?? 0,
        weekly_target_eur: parsed.data.weekly_target_eur ?? 0,
        updated_at: updates.updated_at,
      });
    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'Tabel sales_targets bestaat niet. Voer create-sales-targets-table.sql uit.' },
          { status: 500 }
        );
      }
      console.error('Error inserting sales_targets:', error);
      return NextResponse.json({ error: 'Fout bij opslaan salesdoelen' }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
