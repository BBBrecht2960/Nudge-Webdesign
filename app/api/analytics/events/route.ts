import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Simplified endpoint for fetching event counts
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
    const projectId = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_ID;

    if (!posthogApiKey) {
      // Return mock data if PostHog API key not configured
      return NextResponse.json({
        events: {
          'cta_click': { count: 0, trend: 0 },
          'form_submitted': { count: 0, trend: 0 },
          'package_card_click': { count: 0, trend: 0 },
          'scroll_depth': { count: 0, trend: 0 },
        },
        pageviews: { count: 0, trend: 0 },
        leads: { count: 0, trend: 0 },
      });
    }

    // If no project ID, try to get it from the API key or use a default
    // For now, we'll use the project ID from the API key if available
    const effectiveProjectId = projectId || 'default';

    // Get date range (default: last 30 days)
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const after = new Date();
    after.setDate(after.getDate() - days);
    const before = new Date();

    // Fetch events using PostHog Query API
    const events = ['cta_click', 'form_submitted', 'package_card_click', 'scroll_depth'];
    const eventData: Record<string, { count: number; trend: number }> = {};

    for (const event of events) {
      try {
        const response = await fetch(
          `${posthogHost}/api/projects/${effectiveProjectId}/query/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${posthogApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              kind: 'EventsQuery',
              select: ['count()'],
              event: event,
              date_from: after.toISOString().split('T')[0],
              date_to: before.toISOString().split('T')[0],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const count = data.results?.[0]?.[0] || 0;
          eventData[event] = { count, trend: 0 }; // Trend calculation would need previous period data
        }
      } catch (err) {
        console.warn(`Error fetching ${event}:`, err);
        eventData[event] = { count: 0, trend: 0 };
      }
    }

    // Get pageviews
    let pageviews = { count: 0, trend: 0 };
    try {
      const response = await fetch(
        `${posthogHost}/api/projects/${projectId}/query/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${posthogApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            kind: 'EventsQuery',
            select: ['count()'],
            event: '$pageview',
            date_from: after.toISOString().split('T')[0],
            date_to: before.toISOString().split('T')[0],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        pageviews.count = data.results?.[0]?.[0] || 0;
      }
    } catch (err) {
      console.warn('Error fetching pageviews:', err);
    }

    return NextResponse.json({
      events: eventData,
      pageviews,
      leads: { count: 0, trend: 0 }, // Would need to fetch from database
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Fout bij ophalen analytics' },
      { status: 500 }
    );
  }
}
