# Integration with Buncf

Learn how to configure Better Auth in your Buncf project.

## Step 1: Install the Package

Add Better Auth to your project using Bun:

```bash
bun add better-auth
```

## Step 2: Set Environment Variables

Create or update your `.env` file in the root of your project:

**1. Secret Key**
A secret value used for encryption and hashing. It must be at least 32 characters.

```env
BETTER_AUTH_SECRET=<generate_via_openssl_rand_base64_32>
```

**2. Base URL**

```env
BETTER_AUTH_URL=http://localhost:3000
```
> **Note:** Buncf automatically polyfills `process.env` with these values in development and Cloudflare production.

## Step 3: Create Auth Instance

Create a file named `src/lib/auth.ts`:

```ts
// src/lib/auth.ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Add your database configuration here
  // Example for Cloudflare D1 with Drizzle:
  /*
  database: drizzleAdapter(db, {
      provider: "sqlite",
  }),
  */
  emailAndPassword: {
    enabled: true,
  }
});
```

## Step 4: Mount Handler

Create a Catch-All API route to handle authentication requests.

Create the file `src/api/auth/[...all].ts`:

```ts
// src/api/auth/[...all].ts
import { auth } from "@/lib/auth"; // Adjust path if necessary

// Buncf API Handler
export default (request: Request) => {
    return auth.handler(request);
};
```

### Important: Worker Compatibility
To ensure features like `AsyncLocalStorage` work correctly, update your `wrangler.toml`:

```toml
name = "my-buncf-app"
compatibility_flags = ["nodejs_compat"]
compatibility_date = "2024-09-23"
```

## Step 5: Create Client Instance

On the client side (e.g., `src/client.tsx` or `src/lib/auth-client.ts`), create the auth client:

```ts
// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000" // Optional if same domain
})

export const { signIn, signUp, useSession } = authClient;
```

## Step 6: Usage Example

You can now use the auth client in your React components:

```tsx
import { signIn, useSession } from "@/lib/auth-client";

export function Login() {
  const session = useSession();

  if (session.data) {
    return <div>Signed in as {session.data.user.email}</div>
  }

  return (
    <button onClick={() => signIn.social({ provider: "github" })}>
      Sign in with GitHub
    </button>
  );
}
```



# KYSELY
async function initDb() {
	const context = await getCloudflareContext({ async: true });

	return new Kysely({
		dialect: new D1Dialect({
			database: context.env.DB,
		}),
	});
}

const db = await initDb();

export const auth = betterAuth({
	database: {
		db,
		type: "sqlite",
	},
	emailAndPassword: {
		enabled: true,
		autoSignIn: false,
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
	plugins: [nextCookies()],
});