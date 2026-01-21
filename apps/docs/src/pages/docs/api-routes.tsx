import { CodeBlock } from '@/components/code-block';

export const meta = () => [
  { title: 'API Routes - Buncf' },
  { name: 'description', content: 'Building type-safe API endpoints' },
];

export default function ApiRoutes() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>API Routes</h1>
      <p>
        API routes allow you to build backend endpoints. They are defined in <code>src/api</code>
        and map directly to HTTP methods.
      </p>

      <h2>Defining Handlers</h2>
      <p>
        Export functions named <code>GET</code>, <code>POST</code>, <code>PUT</code>, <code>PATCH</code>,
        or <code>DELETE</code> to handle requests. Buncf provides helper functions <code>defineHandler</code>
        and <code>defineBody</code> for type safety.
      </p>

      <h3>GET / DELETE Requests</h3>
      <p>Use <code>defineHandler</code> for requests that typically don't include a body.</p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`import { defineHandler } from 'buncf';

// Explicitly type params and response for client-side type inference
export const GET = defineHandler<{ id: string }, { id: string; name: string }>(
  (req) => {
    const { id } = req.params;
    return Response.json({ id, name: "Alice" });
  }
);`}
          language="typescript"
          filename="src/api/users/[id].ts"
        />
      </div>

      <h3>POST / PUT Requests</h3>
      <p>
        Use <code>defineBody</code> for requests that include a JSON body.
        It adds a type-safe <code>req.json()</code> method.
      </p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`import { defineBody } from 'buncf';

interface CreateUserRequest {
  name: string;
  email: string;
}

export const POST = defineBody<{}, CreateUserRequest>(async (req) => {
  const body = await req.json(); // typed as CreateUserRequest
  
  // Create user logic...
  
  return Response.json({ success: true });
});`}
          language="typescript"
          filename="src/api/users/index.ts"
        />
      </div>

      <h2>Accessing Request Data</h2>
      <p>The handler function receives a standard <code>Request</code> object, augmented with:</p>
      <ul>
        <li><code>req.params</code>: Route parameters (e.g., <code>id</code> from <code>[id].ts</code>).</li>
        <li><code>req.json()</code>: (Via <code>defineBody</code>) Typed body parser.</li>
      </ul>

      <h2>Type-Safe Client</h2>
      <p>
        Buncf automatically generates a type-safe client based on your API definitions.
        See the <a href="/docs/fetching">Data Fetching</a> section for details.
      </p>
    </div>
  );
}
