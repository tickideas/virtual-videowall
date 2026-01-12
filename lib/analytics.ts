import { prisma } from './prisma';
import { logger } from './logger';

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp: number;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private isEnabled: boolean;
  private isServer: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = process.env.NODE_ENV === 'production';
    this.isServer = typeof window === 'undefined';
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  track(event: string, properties?: Record<string, unknown>) {
    if (!this.isEnabled) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        sessionId: this.sessionId,
        timestamp: Date.now(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server',
      },
      timestamp: Date.now(),
    };

    this.events.push(analyticsEvent);

    // Send to external analytics service if configured
    this.sendToExternal(analyticsEvent);
  }

  private sendToExternal(event: AnalyticsEvent) {
    // Server-side: persist to database
    if (this.isServer) {
      this.persistToDatabase(event).catch((error) => {
        logger.error('Failed to persist analytics event:', error);
      });
      return;
    }

    // Client-side: store in localStorage and optionally send to server
    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem('analytics_events') || '[]');
        existing.push(event);

        // Keep only last 100 events to prevent storage issues (optimized from growing unbounded)
        const maxEvents = 100;
        if (existing.length > maxEvents) {
          existing.splice(0, existing.length - maxEvents);
        }

        localStorage.setItem('analytics_events', JSON.stringify(existing));

        // Auto-cleanup: periodically clear old events (older than 7 days)
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const recentEvents = existing.filter((e: AnalyticsEvent) => e.timestamp > sevenDaysAgo);
        if (recentEvents.length < existing.length) {
          localStorage.setItem('analytics_events', JSON.stringify(recentEvents));
        }

        // Optionally send to server API endpoint
        this.sendToServer(event).catch((error) => {
          // Silent fail for client-side analytics
          if (process.env.NODE_ENV === 'development') {
            console.warn('Failed to send analytics event to server:', error);
          }
        });
      } catch (error) {
        // Silent fail in production, only log critical errors
        if (process.env.NODE_ENV === 'development') {
          console.warn('Failed to store analytics event:', error);
        }
      }
    }
  }

  private async persistToDatabase(event: AnalyticsEvent): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          event: event.event,
          properties: (event.properties || {}) as any,
          sessionId: this.sessionId,
          userAgent: event.properties?.userAgent as string | undefined,
          url: event.properties?.url as string | undefined,
        },
      });
    } catch (error) {
      logger.error('Database persistence error:', error);
      throw error;
    }
  }

  private async sendToServer(event: AnalyticsEvent): Promise<void> {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      // Silent fail for client-side analytics
      throw error;
    }
  }

  // Track specific church events
  trackChurchJoin(sessionCode: string, churchName: string, success: boolean, error?: string) {
    this.track('church_join', {
      sessionCode,
      churchName,
      success,
      error,
    });
  }

  trackChurchLeave(sessionCode: string, churchName: string, duration: number) {
    this.track('church_leave', {
      sessionCode,
      churchName,
      duration,
    });
  }

  trackConnectionQuality(quality: string, bandwidth: number, packetLoss: number) {
    this.track('connection_quality', {
      quality,
      bandwidth,
      packetLoss,
    });
  }

  trackVideoError(error: string, context: string) {
    this.track('video_error', {
      error,
      context,
    });
  }

  trackWallView(sessionCode: string, page: number, totalChurches: number) {
    this.track('wall_view', {
      sessionCode,
      page,
      totalChurches,
    });
  }

  trackAdminLogin(success: boolean, email: string) {
    this.track('admin_login', {
      success,
      email,
    });
  }

  trackServiceCreated(name: string, maxChurches: number) {
    this.track('service_created', {
      name,
      maxChurches,
    });
  }

  trackChurchCreated(name: string, code: string) {
    this.track('church_created', {
      name,
      code,
    });
  }

  // Get analytics for reporting
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  clearEvents() {
    this.events = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('analytics_events');
    }
  }
}

export const analytics = new Analytics();
