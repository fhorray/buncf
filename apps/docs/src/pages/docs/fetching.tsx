'use client';

import { CodeBlock } from "@/components/code-block";
import { PageHeader, Paragraph, DocNavigation, InlineCode } from "@/components/docs/doc-components";
import { RefreshCw } from "lucide-react";

export default function FetchingPage() {
  return (
    <article className="px-6 py-12 lg:px-12">
      <PageHeader
        icon={RefreshCw}
        title="Data Fetching"
        description="SWR-style data fetching with useFetcher."
      />

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">useFetcher Hook</h2>
        <Paragraph>
          The <InlineCode>useFetcher</InlineCode> hook provides SWR-style data fetching with automatic caching, 
          revalidation, and mutation support.
        </Paragraph>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Auto-Fetch (GET)</h2>
        <Paragraph>
          Pass a URL to automatically fetch data on mount:
        </Paragraph>
        <CodeBlock
          code={`import { useFetcher } from 'buncf/router';

interface User {
  id: string;
  name: string;
}

function UserList() {
  const { data, isLoading, error, mutate } = useFetcher<User[]>('/api/users');

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={() => mutate()}>Refresh</button>
      <ul>
        {data?.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}`}
          language="tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Mutations (POST/PUT/DELETE)</h2>
        <Paragraph>
          Use <InlineCode>submit</InlineCode> for mutations:
        </Paragraph>
        <CodeBlock
          code={`function CreateUser() {
  const { submit, isSubmitting } = useFetcher();

  const handleCreate = async () => {
    await submit(
      { name: 'Alice', email: 'alice@example.com' },
      { method: 'POST', action: '/api/users' }
    );
  };

  return (
    <button onClick={handleCreate} disabled={isSubmitting}>
      {isSubmitting ? 'Creating...' : 'Create User'}
    </button>
  );
}`}
          language="tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">With Callbacks</h2>
        <Paragraph>
          Handle success and error states with callbacks:
        </Paragraph>
        <CodeBlock
          code={`const { submit } = useFetcher<User[]>('/api/users', {
  onSuccess: (data, variables) => {
    toast.success('User created!');
    console.log('Submitted data:', variables);
    console.log('Response:', data);
  },
  onError: (error) => {
    toast.error(error.message);
  },
  onSettled: () => {
    // Called on both success and error
    setIsOpen(false);
  },
});`}
          language="tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Declarative Form</h2>
        <Paragraph>
          Use the <InlineCode>Form</InlineCode> component for declarative form handling:
        </Paragraph>
        <CodeBlock
          code={`function ContactForm() {
  const { Form, isSubmitting, data } = useFetcher();

  return (
    <Form action="/api/contact" method="POST">
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <textarea name="message" placeholder="Message" />
      
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
      
      {data?.success && <p>Message sent!</p>}
    </Form>
  );
}`}
          language="tsx"
        />
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Revalidation Options</h2>
        <CodeBlock
          code={`const { data, mutate } = useFetcher('/api/users', {
  // Revalidate on window focus
  revalidateOnFocus: true,
  
  // Revalidate on network reconnect
  revalidateOnReconnect: true,
  
  // Poll every 30 seconds
  refreshInterval: 30000,
  
  // Keep previous data while revalidating
  keepPreviousData: true,
});

// Manual revalidation
mutate();

// Optimistic update
mutate(async (current) => {
  return [...current, newUser];
}, { revalidate: false });`}
          language="tsx"
        />
      </section>

      <DocNavigation
        prev={{ href: "/docs/router", label: "React Router" }}
        next={{ href: "/docs/actions", label: "Server Actions" }}
      />
    </article>
  );
}
