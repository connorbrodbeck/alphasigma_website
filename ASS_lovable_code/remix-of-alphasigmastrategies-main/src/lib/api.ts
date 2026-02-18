// Base URL for all API calls.
// In development: empty string → Vite proxy handles /api/* → localhost:3001
// In production: set VITE_API_URL to your Railway backend URL in Vercel env vars
const API_BASE = (import.meta.env.VITE_API_URL as string) ?? '';

export const apiUrl = (path: string): string => `${API_BASE}${path}`;
