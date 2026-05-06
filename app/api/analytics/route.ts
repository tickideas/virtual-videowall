import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { rateLimits } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimits.api(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const body = await request.json();
    const { event, properties } = body;

    if (!event) {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      );
    }

    // Extract metadata from properties
    const sessionId = properties?.sessionId as string | undefined;
    const userAgent = properties?.userAgent as string | undefined;
    const url = properties?.url as string | undefined;

    // Persist to database
    await prisma.analyticsEvent.create({
      data: {
        event,
        properties: properties || {},
        sessionId,
        userAgent,
        url,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    logger.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to save analytics event' },
      { status: 500 }
    );
  }
}
