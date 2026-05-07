import { env } from '$env/dynamic/private';
import { drizzle } from 'drizzle-orm/libsql';

export const db = drizzle(env.DB_URL!);
