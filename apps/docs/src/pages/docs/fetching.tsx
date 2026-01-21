import { CodeBlock } from '@/components/code-block';

export const meta = () => [
  { title: 'Data Fetching - Buncf' },
  { name: 'description', content: 'Using useFetcher for data and mutations' },
];

export default function Fetching() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Data Fetching</h1>
      <p>
        Buncf provides a powerful <code>useFetcher</code> hook for interacting with your API.
        It supports both data fetching (SWR-style) and mutations.
      </p>

      <h2>Fetching Data (GET)</h2>
      <p>
        To fetch data, provide a URL key to <code>useFetcher</code>. The hook returns
        <code>data</code>, <code>isLoading</code>, and a <code>mutate</code> function to reload.
      </p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`import { useFetcher } from 'buncf/router';

interface User {
  id: string;
  name: string;
}

export default function UserList() {
  // Automatically fetches on mount
  const { data, isLoading, mutate } = useFetcher<User[]>('/api/users');

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <ul>
        {data?.map(user => <li key={user.id}>{user.name}</li>)}
      </ul>
      <button onClick={() => mutate()}>Refresh</button>
    </div>
  );
}`}
          language="tsx"
        />
      </div>

      <h2>Mutations (POST, PUT, DELETE)</h2>
      <p>
        To perform actions, call <code>useFetcher</code> without a key (or with options).
        It returns a <code>submit</code> function.
      </p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`import { useFetcher } from 'buncf/router';

export default function CreateUser() {
  const { submit, isSubmitting } = useFetcher();

  const handleCreate = async () => {
    await submit(
      { name: "Alice" }, // Body
      { method: "POST", action: "/api/users" } // Options
    );
  };

  return (
    <button onClick={handleCreate} disabled={isSubmitting}>
      Create User
    </button>
  );
}`}
          language="tsx"
        />
      </div>

      <h2>Declarative Forms</h2>
      <p>
        <code>useFetcher</code> also provides a <code>Form</code> component that automatically
        handles submission states and prevents default browser behavior.
      </p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`const { Form, isSubmitting } = useFetcher();

<Form action="/api/login" method="POST">
  <input name="email" type="email" />
  <input name="password" type="password" />
  <button disabled={isSubmitting}>Login</button>
</Form>`}
          language="tsx"
        />
      </div>

      <h2>Callbacks</h2>
      <p>You can hook into the lifecycle of a request with <code>onSuccess</code> and <code>onError</code>.</p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`const { submit } = useFetcher(null, {
  onSuccess: (data) => {
    toast.success("Saved successfully!");
    router.push("/dashboard");
  },
  onError: (error) => {
    toast.error(error.message);
  }
});`}
          language="tsx"
        />
      </div>

      <h2>Auto-Generated API Client</h2>
      <p>
        For maximum type safety, Buncf generates a typed client in <code>.buncf/api-client.ts</code>.
        You can import this client to make direct fetch calls with full type inference.
      </p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`import { api } from '../.buncf/api-client';

// 'user' is fully typed based on your API handler return type!
const user = await api.get('/api/users/:id', {
  params: { id: '123' }
});`}
          language="typescript"
        />
      </div>
    </div>
  );
}
