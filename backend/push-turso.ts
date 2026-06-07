import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function pushSchema() {
  console.log('Connecting to Turso...');
  console.log('URL:', process.env.TURSO_DATABASE_URL);
  
  const statements = [
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "username" TEXT NOT NULL,
      "email" TEXT,
      "password" TEXT
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,
    `CREATE TABLE IF NOT EXISTS "Anime" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "genre" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "rating" REAL,
      "episodes" INTEGER,
      "imageUrl" TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS "Character" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "animeId" TEXT NOT NULL,
      "abilities" TEXT,
      "description" TEXT,
      "powerLevel" INTEGER,
      "imageUrl" TEXT,
      CONSTRAINT "Character_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Watchlist" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "animeId" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "progress" INTEGER NOT NULL DEFAULT 0,
      CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT "Watchlist_animeId_fkey" FOREIGN KEY ("animeId") REFERENCES "Anime" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Watchlist_userId_animeId_key" ON "Watchlist"("userId", "animeId")`,
  ];

  for (const sql of statements) {
    try {
      await client.execute(sql);
      console.log('✓', sql.substring(0, 60) + '...');
    } catch (err: any) {
      console.error('✗ Error:', err.message);
    }
  }

  console.log('\n✅ Schema pushed to Turso successfully!');
}

pushSchema().catch(console.error);
