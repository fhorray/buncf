'use client';

import { CodeBlock } from "@/components/code-block";
import { PageHeader, Paragraph, DocNavigation, InlineCode } from "@/components/docs/doc-components";
import { FileCode } from "lucide-react";

export default function LayoutsPage() {
  return (
    <article className="px-6 py-12 lg:px-12">
      <PageHeader
        icon={FileCode}
        title="Layouts & Metadata"
        description="Create nested layouts and manage page metadata."
      />

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Root Layout</h2>
        <Paragraph>
          Create a <InlineCode>_layout.tsx</InlineCode> file in <InlineCode>src/pages/</InlineCode> to wrap all pages:
        </Paragraph>
        <CodeBlock
          code={`// src/pages/_layout.tsx
export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <header>
          <nav>{/* Navigation */}</nav>
        </header>
        <main>{children}</main>
        <footer>{/* Footer */}</footer>
      </body>
    </html>
  );
}`}
          language="tsx"
          filename="src/pages/_layout.tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Nested Layouts</h2>
        <Paragraph>
          Create layouts for specific sections of your app:
        </Paragraph>
        <CodeBlock
          code={`// src/pages/dashboard/_layout.tsx
export default function DashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r">
        <nav>
          <a href="/dashboard">Overview</a>
          <a href="/dashboard/analytics">Analytics</a>
          <a href="/dashboard/settings">Settings</a>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}`}
          language="tsx"
          filename="src/pages/dashboard/_layout.tsx"
        />
        <Paragraph>
          This layout will wrap all pages under <InlineCode>/dashboard/*</InlineCode>.
        </Paragraph>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Loading States</h2>
        <Paragraph>
          Create <InlineCode>_loading.tsx</InlineCode> to show while pages are loading:
        </Paragraph>
        <CodeBlock
          code={`// src/pages/_loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
    </div>
  );
}

// src/pages/dashboard/_loading.tsx (section-specific)
export default function DashboardLoading() {
  return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    </div>
  );
}`}
          language="tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Error Boundaries</h2>
        <Paragraph>
          Create <InlineCode>_error.tsx</InlineCode> to handle errors gracefully:
        </Paragraph>
        <CodeBlock
          code={`// src/pages/_error.tsx
interface ErrorPageProps {
  error: Error;
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold text-red-500">Something went wrong!</h1>
      <p className="text-gray-600 mt-2">{error.message}</p>
      <button 
        onClick={reset}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Try again
      </button>
    </div>
  );
}`}
          language="tsx"
          filename="src/pages/_error.tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">404 Page</h2>
        <Paragraph>
          Create <InlineCode>_notfound.tsx</InlineCode> for custom 404 pages:
        </Paragraph>
        <CodeBlock
          code={`// src/pages/_notfound.tsx
import { Link } from 'buncf/router';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-xl text-gray-600 mt-4">Page not found</p>
      <Link href="/" className="mt-8 text-blue-500 hover:underline">
        Go back home
      </Link>
    </div>
  );
}`}
          language="tsx"
          filename="src/pages/_notfound.tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Page Metadata</h2>
        <Paragraph>
          Export a <InlineCode>meta</InlineCode> function to define page-specific metadata:
        </Paragraph>
        <CodeBlock
          code={`// src/pages/about.tsx
export const meta = () => [
  { title: 'About Us - My App' },
  { name: 'description', content: 'Learn more about our company and mission.' },
  { name: 'keywords', content: 'about, company, team' },
  
  // Open Graph
  { property: 'og:title', content: 'About Us' },
  { property: 'og:description', content: 'Learn more about our company' },
  { property: 'og:image', content: 'https://example.com/og/about.png' },
  { property: 'og:type', content: 'website' },
  
  // Twitter
  { name: 'twitter:card', content: 'summary_large_image' },
  { name: 'twitter:title', content: 'About Us' },
  { name: 'twitter:image', content: 'https://example.com/og/about.png' },
];

export default function AboutPage() {
  return <h1>About Us</h1>;
}`}
          language="tsx"
          filename="src/pages/about.tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Dynamic Metadata</h2>
        <Paragraph>
          Generate metadata based on route parameters or data:
        </Paragraph>
        <CodeBlock
          code={`// src/pages/blog/[slug].tsx
export const meta = ({ params, data }) => [
  { title: \`\${data?.title} - My Blog\` },
  { name: 'description', content: data?.excerpt },
  { property: 'og:title', content: data?.title },
  { property: 'og:image', content: data?.coverImage },
];

export default function BlogPost() {
  // ...
}`}
          language="tsx"
          filename="src/pages/blog/[slug].tsx"
        />
      </section>

      <DocNavigation
        prev={{ href: "/docs/bindings", label: "Magic Bindings" }}
        next={{ href: "/docs/middleware", label: "Middleware" }}
      />
    </article>
  );
}
