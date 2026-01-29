import { NextRequest, NextResponse } from 'next/server';
import { getCityForPostcode } from '@/lib/postcodes-be';
import { requireAuthWithPermissions } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthWithPermissions();
    if (!auth.authenticated || !auth.permissions) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    if (!auth.permissions.can_leads && !auth.permissions.can_customers) return NextResponse.json({ error: 'Geen toegang tot dit onderdeel.' }, { status: 403 });
    const postcode = request.nextUrl.searchParams.get('postcode');
    if (!postcode?.trim()) {
      return NextResponse.json({ error: 'Geef een postcode op (4 cijfers)' }, { status: 400 });
    }
    const city = getCityForPostcode(postcode.trim());
    if (!city) {
      return NextResponse.json({ error: 'Postcode niet gevonden' }, { status: 404 });
    }
    return NextResponse.json({ city });
  } catch {
    return NextResponse.json({ error: 'Fout bij opzoeken postcode' }, { status: 500 });
  }
}
