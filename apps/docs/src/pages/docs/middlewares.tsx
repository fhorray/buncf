import { CodeBlock } from '@/components/code-block';

export const meta = () => [
  { title: 'Middleware - Buncf' },
  { name: 'description', content: 'Intercepting requests with Middleware' },
];

export default function Middleware() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Middleware</h1>
      <p>
        Middleware allows you to run code before a request is completed.
        You can use it for authentication, logging, redirects, or modifying headers.
      </p>

      <h2>Definition</h2>
      <p>
        Create a file named <code>src/middleware.ts</code> (or .js) and export a default
        array of middleware configurations.
      </p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`import type { MiddlewareConfig } from 'buncf';

export default [
  // 1. Logger Middleware (Runs on all API routes)
  {
    name: 'logger',
    matcher: '/api/*',
    handler: async (req, next) => {
      console.log(\`[\${req.method}] \${req.url}\`);
      const start = Date.now();
      
      const res = await next(); // Continue to next middleware/handler
      
      const duration = Date.now() - start;
      res.headers.set('X-Response-Time', \`\${duration}ms\`);
      return res;
    }
  },

  // 2. Auth Middleware (Runs on protected routes)
  {
    name: 'auth',
    matcher: ['/api/admin/*', '/dashboard/*'],
    handler: async (req, next) => {
      const token = req.headers.get('Authorization');
      
      if (!token) {
        return new Response('Unauthorized', { status: 401 });
      }
      
      // Verify token...

      return next();
    }
  }
] satisfies MiddlewareConfig[];`}
          language="typescript"
          filename="src/middleware.ts"
        />
      </div>

      <h2>Matching Paths</h2>
      <p>The <code>matcher</code> property supports:</p>
      <ul>
        <li><strong>String:</strong> Single glob pattern (e.g., <code>/api/*</code>).</li>
        <li><strong>Array:</strong> Multiple patterns (e.g., <code>['/api/*', '/dashboard']</code>).</li>
        <li><strong>Undefined:</strong> Matches ALL requests.</li>
      </ul>

      <h2>Execution Order</h2>
      <p>Middleware functions are executed in the order they appear in the array.</p>
    </div>
  );
}
