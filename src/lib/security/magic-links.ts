// src/lib/security/magic-links.ts
import { randomBytes } from 'crypto';

/**
 * Generates a cryptographically secure random token.
 * @param bytes Number of bytes (default 32 -> 64 char hex string)
 */
export function generateMagicToken(bytes: number = 32): string {
    return randomBytes(bytes).toString('hex');
}

/**
 * Calculates an ISO expiry date from now.
 * @param days Duration in days (default 7)
 */
export function getExpiryDate(days: number = 7): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString();
}

/**
 * Validates if a given date string is past.
 */
export function isExpired(isoDate: string): boolean {
    return new Date() > new Date(isoDate);
}
