/**
 * Central environment access. Import from here instead of reading process.env ad hoc.
 * Server-only vars must not be imported in Client Components.
 */

/** PostgreSQL connection string (server only). */
export function getDatabaseUrl(): string {
  const value =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL_NO_SSL;

  if (!value) {
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.CI) {
      return 'postgresql://placeholder-user:placeholder-pass@localhost:5432/placeholder-db';
    }
    throw new Error('Missing required environment variable: DATABASE_URL (or a Vercel/Postgres-compatible URL variable)');
  }
  return value;
}

/** Supabase project URL (public). */
export function getSupabaseUrl(): string {
  const value =
    (typeof window !== 'undefined' && (window as any).ENV?.NEXT_PUBLIC_SUPABASE_URL) ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!value) {
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.CI) {
      return 'https://placeholder-project.supabase.co';
    }
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL');
  }
  return value;
}

/** Supabase anon / publishable key (public). */
export function getSupabaseAnonKey(): string {
  const value =
    (typeof window !== 'undefined' && (window as any).ENV?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!value) {
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.CI) {
      return 'placeholder-anon-key';
    }
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  }
  return value;
}

/** Supabase Storage bucket for admin uploads (default: `media`). */
export function getSupabaseMediaBucket(): string {
  return (
    process.env.SUPABASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ||
    'media'
  );
}

/**
 * Legacy `service_role` key (server only).
 * Supabase Dashboard → Project Settings → API Keys → tab
 * "Legacy anon, service_role API keys" → service_role.
 * Used to auto-create the `media` bucket and upload admin images.
 */
export function getSupabaseServiceRoleKey(): string {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!value) {
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.CI) {
      return 'placeholder-service-role-key';
    }
    throw new Error(
        'Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY',
    );
  }
  return value;
}
