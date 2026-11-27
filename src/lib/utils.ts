import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Resolves the User Storefront URL:
 * - When viewed on localhost / 127.0.0.1, always navigates to `http://localhost:3000`
 * - When in production (or on pages.dev / custom domain), navigates to `NEXT_PUBLIC_STOREFRONT_URL` or `https://bibitreats.com`
 */
export function getStorefrontUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL?.trim();

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3000';
    }
  }

  if (envUrl && !/localhost|127\.0\.0\.1/i.test(envUrl)) {
    return envUrl;
  }

  return 'https://bibitreats.com';
}
