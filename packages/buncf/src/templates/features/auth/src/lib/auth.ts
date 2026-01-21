
import { betterAuth } from "better-auth";
import { getCloudflareContext } from "buncf";

export const auth = betterAuth({
  database: {
    type: "sqlite",
    db: async () => {
       const ctx = await getCloudflareContext();
       if (!ctx?.env?.DB) throw new Error("Cloudflare D1 binding 'DB' not found");
       return ctx.env.DB;
    }
  },
  emailAndPassword: {
    enabled: true,
  }
});
