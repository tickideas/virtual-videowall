import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { logger } from "./logger";

type AnalyticsProperties = Record<string, unknown>;

async function track(event: string, properties: AnalyticsProperties = {}) {
  try {
    await prisma.analyticsEvent.create({
      data: {
        event,
        properties: properties as Prisma.InputJsonValue,
        sessionId: typeof properties.sessionId === "string" ? properties.sessionId : undefined,
        userAgent: typeof properties.userAgent === "string" ? properties.userAgent : undefined,
        url: typeof properties.url === "string" ? properties.url : undefined,
      },
    });
  } catch (error) {
    logger.error("Failed to persist analytics event:", error);
  }
}

export const serverAnalytics = {
  trackAdminLogin(success: boolean, email: string) {
    return track("admin_login", { success, email });
  },
  trackServiceCreated(name: string, maxChurches: number) {
    return track("service_created", { name, maxChurches });
  },
  trackChurchCreated(name: string, code: string) {
    return track("church_created", { name, code });
  },
};
