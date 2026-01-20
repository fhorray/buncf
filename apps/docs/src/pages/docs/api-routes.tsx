import { CodeBlock } from "@/components/code-block";
import { PageHeader, Paragraph, DocNavigation, InlineCode } from "@/components/docs/doc-components";
import { Code2 } from "lucide-react";

export default function APIRoutesPage() {
  return (
    <article className="px-6 py-12 lg:px-12">
      <PageHeader
        icon={Code2}
        title="API Routes"
        description="Create type-safe API endpoints with file-system routing."
      />

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Basic API Route</h2>
        <Paragraph>
          Export HTTP method handlers from files in <InlineCode>src/api/</InlineCode>:
        </Paragraph>
        <CodeBlock
          code={`// src/api/hello.ts
import { defineHandler } from 'buncf';

export const GET = defineHandler(() => {
  return Response.json({ message: 'Hello, World!' });
});

export const POST = defineHandler(async (req) => {
  const body = await req.json();
  return Response.json({ received: body });
});`}
          language="typescript"
          filename="src/api/hello.ts"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Dynamic Parameters</h2>
        <Paragraph>
          Access route parameters with full type safety:
        </Paragraph>
        <CodeBlock
          code={`// src/api/users/[id].ts
import { defineHandler } from 'buncf';

interface User {
  id: string;
  name: string;
}

// Type the params and response
export const GET = defineHandler<{ id: string }, User>((req) => {
  const { id } = req.params;
  return Response.json({ id, name: 'Alice' });
});

export const DELETE = defineHandler<{ id: string }, void>((req) => {
  const { id } = req.params;
  // Delete user logic...
  return new Response(null, { status: 204 });
});`}
          language="typescript"
          filename="src/api/users/[id].ts"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Request Object</h2>
        <Paragraph>
          The request object extends the standard <InlineCode>Request</InlineCode> with additional properties:
        </Paragraph>
        <CodeBlock
          code={`export const POST = defineHandler(async (req) => {
  // Standard Request properties
  const body = await req.json();
  const headers = req.headers;
  const url = new URL(req.url);

  // buncf additions
  const { id } = req.params;       // Route params
  const query = req.query;          // Query string params
  const cf = req.cf;                // Cloudflare request properties

  return Response.json({ success: true });
});`}
          language="typescript"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Catch-All Routes</h2>
        <Paragraph>
          Use <InlineCode>[...route].ts</InlineCode> to handle multiple paths with a single file:
        </Paragraph>
        <CodeBlock
          code={`// src/api/[...route].ts
import { defineHandler } from 'buncf';

// Catches all routes under /api/*
export const GET = defineHandler((req) => {
  const path = req.params.route; // Array of path segments
  
  // Handle legacy routes
  if (path[0] === 'legacy') {
    return Response.json({ legacy: true });
  }
  
  // Handle webhooks
  if (path[0] === 'webhook') {
    const provider = path[1];
    return Response.json({ provider });
  }
  
  return Response.json({ path });
});`}
          language="typescript"
          filename="src/api/[...route].ts"
        />
        <Paragraph>
          This is useful for handling complex routing scenarios or migrating legacy endpoints.
        </Paragraph>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Response Helpers</h2>
        <CodeBlock
          code={`import { defineHandler } from 'buncf';

export const GET = defineHandler(() => {
  // JSON response
  return Response.json({ data: 'value' });

  // Text response
  return new Response('Hello');

  // With status code
  return new Response('Not Found', { status: 404 });

  // With headers
  return new Response('OK', {
    headers: { 'X-Custom': 'value' }
  });

  // Redirect
  return Response.redirect('/new-url', 302);
});`}
          language="typescript"
        />
      </section>

      <DocNavigation
        prev={{ href: "/docs/routing", label: "File-System Routing" }}
        next={{ href: "/docs/page-routes", label: "Page Routes" }}
      />
    </article>
  );
}
