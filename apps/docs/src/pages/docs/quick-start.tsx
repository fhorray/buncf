import { CodeBlock } from '@/components/code-block';

export const meta = () => [
  { title: 'Quick Start - Buncf' },
  { name: 'description', content: 'Get up and running with Buncf in minutes' },
];

export default function QuickStart() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Quick Start</h1>
      <p>Follow this guide to create your first Buncf application.</p>

      <h2>1. Initialize Project</h2>
      <div className="not-prose my-4">
        <CodeBlock code="bunx buncf init my-app" language="bash" />
      </div>

      <h2>2. Start Development Server</h2>
      <div className="not-prose my-4">
        <CodeBlock
          code={`cd my-app
bun dev`}
          language="bash"
        />
      </div>
      <p>
        The server will start at <code>http://localhost:3000</code>.
        Buncf includes hot-reloading, so changes to your files will instantly appear in the browser.
      </p>

      <h2>3. Create an API Route</h2>
      <p>Create a new file at <code>src/api/hello.ts</code>:</p>
      <div className="not-prose my-4">
        <CodeBlock
          code={`import { defineHandler } from 'buncf';

export const GET = defineHandler((req) => {
  return Response.json({ message: "Hello from Buncf!" });
});`}
          language="typescript"
          filename="src/api/hello.ts"
        />
      </div>
      <p>Visit <code>http://localhost:3000/api/hello</code> to see the JSON response.</p>

      <h2>4. Create a Page</h2>
      <p>Create a new file at <code>src/pages/about.tsx</code>:</p>
      <div className="not-prose my-4">
        <CodeBlock
          code={`import { Link } from 'buncf/router';

export default function About() {
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">About Us</h1>
      <p className="mt-4">Built with Buncf.</p>
      <Link href="/" className="text-blue-500 mt-4 block">
        Go Home
      </Link>
    </div>
  );
}`}
          language="tsx"
          filename="src/pages/about.tsx"
        />
      </div>
      <p>Visit <code>http://localhost:3000/about</code> to see your new page.</p>

      <h2>5. Deploy</h2>
      <p>When you're ready to go live on Cloudflare Workers:</p>
      <div className="not-prose my-4">
        <CodeBlock code="bun deploy" language="bash" />
      </div>
      <p>
        This will verify your build and deploy it using Wrangler.
        You may be prompted to log in to Cloudflare if you haven't already.
      </p>
    </div>
  );
}
