import { mkdirSync } from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const url = process.env.DATABASE_URL ?? "file:data/gigga.db";
if (url.startsWith("file:")) mkdirSync("data", { recursive: true });

async function main() {
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  await migrate(drizzle(client), { migrationsFolder: "drizzle" });
  console.log(`Migrations applied to ${url}`);
  client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
