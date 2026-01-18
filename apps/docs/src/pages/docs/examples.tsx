import React from 'react';
import { CodeBlock } from '@/components/ui/code-block';

export const meta = () => [{ title: 'Examples & Integrations - Buncf Docs' }];

export default function ExamplesDocs() {
  return (
    <div className="space-y-10 max-w-4xl">
      <div className="space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
          Examples & Integrations
        </h1>
        <p className="text-xl text-muted-foreground">
          Learn how to integrate popular libraries and frameworks with Buncf.
        </p>
      </div>

      {/* Hono Integration */}
      <section className="space-y-6">
        <h2
          className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight"
          id="hono-integration"
        >
          Hono Integration
        </h2>
        <p className="leading-7">
          Buncf supports a powerful hybrid integration with{' '}
          <a
            href="https://hono.dev/"
            target="_blank"
            className="font-medium text-pink-500 hover:underline"
          >
            Hono
          </a>
          , allowing you to use its excellent Developer Experience (DX) while
          leveraging Bun's native router performance.
        </p>

        <div className="space-y-4">
          <h3
            className="text-2xl font-semibold tracking-tight"
            id="hono-catch-all"
          >
            Catch-All Route Pattern
          </h3>
          <p className="leading-7">
            The cleanest way to integrate Hono is using a "Catch-All" route.
            This allows you to delegate a specific path prefix (like{' '}
            <code>/api/*</code>) entirely to Hono.
          </p>
          <CodeBlock
            filename="src/api/[...route].ts"
            code={`import { Hono } from 'hono';

// Initialize Hono (set basePath if inside /api)
const app = new Hono().basePath('/api');

// Define your Hono routes
app.get('/hello', (c) => {
  return c.json({
    message: 'Hello from Hono inside Buncf!',
    path: c.req.path
  });
});

app.get('/users/:id', (c) => {
  return c.json({ userId: c.req.param('id') });
});

// Export Hono's fetch handler
// Buncf connects this automatically to the Bun server
export default app.fetch;`}
          />
        </div>

        <div className="space-y-4">
          <h3
            className="text-2xl font-semibold tracking-tight"
            id="hono-priority"
          >
            Route Priority
          </h3>
          <p className="leading-7">
            The hybrid system respects file hierarchy:
          </p>
          <ul className="list-disc pl-6 leading-7">
            <li>
              <strong>Specific Files:</strong> <code>src/api/users.ts</code>{' '}
              (Highest Priority)
            </li>
            <li>
              <strong>Catch-All (Hono):</strong>{' '}
              <code>src/api/[...route].ts</code> (Captures unmatched requests)
            </li>
          </ul>
        </div>
      </section>

      {/* Better Auth Integration */}
      <section className="space-y-6">
        <h2
          className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight"
          id="better-auth"
        >
          Better Auth Integration
        </h2>
        <p className="leading-7">
          Secure authentication for your Buncf app using{' '}
          <a
            href="https://better-auth.com/"
            target="_blank"
            className="font-medium text-pink-500 hover:underline"
          >
            Better Auth
          </a>
          .
        </p>

        <div className="space-y-4">
          <h3
            className="text-2xl font-semibold tracking-tight"
            id="auth-install"
          >
            Installation
          </h3>
          <CodeBlock language="bash" code={`bun add better-auth`} />
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-semibold tracking-tight" id="auth-env">
            Environment Setup
          </h3>
          <p className="leading-7">
            Add these to your <code>.env</code> file:
          </p>
          <CodeBlock
            language="bash"
            filename=".env"
            code={`BETTER_AUTH_SECRET=<your_generated_secret>
BETTER_AUTH_URL=http://localhost:3000`}
          />
        </div>

        <div className="space-y-4">
          <h3
            className="text-2xl font-semibold tracking-tight"
            id="auth-server"
          >
            Server Instance
          </h3>
          <p className="leading-7">
            Configure your auth instance in <code>src/lib/auth.ts</code>:
          </p>
          <CodeBlock
            filename="src/lib/auth.ts"
            code={`import { betterAuth } from "better-auth";

export const auth = betterAuth({
  // Database configuration (e.g., D1 with Drizzle)
  /*
  database: drizzleAdapter(db, {
      provider: "sqlite",
  }),
  */
  emailAndPassword: {
    enabled: true,
  }
});`}
          />
        </div>

        <div className="space-y-4">
          <h3
            className="text-2xl font-semibold tracking-tight"
            id="auth-handler"
          >
            API Handler
          </h3>
          <p className="leading-7">
            Create a catch-all route to handle auth requests at{' '}
            <code>/api/auth/*</code>.
          </p>
          <CodeBlock
            filename="src/api/auth/[...all].ts"
            code={`import { auth } from "@/lib/auth";

export default (request: Request) => {
    return auth.handler(request);
};`}
          />
        </div>

        <div className="space-y-4">
          <h3
            className="text-2xl font-semibold tracking-tight"
            id="auth-client"
          >
            Client Usage
          </h3>
          <p className="leading-7">Use the auth client in your components.</p>
          <CodeBlock
            filename="src/components/Login.tsx"
            code={`import { createAuthClient } from "better-auth/react"

const authClient = createAuthClient({
  baseURL: "http://localhost:3000"
});

export function Login() {
  const { signIn } = authClient;
  
  return (
    <button onClick={() => signIn.social({ provider: "github" })}>
      Sign in with GitHub
    </button>
  );
}`}
          />
        </div>
      </section>
    </div>
  );
}
