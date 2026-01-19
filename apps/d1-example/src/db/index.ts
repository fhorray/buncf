import { drizzle } from "drizzle-orm/d1";
import { d1, env } from "buncf/bindings";


export const db = drizzle(d1.DB);
