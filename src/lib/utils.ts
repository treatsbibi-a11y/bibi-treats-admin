import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Resolves the User Storefront URL:
 * - On localhost / 127.0.0.1, uses `http://localhost:3000` (or non-localhost env URL if explicitly configured).
 * - In production, uses `NEXT_PUBLIC_STOREFRONT_URL` when configured to a non-localhost URL.
 */
export function getStorefrontUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL?.trim();
  const isEnvLocalhost = !envUrl || /localhost|127\.0\.0\.1/i.test(envUrl);

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return isEnvLocalhost ? 'http://localhost:3000' : envUrl;
    }
  }

  return envUrl && !isEnvLocalhost ? envUrl : 'http://localhost:3000';
}
