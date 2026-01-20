'use client';

import { CodeBlock } from "@/components/code-block";
import { PageHeader, Paragraph, DocNavigation, InlineCode } from "@/components/docs/doc-components";
import { FileCode } from "lucide-react";

export default function PageRoutesPage() {
  return (
    <article className="px-6 py-12 lg:px-12">
      <PageHeader
        icon={FileCode}
        title="Page Routes"
        description="Create React pages with file-system routing."
      />

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Basic Page</h2>
        <Paragraph>
          Export a default React component from files in <InlineCode>src/pages/</InlineCode>:
        </Paragraph>
        <CodeBlock
          code={`// src/pages/about.tsx
export default function AboutPage() {
  return (
    <div>
      <h1>About Us</h1>
      <p>Welcome to our website!</p>
    </div>
  );
}`}
          language="tsx"
          filename="src/pages/about.tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Dynamic Pages</h2>
        <Paragraph>
          Use the <InlineCode>useParams</InlineCode> hook to access dynamic route parameters:
        </Paragraph>
        <CodeBlock
          code={`// src/pages/users/[id].tsx
import { useParams } from 'buncf/router';

export default function UserPage() {
  const { id } = useParams();
  
  return (
    <div>
      <h1>User Profile</h1>
      <p>User ID: {id}</p>
    </div>
  );
}`}
          language="tsx"
          filename="src/pages/users/[id].tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Nested Pages</h2>
        <Paragraph>
          Create nested routes by organizing files in directories:
        </Paragraph>
        <CodeBlock
          code={`src/pages/
├── dashboard/
│   ├── index.tsx        → /dashboard
│   ├── settings.tsx     → /dashboard/settings
│   └── users/
│       ├── index.tsx    → /dashboard/users
│       └── [id].tsx     → /dashboard/users/:id`}
          language="text"
          showLineNumbers={false}
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Page with Data</h2>
        <Paragraph>
          Use <InlineCode>useFetcher</InlineCode> to load data in your pages:
        </Paragraph>
        <CodeBlock
          code={`// src/pages/users/[id].tsx
import { useParams } from 'buncf/router';
import { useFetcher } from 'buncf/router';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function UserPage() {
  const { id } = useParams();
  const { data: user, isLoading } = useFetcher<User>(\`/api/users/\${id}\`);
  
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}`}
          language="tsx"
          filename="src/pages/users/[id].tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Page Metadata</h2>
        <Paragraph>
          Export a <InlineCode>meta</InlineCode> function to set page metadata:
        </Paragraph>
        <CodeBlock
          code={`// src/pages/about.tsx
export const meta = () => [
  { title: 'About Us - My App' },
  { name: 'description', content: 'Learn more about our company' },
  { property: 'og:title', content: 'About Us' },
  { property: 'og:image', content: '/og/about.png' },
];

export default function AboutPage() {
  return <h1>About Us</h1>;
}`}
          language="tsx"
          filename="src/pages/about.tsx"
        />
      </section>

      <DocNavigation
        prev={{ href: "/docs/api-routes", label: "API Routes" }}
        next={{ href: "/docs/router", label: "React Router" }}
      />
    </article>
  );
}
