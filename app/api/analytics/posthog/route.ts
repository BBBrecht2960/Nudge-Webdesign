import { NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/api-security';

export async function GET() {
  const authResult = await requireAdminPermission('can_analytics');
  if ('error' in authResult) return authResult.error;
  return NextResponse.json({ error: 'Use PostHog dashboard for detailed analytics' }, { status: 501 });
}
