import { PrismaClient } from '@prisma/client';

import { PrismaLibSql } from '@prisma/adapter-libsql';

let adapter;
try {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  if (url) {
    adapter = new PrismaLibSql({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN || '',
    });
  }
} catch (e) {
  console.warn("Failed to initialize PrismaLibSql:", e);
}

export const prisma = new PrismaClient(adapter ? { adapter, log: ['error', 'warn'] } : { log: ['error', 'warn'] });
