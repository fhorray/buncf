import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "buncf";

const ctx = getCloudflareContext();
export const db = drizzle(ctx.env.DB);
