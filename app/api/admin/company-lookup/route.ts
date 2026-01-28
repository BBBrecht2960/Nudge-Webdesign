import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function normalizeBelgianVat(vat: string): string | null {
  const cleaned = vat.replace(/\s+/g, '').replace(/\./g, '').toUpperCase();
  const withoutCountry = cleaned.startsWith('BE') ? cleaned.slice(2) : cleaned;
  const digits = withoutCountry.replace(/\D/g, '');
  if (digits.length !== 10) return null;
  return `BE${digits}`;
}

function extractBceNumber(vat: string): string {
  const cleaned = vat.replace(/\s+/g, '').replace(/\./g, '').toUpperCase();
  const withoutCountry = cleaned.startsWith('BE') ? cleaned.slice(2) : cleaned;
  return withoutCountry.replace(/\D/g, '');
}

const FETCH_TIMEOUT_MS = 20000;

async function fetchWithTimeout(url: string, options: RequestInit & { timeout?: number } = {}): Promise<Response> {
  const { timeout = FETCH_TIMEOUT_MS, ...fetchOptions } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { ...fetchOptions, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

type CompanyLookupResult = {
  company_name: string | null;
  company_address: string | null;
  company_postal_code: string | null;
  company_city: string | null;
  company_country: string;
  vat_number: string | null;
};

async function fetchKboParty(bceNumber: string, apiKey: string): Promise<CompanyLookupResult | null> {
  const url = `https://kbo.party/api/v1/enterprise/${encodeURIComponent(bceNumber)}`;
  const res = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${apiKey}` }, next: { revalidate: 0 } });
  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, unknown>;
  const denomination = (data.denomination as string) ?? (data.denominationNL as string) ?? (data.name as string) ?? (data.legalName as string) ?? null;
  const address = (data.address as string) ?? (data.street as string) ?? (data.fullAddress as string) ?? null;
  const zipcode = (data.zipcode as string) ?? (data.postalCode as string) ?? (data.zipCode as string) ?? null;
  const city = (data.city as string) ?? (data.municipality as string) ?? (data.municipalityNL as string) ?? null;
  const fullAddress = address ? [address, zipcode, city].filter(Boolean).join(', ') : null;
  return { company_name: denomination || null, company_address: fullAddress || address || null, company_postal_code: zipcode || null, company_city: city || null, company_country: 'België', vat_number: `BE${bceNumber}` };
}

async function fetchCbeApi(vatNormalized: string, apiKey: string): Promise<CompanyLookupResult | null> {
  const bce = vatNormalized.replace(/^BE/i, '');
  const url = `https://cbeapi.be/api/enterprises/${bce}?lang=nl`;
  const res = await fetchWithTimeout(url, { headers: { Authorization: `Bearer ${apiKey}` }, next: { revalidate: 0 } });
  if (!res.ok) return null;
  const data = (await res.json()) as Record<string, unknown>;
  const denomination = (data.denomination as string) ?? (data.denominationNL as string) ?? (data.name as string) ?? null;
  const establishments = (data.establishments ?? data.addresses) as Array<Record<string, unknown>> | undefined;
  const first = Array.isArray(establishments) && establishments.length > 0 ? establishments[0] : (data as Record<string, unknown>);
  const address = (first?.address as string) ?? (first?.street as string) ?? (first?.fullAddress as string) ?? null;
  const zipcode = (first?.zipcode as string) ?? (first?.postalCode as string) ?? null;
  const city = (first?.city as string) ?? (first?.municipality as string) ?? (first?.municipalityNL as string) ?? null;
  const fullAddress = address ? [address, zipcode, city].filter(Boolean).join(', ') : null;
  return { company_name: denomination || null, company_address: fullAddress || address || null, company_postal_code: zipcode || null, company_city: city || null, company_country: 'België', vat_number: vatNormalized };
}

async function handleLookup(request: NextRequest): Promise<NextResponse> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session');
  if (!sessionCookie) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
  const vatParam = request.nextUrl.searchParams.get('vat');
  if (!vatParam || !vatParam.trim()) return NextResponse.json({ error: 'Geef een BTW-nummer op (bijv. BE0123456789)' }, { status: 400 });
  const vatNormalized = normalizeBelgianVat(vatParam.trim());
  if (!vatNormalized) return NextResponse.json({ error: 'Ongeldig Belgisch BTW-nummer. Verwacht formaat: BE gevolgd door 10 cijfers.' }, { status: 400 });
  const kboPartyKey = process.env.KBO_PARTY_API_KEY;
  const cbeApiKey = process.env.CBEAPI_KEY;
  let result: CompanyLookupResult | null = null;
  let lastError: unknown = null;
  if (cbeApiKey) {
    try { result = await fetchCbeApi(vatNormalized, cbeApiKey); } catch (e) { lastError = e; }
  }
  if (!result && kboPartyKey) {
    try { result = await fetchKboParty(extractBceNumber(vatNormalized), kboPartyKey); } catch (e) { lastError = e; }
  }
  if (!result) {
    if (!kboPartyKey && !cbeApiKey) return NextResponse.json({ error: 'KBO-ophaling is niet geconfigureerd. Stel KBO_PARTY_API_KEY of CBEAPI_KEY in (zie README).' }, { status: 503 });
    const cause = (lastError as { cause?: { code?: string } })?.cause;
    const isTimeout = cause?.code === 'UND_ERR_CONNECT_TIMEOUT' || (lastError as Error)?.name === 'AbortError';
    const isFetchFailed = (lastError as Error)?.message?.includes('fetch failed');
    if (isTimeout || isFetchFailed) return NextResponse.json({ error: 'De KBO-dienst is tijdelijk niet bereikbaar (timeout of geen verbinding). Probeer later opnieuw.' }, { status: 503 });
    return NextResponse.json({ error: 'Geen bedrijfsgegevens gevonden voor dit BTW-nummer.' }, { status: 404 });
  }
  return NextResponse.json(result);
}

export async function GET(request: NextRequest) {
  try {
    return await handleLookup(request);
  } catch (_err) {
    return NextResponse.json({ error: 'Fout bij ophalen bedrijfsgegevens.' }, { status: 500 });
  }
}
