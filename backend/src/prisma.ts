import { PrismaClient } from '@prisma/client';
import { createClient } from '@libsql/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

const adapter = new PrismaLibSql(libsql);

export const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});
