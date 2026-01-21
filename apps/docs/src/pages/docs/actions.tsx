import { CodeBlock } from '@/components/code-block';

export const meta = () => [
  { title: 'Server Actions - Buncf' },
  { name: 'description', content: 'Type-safe RPC with Zod validation' },
];

export default function Actions() {
  return (
    <div className="prose prose-invert max-w-none">
      <h1>Server Actions</h1>
      <p>
        Server Actions provide a seamless RPC (Remote Procedure Call) layer.
        Instead of manually creating API endpoints and fetching them, you define a function
        on the server and call it directly from the client.
      </p>

      <h2>Defining an Action</h2>
      <p>
        Use <code>defineAction</code> to create an action. You must provide a Zod schema
        to validate the input.
      </p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`// src/api/actions/todos.ts
import { defineAction } from 'buncf';
import { z } from 'zod';
import { d1 } from 'buncf/bindings';

export const createTodo = defineAction(
  // 1. Input Validation Schema
  z.object({
    title: z.string().min(3),
    priority: z.enum(['low', 'high'])
  }),
  // 2. Server-side Handler
  async (input, ctx) => {
    // 'input' is typed and validated
    // 'ctx.request' contains the request object
    
    await d1.DB.prepare('INSERT INTO todos (title, priority) VALUES (?, ?)')
      .bind(input.title, input.priority)
      .run();
      
    return { success: true };
  }
);`}
          language="typescript"
          filename="src/api/actions/todos.ts"
        />
      </div>

      <h2>Calling from Client</h2>
      <p>
        Import the action and call it like a normal async function. Buncf handles the
        network request, serialization, and error handling.
      </p>

      <div className="not-prose my-6">
        <CodeBlock
          code={`// src/pages/todos.tsx
import { createTodo } from '../api/actions/todos';
import { useState } from 'react';

export default function Todos() {
  const [error, setError] = useState('');

  const handleAdd = async () => {
    try {
      // Type-safe call!
      await createTodo({ title: "Buy Milk", priority: "high" });
    } catch (e) {
      // Validation errors or server errors
      setError(e.message);
    }
  };

  return <button onClick={handleAdd}>Add Todo</button>;
}`}
          language="tsx"
          filename="src/pages/todos.tsx"
        />
      </div>

      <h2>How it Works</h2>
      <p>
        During the build process, Buncf:
      </p>
      <ol>
        <li>Extracts the server-side code into a dedicated API endpoint.</li>
        <li>Replaces the client-side import with a lightweight fetch stub.</li>
        <li>Ensures types are preserved across the boundary.</li>
      </ol>
    </div>
  );
}
