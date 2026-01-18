import React from 'react';
import { useFetcher, Link } from 'buncf/router';

// Loader: Fetches the list
export const loader = async () => {
  const res = await fetch('/api/todos');
  if (!res.ok) throw new Error('Failed to load todos');
  return res.json();
};

export const meta = () => [{ title: 'Todo List - Global Cache Demo' }];

export default function TodosPage({ data: todos }: { data: any[] }) {
  // Main fetcher for creating tasks
  const createFetcher = useFetcher();

  // We can use separate fetchers for independent actions if we want individual loading states,
  // or reuse one. Reusing one might clash if multiple actions happen.
  // For 'Delete', usually we want a fetcher per item OR a global one.
  // Let's use a "DeleteButton" component to isolate fetcher state per item.

  return (
    <div className="max-w-xl mx-auto p-8 font-sans">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">📝 Advanced Cache Demo</h1>
        <Link href="/" className="text-sm text-blue-500 hover:underline">
          ← Back Home
        </Link>
      </div>

      <div className="backdrop-blur rounded-xl border p-6 shadow-sm mb-8">
        <h2 className="text-lg font-semibold mb-4">Add New Task</h2>
        {/* Create Form */}
        <createFetcher.Form
          method="POST"
          action="/api/todos"
          className="flex gap-2"
        >
          <input
            name="text"
            placeholder="What needs doing?"
            required
            autoComplete="off"
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <button
            disabled={createFetcher.isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            {createFetcher.isSubmitting ? 'Adding...' : 'Add'}
          </button>
        </createFetcher.Form>
      </div>

      <div className="space-y-4">
        {/* Loader State (Revalidation Indicator) */}
        {/* If the main router is reloading, we might want to show it. But we don't expose router loading state easily here yet. */}
        {/* However, the list updates automatically. */}

        {todos && todos.length === 0 && (
          <p className="text-center text-gray-400 py-10">
            No tasks yet. Add one above!
          </p>
        )}

        <ul className="space-y-3">
          {todos?.map((todo: any) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </ul>
      </div>
    </div>
  );
}

// Separate component for each Todo Item to have isolated Fetcher state
function TodoItem({ todo }: { todo: any }) {
  const fetcher = useFetcher();
  // If this specific fetcher is submitting (deleting), fade out the item
  const isDeleting = fetcher.isSubmitting;

  return (
    <li
      className={`flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm transition-all duration-300 ${isDeleting ? 'opacity-50 scale-95 bg-red-50' : 'hover:border-blue-300'}`}
    >
      <span className="font-medium text-gray-800">{todo.text}</span>

      <fetcher.Form method="DELETE" action="/api/todos">
        <input type="hidden" name="id" value={todo.id} />
        <button
          className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors"
          title="Delete Task"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <span className="block w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          )}
        </button>
      </fetcher.Form>
    </li>
  );
}
