import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Use PostHog dashboard for detailed analytics' }, { status: 501 });
}
