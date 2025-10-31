/**
 * Logger utility that respects NODE_ENV
 * Only logs in development, silent in production for performance
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info';

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private shouldLog(): boolean {
    return this.isDevelopment;
  }

  log(...args: unknown[]) {
    if (this.shouldLog()) {
      console.log(...args);
    }
  }

  warn(...args: unknown[]) {
    if (this.shouldLog()) {
      console.warn(...args);
    }
  }

  error(...args: unknown[]) {
    // Always log errors, even in production
    console.error(...args);
  }

  info(...args: unknown[]) {
    if (this.shouldLog()) {
      console.info(...args);
    }
  }

  // Contextual loggers for different parts of the app
  church(...args: unknown[]) {
    if (this.shouldLog()) {
      console.log('[Church]', ...args);
    }
  }

  wall(...args: unknown[]) {
    if (this.shouldLog()) {
      console.log('[Wall]', ...args);
    }
  }

  api(...args: unknown[]) {
    if (this.shouldLog()) {
      console.log('[API]', ...args);
    }
  }
}

export const logger = new Logger();
