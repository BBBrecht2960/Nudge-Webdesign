import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// PostHog API endpoint for fetching insights/events
// This is a server-side route that proxies requests to PostHog API
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const posthogApiKey = process.env.POSTHOG_API_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

    if (!posthogApiKey) {
      return NextResponse.json(
        { error: 'PostHog API key niet geconfigureerd. Voeg POSTHOG_API_KEY toe aan .env.local' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'insights';
    const queryParams = searchParams.toString();

    // Build PostHog API URL
    const posthogUrl = `${posthogHost}/api/projects/${process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID || 'default'}/${endpoint}?${queryParams}`;

    const response = await fetch(posthogUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${posthogApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('PostHog API error:', response.status, errorText);
      return NextResponse.json(
        { error: `PostHog API error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching PostHog data:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij ophalen PostHog data' },
      { status: 500 }
    );
  }
}
