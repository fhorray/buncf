
import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "buncf";
import * as schema from "./schema";

export async function getDb() {
  const ctx = await getCloudflareContext();
  if (!ctx?.env?.DB) throw new Error("Cloudflare D1 binding 'DB' not found");
  return drizzle(ctx.env.DB, { schema });
}
