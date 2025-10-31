/**
 * Custom React hook for Server-Sent Events
 * Provides efficient real-time updates without polling
 */

import { useEffect, useRef, useState } from "react";

interface UseSSEOptions<T> {
  url: string;
  initialData?: T;
  onError?: (error: Event) => void;
  enabled?: boolean;
}

export function useSSE<T>({
  url,
  initialData,
  onError,
  enabled = true,
}: UseSSEOptions<T>) {
  const [data, setData] = useState<T | undefined>(initialData);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Create EventSource connection
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
      } catch (err) {
        console.error("Failed to parse SSE data:", err);
        setError(err instanceof Error ? err : new Error("Parse error"));
      }
    };

    eventSource.onerror = (event) => {
      setIsConnected(false);
      setError(new Error("SSE connection error"));

      if (onError) {
        onError(event);
      }

      // EventSource automatically reconnects on error
      // We just update the connection status
    };

    // Cleanup on unmount
    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [url, enabled, onError]);

  return {
    data,
    isConnected,
    error,
    close: () => eventSourceRef.current?.close(),
  };
}
