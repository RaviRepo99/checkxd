import {drizzle} from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {getDatabaseUrl} from '@/lib/env';
const client = postgres(getDatabaseUrl(), {
	prepare: false,
	ssl: 'require',
	max: 1,
	connect_timeout: 10,
});

export const db = drizzle({client});
