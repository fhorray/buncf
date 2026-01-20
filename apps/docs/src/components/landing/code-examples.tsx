"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CodeBlock } from "@/components/code-block";

const examples = [
  {
    id: "api",
    label: "API Routes",
    filename: "src/api/users/[id].ts",
    code: `import { defineHandler } from 'buncf';

interface User {
  id: string;
  name: string;
}

// GET /api/users/:id
export const GET = defineHandler<{ id: string }, User>((req) => {
  return Response.json({ 
    id: req.params.id, 
    name: 'Alice' 
  });
});

// DELETE /api/users/:id
export const DELETE = defineHandler<{ id: string }, void>((req) => {
  // Delete user...
  return new Response(null, { status: 204 });
});`,
  },
  {
    id: "pages",
    label: "Page Routes",
    filename: "src/pages/users/[id].tsx",
    code: `import { useParams } from 'buncf/router';

export const meta = () => [
  { title: 'User Profile' },
  { name: 'description', content: 'View user details' },
];

export default function UserPage() {
  const { id } = useParams();
  
  return (
    <div className="container">
      <h1>User: {id}</h1>
      <ProfileCard userId={id} />
    </div>
  );
}`,
  },
  {
    id: "bindings",
    label: "Magic Bindings",
    filename: "src/api/data.ts",
    code: `import { d1, kv, r2, env, context } from 'buncf/bindings';

export async function GET() {
  // D1 Database
  const users = await d1.MY_DB
    .prepare('SELECT * FROM users')
    .all();

  // KV Storage
  const value = await kv.MY_KV.get('key');

  // R2 Object Storage
  const object = await r2.MY_BUCKET.get('file.png');

  // Environment variables
  const apiKey = env.API_KEY;

  return Response.json({ users, value, apiKey });
}`,
  },
  {
    id: "fetcher",
    label: "Data Fetching",
    filename: "src/pages/dashboard.tsx",
    code: `import { useFetcher, Link } from 'buncf/router';

interface User {
  id: string;
  name: string;
  email: string;
}

export default function Dashboard() {
  const { data, isLoading, mutate } = useFetcher<User[]>('/api/users');
  
  const { submit, isSubmitting } = useFetcher<User[]>('/api/users', {
    onSuccess: () => toast.success('User created!'),
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = async () => {
    await submit({ name: 'Alice' }, { method: 'POST' });
    mutate(); // Refresh the list
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <button onClick={handleCreate} disabled={isSubmitting}>
        Add User
      </button>
      {data?.map(user => (
        <Link key={user.id} href={\`/users/\${user.id}\`}>
          {user.name}
        </Link>
      ))}
    </div>
  );
}`,
  },
  {
    id: "actions",
    label: "Server Actions",
    filename: "src/api/actions/createUser.ts",
    code: `import { defineAction } from 'buncf';
import { z } from 'zod';
import { d1 } from 'buncf/bindings';

export const createUser = defineAction(
  z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }),
  async (input, ctx) => {
    // Full type safety and validation
    const user = await d1.MY_DB
      .prepare('INSERT INTO users (name, email) VALUES (?, ?)')
      .bind(input.name, input.email)
      .run();
    
    return { id: user.lastRowId, ...input };
  }
);

// Client usage - fully typed!
// import { createUser } from '../api/actions/createUser';
// const user = await createUser({ name: 'Alice', email: 'alice@example.com' });`,
  },
];

export function CodeExamples() {
  const [activeTab, setActiveTab] = useState(examples[0].id);
  const activeExample = examples.find((e) => e.id === activeTab)!;

  return (
    <section className="py-24 px-6 bg-secondary/20">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Write less,
            <span className="text-neon"> ship faster</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Clean APIs that let you focus on building your product.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {examples.map((example) => (
            <button
              key={example.id}
              onClick={() => setActiveTab(example.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === example.id
                  ? "bg-neon text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {example.label}
            </button>
          ))}
        </div>

        {/* Code block */}
        <CodeBlock
          code={activeExample.code}
          language="typescript"
          filename={activeExample.filename}
        />
      </div>
    </section>
  );
}
