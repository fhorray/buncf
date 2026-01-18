import React, { useState } from 'react';
import { useAction, Link } from 'buncf/router';
import { multiply, registerUser } from '../actions';

export default function RpcDemo() {
  return (
    <div className="p-10 space-y-12 max-w-2xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">RPC & Server Actions</h1>
        <p className="text-gray-400">
          Type-safe server functions. No manual fetching.
        </p>
        <Link href="/" className="text-blue-500 hover:underline">
          ← Back Home
        </Link>
      </div>

      <hr className="border-gray-800" />

      {/* Example 1: Math */}
      <MathSection />

      <hr className="border-gray-800" />

      {/* Example 2: Form */}
      <FormSection />
    </div>
  );
}

function MathSection() {
  const { run, data, loading } = useAction('/api/rpc/multiply', multiply);
  const [valA, setValA] = useState(5);
  const [valB, setValB] = useState(10);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">1. Simple Calculation</h2>
      <div className="flex items-center gap-4">
        <input
          type="number"
          value={valA}
          onChange={(e) => setValA(Number(e.target.value))}
          className="bg-gray-900 border border-gray-700 p-2 rounded w-20 text-center"
        />
        <span className="text-gray-500">×</span>
        <input
          type="number"
          value={valB}
          onChange={(e) => setValB(Number(e.target.value))}
          className="bg-gray-900 border border-gray-700 p-2 rounded w-20 text-center"
        />
        <button
          onClick={() => run({ a: valA, b: valB })}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>
      </div>
      {data && (
        <div className="bg-green-900/20 border border-green-500/30 p-4 rounded text-green-400">
          Result: <strong>{data.result}</strong>
        </div>
      )}
    </section>
  );
}

function FormSection() {
  const { run, data, error, loading, validationErrors } = useAction(
    '/api/rpc/register',
    registerUser,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    await run({
      username: form.get('username') as string,
      email: form.get('email') as string,
    });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">2. Form Validation</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Username</label>
          <input
            name="username"
            className="w-full bg-gray-900 border border-gray-700 p-2 rounded"
            placeholder="try 'admin' to fail"
          />
          {validationErrors.find((e) => e.path.includes('username')) && (
            <p className="text-red-500 text-sm mt-1">
              {
                validationErrors.find((e) => e.path.includes('username'))
                  ?.message
              }
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Email</label>
          <input
            name="email"
            className="w-full bg-gray-900 border border-gray-700 p-2 rounded"
            placeholder="john@example.com"
          />
          {validationErrors.find((e) => e.path.includes('email')) && (
            <p className="text-red-500 text-sm mt-1">
              {validationErrors.find((e) => e.path.includes('email'))?.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Sign Up'}
        </button>

        {error && !validationErrors.length && (
          <div className="bg-red-900/20 border border-red-500/30 p-3 rounded text-red-400 text-sm">
            Server Error: {error.message}
          </div>
        )}

        {data && (
          <div className="bg-green-900/20 border border-green-500/30 p-3 rounded text-green-400 text-sm">
            ✅ {data.message} <br />
            <span className="text-xs opacity-70">ID: {data.id}</span>
          </div>
        )}
      </form>
    </section>
  );
}
