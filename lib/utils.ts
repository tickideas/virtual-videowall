import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSessionCode(length: number = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function formatBandwidth(kbps: number | null | undefined): string {
  if (!kbps) return "N/A";
  if (kbps < 1000) return `${kbps} Kbps`;
  return `${(kbps / 1000).toFixed(1)} Mbps`;
}

export function getConnectionQuality(kbps: number | null | undefined): {
  label: string;
  color: string;
} {
  if (!kbps) return { label: "Unknown", color: "gray" };
  if (kbps >= 500) return { label: "Excellent", color: "green" };
  if (kbps >= 300) return { label: "Good", color: "yellow" };
  return { label: "Poor", color: "red" };
}
