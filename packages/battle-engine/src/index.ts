/**
 * Battle Engine - Pure TypeScript battle simulation
 * 
 * CRITICAL: This package has ZERO dependencies on:
 * - Database (Prisma, etc.)
 * - HTTP frameworks (NestJS, Express, etc.)
 * - Any external runtime dependencies
 * 
 * It accepts snapshots of data and returns deterministic results.
 */

export * from './types';
export * from './ruleset';
export * from './calculations';
export * from './simulation';

