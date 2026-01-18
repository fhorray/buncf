import React, { useState } from 'react';
import { Link } from 'buncf/router';
// Import the action directly!
// Buncf build system (and dev server) will replace this with an RPC call automatically.
import { createTodoAction } from '../todos.action';

export const meta = () => [{ title: 'Automatic Server Actions Demo' }];

export default function ServerActionsDemo() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      // Direct call to server action!
      const data = await createTodoAction({ text });
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-10 font-sans">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2">
            🚀 Magic Server Actions
          </h1>
          <p className="text-gray-500">
            No more manual API routes. Just import and call.
          </p>
        </div>
        <Link href="/" className="text-blue-500 hover:underline">
          ← Home
        </Link>
      </div>

      <div className="bg-white rounded-3xl border shadow-xl p-8 mb-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 bg-purple-500 text-white text-xs font-bold rounded-bl-xl">
          EXPERIMENTAL
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">
              Action Input
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type something to send to server..."
              className="w-full px-6 py-4 text-black bg-gray-50 rounded-2xl border-2 border-transparent focus:border-purple-500 focus:bg-white outline-none transition-all text-lg font-medium"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-black/10"
          >
            {isLoading ? 'Executing on Server...' : 'Execute Server Action'}
          </button>
        </form>
      </div>

      {result && (
        <div
          className={`rounded-3xl border p-8 animate-in fade-in slide-in-from-top-4 duration-500 ${result.error ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}
        >
          <h3
            className={`text-sm font-bold uppercase tracking-widest mb-4 ${result.error ? 'text-red-500' : 'text-green-600'}`}
          >
            {result.error ? '❌ Execution Failed' : '✅ Server Response'}
          </h3>

          <div className="font-mono text-sm space-y-2 overflow-x-auto">
            {result.error ? (
              <p className="text-red-700 font-bold">{result.error}</p>
            ) : (
              <>
                <div className="flex justify-between border-b border-green-200/50 pb-2">
                  <span className="text-green-800/60 uppercase text-[10px]">
                    Message
                  </span>
                  <span className="text-green-900 font-bold">
                    {result.message}
                  </span>
                </div>
                <div className="flex justify-between border-b border-green-200/50 pb-2">
                  <span className="text-green-800/60 uppercase text-[10px]">
                    Server Time
                  </span>
                  <span className="text-green-900">{result.serverTime}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-green-800/60 uppercase text-[10px]">
                    Environment
                  </span>
                  <span className="text-green-900 italic">
                    Cloudflare Edge / Bun
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mt-20 border-t pt-10 grid grid-cols-2 gap-10 opacity-50">
        <div>
          <h4 className="font-bold text-sm mb-2">How it works?</h4>
          <p className="text-xs leading-relaxed">
            Buncf uses a build-time plugin that detects <code>.action.ts</code>{' '}
            imports. On the client, the function is replaced with a tiny{' '}
            <code>fetch</code> stub. On the server, it's mapped to a registry
            and executed automatically.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-sm mb-2">Zod Validation</h4>
          <p className="text-xs leading-relaxed">
            Every action is wrapped with Zod schemas. If you send invalid data,
            the server rejects it before even reaching your handler.
          </p>
        </div>
      </div>
    </div>
  );
}
