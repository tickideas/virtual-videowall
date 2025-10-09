interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
  timestamp: number;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private isEnabled: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.isEnabled = process.env.NODE_ENV === 'production';
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
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics:', analyticsEvent);
    }

    // Send to external analytics service if configured
    this.sendToExternal(analyticsEvent);
  }

  private sendToExternal(event: AnalyticsEvent) {
    // In a real implementation, this would send to Google Analytics, Mixpanel, etc.
    // For now, we'll store in localStorage and send in batches
    if (typeof window !== 'undefined') {
      try {
        const existing = JSON.parse(localStorage.getItem('analytics_events') || '[]');
        existing.push(event);
        
        // Keep only last 100 events to prevent storage issues
        if (existing.length > 100) {
          existing.splice(0, existing.length - 100);
        }
        
        localStorage.setItem('analytics_events', JSON.stringify(existing));
      } catch (error) {
        console.warn('Failed to store analytics event:', error);
      }
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
