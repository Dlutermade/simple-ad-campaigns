import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  migrations: {
    prefix: 'timestamp',
    table: '__drizzle_migrations__',
    schema: 'public',
  },
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
