'use client';

import { CodeBlock } from "@/components/code-block";
import { PageHeader, Paragraph, TableWrapper, DocNavigation, InlineCode } from "@/components/docs/doc-components";
import { Route } from "lucide-react";
import { Suspense } from 'react';
import Loading from './loading';

export default function RouterPage() {
  return (
    <article className="px-6 py-12 lg:px-12">
      <PageHeader
        icon={Route}
        title="React Router"
        description="Navigation hooks and components for client-side routing."
      />

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Available Hooks</h2>
        <CodeBlock
          code={`import {
  useRouter,
  useParams,
  useSearchParams,
  usePathname,
  useFetcher,
  Link,
} from 'buncf/router';`}
          language="typescript"
          showLineNumbers={false}
        />

        <TableWrapper>
          <thead className="bg-secondary/30">
            <tr>
              <th className="text-left p-3 font-semibold">Hook</th>
              <th className="text-left p-3 font-semibold">Returns</th>
            </tr>
          </thead>
          <tbody>
            {[
              { hook: "useRouter()", returns: "{ pathname, params, query, push, replace, back, forward }" },
              { hook: "useParams()", returns: '{ id: "123", ... } — dynamic route params' },
              { hook: "useSearchParams()", returns: "[params, setParams] — query string" },
              { hook: "usePathname()", returns: '"/current/path"' },
            ].map((item) => (
              <tr key={item.hook} className="border-t border-border/50">
                <td className="p-3 font-mono text-neon">{item.hook}</td>
                <td className="p-3 text-muted-foreground text-sm">{item.returns}</td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">useRouter</h2>
        <Paragraph>
          The main router hook for navigation and route information:
        </Paragraph>
        <CodeBlock
          code={`import { useRouter } from 'buncf/router';

function MyComponent() {
  const router = useRouter();

  // Current route info
  console.log(router.pathname); // "/users/123"
  console.log(router.params);   // { id: "123" }
  console.log(router.query);    // { sort: "name" }

  // Navigation methods
  router.push('/about');        // Navigate to /about
  router.replace('/login');     // Replace current history entry
  router.back();                // Go back
  router.forward();             // Go forward
}`}
          language="tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">useParams</h2>
        <Paragraph>
          Access dynamic route parameters:
        </Paragraph>
        <CodeBlock
          code={`// Route: /users/[id]/posts/[postId]
// URL: /users/123/posts/456

import { useParams } from 'buncf/router';

function PostPage() {
  const { id, postId } = useParams();
  // id = "123", postId = "456"
}`}
          language="tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">useSearchParams</h2>
        <Paragraph>
          Read and update URL query parameters:
        </Paragraph>
        <Suspense fallback={<Loading />}>
          <CodeBlock
            code={`import { useSearchParams } from 'buncf/router';

function SearchPage() {
  const [params, setParams] = useSearchParams();
  
  const query = params.get('q');
  const page = params.get('page') || '1';

  const handleSearch = (q: string) => {
    setParams({ q, page: '1' });
  };

  const nextPage = () => {
    setParams({ ...Object.fromEntries(params), page: String(Number(page) + 1) });
  };
}`}
            language="tsx"
          />
        </Suspense>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Link Component</h2>
        <Paragraph>
          Use <InlineCode>Link</InlineCode> for client-side navigation:
        </Paragraph>
        <CodeBlock
          code={`import { Link } from 'buncf/router';

function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      
      {/* Prefetch on hover for faster navigation */}
      <Link href="/dashboard" prefetch>
        Dashboard
      </Link>

      {/* Replace history instead of push */}
      <Link href="/login" replace>
        Login
      </Link>
    </nav>
  );
}`}
          language="tsx"
        />
      </section>

      <DocNavigation
        prev={{ href: "/docs/page-routes", label: "Page Routes" }}
        next={{ href: "/docs/fetching", label: "Data Fetching" }}
      />
    </article>
  );
}
