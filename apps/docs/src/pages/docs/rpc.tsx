import { CodeBlock } from '@/components/ui/code-block';
import { Link } from 'buncf/router';

export const meta = () => [{ title: 'RPC & Server Actions - Buncf' }];

export default function RpcDocs() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          RPC & Server Actions
        </h1>
        <p className="text-xl text-muted-foreground">
          Call server-side functions directly from your components with full
          type safety.
        </p>
      </div>

      <div className="flex items-center space-x-2 text-sm text-yellow-500 bg-yellow-500/10 px-4 py-2 rounded-lg border border-yellow-500/20">
        <span>
          ⚠️ This feature is in beta. APIs may change slightly before v1.0.
        </span>
      </div>

      <h2 className="text-2xl font-semibold mt-8 border-b border-white/10 pb-2">
        Overview
      </h2>
      <p>
        Buncf simplifies the boundary between client and server. Instead of
        manually creating API routes and fetching them with <code>fetch()</code>
        , you can define "Actions" on the server and call them as if they were
        local functions.
      </p>

      <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
        <li>
          <strong>Type Safety:</strong> Arguments and return values are fully
          typed.
        </li>
        <li>
          <strong>Validation:</strong> Built-in Zod validation ensures data
          integrity.
        </li>
        <li>
          <strong>Zero Boilerplate:</strong> No need to manually serialize JSON
          or handle headers.
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 border-b border-white/10 pb-2 text-purple-400">
        1. Magic Server Actions (Auto-RPC)
      </h2>
      <p>
        Buncf automatically creates RPC endpoints for any file ending in{' '}
        <code>.action.ts</code>. You simply define your logic, and call it
        directly from your React components.
      </p>

      <div className="space-y-4">
        <h3 className="text-xl font-medium">
          A. Define in <code>*.action.ts</code>
        </h3>
        <p className="text-sm text-muted-foreground">
          Create a file like <code>src/todos.action.ts</code>. Use{' '}
          <code>defineAction</code> to include type-safe validation.
        </p>
        <CodeBlock
          filename="src/todos.action.ts"
          code={`import { defineAction } from "buncf";
import { z } from "zod";

export const createTodo = defineAction(
  z.object({ text: z.string().min(1) }),
  async ({ text }, { request }) => {
    // This code ONLY runs on the server (Worker)
    console.log("Saving to DB:", text);
    return { success: true, id: Date.now() };
  }
);`}
        />
      </div>

      <div className="space-y-4 mt-8">
        <h3 className="text-xl font-medium">B. Import and Call Direct</h3>
        <p className="text-sm text-muted-foreground">
          Import your action like a normal function. Buncf's compiler replaces
          it with a secure <code>fetch</code> call automatically.
        </p>
        <CodeBlock
          filename="src/pages/index.tsx"
          code={`import { createTodo } from "../todos.action";

export default function Page() {
  const handleClick = async () => {
    // Direct call! Fully typed, automatic RPC.
    const result = await createTodo({ text: "Buy Milk" });
    alert("Saved: " + result.id);
  };

  return <button onClick={handleClick}>Add Todo</button>;
}`}
        />
      </div>

      <h2 className="text-2xl font-semibold mt-12 border-b border-white/10 pb-2">
        2. Advanced: Manual Action Handlers
      </h2>
      <p>
        If you need a specific URL path or custom middleware for an action, you
        can still expose it manually using <code>handleAction</code> in an API
        route.
      </p>

      <CodeBlock
        filename="src/api/custom-path.ts"
        code={`import { handleAction } from "buncf";
import { createTodo } from "../../todos.action";

export default (req: Request) => handleAction(req, createTodo);`}
      />

      <h2 className="text-2xl font-semibold mt-12 border-b border-white/10 pb-2">
        3. The <code>useAction</code> Hook
      </h2>
      <p>
        For better state management (loading, error, validation), use the{' '}
        <code>useAction</code> hook. It works with both automatic and manual
        endpoints.
      </p>

      <CodeBlock
        filename="src/pages/signup.tsx"
        code={`import { useAction } from "buncf/router";
import { createTodo } from "../todos.action";

export default function Signup() {
  const { run, data, loading, error } = useAction(createTodo);

  return (
    <div>
      <button onClick={() => run({ text: "Test" })} disabled={loading}>
        {loading ? "Saving..." : "Save"}
      </button>
      {data && <p>Saved ID: {data.id}</p>}
    </div>
  );
}`}
      />
    </div>
  );
}
