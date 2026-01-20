'use client';

import { CodeBlock } from "@/components/code-block";
import { PageHeader, Paragraph, DocNavigation, InlineCode } from "@/components/docs/doc-components";
import { Zap } from "lucide-react";

export default function ActionsPage() {
  return (
    <article className="px-6 py-12 lg:px-12">
      <PageHeader
        icon={Zap}
        title="Server Actions"
        description="Type-safe RPC with Zod validation."
      />

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Defining Actions</h2>
        <Paragraph>
          Server actions are type-safe RPC functions with built-in Zod validation:
        </Paragraph>
        <CodeBlock
          code={`// src/api/actions/createUser.ts
import { defineAction } from 'buncf';
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['user', 'admin']).default('user'),
});

export const createUser = defineAction(
  CreateUserSchema,
  async (input, ctx) => {
    // input is fully typed based on schema
    const { name, email, role } = input;
    
    // ctx provides request context
    const userId = ctx.request.headers.get('x-user-id');
    
    // Insert into database
    const user = await db.insert(users).values({
      name,
      email,
      role,
      createdBy: userId,
    }).returning();

    return user;
  },
);`}
          language="typescript"
          filename="src/api/actions/createUser.ts"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Using Actions</h2>
        <Paragraph>
          Import and call actions directly - they're fully typed end-to-end:
        </Paragraph>
        <CodeBlock
          code={`// src/pages/users/new.tsx
import { createUser } from '../../api/actions/createUser';

export default function NewUserPage() {
  const handleSubmit = async (formData: FormData) => {
    try {
      // Fully typed - TypeScript knows the input and output types
      const user = await createUser({
        name: formData.get('name') as string,
        email: formData.get('email') as string,
      });
      
      console.log('Created user:', user);
    } catch (error) {
      // Validation errors are thrown automatically
      console.error('Validation failed:', error);
    }
  };

  return (
    <form action={handleSubmit}>
      <input name="name" placeholder="Name" />
      <input name="email" type="email" placeholder="Email" />
      <button type="submit">Create User</button>
    </form>
  );
}`}
          language="tsx"
          filename="src/pages/users/new.tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Action Context</h2>
        <Paragraph>
          The context object provides access to the request and Cloudflare bindings:
        </Paragraph>
        <CodeBlock
          code={`export const myAction = defineAction(
  MySchema,
  async (input, ctx) => {
    // Access the original request
    const authHeader = ctx.request.headers.get('Authorization');
    
    // Access Cloudflare bindings
    const db = ctx.env.MY_DB;
    const kv = ctx.env.MY_KV;
    
    // Access request context
    const country = ctx.cf?.country;
    
    return { success: true };
  },
);`}
          language="typescript"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Error Handling</h2>
        <Paragraph>
          Validation errors are automatically thrown with detailed messages:
        </Paragraph>
        <CodeBlock
          code={`import { createUser } from '../api/actions/createUser';
import { ActionError } from 'buncf';

async function handleCreate() {
  try {
    const user = await createUser({
      name: '', // Invalid - empty string
      email: 'not-an-email', // Invalid email format
    });
  } catch (error) {
    if (error instanceof ActionError) {
      // Validation error with details
      console.log(error.errors);
      // [
      //   { path: ['name'], message: 'String must contain at least 1 character(s)' },
      //   { path: ['email'], message: 'Invalid email' }
      // ]
    }
  }
}`}
          language="tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">With useFetcher</h2>
        <Paragraph>
          Combine actions with <InlineCode>useFetcher</InlineCode> for loading states:
        </Paragraph>
        <CodeBlock
          code={`import { useFetcher } from 'buncf/router';
import { createUser } from '../api/actions/createUser';

function CreateUserForm() {
  const { submit, isSubmitting } = useFetcher();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    await submit(() => createUser({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" />
      <input name="email" type="email" />
      <button disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}`}
          language="tsx"
        />
      </section>

      <DocNavigation
        prev={{ href: "/docs/fetching", label: "Data Fetching" }}
        next={{ href: "/docs/bindings", label: "Magic Bindings" }}
      />
    </article>
  );
}
