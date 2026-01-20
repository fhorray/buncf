import { CodeBlock } from "@/components/code-block";
import { PageHeader, Paragraph, DocNavigation, InlineCode } from "@/components/docs/doc-components";
import { Settings } from "lucide-react";

export default function MiddlewarePage() {
  return (
    <article className="px-6 py-12 lg:px-12">
      <PageHeader
        icon={Settings}
        title="Middleware"
        description="Intercept and modify requests before they reach your routes."
      />

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Creating Middleware</h2>
        <Paragraph>
          Create a <InlineCode>src/middleware.ts</InlineCode> file and export an array of middleware configurations:
        </Paragraph>
        <CodeBlock
          code={`// src/middleware.ts
import type { MiddlewareConfig } from 'buncf';

export default [
  {
    name: 'auth',
    matcher: '/api/protected/*',
    handler: async (req, next) => {
      const token = req.headers.get('Authorization');
      
      if (!token) {
        return new Response('Unauthorized', { status: 401 });
      }
      
      // Verify token...
      return next();
    },
  },
] satisfies MiddlewareConfig[];`}
          language="typescript"
          filename="src/middleware.ts"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Matcher Patterns</h2>
        <Paragraph>
          The <InlineCode>matcher</InlineCode> property supports glob patterns:
        </Paragraph>
        <CodeBlock
          code={`// Match all API routes
matcher: '/api/*'

// Match specific path
matcher: '/api/users'

// Match nested paths
matcher: '/api/users/*'

// Match multiple patterns
matcher: ['/api/*', '/admin/*']

// Exclude patterns
matcher: {
  include: '/api/*',
  exclude: '/api/public/*',
}`}
          language="typescript"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Multiple Middleware</h2>
        <Paragraph>
          Middleware runs in order. Each can either call <InlineCode>next()</InlineCode> to continue or return a response to stop:
        </Paragraph>
        <CodeBlock
          code={`export default [
  // 1. Logging - runs first
  {
    name: 'logger',
    matcher: '/*',
    handler: async (req, next) => {
      const start = Date.now();
      const response = await next();
      const duration = Date.now() - start;
      
      console.log(\`[\${req.method}] \${req.url} - \${duration}ms\`);
      
      return response;
    },
  },
  
  // 2. Rate limiting
  {
    name: 'rateLimit',
    matcher: '/api/*',
    handler: async (req, next) => {
      const ip = req.headers.get('CF-Connecting-IP');
      const requests = await getRequestCount(ip);
      
      if (requests > 100) {
        return new Response('Too Many Requests', { status: 429 });
      }
      
      return next();
    },
  },
  
  // 3. Authentication - runs last
  {
    name: 'auth',
    matcher: '/api/protected/*',
    handler: async (req, next) => {
      const token = req.headers.get('Authorization');
      
      if (!token || !await verifyToken(token)) {
        return new Response('Unauthorized', { status: 401 });
      }
      
      return next();
    },
  },
] satisfies MiddlewareConfig[];`}
          language="typescript"
          filename="src/middleware.ts"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Modifying Requests</h2>
        <Paragraph>
          Pass modified request or add data for downstream handlers:
        </Paragraph>
        <CodeBlock
          code={`{
  name: 'addUser',
  matcher: '/api/*',
  handler: async (req, next) => {
    const token = req.headers.get('Authorization');
    
    if (token) {
      const user = await verifyToken(token);
      
      // Add user to request headers (or use a Map/WeakMap)
      req.headers.set('X-User-Id', user.id);
      req.headers.set('X-User-Role', user.role);
    }
    
    return next();
  },
}`}
          language="typescript"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Modifying Responses</h2>
        <Paragraph>
          Middleware can also modify responses:
        </Paragraph>
        <CodeBlock
          code={`{
  name: 'cors',
  matcher: '/api/*',
  handler: async (req, next) => {
    // Handle preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
    
    const response = await next();
    
    // Add CORS headers to response
    response.headers.set('Access-Control-Allow-Origin', '*');
    
    return response;
  },
}`}
          language="typescript"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Common Patterns</h2>
        
        <h3 className="text-lg font-semibold mt-6 mb-3">Redirect</h3>
        <CodeBlock
          code={`{
  name: 'redirect',
  matcher: '/old-path',
  handler: async () => {
    return Response.redirect('/new-path', 301);
  },
}`}
          language="typescript"
        />

        <h3 className="text-lg font-semibold mt-6 mb-3">Rewrite</h3>
        <CodeBlock
          code={`{
  name: 'rewrite',
  matcher: '/blog/*',
  handler: async (req, next) => {
    const url = new URL(req.url);
    url.pathname = url.pathname.replace('/blog', '/posts');
    
    return next(new Request(url, req));
  },
}`}
          language="typescript"
        />
      </section>

      <DocNavigation
        prev={{ href: "/docs/layouts", label: "Layouts & Metadata" }}
        next={{ href: "/docs/styling", label: "Styling" }}
      />
    </article>
  );
}
